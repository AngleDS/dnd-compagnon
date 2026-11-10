/* ---------- catalogue hors SRD : noms, livres et liens seulement ; la fiche est remplie après le choix ---------- */
const hbTag=h=>h&&h.pending?" (hors SRD · à remplir)":" (hors SRD)";
function catAll(){ return S.CAT||[]; }
function catGet(id){ return (S.catIdx||{})[id]||null; }
function catHb(e){ const n=norm(e.n), alt=e.alt?norm(e.alt):""; return hbs(e.k).find(h=>h.catId===e.id||norm(h.name)===n||(alt&&norm(h.name)===alt))||null; }
function catShort(b){ return String(b||"").replace(/\s*\(VO\)$/,"").replace(/^Manuel des joueurs \(2024\)$/,"Manuel des joueurs"); }
function catLabel(e){ return e.n+" · "+catShort(e.b)+" (hors SRD · à remplir)"; }
function catOpts(k,f){ return catAll().filter(e=>e.k===k&&(!f||f(e))&&!catHb(e)).map(e=>["cat:"+e.id,catLabel(e)]); }
function catClassOk(e,cls){ if(!cls) return false; return e.c===cls.id||norm(e.c)===norm(cls.name)||(e.c==="artificier"&&/artifici/.test(norm(cls.name))); }
function catMat(id){ const e=catGet(id); if(!e) return ""; const ex=catHb(e); if(ex) return "hb:"+ex._id;
  const hid="hb_"+uid(), d={type:"hb",kind:e.k,name:e.n,label:e.b,link:e.u,text:"",effects:[],catId:e.id,pending:true,updatedAt:Date.now()};
  if(e.k==="sous-classe"){ d.features=[]; if(S.C.classes.some(c=>c.id===e.c)) d.classId=e.c; else { const hc=hbs("classe").find(h=>catClassOk(e,{id:"hb:"+h._id,name:h.name})); if(hc) d.classId="hb:"+hc._id; } }
  if(e.k==="classe"){ d.features=[]; d.hitDie=8; d.castType=""; }
  if(e.k==="historique"){ if(e.ab) d.abilities=e.ab.slice(); d.effects=(e.sk||[]).map(k=>({t:"maitrise",cible:"comp:"+k,niveau:1})); d.tools=e.tools||""; if(e.feat) d.feat=e.feat; if(e.featRef) d.featRef=e.featRef; }
  if(e.k==="espece") d.speed=9;
  if(e.k==="don"){ d.category=e.cat; if(e.pre) d.prerequisite=e.pre; if(e.rep) d.repeatable=true; }
  if(e.k==="sort"){ d.level=e.lv; d.school=e.ec||""; d.classes=(e.cl||[]).slice(); d.casting_time=e.ct||""; d.concentration=!!e.conc; d.ritual=!!e.rit; d.mech={}; }
  S.docs[hid]=d; touch(hid); if(S.W) (S.W.catMade=S.W.catMade||[]).push(hid); return "hb:"+hid; }
function catRes(v){ return typeof v==="string"&&v.startsWith("cat:")?(catMat(v.slice(4))||""):v; }
function hbUsed(id){ const k='"hb:'+id+'"'; return Object.values(S.docs).some(d=>d&&(d.type==="perso"||(d.type==="hb"&&d!==S.docs[id]))&&JSON.stringify(d).includes(k)); }
function catPendingFor(ch){ if(!ch) return []; const s=JSON.stringify(ch); const l=hbs().filter(h=>h.pending&&!h.pendingSkip&&s.includes('"hb:'+h._id+'"'));
  for(const h of l.slice()) if(h.featRef&&h.featRef.startsWith("hb:")){ const f=hb(h.featRef); if(f&&f.pending&&!f.pendingSkip&&!l.some(x=>x._id===f._id)) l.push(f); } return l; }
function rvStart(chId){ const l=catPendingFor(S.docs[chId]); if(!l.length) return false; S.rv={ch:chId,items:l.map(h=>({id:h._id,state:"wait"})),run:false}; renderModal(); return true; }
async function rvFill(id,R){ const d=S.docs[id]; if(!d) return {state:"err",msg:"Fiche introuvable."};
  const T={mode:"hb",id}, kind=d.kind, name=d.name, ok=()=>S.af&&S.af.state==="ok", fatal=m=>/autorisé cette page à utiliser Claude|Limite d'usage|pas disponible pour ce compte/.test(m||"");
  const take=()=>{ const A=S.af; S.af=null; return {state:"ok",res:{data:A.data,url:A.url,links:A.links,memory:!!A.memory,web:!!A.web,kind:A.kind||kind}}; };
  const stop=()=>{ S.af=null; return {state:"wait"}; };
  try{
    if(AF.web&&/aidedd\.org/.test(d.link||"")){ await afRun(T); if(R.stop) return stop(); if(ok()) return take(); if(S.af&&fatal(S.af.msg)) return {state:"err",msg:S.af.msg,fatal:true}; }
    if(AF.web){ await afWeb(T,kind,name); if(R.stop) return stop(); if(ok()) return take(); if(S.af&&fatal(S.af.msg)) return {state:"err",msg:S.af.msg,fatal:true}; }
    await afMem(T,kind,name); if(R.stop) return stop(); if(ok()) return take();
    const m=S.af&&S.af.msg; S.af=null; return {state:"err",msg:m||"Remplissage impossible.",fatal:fatal(m)};
  }catch(e){ S.af=null; return {state:"err",msg:"Erreur ("+((e&&e.code)||"inconnue")+")."}; } }
async function rvRun(){ const R=S.rv; if(!R||R.run) return; R.run=true; R.stop=false; renderModal();
  for(const it of R.items){ if(S.rv!==R||R.stop) break; if(it.state!=="wait"&&it.state!=="err") continue;
    it.state="run"; it.msg=""; renderModal(); const r=await rvFill(it.id,R); if(S.rv!==R) return; Object.assign(it,r); renderModal(); if(r.fatal){ R.stop=true; break; } }
  R.run=false; S.af=null; renderModal(); }
function rvApply(it){ const d=S.docs[it.id]; if(!d||!it.res) return; const r=it.res, p=afPatch(r.kind||d.kind,r.data,r.url);
  if(r.links) p.links=r.links.map(l=>({url:l.url,title:String(l.title||"")}));
  if(d.kind==="historique"){ if(!(p.effects||[]).length) delete p.effects; if(!p.abilities) delete p.abilities; if(!p.tools) delete p.tools; }
  if(d.link){ if(p.link&&p.link!==d.link&&!(p.links||[]).some(l=>l.url===p.link)) p.links=[{url:p.link,title:hostOf(p.link)},...(p.links||[])]; p.link=d.link; }
  Object.assign(d,p); delete d.pending; delete d.pendingSkip; d.updatedAt=Date.now(); touch(it.id); it.state="done"; }
function rvModal(){ const R=S.rv, n=R.items.length, ready=R.items.filter(i=>i.state==="ok").length, waiting=R.items.filter(i=>i.state==="wait"||i.state==="err").length;
  const rows=R.items.map(it=>{ const d=S.docs[it.id]||{}, A=it.res;
    const st={wait:"En attente",run:"En cours"+(S.af&&S.af.msg?" : "+S.af.msg:"…"),ok:A&&A.memory?"Prêt à valider · rempli de mémoire, à vérifier":"Prêt à valider",err:"Échec : "+(it.msg||""),done:"Validé",skip:"Laissé à remplir"}[it.state]||"";
    const src=A?(A.links&&A.links.length?A.links.map(l=>`<a class="aidelink" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(hostOf(l.url))} ↗</a>`).join(" · "):(A.url?`<a class="aidelink" href="${esc(A.url)}" target="_blank" rel="noopener noreferrer">${esc(hostOf(A.url))} ↗</a>`:"")):"";
    return `<div class="rvrow ${it.state}"><div class="row" style="justify-content:space-between;gap:8px"><div><b>${esc(d.name||"?")}</b> <span class="muted" style="font-size:var(--fs-sm)">${esc(HB_KINDS[d.kind]||"")} · ${esc(catShort(d.label))}</span></div><span class="rvst">${esc(st)}</span></div>
      ${it.state==="ok"&&A?`<details class="tdesc" open><summary>Résumé proposé</summary><div class="prose">${prose(A.data.summary)}</div>${src?`<div style="font-size:var(--fs-sm)"><span class="label">Sources</span> ${src}</div>`:""}</details>
      <div class="row" style="justify-content:flex-end;gap:6px"><button class="btn small ghost" data-act="rvSkip" data-id="${it.id}">Laisser à remplir</button><button class="btn small primary" data-act="rvOk" data-id="${it.id}">Valider</button></div>`:""}</div>`; }).join("");
  const foot=!AF.ready?`<div class="muted" style="font-size:var(--fs-sm)">Le remplissage automatique demande Claude (page ouverte dans claude.ai, compte Claude). Les éléments gardent leur lien : tu pourras les remplir plus tard dans Contenu perso.</div><div class="row" style="justify-content:flex-end"><button class="btn primary" data-act="rvClose">Fermer</button></div>`
    :R.run?`<div class="row" style="justify-content:flex-end"><button class="btn" data-act="rvStop">Arrêter</button></div>`
    :`<div class="row" style="justify-content:flex-end;gap:6px;flex-wrap:wrap">${ready?`<button class="btn" data-act="rvAll">Tout valider (${ready})</button>`:""}<button class="btn ${waiting?"ghost":"primary"}" data-act="rvClose">${waiting&&!ready&&!R.items.some(i=>i.state==="done")?"Plus tard":"Terminer"}</button>${waiting?`<button class="btn primary" data-act="rvGo">${R.items.some(i=>i.state==="err")&&!R.items.some(i=>i.state==="wait")?"Réessayer":"Remplir "+(waiting>1?"les "+waiting+" éléments":"l'élément")}</button>`:""}</div>`;
  return `<div class="picker" data-act="noop"><div class="box" role="dialog" aria-label="Contenu hors SRD à remplir" style="grid-template-rows:auto auto 1fr auto;max-width:680px">
    <h2>Contenu hors SRD à remplir</h2>
    <div class="muted" style="font-size:var(--fs-sm)">${n>1?n+" éléments choisis viennent":"Un élément choisi vient"} de livres hors SRD. Claude remplit chaque fiche : AideDD ou recherche web dans l'app Claude sur ordinateur, sinon de mémoire (à vérifier). Rien n'est enregistré avant ta validation.</div>
    <div class="stack" style="overflow-y:auto;min-height:0">${rows}</div>${foot}</div></div>`; }
function catPickList(){ const P=S.catPick, q=norm(P.q||""); const l=catAll().filter(e=>(!P.k||e.k===P.k)&&(!q||norm(e.n+" "+(e.vo||"")+" "+(e.alt||"")+" "+e.b).includes(q)));
  return l.slice(0,80).map(e=>{ const h=catHb(e); return `<div class="pick-row"><div><b>${esc(e.n)}</b>${e.vo&&e.vo!==e.n?` <span class="muted" style="font-size:var(--fs-sm)">(${esc(e.vo)})</span>`:""}<div class="muted" style="font-size:var(--fs-sm)">${esc(HB_KINDS[e.k])}${e.k==="sort"?" niv. "+e.lv:""}${e.cat?" · "+esc(e.cat):""} · ${esc(catShort(e.b))}</div></div>${h?`<button class="btn small" data-act="catOpen" data-id="${h._id}">Ouvrir</button>`:`<button class="btn small primary" data-act="catAdd" data-id="${e.id}">Ajouter</button>`}</div>`; }).join("")+(l.length>80?`<div class="muted" style="padding:8px 0">${l.length-80} autres : précise la recherche.</div>`:"")+(!l.length?`<div class="muted" style="padding:8px 0">Rien trouvé.</div>`:""); }
function catPickModal(){ const P=S.catPick; return `<div class="picker" data-act="catClose"><div class="box" role="dialog" aria-label="Catalogue hors SRD" data-act="noop">
  <div class="row" style="justify-content:space-between"><h2>Catalogue hors SRD</h2><button class="btn small ghost" data-act="catClose">Fermer</button></div>
  <div class="row"><input type="text" id="catq" placeholder="Nom (français ou VO), livre…" value="${esc(P.q||"")}" style="flex:1"><select id="catk"><option value="">Tous les types</option>${["classe","sous-classe","historique","espece","don","sort"].map(k=>`<option value="${k}" ${P.k===k?"selected":""}>${HB_KINDS[k]}</option>`).join("")}</select></div>
  <div class="res-list" id="catlist">${catPickList()}</div>
  <div class="muted" style="font-size:var(--fs-sm)">Règles 2024 hors SRD : Manuel des joueurs et suppléments (noms en VO). L'élément ajouté est vide ; remplis-le avec « Remplir automatiquement ».</div></div></div>`; }
function hb(ref){ if(!ref||!ref.startsWith("hb:")) return null; const d=S.docs[ref.slice(3)]; return d?Object.assign({_id:ref.slice(3)},d):null; }
function srd(kind,ref){ if(!ref||!ref.startsWith("srd:")) return null; return S.idx[kind][ref.slice(4)]||null; }
function spellOf(ref){ return srd("spells",ref) || (()=>{const h=hb(ref); return h?Object.assign({}, h, {source:"Hors SRD"}):null;})(); }
const isHb = ref => !!ref && ref.startsWith("hb:");
function badge(ref){ return isHb(ref)?`<span class="badge perso">Hors SRD</span>`:`<span class="badge srd">SRD</span>`; }
