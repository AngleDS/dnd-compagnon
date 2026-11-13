/* ---------- boot ---------- */

/* Global browser preference; deliberately independent of character/import data. */
const VIRTUAL_DICE_KEY="registre-virtual-dice";
const VIRTUAL_ACTIONS=new Set(["wroll", "r20", "dmg", "death", "spendhd", "pool", "ccroll", "hdvirt", "tvroll", "tvdmg", "cast", "sdmg", "smiteRoll", "chargeRecoveryRoll"]);
let virtualDiceFallback=null;
function virtualDiceEnabled(){
  if(virtualDiceFallback!==null) return virtualDiceFallback;
  try{ return localStorage.getItem(VIRTUAL_DICE_KEY)==="1"; }catch(e){ return false; }
}
function applyDicePreference(){ document.documentElement.dataset.virtualDice=virtualDiceEnabled()?"on":"off"; }
function setVirtualDice(enabled){
  try{ localStorage.setItem(VIRTUAL_DICE_KEY,enabled?"1":"0"); virtualDiceFallback=null; }
  catch(e){ virtualDiceFallback=!!enabled; setBanner("Le réglage des dés virtuels ne peut pas être enregistré dans ce navigateur. Il sera conservé pour cette session."); }
  applyDicePreference();
}
window.addEventListener("storage",e=>{ if(e.key===VIRTUAL_DICE_KEY||e.key===null){ applyDicePreference(); render(); renderDice(); } });
applyDicePreference();

/* thème (chantier 20, décision d'Angle) : Sombre, Clair ou Automatique (suit l'appareil), Automatique par défaut ;
   enregistré dans les préférences et dans ce navigateur. Un choix déjà enregistré (sombre ou clair) est gardé. */
const THEMES=["dark","light","auto"];
function themePref(){ const p=S.docs&&S.docs.prefs; if(p&&THEMES.includes(p.theme)) return p.theme; try{ const t=localStorage.getItem("registre-theme"); if(THEMES.includes(t)) return t; }catch(e){} return "auto"; }
const deviceTheme=()=>{ try{ return matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"; }catch(e){ return "dark"; } };
function curTheme(){ const t=themePref(); return t==="auto"?deviceTheme():t; }
try{ matchMedia("(prefers-color-scheme: light)").addEventListener("change",()=>{ if(themePref()==="auto"){ applyTheme(); if(typeof render==="function"&&S.C) render(); } }); }catch(e){}
function applyTheme(){ const t=curTheme(); if(document.documentElement.dataset.theme!==t) document.documentElement.dataset.theme=t; }
function setTheme(t){ if(!S.docs.prefs) S.docs.prefs={type:"prefs"}; S.docs.prefs.theme=t; touch("prefs"); try{ localStorage.setItem("registre-theme",t); }catch(e){} applyTheme(); }
applyTheme();
async function boot(){
  try{ const el=document.getElementById("srd-data"); S.C = JSON.parse(el.textContent); }
  catch(e){ try{ const r = await fetch("content.json"); S.C = await r.json(); }
    catch(e2){ app().innerHTML = `<div class="empty">Le contenu SRD n'a pas pu être chargé. Recharge la page.</div>`; return; } }
  buildIndex();
  try{ S.CAT=JSON.parse(document.getElementById("hb-cat").textContent)||[]; }catch(e){ S.CAT=[]; } S.catIdx=Object.fromEntries(S.CAT.map(e=>[e.id,e]));
  foot().innerHTML = `<details class="footd"><summary>Crédits et licence SRD</summary><p>${esc(S.C.meta.attribution)+" D&D Compagnon est un outil de fans, compatible avec la cinquième édition ; il n'est ni affilié à Wizards of the Coast, ni approuvé par cette société. Le contenu marqué « Perso » est saisi par chaque joueur."}</p></details>`;
  render();
  await PLATFORM.init();
  const user=PLATFORM.user, db=PLATFORM.db;
  afInit();
  if(user){ try{ S.uid = await user.id(); }catch(e){} }
  if(db && S.uid){ S.db=db; S.mode="cloud"; subscribe(); }
  else { S.mode="local"; loadLocal(); render(); }
}
function app(){return document.getElementById("app")}
function foot(){return document.getElementById("foot")}
 
function buildIndex(){
  const C=S.C, I=S.idx;
  for(const k of ["spells","classes","species","backgrounds","feats","weapons","armors","invocations","glossary"]){ I[k]={}; for(const x of C[k]) I[k][x.id]=x; }
  I.items={}; I.itemByName={};
  for(const x of C.items||[]){ I.items[x.id]=x; I.itemByName[norm(x.name)]={ref:"item:"+x.kind+":"+x.id}; }
  for(const x of C.weapons){ I.itemByName[norm(x.name)]={ref:"item:arme:"+x.id}; }
  for(const x of C.armors){ I.itemByName[norm(x.name)]={ref:"item:armure:"+x.id}; }
  I.spellByName={}; for(const s of C.spells) I.spellByName[norm(s.name)]=s;
  I.cond={}; for(const g of C.glossary) if(g.tag==="État") I.cond[g.name]=g;
}
 
/* ---------- storage ---------- */
const DATA_VERSION=1, STORAGE_KEY="registre-docs";
let unsub=null, loadTimer=null;
function col(){ return S.db.collection("data/users/"+S.uid); }
function subscribe(){
  loadTimer=setTimeout(()=>{ if(S.mode==="cloud" && !S.loaded){ setBanner("Tes données ne répondent pas encore. Elles s'afficheront dès que la connexion revient."); } },10000);
  unsub = col().onSnapshot(snap=>{
    if(!snap.metadata.fromCache){ clearTimeout(loadTimer); S.loaded=true; setBanner(""); }
    for(const ch of snap.docChanges()){
      const id=ch.doc.id;
      if(ch.type==="removed"){ if(!S.dirty[id]) delete S.docs[id]; continue; }
      if(S.dirty[id]||inflight[id]) continue;
      S.docs[id]=clone(ch.doc.data());
    }
    S.loaded = S.loaded || snap.docs.length>0;
    softRender();
  }, err=>{ clearTimeout(loadTimer); setBanner("La sauvegarde en ligne est indisponible pour cette visite. Tes modifications restent sur cet appareil."); S.mode="local"; loadLocal(); render(); });
}
function loadLocal(){
  let stored=false, storageOk=true;
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw!==null){ stored=true; S.docs=readLocalData(raw); }
  }catch(e){ storageOk=false; storageFailure(e,"lecture"); }
  let seed=null; try{ seed=JSON.parse(document.getElementById("seed-docs").textContent); }catch(e){}
  // Les données embarquées initialisent seulement un navigateur vierge. Une nouvelle version du fichier
  // ne remplace jamais des personnages déjà présents, même si l'horodatage du seed a changé.
  if(storageOk&&!stored&&seed&&seed.docs&&seed.at){
    const sv=+(seed.dataVersion||1); if(sv<=DATA_VERSION){ S.docs=clone(seed.docs); storageOk=saveLocal(); }
    else { storageOk=false; setBanner(`Cette application contient des données d'une version plus récente (${sv}) et ne peut pas les ouvrir sans mise à jour.`); }
  }
  if(storageOk) setBanner("Mode local : tes personnages sont gardés dans ce navigateur. Pour les emporter avec le fichier, utilise « Télécharger ma copie personnelle » dans le Menu.","local");
}
function readLocalData(raw){
  const data=JSON.parse(raw);
  if(!data||typeof data!=="object"||Array.isArray(data)) throw new Error("format");
  // Ancien format : registre-docs contenait directement le dictionnaire des documents.
  if(!Object.prototype.hasOwnProperty.call(data,"docs")) return data;
  const v=+(data.dataVersion||1);
  if(v>DATA_VERSION){ const e=new Error("future_version"); e.dataVersion=v; throw e; }
  if(!data.docs||typeof data.docs!=="object"||Array.isArray(data.docs)) throw new Error("format");
  return data.docs;
}
function storageFailure(e,action){
  const full=e&&(e.name==="QuotaExceededError"||e.code===22);
  const detail=full?"Le stockage de ce navigateur est plein.":"Le navigateur a refusé l'accès au stockage local.";
  const newer=e&&e.message==="future_version"?`Ces données utilisent le format ${e.dataVersion}, plus récent que celui accepté par cette application.`:detail;
  setBanner(`Échec de ${action} de la sauvegarde. ${newer} Exporte immédiatement ton personnage et ne ferme pas l'application.`);
}
function saveLocal(){
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify({registre:1,dataVersion:DATA_VERSION,docs:S.docs}));
    S.saveError=false; return true;
  }catch(e){ S.saveError=true; storageFailure(e,"l'écriture"); return false; }
}
const timers={}, inflight={};
function touch(id){
  const d=S.docs[id]; if(!d) return; d.updatedAt=Date.now(); S.dirty[id]=true;
  clearTimeout(timers[id]); timers[id]=setTimeout(()=>flush(id),700);
}
async function flush(id){
  if(S.mode!=="cloud"){ if(saveLocal()) delete S.dirty[id]; return; }
  if(inflight[id]){ timers[id]=setTimeout(()=>flush(id),400); return; }
  const d=S.docs[id]; inflight[id]=true; delete S.dirty[id];
  try{ if(d) await col().doc(id).set(clone(d)); else await col().doc(id).delete(); }
  catch(e){
    if(e&&e.code==="unavailable"){ await new Promise(r=>setTimeout(r,800+Math.random()*800)); try{ if(d) await col().doc(id).set(clone(d)); }catch(_){} }
    else if(e&&e.code==="quota_exceeded"){ setBanner("Le registre est plein : supprime des personnages ou des éléments inutilisés de « Mes contenus » pour continuer."); }
    else if(e&&e.code==="invalid_argument"){ setBanner("Tu n'as pas le droit d'écrire ici. Demande au propriétaire de t'inviter en tant que Contributeur."); }
  } finally { delete inflight[id]; }
}
function removeDoc(id){ delete S.docs[id]; clearTimeout(timers[id]); flush(id); }
function flushLocalNow(){
  if(S.mode==="cloud"||!Object.keys(S.dirty).length) return true;
  for(const id of Object.keys(timers)) clearTimeout(timers[id]);
  if(!saveLocal()) return false;
  S.dirty={}; return true;
}
// pagehide fonctionne aussi dans Safari/iOS. visibilitychange couvre la mise en arrière-plan
// sans attendre une fermeture définitive de la page.
window.addEventListener("pagehide",flushLocalNow);
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden") flushLocalNow(); });
// Bandeau d'information : une croix le ferme ; avec une clé, la fermeture est retenue dans ce navigateur.
function setBanner(t,key){ const el=document.getElementById("banner"); if(!el) return;
  if(t&&key){ try{ if(localStorage.getItem("registre-banner-"+key)==="1") t=""; }catch(e){} }
  el.innerHTML = t?`<div class="banner"><span>${esc(t)}</span><button class="bannerx" data-act="bannerClose" data-k="${esc(key||"")}" aria-label="Fermer ce message" title="Fermer ce message">×</button></div>`:""; }
 
/* ---------- content access ---------- */
const persos = () => Object.entries(S.docs).filter(([k,v])=>v&&v.type==="perso").map(([k,v])=>Object.assign({_id:k},v)).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
const hbs = kind => Object.entries(S.docs).filter(([k,v])=>v&&v.type==="hb"&&(!kind||v.kind===kind)).map(([k,v])=>Object.assign({_id:k},v)).sort((a,b)=>a.name.localeCompare(b.name,"fr"));
