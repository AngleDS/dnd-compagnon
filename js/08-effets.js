/* ---------- Défenses et effets en cours (chantier 5, version légère validée par Angle le 13 nov. 2026) ----------
   Défenses : résistances, immunités, vulnérabilités, immunités aux états. Pas de tuile (elles ne servent qu'au moment de
   subir des dégâts) : la fenêtre s'ouvre depuis « Dégâts subis », depuis « États et effets » et par la loupe.
   Préremplies depuis l'espèce seulement quand c'est sûr ; marquées « espèce » ; le joueur peut les retirer ou en ajouter.
   L'appli facilite, le joueur décide : le calcul des dégâts typés est montré, c'est lui qui valide. */
const DMG_TYPES=["Acide","Contondant","Feu","Force","Foudre","Froid","Nécrotique","Perforant","Poison","Psychique","Radiant","Tonnerre","Tranchant"];
const DEF_CATS=[["res","Résistances","dégâts divisés par 2"],["imm","Immunités","aucun dégât"],["vul","Vulnérabilités","dégâts doublés"],["cond","Immunités aux états",""]];
// Défenses sûres par espèce (SRD 5.2.1). Drakéide et Tieffelin dépendent du lignage choisi : saisie à la main (chantier 13).
const DEF_SPECIES={"srd:nain":{res:["Poison"]}};
function defenses(ch){ const own=ch.defenses||{}, off=own.off||[], sp=DEF_SPECIES[ch.species]||{}, out={};
  for(const [c] of DEF_CATS){ const L=[]; for(const v of sp[c]||[]) if(!off.includes(c+":"+v)) L.push({v,src:"espèce"});
    for(const v of own[c]||[]) if(!L.some(x=>x.v===v)) L.push({v,src:""}); out[c]=L; }
  return out; }
function defHas(ch,c,v){ return defenses(ch)[c].some(x=>x.v===v); }
function defToggle(ch,c,v){ const own=ch.defenses=Object.assign({},ch.defenses||{}), key=c+":"+v, sp=(DEF_SPECIES[ch.species]||{})[c]||[];
  if(sp.includes(v)){ const off=own.off||[]; own.off=off.includes(key)?off.filter(x=>x!==key):[...off,key]; }
  else { const L=own[c]||[]; own[c]=L.includes(v)?L.filter(x=>x!==v):[...L,v]; } }
// Résumé court : « poison » ; plusieurs catégories : « résistance poison · immunité feu »
function defSummary(ch){ const d=defenses(ch), W={res:"résistance",imm:"immunité",vul:"vulnérabilité",cond:"immunité aux états"};
  const used=DEF_CATS.filter(([c])=>d[c].length); if(!used.length) return "";
  if(used.length===1&&used[0][0]==="res") return d.res.map(x=>x.v.toLowerCase()).join(", ");
  return used.map(([c])=>W[c]+" "+d[c].map(x=>x.v.toLowerCase()).join(", ")).join(" · "); }
// Dégâts typés : immunité → 0 ; résistance → moitié arrondie à l'inférieur ; vulnérabilité → double (après la résistance)
function dmgTyped(ch,n,type){ if(!type) return {n,why:""};
  if(defHas(ch,"imm",type)) return {n:0,why:"Immunité "+type.toLowerCase()};
  let v=n; const why=[]; if(defHas(ch,"res",type)){ v=Math.floor(v/2); why.push("résistance"); } if(defHas(ch,"vul",type)){ v=v*2; why.push("vulnérabilité"); }
  return {n:v,why:why.length?(why.join(" et ")+" "+type.toLowerCase()).replace(/^./,x=>x.toUpperCase()):""}; }
function defPop(ch,D,wrap){ const T=S.T, d=defenses(ch), edit=T.defEdit||null;
  const opts=c=>c==="cond"?CONDS:DMG_TYPES;
  const rows=DEF_CATS.map(([c,lab,sub])=>{ const on=d[c];
    const list=edit===c
      ? `<div class="condgrid" style="margin-top:6px">${opts(c).map(v=>{ const x=on.find(y=>y.v===v); return `<span class="condpick"><button class="chip" aria-pressed="${!!x}" data-act="defTog" data-c="${c}" data-v="${esc(v)}">${esc(v)}${x&&x.src?` <span class="badge srd">${x.src}</span>`:""}</button></span>`; }).join("")}</div>`
      : `<div class="row defrow" style="gap:6px;flex-wrap:wrap;margin-top:6px">${on.length?on.map(x=>`<span class="chip" aria-pressed="true">${esc(x.v)}${x.src?` <span class="badge srd">${x.src}</span>`:""}</span>`).join(""):`<span class="muted" style="font-size:var(--fs-sm)">Aucune</span>`}</div>`;
    return `<div class="lusec"><div class="row" style="justify-content:space-between;align-items:center"><div class="label">${lab}${sub?` <span class="muted" style="text-transform:none;letter-spacing:0">· ${sub}</span>`:""}</div><button class="btn small" data-act="defEdit" data-c="${c}">${edit===c?"Fini":"+ Ajouter"}</button></div>${list}</div>`; }).join("");
  const sp=DEF_SPECIES[ch.species]?`« espèce » : vient de ton espèce. Tu peux la retirer ou ajouter les tiennes. `:"";
  return wrap("Défenses",rows+`<div class="muted" style="font-size:var(--fs-sm);margin-top:12px">${sp}Les défenses servent dans « Dégâts subis » : choisis le type de dégâts, le calcul est montré.</div>`); }
// « Dégâts subis » : calcul montré dès que le montant et le type sont saisis ; le bouton annonce ce qui sera appliqué
function hpCalcShow(){ const amt=document.getElementById("hp-amt"), ty=document.getElementById("hp-type"), out=document.getElementById("hp-calc"); if(!amt||!ty||!out) return;
  const n=parseInt(amt.value,10), btn=document.querySelector(".hpbox button[type=submit]"), ch=cur();
  if(!(n>0)||!ty.value||!ch){ out.hidden=true; if(btn) btn.textContent="Appliquer les dégâts"; return; }
  const r=dmgTyped(ch,n,ty.value); out.hidden=!r.why; out.innerHTML=r.why?esc(r.why)+" : <b class=\"num\">"+n+" → "+r.n+"</b> dégât"+(r.n>1?"s":""):"";
  if(btn) btn.textContent=r.n?"Appliquer "+r.n+" dégât"+(r.n>1?"s":""):"Aucun dégât (immunité)"; }
document.addEventListener("input",e=>{ if(e.target&&e.target.id==="hp-amt") hpCalcShow(); });
document.addEventListener("change",e=>{ if(e.target&&e.target.id==="hp-type") hpCalcShow(); });
/* Effets actifs : nom, durée en texte, provenance, note, « Terminé ». Pas de compte à rebours : rounds et durées décomptées
   viendront avec le Mode combat (chantier 28). Un sort de concentration suivi s'arrête avec la concentration, et l'inverse. */
const FX_DURS=["1 minute","10 minutes","1 heure","8 heures","24 heures","Jusqu’à dissipation"];
function spellDur(sp){ const d=String(sp&&sp.duration||"").trim(); if(!d||/instantan/i.test(d)) return "";
  return d.replace(/^Concentration,\s*/i,"").replace(/^jusqu[’']à\s*/i,"").replace(/^./,x=>x.toUpperCase()); }
function fxList(ch){ return (ch.effects||[]).filter(e=>!e.conc||ch.conc===e.name); }
function fxAdd(ch,e){ ch.effects=[...fxList(ch).filter(x=>x.name!==e.name),Object.assign({id:uid()},e)]; }
function fxDone(ch,id){ const e=(ch.effects||[]).find(x=>x.id===id); ch.effects=fxList(ch).filter(x=>x.id!==id); if(e&&e.conc&&ch.conc===e.name) ch.conc=""; }
function fxSection(ch){ const L=fxList(ch), ds=defSummary(ch);
  const row=e=>`<div class="fxrow"><div><b>${esc(e.name)}</b><div class="muted" style="font-size:var(--fs-sm)">${[e.dur||"Sans durée",e.src,e.conc?"concentration":""].filter(Boolean).map(esc).join(" · ")}</div>${e.note?`<div style="font-size:var(--fs-sm)">${esc(e.note)}</div>`:""}</div><button class="btn small" data-act="fxDone" data-id="${esc(e.id)}">Terminé</button></div>`;
  return `<div class="lusec fxsec"><div class="label">Effets actifs</div>${L.length?L.map(row).join(""):`<div class="muted" style="font-size:var(--fs-sm);margin:6px 0">Aucun effet en cours.</div>`}<button class="btn fxadd" data-act="tpop" data-v="fxadd">+ Ajouter un effet</button>`
    +`<button class="fxdef" data-act="tpop" data-v="def"><span><span class="label">Défenses</span> <b>${esc(ds||"aucune")}</b></span><span class="muted">Voir ›</span></button></div>`; }
function fxAddPop(ch,D,wrap){ const T=S.T, sps=(ch.spells||[]).map(s=>({ref:s.ref,sp:spellOf(s.ref)})).filter(x=>x.sp&&spellDur(x.sp));
  const chip=d=>`<span class="condpick"><button type="button" class="chip" aria-pressed="${T.fxDur===d}" data-act="fxDur" data-v="${esc(d)}">${esc(d)}</button></span>`;
  return wrap("Ajouter un effet",`<form id="fxform" data-form="fxadd" class="stack" novalidate>
    ${sps.length?`<div class="lusec"><div class="label">Depuis un de tes sorts</div><label class="field"><span>Sort</span><select id="fx-sp"><option value="">—</option>${sps.map(x=>`<option value="${esc(x.ref)}">${esc(x.sp.name)} (${esc(spellDur(x.sp).toLowerCase())}${x.sp.concentration?", concentration":""})</option>`).join("")}</select></label></div>`:""}
    <div class="lusec"><div class="label">${sps.length?"Ou à la main":"À la main"}</div><label class="field"><span>Nom</span><input id="fx-name" type="text" maxlength="60" placeholder="ex. Potion de résistance"></label>
      <div class="label" style="margin-top:8px">Durée</div><div class="condgrid" style="margin-top:6px">${FX_DURS.map(chip).join("")}</div>
      <label class="field" style="margin-top:8px"><span>Note (facultatif)</span><input id="fx-note" type="text" maxlength="120"></label></div></form>`
    +winFoot(`<button class="btn primary" type="submit" form="fxform">Ajouter</button>`)); }
function fxSubmit(){ const ch=cur(); if(!ch) return; const v=id=>(document.getElementById(id)?.value||"").trim(), ref=v("fx-sp"), name=v("fx-name"), note=v("fx-note");
  if(ref){ const sp=spellOf(ref); if(!sp) return; if(sp.concentration) ch.conc=sp.name; fxAdd(ch,{name:sp.name,dur:spellDur(sp),src:"ton sort",conc:!!sp.concentration,note}); }
  else if(name) fxAdd(ch,{name,dur:S.T.fxDur||"",src:"",note});
  else { setBanner("Choisis un de tes sorts ou donne un nom à l’effet."); return; }
  S.T.fxDur=null; S.T.pop="cond"; touch(S.cur); render(); }
// Après un sort à durée, la fenêtre « Lancé » propose de le suivre (un toucher) ; rien n'est ajouté tout seul.
function fxFollowHtml(ch,sp,ref){ const dur=spellDur(sp); if(!dur) return "";
  if(fxList(ch).some(e=>e.name===sp.name)) return `<div class="muted fxfollowed" style="font-size:var(--fs-sm);margin-top:12px">✓ Suivi dans « États et effets ».</div>`;
  return `<div class="row" style="margin-top:12px"><button class="btn fxfollow" data-act="fxFollow" data-ref="${esc(ref)}">⏱ Suivre l’effet (${esc(dur.toLowerCase())})</button></div><div class="muted" style="font-size:var(--fs-sm);margin-top:6px">Il apparaîtra dans « États et effets »${sp.concentration?" et s’arrêtera avec ta concentration":" jusqu’à ce que tu le termines"}.</div>`; }
