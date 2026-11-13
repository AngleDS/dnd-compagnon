/* ---------- objets SRD ---------- */
function matchItem(name){
  const I=S.idx.itemByName, n=norm(name).replace(/^\d+\s+/,"");
  for(const h of hbs("objet")) if(norm(h.name)===n || norm(h.name)===n.replace(/\s*\(.*?\)\s*/g," ").trim()) return "hb:"+h._id;
  const cands=[n.replace(/\s*\(.*?\)\s*/g," ").trim(), ...[...n.matchAll(/\((.*?)\)/g)].map(m=>m[1].trim()), n.split(/[,:]/)[0].trim()];
  const base=cands[0]; const after=base.replace(/^.*?\b(?:de|d')\s*/,""); if(after&&after!==base) cands.push(after);
  for(const c of cands){ if(I[c]) return I[c].ref; }
  for(const c of cands){ let best=null; for(const k in I){ if(k.length>=4&&(c===k||c.startsWith(k+" ")||c.startsWith(k+"s ")||c===k+"s")&&(!best||k.length>best.length)) best=k; } if(best) return I[best].ref; }
  return null;
}
/* Bulles d'info : même modèle que les fenêtres (lot 2) — nom et sous-titre en tête, valeurs, cadre d'infos, description.
   L'en-tête ne contient pas de <div> intérieur : la fiche « Détails » le retire avec une expression simple. */
const tipHead=(n,sub)=>`<div class="tiphead"><span class="tchw"><b class="tipname">${esc(n)}</b>${sub?`<span class="tcsub"><span>${esc(sub)}</span></span>`:""}</span><button class="btn small ghost" data-act="tipclose" aria-label="Fermer">×</button></div>`;
const tipMeta=rows=>{ rows=rows.filter(x=>x[1]); return rows.length?`<div class="tcmeta">${rows.map(([l,v])=>`<div><span class="tkl">${l}</span><b>${esc(v)}</b></div>`).join("")}</div>`:""; };
function itemTipHtml(ref){
  if(ref.startsWith("hb:")){ const h=hb(ref); if(!h) return "";
    return tipHead(h.name,"Objet hors SRD")+(h.dice?tipMeta([["Dégâts",h.dice+" "+(h.dmgType||"")],["Propriétés",h.properties]]):"")+`<div class="prose tiptext">${prose(h.text)||`<p class="muted">Pas encore de description.</p>`}</div>`+hbFoot(h); }
  const [,kind,id]=ref.split(":");
  if(kind==="arme"){ const w=S.idx.weapons[id]; if(!w) return "";
    return tipHead(w.name,"Arme "+(w.category==="courante"?"courante":"de guerre")+(w.kind==="dist"?" à distance":" de corps à corps"))+tipMeta([["Dégâts",w.damage+" "+w.damageType],["Propriétés",w.properties],["Botte d'arme",w.mastery],["Poids",w.weight],["Prix",w.cost]]); }
  if(kind==="armure"){ const a=S.idx.armors[id]; if(!a) return "";
    return tipHead(a.name,a.category==="bouclier"?"Bouclier":"Armure "+a.category)+tipMeta([["CA",a.category==="bouclier"?"+2":a.ac+(a.dexMax===0?"":a.dexMax?" + Dex (max "+a.dexMax+")":" + Dex")],["Force",a.strength?String(a.strength):""],["Discrétion",a.stealthDisadvantage?"désavantage":""],["Poids",a.weight],["Prix",a.cost]]); }
  const x=S.idx.items[id]; if(!x) return "";
  return tipHead(x.name, kind==="magique"?x.category:((kind==="outil"?"Outil":"Matériel d'aventurier")+(x.cost?" · "+x.cost:"")))+`<div class="prose tiptext">${prose(x.text)}</div>`;
}
function itemName(b){ const ref=b.ref||matchItem(b.name); return ref?`<span class="tipl" data-act="tip" data-k="${esc(ref)}">${esc(b.name)}</span>`:esc(b.name); }
 
/* ---------- info-bulles ---------- */
function tipHtml(i,ch,D){
  const kv=(l,v)=>`<span class="tk"><span class="tkl">${esc(l)}</span><b class="num">${esc(v)}</b></span>`;
  const vals=x=>x?`<div class="tcvals">${x}</div>`:"";
  // Description repliée, sauf si la bulle n'a rien d'autre (décision d'Angle, lot 2)
  const desc=(l,html,alone)=>html?`<details class="tdesc"${alone?" open":""}><summary class="label">${l}</summary><div class="prose tiptext">${html}</div></details>`:"";
  let h="";
  if(i.kind==="spell"){
    const sp=i.sp;
    h=tipHead(i.name,(sp.school?sp.school+" · ":"")+(sp.level?"niveau "+sp.level:"sort mineur"));
    h+=vals((i.roll?(i.roll.startsWith("DD")?kv("DD",i.roll.slice(3)):kv("Toucher",i.roll)):"")+(i.dice?kv(i.heal?"Soins":"Dégâts",(()=>{ const b=beamsAt(i.m||spellMech(sp),sp,sp.level,D); return (b>1?b+" × ":"")+i.dice; })()):""));
    h+=tipMeta([["Incantation",sp.casting_time],["Portée",sp.range],["Durée",sp.duration],["Composantes",sp.components]]);
    h+=desc("Description du sort",prose(sp.text),false);
  } else if(i.kind==="atk"){
    h=tipHead(i.name,i.sub||"");
    h+=vals(kv("Toucher",sg(i.mod))+kv("Dégâts",i.dmg));
    h+=tipMeta([["Type de dégâts",i.dtype],["Botte d'arme",i.mastery]]);
    const g=i.mastery&&S.C.glossary.find(x=>norm(x.name)===norm(i.mastery)); if(g) h+=desc("Botte d'arme : "+esc(i.mastery),prose(g.text),false);
  } else if(["skill","save","abil","init"].includes(i.kind)){
    let sub=i.sub||"";
    if(i.kind==="skill"){ const sk=S.C.skills.find(x=>"skill:"+x.id===i.key); sub+=(sub?" · ":"")+["Non maîtrisée","Maîtrisée","Expertise"][D.skills[sk.id].lv]; }
    h=tipHead(i.name,sub)+vals(kv("Bonus",sg(i.mod)));
    h+=`<div class="tparts">${(i.parts||[]).map(p=>`<span>${esc(p.l)} <b class="num">${sg(p.v)}</b></span>`).join("")}</div>`;
    if(i.kind==="skill"){ const sk=S.C.skills.find(x=>"skill:"+x.id===i.key); if(sk.examples) h+=`<div class="prose tiptext"><p><b>Exemples d'application.</b> ${esc(sk.examples)}</p></div>`; }
  } else {
    h=tipHead(i.name,i.sub||"");
    let v="";
    if(i.res){ const r=i.res, used=+(ch.resUsed?.[r.id]||0); v=kv("Reste",(r.max-used)+" / "+r.max+(r.pool?" d"+r.die:"")); }
    if(i.counter) v=kv("Reste",(+i.counter.cur||0)+" / "+(+i.counter.max||0));
    h+=vals(v);
    if(i.res) h+=tipMeta([["Récupération",rechargeLabel(i.res.recharge)]]);
    if(i.text) h+=desc("Description",prose(i.text),!v);
  }
  { const r=i.ref||i.src; if(r&&isHb(r)) h+=hbFoot(hb(r)); }
  return h;
}
function bagTipRef(ch,b){ let r=b.ref||matchItem(b.name); if(r) return r;
  const a=(ch.attacks||[]).find(x=>{ const bb=atkBag(ch,x); return bb&&bb.id===b.id; }); if(a&&a.weapon){ if(a.weapon.startsWith("srd:")) return "item:arme:"+a.weapon.slice(4); if(a.weapon.startsWith("hb:")) return a.weapon; } return ""; }
function openTip(key,anchor){
  if(key.startsWith("bag:")){ const ch=cur(); const b=ch&&(ch.bag||[]).find(x=>x.id===key.slice(4)); if(!b) return; const ref=bagTipRef(ch,b); const tip=document.getElementById("tip");
    let html=ref?itemTipHtml(ref):"";
    if(ref&&ref.startsWith("item:arme:")&&!(b.ref||matchItem(b.name))) html=html.replace(/<b class="tipname">[^<]*<\/b>/,`<b class="tipname">${esc(b.name)}</b>`);
    if(!html) html=`${tipHead(b.name,b.note||"")}<div class="muted" style="font-size:var(--fs-sm)">Pas encore de description pour cet objet.</div><div style="margin-top:8px"><button class="btn small" data-act="mkItem" data-id="${esc(b.id)}">Créer sa fiche</button></div>`;
    tip.innerHTML=html; tip.hidden=false; placeTip(tip,anchor); S.tipKey=key; return; }
  if(key.startsWith("item:")||key.startsWith("hb:")){ const tip=document.getElementById("tip"); const html=itemTipHtml(key); if(!html) return; tip.innerHTML=html; tip.hidden=false; placeTip(tip,anchor); S.tipKey=key; return; }
  const ch=cur(); if(!ch) return; const D=derive(ch);
  const items=S.Titems&&S.view==="sheet"&&S.tab==="table"?S.Titems:tableItems(ch,D);
  const i=items.find(x=>x.key===key) || (key.startsWith("resid:")?items.find(x=>x.res&&x.res.id===key.slice(6)):null); if(!i) return;
  const tip=document.getElementById("tip"); tip.innerHTML=tipHtml(i,ch,D); tip.hidden=false; placeTip(tip,anchor); S.tipKey=key;
}
function placeTip(tip,anchor){
  const r=anchor.getBoundingClientRect(), W=window.innerWidth, H=window.innerHeight;
  const w=Math.min(400,W-32); tip.style.width=w+"px";
  let left=Math.min(Math.max(16,r.left),W-w-16); tip.style.left=left+"px";
  const th=tip.offsetHeight; let top=r.bottom+8; if(top+th>H-16) top=Math.max(16,r.top-th-8); tip.style.top=top+"px";
}
function closeTip(){ const t=document.getElementById("tip"); if(t&&!t.hidden){ t.hidden=true; S.tipKey=null; } }
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ const tp=document.getElementById("tip"), mb=document.querySelector('#modal .picker[data-act="closeModal"],#modal [data-act="catClose"],#modal [data-act="afClose"],#modal [data-act="setClose"]'); if(tp&&!tp.hidden) closeTip(); else if(mb){ mb.click(); } /* garde-fou : Échap ferme aussi les fenêtres (Dégâts, Soins, compteur, catalogue…) */ else if(S.T&&S.T.pop){ if(S.T.pop==="concchk"&&!(S.T.cc&&S.T.cc.res)) return; if(S.T.pop==="equip"&&S.T.eqSlot){ S.T.eqSlot=null; render(); return; } if(S.T.pop==="qroll"&&S.T.qrBack){ S.T.pop=S.T.qrBack; S.T.qrBack=null; render(); return; } S.T.pop=null; render(); } } });
document.addEventListener("click",e=>{ const t=document.getElementById("tip"); if(t&&!t.hidden&&!e.target.closest("#tip")){ e.preventDefault(); e.stopPropagation(); closeTip(); } },true);
window.addEventListener("scroll",()=>closeTip(),{passive:true});
 
/* ---------- mutations ---------- */
function setPath(obj,path,val){ const ks=path.split("."); let o=obj; for(let i=0;i<ks.length-1;i++){ const k=ks[i]; if(o[k]===undefined||o[k]===null) o[k]=/^\d+$/.test(ks[i+1])?[]:{}; o=o[k]; } o[ks[ks.length-1]]=val; }
function getPath(obj,path){ return path.split(".").reduce((o,k)=>o==null?o:o[k],obj); }
 