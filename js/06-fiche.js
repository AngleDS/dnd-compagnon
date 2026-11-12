/* ---------- rendering ---------- */
function cur(){ return S.cur?S.docs[S.cur]:null; }
let renderQueued=false;
function softRender(){
  const ae=document.activeElement;
  if(ae && app().contains(ae) && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)){
    if(ae.id && ae.tagName==="INPUT" && (ae.type==="number"||ae.dataset.bind==="level")){ // champ numérique : on rafraîchit tout de suite et on garde le focus
      const id=ae.id; render(); const n=document.getElementById(id); if(n){ try{ n.focus({preventScroll:true}); }catch(e){} } return; }
    renderQueued=true; return; }
  render();
}
document.addEventListener("focusout",()=>{ if(renderQueued){ renderQueued=false; setTimeout(()=>{ if(!document.activeElement||!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) render(); else renderQueued=true; },0);} });
 
function mainId(){ const m=S.docs.prefs?.main; return m&&S.docs[m]&&S.docs[m].type==="perso"?m:null; }
function setMain(id){ if(!S.docs.prefs) S.docs.prefs={type:"prefs"}; S.docs.prefs.main=id; touch("prefs"); }
function renderNav(){
  const m=mainId(), onMine=S.view==="sheet"&&S.cur===m, onTable=onMine&&S.tab==="table", onMain=onMine&&!onTable;
  const items=[];
  const onList=S.view==="list";
  const inPerso=S.view==="sheet"||((S.view==="hb"||S.view==="comp")&&S.navFrom!=="menu");
  if(m&&inPerso){ items.push(["table","À la table",onTable]); items.push(["main","Fiche de personnage",onMain]); }
  items.push(["hb","Mes contenus",S.view==="hb"],["comp","Catalogue",S.view==="comp"]);
  document.getElementById("nav").innerHTML=items.map(([k,l,on])=>`<button data-act="nav" data-v="${k}" ${on?'aria-current="page"':""}>${esc(l)}</button>`).join("");
  const shown = !inPerso ? null : (S.view==="sheet"&&S.cur&&S.docs[S.cur] ? S.docs[S.cur] : (m?S.docs[m]:null));
  // Menu : liste déroulante (personnages, mode clair, dés, et pour « À la table » : ajouter un bloc, disposition ; d'autres réglages viendront)
  const atTable=S.view==="sheet"&&S.tab==="table"&&!!S.cur, mi=(attrs,label,extra="")=>`<button class="hditem" role="menuitem" ${attrs}>${label}${extra}</button>`;
  document.getElementById("hmenu").innerHTML=`<button class="hmenu" data-act="menuToggle" aria-haspopup="menu" aria-expanded="${!!S.menuOpen}" ${S.view==="list"||(S.view==="sheet"&&!onMine)?'aria-current="page"':""}>Menu <span aria-hidden="true">▾</span></button>${S.menuOpen?`<div class="hdrop" role="menu" aria-label="Menu">
    ${mi('data-act="nav" data-v="list"',"Mes personnages")}
    ${mi('data-act="theme"',curTheme()==="dark"?"Mode clair":"Mode sombre")}
    ${mi(`data-act="virtualDice" role="menuitemcheckbox" aria-checked="${virtualDiceEnabled()}"`,"Dés virtuels",`<span class="hdstate">${virtualDiceEnabled()?"activés":"désactivés"}</span>`)}
    ${atTable?`<div class="hdsep" role="separator"></div>${mi('data-act="layoutEdit"',"Personnaliser l’interface")}`:""}</div>`:""}`;
  document.getElementById("hchar").innerHTML="";
}
function render(){
  applyDicePreference();
  applyTheme();
  if(!S.C) return;
  renderNav();
  { const f=foot(); if(f) f.hidden = S.view==="sheet" && S.tab==="table"; }
  const y=window.scrollY; const pb=document.querySelector(".tpopbody"), pScroll=pb?pb.scrollTop:0, pKey=S.T&&S.T.pop;
  if(S.view==="sheet"&&cur()) app().innerHTML=viewSheet();
  else if(S.view==="hb") app().innerHTML=viewHb();
  else if(S.view==="comp") app().innerHTML=viewComp();
  else if(S.view==="wizard"&&S.W) app().innerHTML=viewWizard();
  else { S.view="list"; app().innerHTML=viewList(); }
  { const nb=document.querySelector(".tpopbody"); if(nb&&pKey&&S.T&&S.T.pop===pKey&&pScroll) nb.scrollTop=pScroll; }
  if(S.T&&S.T.anchor){ const A=S.T.anchor, nb=document.querySelector(".tpopbody"), el=nb&&nb.querySelector(A.sel); S.T.anchor=null; if(el) nb.scrollTop+=el.getBoundingClientRect().top-A.top; }
  if(S.view==="sheet"&&S.tab==="table") tableLayoutDom();
  renderModal();
  syncDiceInputMode();
  window.scrollTo(0,y);
  scrollHints(true);
}
/* Indices de défilement : fondu sur le bord d'une zone qui continue (onglets de la fiche, contenu des popups).
   Au rendu, l'onglet actif est ramené dans la partie visible de la barre. */
function scrollHints(reveal){
  document.querySelectorAll(".tabs").forEach(t=>{
    if(reveal){ const a=t.querySelector('[aria-selected="true"]');
      if(a){ if(a.offsetLeft<t.scrollLeft) t.scrollLeft=a.offsetLeft; else if(a.offsetLeft+a.offsetWidth>t.scrollLeft+t.clientWidth) t.scrollLeft=a.offsetLeft+a.offsetWidth-t.clientWidth; } }
    const max=t.scrollWidth-t.clientWidth;
    t.classList.toggle("more-l",t.scrollLeft>2); t.classList.toggle("more-r",t.scrollLeft<max-2);
  });
  document.querySelectorAll(".tpopbody").forEach(b=>b.classList.toggle("more-b",b.scrollTop<b.scrollHeight-b.clientHeight-2));
}
document.addEventListener("scroll",e=>{ if(e.target.classList&&(e.target.classList.contains("tabs")||e.target.classList.contains("tpopbody"))) scrollHints(false); },true);
window.addEventListener("resize",()=>scrollHints(false));
function prose(t){
  return String(t||"").split("\n").filter(Boolean).map(p=>{
    let h=esc(p).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");
    if(!/^<b>/.test(h)){ const m=h.match(/^([^.•:]{2,60}\.)\s/); if(m&&/^[A-ZÀ-Ý]/.test(m[1])) h="<b>"+m[1]+"</b>"+h.slice(m[1].length); }
    return `<p>${h}</p>`;
  }).join("");
}
 
/* ----- list ----- */
function viewList(){
  const ps=persos();
  const loading = S.mode==="cloud" && !S.loaded;
  const cards = ps.map(p=>{
    const c=clsOf(p.classId);
    const sp=(hb(p.species)||srd("species",p.species))?.name||"";
    return `<article class="pc">
      <h2>${esc(p.name||"Sans nom")}</h2>
      <div class="meta">${esc([sp, c?c.name+" "+(p.level||1):"Classe à choisir"].filter(Boolean).join(" · "))}${p.player?" — "+esc(p.player):""}</div>
      <div class="row"><button class="btn primary" data-act="open" data-id="${p._id}">Ouvrir la fiche</button><button class="btn primary" data-act="openTable" data-id="${p._id}">À la table</button>
      <button class="btn" data-act="editChar" data-id="${p._id}">Modifier</button>
      ${mainId()===p._id?`<span class="badge srd">Perso actif</span>`:`<button class="btn small ghost" data-act="setMain" data-id="${p._id}">Définir comme perso actif</button>`}</div>
      <div class="row" style="gap:2px">
      <button class="btn small ghost" data-act="dup" data-id="${p._id}">Dupliquer</button>
      <button class="btn small ghost" data-act="export" data-id="${p._id}">Exporter</button>
      ${S.confirm==="del:"+p._id?`<button class="btn small danger" data-act="del" data-id="${p._id}">Confirmer la suppression</button>`:`<button class="btn small ghost danger" data-act="askdel" data-id="${p._id}">Supprimer</button>`}</div>
    </article>`;}).join("");
  return `<div class="list-head"><div><h1>Liste des personnages</h1><div class="muted">Chaque joueur voit uniquement ses propres fiches.</div></div>
    <div class="row"><button class="btn" data-act="saveApp" title="Crée un fichier personnel contenant les personnages, portraits, notes et éléments de Mes contenus visibles ici">Télécharger ma copie personnelle</button><label class="btn" for="importFile">Importer un personnage</label><input id="importFile" type="file" accept=".json,application/json" hidden>
    <button class="btn" data-act="new" title="Fiche vide à remplir à la main">Fiche vide</button><button class="btn primary" data-act="wizard">Créer un personnage</button></div></div>
    <div class="muted" style="margin:8px 0 14px">L'application distribuée est vierge. « Télécharger ma copie personnelle » crée un autre fichier qui contient tes personnages, portraits, notes et contenus personnalisés : ne le partage pas sans le vouloir.</div>
    ${loading?`<div class="empty">Chargement de tes personnages…</div>`:(cards?`<div class="cards">${cards}</div>`:`<div class="empty">Aucun personnage pour l'instant. Crée le premier avec « Créer un personnage » : tu choisiras sa classe, son espèce et ses caractéristiques, et la fiche se calcule toute seule.</div>`)}`;
}
 
/* ----- sheet ----- */
function viewSheet(){
  const ch=cur(), D=derive(ch);
  const sp=(hb(ch.species)||srd("species",ch.species))?.name;
  const sub=hb(ch.subclass)?.name || (D.cls&&ch.subclass?D.cls.subclasses.find(s=>"srd:"+s.id===ch.subclass)?.name:"");
  const bg=(hb(ch.background)||srd("backgrounds",ch.background))?.name;
  const tabs=[["jeu","Jeu"],["comp","Compétences"],["sorts","Sorts"],["apt","Aptitudes"],["inv","Inventaire"],["notes","Notes"],["build","Construction"]];
  const abil=AB.map(a=>`<div class="ab">
      <div><div class="nm">${ABN[a]}</div><div class="sc num">Valeur ${esc(D.abEff[a])}${D.abEff[a]!==+(ch.abilities?.[a]??10)?` <span class="muted">(objet)</span>`:""}</div></div>
      <button class="rollbtn big" data-virtual data-act="r20" data-l="Test de ${ABN[a]}" data-m="${D.mods[a]}" title="Test de ${ABN[a]}">${sg(D.mods[a])}</button>
      <div class="save-mark ${D.saves[a].prof?"on":""}">${D.saves[a].prof?"● ":"○ "}Sauvegarde</div>
      <button class="rollbtn" data-virtual data-act="r20" data-l="JS de ${ABN[a]}" data-m="${D.saves[a].val}">${sg(D.saves[a].val)}</button>
    </div>`).join("");
  let body="";
  if(S.tab==="table") body="";
  else if(S.tab==="jeu") body=tabJeu(ch,D);
  else if(S.tab==="comp") body=tabComp(ch,D);
  else if(S.tab==="sorts") body=tabSorts(ch,D);
  else if(S.tab==="apt") body=tabApt(ch,D);
  else if(S.tab==="inv") body=tabInv(ch,D);
  else if(S.tab==="notes") body=`<label class="field"><span>Notes, historique, personnalité</span><textarea id="f-notes" data-bind="notes" style="min-height:320px">${esc(ch.notes||"")}</textarea></label>`;
  else body=tabBuild(ch,D);
  const portrait=typeof ch.portrait==="string"&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(ch.portrait)?ch.portrait:"";
  const banner=`<div class="sheet-head character-banner">
      ${S.tab==="table"?`<div class="character-portrait">`:`<button class="character-portrait" data-act="portrait" aria-label="${portrait?"Changer":"Ajouter"} le portrait de ${esc(ch.name||"ce personnage")}" title="${portrait?"Changer":"Ajouter"} le portrait">`}
        ${portrait?`<img src="${esc(portrait)}" alt="Portrait de ${esc(ch.name||"ce personnage")}">`:`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="23" r="11"/><path d="M12 57c0-13 8-21 20-21s20 8 20 21"/></svg>`}
        ${S.tab==="table"?"</div>":`<span class="portrait-edit" aria-hidden="true">+</span>
      </button>`}
      <div class="character-identity"><h1>${esc(ch.name||"Sans nom")}</h1>
        <div class="character-facts">
          <div><span class="label">Classe</span><span>${esc(D.cls?D.cls.name+" "+D.L:"Classe à choisir")}${sub?" · "+esc(sub):""}</span></div>
          <div><span class="label">Espèce</span><span>${esc(sp||"—")}</span></div>
          <div><span class="label">Historique</span><span>${esc(bg||"—")}</span></div>
          <div><span class="label">Joueur·se</span><span>${esc(ch.player||"—")}</span></div>
        </div>${ch.alignment?`<div class="meta">${esc(ch.alignment)}</div>`:""}
      </div>
      ${S.tab==="table"?`<div class="character-rest"><button class="btn hprest" data-act="restOpen" data-v="" aria-label="Repos court ou long" title="Repos court ou repos long"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18M5 18v-5.5A2.5 2.5 0 0 1 7.5 10h9a2.5 2.5 0 0 1 2.5 2.5V18"/><path d="M7 10V7.5A1.5 1.5 0 0 1 8.5 6h2A1.5 1.5 0 0 1 12 7.5V10"/><path d="M16.5 3.5h3l-3 3h3"/></svg><span>Repos</span></button></div>`:`<div class="row" style="margin-left:auto"><span class="label">Bonus de maîtrise</span><b class="num">${sg(D.pb)}</b>${D.cls&&D.L<20?`<button class="btn small" data-act="lvlUp" title="Assistant de montée de niveau">Niveau ${D.L+1} ↑</button>`:""}</div>`}
    </div>`;
  return `${S.tab==="table"?"":banner}
    ${S.tab==="table"?"":`<div class="tabs sheettabs" role="tablist">${tabs.map(([k,l])=>`<button role="tab" aria-selected="${S.tab===k}" data-act="tab" data-v="${k}">${l}</button>`).join("")}</div>`}
    ${S.tab==="table"?viewTable(ch,D,banner):S.tab==="jeu"?`<div class="sheet">
      <aside class="abil">${abil}</aside>
      <section style="min-width:0">
        ${body}
      </section>
      <aside class="dice panel" id="dice"></aside>
    </div>`:`<div class="sheetsolo">${body}</div>`}`;
}
function tabJeu(ch,D){
  const hp=ch.hp||{cur:D.hpMax,temp:0};
  const pct=Math.max(0,Math.min(100,100*(+hp.cur||0)/D.hpMax));
  const vit=`<div class="vitals">
    <div class="vital hp"><div class="row" style="justify-content:space-between;width:100%"><span class="label">Points de vie</span><span class="muted num">max ${D.hpMax}</span></div>
      <div class="hpbar"><i class="${pct<34?"low":""}" style="width:${pct}%"></i></div>
      <div class="row">${hpStepper(ch,D)}</div><div class="row">${tempStepper(ch)}</div></div>
    <div class="vital"><span class="label">Classe d'armure</span><span class="v">${D.ac}</span><span class="muted" style="font-size:var(--fs-sm)">${esc(D.acNote)}</span></div>
    <div class="vital"><span class="label">Initiative</span><button class="rollbtn big" data-virtual data-act="r20" data-l="Initiative" data-m="${D.init}">${sg(D.init)}</button></div>
    <div class="vital"><span class="label">Vitesse</span><span class="v">${String(D.speed).replace(".",",")} m</span></div>
    <div class="vital"><span class="label">Perception passive</span><span class="v">${D.passive}</span></div>
    <div class="vital"><span class="label">Dés de vie</span><span class="v num">${D.L-(+ch.hdUsed||0)}/${D.L}</span><button class="btn small" data-virtual data-act="spendhd">d${D.hd} ${sg(D.mods.con)}</button></div>
  </div>`;
  const zero=(+hp.cur||0)<=0?`<div class="panel" style="margin-bottom:12px;border-color:var(--blood)"><div class="row" style="justify-content:space-between"><b>À 0 PV : jets contre la mort</b>
    <button class="btn small" data-virtual data-act="death">Lancer le jet</button></div>
    <div class="row"><span>Réussites</span>${pips("death.s",3,ch.death?.s||0)}<span>Échecs</span>${pips("death.f",3,ch.death?.f||0)}</div></div>`:"";
  const attacks=attackRows(ch,D);
  const res=D.res.map(r=>{
    const used=+(ch.resUsed?.[r.id]||0), left=r.max-used;
    const ctl = r.id==="cls:rouerie-magique"
      ? pips("res:"+r.id,r.max,used,true,true) + (left>0
          ? `<button class="btn small primary" data-act="rouerie" title="Rite d'une minute">Utiliser</button>`
          : `<span class="muted" style="font-size:var(--fs-sm)">Utilisée, revient au repos long</span><button class="btn small ghost" data-act="rouerieUndo" title="Annuler l'utilisation">Annuler</button>`)
      : r.pool
      ? `<span class="num"><b>${left}</b> / ${r.max} d${r.die}</span>
         <input type="number" min="1" max="${r.maxUse||left}" value="${Math.min(r.maxUse||left,left)||1}" id="pool-${r.id.replace(/[^a-z0-9]/g,"")}" aria-label="Dés à dépenser" style="width:56px">
         <button class="btn small" data-virtual data-act="pool" data-id="${esc(r.id)}">Lancer</button>`
      : (r.max<=10 ? pips("res:"+r.id,r.max,used,true) : `<span class="num"><b>${left}</b> / ${r.max}</span><input type="number" style="width:64px" id="resn-${r.id.replace(/[^a-z0-9]/g,"")}" aria-label="Quantité" placeholder="0"><button class="btn small" data-act="resuse" data-id="${esc(r.id)}">Dépenser</button>`);
    return `<div class="res"><div><b class="tipl" data-act="tip" data-k="resid:${esc(r.id)}">${esc(r.name)}</b> <span class="muted" style="font-size:var(--fs-sm)">${rechargeLabel(r.recharge)} · ${esc(r.origin)}</span>${r.maxUse?`<div class="muted" style="font-size:var(--fs-sm)">${r.maxUse} dés max par utilisation</div>`:""}</div><div class="row">${ctl}</div></div>`;}).join("");
  const slots=slotBlock(ch,D);
  const cnts=(ch.counters||[]).map(c=>`<div class="res"><div><b class="tipl" data-act="tip" data-k="cnt:${esc(c.id)}">${esc(c.name)}</b> <span class="muted" style="font-size:var(--fs-sm)">consommable</span></div><div class="row">${(+c.max||0)<=20?pips("cnt:"+c.id,+c.max||0,(+c.max||0)-(+c.cur||0),true):`<button class="btn small" data-act="cnt" data-id="${c.id}" data-v="-1" ${(+c.cur||0)<=0?"disabled":""} aria-label="Utiliser">−1</button><b class="num">${+c.cur||0} / ${+c.max||0}</b><button class="btn small ghost" data-act="cnt" data-id="${c.id}" data-v="1" aria-label="Ajouter">+1</button>`}<span class="muted num" style="font-size:var(--fs-sm)">${+c.cur||0}/${+c.max||0}</span></div></div>`).join("");
  const conds=CONDS.map(c=>`<button class="chip" aria-pressed="${(ch.conditions||[]).includes(c)}" data-act="cond" data-v="${esc(c)}" title="${esc((S.idx.cond[c]?.text||"").slice(0,300))}">${esc(c)}</button>`).join("");
  return vit+zero+`
    <div class="sect"><h2>Attaques</h2><button class="btn small" data-act="addAttack">Ajouter une attaque</button></div>
    <div class="scroll">${attacks||`<div class="muted">Aucune attaque. Ajoute une arme ou prépare un sort mineur d'attaque.</div>`}</div>
    ${slots}
    <div class="sect"><h2>Ressources</h2></div>
    ${(res+cnts)||`<div class="muted">Aucune ressource à suivre pour l'instant.</div>`}
    <div class="sect"><h2>États</h2><div class="row"><span class="label">Épuisement</span>
      <button class="btn small" data-act="exh" data-v="-1">−</button><b class="num">${D.exh}</b><button class="btn small" data-act="exh" data-v="1">+</button>
      <button class="chip" aria-pressed="${!!ch.inspiration}" data-act="insp" data-v="toggle">Inspiration héroïque</button></div></div>
    <div class="row">${conds}</div>
    <div class="row" style="margin-top:10px"><label class="field" style="flex:1;min-width:200px"><span>Concentration en cours</span><input id="f-conc" type="text" data-bind="conc" value="${esc(ch.conc||"")}" placeholder="Aucun sort"></label>
      <button class="btn" data-virtual data-act="r20" data-l="JS de Concentration" data-m="${D.saves.con.val}">JS Concentration ${sg(D.saves.con.val)}</button></div>
    <div class="sect"><h2>Repos</h2></div>
    <div class="row">${confirmBtn("rest:court","Repos court","Confirmer le repos court")}${confirmBtn("rest:long","Repos long","Confirmer le repos long")}
    <span class="muted" style="font-size:var(--fs-sm)">Court : magie de pacte et ressources « court ». Long : tout revient, PV et dés de vie compris.</span></div>`;
}
function confirmBtn(key,label,cl){ return S.confirm===key?`<button class="btn primary" data-act="${key.split(":")[0]}" data-v="${key.split(":")[1]}">${cl}</button>`:`<button class="btn" data-act="ask" data-v="${key}">${label}</button>`; }
/* Compteurs maison (chantier Compteurs, 12 nov. 2026) : nom, maximum et récupération (aucune, repos court, repos long). */
const CNT_REC=[["","Aucune"],["court","Repos court"],["long","Repos long"]];
const cntRecChips=c=>`<span class="row cntrec" role="group" aria-label="Récupération de ${esc(c.name)}" style="gap:4px">${CNT_REC.map(([v,l])=>`<button class="chip" data-act="cntRec" data-id="${esc(c.id)}" data-v="${v}" aria-pressed="${(c.recharge||"")===v}">${l}</button>`).join("")}</span>`;
const cntForm=p=>`<form class="row cntform" data-form="cnt" style="margin-top:8px;gap:6px;flex-wrap:wrap"><input id="${p}-cnt-name" class="cnt-name" type="text" maxlength="60" placeholder="Nom (ex. Eau, Trophées)" aria-label="Nom du compteur" style="flex:1;min-width:140px"><input id="${p}-cnt-max" class="cnt-max" type="number" inputmode="numeric" min="1" max="999" placeholder="Maximum" aria-label="Maximum" style="width:90px"><select id="${p}-cnt-rec" class="cnt-rec" aria-label="Récupération">${CNT_REC.map(([v,l])=>`<option value="${v}">${v?"Revient au "+l.toLowerCase():"Sans récupération"}</option>`).join("")}</select><button class="btn small" type="submit">Ajouter un compteur</button></form>`;
function rechargeLabel(r){ return {court:"repos court",long:"repos long",long_court1:"repos long (1 au repos court)",court_partiel:"repos long (1 au repos court)",long_court5:"repos long (court dès le niv. 5)"}[r]||"repos long"; }
function pips(key,max,used,isUsed,locked){
  let h=`<span class="pips">`;
  for(let i=0;i<max;i++){ const on = isUsed ? i<(max-used) : i<used; if(locked){ h+=`<span class="pip ${on?"":"used"}" role="img" aria-label="${on?"Disponible":"Utilisé"}"></span>`; continue; } h+=`<button class="pip ${on?"":"used"}" data-act="pip" data-k="${esc(key)}" data-i="${i}" data-max="${max}" data-used="${isUsed?1:0}" aria-label="${esc(key)} ${i+1}"></button>`; }
  return h+`</span>`;
}
function slotBlock(ch,D,head=true){
  if(!D.cast) return "";
  let h=head?`<div class="sect"><h2>Magie</h2><div class="row"><span class="label">DD</span><b class="num">${D.cast.dc}</b><span class="label">Attaque de sort</span><button class="rollbtn" data-virtual data-act="r20" data-l="Attaque de sort" data-m="${D.cast.atk}">${sg(D.cast.atk)}</button></div></div>`:"";
  const locked=!S.unlockSlots;
  const lockBtn=`<button class="btn small ghost lock" data-act="lockSlots" aria-pressed="${!locked}" title="${locked?"Modifier les emplacements à la main":"Verrouiller les emplacements"}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/>${locked?'<path d="M8 11V7a4 4 0 0 1 8 0v4"/>':'<path d="M8 11V7a4 4 0 0 1 7.5-2"/>'}</svg>${locked?"":"Modification manuelle"}</button>`;
  if(D.cast.type==="pact") h+=`<div class="res"><div><b>Emplacements de pacte</b> <span class="muted" style="font-size:var(--fs-sm)">niveau ${D.cast.pactLevel} · repos court</span></div><div class="row">${pips("pact",D.cast.pactSlots,+ch.pactUsed||0,true,locked)}${lockBtn}</div></div>`;
  else if(D.cast.slots){ D.cast.slots.forEach((n,i)=>{ h+=`<div class="res"><div><b>Niveau ${i+1}</b></div>${pips("slot:"+(i+1),n,+(ch.slotsUsed?.[i+1]||0),true,locked)}</div>`; }); h+=`<div class="row" style="justify-content:flex-end">${lockBtn}</div>`; }
  return h;
}
function weaponAttack(a,ch,D){
  const w=a.weapon?(srd("weapons",a.weapon)||hbWeapon(a.weapon)):null;
  const finesse=w?.finesse || /finesse/i.test(w?.properties||"");
  const ranged=w?.kind==="dist";
  let ab=a.ability||"auto";
  if(a.pact) ab="cha";
  if(ab==="auto") ab = ranged?"dex":(finesse?(D.mods.dex>D.mods.for?"dex":"for"):"for");
  if(ab==="sort") ab=D.cast?.ability||"cha";
  const prof = a.pact ? true : a.prof!==false;
  const bb=atkBag(ch,a), mgN=bb&&D.mg?D.mg.wpn[bb.id]||0:0;
  const hit=mgN+D.mods[ab]+(prof?D.pb:0)+(+a.bonusHit||0)+(ranged?D.effs.filter(e=>e.t==="bonus"&&e.cible==="attaque_dist").reduce((t,e)=>t+evalF(e.val,D.ctx),0):0)+D.effs.filter(e=>e.t==="bonus"&&e.cible==="attaque").reduce((t,e)=>t+evalF(e.val,D.ctx),0);
  const dice=a.dice||w?.damage||"1d4";
  const dmgB=mgN+D.mods[ab]+(+a.bonusDmg||0)+D.effs.filter(e=>e.t==="bonus"&&e.cible==="degats").reduce((t,e)=>t+evalF(e.val,D.ctx),0);
  return {mgN,name:a.name||w?.name||"Attaque sans nom", hit, dmg:dice+(dmgB?sg(dmgB):""), type:a.dmgType||w?.damageType||"", props:w?.properties||"", mastery:w?.mastery, ab};
}
function hbWeapon(ref){ const h=hb(ref); if(!h) return null; return {name:h.name, damage:h.dice, damageType:h.dmgType, properties:h.properties||"", finesse:/finesse/i.test(h.properties||""), kind:/portée|munitions/i.test(h.properties||"")&&!/lancer/i.test(h.properties||"")?"dist":"cac"}; }
function attackRows(ch,D){
  const rows=[];
  for(const a of ch.attacks||[]){
    const r=weaponAttack(a,ch,D);
    rows.push(`<tr><td><b class="tipl" data-act="tip" data-k="atk:${esc(a.id)}">${esc(r.name)}</b>${a.pact?` <span class="badge">pacte</span>`:""}<div class="muted" style="font-size:var(--fs-sm)">${esc([r.props,r.mastery?"Botte : "+r.mastery:""].filter(x=>x&&x!=="—").join(" · "))}</div></td>
      <td><button class="rollbtn" data-virtual data-act="r20" data-l="${esc(r.name)} — toucher" data-m="${r.hit}">${sg(r.hit)}</button></td>
      <td><button class="rollbtn" data-virtual data-act="dmg" data-l="${esc(r.name)} — dégâts ${esc(r.type)}" data-e="${esc(r.dmg)}">${esc(r.dmg)}</button> <span class="muted" style="font-size:var(--fs-sm)">${esc(r.type)}</span></td>
      <td><button class="btn small ghost" data-virtual data-act="dmg" data-crit="1" data-l="${esc(r.name)} — dégâts ${esc(r.type)}" data-e="${esc(r.dmg)}">Critique</button>
      <button class="btn small ghost" data-act="editAttack" data-id="${a.id}">Modifier</button></td></tr>`);
  }
  // effect attacks
  for(const e of D.effs) if(e.t==="attaque"){
    let ab=e.carac||"sort"; if(ab==="sort") ab=D.cast?.ability||"cha";
    const hit=D.mods[ab]+(e.maitrise!==false?D.pb:0);
    const dmg=(e.des||"1d6")+(e.ajoutMod?sg(D.mods[ab]):"");
    rows.push(`<tr><td><b>${esc(e.nom||e._src)}</b> <span class="badge perso">Hors SRD</span></td><td><button class="rollbtn" data-virtual data-act="r20" data-l="${esc(e.nom)} — toucher" data-m="${hit}">${sg(hit)}</button></td><td><button class="rollbtn" data-virtual data-act="dmg" data-l="${esc(e.nom)} — dégâts" data-e="${esc(dmg)}">${esc(dmg)}</button> <span class="muted" style="font-size:var(--fs-sm)">${esc(e.type||"")}</span></td><td><button class="btn small ghost" data-virtual data-act="dmg" data-crit="1" data-l="${esc(e.nom)} — dégâts" data-e="${esc(dmg)}">Critique</button></td></tr>`);
  }
  // cantrip attacks
  for(const s of spellList(ch,D)) if(s.sp.level===0){
    const m=spellMech(s.sp); if(!m.dice) continue;
    const dmg=diceAt(m,s.sp,0,D);
    const beams=m.beams?1+(D.L>=5)+(D.L>=11)+(D.L>=17):1;
    const hitCell = m.attack?`<button class="rollbtn" data-virtual data-act="r20" data-l="${esc(s.sp.name)} — toucher" data-m="${D.cast.atk}">${sg(D.cast.atk)}</button>${beams>1?` <span class="muted" style="font-size:var(--fs-sm)">×${beams} rayons</span>`:""}`:(m.save?`<span class="num">JS ${esc(m.save.slice(0,3))} DD ${D.cast.dc}</span>`:"");
    rows.push(`<tr><td><b class="tipl" data-act="tip" data-k="spell:${esc(s.ref)}">${esc(s.sp.name)}</b> <span class="muted" style="font-size:var(--fs-sm)">sort mineur · ${esc(s.sp.range||"")}</span></td><td>${hitCell}</td>
      <td><button class="rollbtn" data-virtual data-act="dmg" data-l="${esc(s.sp.name)} — ${m.heal?"soins":"dégâts "+(m.dmgType||"")}" data-e="${esc(dmg)}">${esc(dmg)}</button> <span class="muted" style="font-size:var(--fs-sm)">${esc(m.dmgType||"")}</span></td>
      <td>${m.attack?`<button class="btn small ghost" data-virtual data-act="dmg" data-crit="1" data-l="${esc(s.sp.name)} — dégâts" data-e="${esc(dmg)}">Critique</button>`:""}</td></tr>`);
  }
  // leveled spells: each click casts (spends a slot, rolls everything)
  const slotsAvail = !D.cast?[]:(D.cast.type==="pact"?[D.cast.pactLevel]:(D.cast.slots||[]).map((n,i)=>i+1));
  for(const s of spellList(ch,D)) if(s.sp.level>0 && s.prepared){
    const m=spellMech(s.sp); if(!m.dice&&!m.attack) continue;
    const al=arcLevel(D,s.ref);
    const opts=al?[s.sp.level]:slotsAvail.filter(l=>l>=s.sp.level); if(!opts.length) continue;
    const sid="aslot-"+s.ref.replace(/[^a-z0-9]/gi,"");
    const sel=opts.length>1?`<select id="${sid}" aria-label="Niveau d'emplacement">${opts.map(l=>`<option value="${l}">niv. ${l}</option>`).join("")}</select>`:`<input type="hidden" id="${sid}" value="${opts[0]}"><span class="muted" style="font-size:var(--fs-sm)">empl. niv. ${opts[0]}</span>`;
    const dmg=diceAt(m,s.sp,opts[0],D);
    const hitTxt = m.attack?sg(D.cast.atk):(m.save?"JS "+m.save.slice(0,3)+" DD "+D.cast.dc:"Lancer");
    rows.push(`<tr><td><b class="tipl" data-act="tip" data-k="spell:${esc(s.ref)}">${esc(s.sp.name)}</b> <span class="muted" style="font-size:var(--fs-sm)">sort niv. ${s.sp.level} · ${esc(s.sp.range||"")}</span><div>${sel}</div></td>
      <td><button class="rollbtn" data-virtual data-act="cast" data-ref="${esc(s.ref)}" data-sel="${sid}" ${al?`data-arc="${al}"`:""} title="${al?"Arcanum mystique (1/repos long)":"Dépense un emplacement et lance les dés"}">${esc(hitTxt)}</button></td>
      <td>${dmg?`<button class="rollbtn" data-virtual data-act="cast" data-ref="${esc(s.ref)}" data-sel="${sid}" ${al?`data-arc="${al}"`:""} title="${al?"Arcanum mystique (1/repos long)":"Dépense un emplacement et lance les dés"}">${esc(dmg)}</button> <span class="muted" style="font-size:var(--fs-sm)">${esc(m.heal?"soins":(m.dmgType||""))}</span>`:""}</td>
      <td><span class="muted" style="font-size:var(--fs-sm)">1 clic = 1 emplacement</span></td></tr>`);
  }
  if(!rows.length) return "";
  return `<table class="tbl"><thead><tr><th>Arme ou sort</th><th>Toucher</th><th>Dégâts</th><th></th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
}
function spellList(ch,D){
  const out=[], seen=new Set();
  for(const ref of Object.keys(D.always)){ const sp=spellOf(ref); if(sp){ out.push({ref,sp,always:D.always[ref],prepared:true}); seen.add(ref);} }
  for(const s of ch.spells||[]){ if(seen.has(s.ref)) continue; const sp=spellOf(s.ref); if(sp){ out.push({ref:s.ref,sp,prepared:s.prepared!==false}); seen.add(s.ref);} }
  return out.sort((a,b)=>a.sp.level-b.sp.level||a.sp.name.localeCompare(b.sp.name,"fr"));
}
function tabComp(ch,D){
  const rows=S.C.skills.map(s=>{const k=D.skills[s.id];
    return `<div class="skill"><span class="dot p${k.lv}" title="${["Non maîtrisée","Maîtrise","Expertise"][k.lv]}"></span><span><span class="tipl" data-act="tip" data-k="skill:${s.id}">${esc(s.name)}</span><span class="ab3">${ABS[s.ability]}</span></span>
      <button class="rollbtn" data-virtual data-act="r20" data-l="${esc(s.name)} (${ABS[s.ability]})" data-m="${k.val}">${sg(k.val)}</button></div>`;}).join("");
  return `<div class="grid2"><div>${rows}</div>
    <div class="stack"><div class="panel"><div class="label">Perception passive</div><div style="font-size:var(--fs-2xl);font-weight:700" class="num">${D.passive}</div></div>
    <label class="field"><span>Maîtrises d'outils</span><input id="f-tools" type="text" data-bind="tools" value="${esc(ch.tools||"")}"></label>
    <label class="field"><span>Langues</span><input id="f-lang" type="text" data-bind="languages" value="${esc(ch.languages||"")}"></label>
    <div class="muted" style="font-size:var(--fs-sm)">● maîtrise, <span style="color:var(--blood)">●</span> expertise. Les maîtrises se règlent dans l'onglet Construction.</div></div></div>`;
}
function tabSorts(ch,D){
  if(!D.cast) return `<div class="empty">Ce personnage ne lance pas de sorts. Une classe de lanceur de sorts, ou un élément de « Mes contenus » qui accorde des sorts, active cet onglet.</div>`;
  const list=spellList(ch,D);
  const nC=list.filter(s=>s.sp.level===0&&!s.always).length, nP=list.filter(s=>s.sp.level>0&&!s.always&&s.prepared).length;
  const slotsAvail = D.cast.type==="pact"?[D.cast.pactLevel]:(D.cast.slots||[]).map((n,i)=>i+1);
  let h=`<div class="row" style="justify-content:space-between;margin-bottom:8px"><div class="row">
    <span class="label">DD</span><b class="num">${D.cast.dc}</b><span class="label">Attaque</span><button class="rollbtn" data-virtual data-act="r20" data-l="Attaque de sort" data-m="${D.cast.atk}">${sg(D.cast.atk)}</button>
    ${D.cast.cantrips!==undefined?`<span class="num" style="font-size:var(--fs-sm)"><span class="${nC>D.cast.cantrips?"warntxt":"muted"}">Sorts mineurs ${nC}/${D.cast.cantrips}</span> · <span class="${nP>D.cast.prepared?"warntxt":"muted"}">Préparés ${nP}/${D.cast.prepared}</span></span>`:""}</div>
    <button class="btn small" data-act="pickSpell">Ajouter des sorts</button></div>`;
  h+=slotBlock(ch,D,false);
  let lvl=-1;
  for(const s of list){
    if(s.sp.level!==lvl){ lvl=s.sp.level; h+=`<div class="sect"><h2>${lvl===0?"Sorts mineurs":"Niveau "+lvl}</h2></div>`; }
    const m=spellMech(s.sp), sp=s.sp;
    const al=arcLevel(D,s.ref);
    const opts=al?[]:(sp.level===0?[]:slotsAvail.filter(l=>l>=sp.level));
    const sel=opts.length?`<select id="slot-${esc(s.ref.replace(/[^a-z0-9]/gi,""))}" aria-label="Niveau d'emplacement">${opts.map(l=>`<option value="${l}">empl. niv. ${l}</option>`).join("")}</select>`:"";
    const useSlot = al ? (+(ch.resUsed?.["arc:"+al]||0)>=1?`<span class="muted" style="font-size:var(--fs-sm)">Arcanum utilisé · revient au repos long</span>`:`<button class="btn small primary" data-virtual data-act="cast" data-ref="${esc(s.ref)}" data-arc="${al}" title="Arcanum mystique : 1 fois par repos long, sans emplacement">Lancer (Arcanum)</button>`) : (sp.level===0 || opts.length) ? `<button class="btn small primary" data-virtual data-act="cast" data-ref="${esc(s.ref)}" title="${sp.level?"Dépense un emplacement et lance les dés":"Lance les dés"}">Lancer</button>` : `<span class="muted" style="font-size:var(--fs-sm)">Aucun emplacement assez haut</span>`;
    const rit = sp.ritual && sp.level>0 ? `<button class="btn small" data-virtual data-act="cast" data-rit="1" data-ref="${esc(s.ref)}" title="Sans emplacement, 10 minutes de plus">En rituel</button>` : "";
    const atk = m.attack?`<button class="rollbtn" data-virtual data-act="r20" data-l="${esc(sp.name)} — toucher" data-m="${D.cast.atk}" title="Relancer l'attaque sans dépenser d'emplacement">${sg(D.cast.atk)}</button>`:"";
    const sv = m.save?`<span class="badge">JS ${esc(m.save)} DD ${D.cast.dc}</span>`:"";
    const dm = m.dice?`<button class="rollbtn" data-virtual data-act="sdmg" data-ref="${esc(s.ref)}" title="Relancer les dés sans dépenser d'emplacement">${m.heal?"Soins":"Dégâts"} ${esc(diceAt(m,sp,opts[0]||sp.level,D))}</button>`:"";
    h+=`<div class="spell"><div class="h"><span class="nm tipl" data-act="tip" data-k="spell:${esc(s.ref)}">${esc(sp.name)}</span>${badge(s.ref)}
      ${sp.concentration?`<span class="badge" title="Concentration">C</span>`:""}${sp.ritual?`<span class="badge" title="Rituel">R</span>`:""}
      ${s.always?`<span class="badge" title="Toujours préparé">${esc(s.always)}</span>`:(sp.level>0?`<button class="chip" aria-pressed="${s.prepared}" data-act="prep" data-ref="${esc(s.ref)}">Préparé</button>`:"")}
      <span class="muted" style="font-size:var(--fs-sm)">${esc([sp.casting_time,sp.range,sp.duration].filter(Boolean).join(" · "))}</span></div>
      <div class="row">${sel}${useSlot}${rit}${sv}${atk}${dm}
      <details style="flex-basis:100%"><summary class="muted" style="font-size:var(--fs-sm)">Description ${esc(sp.components?"· "+sp.components:"")}</summary><div class="prose">${prose(sp.text)}</div>${isHb(s.ref)?hbFoot(hb(s.ref)):""}</details>
      ${s.always?"":`<button class="btn small ghost danger" data-act="rmSpell" data-ref="${esc(s.ref)}">Retirer</button>`}</div></div>`;
  }
  if(!list.length) h+=`<div class="empty">Aucun sort. « Ajouter des sorts » ouvre la liste de ta classe, avec tes sorts perso.</div>`;
  return h;
}
function tabApt(ch,D){
  const out=[]; const L=D.L;
  if(D.cls){
    for(const f of D.cls.features) if(f.level<=L) out.push({origin:D.cls.name,level:f.level,name:f.name,text:f.text,ref:D.cls.hb?D.cls.id:"srd:x",effects:D.cls.hb?f.effects:undefined});
    if(ch.subclass&&ch.subclass.startsWith("srd:")){ const sc=D.cls.subclasses.find(s=>"srd:"+s.id===ch.subclass); if(sc) for(const f of sc.features) if(f.level<=L) out.push({origin:sc.name,level:f.level,name:f.name,text:f.text,ref:"srd:x"}); }
  }
  for(const s of D.sources) out.push({origin:s.origin,level:s.level,name:s.name,text:s.text,ref:s.ref,effects:s.effects});
  const sp=srd("species",ch.species);
  if(sp) for(const t of sp.traits) out.push({origin:sp.name,name:t.name,text:t.text,ref:"srd:x"});
  for(const x of ch.invocations||[]){ const i=S.idx.invocations[invId(x)]; if(i) out.push({origin:"Manifestation occulte",name:invLabel(x),text:(i.prerequisite?"Prérequis : "+i.prerequisite+"\n":"")+i.text,ref:"srd:x"}); }
  const grouped={}; for(const o of out){ (grouped[o.origin]=grouped[o.origin]||[]).push(o); }
  let h=`<div class="row" style="justify-content:flex-end"><button class="btn small" data-act="tab" data-v="build">Ajouter dons, manifestations ou aptitudes</button></div>`;
  for(const [g,items] of Object.entries(grouped)){
    h+=`<div class="sect"><h2>${esc(g)}</h2></div>`;
    for(const f of items){
      const auto=(f.effects||[]).filter(e=>e.t!=="note").map(effLabel).join(" · ");
      h+=`<details class="feat"><summary><span class="nm">${esc(f.name)}</span>${f.level?`<span class="lvl">niv. ${f.level}</span>`:""}${badge(f.ref)}${auto?`<span class="muted" style="font-size:var(--fs-sm)">Automatisé : ${esc(auto)}</span>`:""}</summary><div class="prose">${prose(f.text)||`<p class="muted">Pas de texte saisi.</p>`}</div>${f.ref&&isHb(f.ref)?hbFoot(hb(f.ref)):""}</details>`;
    }
  }
  return h;
}
function effLabel(e){
  if(e.t==="bonus") return `${e.val} ${({ca:"CA",ca_armure:"CA (en armure)",init:"initiative",vitesse:"vitesse",pvmax:"PV max",pvniv:"PV par niveau",attaque:"attaque",attaque_dist:"attaque à distance",attaque_sort:"attaque de sort",degats:"dégâts",dd:"DD des sorts"})[e.cible]||e.cible}`;
  if(e.t==="maitrise") return `${e.niveau==2?"expertise":"maîtrise"} ${e.cible.replace("comp:","").replace("jds:","JS ")}`;
  if(e.t==="ressource") return `ressource ${e.nom}`;
  if(e.t==="reserve") return `réserve ${e.nom}`;
  if(e.t==="attaque") return `attaque ${e.nom}`;
  if(e.t==="sorts") return `sorts ${e.noms}`;
  if(e.t==="guerisseur") return "soins à la trousse, relance des 1";
  return "";
}
function tabInv(ch,D){
  ensureBag(ch);
  const bag=ch.bag;
  const g=ch.gold||{};
  const items=(ch.items||[]).map((it,i)=>{const h=hb(it.ref); if(!h) return ""; return `<div class="res"><div><b>${esc(h.name)}</b> <span class="badge perso">Hors SRD</span></div><div class="row"><button class="chip" aria-pressed="${!!it.equipped}" data-act="equip" data-i="${i}">Équipé</button><button class="btn small ghost danger" data-act="rmItem" data-i="${i}">Retirer</button></div></div>`;}).join("");
  const hbItems=hbs("objet");
  return `<div class="sect"><h2>Bourse</h2></div><div class="row">${["pp","po","pe","pa","pc"].map(k=>`<label class="field"><span>${k}</span><input id="f-g${k}" type="number" data-bind="gold.${k}" data-num value="${esc(g[k]||0)}"></label>`).join("")}</div>
    <div class="sect"><h2>Objets à effets</h2>${hbItems.length?`<div class="row"><select id="addItemSel" aria-label="Objet perso">${hbItems.map(h=>`<option value="hb:${h._id}">${esc(h.name)}</option>`).join("")}</select><button class="btn small" data-act="addItem">Ajouter</button></div>`:`<span class="muted" style="font-size:var(--fs-sm)">Crée un objet dans « Mes contenus » pour l'équiper ici.</span>`}</div>
    ${items||`<div class="muted">Les objets équipés appliquent leurs effets à la fiche (bonus de CA, attaques…).</div>`}
    <div class="sect"><h2>Compteurs maison</h2><span class="muted" style="font-size:var(--fs-sm)">Ce qui n'est pas un objet du sac (eau, trophées…). Un objet du sac se compte avec sa quantité.</span></div>
    ${(ch.counters||[]).map(c=>`<div class="res"><b>${esc(c.name)}</b><div class="row"><label class="row" style="gap:4px"><input id="cntc-${c.id}" type="number" min="0" data-cnt="${c.id}" data-bind="cur" data-num value="${esc(c.cur||0)}" aria-label="Quantité actuelle">/<input id="cntm-${c.id}" type="number" min="0" data-cnt="${c.id}" data-bind="max" data-num value="${esc(c.max||0)}" aria-label="Maximum"></label>${cntRecChips(c)}<button class="btn small ghost danger btndel" data-act="cntRm" data-id="${c.id}" aria-label="Supprimer ${esc(c.name)}">${ICON_TRASH}</button></div></div>`).join("")}
    ${cntForm("f")}
    <div class="sect"><h2>Sac</h2><span class="muted num" style="font-size:var(--fs-sm)">${bag.reduce((t,b)=>t+(+b.qty||0),0)} objet(s)</span></div>
    <div class="bag">${bag.map(b=>`<div class="bagrow">
      <span class="row" style="gap:4px;min-width:0;flex-wrap:nowrap"><input id="bag-n-${b.id}" type="text" data-bag="${b.id}" data-bind="name" value="${esc(b.name)}" aria-label="Objet" class="bagname" style="flex:1;min-width:0">${(()=>{ const ref=b.ref||matchItem(b.name); return ref?`<button class="btn small ghost infob" data-act="tip" data-k="${esc(ref)}" aria-label="Fiche de ${esc(b.name)}" title="Voir la fiche">${ref.startsWith("hb:")?"Perso":"SRD"}</button>`:`<button class="btn small ghost infob mk" data-act="mkItem" data-id="${b.id}" title="Créer la fiche de cet objet dans Mes contenus">Créer sa fiche</button>`; })()}</span>
      <span class="hpstep"><button class="btn small stepq" data-act="bagq" data-id="${b.id}" data-v="-1" aria-label="Retirer un">−</button><b class="num">${+b.qty||0}</b><button class="btn small stepq" data-act="bagq" data-id="${b.id}" data-v="1" aria-label="Ajouter un">+</button></span>
      <input id="bag-o-${b.id}" type="text" data-bag="${b.id}" data-bind="note" value="${esc(b.note||"")}" placeholder="Note" aria-label="Note" class="bagnote">
      <button class="btn small ghost danger btndel" data-act="bagrm" data-id="${b.id}" aria-label="Supprimer ${esc(b.name)}">${ICON_TRASH}</button>
      <div class="bagchg">${chargePips(ch,b)}<button class="btn small ghost chgb" data-act="chgedit" data-id="${b.id}" title="${itemCharges(ch,b)?"Modifier le compteur":"Ajouter un compteur (charges, utilisations)"}">${itemCharges(ch,b)?"⚙":"+ compteur"}</button></div></div>`).join("")||`<div class="muted">Le sac est vide.</div>`}</div>
    <form class="row" data-form="bag" style="margin-top:8px"><input id="bag-new" type="text" list="bag-dl" placeholder="Ajouter un objet (ex. Corde de chanvre)" aria-label="Nouvel objet" style="flex:1;min-width:200px"><input id="bag-newq" type="number" min="1" value="1" aria-label="Quantité" style="width:64px"><button class="btn small" type="submit">Ajouter</button></form>
    <datalist id="bag-dl">${[...hbs("objet"),...S.C.items,...S.C.weapons,...S.C.armors].map(w=>`<option value="${esc(w.name)}">`).join("")}</datalist>`;
}
function tabBuild(ch,D){
  const cls=D.cls;
  const opt=(v,l,cur)=>`<option value="${esc(v)}" ${v===cur?"selected":""}>${esc(l)}</option>`;
  const classSel=`<select id="b-class" data-bind="classId"><option value="">— Choisir —</option>${S.C.classes.map(c=>opt(c.id,c.name,ch.classId)).join("")}${hbs("classe").map(h=>opt("hb:"+h._id,h.name+hbTag(h),ch.classId)).join("")}${catOpts("classe").map(([v,l])=>opt(v,l,ch.classId)).join("")}</select>`;
  const subOpts=[...(cls?cls.subclasses.map(s=>["srd:"+s.id,s.name+" (SRD)"]):[]), ...hbs("sous-classe").filter(h=>!h.classId||h.classId===ch.classId).map(h=>["hb:"+h._id,h.name+hbTag(h)]),...catOpts("sous-classe",e=>catClassOk(e,cls))];
  const sel=(id,bind,list,cur)=>`<select id="${id}" data-bind="${bind}"><option value="">— Aucun —</option>${list.map(([v,l])=>opt(v,l,cur)).join("")}</select>`;
  const spOpts=[...S.C.species.map(s=>["srd:"+s.id,s.name]),...hbs("espece").map(h=>["hb:"+h._id,h.name+hbTag(h)]),...catOpts("espece")];
  const bgOpts=[...S.C.backgrounds.map(s=>["srd:"+s.id,s.name]),...hbs("historique").map(h=>["hb:"+h._id,h.name+hbTag(h)]),...catOpts("historique")];
  const armOpts=[["none","Aucune armure"],["mage","Armure du mage (13 + Dex)"],...S.C.armors.filter(a=>a.category!=="bouclier").map(a=>["srd:"+a.id,a.name+" ("+a.ac+(a.dexMax===0?"":a.dexMax?" + Dex max "+a.dexMax:" + Dex")+")"]),["custom","Formule perso"]];
  const skillRows=S.C.skills.map(s=>{const v=+(ch.skills?.[s.id]||0); const fromEff=D.skills[s.id].lv>v;
    return `<label class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:3px 0"><span>${esc(s.name)} <span class="muted" style="font-size:var(--fs-sm)">${ABS[s.ability]}</span>${fromEff?` <span class="badge perso" title="Accordé par un élément de Mes contenus">auto</span>`:""}</span>
      <select id="sk-${s.id}" data-bind="skills.${s.id}" data-num>${[[0,"—"],[1,"Maîtrise"],[2,"Expertise"]].map(([k,l])=>`<option value="${k}" ${k===v?"selected":""}>${l}</option>`).join("")}</select></label>`;}).join("");
  const featOpts=[...S.C.feats.map(f=>["srd:"+f.id,f.name+" — "+f.category]),...hbs("don").map(h=>["hb:"+h._id,h.name+hbTag(h)]),...catOpts("don")];
  const feats=(ch.feats||[]).map((r,i)=>{const n=(hb(r)||srd("feats",r))?.name||"?"; return `<span class="chip">${esc(n)} ${badge(r)} <button class="btn small ghost btndel" data-act="rmList" data-k="feats" data-i="${i}" aria-label="Retirer">${ICON_TRASH}</button></span>`;}).join(" ");
  const aptOpts=hbs("aptitude").map(h=>["hb:"+h._id,h.name]);
  const apts=(ch.features||[]).map((r,i)=>`<span class="chip">${esc(hb(r)?.name||"?")} <button class="btn small ghost btndel" data-act="rmList" data-k="features" data-i="${i}" aria-label="Retirer">${ICON_TRASH}</button></span>`).join(" ");
  const invs=(ch.invocations||[]).map((x,i)=>{ const id=invId(x), iv=S.idx.invocations[id], ck=INV_CHOICE[id], miss=ck&&!invCh(x); const low=iv&&iv.minLevel>D.L; return `<span class="chip${low?" warnchip":""}" ${low?`title="Demande le niveau ${iv.minLevel}"`:""}>${esc(invLabel(x))}${low?` <small>niv. ${iv.minLevel} requis</small>`:""}${miss?` <select data-invfix="${i}" aria-label="Choisir la cible"><option value="">— ${ck==="feat"?"don":"sort mineur"} ? —</option>${invChoices(ch,id).filter(([v])=>!invTaken(ch.invocations,id).includes(v)).map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join("")}</select>`:""} <button class="btn small ghost btndel" data-act="rmList" data-k="invocations" data-i="${i}" aria-label="Retirer">${ICON_TRASH}</button></span>`; }).join(" ");
  const invAvail=invAvailFor(ch,D.L); const invSel=invAvail.some(i=>i.id===S.invSel)?S.invSel:(invAvail[0]||{}).id; const invOpts=invSel?invChoices(ch,invSel).filter(([v])=>!invTaken(ch.invocations,invSel).includes(v)):[];
  const invMax=cls&&cls.id==="occultiste"?cls.columns.find(c=>c.label.startsWith("Manifestations")).values[D.L-1]:0;
  const locked=!S.unlockEdit;
  return `<div class="editbar ${locked?"":"on"}"><button class="btn lock" data-act="lockEdit" aria-pressed="${!locked}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/>${locked?'<path d="M8 11V7a4 4 0 0 1 8 0v4"/>':'<path d="M8 11V7a4 4 0 0 1 7.5-2"/>'}</svg>${locked?"Modifier la fiche":"Verrouiller la fiche"}</button><span class="muted" style="font-size:var(--fs-sm)">${locked?"La fiche est verrouillée pour éviter les modifications par erreur.":"Modification en cours : tout est enregistré automatiquement."}</span></div>
  <fieldset class="bare" ${locked?"disabled":""}><div class="stack">
    <div class="grid2">
      <label class="field"><span>Nom du personnage</span><input id="b-name" type="text" data-bind="name" value="${esc(ch.name||"")}"></label>
      <label class="field"><span>Joueur</span><input id="b-player" type="text" data-bind="player" value="${esc(ch.player||"")}"></label>
      <label class="field"><span>Classe</span>${classSel}</label>
      <label class="field"><span>Niveau</span><input id="b-level" type="number" min="1" max="20" data-bind="level" data-num value="${esc(ch.level||1)}"></label>
      <label class="field"><span>Sous-classe ${cls?`(niveau ${cls.subclassLevel})`:""}</span>${sel("b-sub","subclass",subOpts,ch.subclass)}</label>
      <label class="field"><span>Espèce</span>${sel("b-species","species",spOpts,ch.species)}</label>
      <label class="field"><span>Historique</span>${sel("b-bg","background",bgOpts,ch.background)}</label>
    </div>
    ${cls?`<div class="muted" style="font-size:var(--fs-sm)">${esc(cls.name)} : dé de vie d${cls.hitDie}, sauvegardes ${cls.saves.map(a=>ABN[a]).join(" et ")}, ${cls.skillChoices.count} compétences parmi ${cls.skillChoices.from.length===18?"toutes":cls.skillChoices.from.map(id=>S.C.skills.find(s=>s.id===id).name).join(", ")}. Armes : ${esc(cls.weapons)}.</div>`:""}
    <div class="sect"><h2>Valeurs de caractéristique</h2><span class="muted" style="font-size:var(--fs-sm)">Saisis les valeurs finales, bonus d'historique compris.</span></div>
    <div class="row">${AB.map(a=>`<label class="field"><span>${ABN[a]}</span><input id="b-${a}" type="number" min="1" max="30" data-bind="abilities.${a}" data-num value="${esc(ch.abilities?.[a]??10)}"></label>`).join("")}</div>${AB.some(a=>+(ch.abilities?.[a]??10)>20)?`<div class="muted warntxt" style="font-size:var(--fs-sm)">Au-delà de 20, une valeur ne s'obtient qu'avec un objet ou une aptitude (Champion primitif, faveur épique). Maximum absolu : 30.</div>`:""}
    <div class="grid2">
      <div><div class="sect"><h2>Compétences</h2></div>${skillRows}</div>
      <div class="stack">
        <div><div class="sect"><h2>Défense et santé</h2></div>
          <div class="stack">
          <label class="field"><span>Armure</span><select id="b-armor" data-bind="armor">${armOpts.map(([v,l])=>opt(v,l,ch.armor||"none")).join("")}</select></label>
          ${ch.armor==="custom"?`<label class="field"><span>Formule de CA (ex. 13+dex, 10+dex+sag)</span><input id="b-acf" type="text" data-bind="acCustom" value="${esc(ch.acCustom||"")}"></label>`:""}
          <label class="row"><input id="b-shield" type="checkbox" data-bind="shield" ${ch.shield?"checked":""}> Bouclier (+2)</label>
          <label class="field"><span>Bonus de CA divers</span><input id="b-acb" type="number" data-bind="acBonus" data-num value="${esc(ch.acBonus||0)}"></label>
          <label class="field"><span>Points de vie maximum</span><select id="b-hpmode" data-bind="hpMode">${opt("auto","Calcul automatique ("+D.hpAuto+")",ch.hpMode||"auto")}${opt("manual","Valeur saisie",ch.hpMode)}</select></label>
          ${ch.hpMode==="manual"?`<input id="b-hpmax" type="number" data-bind="hpMaxManual" data-num value="${esc(ch.hpMaxManual||D.hpAuto)}" aria-label="PV max">`:""}
          <label class="field"><span>Bonus de vitesse (m)</span><input id="b-speed" type="number" step="1.5" data-bind="speedBonus" data-num value="${esc(ch.speedBonus||0)}"></label>
          <div class="field"><span>Maîtrises de sauvegarde supplémentaires</span><div class="row">${AB.map(a=>`<label class="row" style="gap:4px"><input id="b-sv-${a}" type="checkbox" data-act="saveProf" data-v="${a}" ${(ch.saveProfs||[]).includes(a)?"checked":""}>${ABS[a]}</label>`).join("")}</div></div>
          </div></div>
        <div><div class="sect"><h2>Dons</h2></div><div class="row">${feats||`<span class="muted">Aucun</span>`}</div>
          <div class="row" style="margin-top:6px">${sel("addFeatSel","",featOpts,"").replace('data-bind=""','')}<button class="btn small" data-act="addList" data-k="feats" data-src="addFeatSel">Ajouter</button></div></div>
        ${cls&&cls.id==="occultiste"?`<div><div class="sect"><h2>Manifestations occultes</h2><span class="num ${(ch.invocations||[]).length>invMax?"warntxt":"muted"}">${(ch.invocations||[]).length}/${invMax}${(ch.invocations||[]).length>invMax?" · une de trop":""}</span></div><div class="row">${invs||`<span class="muted">Aucune</span>`}</div>
          <div class="row" style="margin-top:6px"><select id="addInvSel" data-act-change="invsel" aria-label="Manifestation">${invAvail.map(i=>`<option value="${i.id}" ${i.id===invSel?"selected":""}>${esc(i.name)}${i.repeatable?" (répétable)":""}${i.prerequisite?" — "+esc(i.prerequisite):""}</option>`).join("")}</select>${invSel&&INV_CHOICE[invSel]?`<select id="addInvCh" aria-label="Cible de la manifestation">${invOpts.length?invOpts.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join(""):`<option value="">${INV_CHOICE[invSel]==="feat"?"Aucun don":"Aucun sort mineur compatible"}</option>`}</select>`:""}<button class="btn small" data-act="addInv">Ajouter</button></div>
          <div class="muted" style="font-size:var(--fs-sm);margin-top:4px">Automatisés : Armure d'ombres (choisis « Armure du mage »), Décharge déchirante (Cha aux dégâts du sort choisi), Décharge répulsive et Lance occulte (rappel dans la carte du sort), Enseignement des Premiers-Nés (le don choisi s'ajoute à la fiche), Pacte de la lame (option « arme de pacte »), Frappe occulte (dans la carte de l'arme de pacte).</div>
          ${Object.keys(D.arc||{}).length?`<div class="sect"><h2>Arcanum mystique</h2></div><div class="stack">${Object.entries(D.arc).map(([sl,r])=>`<label class="field"><span>Sort de niveau ${sl}</span><select data-arcsel="${sl}"><option value="">— Choisir —</option>${classSpells(D,+sl).map(x=>`<option value="${esc(x.ref)}" ${x.ref===r?"selected":""}>${esc(x.s.name)}</option>`).join("")}</select></label>`).join("")}</div>`:""}</div>`:""}
        <div><div class="sect"><h2>Aptitudes perso</h2></div><div class="row">${apts||`<span class="muted">Aucune</span>`}</div>
          ${aptOpts.length?`<div class="row" style="margin-top:6px"><select id="addAptSel" aria-label="Aptitude perso">${aptOpts.map(([v,l])=>`<option value="${v}">${esc(l)}</option>`).join("")}</select><button class="btn small" data-act="addList" data-k="features" data-src="addAptSel">Ajouter</button></div>`:`<div class="muted" style="font-size:var(--fs-sm)">Crée des aptitudes dans « Mes contenus ».</div>`}</div>
      </div>
    </div></div></fieldset>`;
}
 
/* ----- dice panel ----- */
function renderDice(){
  const el=document.getElementById("dice"); if(!el) return;
  el.innerHTML=`<div class="sect" style="margin-top:0"><h2>Jets</h2>${S.log.length?`<button class="btn small ghost" data-act="clearLog">Effacer</button>`:""}</div>
    <div class="adv" role="group" aria-label="Mode du prochain d20">${[["n","Normal"],["a","Avantage"],["d","Désavantage"]].map(([k,l])=>`<button aria-pressed="${S.adv===k}" data-act="adv" data-v="${k}">${l}</button>`).join("")}</div>
    <div class="log">${S.log.map(e=>`<div class="roll ${e.crit?"crit":""} ${e.fumble?"fumble":""}"><span class="t"><b>${esc(e.label)}</b>${e.crit?" · 20 naturel":""}${e.fumble?" · 1 naturel":""}</span><span class="tot">${e.total}</span><span class="bd">${esc(e.bd)}</span></div>`).join("")||`<div class="muted" style="font-size:var(--fs-sm)">${virtualDiceEnabled()?"Clique sur un bonus de la fiche pour lancer le dé. L’avantage s’applique au prochain d20 seulement.":"Dés virtuels désactivés. Utilise À la table pour saisir tes dés physiques."}</div>`}</div>
    <form class="freeroll" data-form="free"><input id="freeExpr" type="text" placeholder="ex. 2d6+3" aria-label="Jet libre"><label>Total des dés physiques <input name="physical" type="number" inputmode="numeric" min="0" step="1"></label><button class="btn small" type="submit">Appliquer</button><button data-virtual class="btn small" type="submit" name="virtual" value="1">Lancer</button></form>`;
  syncDiceInputMode();
}
 
/* ----- homebrew ----- */
function viewHb(){
  const all=hbs().filter(h=>!S.hbFilter||h.kind===S.hbFilter);
  const sel=S.hbSel&&S.docs[S.hbSel]?Object.assign({_id:S.hbSel},S.docs[S.hbSel]):null;
  return `<div class="list-head"><div><h1>Mes contenus</h1><div class="muted">Ton homebrew et ce que tu saisis depuis tes livres. Chaque élément sert à tous tes personnages.</div></div>
    <div class="row"><select id="hbNewKind" aria-label="Type">${Object.entries(HB_KINDS).map(([k,l])=>`<option value="${k}">${l}</option>`).join("")}</select><button class="btn primary" data-act="hbNew">Créer</button><button class="btn" data-act="catPick">Depuis le catalogue</button></div></div>
    <div class="hb-layout"><div class="panel" style="padding:0">
      <div style="padding:8px"><select id="hbFilter" data-act-change="hbFilter" aria-label="Filtrer"><option value="">Tous les types</option>${Object.entries(HB_KINDS).map(([k,l])=>`<option value="${k}" ${S.hbFilter===k?"selected":""}>${l}</option>`).join("")}</select></div>
      ${all.map(h=>`<button class="hb-item" data-act="hbSel" data-id="${h._id}" aria-current="${S.hbSel===h._id}"><span>${esc(h.name)}</span><span class="muted" style="font-size:var(--fs-sm)">${HB_KINDS[h.kind]}${h.pending?" · à remplir":""}</span></button>`).join("")||`<div class="muted" style="padding:12px">Rien pour l'instant.</div>`}
    </div><div>${sel?hbEditor(sel):`<div class="empty">Choisis un élément à gauche, ou crée un sort, un don, une sous-classe, une espèce, un historique, une aptitude ou un objet. Les effets que tu ajoutes (bonus, maîtrises, ressources, attaques, sorts accordés) sont appliqués automatiquement sur la fiche.</div>`}</div></div>`;
}
function hbEditor(h){
  const id=h._id, b=k=>`data-hb="${id}" data-bind="${k}"`;
  let h1=`<div class="panel stack"><div class="row" style="justify-content:space-between"><span class="badge perso">Hors SRD · ${HB_KINDS[h.kind]}</span>
    ${S.confirm==="hbdel:"+id?`<button class="btn small danger" data-act="hbDel" data-id="${id}">Confirmer la suppression</button>`:`<button class="btn small ghost danger" data-act="ask" data-v="hbdel:${id}">Supprimer</button>`}</div>
    <div class="grid2"><label class="field"><span>Nom</span><input id="hb-name" type="text" ${b("name")} value="${esc(h.name)}"></label>
    <label class="field"><span>Livre (vide = Personnalisée)</span><input id="hb-label" type="text" ${b("label")} value="${esc(h.label||"")}" placeholder="Manuel des joueurs (2024), Xanathar…"></label></div>
    <div class="row" style="align-items:flex-end;gap:8px"><label class="field" style="flex:1;min-width:200px"><span>Lien (AideDD ou autre)</span><input id="hb-link" type="url" ${b("link")} value="${esc(h.link||"")}" placeholder="https://www.aidedd.org/…"></label>
    <button class="btn small ghost" data-act="hbGuessLink" data-id="${id}" title="Propose l'adresse AideDD d'après le nom">Proposer un lien AideDD</button>${linkHtml(h)}</div>${afBtn(`data-mode="hb" data-id="${id}"`)}`;
  if(h.kind==="sort"){
    h1+=`<div class="grid2">
      <label class="field"><span>Niveau (0 = mineur)</span><input id="hb-lvl" type="number" min="0" max="9" ${b("level")} data-num value="${esc(h.level||0)}"></label>
      <label class="field"><span>École</span><input id="hb-school" type="text" ${b("school")} value="${esc(h.school||"")}"></label>
      <label class="field"><span>Temps d'incantation</span><input id="hb-ct" type="text" ${b("casting_time")} value="${esc(h.casting_time||"")}"></label>
      <label class="field"><span>Portée</span><input id="hb-rg" type="text" ${b("range")} value="${esc(h.range||"")}"></label>
      <label class="field"><span>Composantes</span><input id="hb-cp" type="text" ${b("components")} value="${esc(h.components||"")}"></label>
      <label class="field"><span>Durée</span><input id="hb-du" type="text" ${b("duration")} value="${esc(h.duration||"")}"></label></div>
      <div class="row"><label class="row"><input id="hb-conc" type="checkbox" ${b("concentration")} ${h.concentration?"checked":""}>Concentration</label><label class="row"><input id="hb-rit" type="checkbox" ${b("ritual")} ${h.ritual?"checked":""}>Rituel</label></div>
      <div class="sect"><h2>Mécanique</h2><span class="muted" style="font-size:var(--fs-sm)">Pour les boutons de jet de la fiche.</span></div>
      <div class="grid2">
      <label class="row"><input id="hb-matk" type="checkbox" ${b("mech.attack")} ${h.mech?.attack?"checked":""}>Attaque de sort</label>
      <label class="field"><span>Jet de sauvegarde</span><select id="hb-msave" ${b("mech.save")}><option value="">Aucun</option>${AB.map(a=>`<option value="${ABN[a]}" ${h.mech?.save===ABN[a]?"selected":""}>${ABN[a]}</option>`).join("")}</select></label>
      <label class="field"><span>Dés (ex. 2d10)</span><input id="hb-mdice" type="text" ${b("mech.dice")} value="${esc(h.mech?.dice||"")}"></label>
      <label class="field"><span>Type de dégâts</span><input id="hb-mtype" type="text" ${b("mech.dmgType")} value="${esc(h.mech?.dmgType||"")}"></label>
      <label class="field"><span>Dés en plus par niveau d'emplacement</span><input id="hb-mup" type="text" ${b("mech.upDice")} value="${esc(h.mech?.upDice||"")}" placeholder="ex. 1d10"></label>
      <label class="row"><input id="hb-mheal" type="checkbox" ${b("mech.heal")} ${h.mech?.heal?"checked":""}>Soins (et non dégâts)</label>
      <label class="row"><input id="hb-mmod" type="checkbox" ${b("mech.addMod")} ${h.mech?.addMod?"checked":""}>Ajouter le modificateur d'incantation</label><label class="field"><span>PV temporaires par niveau d'emplacement</span><input id="hb-mtemp" type="number" min="0" ${b("mech.tempHp")} data-num value="${esc(h.mech?.tempHp||"")}" placeholder="ex. 5"></label></div>`;
  }
  if(h.kind==="objet"){
    h1+=`<div class="grid2"><label class="field"><span>Dés de dégâts (si arme)</span><input id="hb-dice" type="text" ${b("dice")} value="${esc(h.dice||"")}" placeholder="ex. 1d8"></label>
      <label class="field"><span>Type de dégâts</span><input id="hb-dtype" type="text" ${b("dmgType")} value="${esc(h.dmgType||"")}"></label>
      <label class="field"><span>Propriétés</span><input id="hb-props" type="text" ${b("properties")} value="${esc(h.properties||"")}" placeholder="Finesse, Légère…"></label></div>`;
  }
  if(h.kind==="espece") h1+=`<label class="field"><span>Vitesse (m)</span><input id="hb-speed" type="number" step="1.5" ${b("speed")} data-num value="${esc(h.speed||9)}"></label>`;
  if(h.kind==="sous-classe") h1+=`<label class="field"><span>Classe</span><select id="hb-cls" ${b("classId")}><option value="">Toutes</option>${S.C.classes.map(c=>`<option value="${c.id}" ${h.classId===c.id?"selected":""}>${c.name}</option>`).join("")}${hbs("classe").map(c=>`<option value="hb:${c._id}" ${h.classId==="hb:"+c._id?"selected":""}>${esc(c.name)} (hors SRD)</option>`).join("")}</select></label>`;
  h1+=`<label class="field"><span>Description</span><textarea id="hb-text" ${b("text")}>${esc(h.text||"")}</textarea></label>`;
  if(h.kind==="classe") h1+=hbClassEditor(id,h);
  if(h.kind==="sous-classe"||h.kind==="classe"){
    h1+=`<div class="sect"><h2>Aptitudes par niveau</h2><button class="btn small" data-act="hbAddFeat" data-id="${id}">Ajouter une aptitude</button></div>${h.kind==="classe"?`<div class="muted" style="font-size:var(--fs-sm)">Les améliorations de caractéristique sont ajoutées automatiquement aux niveaux indiqués plus haut.</div>`:""}`;
    (h.features||[]).forEach((f,i)=>{
      h1+=`<div class="panel stack" style="background:var(--sheet2)"><div class="row"><label class="field" style="width:90px"><span>Niveau</span><input id="hbf-l-${i}" type="number" min="1" max="20" ${b("features."+i+".level")} data-num value="${esc(f.level||3)}"></label>
        <label class="field" style="flex:1;min-width:180px"><span>Nom</span><input id="hbf-n-${i}" type="text" ${b("features."+i+".name")} value="${esc(f.name||"")}"></label>
        <button class="btn small ghost danger" data-act="hbRmFeat" data-id="${id}" data-i="${i}">Retirer</button></div>
        <textarea id="hbf-t-${i}" ${b("features."+i+".text")} style="min-height:70px">${esc(f.text||"")}</textarea>
        ${effectsEditor(id,"features."+i+".effects",f.effects||[])}</div>`;
    });
  } else if(h.kind!=="sort") h1+=effectsEditor(id,"effects",h.effects||[]);
  return h1+`</div>`;
}
const EFF_TYPES={bonus:"Bonus",maitrise:"Maîtrise",ressource:"Ressource",reserve:"Réserve de dés",attaque:"Attaque",sorts:"Sorts toujours préparés"};
function bonusTargets(){ return [["ca","CA"],["ca_armure","CA en armure"],["init","Initiative"],["vitesse","Vitesse (m)"],["pvmax","PV max"],["pvniv","PV par niveau"],["attaque","Attaques d'arme"],["attaque_dist","Attaques à distance"],["attaque_sort","Attaques de sort"],["degats","Dégâts d'arme"],["dd","DD des sorts"],["jds:all","Tous les JS"],...AB.map(a=>["jds:"+a,"JS "+ABN[a]]),...S.C.skills.map(s=>["comp:"+s.id,s.name])]; }
function effectsEditor(id,path,effs){
  const b=k=>`data-hb="${id}" data-bind="${path}.${k}"`;
  const o=(v,l,c)=>`<option value="${esc(v)}" ${v===c?"selected":""}>${esc(l)}</option>`;
  let h=`<div class="sect"><h2 style="font-size:var(--fs-lg)">Effets automatiques</h2><div class="row"><select id="eff-new-${path.replace(/\W/g,"")}" aria-label="Type d'effet">${Object.entries(EFF_TYPES).map(([k,l])=>o(k,l)).join("")}</select><button class="btn small" data-act="effAdd" data-id="${id}" data-path="${path}" data-src="eff-new-${path.replace(/\W/g,"")}">Ajouter</button></div></div>`;
  effs.forEach((e,i)=>{
    const p=i+"";
    let f=`<b style="font-size:var(--fs-sm)">${EFF_TYPES[e.t]||e.t}</b>`;
    if(e.t==="bonus") f+=`<select ${b(p+".cible")} aria-label="Cible">${bonusTargets().map(([v,l])=>o(v,l,e.cible)).join("")}</select><input type="text" ${b(p+".val")} value="${esc(e.val||"")}" placeholder="2, mb, niv…" aria-label="Valeur" style="width:90px">`;
    if(e.t==="maitrise") f+=`<select ${b(p+".cible")} aria-label="Cible">${[...S.C.skills.map(s=>["comp:"+s.id,s.name]),...AB.map(a=>["jds:"+a,"JS "+ABN[a]])].map(([v,l])=>o(v,l,e.cible)).join("")}</select><select ${b(p+".niveau")} data-num aria-label="Niveau">${o(1,"Maîtrise",+e.niveau||1)}${o(2,"Expertise",+e.niveau)}</select>`;
    if(e.t==="ressource") f+=`<input type="text" ${b(p+".nom")} value="${esc(e.nom||"")}" placeholder="Nom" aria-label="Nom"><input type="text" ${b(p+".max")} value="${esc(e.max||"")}" placeholder="max (ex. mb, cha, 2)" aria-label="Maximum" style="width:120px"><select ${b(p+".recharge")} aria-label="Recharge">${o("long","Repos long",e.recharge||"long")}${o("court","Repos court",e.recharge)}</select>`;
    if(e.t==="reserve") f+=`<input type="text" ${b(p+".nom")} value="${esc(e.nom||"")}" placeholder="Nom" aria-label="Nom"><input type="text" ${b(p+".des")} value="${esc(e.des||"")}" placeholder="nb de dés (ex. niv+1)" aria-label="Nombre de dés" style="width:130px"><span>d</span><input type="number" ${b(p+".face")} data-num value="${esc(e.face||6)}" aria-label="Faces" style="width:60px"><input type="text" ${b(p+".maxUse")} value="${esc(e.maxUse||"")}" placeholder="max/utilisation" aria-label="Max par utilisation" style="width:120px"><select ${b(p+".recharge")} aria-label="Recharge">${o("long","Repos long",e.recharge||"long")}${o("court","Repos court",e.recharge)}</select>`;
    if(e.t==="attaque") f+=`<input type="text" ${b(p+".nom")} value="${esc(e.nom||"")}" placeholder="Nom" aria-label="Nom"><select ${b(p+".carac")} aria-label="Caractéristique">${o("sort","Carac. d'incantation",e.carac||"sort")}${AB.map(a=>o(a,ABN[a],e.carac)).join("")}</select><input type="text" ${b(p+".des")} value="${esc(e.des||"")}" placeholder="1d8" aria-label="Dés" style="width:80px"><input type="text" ${b(p+".type")} value="${esc(e.type||"")}" placeholder="type" aria-label="Type" style="width:100px"><label class="row" style="gap:4px"><input type="checkbox" ${b(p+".ajoutMod")} ${e.ajoutMod?"checked":""}>+ mod aux dégâts</label>`;
    if(e.t==="sorts") f+=`<input type="text" ${b(p+".noms")} value="${esc(e.noms||"")}" placeholder="Soins, Aide, Lumière" aria-label="Sorts" style="flex:1;min-width:200px">`;
    f+=`<button class="btn small ghost danger btndel" data-act="effRm" data-id="${id}" data-path="${path}" data-i="${i}" aria-label="Retirer l'effet">${ICON_TRASH}</button>`;
    h+=`<div class="effect">${f}</div>`;
  });
  return h+`<div class="muted" style="font-size:var(--fs-sm)">Valeurs : un nombre, ou une formule avec niv (niveau), mb (bonus de maîtrise), for, dex, con, int, sag, cha (modificateurs). Exemple : niv+1.</div>`;
}
 
/* ----- compendium ----- */
function viewComp(){
  const q=norm(S.comp.q), t=S.comp.type;
  const types={sorts:"Sorts",classes:"Classes",dons:"Dons",especes:"Espèces",historiques:"Historiques",manif:"Manifestations occultes",regles:"Règles et états",armes:"Armes et armures"};
  let items=[];
  if(t==="sorts") items=S.C.spells.map(s=>({n:s.name,sub:(s.level?"Niveau "+s.level:"Sort mineur")+" · "+s.school+" · "+s.classes.join(", "),txt:[s.casting_time,s.range,s.components,s.duration].join(" · ")+"\n"+s.text}));
  if(t==="classes") items=S.C.classes.flatMap(c=>[...c.features.map(f=>({n:f.name,sub:c.name+" · niveau "+f.level,txt:f.text})),...c.subclasses.flatMap(s=>s.features.map(f=>({n:f.name,sub:s.name+" · niveau "+f.level,txt:f.text})))]);
  if(t==="dons") items=S.C.feats.map(f=>({n:f.name,sub:f.category,txt:f.text}));
  if(t==="especes") items=S.C.species.map(s=>({n:s.name,sub:"Vitesse "+String(s.speed).replace(".",",")+" m",txt:s.text}));
  if(t==="historiques") items=S.C.backgrounds.map(s=>({n:s.name,sub:"Don : "+s.feat,txt:s.text}));
  if(t==="manif") items=S.C.invocations.map(s=>({n:s.name,sub:s.prerequisite||"Sans prérequis",txt:s.text}));
  if(t==="regles") items=S.C.glossary.map(s=>({n:s.name,sub:s.tag||"Règle",txt:s.text}));
  if(t==="armes") items=[...S.C.weapons.map(w=>({n:w.name,sub:"Arme "+w.category+" · "+w.damage+" "+w.damageType,txt:"Propriétés : "+w.properties+"\nBotte : "+w.mastery+"\nPoids : "+w.weight+" · Prix : "+w.cost})),...S.C.armors.map(a=>({n:a.name,sub:"Armure "+a.category,txt:"CA "+a.ac+(a.dexMax===0?"":a.dexMax?" + Dex (max "+a.dexMax+")":" + Dex")+(a.strength?"\nForce "+a.strength:"")+(a.stealthDisadvantage?"\nDésavantage en Discrétion":"")+"\nPoids : "+a.weight+" · Prix : "+a.cost}))];
  if(q) items=items.filter(i=>norm(i.n).includes(q)||norm(i.sub).includes(q));
  const shown=items.slice(0,120);
  return `<div class="list-head"><div><h1>Catalogue</h1><div class="muted">Tout le SRD 5.2.1 en français, consultable et cherchable.</div></div></div>
    <div class="row" style="margin-bottom:12px"><select id="compType" data-act-change="compType" aria-label="Catégorie">${Object.entries(types).map(([k,l])=>`<option value="${k}" ${t===k?"selected":""}>${l}</option>`).join("")}</select>
    <form data-form="comp" class="row" style="flex:1"><input id="compQ" type="text" value="${esc(S.comp.q)}" placeholder="Chercher un nom, une classe, une école…" style="flex:1;min-width:180px" aria-label="Recherche"><button class="btn" type="submit">Chercher</button></form></div>
    <div class="muted" style="font-size:var(--fs-sm);margin-bottom:6px">${items.length} résultat${items.length>1?"s":""}${items.length>120?" (120 affichés, affine ta recherche)":""}</div>
    <div class="panel">${shown.map(i=>`<details class="feat"><summary><span class="nm">${esc(i.n)}</span><span class="muted" style="font-size:var(--fs-sm)">${esc(i.sub)}</span></summary><div class="prose">${prose(i.txt)}</div></details>`).join("")||`<div class="muted">Aucun résultat.</div>`}</div>`;
}
 
/* ----- modal: spell picker & attack editor ----- */
