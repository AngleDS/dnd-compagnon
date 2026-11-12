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
function itemTipHtml(ref){
  if(ref.startsWith("hb:")){ const h=hb(ref); if(!h) return "";
    return `<div class="tiphead"><b class="tipname">${esc(h.name)}</b><button class="btn small ghost" data-act="tipclose" aria-label="Fermer">×</button></div><div class="muted" style="font-size:var(--fs-sm)">Objet hors SRD</div>${hbFoot(h)}${h.dice?`<div class="tipmeta"><div><span class="tkl">Dégâts</span> ${esc(h.dice+" "+(h.dmgType||""))}</div>${h.properties?`<div><span class="tkl">Propriétés</span> ${esc(h.properties)}</div>`:""}</div>`:""}<div class="prose tiptext">${prose(h.text)||`<p class="muted">Pas encore de description.</p>`}</div>`; }
  const [,kind,id]=ref.split(":");
  let h=""; const head=(n,sub)=>`<div class="tiphead"><b class="tipname">${esc(n)}</b><button class="btn small ghost" data-act="tipclose" aria-label="Fermer">×</button></div><div class="muted" style="font-size:var(--fs-sm)">${esc(sub)}</div>`;
  if(kind==="arme"){ const w=S.idx.weapons[id]; if(!w) return "";
    h=head(w.name,"Arme "+(w.category==="courante"?"courante":"de guerre")+(w.kind==="dist"?" à distance":" de corps à corps"));
    h+=`<div class="tipmeta"><div><span class="tkl">Dégâts</span> ${esc(w.damage+" "+w.damageType)}</div><div><span class="tkl">Propriétés</span> ${esc(w.properties)}</div><div><span class="tkl">Botte d'arme</span> ${esc(w.mastery)}</div><div><span class="tkl">Poids</span> ${esc(w.weight)} · <span class="tkl">Prix</span> ${esc(w.cost)}</div></div>`; return h; }
  if(kind==="armure"){ const a=S.idx.armors[id]; if(!a) return "";
    h=head(a.name,a.category==="bouclier"?"Bouclier":"Armure "+a.category);
    h+=`<div class="tipmeta"><div><span class="tkl">CA</span> ${a.category==="bouclier"?"+2":a.ac+(a.dexMax===0?"":a.dexMax?" + Dex (max "+a.dexMax+")":" + Dex")}</div>${a.strength?`<div><span class="tkl">Force</span> ${a.strength}</div>`:""}${a.stealthDisadvantage?`<div>Désavantage en Discrétion</div>`:""}<div><span class="tkl">Poids</span> ${esc(a.weight)} · <span class="tkl">Prix</span> ${esc(a.cost)}</div></div>`; return h; }
  const x=S.idx.items[id]; if(!x) return "";
  h=head(x.name, kind==="magique"?x.category:((kind==="outil"?"Outil":"Matériel d'aventurier")+(x.cost?" · "+x.cost:"")));
  h+=`<div class="prose tiptext">${prose(x.text)}</div>`; return h;
}
function itemName(b){ const ref=b.ref||matchItem(b.name); return ref?`<span class="tipl" data-act="tip" data-k="${esc(ref)}">${esc(b.name)}</span>`:esc(b.name); }
 
/* ---------- info-bulles ---------- */
function tipHtml(i,ch,D){
  const kv=(l,v)=>`<span class="tk"><span class="tkl">${esc(l)}</span><b class="num">${esc(v)}</b></span>`;
  let h=`<div class="tiphead"><b class="tipname">${esc(i.name)}</b><button class="btn small ghost" data-act="tipclose" aria-label="Fermer">×</button></div>`;
  if(i.kind==="spell"){
    const sp=i.sp;
    h+=`<div class="muted" style="font-size:var(--fs-sm)">${esc(sp.level?(sp.school+" du "+sp.level+(sp.level===1?"er":"e")+" niveau"):(sp.school+" · sort mineur"))}</div>`;
    h+=`<div class="tipmeta">${[["Incantation",sp.casting_time],["Portée",sp.range],["Composantes",sp.components],["Durée",sp.duration]].filter(x=>x[1]).map(([l,v])=>`<div><span class="tkl">${l}</span> ${esc(v)}</div>`).join("")}</div>`;
    const vals=(i.roll? (i.roll.startsWith("DD")?kv("DD",i.roll.slice(3)):kv("Toucher",i.roll)) : "")+(i.dice?kv(i.heal?"Soins":"Dégâts",i.dice):"");
    if(vals) h+=`<div class="row" style="gap:14px">${vals}</div>`;
    h+=`<div class="prose tiptext">${prose(sp.text)}</div>`;
  } else if(i.kind==="atk"){
    h+=`<div class="row" style="gap:14px">${kv("Toucher",sg(i.mod))}${kv("Dégâts",i.dmg)}</div>`;
    if(i.dtype) h+=`<div class="muted" style="font-size:var(--fs-sm)">Dégâts ${esc(i.dtype)}</div>`;
    h+=`<div class="tipmeta">${i.sub?`<div>${esc(i.sub)}</div>`:""}${i.mastery?`<div><span class="tkl">Botte d'arme</span> ${esc(i.mastery)}</div>`:""}</div>`;
    const g=i.mastery&&S.C.glossary.find(x=>norm(x.name)===norm(i.mastery)); if(g) h+=`<div class="prose tiptext">${prose(g.text)}</div>`;
  } else if(["skill","save","abil","init"].includes(i.kind)){
    h+=`<div class="muted" style="font-size:var(--fs-sm)">${esc(i.sub||"")}</div>`;
    h+=`<div class="row" style="gap:14px">${kv("Bonus",sg(i.mod))}</div>`;
    h+=`<div class="tparts">${(i.parts||[]).map(p=>`<span>${esc(p.l)} <b class="num">${sg(p.v)}</b></span>`).join("")}</div>`;
    if(i.kind==="skill"){ const sk=S.C.skills.find(x=>"skill:"+x.id===i.key); const lv=D.skills[sk.id].lv;
      h+=`<div style="font-size:var(--fs-sm)">${["Non maîtrisée","Maîtrisée","Expertise"][lv]}</div>`;
      if(sk.examples) h+=`<div class="prose tiptext"><p><b>Exemples d'application.</b> ${esc(sk.examples)}</p></div>`; }
  } else {
    h+=`<div class="muted" style="font-size:var(--fs-sm)">${esc(i.sub||"")}</div>`;
    if(i.res){ const r=i.res, used=+(ch.resUsed?.[r.id]||0); h+=`<div class="row" style="gap:14px">${kv("Reste",(r.max-used)+" / "+r.max+(r.pool?" d"+r.die:""))}<span class="muted" style="font-size:var(--fs-sm)">${esc(rechargeLabel(r.recharge))}</span></div>`; }
    if(i.counter) h+=`<div class="row">${kv("Reste",(+i.counter.cur||0)+" / "+(+i.counter.max||0))}</div>`;
    if(i.text) h+=`<div class="prose tiptext">${prose(i.text)}</div>`;
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
    if(!html) html=`<div class="tiphead"><b class="tipname">${esc(b.name)}</b><button class="btn small ghost" data-act="tipclose" aria-label="Fermer">×</button></div><div class="muted" style="font-size:var(--fs-sm)">${b.note?esc(b.note)+"<br>":""}Pas encore de description pour cet objet.</div><div style="margin-top:8px"><button class="btn small" data-act="mkItem" data-id="${esc(b.id)}">Créer sa fiche</button></div>`;
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
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ const tp=document.getElementById("tip"), mb=!document.getElementById("dice-pad")&&document.querySelector('#modal .picker[data-act="closeModal"],#modal [data-act="catClose"],#modal [data-act="afClose"]'); if(tp&&!tp.hidden) closeTip(); else if(mb){ mb.click(); } /* garde-fou : Échap ferme aussi les fenêtres (Dégâts, Soins, compteur, catalogue…) */ else if(S.T&&S.T.pop){ if(S.T.pop==="concchk"&&!(S.T.cc&&S.T.cc.res)) return; if(S.T.pop==="equip"&&S.T.eqSlot){ S.T.eqSlot=null; render(); return; } if(S.T.pop==="qroll"&&S.T.qrBack){ S.T.pop=S.T.qrBack; S.T.qrBack=null; render(); return; } S.T.pop=null; render(); } } });
document.addEventListener("click",e=>{ const t=document.getElementById("tip"); if(t&&!t.hidden&&!e.target.closest("#tip")){ e.preventDefault(); e.stopPropagation(); closeTip(); } },true);
window.addEventListener("scroll",()=>closeTip(),{passive:true});
 
/* ---------- mutations ---------- */
function setPath(obj,path,val){ const ks=path.split("."); let o=obj; for(let i=0;i<ks.length-1;i++){ const k=ks[i]; if(o[k]===undefined||o[k]===null) o[k]=/^\d+$/.test(ks[i+1])?[]:{}; o=o[k]; } o[ks[ks.length-1]]=val; }
function getPath(obj,path){ return path.split(".").reduce((o,k)=>o==null?o:o[k],obj); }
 