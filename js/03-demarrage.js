/* ---------- boot ---------- */

/* Global browser preference; deliberately independent of character/import data. */
const VIRTUAL_DICE_KEY="registre-virtual-dice";
const VIRTUAL_DICE_DISPLAY_KEY="registre-virtual-dice-display";
const VIRTUAL_ACTIONS=new Set(["wroll", "r20", "dmg", "death", "spendhd", "pool", "ccroll", "hdvirt", "tvroll", "tvdmg", "cast", "sdmg", "smiteRoll", "chargeRecoveryRoll", "studioRoll"]);
let virtualDiceFallback=null;
let diceDisplayFallback=null;
function diceDisplayMode(){ if(diceDisplayFallback!==null) return diceDisplayFallback; try{ return localStorage.getItem(VIRTUAL_DICE_DISPLAY_KEY)==="3d"?"3d":"direct"; }catch(e){ return "direct"; } }
function setDiceDisplayMode(mode){ const value=mode==="3d"?"3d":"direct"; try{ localStorage.setItem(VIRTUAL_DICE_DISPLAY_KEY,value); diceDisplayFallback=null; }catch(e){ diceDisplayFallback=value; setBanner("Le mode d’affichage des dés sera conservé pour cette session seulement."); } }
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
/* Chantier 24, lot 1 (18 nov. 2026) : plus aucune perte silencieuse.
   - S.base[id] : date (updatedAt) de la version de la fiche que cet onglet a lue ou écrite en dernier.
   - Une version plus récente trouvée ailleurs (autre onglet, autre appareil) n'est jamais écrasée : la plus récente
     garde son nom, l'autre est rangée dans la liste sous « <nom> (copie du …) » (resolveConflict).
   - Local : seules les fiches modifiées ici sont écrites, par-dessus ce qui est stocké, relu juste avant ;
     un autre onglet est prévenu par l'événement « storage » et reprend les fiches qu'il n'a pas modifiées.
   - En ligne : la fiche est relue juste avant d'être écrite ; un échec la garde « à enregistrer », réessaie,
     et une copie d'attente reste sur l'appareil (PEND_KEY), renvoyée à l'ouverture suivante (pendReplay). */
const DATA_VERSION=1, STORAGE_KEY="registre-docs", PEND_KEY="registre-attente";
let unsub=null, loadTimer=null;
S.base={}; S.remote={}; S.pend={};
function col(){ return S.db.collection("data/users/"+S.uid); }
const docAt=d=>(d&&+d.updatedAt)||0;
// Comparaison indépendante de l'ordre des clés et de la date d'enregistrement.
function stableStr(v){
  if(Array.isArray(v)) return "["+v.map(stableStr).join(",")+"]";
  if(v&&typeof v==="object") return "{"+Object.keys(v).filter(k=>k!=="updatedAt"&&v[k]!==undefined).sort().map(k=>JSON.stringify(k)+":"+stableStr(v[k])).join(",")+"}";
  return JSON.stringify(v===undefined?null:v);
}
const sameDoc=(a,b)=>(!a||!b)?a===b:stableStr(a)===stableStr(b);
function conflictName(d){
  const t=new Date(docAt(d)||Date.now()), p=n=>String(n).padStart(2,"0");
  return `${String(d.name||"Sans nom").slice(0,150)} (copie du ${p(t.getDate())}/${p(t.getMonth()+1)} à ${t.getHours()} h ${p(t.getMinutes())})`;
}
// mine : version de cet onglet (absente si supprimée ici) ; theirs : version plus récente trouvée ailleurs.
// Rien n'est perdu : la plus récente garde l'identifiant, l'autre devient une fiche à part. Renvoie l'identifiant de la copie.
function resolveConflict(id,mine,theirs,notes){
  if(!theirs) return null;
  if(!mine){ S.docs[id]=clone(theirs); notes.push({orig:theirs.name||"Sans nom",copy:null}); return null; } // supprimée ici, modifiée ailleurs : gardée
  if(sameDoc(mine,theirs)||!["perso","hb"].includes(mine.type)) return null; // préférences : celles de cet onglet
  const mineWins=docAt(mine)>=docAt(theirs), keep=mineWins?mine:clone(theirs), lose=mineWins?theirs:mine;
  const copy=clone(lose); copy.name=conflictName(lose);
  const nid=(lose.type==="hb"?"hb_":"perso_")+uid();
  S.docs[id]=keep; S.docs[nid]=copy; notes.push({orig:keep.name||"Sans nom",copy:copy.name});
  return nid;
}
function conflictNotice(notes){
  if(!notes.length) return;
  const n=notes[0];
  setBanner(notes.length>1?`${notes.length} fiches ont aussi été modifiées ailleurs (autre onglet ou autre appareil). Rien n'est perdu : les versions les plus récentes gardent leur nom, les autres sont rangées dans ta liste avec la mention « (copie du …) ». Supprime celles qui ne servent plus.`
    :n.copy?`« ${n.orig} » a aussi été modifié ailleurs (autre onglet ou autre appareil). Rien n'est perdu : la version la plus récente garde son nom, l'autre est rangée dans ta liste sous « ${n.copy} ». Supprime celle qui ne sert plus.`
    :`« ${n.orig} » a été modifié ailleurs (autre onglet ou autre appareil) pendant sa suppression : la fiche est gardée.`);
}
function subscribe(){
  loadTimer=setTimeout(()=>{ if(S.mode==="cloud" && !S.loaded){ setBanner("Tes données ne répondent pas encore. Elles s'afficheront dès que la connexion revient."); } },10000);
  unsub = col().onSnapshot(snap=>{
    const was=S.loaded;
    if(!snap.metadata.fromCache){ clearTimeout(loadTimer); S.loaded=true; if(!S.saveError) setBanner(""); }
    for(const ch of snap.docChanges()){
      const id=ch.doc.id;
      if(ch.type==="removed"){ if(!S.dirty[id]&&!inflight[id]){ delete S.docs[id]; delete S.base[id]; } continue; }
      const data=ch.doc.data();
      if(S.dirty[id]||inflight[id]){ S.remote[id]=data; continue; } // comparée au moment d'écrire
      S.docs[id]=clone(data); S.base[id]=docAt(data); delete S.remote[id];
    }
    S.loaded = S.loaded || snap.docs.length>0;
    if(!was&&S.loaded&&!snap.metadata.fromCache) pendReplay();
    softRender();
  }, err=>{ clearTimeout(loadTimer); setBanner("La sauvegarde en ligne est indisponible pour cette visite. Tes modifications restent sur cet appareil et seront envoyées à ta prochaine visite."); S.cloudFallback=true; S.mode="local"; loadLocal(); render(); });
}
function loadLocal(){
  let stored=false, storageOk=true;
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw!==null){ stored=true; S.docs=readLocalData(raw); S.base={}; for(const [id,d] of Object.entries(S.docs)) S.base[id]=docAt(d); }
  }catch(e){ storageOk=false; storageFailure(e,"lecture"); }
  let seed=null; try{ seed=JSON.parse(document.getElementById("seed-docs").textContent); }catch(e){}
  // Les données embarquées initialisent seulement un navigateur vierge. Une nouvelle version du fichier
  // ne remplace jamais des personnages déjà présents, même si l'horodatage du seed a changé.
  if(storageOk&&!stored&&seed&&seed.docs&&seed.at){
    const sv=+(seed.dataVersion||1); if(sv<=DATA_VERSION){ S.docs=clone(seed.docs); for(const id of Object.keys(S.docs)) S.dirty[id]=true; storageOk=saveLocal(); }
    else { storageOk=false; setBanner(`Cette application contient des données d'une version plus récente (${sv}) et ne peut pas les ouvrir sans mise à jour.`); }
  }
  if(storageOk&&!S.cloudFallback){
    askPersist();
    if(iosTab()&&!bannerClosed("ios-safari")) setBanner("Sur iPhone et iPad, Safari peut effacer tes personnages si tu ne reviens pas pendant quelques jours. Pour les garder : exporte-les (bouton « Exporter » de la liste), puis touche Partager → « Sur l'écran d'accueil » et ouvre toujours l'appli depuis cette icône. S'ils n'y apparaissent pas, importe-les.","ios-safari");
    else setBanner("Mode local : tes personnages sont gardés dans ce navigateur. Pour les emporter avec le fichier, utilise « Télécharger ma copie personnelle » dans le Menu.","local");
  }
}
// Demande au navigateur de ne pas effacer les données de l'appli quand l'appareil manque de place.
function askPersist(){ try{ const st=navigator.storage; if(st&&typeof st.persist==="function") Promise.resolve(typeof st.persisted==="function"?st.persisted():false).then(p=>p||st.persist()).catch(()=>{}); }catch(e){} }
// Safari d'iPhone ou d'iPad, page ouverte dans un onglet (pas depuis l'icône de l'écran d'accueil).
function iosTab(){
  try{
    const ua=navigator.userAgent||"", ios=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
    const standalone=navigator.standalone===true||matchMedia("(display-mode: standalone)").matches;
    return ios&&!standalone&&/^https?:$/.test(location.protocol);
  }catch(e){ return false; }
}
function bannerClosed(k){ try{ return localStorage.getItem("registre-banner-"+k)==="1"; }catch(e){ return false; } }
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
// Fiches stockées modifiées par un autre onglet : reprises ici, sauf celles que cet onglet est en train de modifier.
function mergeStored(st){
  let changed=false;
  for(const [id,d] of Object.entries(st)){
    if(S.dirty[id]) continue;
    if(!S.docs[id]||docAt(d)>(S.base[id]||0)){ if(!S.docs[id]||!sameDoc(S.docs[id],d)) changed=true; S.docs[id]=clone(d); S.base[id]=docAt(d); }
  }
  for(const id of Object.keys(S.docs)) if(!(id in st)&&(id in S.base)&&!S.dirty[id]){ delete S.docs[id]; delete S.base[id]; changed=true; } // supprimée ailleurs
  return changed;
}
function saveLocal(){
  const notes=[];
  try{
    let stored={};
    try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw!==null) stored=readLocalData(raw); }
    catch(e){ if(e&&e.message==="future_version") throw e; stored={}; } // illisible : réécrit comme avant
    for(const id of Object.keys(S.docs)) if(!(id in S.base)&&!(id in stored)) S.dirty[id]=true; // jamais écrite (création directe)
    const out=Object.assign({},stored), ids=Object.keys(S.dirty);
    for(const id of ids){
      const theirs=stored[id];
      if(theirs&&docAt(theirs)>(S.base[id]||0)){ const nid=resolveConflict(id,S.docs[id],theirs,notes); if(nid) out[nid]=S.docs[nid]; }
      if(S.docs[id]) out[id]=S.docs[id]; else delete out[id];
    }
    localStorage.setItem(STORAGE_KEY,JSON.stringify({registre:1,dataVersion:DATA_VERSION,docs:out}));
    for(const id of Object.keys(out)) if(S.dirty[id]||!(id in S.base)) S.base[id]=docAt(out[id]);
    for(const id of ids) if(!out[id]) delete S.base[id];
    S.dirty={}; S.saveError=false;
    const changed=mergeStored(out);
    conflictNotice(notes);
    if((changed||notes.length)&&S.C&&S.mode!=="loading") softRender();
    return true;
  }catch(e){ S.saveError=true; storageFailure(e,"l'écriture"); return false; }
}
window.addEventListener("storage",e=>{
  if(e.key!==STORAGE_KEY||S.mode!=="local") return;
  let st; try{ st=readLocalData(localStorage.getItem(STORAGE_KEY)||"{}"); }catch(_){ return; }
  if(mergeStored(st)) softRender();
});
const timers={}, inflight={}, retry={};
// Fiches pas encore confirmées en ligne (S.pend[id] = date de la version en ligne d'où l'on part).
function markPend(id){ if((S.mode==="cloud"||S.cloudFallback)&&!(id in S.pend)) S.pend[id]=S.base[id]||0; }
function touch(id){
  const d=S.docs[id]; if(!d) return; d.updatedAt=Date.now(); S.dirty[id]=true; markPend(id);
  clearTimeout(timers[id]); timers[id]=setTimeout(()=>flush(id),700);
}
// Copie d'attente sur l'appareil : ce qui n'est pas encore confirmé en ligne, renvoyé à l'ouverture suivante.
function pendSave(){
  if(!S.uid) return false;
  try{
    const ids=Object.keys(S.pend);
    if(!ids.length){ const j=JSON.parse(localStorage.getItem(PEND_KEY)||"null"); if(j&&j.uid===S.uid) localStorage.removeItem(PEND_KEY); return true; }
    const docs={}; for(const id of ids) docs[id]={d:S.docs[id]||null,b:S.pend[id]||0};
    localStorage.setItem(PEND_KEY,JSON.stringify({v:1,uid:S.uid,at:Date.now(),docs}));
    return true;
  }catch(e){ return false; }
}
function pendReplay(){
  if(S.pendReplayed) return; S.pendReplayed=true;
  let j=null; try{ j=JSON.parse(localStorage.getItem(PEND_KEY)||"null"); }catch(e){}
  if(!j||j.v!==1||j.uid!==S.uid||!j.docs||typeof j.docs!=="object") return;
  const notes=[];
  for(const [id,e] of Object.entries(j.docs)){
    if(!/^[\w-]{1,140}$/.test(id)||!e||typeof e!=="object") continue;
    const d=e.d&&typeof e.d==="object"&&!Array.isArray(e.d)?e.d:null, remote=S.docs[id];
    if(sameDoc(d,remote)) continue;
    if(remote&&docAt(remote)>(+e.b||0)){ const nid=resolveConflict(id,d,remote,notes); if(nid){ S.dirty[nid]=true; markPend(nid); } if(!d) continue; }
    else if(d) S.docs[id]=clone(d); else delete S.docs[id];
    S.dirty[id]=true; markPend(id);
  }
  for(const id of Object.keys(S.dirty)) flush(id);
  pendSave(); conflictNotice(notes);
}
function cloudErrorText(e,kept){
  const c=e&&e.code, k=kept?"Tes dernières modifications sont gardées sur cet appareil et l'appli réessaie toute seule.":"L'appli réessaie toute seule : garde-la ouverte et exporte ton personnage par sécurité.";
  if(c==="quota_exceeded") return "Le registre en ligne est plein : supprime des personnages ou des éléments inutilisés de « Mes contenus ». "+k;
  if(c==="invalid_argument"||c==="permission_denied") return "L'enregistrement en ligne a été refusé (droits insuffisants ou fiche trop lourde, par exemple un très grand portrait). "+k;
  return "Pas encore enregistré en ligne (connexion ou service indisponible). "+k;
}
async function flush(id,fast){
  if(S.mode!=="cloud"){ saveLocal(); if(S.cloudFallback) pendSave(); return; }
  if(inflight[id]){ clearTimeout(timers[id]); timers[id]=setTimeout(()=>flush(id),400); return; }
  if(!S.dirty[id]) return;
  inflight[id]=true; delete S.dirty[id]; pendSave();
  const notes=[]; let nid=null;
  try{
    let remote=S.remote[id];
    if(!fast){ try{ const g=await col().doc(id).get(); if(g&&typeof g.data==="function") remote=g.exists?g.data():null; }catch(e){} }
    if(remote&&docAt(remote)>(S.base[id]||0)){ nid=resolveConflict(id,S.docs[id],remote,notes); if(nid){ S.dirty[nid]=true; markPend(nid); } }
    const d=S.docs[id];
    if(d) await col().doc(id).set(clone(d)); else await col().doc(id).delete();
    if(d) S.base[id]=docAt(d); else delete S.base[id];
    delete S.remote[id]; delete retry[id];
    if(!S.dirty[id]) delete S.pend[id];
    pendSave();
    if(S.saveError&&!Object.keys(retry).length){ S.saveError=false; setBanner(""); }
    conflictNotice(notes);
    if(nid){ flush(nid); softRender(); }
  }catch(e){
    S.dirty[id]=true; S.saveError=true;
    const n=retry[id]=(retry[id]||0)+1;
    clearTimeout(timers[id]); timers[id]=setTimeout(()=>flush(id),Math.min(60000,1000*2**(n-1)));
    setBanner(cloudErrorText(e,pendSave()));
  } finally { delete inflight[id]; }
}
function removeDoc(id){ markPend(id); delete S.docs[id]; clearTimeout(timers[id]); S.dirty[id]=true; flush(id); }
function flushLocalNow(){
  if(S.mode==="cloud"){ // envoi immédiat, sans relecture : la page se ferme peut-être
    for(const id of Object.keys(S.dirty)){ clearTimeout(timers[id]); flush(id,true); }
    pendSave(); return true;
  }
  if(!Object.keys(S.dirty).length) return true;
  for(const id of Object.keys(timers)) clearTimeout(timers[id]);
  if(!saveLocal()) return false;
  if(S.cloudFallback) pendSave();
  return true;
}
// Retour au premier plan (iPad sorti de veille…) : la fiche ouverte est relue en ligne avant toute modification.
async function refreshCur(){
  const id=S.cur; if(!id||S.dirty[id]||inflight[id]) return;
  try{
    const g=await col().doc(id).get(); if(!g||typeof g.data!=="function"||!g.exists) return;
    const d=g.data(); if(S.dirty[id]||inflight[id]){ S.remote[id]=d; return; }
    if(docAt(d)>(S.base[id]||0)){ S.docs[id]=clone(d); S.base[id]=docAt(d); softRender(); }
  }catch(e){}
}
// pagehide fonctionne aussi dans Safari/iOS. visibilitychange couvre la mise en arrière-plan
// sans attendre une fermeture définitive de la page.
window.addEventListener("pagehide",flushLocalNow);
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden") flushLocalNow(); else if(S.mode==="cloud"&&S.loaded) refreshCur(); });
window.addEventListener("online",()=>{ if(S.mode!=="cloud") return; for(const id of Object.keys(S.dirty)){ clearTimeout(timers[id]); flush(id); } });
// Bandeau d'information : une croix le ferme ; avec une clé, la fermeture est retenue dans ce navigateur.
function setBanner(t,key){ const el=document.getElementById("banner"); if(!el) return;
  if(t&&key){ try{ if(localStorage.getItem("registre-banner-"+key)==="1") t=""; }catch(e){} }
  el.innerHTML = t?`<div class="banner"><span>${esc(t)}</span><button class="bannerx" data-act="bannerClose" data-k="${esc(key||"")}" aria-label="Fermer ce message" title="Fermer ce message">×</button></div>`:""; }
 
/* ---------- content access ---------- */
const persos = () => Object.entries(S.docs).filter(([k,v])=>v&&v.type==="perso").map(([k,v])=>Object.assign({_id:k},v)).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
const hbs = kind => Object.entries(S.docs).filter(([k,v])=>v&&v.type==="hb"&&(!kind||v.kind===kind)).map(([k,v])=>Object.assign({_id:k},v)).sort((a,b)=>a.name.localeCompare(b.name,"fr"));
