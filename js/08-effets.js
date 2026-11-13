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
