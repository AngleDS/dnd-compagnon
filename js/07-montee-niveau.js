/* ---------- montée de niveau ---------- */
const ARCANUM={11:6,13:7,15:8,17:9};
function featLevels(f){ const out=[f.level]; const m=String(f.text||"").match(/de nouveau cette aptitude aux niveaux d[e’'] ?\S+\s+([\d ,et]+)/); if(m) for(const n of m[1].match(/\d+/g)||[]) out.push(+n); return out; }
function arcanumOf(ch,D){ const out={}; if(!D.cls||D.cls.id!=="occultiste") return out; for(const [cl,sl] of Object.entries(ARCANUM)) if(D.L>=+cl){ const r=(ch.arcanum||{})[sl]; out[sl]=r||null; } return out; }
function arcLevel(D,ref){ for(const [sl,r] of Object.entries(D.arc||{})) if(r===ref) return +sl; return 0; }
function classSpells(D,level,maxLevel){ const cn=D.cls?(D.cls.hb?D.cls.spellList:D.cls.name):null; let l=S.C.spells.filter(s=>(!cn||s.classes.includes(cn))&&(level!==null?s.level===level:(s.level>=1&&s.level<=maxLevel))).map(s=>({ref:"srd:"+s.id,s}));
  l=l.concat(hbs("sort").filter(h=>level!==null?(+h.level||0)===level:((+h.level||0)>=1&&(+h.level||0)<=maxLevel)).map(h=>({ref:"hb:"+h._id,s:h.pending?Object.assign({},h,{name:h.name+" (hors SRD · à remplir)"}):h})));
  if(cn) l=l.concat(catAll().filter(e=>e.k==="sort"&&(e.cl||[]).includes(cn)&&(level!==null?e.lv===level:(e.lv>=1&&e.lv<=maxLevel))&&!catHb(e)).map(e=>({ref:"cat:"+e.id,s:{name:e.n+" (hors SRD · à remplir)",level:e.lv}})));
  return l.sort((a,b)=>(a.s.level||0)-(b.s.level||0)||a.s.name.localeCompare(b.s.name,"fr")); }
function styleOpts(ch){ return [...S.C.feats.filter(f=>/style/i.test(f.category||"")).map(f=>["srd:"+f.id,f.name]),...hbs("don").filter(h=>/style de combat/i.test((h.label||"")+" "+(h.text||"")+" "+(h.category||""))).map(h=>["hb:"+h._id,h.name+hbTag(h)]),...catOpts("don",e=>e.cat==="Style combat")].filter(([v])=>!(ch.feats||[]).includes(v)); }
function levelPlan(ch){
  const D0=derive(ch), from=D0.L, to=Math.min(20,from+1), cls=D0.cls;
  const D1=derive(Object.assign({},ch,{level:to}));
  const p={from,to,D0,D1,cls,feats:[],choices:[]};
  if(!cls) return p;
  const avg=cls.hitDie/2+1+D0.mods.con, pvniv=D1.effs.filter(e=>e.t==="bonus"&&e.cible==="pvniv").reduce((t,e)=>t+evalF(e.val,D1.ctx),0);
  p.hpAvg=Math.max(1,avg)+pvniv; p.hd=cls.hitDie; p.pvniv=pvniv;
  for(const f of cls.features) if(featLevels(f).includes(to)) p.feats.push({origin:cls.name,name:f.name,text:f.text});
  if(ch.subclass&&ch.subclass.startsWith("srd:")){ const sc=cls.subclasses.find(s=>"srd:"+s.id===ch.subclass); if(sc) for(const f of sc.features) if(f.level===to) p.feats.push({origin:sc.name,name:f.name,text:f.text}); }
  const hsub=hb(ch.subclass); if(hsub) for(const f of hsub.features||[]) if(+f.level===to) p.feats.push({origin:hsub.name,name:f.name,text:f.text});
  p.needSub = cls.subclassLevel===to && !ch.subclass;
  p.asi = cls.features.some(f=>featLevels(f).includes(to)&&/Amélioration de caractéristique/i.test(f.name));
  p.style = cls.features.some(f=>f.level===to&&/^Style de combat/i.test(f.name)); p.styleAlt = p.style&&cls.id==="paladin"?{name:"Combattant béni",cls:"Clerc"}:p.style&&cls.id==="rodeur"?{name:"Combattant druidique",cls:"Druide"}:null;
  p.epic = cls.features.some(f=>f.level===to&&/Faveur épique/i.test(f.name));
  const c0=D0.cast, c1=D1.cast;
  if(c1&&c1.cantrips!==undefined){ p.dCantrips=Math.max(0,(c1.cantrips||0)-(c0?.cantrips||0)); p.dPrepared=Math.max(0,(c1.prepared||0)-(c0?.prepared||0)); }
  if(c1){ p.maxSpell = c1.type==="pact"?c1.pactLevel:(c1.slots||[]).length; p.slotTxt = c1.type==="pact" ? (c0&&(c0.pactSlots!==c1.pactSlots||c0.pactLevel!==c1.pactLevel)?`Emplacements de pacte : ${c0.pactSlots} × niv. ${c0.pactLevel} → ${c1.pactSlots} × niv. ${c1.pactLevel}`:"") : (JSON.stringify(c0?.slots||[])!==JSON.stringify(c1.slots||[])?`Emplacements : ${(c1.slots||[]).map((n,i)=>n+"×niv."+(i+1)).join(", ")}`:""); }
  if(cls.id==="occultiste"){ const col=cls.columns.find(c=>c.label.startsWith("Manifestations")); p.dInv=Math.max(0,col.values[to-1]-col.values[from-1]); p.arc=ARCANUM[to]||0; }
  if(D1.pb!==D0.pb) p.pbTxt=`Bonus de maîtrise : ${sg(D0.pb)} → ${sg(D1.pb)}`;
  return p;
}
function lvlModal(){
  const ch=cur(), P=S.pending, p=levelPlan(ch), D0=p.D0;
  if(p.from>=20) return `<div class="picker" data-act="closeModal"><div class="box" role="dialog" style="grid-template-rows:auto">${winHead("Niveau 20")}<p>Niveau maximum atteint.</p></div></div>`;
  const o=(v,l,c)=>`<option value="${esc(v)}" ${String(v)===String(c)?"selected":""}>${esc(l)}</option>`;
  const lu=(k,i)=>`data-lu="${k}"${i!==undefined?` data-i="${i}"`:""}`;
  const sec=(t,b)=>`<div class="lusec"><div class="label">${t}</div>${b}</div>`;
  let h="";
  // gains
  const gains=[p.pbTxt,p.slotTxt,p.dCantrips?`+${p.dCantrips} sort mineur`:"",p.dPrepared?`+${p.dPrepared} sort${p.dPrepared>1?"s":""} préparé${p.dPrepared>1?"s":""}`:"",p.dInv?`+${p.dInv} manifestation${p.dInv>1?"s":""}`:""].filter(Boolean);
  h+=sec("Ce que tu gagnes",`${gains.length?`<ul class="lul">${gains.map(g=>`<li>${esc(g)}</li>`).join("")}</ul>`:""}${p.feats.length?p.feats.map(f=>`<details class="lufeat"><summary><b>${esc(f.name)}</b> <span class="muted">· ${esc(f.origin)}</span></summary><div class="prose">${prose(f.text||"")}</div></details>`).join(""):`<div class="muted" style="font-size:var(--fs-sm)">Pas de nouvelle aptitude de classe à ce niveau.</div>`}`);
  // hp
  const manual=ch.hpMode==="manual";
  h+=sec("Points de vie",`<div class="row"><label class="row"><input type="radio" name="luhp" ${lu("hp")} value="avg" ${P.hp!=="roll"?"checked":""}> Moyenne : <b>+${p.hpAvg}</b></label>
    <label class="row"><input type="radio" name="luhp" ${lu("hp")} value="roll" ${P.hp==="roll"?"checked":""}> J'ai lancé le d${p.hd} :</label><input type="number" min="1" max="${p.hd}" ${lu("roll")} value="${esc(P.roll||"")}" style="width:70px" aria-label="Résultat du dé de vie" ${P.hp==="roll"?"":"disabled"}>
    ${P.hp==="roll"&&+P.roll?`<span class="muted">→ +${Math.max(1,+P.roll+D0.mods.con)+p.pvniv}</span>`:""}</div>
    <div class="muted" style="font-size:var(--fs-sm)">Con ${sg(D0.mods.con)} par niveau${p.pvniv?`, +${p.pvniv} d'un effet (ex. Robuste)`:""}.${!manual&&P.hp==="roll"?" Les PV passeront en saisie manuelle.":""}</div>`);
  // subclass
  if(p.needSub){ const opts=[["","— Choisir —"],...p.cls.subclasses.map(s=>["srd:"+s.id,s.name]),...hbs("sous-classe").filter(h=>!h.classId||h.classId===p.cls.id).map(h=>["hb:"+h._id,h.name+hbTag(h)]),...catOpts("sous-classe",e=>catClassOk(e,p.cls))];
    h+=sec("Sous-classe",`<select ${lu("sub")}>${opts.map(([v,l])=>o(v,l,P.sub||"")).join("")}</select>`); }
  // ASI / feat
  if(p.asi||p.epic){
    const featOpts=[["","— Choisir un don —"],...S.C.feats.map(f=>["srd:"+f.id,f.name+(f.category?" ("+f.category+")":"")]),...hbs("don").map(h=>["hb:"+h._id,h.name+hbTag(h)]),...catOpts("don",e=>p.epic?e.cat==="faveur épique":(e.cat==="généraux"&&(e.lv||1)<=p.to))];
    const abSel=k=>`<select ${lu(k)}>${o("","—","")}${AB.map(a=>o(a,ABN[a]+" ("+(+ch.abilities?.[a]||10)+")",P[k]||"")).join("")}</select>`;
    h+=sec(p.epic?"Faveur épique":"Amélioration de caractéristique",
      (p.asi?`<div class="row"><label class="row"><input type="radio" name="luasi" ${lu("asi")} value="ab" ${P.asi!=="feat"?"checked":""}> Caractéristiques</label><label class="row"><input type="radio" name="luasi" ${lu("asi")} value="feat" ${P.asi==="feat"?"checked":""}> Un don</label></div>`:"")+
      ((p.asi&&P.asi!=="feat")?`<div class="row">+1 ${abSel("ab1")} +1 ${abSel("ab2")}</div><div class="muted" style="font-size:var(--fs-sm)">Choisis deux fois la même pour +2. Maximum 20.</div>`
        :`<select ${lu("feat")}>${featOpts.map(([v,l])=>o(v,l,P.feat||"")).join("")}</select>`));
  }
  if(p.style){ const opts=[["","— Choisir —"],...styleOpts(ch),...(p.styleAlt?[["alt",p.styleAlt.name+" (2 sorts mineurs de "+p.styleAlt.cls+")"]]:[])];
    let x=`<select ${lu("style")}>${opts.map(([v,l])=>o(v,l,P.style||"")).join("")}</select>`;
    if(P.style==="alt"){ const can=classSpells({cls:{name:p.styleAlt.cls}},0); x+=[0,1].map(i=>`<select ${lu("stc",i)}>${o("","— Sort mineur de "+p.styleAlt.cls+" —","")}${can.filter(c=>!(ch.spells||[]).some(s=>s.ref===c.ref)&&!(P.stc||[]).some((r,j)=>j!==i&&r===c.ref)).map(c=>o(c.ref,c.s.name,(P.stc||[])[i]||"")).join("")}</select>`).join(""); }
    h+=sec("Style de combat",x+`<div class="muted" style="font-size:var(--fs-sm)">Défense : +1 CA en armure. Archerie : +2 aux attaques à distance.</div>`); }
  // invocations
  if(p.dInv){ const ex=(P.can||[]).filter(Boolean); const av=invAvailFor(ch,p.to,ex);
    h+=sec(`Manifestations (${p.dInv} à choisir)`,Array.from({length:p.dInv},(_,i)=>{ const v=(P.inv||[])[i]||"", ck=INV_CHOICE[v];
      const taken=[...invTaken(ch.invocations,v),...(P.inv||[]).map((x,j)=>j!==i&&x===v?(P.invc||[])[j]:null).filter(Boolean)];
      return `<div class="row" style="gap:6px"><select ${lu("inv",i)}>${o("","— Choisir —","")}${av.map(x=>o(x.id,x.name+(x.repeatable?" (répétable)":"")+(x.prerequisite?" — "+x.prerequisite.replace(/^Niveau d’Occultiste \d+\+,?\s*/,""):""),v)).join("")}</select>${ck?`<select ${lu("invc",i)}>${o("",ck==="feat"?"— Quel don ? —":"— Quel sort mineur ? —","")}${invChoices(ch,v,ex).filter(([c])=>!taken.includes(c)).map(([c,l])=>o(c,l,(P.invc||[])[i]||"")).join("")}</select>`:""}</div>`; }).join("")); }
  // spells
  const have=new Set((ch.spells||[]).map(s=>s.ref).concat(Object.keys(D0.always)));
  if(p.dCantrips){ const l=classSpells(D0,0).filter(x=>!have.has(x.ref)); h+=sec(`Sorts mineurs (${p.dCantrips})`,Array.from({length:p.dCantrips},(_,i)=>`<select ${lu("can",i)}>${o("","— Choisir —","")}${l.map(x=>o(x.ref,x.s.name,(P.can||[])[i]||"")).join("")}</select>`).join("")); }
  if(p.dPrepared&&p.maxSpell){ const l=classSpells(D0,null,p.maxSpell).filter(x=>!have.has(x.ref)); h+=sec(`Sorts (${p.dPrepared}, jusqu'au niveau ${p.maxSpell})`,Array.from({length:p.dPrepared},(_,i)=>`<select ${lu("spl",i)}>${o("","— Choisir (ou plus tard) —","")}${l.map(x=>o(x.ref,"niv. "+x.s.level+" · "+x.s.name,(P.spl||[])[i]||"")).join("")}</select>`).join("")); }
  if(p.arc){ const l=classSpells(D0,p.arc).filter(x=>!have.has(x.ref)); h+=sec(`Arcanum mystique (sort de niveau ${p.arc})`,`<select ${lu("arc")}>${o("","— Choisir —","")}${l.map(x=>o(x.ref,x.s.name,P.arc||"")).join("")}</select><div class="muted" style="font-size:var(--fs-sm)">Lançable une fois par repos long, sans emplacement.</div>`); }
  const chain=S.lvlTarget&&S.lvlTarget.id===S.cur&&p.from<S.lvlTarget.to?S.lvlTarget:null;
  const foot=chain&&P.stop?`<div class="panel stack" style="border-color:var(--blood)"><div>Arrêter la création ici ? ${esc(ch.name||"Le personnage")} restera au <b>niveau ${p.from}</b> au lieu du niveau ${chain.to}. Tu pourras continuer plus tard avec le bouton « Niveau ${p.to} ↑ » en haut de la fiche.</div><div class="row" style="justify-content:flex-end;gap:6px"><button class="btn" data-act="lvlStopNo">Reprendre la montée</button><button class="btn danger" data-act="lvlStopYes">Arrêter au niveau ${p.from}</button></div></div>`
    :`<div class="row" style="justify-content:space-between"><span class="muted" style="font-size:var(--fs-sm)">Les choix laissés vides pourront être faits plus tard dans Construction ou Sorts.</span><button class="btn primary" data-act="lvlApply">Passer au niveau ${p.to}</button></div>`;
  return `<div class="picker" data-act="${chain?"noop":"closeModal"}"><div class="box" role="dialog" aria-label="Monter de niveau" style="grid-template-rows:auto 1fr auto">
    <div class="row" style="justify-content:space-between"><div><h2>Passer au niveau ${p.to}</h2>${chain?`<div class="muted" style="font-size:var(--fs-sm)">Création du personnage · niveau ${p.to} sur ${chain.to}</div>`:""}</div>${chain?`<button class="btn small ghost" data-act="lvlStop">Arrêter ici</button>`:`<button class="btn small ghost wclose" type="button" data-act="closeModal" aria-label="Fermer">×</button>`}</div>
    <div class="stack" style="overflow-y:auto;min-height:0">${h}</div>
    ${foot}</div></div>`;
}
function concDamage(n,now){
  S.ccDmg=(S.ccDmg||0)+n; clearTimeout(S.ccTimer);
  const open=()=>{ const ch=cur(); if(!ch||!ch.conc||!S.T){ S.ccDmg=0; return; } S.T.cc={dmg:S.ccDmg,mode:"n",d1:"",d2:"",res:null}; S.ccDmg=0; S.T.pop="concchk"; render(); };
  if(now) open(); else S.ccTimer=setTimeout(open,1300);
}
function ccPop(ch,D,anim){
  const T=S.T, c=T.cc||{dmg:0,mode:"n",d1:"",d2:"",res:null}; T.cc=c;
  const dd=Math.max(10,Math.floor((+c.dmg||0)/2)), mod=D.saves.con.val-2*(+ch.exhaustion||0);
  let res="";
  if(c.res){ const ok=c.res.total>=dd;
    res=`<div class="ccres ${ok?"ok":"ko"}"><div class="num" style="font-size:34px;font-weight:700">${c.res.total}</div><div><b>${ok?"Concentration maintenue":"Concentration perdue"}</b><div class="muted" style="font-size:var(--fs-sm)">${esc(c.res.bd)} contre DD ${dd}${ok?"":` · ${esc(c.res.spell)} prend fin`}</div></div></div>
      ${winFoot(`<button class="btn primary" data-act="ccclose">Continuer</button>`)}`; }
  const body=`<div class="muted" style="font-size:var(--fs-sm)">Tu as subi des dégâts en te concentrant sur <b>${esc(ch.conc||(c.res&&c.res.spell)||"")}</b> : jet de sauvegarde de Constitution obligatoire.</div>
    <div class="row" style="gap:18px;margin:10px 0;align-items:flex-end">
      <label class="field"><span>Dégâts subis</span><input id="cc-dmg" type="number" min="0" value="${esc(String(c.dmg||0))}" style="width:80px" ${c.res?"disabled":""}></label>
      <div><div class="label">DD</div><b class="num" style="font-size:var(--fs-2xl)">${dd}</b></div>
      <div><div class="label">Ton bonus</div><b class="num" style="font-size:var(--fs-2xl)">${sg(mod)}</b></div></div>
    <div class="muted" style="font-size:var(--fs-sm)">DD 10, ou la moitié des dégâts si c'est plus (max 30).</div>
    ${c.res?res:`<div class="adv" role="group" style="margin-top:10px">${[["n","Normal"],["a","Avantage"],["d","Désavantage"]].map(([k,l])=>`<button aria-pressed="${c.mode===k}" data-act="ccmode" data-v="${k}">${l}</button>`).join("")}</div>
    <form class="row tin" data-form="cc" style="margin-top:8px"><label class="field"><span>${c.mode==="n"?"Ton d20":"1er d20"}</span><input id="cc-d1" type="number" inputmode="numeric" min="1" max="20" value="${esc(c.d1)}"></label>
      ${c.mode!=="n"?`<label class="field"><span>2e d20</span><input id="cc-d2" type="number" inputmode="numeric" min="1" max="20" value="${esc(c.d2)}"></label>`:""}
      <button class="btn primary" type="submit">Appliquer</button><button class="btn" type="button" data-virtual data-act="ccroll">Lancer virtuellement</button></form>`}`;
  return `<div class="tpopback${anim?"":" still"}" data-act="noop"><div class="tpop" role="dialog" aria-modal="true" aria-label="Jet de concentration" data-act="noop"><div class="tpophead"><b>Jet de concentration</b><button class="btn small ghost wclose" data-act="ccclose" aria-label="Fermer">×</button></div><div class="tpopbody">${body}</div></div></div>`;
}
function ccResolve(a,b,virt){
  if(!virt&&virtualDiceEnabled()) return;
  const ch=cur(), D=derive(ch), c=S.T.cc; if(!c) return;
  const dd=Math.max(10,Math.floor((+c.dmg||0)/2)), mod=D.saves.con.val-2*(+ch.exhaustion||0);
  const d=c.mode==="n"?a:(c.mode==="a"?Math.max(a,b):Math.min(a,b)); const total=d+mod, spell=ch.conc;
  c.res={total,spell,bd:(c.mode==="n"?"d20 "+a:(c.mode==="a"?"avantage ":"désavantage ")+a+" / "+b)+" "+sg(mod)+(virt?"":" · dé physique")};
  const ok=total>=dd;
  if(!ok){ ch.conc=""; }
  addLog({label:"Concentration ("+spell+")",total,bd:c.res.bd+" contre DD "+dd+(ok?" : maintenue":" : perdue"),crit:d===20,fumble:d===1,quiet:true});
  touch(S.cur); render();
}
function hpApply(n){
  const ch=cur(), D=derive(ch), P=S.pending; if(!P||P.type!=="hp"||!(n>0)) return; const dmg=P.mode==="dmg";
  const crit=dmg&&!!document.getElementById("hp-crit")?.checked;
  ch.hp=ch.hp||{cur:D.hpMax,temp:0}; const before=+ch.hp.cur||0; let msg="";
  if(dmg){ let rest=n; const t=+ch.hp.temp||0; if(t){ const a=Math.min(t,rest); ch.hp.temp=t-a; rest-=a; if(a) msg+=a+" absorbés par les PV temporaires. "; }
    if(before>0){ ch.hp.cur=Math.max(0,before-rest); const over=rest-before; if(ch.hp.cur===0){ if(over>=D.hpMax) msg+="Dégâts restants ≥ PV max : mort instantanée. "; else msg+="Tu tombes à 0 PV : jets contre la mort. "; } }
    else if(rest>0){ ch.death=ch.death||{s:0,f:0}; if(rest>=D.hpMax) msg+="Dégâts ≥ PV max à 0 PV : mort instantanée. "; else { ch.death.f=Math.min(3,(ch.death.f||0)+(crit?2:1)); msg+=(crit?"Deux échecs":"Un échec")+" de jet contre la mort. "; } }
    addLog({label:"Dégâts subis",total:"−"+n,bd:(msg||"")+"PV "+ch.hp.cur+" / "+D.hpMax,kind:"info",quiet:!msg});
    if(ch.conc&&before>0){ S.pending=null; renderModal(); touch(S.cur); if(S.view==="sheet"&&S.tab==="table"){ S.T=S.T||{}; concDamage(n,true); } else { addLog({label:"Concentration : "+ch.conc,total:"DD "+Math.max(10,Math.floor(n/2)),bd:"Fais un jet de sauvegarde de Constitution.",kind:"info"}); render(); } return; }
  } else { ch.hp.cur=Math.min(D.hpMax,before+n); if(before<=0&&ch.hp.cur>0) ch.death={s:0,f:0}; addLog({label:"Soins reçus",total:"+"+(ch.hp.cur-before),bd:"PV "+ch.hp.cur+" / "+D.hpMax,quiet:true}); }
  S.pending=null; renderModal(); touch(S.cur); render();
}
function hdSpend(ch,D,r,phys){
  if(phys&&virtualDiceEnabled()) return;
  if((+ch.hdUsed||0)>=D.L) return;
  const heal=Math.max(1,r+D.mods.con); ch.hdUsed=(+ch.hdUsed||0)+1; ch.hp=ch.hp||{cur:0,temp:0}; const before=+ch.hp.cur||0; ch.hp.cur=Math.min(D.hpMax,before+heal);
  S.T.hdLast=`d${D.hd} : ${r} ${sg(D.mods.con)} = +${heal} PV → ${ch.hp.cur} / ${D.hpMax}`;
  addLog({label:"Dé de vie",total:"+"+heal,bd:`d${D.hd} ${r} ${sg(D.mods.con)}`+(phys?" · dé physique":""),quiet:true});
  touch(S.cur); render();
}
function lvlApply(){
  const ch=cur(), P=S.pending, p=levelPlan(ch); if(p.from>=20) return;
  const D0=p.D0, rep0=reperesAuto(ch,D0), res0=D0.res.map(r=>r.name);
  const gain = P.hp==="roll"&&+P.roll ? Math.max(1,Math.min(p.hd,+P.roll)+D0.mods.con)+p.pvniv : p.hpAvg;
  if(P.hp==="roll"&&+P.roll&&ch.hpMode!=="manual"){ ch.hpMode="manual"; ch.hpMaxManual=D0.hpMax; }
  if(ch.hpMode==="manual") ch.hpMaxManual=(+ch.hpMaxManual||D0.hpMax)+gain;
  ch.level=p.to;
  ch.hp=ch.hp||{cur:D0.hpMax,temp:0}; ch.hp.cur=(+ch.hp.cur||0)+gain;
  if(p.needSub&&P.sub) ch.subclass=P.sub;
  if(p.style&&P.style){ ch.feats=ch.feats||[]; if(P.style==="alt"){ ch.spells=ch.spells||[]; for(const r of (P.stc||[]).filter(Boolean)) if(!ch.spells.some(s=>s.ref===r)) ch.spells.push({ref:r,prepared:true,via:p.styleAlt.name}); ch.styleAlt=p.styleAlt.name; } else if(!ch.feats.includes(P.style)) ch.feats.push(P.style); }
  if(p.asi&&P.asi!=="feat"){ ch.abilities=ch.abilities||{}; for(const k of ["ab1","ab2"]) if(P[k]) ch.abilities[P[k]]=Math.min(20,(+ch.abilities[P[k]]||10)+1); }
  else if((p.asi||p.epic)&&P.feat){ ch.feats=ch.feats||[]; ch.feats.push(P.feat); }
  (P.inv||[]).forEach((id,i)=>{ if(!id) return; ch.invocations=ch.invocations||[]; const c=(P.invc||[])[i]||""; const v=id+(c?"|"+c:""); const iv=S.idx.invocations[id];
    if(iv&&iv.repeatable?!ch.invocations.includes(v):!ch.invocations.some(x=>invId(x)===id)) ch.invocations.push(v); });
  ch.spells=ch.spells||[];
  for(const r of [...(P.can||[]),...(P.spl||[])].filter(Boolean)) if(!ch.spells.some(s=>s.ref===r)) ch.spells.push({ref:r,prepared:true});
  if(p.arc&&P.arc){ ch.arcanum=ch.arcanum||{}; ch.arcanum[p.arc]=P.arc; }
  const D1=derive(ch); ch.hp.cur=Math.min(ch.hp.cur,D1.hpMax);
  touch(S.cur); S.pending=null; renderModal();
  // Ce qui apparaît dans « À la table » (lot T5) : Repères et Ressources se calculent seuls, on dit au joueur ce qui vient d'y entrer
  const newRep=reperesAuto(ch,D1).filter(id=>!rep0.includes(id)).map(id=>TILE_CAT.reperes[id]||id), newRes=D1.res.map(r=>r.name).filter(n=>!res0.includes(n));
  const newTab=[newRep.length?"Repères : "+newRep.join(", "):"",newRes.length?"Ressources : "+newRes.join(", "):""].filter(Boolean).join(" ; ");
  addLog({label:(ch.name||"Personnage")+" passe niveau "+p.to,total:"↑",bd:`+${gain} PV max.`+(p.feats.length?" Nouveau : "+p.feats.map(f=>f.name).join(", ")+".":"")+(newTab?" Nouveau dans À la table : "+newTab+".":""),kind:"info"});
  if(newTab) setBanner("Niveau "+p.to+" — nouveau dans « À la table » : "+newTab+".");
  if(S.lvlTarget&&S.lvlTarget.id===S.cur&&ch.level<S.lvlTarget.to){ S.pending={type:"lvl",hp:"avg"}; } else S.lvlTarget=null;
  render(); if(!S.pending) rvStart(S.cur);
}
function renderModal(){
  const m=document.getElementById("modal");
  if(S.rv){ m.innerHTML=rvModal(); return; }
  if(S.catPick){ m.innerHTML=catPickModal(); return; }
  if(S.af){ m.innerHTML=afModal(); return; }
  if(!S.pending){ m.innerHTML=""; return; }
  const ch=cur(); if(!ch){ S.pending=null; m.innerHTML=""; return; }
  const D=derive(ch);
  if(S.pending.type==="lvl"){ m.innerHTML=lvlModal(); return; }
  if(S.pending.type==="hp"){ const P=S.pending, dmg=P.mode==="dmg", hp=ch.hp||{cur:D.hpMax,temp:0};
    m.innerHTML=`<div class="picker" data-act="closeModal"><div class="box hpbox" role="dialog" aria-label="${dmg?"Dégâts":"Soins"}" style="grid-template-rows:auto auto auto auto;max-width:420px">
      ${winHead(dmg?"Dégâts subis":"Soins reçus","closeModal",dmg?"color:#c0473f":"color:#5b9a68")}
      <form class="stack" id="hpform" data-form="hpamt" novalidate><label class="field"><span>Montant</span><input id="hp-amt" type="number" inputmode="numeric" min="1" step="1" style="width:100%;font-size:var(--fs-xl)" autofocus></label>
        <div id="hp-amt-err" class="warntxt" role="alert" style="font-size:var(--fs-sm)"></div>
        ${dmg?`<label class="row" style="gap:6px;font-size:var(--fs-sm)"><input type="checkbox" id="hp-crit"> Coup critique (compte deux échecs si tu es à 0 PV)</label>`:""}
        <div class="muted" style="font-size:var(--fs-sm)">PV ${+hp.cur||0} / ${D.hpMax}${+hp.temp?` · ${+hp.temp} PV temporaires${dmg?" (perdus en premier)":""}`:""}${dmg&&ch.conc?` · concentration sur ${esc(ch.conc)} : un jet sera demandé`:""}</div></form>
      <div class="row" style="gap:6px;flex-wrap:wrap">${[1,2,3,4,5,6,8,10,12].map(n=>`<button class="btn small" data-act="hpquick" data-v="${n}">${dmg?"−":"+"}${n}</button>`).join("")}</div>
      ${winFoot(`<button class="btn primary ${dmg?"hpdmgb":"hphealb"}" type="submit" form="hpform">${dmg?"Appliquer les dégâts":"Appliquer les soins"}</button>`)}</div></div>`;
    setTimeout(()=>{ const i=document.getElementById("hp-amt"); if(i) i.focus(); },0); return; }
  if(S.pending.type==="chg"){ const b=(ch.bag||[]).find(x=>x.id===S.pending.id); const c=b&&itemCharges(ch,b)||{max:"",when:"long",rec:""};
    m.innerHTML=`<div class="picker" data-act="closeModal"><div class="box" role="dialog" aria-label="Compteur" style="grid-template-rows:auto auto auto;max-width:460px">
      ${winHead("Compteur · "+esc(b?b.name:""))}
      <div class="stack">
        <label class="field"><span>Nombre de charges ou d'utilisations (0 pour retirer le compteur)</span><input id="chg-max" type="number" min="0" max="99" value="${esc(String(c.max||""))}" style="width:100px"></label>
        <label class="field"><span>Récupération</span><select id="chg-when"><option value="long" ${c.when!=="court"&&c.when!=="aucune"?"selected":""}>Au repos long (ou à l'aube)</option><option value="court" ${c.when==="court"?"selected":""}>Au repos court et long</option><option value="aucune" ${c.when==="aucune"?"selected":""}>Jamais (consommable)</option></select></label>
        <label class="field"><span>Quantité récupérée (vide = tout, ou formule comme 1d6+1)</span><input id="chg-rec" type="text" value="${esc(c.rec==="full"?"":c.rec||"")}" placeholder="tout" style="width:140px"></label>
        <label class="field"><span>Utilisation en jeu</span><select id="chg-cost">${[["auto","Automatique (d'après la description)"],["action","Action"],["bonus","Action bonus"],["reaction","Réaction"],["autre","Autre"],["none","Pas dans les actions"]].map(([v,l])=>`<option value="${v}" ${(c.cost||"auto")===v?"selected":""}>${l}</option>`).join("")}</select></label>
        ${c.auto?`<div class="muted" style="font-size:var(--fs-sm)">Valeurs lues dans la description de l'objet.</div>`:""}
      </div>
      ${winFoot(`<button class="btn primary" data-act="chgSave">Enregistrer</button>`)}</div></div>`; return; }
  if(S.pending.type==="spell"){
    const q=norm(S.pending.q||""), cls=D.cls?.name, all=S.pending.all;
    const have=new Set((ch.spells||[]).map(s=>s.ref).concat(Object.keys(D.always)));
    const maxL = D.cast?.type==="pact"?D.cast.pactLevel:(D.cast?.slots?.length||9);
    let list=[...S.C.spells.map(s=>({ref:"srd:"+s.id,s})),...hbs("sort").map(h=>({ref:"hb:"+h._id,s:Object.assign({classes:[]},h)}))];
    list=list.filter(x=>(all||!cls||isHb(x.ref)||x.s.classes.includes(cls))&&(all||x.s.level<=maxL)&&(!q||norm(x.s.name).includes(q)));
    list.sort((a,b)=>a.s.level-b.s.level||a.s.name.localeCompare(b.s.name,"fr"));
    m.innerHTML=`<div class="picker" data-act="closeModal"><div class="box" role="dialog" aria-label="Ajouter des sorts">
      ${winHead("Ajouter des sorts")}
      <div class="row"><form data-form="spellq" class="row" style="flex:1"><input id="spellQ" type="text" value="${esc(S.pending.q||"")}" placeholder="Chercher un sort" style="flex:1" aria-label="Chercher un sort"><button class="btn small" type="submit">Chercher</button></form>
      <label class="row"><input id="spellAll" type="checkbox" data-act="spellAll" ${all?"checked":""}>Tous les sorts</label></div>
      <div class="res-list">${list.slice(0,150).map(x=>`<div class="pick-row"><div><b>${esc(x.s.name)}</b> ${badge(x.ref)} <span class="muted" style="font-size:var(--fs-sm)">${x.s.level?"niv. "+x.s.level:"mineur"} · ${esc(x.s.school||"")}</span></div>${have.has(x.ref)?`<span class="muted" style="font-size:var(--fs-sm)">Déjà sur la fiche</span>`:`<button class="btn small" data-act="addSpell" data-ref="${esc(x.ref)}">Ajouter</button>`}</div>`).join("")||`<div class="muted">Aucun sort.</div>`}</div>
      <div class="muted" style="font-size:var(--fs-sm)">${all?"Tous les sorts du SRD et tes sorts perso.":"Sorts de "+esc(cls||"ta classe")+" jusqu'au niveau "+maxL+", plus tes sorts perso."}</div></div></div>`;
  }
  if(S.pending.type==="attack"){
    const a=(ch.attacks||[]).find(x=>x.id===S.pending.id); if(!a){ S.pending=null; m.innerHTML=""; return; }
    const o=(v,l,c)=>`<option value="${esc(v)}" ${v===c?"selected":""}>${esc(l)}</option>`;
    const wOpts=[["","— Arme libre —"],...S.C.weapons.map(w=>["srd:"+w.id,w.name+" ("+w.damage+")"]),...hbs("objet").filter(h=>h.dice).map(h=>["hb:"+h._id,h.name+hbTag(h)])];
    const b=k=>`data-att="${a.id}" data-bind="${k}"`;
    m.innerHTML=`<div class="picker" data-act="closeModal"><div class="box" role="dialog" aria-label="Modifier l'attaque" style="grid-template-rows:auto 1fr auto">
      ${winHead("Attaque")}
      <div class="stack" style="overflow-y:auto">
      <label class="field"><span>Arme</span><select id="at-w" ${b("weapon")}>${wOpts.map(([v,l])=>o(v,l,a.weapon||"")).join("")}</select></label>
      <label class="field"><span>Nom affiché</span><input id="at-n" type="text" ${b("name")} value="${esc(a.name||"")}" placeholder="ex. Canne-épée"></label>
      <label class="field"><span>Objet du sac correspondant</span><select id="at-bag" ${b("bagId")}>${o("","Automatique"+((()=>{ const x=atkBag(ch,Object.assign({},a,{bagId:""})); return x?" ("+x.name+")":" (aucun trouvé)"; })()),a.bagId||"")}${(ch.bag||[]).filter(x=>(+x.qty||0)>0).map(x=>o(x.id,x.name,a.bagId||"")).join("")}</select></label>
      <div class="grid2">
      <label class="field"><span>Caractéristique</span><select id="at-ab" ${b("ability")}>${o("auto","Automatique",a.ability||"auto")}${AB.map(x=>o(x,ABN[x],a.ability)).join("")}${o("sort","Carac. d'incantation",a.ability)}</select></label>
      <label class="field"><span>Dés de dégâts (vide = ceux de l'arme)</span><input id="at-d" type="text" ${b("dice")} value="${esc(a.dice||"")}"></label>
      <label class="field"><span>Type de dégâts (vide = celui de l'arme)</span><input id="at-t" type="text" ${b("dmgType")} value="${esc(a.dmgType||"")}"></label>
      <label class="field"><span>Bonus au toucher</span><input id="at-bh" type="number" ${b("bonusHit")} data-num value="${esc(a.bonusHit||0)}"></label>
      <label class="field"><span>Bonus aux dégâts</span><input id="at-bd" type="number" ${b("bonusDmg")} data-num value="${esc(a.bonusDmg||0)}"></label></div>
      <label class="row"><input id="at-p" type="checkbox" ${b("prof")} ${a.prof!==false?"checked":""}>Maîtrise de l'arme</label>
      ${D.inv.has("pacte-de-la-lame")?`<label class="row"><input id="at-pact" type="checkbox" ${b("pact")} ${a.pact?"checked":""}>Arme de pacte (Charisme, maîtrise)</label>`:""}
      </div>
      <div class="row" style="justify-content:space-between"><button class="btn small ghost danger" data-act="rmAttack" data-id="${a.id}">Supprimer l'attaque</button><button class="btn primary" data-act="closeModal">Terminé</button></div></div></div>`;
  }
}