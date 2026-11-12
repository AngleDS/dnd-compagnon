/* ---------- mode table (dés physiques) ---------- */
const ECO = {action:"Action", bonus:"Action bonus", reaction:"Réaction", autre:"Autre"};
const COND_FX = {
  "Aveuglé":{atk:"d",note:"Désavantage à tes attaques ; les attaques contre toi ont l'avantage ; échec aux tests qui demandent la vue."},
  "Empoisonné":{atk:"d",test:"d",note:"Désavantage aux jets d'attaque et aux tests de caractéristique."},
  "Effrayé":{atk:"d",test:"d",note:"Désavantage aux tests et aux attaques tant que la source de ta peur est en vue."},
  "Entravé":{atk:"d",save_dex:"d",note:"Désavantage aux attaques et aux JS de Dextérité ; vitesse 0."},
  "À terre":{atk:"d",note:"Désavantage à tes attaques ; te relever coûte la moitié de ta vitesse."},
  "Agrippé":{note:"Vitesse 0 ; désavantage aux attaques contre une autre cible que celle qui t'agrippe."},
  "Neutralisé":{note:"Ni action, ni action bonus, ni réaction ; ta concentration est brisée."},
  "Paralysé":{save_for:"f",save_dex:"f",note:"Neutralisé ; échec automatique aux JS de Force et de Dextérité."},
  "Étourdi":{save_for:"f",save_dex:"f",note:"Neutralisé ; échec automatique aux JS de Force et de Dextérité."},
  "Inconscient":{save_for:"f",save_dex:"f",note:"Neutralisé et à terre ; échec automatique aux JS de Force et de Dextérité."},
  "Pétrifié":{save_for:"f",save_dex:"f",note:"Neutralisé ; échec automatique aux JS de Force et de Dextérité."},
  "Invisible":{atk:"a",init:"a",note:"Avantage à tes attaques (et à l'initiative) ; les attaques contre toi ont le désavantage."},
  "Assourdi":{note:"Échec automatique aux tests qui demandent l'ouïe."},
  "Charmé":{note:"Tu ne peux pas attaquer ni cibler ton charmeur avec des dégâts."},
};
const sgc=v=>v>0?"pos":(v<0?"neg":"zero");
const deAb=a=>a==="int"?"d’Intelligence":"de "+ABN[a];
function costOfSpell(sp){
  const ct=norm(sp.casting_time||"");
  if(ct.startsWith("action bonus")) return "bonus";
  if(ct.startsWith("reaction")) return "reaction";
  if(ct.startsWith("action")) return "action";
  return "autre";
}
function costGuess(text){
  const t=String(text||"");
  const pats=[["bonus",/[Pp]ar une action Bonus\b|en entreprenant une action Bonus|au prix d’une action Bonus|utiliser une action Bonus/],
              ["reaction",/[Pp]ar une Réaction\b|jouer votre Réaction|utiliser votre Réaction|en jouant votre Réaction|jouer une Réaction/],
              ["action",/[Pp]ar une action\b(?! Bonus)|par l’action Magie|en entreprenant l’action Magie|au prix de l’action Magie|entreprendre l’action Magie/]];
  let best=null, pos=1e9;
  for(const [k,re] of pats){ const m=t.match(re); if(m&&m.index<pos){ pos=m.index; best=k; } }
  return best;
}
function bonusParts(D,cibles){ return D.effs.filter(e=>e.t==="bonus"&&cibles.includes(e.cible)).map(e=>({l:e._src,v:evalF(e.val,D.ctx)})).filter(p=>p.v); }
function tableItems(ch,D){
  const it=[], costs=ch.costs||{};
  const add=o=>{ o.cost = costs[o.key]!==undefined ? (costs[o.key]||null) : o.cost; it.push(o); };
  for(const a of AB){
    add({key:"abil:"+a,kind:"abil",name:"Test "+deAb(a),sub:"Test sans compétence",al:[ABS[a],ABN[a],"test","caracteristique"],ab:a,mod:D.mods[a]+D.testB,parts:[{l:ABN[a],v:D.mods[a]}].concat(D.testB?[{l:"Objets",v:D.testB}]:[])});
    const sv=D.saves[a];
    add({key:"save:"+a,kind:"save",name:"JS "+deAb(a),sub:"Jet de sauvegarde",al:["js","jds","sauvegarde",ABS[a],ABN[a]],ab:a,mod:sv.val,parts:[{l:ABN[a],v:D.mods[a]},...(sv.prof?[{l:"Maîtrise",v:D.pb}]:[]),...bonusParts(D,["jds:"+a,"jds:all"])]});
  }
  for(const s of S.C.skills){ const k=D.skills[s.id];
    add({key:"skill:"+s.id,kind:"skill",name:s.name,sub:"Test "+deAb(s.ability),al:[ABS[s.ability],"test"],ab:s.ability,mod:k.val,parts:[{l:ABN[s.ability],v:D.mods[s.ability]},...(k.lv?[{l:k.lv===2?"Expertise":"Maîtrise",v:k.lv*D.pb}]:[]),...bonusParts(D,["comp:"+s.id,"comp:all"])]}); }
  add({key:"init",kind:"init",name:"Initiative",sub:"Test de Dextérité",al:["init","ini"],ab:"dex",mod:D.init,parts:[{l:"Dextérité",v:D.mods.dex},...bonusParts(D,["init"])]});
  add({key:"conc",kind:"save",name:"Concentration",sub:"JS de Constitution · DD 10 ou moitié des dégâts",al:["conc","js con"],ab:"con",mod:D.saves.con.val,parts:[{l:"Constitution",v:D.mods.con},...(D.saves.con.prof?[{l:"Maîtrise",v:D.pb}]:[])]});
  for(const a of ch.attacks||[]){ const r=weaponAttack(a,ch,D);
    add({key:"atk:"+a.id,kind:"atk",name:r.name,sub:"Attaque d'arme"+(r.props&&r.props!=="—"?" · "+r.props:""),al:["attaque","arme"],cost:"action",mod:r.hit,dmg:r.dmg,dtype:r.type,mastery:r.mastery,pact:!!a.pact,wref:a.weapon||"",held:atkHeld(ch,a),bagId:(atkBag(ch,a)||{}).id||null,parts:[{l:ABN[r.ab],v:D.mods[r.ab]},...((a.pact||a.prof!==false)?[{l:"Maîtrise",v:D.pb}]:[]),...((+a.bonusHit)?[{l:"Bonus",v:+a.bonusHit}]:[]),...(r.mgN?[{l:"Magique",v:r.mgN}]:[])]}); }
  for(const e of D.effs) if(e.t==="attaque"){ let ab=e.carac||"sort"; if(ab==="sort") ab=D.cast?.ability||"cha";
    add({key:"eatk:"+norm(e.nom),kind:"atk",name:e.nom||e._src,sub:"Attaque · "+e._src,al:["attaque"],cost:"action",mod:D.mods[ab]+(e.maitrise!==false?D.pb:0),dmg:(e.des||"1d6")+(e.ajoutMod?sg(D.mods[ab]):""),dtype:e.type||"",parts:[{l:ABN[ab],v:D.mods[ab]},{l:"Maîtrise",v:D.pb}]}); }
  if(D.cast) for(const s of spellList(ch,D)) if(s.prepared||s.sp.level===0){
    const m=spellMech(s.sp);
    const slv=s.sp.level===0?0:(D.cast.type==="pact"?Math.max(D.cast.pactLevel,s.sp.level):s.sp.level);
    add({key:"spell:"+s.ref,kind:"spell",name:s.sp.name,sub:(s.sp.level?"Sort niv. "+s.sp.level:"Sort mineur")+" · "+[s.sp.casting_time,s.sp.range].filter(Boolean).join(" · "),al:["sort",s.sp.school||""],cost:costOfSpell(s.sp),ref:s.ref,sp:s.sp,m,
      roll:m.attack?sg(D.cast.atk):(m.save?"DD "+D.cast.dc:""), dice:diceAt(m,s.sp,slv,D)||"", heal:!!m.heal});
  }
  const featText=[];
  if(D.cls){ for(const f of D.cls.features) if(f.level<=D.L) featText.push({o:D.cls.name,n:f.name,t:f.text,ref:D.cls.hb?D.cls.id:"srd"});
    if(ch.subclass&&ch.subclass.startsWith("srd:")){ const sc=D.cls.subclasses.find(s=>"srd:"+s.id===ch.subclass); if(sc) for(const f of sc.features) if(f.level<=D.L) featText.push({o:sc.name,n:f.name,t:f.text,ref:"srd"}); } }
  for(const s of D.sources) featText.push({o:s.origin,n:s.name,t:s.text,ref:s.ref,effects:s.effects});
  const spc=srd("species",ch.species); if(spc) for(const t of spc.traits) featText.push({o:spc.name,n:t.name,t:t.text,ref:"srd"});
  for(const x of ch.invocations||[]){ const id=invId(x), i=S.idx.invocations[id]; if(i) featText.push({o:"Manifestation",n:invLabel(x),t:i.text,ref:"srd",cost:id==="armure-dombres"?"action":undefined,magic:id==="armure-dombres"}); }
  for(const f of featText){
    const res=D.res.find(r=>norm(r.name)===norm(f.n));
    add({key:"feat:"+norm(f.o+"/"+f.n),kind:"feat",name:f.n,sub:f.o,al:["aptitude"],cost:f.cost||costGuess(f.t)||(res&&res.id==="cls:rouerie-magique"?"autre":null),text:f.t,src:f.ref,res,magic:f.magic});
  }
  for(const r of D.res) if(!featText.some(f=>norm(f.n)===norm(r.name))) add({key:"res:"+r.id,kind:"feat",name:r.name,sub:"Ressource · "+r.origin,al:["ressource"],cost:r.id==="cls:rouerie-magique"?"autre":null,text:"",res:r});
  for(const c of ch.counters||[]) add({key:"cnt:"+c.id,kind:"counter",name:c.name,sub:"Consommable",al:["objet"],cost:null,counter:c});
  for(const g of S.C.glossary){
    if(g.tag==="Action") add({key:"basic:"+g.id,kind:"basic",name:g.name,sub:"Action de base",al:["action"],cost:"action",text:g.text});
    else if(g.id==="attaques-dopportunite") add({key:"rule:"+g.id,kind:"rule",name:g.name,sub:g.tag||"Règle",al:[g.tag||"regle"],cost:"reaction",text:g.text});
    // États et repos : consultables depuis la recherche (règle seule, sans coût de tour).
    else if(g.tag==="État") add({key:"rule:"+g.id,kind:"rule",name:g.name,sub:"État",al:["etat"],cost:null,text:g.text,info:true,cond:CONDS.includes(g.name)?g.name:null});
    else if(g.id==="repos-court"||g.id==="repos-long") add({key:"rule:"+g.id,kind:"rule",name:g.name,sub:"Règle",al:["repos"],cost:null,text:g.text,info:true,rest:g.id==="repos-court"?"court":"long"});
  }
  for(const b of ch.bag||[]){ if(!((+b.qty||0)>0)) continue; const ref=b.ref||matchItem(b.name);
    const html=ref?itemTipHtml(ref).replace(/<div class="tiphead">[\s\S]*?<\/div>/,""):"";
    const u=itemUse(ch,b);
    add({key:"bag:"+b.id,kind:"bagitem",costs:u&&u.spells?[...new Set(u.spells.map(z=>costOfSpell(z.sp)||"action"))]:null,name:b.name,sub:u?u.sub:"Inventaire · "+(+b.qty||0)+(b.note?" · "+b.note:""),al:["objet","inventaire"],cost:u?u.cost:null,held:u?u.held:null,use:u,bagId:b.id,text:html?"":(b.note||"Pas de fiche pour cet objet."),html}); }
  return it;
}
function searchItems(items,q){
  const toks=norm(q).split(/\s+/).filter(Boolean); if(!toks.length) return [];
  const out=[];
  for(const i of items){
    const nm=norm(i.name), hay=(nm+" "+norm(i.sub)+" "+i.al.map(norm).join(" ")).split(/[\s/()·,’'-]+/);
    let score=0, ok=true;
    for(const t of toks){
      if(hay.includes(t)) score+=3;
      if(nm.startsWith(t)) score+=4; else if(hay.some(w=>w.startsWith(t))) score+=2; else if(nm.includes(t)) score+=1; else { ok=false; break; }
    }
    if(!ok) continue;
    if(i.kind==="rule"||i.kind==="basic") score-=1.5;
    if(i.kind==="abil") score-=0.5;
    out.push([score,i]);
  }
  return out.sort((a,b)=>b[0]-a[0]).slice(0,8).map(x=>x[1]);
}
function condAdvice(ch,kind,ab){
  const notes=[]; let a=0,d=0,fail=false;
  for(const c of ch.conditions||[]){ const fx=COND_FX[c]; if(!fx) continue;
    let hit=false;
    if((kind==="atk"||kind==="spellatk")&&fx.atk){ fx.atk==="a"?a++:d++; hit=true; }
    if((kind==="skill"||kind==="abil"||kind==="init")&&fx.test){ fx.test==="a"?a++:d++; hit=true; }
    if(kind==="init"&&fx.init){ a++; hit=true; }
    if(kind==="save"&&fx["save_"+ab]){ if(fx["save_"+ab]==="f") fail=true; else d++; hit=true; }
    if(hit||kind==="any") notes.push("<b>"+esc(c)+"</b> : "+esc(fx.note));
  }
  if(+ch.exhaustion) notes.push(`<b>Épuisement ${+ch.exhaustion}</b> : −${2*ch.exhaustion} au résultat.`);
  { const arm=ch.armor||""; const a2=arm.startsWith("srd:")&&S.idx.armors[arm.slice(4)]; const cl=clsOf(ch.classId);
    if(a2&&cl&&!(cl.armor||[]).includes(a2.category)&&(ab==="for"||ab==="dex"||kind==="atk")){ d++; notes.push(`<b>${esc(a2.name)} sans formation</b> : désavantage aux tests d20 de Force ou de Dextérité.`); }
    if(a2&&a2.stealthDisadvantage&&kind==="skill"&&ab==="dex"&&S.T&&S.T.sel==="skill:discretion"){ d++; notes.push(`<b>${esc(a2.name)}</b> : désavantage en Discrétion.`); } }
  return {mode:fail?"f":(a&&!d?"a":(d&&!a?"d":(a&&d?"n":null))), notes};
}
function ensureBag(ch){ if(ch&&!Array.isArray(ch.bag)){ ch.bag=String(ch.inventory||"").split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{ const m=l.match(/^(\d+)\s+(.*)$/); return {id:uid(),name:m?m[2]:l,qty:m?+m[1]:1,note:""}; }); touch(S.cur); }}
function pLegend(exp){ return `<div class="plegend"><span><span class="pdot p1"></span>Maîtrise</span>${exp?`<span><span class="pdot p2"></span>Expertise</span>`:""}</div>`; }
/* ---------- équipement ---------- */
const EQ=[
  ["tete","Tête",/heaume|casque|chapeau|couronne|bandeau|diad[eè]me|capuch|lunettes|yeux|tiare|masque/i],
  ["cou","Cou",/amulette|collier|m[ée]daillon|broche|pendentif|scarab[ée]e|talisman/i],
  ["cape","Cape",/cape|manteau|mante|robe/i],
  ["corps","Armure",null],
  ["mains","Mains",/gant|gantelet|bracelet|brassard/i],
  ["ceinture","Ceinture",/ceinture/i],
  ["anneau1","Anneau",/anneau|bague/i],
  ["anneau2","Anneau",/anneau|bague/i],
  ["pieds","Pieds",/botte|chaussure|sandale|pantoufle|souliers|fers/i],
  ["mainP","Main principale",null],
  ["mainS","Main secondaire",null]];
const ARM_TIME={legere:["1 min","1 min"],intermediaire:["5 min","1 min"],lourde:["10 min","5 min"]};
const ARM_CAT={legere:"légère",intermediaire:"intermédiaire",lourde:"lourde"};
function atkBag(ch,a){ const bag=(ch.bag||[]).filter(b=>(+b.qty||0)>0);
  if(a.bagId){ const b=bag.find(x=>x.id===a.bagId); if(b) return b; }
  const n=norm(a.name||""); if(n){ const b=bag.find(x=>{ const m=norm(x.name); return m===n||m.startsWith(n+" ")||m.startsWith(n+"(")||n.startsWith(m); }); if(b) return b; }
  if(a.weapon&&a.weapon.startsWith("srd:")){ const r="item:arme:"+a.weapon.slice(4); const b=bag.find(x=>(x.ref||matchItem(x.name))===r); if(b) return b; }
  return null; }
function atkHeld(ch,a){ // null = pas de suivi (aucune main renseignée)
  const eq=ch.equip||{}; if(!eq.mainP&&!eq.mainS) return null;
  if(a.pact) return true;
  const b=atkBag(ch,a); if(!b) return null;
  return eq.mainP===b.id||eq.mainS===b.id; }
function eqInfo(b){ // nature d'un objet du sac
  const ref=b.ref||matchItem(b.name)||"";
  if(ref.startsWith("item:armure:")){ const a=S.idx.armors[ref.slice(12)]; if(a) return {type:a.id==="bouclier"?"shield":"armor",a,ref}; }
  if(ref.startsWith("item:arme:")){ const w=S.idx.weapons[ref.slice(10)]; if(w) return {type:"weapon",w,ref}; }
  if(ref.startsWith("item:magique:")){ const m=S.C.items.find(x=>x.kind==="magique"&&"item:magique:"+x.id===ref); return {type:"magic",m,ref,attune:!!(m&&m.attune)}; }
  if(ref.startsWith("hb:")){ const h=hb(ref); return {type:"hb",h,ref,attune:!!(h&&/harmonisation/i.test(h.text||""))}; }
  return {type:"other",ref};
}
function eqFits(slot,b){ const e=eqInfo(b), def=EQ.find(x=>x[0]===slot);
  if(slot==="corps") return e.type==="armor";
  if(slot==="mainP") return e.type==="weapon"||/canne|b[âa]ton|[ée]p[ée]e|lame|dague|arc|arbal|hache|marteau|masse|lance|fouet|focali|baguette|sceptre/i.test(b.name);
  if(slot==="mainS") return e.type==="weapon"||e.type==="shield"||/torche|lanterne|bouclier|dague|focali/i.test(b.name);
  if(e.type==="armor"||e.type==="shield") return false;
  return def&&def[2]?def[2].test(b.name):false; }
function eqState(ch){ const eq=ch.equip||{}, bag=ch.bag||[], get=id=>bag.find(b=>b.id===id&&(+b.qty||0)>0); const out={};
  for(const [k] of EQ){ const b=eq[k]&&get(eq[k]); if(b) out[k]=b; }
  return out; }
function twoHanded(b){ const e=b&&eqInfo(b); return !!(e&&e.type==="weapon"&&/deux mains/i.test(e.w.properties||"")); }
function eqSet(ch,slot,bagId){
  ch.equip=ch.equip||{}; const bag=ch.bag||[]; const b=bagId&&bag.find(x=>x.id===bagId);
  // retirer l'objet d'un autre emplacement
  if(b) for(const k in ch.equip) if(ch.equip[k]===bagId) { delete ch.equip[k]; if(k==="corps") ch.armor="none"; if(k==="mainS"&&eqInfo(b).type==="shield") ch.shield=false; }
  const prev=ch.equip[slot]&&bag.find(x=>x.id===ch.equip[slot]);
  if(slot==="corps"){ if(b){ const e=eqInfo(b); ch.armor="srd:"+e.a.id; ch.equip.corps=bagId; } else { delete ch.equip.corps; if(ch.armor&&ch.armor.startsWith("srd:")) ch.armor="none"; else if(ch.armor==="mage") ch.armor="none"; } }
  else if(slot==="mainS"){ if(prev&&eqInfo(prev).type==="shield") ch.shield=false; if(b){ if(twoHanded(eqState(ch).mainP)) delete ch.equip.mainP; ch.equip.mainS=bagId; if(eqInfo(b).type==="shield") ch.shield=true; } else delete ch.equip.mainS; }
  else if(slot==="mainP"){ if(b){ ch.equip.mainP=bagId; if(twoHanded(b)&&ch.equip.mainS){ const s=bag.find(x=>x.id===ch.equip.mainS); if(s&&eqInfo(s).type==="shield") ch.shield=false; delete ch.equip.mainS; } } else delete ch.equip.mainP; }
  else { if(b) ch.equip[slot]=bagId; else delete ch.equip[slot]; }
  ch.attuned=(ch.attuned||[]).filter(id=>bag.some(x=>x.id===id));
}
// Glisser-déposer : src = {slot} (emplacement) ou {bag} (objet du sac) ; dst = {slot} ou {sac:true} (retirer).
// D'un emplacement à un autre occupé : échange, seulement si chaque objet convient à sa nouvelle place.
// Du sac vers un emplacement occupé : l'ancien objet retourne dans le sac.
// Mains : mêmes règles que la liste d'un emplacement (tout objet sauf armure ; pas de bouclier en main principale).
function eqDropFits(slot,b){ const t=eqInfo(b).type;
  if(slot==="mainP") return t!=="armor"&&t!=="shield";
  if(slot==="mainS") return t!=="armor";
  return eqFits(slot,b); }
function eqMoveOk(ch,src,dst){
  const st=eqState(ch), X=src.slot?st[src.slot]:(ch.bag||[]).find(b=>b.id===src.bag&&(+b.qty||0)>0);
  if(!X) return false;
  if(dst.sac) return !!src.slot;
  if(!dst.slot||dst.slot===src.slot||!eqDropFits(dst.slot,X)) return false;
  if(src.slot){ const Y=st[dst.slot]; if(Y&&!eqDropFits(src.slot,Y)) return false; }
  return true;
}
function eqMove(ch,src,dst){
  if(!eqMoveOk(ch,src,dst)) return false;
  const st=eqState(ch), X=src.slot?st[src.slot]:(ch.bag||[]).find(b=>b.id===src.bag);
  if(dst.sac){ eqSet(ch,src.slot,null); return true; }
  const Y=src.slot?st[dst.slot]:null;
  eqSet(ch,dst.slot,X.id);
  if(Y) eqSet(ch,src.slot,Y.id);
  return true;
}
function eqSilhouette(){ return `<svg class="eqfig" viewBox="0 0 120 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><circle cx="60" cy="24" r="16"/><path d="M33 58c6-8 16-12 27-12s21 4 27 12l10 52c1 5-2 8-6 8-3 0-5-2-6-5l-7-36v42l6 88c0 5-3 8-8 8-4 0-7-3-8-7l-8-70-8 70c-1 4-4 7-8 7-5 0-8-3-8-8l6-88V77l-7 36c-1 3-3 5-6 5-4 0-7-3-6-8z"/></svg>`; }
// positions : [colonne, haut %, point x %, point y %] sur la scène
// [colonne, haut de la carte %, point x, point y dans la silhouette (viewBox 120×220)]
// [placement, haut % (ordinateur), haut % (téléphone), point x, point y dans la silhouette 120×220] — seule l'armure est reliée
const EQ_POS={tete:["T",0,0],corps:["L",16,20,60,84],mainS:["L",44,46],mainP:["R",44,46],pieds:["B",86,82]};
const EQ_BOTTOM=["cape","cou","ceinture","mains","anneau1","anneau2"];
// géométrie de la scène : ratio largeur/hauteur, hauteur et haut de la silhouette (%), largeur des cartes (%)
const EQ_GEO={desk:{ar:1.6,fh:68,ft:15,cw:30},mob:{ar:0.9,fh:62,ft:19,cw:31}};
function eqPt(px,py,g){ const fw=g.fh*120/220/g.ar, fl=(100-fw)/2; return [fl+px/120*fw, g.ft+py/220*g.fh]; }
function eqSlotData(ch,D,k,st,att){
  const def=EQ.find(x=>x[0]===k), b=st[k]; let val="", sub="", warn="", cls="";
  if(k==="corps"){
    if(b){ const a=eqInfo(b).a; val=b.name; const t=ARM_TIME[a.category]||["?","?"]; sub=`Armure ${ARM_CAT[a.category]||""} · enfiler ${t[0]}, retirer ${t[1]}`;
      const trained=(D.cls?.armor||[]).includes(a.category); if(!trained) warn="Non formé : désavantage aux tests d20 de Force et Dextérité, pas de sorts";
      else if(a.strength&&(+ch.abilities?.for||10)<a.strength) warn=`Force ${a.strength} requise : −3 m de vitesse`;
      if(a.stealthDisadvantage) sub+=" · Désavantage en Discrétion"; }
    else if(ch.armor==="mage"){ val="Armure du mage"; sub="Effet magique · CA 13 + Dex"; cls=" fx"; }
    else if(ch.armor&&ch.armor.startsWith("srd:")){ val=S.idx.armors[ch.armor.slice(4)]?.name||""; sub="Choisie dans Construction"; }
  } else if(k==="mainS"&&!b&&twoHanded(st.mainP)){ val="Arme à deux mains"; sub="Main occupée"; cls=" busy"; }
  else if(b){ const e=eqInfo(b); val=b.name;
    if(e.type==="weapon") sub=[e.w.damage+" "+e.w.damageType, e.w.properties&&e.w.properties!=="—"?e.w.properties:""].filter(Boolean).join(" · ");
    else if(e.type==="shield"){ sub="+2 CA · prendre ou poser : action Utilisation"; if(!(D.cls?.armor||[]).includes("bouclier")) warn="Non formé au bouclier : pas de bonus de CA"; }
    else if(e.attune) sub=att.includes(b.id)?"Harmonisé":"Harmonisation requise"; }
  if(k==="mainS"&&!b&&ch.shield&&!twoHanded(st.mainP)){ val="Bouclier"; sub="+2 CA · coché dans Construction"; }
  return {k,label:def[1],b,val,sub,warn,cls,att:!!(b&&eqInfo(b).attune),on:!!(b&&att.includes(b.id))};
}
function eqPop(ch,D){
  const T=S.T, st=eqState(ch), att=(ch.attuned||[]).filter(id=>(ch.bag||[]).some(b=>b.id===id&&(+b.qty||0)>0));
  const sel=T.eqSlot;
  if(sel){ // choix pour un emplacement
    const def=EQ.find(x=>x[0]===sel), bag=(ch.bag||[]).filter(b=>(+b.qty||0)>0), sd=eqSlotData(ch,D,sel,st,att);
    const fit=bag.filter(b=>eqFits(sel,b)), other=sel==="corps"?[]:bag.filter(b=>!eqFits(sel,b)&&!["armor","shield"].includes(eqInfo(b).type)&&(sel==="mainP"||sel==="mainS"||eqInfo(b).type!=="weapon"));
    const row=b=>{ const on=(ch.equip||{})[sel]===b.id; const where=Object.entries(ch.equip||{}).find(([k,v])=>v===b.id&&k!==sel);
      return `<button class="eqpick${on?" on":""}" data-act="eqset" data-slot="${sel}" data-id="${b.id}"><span>${esc(b.name)}</span>${where?`<small class="muted">porté : ${esc(EQ.find(x=>x[0]===where[0])[1])}</small>`:""}${on?`<small>équipé</small>`:""}</button>`; };
    const cur0=(ch.equip||{})[sel]||(sel==="corps"&&ch.armor&&ch.armor!=="none");
    return `<div class="row" style="justify-content:space-between;margin-bottom:8px"><button class="btn small ghost" data-act="eqback">← Retour</button><b>${esc(def[1])}</b>${cur0?`<button class="btn small" data-act="eqset" data-slot="${sel}" data-id="">Retirer</button>`:"<span></span>"}</div>
      ${sd.val?`<div class="eqcur${sd.warn?" warn":""}"><b>${sd.b?itemName(sd.b):esc(sd.val)}</b>${sd.sub?`<div class="muted" style="font-size:var(--fs-sm)">${esc(sd.sub)}</div>`:""}${sd.warn?`<div class="eqwarn">${esc(sd.warn)}</div>`:""}${sd.att?`<button class="btn small" data-act="eqatt" data-id="${sd.b.id}">${sd.on?"◆ Harmonisé · retirer":"◇ S'harmoniser"}</button>`:""}</div>`:""}
      <div class="label" style="margin:10px 0 6px">Objets du sac</div>
      ${fit.length?`<div class="eqlist">${fit.map(row).join("")}</div>`:`<div class="muted" style="font-size:var(--fs-sm)">Aucun objet du sac ne correspond à cet emplacement.${sel==="corps"?" Ajoute une armure dans l'inventaire.":""}</div>`}
      ${other.length?`<details class="tdesc"><summary class="label">Autres objets du sac</summary><div class="eqlist">${other.map(row).join("")}</div></details>`:""}`;
  }
  const card=k=>{ const d=eqSlotData(ch,D,k,st,att), p=EQ_POS[k];
    return `<button class="eqcard ${({L:"l",R:"r",T:"c",B:"c"})[p[0]]}${d.val?" full":""}${d.warn?" warn":""}${d.cls}" style="--td:${p[1]}%;--tm:${p[2]}%" data-act="eqslot" data-v="${k}" data-eqdrop="slot"${d.b?` data-eqdrag="1" data-name="${esc(d.b.name)}"`:""} title="${esc(d.sub||d.label)}"><span class="label">${esc(d.label)}</span><b>${d.val?esc(d.val):`<span class="muted">vide</span>`}</b>${d.att?`<span class="eqdia${d.on?" on":""}">${d.on?"◆":"◇"}</span>`:""}${d.warn?`<span class="eqbang">!</span>`:""}</button>`; };
  const svgFor=(mode)=>{ const g=EQ_GEO[mode]; let l="",d="";
    for(const [k,p] of Object.entries(EQ_POS)){ if(p.length<5) continue; const full=!!eqSlotData(ch,D,k,st,att).val; const [x2,y2]=eqPt(p[3],p[4],g); const x1=p[0]==="L"?g.cw:100-g.cw, y1=(mode==="desk"?p[1]:p[2])+(mode==="desk"?6.5:8.5);
      l+=`<line x1="${x1}" y1="${y1}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" class="${full?"on":""}"/>`; d+=`<circle cx="${x2.toFixed(2)}" cy="${y2.toFixed(2)}" r="${mode==="desk"?0.7:1.1}" class="${full?"on":""}"/>`; }
    const fw=g.fh*120/220/g.ar;
    return `<div class="eqfigbox ${mode}" style="left:${(100-fw)/2}%;width:${fw}%;top:${g.ft}%;height:${g.fh}%">${eqSilhouette()}</div><svg class="eqlines ${mode}" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${l}${d}</svg>`; };
  const pP=st.mainP&&eqInfo(st.mainP), pS=st.mainS&&eqInfo(st.mainS);
  const eqIds=new Set(Object.values(ch.equip||{})), sac=(ch.bag||[]).filter(b=>(+b.qty||0)>0&&!eqIds.has(b.id)&&EQ.some(([k])=>eqFits(k,b)));
  const twoW=pP&&pS&&pP.type==="weapon"&&pS.type==="weapon"&&/légère/i.test(pP.w.properties||"")&&/légère/i.test(pS.w.properties||"");
  const bcard=k=>{ const d=eqSlotData(ch,D,k,st,att);
    return `<button class="eqcard flat${d.val?" full":""}${d.warn?" warn":""}${d.cls}" data-act="eqslot" data-v="${k}" data-eqdrop="slot"${d.b?` data-eqdrag="1" data-name="${esc(d.b.name)}"`:""} title="${esc(d.sub||d.label)}"><span class="label">${esc(d.label)}</span><b>${d.val?esc(d.val):`<span class="muted">vide</span>`}</b>${d.att?`<span class="eqdia${d.on?" on":""}">${d.on?"◆":"◇"}</span>`:""}</button>`; };
  return `<div class="eqstage">${svgFor("desk")}${svgFor("mob")}${Object.keys(EQ_POS).map(card).join("")}</div>
    <div class="label" style="margin:12px 0 6px">Accessoires</div><div class="eqbottom">${EQ_BOTTOM.map(bcard).join("")}</div>
    <div class="label" style="margin:12px 0 6px">Sac</div><div class="eqsac" data-eqdrop="sac">${sac.length?sac.map(b=>`<span class="eqbag" data-eqdrag="1" data-id="${b.id}" data-name="${esc(b.name)}">${esc(b.name)}${(+b.qty||0)>1?` <small class="muted">×${+b.qty}</small>`:""}</span>`).join(""):`<span class="muted" style="font-size:var(--fs-sm)">Aucun objet à équiper dans le sac. Glisse un objet porté ici pour le retirer.</span>`}</div>
    <div class="row" style="justify-content:space-between;margin-top:8px"><span class="eqatt-count ${att.length>3?"over":""}">Harmonisation <b class="num">${att.length}/3</b></span></div>
    ${twoW?`<div class="tnotes">Deux armes légères : après avoir attaqué avec ta main principale, tu peux attaquer avec la main secondaire par une action Bonus (sans ton modificateur aux dégâts s'il est positif).</div>`:""}
    <div class="muted" style="font-size:var(--fs-sm);margin-top:6px">Touche un emplacement pour y mettre un objet de ton sac, ou fais glisser un objet vers un emplacement ou vers le sac (au doigt : appui long, puis glisser). ◇ = harmonisation (3 objets maximum). Changer d'arme est gratuit pendant une attaque (une arme par attaque).</div>`;
}
function tPop(ch,D){
  const T=S.T; if(T.pop==="tiles:reperes") T.pop="blk:reperes"; // Repères ne se personnalise plus (lot T3a)
  const k=T.pop; if(!k){ S.lastPop=null; return ""; }
  const saves=AB.map(a=>`<button class="tabhead ${sgc(D.saves[a].val)}" data-act="tsel" data-k="save:${a}"><span>${D.saves[a].prof?`<span class="pdot p1" title="Maîtrise"></span>`:""}${ABN[a]}</span><b class="num">${sg(D.saves[a].val)}</b></button>`).join("");
  const anim=S.lastPop!==k; S.lastPop=k;
  const wrap=(title,inner,extra="")=>`<div class="tpopback${anim?"":" still"}" data-act="tpopclose"><div class="tpop${extra}" role="dialog" aria-modal="true" aria-label="${esc(title)}" data-act="noop"><div class="tpophead"><b>${esc(title)}</b><button class="btn small ghost" data-act="tpopclose" aria-label="Fermer">×</button></div><div class="tpopbody">${inner}</div></div></div>`;
  if(k.startsWith("tiles:c_")) return customPop(ch,D,k.slice(6),wrap);
  if(k.startsWith("blk:")){ const id=k.slice(4); if(!TBLK.some(b=>b[0]===id)||BLK_FIXED.includes(id)){ T.pop=null; return ""; } return builtinPop(ch,D,id,wrap); }
  if(k==="blkadd"){ const gone=TBLK.filter(b=>blkHidden(ch,b[0]));
    return wrap("Ajouter un bloc",`${gone.length?`<div class="label" style="margin-bottom:6px">Blocs retirés</div><div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:14px">${gone.map(b=>`<button class="btn small" data-act="blkRestore" data-v="${b[0]}">+ ${esc(b[1])}</button>`).join("")}</div>`:""}<div class="label" style="margin-bottom:6px">Nouveau bloc : choisis son format</div><div class="muted" style="font-size:var(--fs-sm);margin-bottom:10px">Largeur sur la page (sur 4 colonnes) et nombre de rangées de tuiles. Tu places ensuite les tuiles dans la même fenêtre.</div>
    ${fmtMatrix([1,2,3,4],rangLab,(r,w)=>patThumb(w,r,w,false,`data-act="blkCreate" data-r="${r}" data-c="${w}"`,`${w} colonne${w>1?"s":""} · ${rangLab(r)}`))}
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn small ghost" data-act="layoutReset">Remettre l’ordre des blocs par défaut</button></div>`); }
  if(k.startsWith("tiles:")){ const blk=k.slice(6); if(!TILE_CAT[blk]){ T.pop=null; return ""; } return builtinPop(ch,D,blk,wrap); }
  if(k.startsWith("info:")) return infoPop(ch,D,k.slice(5),wrap);
  if(k==="speed") return speedPop(ch,D,wrap);
  if(k==="comp") return compPop(ch,wrap);
  if(k.startsWith("res:")) return resPop(ch,D,k.slice(4),wrap);
  if(k.startsWith("ctr:")) return ctrPop(ch,D,k.slice(4),wrap);
  if(k==="concchk") return ccPop(ch,D,anim);
  if(k==="equip") return wrap("Équipement",eqPop(ch,D)," xl");
  if(k==="hptemp"){ const t=+(ch.hp?.temp||0);
    return pvPop(wrap,{title:"PV temporaires",kind:"temp",label:"PV temporaires",val:String(t),act:"tmpstep",min:0,minusOff:t<=0,
      quick:`<button class="btn small" data-act="tmpstep" data-v="5">+5</button><button class="btn small" data-act="tmpstep" data-v="10">+10</button>${t?`<button class="btn small ghost" data-act="tmpstep" data-v="${-t}">Remettre à zéro</button>`:""}`,
      info:"",note:"Les PV temporaires ne s'additionnent pas : si tu en reçois d'autres, garde la valeur la plus haute. Les dégâts les retirent en premier ; ils disparaissent au repos long."}); }
  if(k==="hpmax"){ const b=D.hpBonus;
    return pvPop(wrap,{title:"Points de vie maximum",kind:"max",label:"Bonus ou malus temporaire",val:sg(b),act:"hpmaxb",min:-999,minusOff:D.hpMax<=1,
      quick:`<button class="btn small" data-act="hpmaxb" data-v="5">+5 (Aide)</button><button class="btn small" data-act="hpmaxb" data-v="10">+10</button>${b?`<button class="btn small ghost" data-act="hpmaxb" data-v="${-b}">Remettre à zéro</button>`:""}`,
      info:`Base <b class="num">${D.hpBase}</b> · Maximum actuel <b class="num">${D.hpMax}</b>`,
      note:"Un bonus augmente aussi tes PV actuels du même montant (comme le sort Aide). Un malus les plafonne au nouveau maximum. Tout revient à la normale au repos long."}); }
  if(k==="qroll") return qrollPop(ch,D,wrap);
  if(k==="insp"){ const human=(()=>{ const sp=srd("species",ch.species); return !!(sp&&sp.traits.some(t=>t.name==="Ingénieux")); })();
    return wrap("Inspiration héroïque",`<div class="texpl inspgain"><p>Tu as déjà utilisé ton Inspiration héroïque.</p><p class="muted">${human?"Tu la regagnes à la fin de ton prochain repos long (Ingénieux). ":""}Le MJ peut aussi t'en accorder une. On n'en a qu'une à la fois.</p><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" data-act="inspGain">Le MJ me l'accorde</button></div></div>`); }
  if(k==="rest"){ const hdLeft=Math.max(0,D.L-(+ch.hdUsed||0)), cur0=+(ch.hp?.cur||0);
    const shortRes=[...D.res.filter(r=>r.recharge==="court"||r.recharge==="long_court1"||r.recharge==="court_partiel"||(r.recharge==="long_court5"&&D.L>=5)).map(r=>r.name),...(ch.counters||[]).filter(c=>c&&c.recharge==="court").map(c=>c.name)];
    const kind=S.T.restKind||"court";
    const pick=`<div class="adv" role="group" aria-label="Type de repos" style="margin-bottom:12px;grid-template-columns:repeat(2,1fr)"><button aria-pressed="${kind==="court"}" data-act="restKind" data-v="court">Repos court</button><button aria-pressed="${kind==="long"}" data-act="restKind" data-v="long">Repos long</button></div><div class="muted restwhat" style="font-size:var(--fs-sm);margin:-4px 0 12px">${kind==="long"?"8 heures au moins. Tout revient : PV, dés de vie, emplacements et ressources ; l'épuisement baisse d'un niveau.":`1 heure au moins. Tu peux dépenser des dés de vie (${hdLeft} restant${hdLeft>1?"s":""}) ; ${D.cast&&D.cast.type==="pact"?"tes emplacements de pacte reviennent, ":""}ainsi que les ressources de repos court.`}</div>`;
    if(kind==="long"){ const human=(()=>{ const sp=srd("species",ch.species); return !!(sp&&sp.traits.some(t=>t.name==="Ingénieux")); })();
      return wrap("Repos",pick+`<div class="row" style="gap:18px;align-items:flex-end"><div><div class="label">Points de vie</div><b class="num" style="font-size:var(--fs-2xl)">${cur0}</b><span class="muted num"> / ${D.hpBase}</span></div><div><div class="label">Dés de vie restants</div><b class="num" style="font-size:var(--fs-2xl)">${hdLeft}</b><span class="muted num"> / ${D.L}</span></div></div>
        <div class="lusec"><div class="label">À la fin du repos long</div><ul class="lul"><li>PV au maximum (${D.hpBase})${D.hpBonus?", bonus de PV max temporaire retiré":""}</li><li>Tous les dés de vie récupérés</li><li>${D.cast?"Tous les emplacements de sorts récupérés":"Ressources récupérées"}</li>${D.res.length?`<li>${D.res.map(r=>esc(r.name)).join(", ")}</li>`:""}${(ch.counters||[]).some(c=>c&&c.recharge)?`<li>${(ch.counters||[]).filter(c=>c&&c.recharge).map(c=>esc(c.name)).join(", ")}</li>`:""}${+ch.exhaustion?`<li>Épuisement : ${+ch.exhaustion} → ${+ch.exhaustion-1}</li>`:""}${human?"<li>Inspiration héroïque regagnée (Ingénieux)</li>":""}</ul></div>
        ${cur0<=0?`<div class="tnotes" style="color:var(--blood)">Il faut au moins 1 PV pour commencer un repos long.</div>`:""}<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" data-act="restLong" ${cur0<=0?"disabled":""}>Terminer le repos long</button></div>`); }
    return wrap("Repos",pick+`${cur0<=0?`<div class="tnotes" style="color:var(--blood)">Il faut au moins 1 PV pour commencer un repos court.</div>`:""}
      <div class="row" style="gap:18px;align-items:flex-end"><div><div class="label">Points de vie</div><b class="num" style="font-size:var(--fs-2xl)">${cur0}</b><span class="muted num"> / ${D.hpMax}</span></div>
      <div><div class="label">Dés de vie restants</div><b class="num" style="font-size:var(--fs-2xl)">${hdLeft}</b><span class="muted num"> / ${D.L} · d${D.hd} ${sg(D.mods.con)}</span></div></div>
      <div class="lusec"><div class="label">Dépenser un dé de vie</div>
        ${hdLeft>0?`${cur0>=D.hpMax?`<div class="muted hdfull" style="font-size:var(--fs-sm)">PV déjà au maximum : dépenser un dé maintenant ne rendrait rien.</div>`:""}<form class="row" data-form="hdroll"${cur0>=D.hpMax?" data-full":""} style="gap:8px"><label class="row" style="gap:6px">Ton d${D.hd}<input id="t-hd" type="number" inputmode="numeric" min="1" max="${D.hd}" style="width:70px;font-size:var(--fs-lg)"${cur0>=D.hpMax?" disabled":""}></label><button class="btn primary" type="submit"${cur0>=D.hpMax?" disabled":""}>Appliquer</button><button class="btn" type="button" data-virtual data-act="hdvirt"${cur0>=D.hpMax?" disabled":""}>Lancer virtuellement</button></form>
        <div class="muted" style="font-size:var(--fs-sm)">Chaque dé rend son résultat ${sg(D.mods.con)} PV (minimum 1). Tu peux en dépenser plusieurs, un par un.</div>`:`<div class="muted" style="font-size:var(--fs-sm)">Plus de dé de vie : ils reviennent au repos long.</div>`}
        ${S.T.hdLast?`<div class="tnotes">${esc(S.T.hdLast)}</div>`:""}</div>
      <div class="lusec"><div class="label">À la fin du repos</div><ul class="lul"><li>${D.cast&&D.cast.type==="pact"?"Emplacements de pacte récupérés":"Pas d'emplacement récupéré (repos long)"}</li>${shortRes.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" data-act="restShort" ${cur0<=0?"disabled":""}>Terminer le repos court</button></div>`); }
  if(k==="search") return wrap("Recherche",searchBar());
  if(k==="notes") return wrap("Notes de partie",`<textarea id="t-notes" data-bind="sessionNotes" placeholder="Nom d'un PNJ, un indice, une somme gagnée…" style="min-height:260px;width:100%">${esc(ch.sessionNotes||"")}</textarea><div class="muted" style="font-size:var(--fs-sm);margin-top:6px">Séparées des notes du personnage. Enregistrées au fil de la frappe.</div>`);
  if(k==="card"){ const c=tCard(ch,D); if(!c){ T.pop=null; return ""; } return wrap("Détails",c," wide"); }
  if(k==="hist") return wrap("Historique des jets", histBody(ch));
  // Raccourcis Sorts, Attaques, Actions (lot T5) : listes de ce que le perso peut faire, un toucher ouvre la fiche (jet, dégâts)
  if(k.startsWith("list:")){ const w=k.slice(5), it=S.Titems||[], grp=(title,list)=>list.length?`<div class="tgrp"><div class="label">${esc(title)}</div><div class="tlist">${list.map(i=>tRow(i,false,false)).join("")}</div></div>`:"";
    if(w==="sorts"){ const sp=it.filter(i=>i.kind==="spell"), lv=[...new Set(sp.map(i=>i.sp.level))].sort((a,b)=>a-b);
      return wrap("Sorts",lv.map(l=>grp(l?"Niveau "+l:"Sorts mineurs",sp.filter(i=>i.sp.level===l))).join("")||`<div class="muted">Aucun sort préparé.</div>`); }
    if(w==="atk") return wrap("Attaques",grp("Armes et attaques",it.filter(i=>i.kind==="atk"))||`<div class="muted">Aucune attaque dans la fiche : ajoute tes armes dans l'onglet Feuille.</div>`);
    if(w==="actions") return wrap("Actions",`<div class="muted" style="font-size:var(--fs-sm);margin-bottom:8px">À ton tour : une action, une action bonus si une aptitude t'en donne une, ton déplacement, et une réaction avant ton prochain tour.</div>${it.some(i=>i.kind==="basic")?`<div class="tgrp"><div class="label">Actions de base</div><div class="tlist">${it.filter(i=>i.kind==="basic").map(i=>tRow(i,false,true)).join("")}</div></div>`:""}${grp("Réaction",it.filter(i=>i.kind==="rule"&&i.cost==="reaction"))}`);
    T.pop=null; return ""; }
  if(k.startsWith("eco:")){ const e=k.slice(4); T.eco=e; const used=!!(ch.turn||{})[e];
    return `<div class="tpopback${anim?"":" still"}" data-act="tpopclose"><div class="tpop" role="dialog" aria-modal="true" aria-label="${ECO[e]}" data-act="noop"><div class="tpophead"><b>${ECO[e]}</b><span class="row" style="gap:6px"><button class="btn small" data-act="tturn" data-v="${e}">${used?"Annuler":e==="autre"?"Marquer Autre terminé":"Marquer comme consommée"}</button><button class="btn small ghost" data-act="tpopclose" aria-label="Fermer">×</button></span></div><div class="tpopbody">${used?`<div class="muted" style="font-size:var(--fs-sm);margin-bottom:8px">✓ ${TURN_DONE[e]}</div>`:""}${tEco(ch,D)}</div></div></div>`; }
  const B={skills:["Tests de caractéristique",`<div class="tabil">${AB.map(a=>`<div class="tabrow"><button class="tabhead ${sgc(D.mods[a])}" data-act="tsel" data-k="abil:${a}"><span>${ABN[a]}</span><b class="num">${sg(D.mods[a])}</b></button><div class="tabsk">${S.C.skills.filter(s=>s.ability===a).map(s=>`<button class="tskc ${sgc(D.skills[s.id].val)}" data-act="tsel" data-k="skill:${s.id}">${D.skills[s.id].lv?`<span class="pdot p${D.skills[s.id].lv}" title="${D.skills[s.id].lv>1?"Expertise":"Maîtrise"}"></span>`:""}${esc(s.name)} <b class="num">${sg(D.skills[s.id].val)}</b></button>`).join("")||`<span class="muted" style="font-size:var(--fs-sm)">Aucune compétence</span>`}</div></div>`).join("")}</div>${pLegend(true)}`],saves:["Jets de sauvegarde",`<div class="tsavegrid">${saves}</div>${pLegend(false)}`],cond:["États",`<div class="condgrid">${CONDS.map(c=>`<span class="condpick"><button class="chip" aria-pressed="${(ch.conditions||[]).includes(c)}" data-act="cond" data-v="${esc(c)}">${esc(c)}</button>${S.idx.cond[c]?`<span class="tinfo" role="button" data-act="tip" data-k="rule:${esc(S.idx.cond[c].id)}" aria-label="Règle : ${esc(c)}" title="Règle">i</span>`:""}</span>`).join("")}</div>
        <div class="row"><span class="label">Épuisement</span><span class="hpstep"><button class="btn small stepq" data-act="exh" data-v="-1" aria-label="Retirer un niveau">−</button><b class="num">${+ch.exhaustion||0}</b><button class="btn small stepq" data-act="exh" data-v="1" aria-label="Ajouter un niveau">+</button></span>${+ch.exhaustion?`<span class="muted" style="font-size:var(--fs-sm)">−${2*ch.exhaustion} aux tests d20, vitesse −${String(1.5*ch.exhaustion).replace(".",",")} m</span>`:""}</div>`],inv:["Inventaire",`${(ch.counters||[]).map(c=>`<div class="res"><b class="tipl" data-act="tip" data-k="cnt:${esc(c.id)}">${esc(c.name)}</b><div class="row">${(+c.max||0)<=20?pips("cnt:"+c.id,+c.max||0,(+c.max||0)-(+c.cur||0),true):""}<span class="muted num" style="font-size:var(--fs-sm)">${+c.cur||0}/${+c.max||0}</span>${c.recharge?`<span class="muted" style="font-size:var(--fs-sm)">· ${esc(rechargeLabel(c.recharge))}</span>`:""}</div></div>`).join("")}
        <div class="tbag">${(ch.bag||[]).map(b=>`<div class="tbagrow${(+b.qty||0)>0?"":" empty"}"><span>${itemName(b)}${b.note?` <span class="muted" style="font-size:var(--fs-sm)">· ${esc(b.note)}</span>`:""}${(b.ref||matchItem(b.name))?"":` <button class="btn small ghost infob mk" data-act="mkItem" data-id="${b.id}" title="Créer la fiche de cet objet dans Mes contenus">+ fiche</button>`}${chargePips(ch,b)}<button class="btn small ghost chgb" data-act="chgedit" data-id="${b.id}" title="${itemCharges(ch,b)?"Modifier le compteur":"Ajouter un compteur (charges, utilisations)"}">${itemCharges(ch,b)?"⚙":"+ compteur"}</button></span><span class="hpstep"><button class="btn small stepq" data-act="bagq" data-id="${b.id}" data-v="-1" aria-label="Utiliser un">−</button><b class="num">${+b.qty||0}</b><button class="btn small stepq" data-act="bagq" data-id="${b.id}" data-v="1" aria-label="Ajouter un">+</button>${S.bagDel===b.id?`<button class="btn small danger" data-act="bagrm" data-id="${b.id}">Supprimer</button>`:`<button class="btn small ghost btndel" data-act="bagdel" data-id="${b.id}" aria-label="Supprimer ${esc(b.name)}" title="Supprimer de l'inventaire">${ICON_TRASH}</button>`}</span></div>`).join("")||`<div class="muted" style="font-size:var(--fs-sm)">Le sac est vide.</div>`}</div>
        <form class="row" data-form="bag" style="margin-top:8px;gap:6px"><input id="bag-new" type="text" list="bag-dl" placeholder="Ajouter un objet" aria-label="Nouvel objet" style="flex:1;min-width:140px"><input id="bag-newq" type="number" min="1" value="1" aria-label="Quantité" style="width:60px"><button class="btn small" type="submit">Ajouter</button></form>
        <datalist id="bag-dl">${[...hbs("objet"),...S.C.items,...S.C.weapons,...S.C.armors].map(w=>`<option value="${esc(w.name)}">`).join("")}</datalist>
        <div class="row" style="gap:12px;margin-top:6px">${["pp","po","pe","pa","pc"].filter(k=>+ch.gold?.[k]).map(k=>`<span class="num"><b>${ch.gold[k]}</b> ${k}</span>`).join("")}</div>
        <div class="cntnew lusec"><div class="label">Nouveau compteur</div><div class="muted" style="font-size:var(--fs-sm)">Pour ce qui n'est pas un objet du sac (eau, trophées…). Un objet du sac se compte déjà avec sa quantité. Pose ensuite le compteur dans un bloc avec le crayon.</div>${cntForm("t")}</div>`]}[k];
  if(!B) return "";
  return `<div class="tpopback${anim?"":" still"}" data-act="tpopclose"><div class="tpop" role="dialog" aria-modal="true" aria-label="${B[0]}" data-act="noop"><div class="tpophead"><b>${B[0]}</b><button class="btn small ghost" data-act="tpopclose" aria-label="Fermer">×</button></div><div class="tpopbody">${B[1]}</div></div></div>`;
}
function viewTable(ch,D,banner=""){
  if(S.T) S.T._tq=false; // une seule barre de recherche par écran
  ensureBag(ch);
  const T=S.T||(S.T={q:"",sel:null,eco:null,mode:"n",d1:"",d2:"",dmg:"",recent:[]});
  const items=tableItems(ch,D); S.Titems=items; S.Tderived=D;
  const hp=ch.hp||{cur:D.hpMax,temp:0}, turn=ch.turn||{};
  const lk=!S.unlockSlots;
  const lockB=`<button class="btn small ghost lock" data-act="lockSlots" aria-pressed="${!lk}" title="${lk?"Modifier les emplacements à la main":"Verrouiller les emplacements"}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/>${lk?'<path d="M8 11V7a4 4 0 0 1 8 0v4"/>':'<path d="M8 11V7a4 4 0 0 1 7.5-2"/>'}</svg></button>`;
  const slots = D.cast?(D.cast.type==="pact"?`<span class="tstat"><span class="label">Pacte niv. ${D.cast.pactLevel}</span>${pips("pact",D.cast.pactSlots,+ch.pactUsed||0,true,lk)}${lockB}</span>`:(D.cast.slots||[]).map((n,i)=>`<span class="tstat"><span class="label">Niv. ${i+1}</span>${pips("slot:"+(i+1),n,+(ch.slotsUsed?.[i+1]||0),true,lk)}</span>`).join("")+lockB):"";
  const otherSlots=slots; // emplacements de pacte compris : bloc « Emplacements et états »
  const overviewSpecies=srd("species",ch.species)||hb(ch.species);
  const overviewSize=String(ch.size||overviewSpecies?.size||"—");
  const pair=""; // Repères + Ressources : deux blocs posés côte à côte (placement libre), plus de grille commune
  S.TLpair={doc:S.cur,on:repResPairOn(ch,D,overviewSize)};
  const statsBlk=pair||`${tbHead("reperes","Repères","blk:reperes")}<div class="rtiles rauto" role="group" aria-label="Repères">${reperesTiles(ch,D,overviewSize,blkWidth(ch,"reperes"))}</div>`;
  // Emplacements dans la carte PV : rangée présente seulement si le perso en a (classe, sous-classe, niveau) ; une pastille par niveau de sort, ou une pastille « Pacte »
  const slotCells=!D.cast?"":D.cast.type==="pact"?(+D.cast.pactSlots>0?`<span class="hs pact"><span class="hsn">Pacte ${D.cast.pactLevel}</span>${pips("pact",D.cast.pactSlots,+ch.pactUsed||0,true,lk)}</span>`:"")
    :(D.cast.slots||[]).map((n,i)=>n>0?`<span class="hs"><span class="hsn" title="Niveau ${i+1}">${i+1}</span>${pips("slot:"+(i+1),n,+(ch.slotsUsed?.[i+1]||0),true,lk)}</span>`:"").join("");
  const slotsRow=slotCells?`<div class="hslots${lk?"":" open"}"><div class="hshead"><span class="label">Emplacements de sorts</span>${lockB}</div><div class="hscells">${slotCells}</div></div>`:"";
  // États actifs sous la barre de PV (décision d'Angle) : tous visibles, la rangée entière ouvre la fenêtre des états
  const condList=[...(ch.conditions||[]),...(+ch.exhaustion?["Épuisement "+ch.exhaustion]:[])];
  const condRow=condList.length?`<button class="hpconds" data-act="tpop" data-v="cond" aria-label="États actifs : ${esc(condList.join(", "))}. Toucher pour les modifier" title="États actifs : toucher pour les modifier">${condList.map(c=>`<span class="hpcond">${esc(c)}</span>`).join("")}</button>`:"";
  const healthBlk=`<div class="table-overview tb-solo">
    <section class="health-card" aria-label="Santé du personnage">
    <div class="health-main">${hpStepper(ch,D).replace('</span><span class="table-hp-actions">',condRow+'</span><span class="table-hp-actions">')}</div>
    <div class="health-details">
      <button class="health-detail health-adjust" data-act="tpop" data-v="hptemp" title="PV temporaires : toucher pour les modifier"><span class="label">PV temp.</span><b class="num">${+(ch.hp?.temp||0)}</b></button>
      <button class="health-detail health-adjust" data-act="tpop" data-v="hpmax" title="Modifier les PV maximum"><span class="label">PV max ±</span><b class="num">${D.hpBonus?sg(D.hpBonus):0}</b></button>
      <div class="health-detail health-dice" title="Dés de vie restants : à dépenser pendant un repos court (bouton Repos)"><span class="label">Dés de vie</span><span><b class="num">${Math.max(0,D.L-(+ch.hdUsed||0))} / ${D.L}</b> <small>d${D.hd}</small></span></div>
    </div>${slotsRow}
  <div class="health-footer"><span class="tconc${ch.conc?" on":""}"><button class="tconcb" data-act="${ch.conc?"ccopen":"tsel"}" data-k="conc" title="${ch.conc?"Faire un jet de sauvegarde de concentration":"Aucun sort de concentration en cours"}"><span class="label">Concentration</span><b>${ch.conc?esc(ch.conc):"—"}</b></button>${ch.conc?`<button class="btn small ghost" data-act="tconcEnd" aria-label="Fin de concentration" title="Mettre fin à la concentration">×</button>`:""}</span></div></section></div>`;
  const turnPips=[["action","Action"],["bonus","Bonus"],["reaction","Réaction"],["move","Mouvement"]].map(([k,l])=>`<button class="tpip" aria-pressed="${!!turn[k]}" data-act="tturn" data-v="${k}">${l}</button>`).join("");
  const saves=AB.map(a=>`<button class="tabhead ${sgc(D.saves[a].val)}" data-act="tsel" data-k="save:${a}"><span>${D.saves[a].prof?`<span class="pdot p1" title="Maîtrise"></span>`:""}${ABN[a]}</span><b class="num">${sg(D.saves[a].val)}</b></button>`).join("");
  const TT=[["action","Action"],["bonus","Action bonus"],["reaction","Réaction"],["move","Mouvement"],["autre","Autre"]];
  // Ce tour : des tuiles (hauteur fixe, libellé sur deux lignes au plus, nombre d'options dessous) ; « Autre » occupe le reste de sa rangée
  const tn=blkCols(ch,"tour"), tspan=Math.max(1,tn-((TT.length-1)%tn));
  const turnBtns=TT.map(([k,l])=>{ const used=!!turn[k], n=items.filter(i=>i.cost===k&&i.kind!=="basic"&&i.kind!=="rule").length;
    const label=used?"✓ "+TURN_DONE[k]:({action:"Actions",bonus:"Actions bonus",reaction:"Réactions"}[k]||l), cnt=!used&&n&&TURN_COSTS.includes(k)?`<small class="tturnn">${n} option${n>1?"s":""}</small>`:"";
    return `<button class="tturnbtn" aria-pressed="${used}" data-act="${k==="move"?"tturn":"tpop"}" data-v="${k==="move"?"move":"eco:"+k}"${k==="autre"&&tspan>1?` style="grid-column:span ${tspan}"`:""} title="${k==="move"?(used?"Annuler":"Marquer le mouvement terminé"):"Options disponibles"}"><span class="tturnl">${label}</span>${cnt}${used&&k==="move"?`<span class="tused">Annuler</span>`:""}</button>`; }).join("");
  const ecoBtns=Object.entries(ECO).map(([k,l])=>`<button class="teco" aria-pressed="${T.eco===k}" data-act="teco" data-v="${k}">${l}<span class="muted num">${items.filter(i=>i.cost===k&&i.kind!=="basic"&&i.kind!=="rule").length}</span></button>`).join("");
  const recent=T.recent.map(k=>items.find(i=>i.key===k)).filter(Boolean).map(i=>`<button class="chip" data-act="tsel" data-k="${esc(i.key)}">${esc(i.name)}</button>`).join("");
  const blocks={
    perso:banner,
    reperes:statsBlk,
    ressources:pair?"":resBlock(ch,D),
    pv:`${(+hp.cur||0)<=0?`<div class="tdeath"><div class="row" style="justify-content:space-between"><b>À 0 PV : jets contre la mort</b><span class="muted" style="font-size:var(--fs-sm)">10 ou plus : réussite · 1 : deux échecs · 20 : tu reviens à 1 PV</span></div>
        <div class="row" style="gap:16px"><span class="row" style="gap:6px"><span class="label">Réussites</span>${pips("death.s",3,ch.death?.s||0)}</span><span class="row" style="gap:6px"><span class="label">Échecs</span>${pips("death.f",3,ch.death?.f||0)}</span></div>
        ${(ch.death?.s||0)>=3?`<div><b>Stabilisé.</b> Tu restes inconscient à 0 PV, mais tu ne fais plus de jets.</div>`:(ch.death?.f||0)>=3?`<div style="color:var(--blood)"><b>Trois échecs : ton personnage meurt.</b></div>`:`<form class="row" data-form="death"><label class="field"><span>Ton d20</span><input id="t-death" type="number" inputmode="numeric" min="1" max="20" style="width:84px;font-size:var(--fs-lg)"></label><button class="btn primary" type="submit">Appliquer</button><button class="btn" type="button" data-virtual data-act="death">Lancer virtuellement</button></form>`}</div>`:""}${healthBlk}`,
    recherche:blkHidden(ch,"recherche")?"":`<div class="tgrid tb-solo"><div class="tmain">${tbHead("recherche","Recherche","blk:recherche")}${searchBar()}</div></div>`,
    tour:`<div class="tgrid tb-solo"><div class="tside table-turn">
      <div class="tturnb"${colsStyle(ch,"tour")}>${turnBtns}</div>
      <div class="tturnfoot"><span class="muted">Les options restent accessibles après consommation. Mouvement et Autre se terminent manuellement.</span><button class="btn small" data-act="tnewturn" title="Tout remettre à zéro pour le tour suivant">↻ Nouveau tour</button></div></div></div>`,
    raccourcis:`<div class="tgrid tb-solo"><div class="tside table-reference">
      ${tbHead("raccourcis","Raccourcis")}
      <div class="tpanels"${colsStyle(ch,"raccourcis")}>${raccourcisTiles(ch,D)}
      </div></div></div>`,
    notes:`<div class="tgrid tb-solo"><div class="tbottom">${tbHead("notes","Notes et historique","blk:notes")}<div class="tpanels"${colsStyle(ch,"notes")}>${racTileMap(ch,D).notes()}${racTileMap(ch,D).hist()}</div></div></div>`
  };
  for(const b of customBlocks(ch)) blocks[b.id]=customBlockHtml(ch,D,b,{slots:otherSlots,size:overviewSize});
  S.Tblocks=blocks; // aperçu dans la fenêtre du crayon
  return `${tPop(ch,D)}${tableBlocks(ch,blocks)}`;
}
/* Repères sur mesure (lot T3a, décision d'Angle du 11 nov. 2026) : bloc immuable, calculé selon la classe, la sous-classe et l'espèce ;
   4 valeurs communes puis 4 valeurs propres au plus, par ordre de priorité. Un ancien choix (ch.layout.tiles.reperes) est ignoré, pas effacé. */
const REP_BASE=["ca","init","vitesse","pp"];
function repWants(ch,D){ const cls=D.cls, id=cls&&!cls.hb?cls.id:"", L=D.L, has=n=>!!cls&&cls.features.some(f=>f.level<=L&&f.name===n), x=[];
  if(id==="barbare") x.push("rage");
  if(id==="barde") x.push("bard");
  if(id==="moine"){ x.push("ma"); if(has("Credo du Moine")) x.push("credo"); }
  if(id==="roublard"){ x.push("sneak"); if(has("Frappe malicieuse")) x.push("malice"); }
  if(id==="guerrier"&&ch.subclass==="srd:champion"&&L>=3) x.push("crit");
  if(D.cast) x.push("dd","atks");
  if(D.atkNpact>1) x.push("attaques");
  if(id==="paladin"&&has("Aura de protection")) x.push("aura");
  if(ch.species==="srd:drakeide") x.push("souffle");
  return x; }
const reperesAuto=(ch,D)=>REP_BASE.concat(repWants(ch,D).slice(0,4));
/* Tuiles du bloc Raccourcis (6 cases) : choix enregistré par perso dans ch.layout.tiles ; une case libre affiche un « + ». */
const RACC_DEFAUT=["skills","saves","cond","inv","equip","insp"];
const TILE_CAT={
  reperes:{ca:"CA",init:"Initiative",vitesse:"Vitesse",dd:"DD des sorts",atks:"Attaque de sort",pp:"Perception passive",ip:"Intuition passive",ivp:"Investigation passive",maitrise:"Maîtrise",attaques:"Attaques par action",taille:"Taille",dv:"Dés de vie",
    rage:"Dégâts de rage",bard:"Dé bardique",ma:"Arts martiaux",credo:"DD du Credo",sneak:"Attaque sournoise",malice:"DD Frappe malicieuse",crit:"Critique",aura:"Aura de protection",souffle:"DD du souffle",or:"Or",
    vision:"Vision",bottes:"Bottes d’arme",agrip:"Agripper / bousculer",saut:"Saut",port:"Charge",harmo:"Harmonisation"},
  raccourcis:{skills:"Tests de caractéristique",saves:"Jets de sauvegarde",cond:"États",inv:"Inventaire",equip:"Équipement",rest:"Repos",hist:"Historique des jets",notes:"Notes de partie",
    sorts:"Sorts",atkl:"Attaques",actions:"Actions"}
};
/* Fiche des tuiles (lot T1, voir claude/catalogue-tuiles-2024.md) : gabarit, largeur minimale, action, blocs permis.
   Largeurs minimales en px réels sur iPhone : É étroite 70, M moyenne 104, L large 156, P pleine 330 (cases avec 8 px de marge dans le bloc).
   Une tuile n'est proposée que dans une case assez large ; les autres sont montrées grisées et barrées. */
const TILE_W={E:70,M:104,L:156,P:330}; // largeurs mini (px), revues pour les cases du placement libre (12 px entre tuiles)
const TILE_META=Object.assign(
  Object.fromEntries(Object.keys(TILE_CAT.reperes).map(id=>[id,{kind:"V",min:"E",act:id==="init"}])),
  Object.fromEntries(Object.keys(TILE_CAT.raccourcis).map(id=>[id,{kind:"Pop",min:"M",act:true}])),
  {slots:{kind:"K",min:"L",act:false,only:"custom"},
   insp:{kind:"B",min:"E",act:true}, conc:{kind:"V",min:"M",act:true}, 
   search:{kind:"Pop",min:"E",act:true,h1:true}, comp:{kind:"Pop",min:"E",act:true}}); // h1 : une seule ligne de haut (Recherche : 1, 2 ou 4 colonnes)
const tileMinW=id=>TILE_W[(TILE_META[id]||{}).min||"E"];
const tileFits=(id,w)=>w>=tileMinW(id);
const BLK_CELL_W={reperes:80,raccourcis:170};
// Largeur réelle d'un groupe de cases sur iPhone (358 px utiles, grille invisible de 4 colonnes) pour un bloc de W colonnes de page
// Placement libre : 4 colonnes de tuiles, 12 px entre deux tuiles, 4 px de marge dans le cadre (358 px utiles - 8 de marges)
const cellW=(C,span,W=4)=>{ const col=(358-12)/4, inner=col*W+4*(W-1)-16; return Math.floor((inner-12*(C-1))/C*span+12*(span-1)); }; // page de 358 px, colonnes à 4 px, 8 px de marge dans le bloc
const tileOkInBlk=(id,blk)=>!(TILE_META[id]||{}).only&&tileFits(id,BLK_CELL_W[blk]);
const tileWhy=(id,blk)=>(TILE_META[id]||{}).only?"Seulement dans un bloc créé":"Trop large pour ces cases";
const chSize=ch=>String(ch.size||(srd("species",ch.species)||hb(ch.species))?.size||"—");
function blockTiles(ch,blk){
  if(blk==="reperes") return reperesAuto(ch,derive(ch));
  const def=RACC_DEFAUT, cat=customCat(ch), saved=ch.layout?.tiles?.[blk];
  const arr=Array.isArray(saved)?saved.slice(0,def.length).map(x=>typeof x==="string"&&cat[x]&&tileOkInBlk(x,blk)?x:""):def.slice();
  while(arr.length<def.length) arr.push("");
  // Inspiration héroïque quitte la carte PV : ajoutée une fois dans une case libre des Raccourcis tant que le joueur n'a pas retouché ses tuiles
  // (et une fois de plus si elle était dans les anciens Repères, devenus immuables)
  if(blk==="raccourcis"&&Array.isArray(saved)&&(!ch.layout?.inspSeen||inspInRep(ch))&&!inspPlaced(ch)&&!arr.includes("insp")){ const k=arr.indexOf(""); if(k>=0) arr[k]="insp"; }
  // Sans sorts, DD et attaque de sort n'ont pas de valeur : leur case est libre.
  if(!derive(ch).cast) return arr.map(x=>x==="dd"||x==="atks"?"":x);
  return arr;
}
const REP_CLS=["rage","bard","ma","credo","sneak","malice","crit","aura","souffle"];
const tileAvailable=(ch,blk,id)=>{ if(isCtr(id)){ const b=id.startsWith("obj:")&&(ch.bag||[]).find(x=>x.id===id.slice(4)); return id.startsWith("cnt:")||!!(b&&ctrOffer(ch,b)); } const D=derive(ch); if((id==="dd"||id==="atks"||id==="slots"||id==="sorts")&&!D.cast) return false; if(id==="bottes"&&!bottesN(D)) return false; return !REP_CLS.includes(id)||repWants(ch,D).includes(id); };
const inspInRep=ch=>Array.isArray(ch.layout?.tiles?.reperes)&&ch.layout.tiles.reperes.includes("insp");
function inspPlaced(ch){ return customBlocks(ch).some(b=>(b.tiles||[]).some(x=>x&&x.id==="insp")); }
function seeInsp(ch){ if(ch.layout?.inspSeen&&!inspInRep(ch)) return; const r=blockTiles(ch,"raccourcis"); ch.layout=Object.assign({},ch.layout,{inspSeen:true}); ch.layout.tiles=Object.assign({},ch.layout.tiles,{raccourcis:r});
  if(inspInRep(ch)) ch.layout.tiles.reperes=ch.layout.tiles.reperes.map(x=>x==="insp"?"":x); }
function setBlockTiles(ch,blk,arr){ if(blk==="reperes") return; seeInsp(ch); ch.layout=Object.assign({},ch.layout); ch.layout.tiles=Object.assign({},ch.layout.tiles,{[blk]:arr}); touch(S.cur); }
// Case libre : invisible en jeu (aucune édition dans « À la table ») ; « + » visible seulement en mode édition (le crayon du bloc ouvre ses tuiles)
const plusTile=(blk,i,cls)=>S.layoutEdit?`<span class="${cls}" aria-hidden="true">+</span>`:`<span class="${cls} tvoid" aria-hidden="true"></span>`;
/* En-tête d'un bloc à tuiles : nom et petit crayon (toujours visible) qui ouvre la personnalisation du bloc. */
const PEN_SVG=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>`;
// En jeu, aucun bouton d'édition (décision d'Angle) : on modifie un bloc depuis Menu > Personnaliser l'interface.
// Placement libre (lot B) : le titre de chaque bloc est dans sa bande, posée par tableBlocks ; le contenu n'en porte plus.
const tbHead=()=>"";
/* Visuel réduit d'une tuile (popup Personnaliser) : l'icône des Raccourcis ou la valeur des Repères. */
function tileFace(ch,D,blk,id){
  if(id==="slots") return `<svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="3"/><circle cx="12" cy="12" r="3"/><circle cx="18" cy="12" r="3"/></svg>`;
  if(TILE_CAT.raccourcis[id]||TILE_GEN[id]){ const h=racTileMap(ch,D)[id]?.()||""; return (h.match(/<svg[\s\S]*?<\/svg>/)||[""])[0]; }
  const size=chSize(ch);
  const h=repTileMap(ch,D,size)[id]?.()||"", m=h.match(/<b class="num">([\s\S]*?)<\/b>/); return m?`<b class="num">${m[1]}</b>`:"";
}
function racTileMap(ch,D){
  return {
    skills:()=>`<button class="tpbtn" data-act="tpop" data-v="skills"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 20.5 7.3v9.4L12 21.5 3.5 16.7V7.3z"/><path d="M12 2.5 7.5 14h9zM3.5 7.3 7.5 14M20.5 7.3 16.5 14M7.5 14 12 21.5 16.5 14"/></svg>Tests de caractéristique<small class="tpsub">Caractéristiques et compétences</small></button>`,
    saves:()=>`<button class="tpbtn" data-act="tpop" data-v="saves"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.3 7.5 10 4.3-1.7 7.5-5.4 7.5-10v-6z"/><path d="M12 7v10M8 11h8"/></svg>Jets de sauvegarde<small class="tpsub">6 jets</small></button>`,
    cond:()=>`<button class="tpbtn" data-act="tpop" data-v="cond"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5a4.5 4.5 0 1 0 4.5 4.5"/><path d="M12 10.5a1.5 1.5 0 1 0 1.5 1.5"/></svg>États${(ch.conditions||[]).length||+ch.exhaustion?` <span class="tpn">${(ch.conditions||[]).length+(+ch.exhaustion?1:0)}</span>`:""}<small class="tpsub">${(ch.conditions||[]).length?(ch.conditions||[]).length+" actif"+((ch.conditions||[]).length>1?"s":""):"Aucun"}${+ch.exhaustion?" · épuisement "+ch.exhaustion:""}</small></button>`,
    inv:()=>`<button class="tpbtn" data-act="tpop" data-v="inv"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6V4.5a3 3 0 0 1 6 0V6"/><path d="M5 6h14l-1.2 13.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 11h6"/></svg>Inventaire<small class="tpsub">${(ch.bag||[]).filter(b=>(+b.qty||0)>0).length} objet${(ch.bag||[]).filter(b=>(+b.qty||0)>0).length>1?"s":""}</small></button>`,
    equip:()=>`<button class="tpbtn" data-act="tpop" data-v="equip"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2.6"/><path d="M8 9.5h8l1.5 6h-2.2L15 21h-6l-.3-5.5H6.5z"/></svg>Équipement<small class="tpsub">Mains, armure, harmonisation</small></button>`,
    rest:()=>`<button class="tpbtn" data-act="restOpen" data-v=""><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18M5 18v-5.5A2.5 2.5 0 0 1 7.5 10h9a2.5 2.5 0 0 1 2.5 2.5V18"/><path d="M7 10V7.5A1.5 1.5 0 0 1 8.5 6h2A1.5 1.5 0 0 1 12 7.5V10"/></svg>Repos<small class="tpsub">Court ou long</small></button>`,
    hist:()=>`<button class="tpbtn" data-act="tpop" data-v="hist"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Historique des jets<small class="tpsub">${(ch.rollLog||[]).length} jet${(ch.rollLog||[]).length>1?"s":""}</small></button>`,
    insp:()=>`<button class="tpbtn" data-act="insp" aria-pressed="${!!ch.inspiration}" title="Toucher pour l'utiliser ou la regagner"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 21 7.5v9L12 22l-9-5.5v-9Z"/><path d="m12 2.5-5 12h10ZM3 7.5l4 7 5 7.5 5-7.5 4-7M7 14.5h10"/></svg>Inspiration héroïque<small class="tpsub">${ch.inspiration?"Disponible ✓":"Pas d'inspiration"}</small></button>`,
    conc:()=>`<button class="tpbtn" data-act="${ch.conc?"ccopen":"tsel"}" data-k="conc"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/></svg>Concentration<small class="tpsub">${ch.conc?esc(ch.conc):"Aucun sort"}</small></button>`,
    comp:()=>{ const c=ch.companion; return `<button class="tpbtn" data-act="tpop" data-v="comp"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true">${REP_ICON.comp}</svg>${c&&c.name?esc(c.name):"Compagnon"}<small class="tpsub">${c?`${+c.hp?.cur||0}/${+c.hp?.max||0} PV · CA ${+c.ac||10}`:"Ajouter un compagnon"}</small></button>`; },
    sorts:()=>`<button class="tpbtn" data-act="tpop" data-v="list:sorts"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="m12 6 1 2 2 .5-1.5 1.5.5 2-2-1-2 1 .5-2L9 8.5l2-.5z"/></svg>Sorts<small class="tpsub">${S.Titems?S.Titems.filter(i=>i.kind==="spell").length:0} prêts</small></button>`,
    atkl:()=>`<button class="tpbtn" data-act="tpop" data-v="list:atk"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true">${REP_ICON.attaques}</svg>Attaques<small class="tpsub">${S.Titems?S.Titems.filter(i=>i.kind==="atk").length:0} au choix</small></button>`,
    actions:()=>`<button class="tpbtn" data-act="tpop" data-v="list:actions"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-3.5a1.5 1.5 0 0 1 3 0V11m0-2a1.5 1.5 0 0 1 3 0v5a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 5 14.5V12a1.5 1.5 0 0 1 3 0v1"/></svg>Actions<small class="tpsub">Ce que je peux faire</small></button>`,
    search:()=>`<button class="tpbtn" data-act="tsearch"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>Recherche<small class="tpsub">Jet, action, sort…</small></button>`,
    ...ctrMap(ch,true),
    notes:()=>`<button class="tpbtn" data-act="tpop" data-v="notes"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6M9 18h4"/></svg>Notes de partie<small class="tpsub">Pour cette séance</small></button>`,
  };
}
function raccourcisTiles(ch,D){ const R=racTileMap(ch,D), T=repTileMap(ch,D,chSize(ch)); return blockTiles(ch,"raccourcis").map((id,i)=>(id&&(R[id]?R[id]():T[id]&&T[id]()))||plusTile("raccourcis",i,"tpbtn tplus")).join(""); }
function repTileMap(ch,D,size){
  let wl; const want=id=>(wl||(wl=repWants(ch,D))).includes(id);
  const t=(v,l,title)=>`<span class="rtile"${title?` title="${esc(title)}"`:""}><b class="num">${v}</b><span class="label">${l}</span></span>`;
  const T={
    ca:()=>t(D.ac,"CA",D.acNote||""),
    init:()=>`<button class="rtile act" data-act="tsel" data-k="init" title="Jet d'initiative"><b class="num">${sg(D.init)}</b><span class="label">Initiative</span></button>`,
    vitesse:()=>`<button class="rtile" data-act="tpop" data-v="speed" title="Vitesse et autres déplacements"><b class="num">${mFmt(D.speed)} m</b><span class="label">Vitesse</span></button>`,
    dd:()=>D.cast?t(D.cast.dc,"DD des sorts","Degré de difficulté de tes sorts"):"",
    pp:()=>t(D.passive,"Perception passive","10 + ton modificateur de Perception"),
    maitrise:()=>t(sg(D.pb),"Maîtrise","Bonus de maîtrise"),
    attaques:()=>t(D.atkNpact,"Attaques par action"),
    taille:()=>t(esc(String(size).split(" (")[0]),"Taille",String(size)),
    atks:()=>D.cast?t(sg(D.cast.atk),"Attaque de sort"):"",
    ip:()=>t(10+D.skills.intuition.val,"Intuition passive","10 + ton modificateur d'Intuition"),
    ivp:()=>t(10+D.skills.investigation.val,"Investigation passive","10 + ton modificateur d'Investigation"),
    dv:()=>t(`${Math.max(0,D.L-(+ch.hdUsed||0))}/${D.L}`,"Dés de vie","Dés de vie restants (d"+D.hd+")"),
    // Valeurs propres à la classe ou à l'espèce (Repères sur mesure) : vides si le perso n'y a pas droit
    rage:()=>want("rage")?t(colVal(D.cls,"Dégâts de Rage",D.L),"Dégâts de rage","Bonus aux dégâts des attaques de Force pendant ta Rage"):"",
    bard:()=>want("bard")?t(colVal(D.cls,"Dé bardique",D.L),"Dé bardique","Dé de ton Inspiration bardique"):"",
    ma:()=>want("ma")?t(colVal(D.cls,"Arts martiaux",D.L),"Arts martiaux","Dé de dégâts de tes attaques à mains nues et armes de moine"):"",
    credo:()=>want("credo")?t(8+D.pb+D.mods.sag,"DD du Credo","8 + ton modificateur de Sagesse + ta maîtrise"):"",
    sneak:()=>want("sneak")?t(colVal(D.cls,"Attaque sournoise",D.L),"Attaque sournoise","Dégâts en plus, une fois par tour"):"",
    malice:()=>want("malice")?t(8+D.pb+D.mods.dex,"DD Frappe malicieuse","8 + ton modificateur de Dextérité + ta maîtrise"):"",
    crit:()=>want("crit")?t(D.L>=15?"18-20":"19-20","Critique","Résultats du d20 qui donnent un coup critique"):"",
    aura:()=>want("aura")?t(sg(Math.max(1,D.mods.cha)),"Aura de protection",`Bonus aux jets de sauvegarde pour toi et tes alliés à ${D.L>=18?9:3} m`):"",
    souffle:()=>want("souffle")?t(8+D.pb+D.mods.con,"DD du souffle",`Souffle : ${D.L>=17?4:D.L>=11?3:D.L>=5?2:1}d10, sauvegarde de Dextérité`):"",
    comp:()=>{ const c=ch.companion; return `<button class="rtile" data-act="tpop" data-v="comp" title="Compagnon : PV et CA"><b class="num">${c?`${+c.hp?.cur||0}/${+c.hp?.max||0}`:"—"}</b><span class="label">${c&&c.name?esc(c.name):"Compagnon"}</span></button>`; },
    or:()=>t(orTotal(ch)+" po","Or","Valeur totale de ta bourse, en pièces d'or"),
    // Lot T5 (12 nov. 2026) : tuiles calculées depuis la fiche, sans saisie
    vision:()=>{ const L=chSenses(ch,D), v=L.find(x=>x.k==="noir")||L[0]; return t(v?mFmt(v.m)+" m":"—",v?SENSES[v.k]:"Vision",v?SENSES[v.k]+" sur "+mFmt(v.m)+" m":"Pas de vision dans le noir"); },
    bottes:()=>bottesN(D)?t(bottesN(D),"Bottes d’arme","Nombre de types d'arme dont tu peux utiliser la botte"):"",
    agrip:()=>t(8+D.pb+D.mods.for,"Agripper / bousculer","DD de la sauvegarde imposée par ta lutte ou ta bousculade"),
    saut:()=>t(mFmt(+(D.abEff?.for??10)*0.3)+" m","Saut","Saut en longueur avec élan"),
    port:()=>t(chCarry(ch,D)+" kg","Charge","Poids que tu peux porter"),
    harmo:()=>t(`${(ch.attuned||[]).filter(id=>(ch.bag||[]).some(b=>b.id===id)).length}/3`,"Harmonisation","Objets magiques harmonisés (3 au plus)"),
    insp:()=>`<button class="rtile" data-act="insp" aria-pressed="${!!ch.inspiration}" title="Inspiration héroïque : toucher pour l'utiliser ou la regagner"><b class="num">${ch.inspiration?"✓":"—"}</b><span class="label">Inspiration</span></button>`,
    conc:()=>`<button class="rtile" data-act="${ch.conc?"ccopen":"tsel"}" data-k="conc" title="Concentration"><b class="num tconcv">${ch.conc?esc(ch.conc):"—"}</b><span class="label">Concentration</span></button>`,
    ...ctrMap(ch,false),
    search:()=>`<button class="rtile" data-act="tsearch" title="Recherche"><b class="num"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg></b><span class="label">Recherche</span></button>`
  };
  // Toute tuile s'ouvre (décision d'Angle, 11 nov. 2026) : une tuile de valeur devient un bouton « rinfo » qui ouvre son explication,
  // sans liseré ni dégradé (réservés aux fenêtres où l'on agit). Petite icône dorée au-dessus du chiffre (variante A).
  for(const id of Object.keys(T)){ const f=T[id]; T[id]=()=>{ let h=f(); if(!h) return h;
    if(h.startsWith('<span class="rtile"')) h=h.replace('<span class="rtile"',`<button class="rtile rinfo" data-act="tpop" data-v="info:${id}"`).replace(/<\/span>$/,"</button>");
    if(Object.prototype.hasOwnProperty.call(TILE_CAT.reperes,id)){
      const label=h.match(/<span class="label">([^<]*)<\/span>/), full=label&&label[1];
      const compact={ivp:"Invest. passive",harmo:"Harm.",agrip:"Agripper / Bousculer",malice:"DD Frappe malicieuse",aura:"Aura protection",souffle:"DD souffle",vision:full==="Perception des vibrations"?"Percept. vibrations":full==="Vision dans le noir"?"Vision nocturne":full}[id]||full;
      const value=h.match(/<b class="num">([^<]*)<\/b>/);
      if(full) h=h.replace(label[0],`<span class="label rep-label" data-short="${esc(compact)}"><span class="rep-full">${full}</span></span>`).replace('<button class="rtile',`<button aria-label="${esc(full)} : ${esc(value?value[1]:"")}" class="rtile rep-value-tile`);
      if(id==="ca") h=h.replace(/<b class="num">([\s\S]*?)<\/b>/,`<span class="rep-shield"><svg class="rico" viewBox="0 0 24 24" aria-hidden="true">${REP_ICON.ca}</svg><b class="num">$1</b></span>`);
      else if(REP_ICON[id]) h=h.replace('<b class="num',`<svg class="rico" viewBox="0 0 24 24" aria-hidden="true">${REP_ICON[id]}</svg><b class="num`);
      return h;
    }
    return REP_ICON[id]?h.replace('<b class="num',`<svg class="rico" viewBox="0 0 24 24" aria-hidden="true">${REP_ICON[id]}</svg><b class="num`):h; }; }
  return T;
}
/* Bloc Ressources (lot T3b) : une tuile par ressource du perso (classe, sous-classe, dons, objets maison), 2 par rangée.
   Jusqu'à 8 : des ronds à toucher directement ; au-delà : − / + ; réserve de dés et Rouerie magique : leur fiche (dépense guidée).
   Toucher le nom ouvre la fiche de la ressource (description et usage). Bloc absent si le perso n'a aucune ressource. */
function resBlock(ch,D){ if(!D.res.length) return ""; const w=blkWidth(ch,"ressources"), n=blkCols(ch,"ressources",w), cs=`style="grid-template-columns:repeat(${n},minmax(0,1fr))"`;
  // Cases étroites : tuiles compactes (même taille que les Repères), un toucher ouvre la petite fenêtre ; sinon tuiles complètes avec leurs boutons
  if(cellW(n,1,w)<TILE_W.L) return `<div class="rrescol" ${cs} role="group" aria-label="Ressources">${resCompact(ch,D)}</div>`;
  const tiles=D.res.map(r=>{ const used=Math.min(r.max,+(ch.resUsed?.[r.id]||0)), left=r.max-used, c=resCard(r);
    return `<div class="rres${left<=0?" vide0":""}"><button class="rresname" ${c||'disabled'} title="Voir la ressource"><span class="label">${esc(r.name)}</span><small class="muted">${esc(rechargeLabel(r.recharge))}</small></button>${resCtl(ch,r)}</div>`; }).join("");
  return `${tbHead("ressources","Ressources","blk:ressources")}<div class="rresgrid" ${cs} role="group" aria-label="Ressources">${tiles}</div>`; }
const resCompact=(ch,D)=>D.res.map(r=>{ const left=r.max-Math.min(r.max,+(ch.resUsed?.[r.id]||0));
  return `<button class="rtile rrestile${left<=0?" vide0":""}" ${resCard(r)||`data-act="tpop" data-v="res:${esc(r.id)}"`} title="${esc(r.name)} : dépenser ou récupérer"><b class="num">${left}/${r.max}${r.pool?`<small> d${r.die}</small>`:""}</b><span class="label">${esc(r.name)}</span></button>`; }).join("");
const resCard=r=>{ const it=(S.Titems||[]).find(x=>x.res&&x.res.id===r.id); return it?`data-act="tsel" data-k="${esc(it.key)}"`:""; };
/* Commande d'une ressource : ronds (≤ 8), − / + au-delà ; réserve de dés et Rouerie magique : leur fiche (dépense guidée). */
function resCtl(ch,r){ const used=Math.min(r.max,+(ch.resUsed?.[r.id]||0)), left=r.max-used, sid=esc(r.id);
  return r.pool||r.id==="cls:rouerie-magique"?`<button class="btn small rresopen" ${resCard(r)}><b class="num">${left}</b> / ${r.max}${r.pool?" d"+r.die:""}</button>`
    :r.max<=8?pips("res:"+r.id,r.max,used,true)
    :`<span class="hpstep rresstep"><button class="btn stepb" data-act="resstep" data-id="${sid}" data-v="1" aria-label="${esc(r.name)} : dépenser 1" ${left<=0?"disabled":""}>−</button><b class="num">${left}<small> / ${r.max}</small></b><button class="btn stepb" data-act="resstep" data-id="${sid}" data-v="-1" aria-label="${esc(r.name)} : récupérer 1" ${used<=0?"disabled":""}>+</button></span>`; }
/* Repères et Ressources côte à côte (décision d'Angle, 11 nov. 2026) : grille invisible de 4 colonnes sur iPhone.
   Quand Repères tient sur 3 colonnes (3 ou 6 valeurs) et qu'il y a exactement une ressource par rangée, Ressources prend la 4ᵉ colonne :
   une seule grille, donc des tuiles de même taille et alignées ; une tuile de ressource ouvre une petite fenêtre pour dépenser. */
/* Repères + Ressources par défaut : quand le perso a 3 repères par rangée et une ressource par rangée, et que rien n'est réglé,
   Repères prend 3 colonnes et Ressources la 4ᵉ, juste à côté (les rangées de tuiles tombent en face, même hauteur fixe). */
function repResPairOn(ch,D,size){ const T=repTileMap(ch,D,size), n=blockTiles(ch,"reperes").filter(id=>T[id]&&T[id]()).length;
  return !blkWidthSet(ch,"reperes")&&!blkWidthSet(ch,"ressources")&&!blkHidden(ch,"reperes")&&!blkHidden(ch,"ressources")&&n>0&&n%3===0&&D.res.length>0&&D.res.length===n/3&&!ch.layout?.pos?.ressources; }
const pairOn=()=>!!(S.TLpair&&S.TLpair.doc===S.cur&&S.TLpair.on);
function resPop(ch,D,id,wrap){ const r=D.res.find(x=>x.id===id); if(!r){ S.T.pop=null; return ""; } const c=resCard(r);
  return wrap(r.name,`<div class="texpl rrespop"><div class="muted" style="font-size:var(--fs-sm);margin-bottom:10px">Récupération : ${esc(rechargeLabel(r.recharge))}${r.origin?" · "+esc(r.origin):""}</div><div class="row" style="justify-content:center">${resCtl(ch,r)}</div>${c?`<div class="row" style="justify-content:center;margin-top:12px"><button class="btn small ghost" ${c}>Description et usage</button></div>`:""}</div>`); }
const mFmt=v=>String(Math.round(v*10)/10).replace(".",",");
const REP_ICON={
  ca:'<path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.3 7.5 10 4.3-1.7 7.5-5.4 7.5-10v-6z"/>',
  init:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  vitesse:'<path d="M7 3h4l1 9 5 3v4H5l1-6z"/><path d="M3 21h18"/>',
  pp:'<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  ip:'<path d="M4 5h16v11H9l-5 4z"/><path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01"/>',
  ivp:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M8 10.5h5"/>',
  dd:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  atks:'<path d="m4 20 11-11M15 3v3M15 12v3M12 6h3M18 9h3"/><path d="m17 4 1.5 1.5M17 14l1.5-1.5"/>',
  maitrise:'<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>',
  attaques:'<path d="m4 4 10 10M4 4h4M4 4v4M20 4 10 14M20 4h-4M20 4v4M7 17l-3 3M17 17l3 3M8 13l3 3M16 13l-3 3"/>',
  taille:'<circle cx="12" cy="5" r="2.5"/><path d="M8 9.5h8l-1 6h-1.5L13 21h-2l-.5-5.5H9z"/>',
  dv:'<path d="M12 2.5 21 7.5v9L12 21.5 3 16.5v-9z"/><path d="m12 2.5-5 12h10zM3 7.5l4 7M21 7.5l-4 7M7 14.5 12 21.5 17 14.5"/>',
  rage:'<path d="m6 3 3 8M11 2l2 9M17 3l-2 8"/><path d="M5 14c2 1 4 1.5 7 1.5s5-.5 7-1.5c-1 4-3.5 7-7 7s-6-3-7-7z"/>',
  bard:'<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  ma:'<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V10m0-4a1.5 1.5 0 0 1 3 0v4m0-3a1.5 1.5 0 0 1 3 0v4m0-1.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6v-3a1.5 1.5 0 0 1 3 0"/>',
  credo:'<circle cx="12" cy="12" r="9"/><path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9"/><circle cx="12" cy="7.5" r=".8"/><circle cx="12" cy="16.5" r=".8"/>',
  sneak:'<path d="M14.5 3 21 3v6.5L9 21.5 2.5 15z"/><path d="m6 12 6 6M3 21l2.5-2.5"/>',
  malice:'<path d="M14.5 3 21 3v6.5L11 19.5"/><circle cx="7" cy="17" r="4"/><circle cx="7" cy="17" r="1"/>',
  crit:'<path d="m12 2 2.6 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.4-.5z"/>',
  aura:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  souffle:'<path d="M12 21c-4 0-7-2.7-7-6.5 0-3 2-5 3-6.5.5 2 1.5 3 2.5 3C10 7 12 4.5 14 3c0 3.5 5 5.5 5 11.5 0 3.8-3 6.5-7 6.5z"/>',
  insp:'<path d="m12 2 2.6 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.4-.5z"/>',
  conc:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>',
  comp:'<ellipse cx="12" cy="16" rx="4.5" ry="3.8"/><circle cx="5.5" cy="10.5" r="2"/><circle cx="9.5" cy="6" r="2"/><circle cx="14.5" cy="6" r="2"/><circle cx="18.5" cy="10.5" r="2"/>',
  vision:'<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M12 9a3 3 0 0 0 0 6z" fill="currentColor"/>',
  bottes:'<path d="M14.5 3H21v6.5L10 20.5 3.5 14z"/><path d="m7 17-3 3M16.5 7.5l-6 6"/>',
  agrip:'<path d="M7 11V6.5a1.5 1.5 0 0 1 3 0V10m0-4a1.5 1.5 0 0 1 3 0v4m0-3a1.5 1.5 0 0 1 3 0v3m0-1.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5.6-3.9L4.3 13a1.5 1.5 0 0 1 2.7-1.3L7 12"/>',
  saut:'<path d="M3 19c3-9 6-12 9-12s6 3 9 12"/><path d="m18 16 3 3-1 4"/><circle cx="12" cy="4" r="1.5"/>',
  port:'<path d="M7 8h10l3 13H4z"/><path d="M9.5 8a2.5 2.5 0 0 1 5 0"/>',
  harmo:'<circle cx="12" cy="15" r="6"/><path d="m9 6 3-3 3 3-3 3z"/>',
  or:'<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>'
};
const COINS=[["pp","Platine",10],["po","Or",1],["pe","Électrum",0.5],["pa","Argent",0.1],["pc","Cuivre",0.01]];
const orTotal=ch=>Math.floor(COINS.reduce((t,[k,,v])=>t+(+ch.gold?.[k]||0)*v,0)+1e-9);
/* Compagnon (lot T4, décision d'Angle : tuile simple, PV et CA ; fiche complète plus tard) : ch.companion = {name, ac, hp:{cur,max}} */
function compPop(ch,wrap){ const c=ch.companion||{name:"",ac:10,hp:{cur:10,max:10}}, hp=c.hp||{cur:0,max:0};
  const st=(k,d,l)=>`<button class="btn small" data-act="compstep" data-k="${k}" data-v="${d}">${l}</button>`;
  return wrap("Compagnon",`<div class="texpl"><label class="field"><span>Nom</span><input id="comp-name" data-comp="name" maxlength="40" value="${esc(c.name||"")}" placeholder="Loup, destrier, familier…"></label>
    <div class="label" style="margin-top:12px">Points de vie</div><div class="row" style="gap:8px;align-items:center;flex-wrap:wrap"><b class="num" style="font-size:var(--fs-2xl)">${+hp.cur||0}</b><span class="muted num">/ ${+hp.max||0}</span></div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px"><span class="label" style="min-width:56px">Dégâts</span>${st("cur",-1,"−1")}${st("cur",-5,"−5")}${st("cur",-10,"−10")}</div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px"><span class="label" style="min-width:56px">Soins</span>${st("cur",1,"+1")}${st("cur",5,"+5")}${st("cur",999,"Au max")}</div>
    <div class="tspd" style="margin-top:12px"><span>PV maximum</span><span class="hpstep"><button class="btn stepb" data-act="compstep" data-k="max" data-v="-1" aria-label="PV maximum : retirer 1">−</button><b class="num">${+hp.max||0}</b><button class="btn stepb" data-act="compstep" data-k="max" data-v="1" aria-label="PV maximum : ajouter 1">+</button></span><span></span>
      <span>Classe d'armure</span><span class="hpstep"><button class="btn stepb" data-act="compstep" data-k="ac" data-v="-1" aria-label="CA : retirer 1">−</button><b class="num">${+c.ac||10}</b><button class="btn stepb" data-act="compstep" data-k="ac" data-v="1" aria-label="CA : ajouter 1">+</button></span><span></span></div>
    <div class="muted tinfonote">Pour un compagnon animal, un destrier, un familier ou une créature invoquée. Sa fiche complète (attaques, vitesse) viendra plus tard.</div></div>`); }
/* Fenêtre d'explication d'une tuile de valeur : sens de la valeur, puis calcul ligne par ligne avec les chiffres du perso. */
function skillRows(D,k){ const s=D.skills[k], m=D.mods[s.ab], pr=s.lv*D.pb, r=[[ABN[s.ab],m]]; if(s.lv) r.push([s.lv>1?"Expertise (maîtrise × 2)":"Maîtrise",pr]); if(s.val-m-pr) r.push(["Autres bonus",s.val-m-pr]); return r; }
/* Lot T5 : sens, bottes d'arme, charge. */
const SENSES={noir:"Vision dans le noir",aveugle:"Vision aveugle",vibr:"Perception des vibrations",lucide:"Vision lucide"};
const SENSE_RX={noir:/Vision dans le noir[^.]*?(\d+(?:,\d+)?)\s*m\b/i,aveugle:/Vision aveugle[^.]*?(\d+(?:,\d+)?)\s*m\b/i,vibr:/Perception des vibrations[^.]*?(\d+(?:,\d+)?)\s*m\b/i,lucide:/Vision lucide[^.]*?(\d+(?:,\d+)?)\s*m\b/i};
/* Sens du perso, lus dans les textes de son espèce, de sa classe et sous-classe (jusqu'à son niveau), de ses dons et objets : [{k,m,src}], la plus grande portée par sens. */
function chSenses(ch,D){ const best={}, look=(txt,src)=>{ for(const k in SENSE_RX){ const m=SENSE_RX[k].exec(txt||""); if(m){ const v=parseFloat(m[1].replace(",",".")); if(!best[k]||v>best[k].m) best[k]={k,m:v,src}; } } };
  const sp=srd("species",ch.species)||hb(ch.species); if(sp&&Array.isArray(sp.traits)) for(const t of sp.traits) look(t.name+". "+t.text,sp.name||"Espèce"); else if(sp) look(sp.text||sp.desc||"",sp.name||"Espèce");
  if(D.cls){ for(const f of D.cls.features) if(f.level<=D.L&&/Vision|vibrations/i.test(f.text||"")) look(f.text,D.cls.name+" · "+f.name);
    const sc=ch.subclass&&ch.subclass.startsWith("srd:")&&D.cls.subclasses?.find(s=>"srd:"+s.id===ch.subclass); if(sc) for(const f of sc.features) if(f.level<=D.L&&/Vision|vibrations/i.test(f.text||"")) look(f.text,sc.name+" · "+f.name); }
  for(const s of D.sources||[]) look(s.text,(s.origin?s.origin+" · ":"")+s.name);
  return ["noir","aveugle","vibr","lucide"].filter(k=>best[k]).map(k=>best[k]); }
/* Bottes d'arme : nombre de types d'arme (colonne de la classe, sinon 2 dès qu'elle a l'aptitude). */
function bottesN(D){ const cls=D.cls; if(!cls||!cls.features.some(f=>f.level<=D.L&&/^Bottes d.arme$/.test(f.name))) return 0; const v=colVal(cls,"Bottes d’arme",D.L); return +v||2; }
const BOTTES={"Coup double":"Quand tu attaques avec cette arme légère grâce à l'action Attaque, ton attaque en plus avec l'autre arme légère se fait sans l'action bonus habituelle.",
  "Écorchure":"Même si tu rates ta cible, elle subit des dégâts égaux au modificateur que tu utilises pour l'attaque (sauf si ce modificateur est négatif).",
  "Enchaînement":"Quand tu touches, tu peux faire une seconde attaque contre une autre créature à 1,50 m de la première et à ta portée (une fois par tour, sans ajouter ton modificateur aux dégâts, sauf s'il est négatif).",
  "Ouverture":"Quand tu touches, ta prochaine attaque contre cette cible avant la fin de ton prochain tour a l'avantage.",
  "Poussée":"Quand tu touches une créature de taille Grande au plus, tu peux la repousser de 3 m.",
  "Ralentissement":"Quand tu touches et infliges des dégâts, la Vitesse de la cible baisse de 3 m jusqu'au début de ton prochain tour (pas de cumul).",
  "Renversement":"Quand tu touches, la cible fait une sauvegarde de Constitution (DD 8 + ton modificateur d'attaque + ta maîtrise) ; si elle la rate, elle tombe À terre.",
  "Sape":"Quand tu touches, la cible a le désavantage à son prochain jet d'attaque avant le début de ton prochain tour."};
/* Charge (capacité de charge) : Force × 7,5 kg pour une taille Petite ou Moyenne ; ×½ Très petite, ×2 Grande, ×4 Très grande, ×8 Gigantesque. */
function carryMult(ch){ const s=norm(String(chSize(ch)||"")); return /^tres petite/.test(s)?0.5:/^gig/.test(s)?8:/^tres grande/.test(s)?4:/^grande/.test(s)?2:1; }
function chCarry(ch,D){ return mFmt(+(D.abEff?.for??10)*7.5*carryMult(ch)); }
function infoData(ch,D,id){
  const lv="Niveau "+D.L, cv=lab=>colVal(D.cls,lab,D.L), sp=srd("species",ch.species)||hb(ch.species);
  const passive=(k,title,desc)=>({title,v:10+D.skills[k].val,desc,rows:[["Base",10],...skillRows(D,k)],note:"Avec l'avantage, ajoute 5 ; avec le désavantage, retire 5."});
  const dcRows=ab=>[["Base",8],["Maîtrise",D.pb],[ABN[ab],D.mods[ab]]];
  const I={
    ca:()=>({title:"Classe d'armure",v:D.ac,desc:"Le résultat qu'un jet d'attaque doit atteindre pour te toucher.",rows:D.acParts,note:"L'appli refait le calcul dès que tu changes d'armure ou de bouclier (onglet Feuille)."}),
    pp:()=>passive("perception","Perception passive","Ce que tu remarques sans chercher : le MJ la compare au DD de ce qui est caché."),
    ip:()=>passive("intuition","Intuition passive","Ce que tu sens d'une intention ou d'un mensonge sans faire de jet."),
    ivp:()=>passive("investigation","Investigation passive","Ce que tu déduis des indices sans faire de jet."),
    dd:()=>D.cast&&({title:"DD des sorts",v:D.cast.dc,desc:"Le résultat qu'une cible doit atteindre à son jet de sauvegarde pour résister à tes sorts.",rows:[...dcRows(D.cast.ability),...(D.cast.dc-8-D.pb-D.mods[D.cast.ability]?[["Autres bonus",D.cast.dc-8-D.pb-D.mods[D.cast.ability]]]:[])]}),
    atks:()=>D.cast&&({title:"Attaque de sort",v:sg(D.cast.atk),desc:"Ce que tu ajoutes au d20 quand un sort demande un jet d'attaque.",rows:[["Maîtrise",D.pb],[ABN[D.cast.ability],D.mods[D.cast.ability]],...(D.cast.atk-D.pb-D.mods[D.cast.ability]?[["Autres bonus",D.cast.atk-D.pb-D.mods[D.cast.ability]]]:[])]}),
    maitrise:()=>({title:"Bonus de maîtrise",v:sg(D.pb),desc:"S'ajoute à tout ce que tu maîtrises : attaques avec tes armes, compétences, jets de sauvegarde, sorts. Il monte avec ton niveau.",rows:[[lv,D.pb]],noTotal:true}),
    attaques:()=>{ const fl=D.cls?D.cls.features.filter(f=>f.level<=D.L&&/attaques? supplémentaires?/i.test(f.name)).map(f=>[f.name,1]):[]; const r=[["Action Attaque",1],...fl]; if(D.atkNpact>D.atkN) r.push(["Lame assoiffée",D.atkNpact-D.atkN]);
      return {title:"Attaques par action",v:D.atkNpact,desc:"Nombre d'attaques quand tu choisis l'action Attaque à ton tour.",rows:r}; },
    taille:()=>({title:"Taille",v:esc(String(chSize(ch)).split(" (")[0]),desc:"Ta taille compte pour l'espace que tu occupes, l'agrippement, les montures et certains effets.",rows:[[sp?.name||"Espèce",esc(chSize(ch))]],noTotal:true}),
    dv:()=>({title:"Dés de vie",v:`${Math.max(0,D.L-(+ch.hdUsed||0))}/${D.L}`,desc:"Pendant un repos court, tu peux en dépenser : lance le dé et ajoute ta Constitution pour récupérer des PV. Le repos long te les rend tous.",rows:[["Dé","d"+D.hd],["Maximum ("+lv.toLowerCase()+")",D.L]],noTotal:true}),
    rage:()=>({title:"Dégâts de rage",v:cv("Dégâts de Rage"),desc:"Pendant ta Rage, tes attaques qui utilisent la Force infligent ce bonus de dégâts.",rows:[[lv,cv("Dégâts de Rage")]],noTotal:true}),
    bard:()=>({title:"Dé bardique",v:cv("Dé bardique"),desc:"Le dé que reçoit un allié quand tu lui donnes ton Inspiration bardique : il pourra l'ajouter à un d20.",rows:[[lv,cv("Dé bardique")]],noTotal:true}),
    ma:()=>({title:"Arts martiaux",v:cv("Arts martiaux"),desc:"Dé de dégâts de tes coups à mains nues et de tes armes de moine ; tu peux y utiliser la Dextérité.",rows:[[lv,cv("Arts martiaux")]],noTotal:true}),
    credo:()=>({title:"DD du Credo",v:8+D.pb+D.mods.sag,desc:"Le DD des sauvegardes imposées par tes techniques de moine (Frappe étourdissante, par exemple).",rows:dcRows("sag")}),
    sneak:()=>({title:"Attaque sournoise",v:cv("Attaque sournoise"),desc:"Une fois par tour, dégâts en plus quand tu touches avec une arme de finesse ou à distance, si tu as l'avantage ou si un allié se tient près de la cible (sans désavantage).",rows:[[lv,cv("Attaque sournoise")]],noTotal:true}),
    malice:()=>({title:"DD Frappe malicieuse",v:8+D.pb+D.mods.dex,desc:"Le DD des sauvegardes imposées par tes Frappes malicieuses, quand tu renonces à des dés d'Attaque sournoise pour un effet.",rows:dcRows("dex")}),
    crit:()=>({title:"Critique",v:D.L>=15?"18-20":"19-20",desc:"Ton attaque devient un coup critique sur ces résultats du d20.",rows:[[D.L>=15?"Critique supérieur (niveau 15)":"Critique amélioré (niveau 3)",D.L>=15?"18-20":"19-20"]],noTotal:true}),
    aura:()=>({title:"Aura de protection",v:sg(Math.max(1,D.mods.cha)),desc:`Toi et tes alliés à ${D.L>=18?9:3} m ajoutez ce bonus à vos jets de sauvegarde, tant que tu es conscient.`,rows:[["Charisme (au moins +1)",Math.max(1,D.mods.cha)]],noTotal:true}),
    or:()=>({title:"Bourse",v:orTotal(ch)+" po",desc:"La valeur totale de tes pièces, en pièces d'or (on arrondit à l'or inférieur). Tu modifies ta bourse dans l'onglet Feuille.",rows:COINS.map(([k,l,v])=>[`${l} (${k}) × ${+ch.gold?.[k]||0}`,String(Math.round((+ch.gold?.[k]||0)*v*100)/100).replace(".",",")+" po"]),noTotal:true}),
    vision:()=>{ const L=chSenses(ch,D), noir=L.find(x=>x.k==="noir");
      return {title:"Vision",v:noir?mFmt(noir.m)+" m":L.length?mFmt(L[0].m)+" m":"—",
        desc:noir?"Vision dans le noir : jusqu'à cette distance, tu vois dans la pénombre comme en pleine lumière, et dans le noir comme dans la pénombre. Dans le noir, tu ne distingues pas les couleurs, seulement des nuances de gris."
          :"Ton personnage n'a pas de vision dans le noir : sans lumière, il ne voit rien. Une torche ou un sort de lumière devient vite utile.",
        rows:L.length?L.map(x=>[SENSES[x.k]+" ("+x.src+")",mFmt(x.m)+" m"]):[["Aucun sens particulier","—"]],noTotal:true,
        note:L.some(x=>x.k!=="noir")?L.filter(x=>x.k!=="noir").map(x=>({aveugle:"Vision aveugle : tu perçois ce qui t'entoure à cette distance sans avoir besoin de tes yeux, même dans le noir ou face à l'invisible.",vibr:"Perception des vibrations : tu sens la position de ce qui bouge à cette distance, si tu touches le même sol (ou le même liquide).",lucide:"Vision lucide : à cette distance, tu vois dans tout type de noir, tu vois l'invisible et tu perces les illusions et les métamorphoses."}[x.k])).join(" "):"La vision dans le noir vient de ton espèce ou d'une aptitude. Les sorts qui en donnent pour un temps ne sont pas comptés ici."}; },
    bottes:()=>{ const n=bottesN(D); if(!n) return null; const atk=(S.Titems||[]).filter(i=>i.kind==="atk"&&i.mastery), seen=new Set();
      return {title:"Bottes d’arme",v:n,desc:`Tu peux utiliser la botte de ${n} types d'arme, choisis parmi celles que tu maîtrises. Tu peux changer un de ces choix à chaque repos long. La botte s'applique quand tu attaques avec l'arme.`,
        rows:atk.length?atk.map(i=>[i.name,i.mastery]):[["Aucune attaque avec une botte dans la fiche","—"]],noTotal:true,
        note:atk.filter(i=>!seen.has(i.mastery)&&seen.add(i.mastery)).map(i=>`<b>${esc(i.mastery)}</b> : ${BOTTES[i.mastery]||""}`).join("<br>")||"Ajoute tes armes dans l'onglet Feuille pour voir leurs bottes."}; },
    agrip:()=>({title:"Agripper et bousculer",v:8+D.pb+D.mods.for,desc:"À la place d'une attaque à mains nues, tu peux tenter d'agripper une créature (une main libre, taille au plus un cran au-dessus de la tienne) ou de la bousculer (la repousser de 1,50 m ou la faire tomber À terre). Elle fait une sauvegarde de Force ou de Dextérité, à son choix, contre ce DD.",rows:dcRows("for"),note:"Une créature agrippée a une Vitesse de 0 ; elle peut tenter de se libérer à son tour contre le même DD."}),
    saut:()=>{ const f=+(D.abEff?.for??10), h=Math.max(0,0.9+0.3*D.mods.for);
      return {title:"Saut",v:mFmt(f*0.3)+" m",desc:"Avec au moins 3 m d'élan. Sans élan, la distance est divisée par deux. Le saut se décompte de ton déplacement.",rows:[["En longueur (Force × 30 cm)",mFmt(f*0.3)+" m"],["En hauteur (90 cm + mod. de Force × 30 cm)",mFmt(h)+" m"]],noTotal:true,note:"En hauteur, tu peux tendre les bras pour attraper un rebord un peu plus haut."}; },
    port:()=>{ const f=+(D.abEff?.for??10), m=carryMult(ch);
      return {title:"Charge",v:chCarry(ch,D)+" kg",desc:"Le poids que tu peux porter sans être gêné. Tu peux pousser, tirer ou soulever le double ; si tu dépasses ta charge en le faisant, ta Vitesse tombe à 1,50 m.",rows:[["Force × 7,5 kg"+(m!==1?" × "+mFmt(m)+" (taille)":""),chCarry(ch,D)+" kg"],["Pousser, tirer, soulever",mFmt(f*15*m)+" kg"]],noTotal:true,note:"L'appli ne connaît pas le poids de tout ton équipement : vérifie avec le MJ si tu portes beaucoup."}; },
    harmo:()=>{ const att=(ch.attuned||[]).map(id=>(ch.bag||[]).find(b=>b.id===id)).filter(Boolean);
      return {title:"Harmonisation",v:`${att.length}/3`,desc:"Certains objets magiques ne fonctionnent que si tu crées un lien avec eux pendant un repos court. Tu ne peux être lié qu'à 3 objets à la fois.",rows:att.length?att.map(b=>[b.name,"lié"]):[["Aucun objet harmonisé","—"]],noTotal:true,note:"Tu gères l'harmonisation depuis la fenêtre Équipement."}; },
    souffle:()=>({title:"DD du souffle",v:8+D.pb+D.mods.con,desc:"Ton Souffle remplace une de tes attaques : chaque créature dans la zone fait une sauvegarde de Dextérité contre ce DD.",rows:dcRows("con"),note:`Dégâts : ${D.L>=17?4:D.L>=11?3:D.L>=5?2:1}d10, la moitié en cas de réussite.`})
  };
  return I[id]?I[id]():null;
}
function infoPop(ch,D,id,wrap){ const d=infoData(ch,D,id); if(!d){ S.T.pop=null; return ""; }
  const num=x=>typeof x==="number"?(x<0?"−"+(-x):String(x)):x, tot=d.rows.filter(r=>typeof r[1]==="number").reduce((t,r)=>t+r[1],0);
  return wrap(d.title,`<div class="texpl"><div class="tinfotop"><b class="num">${d.v}</b><span class="muted">${d.desc}</span></div>
    <div class="label">${d.noTotal?"Détail":"Calcul"}</div><div class="tinfocalc">${d.rows.map((r,i)=>`<span>${esc(String(r[0]))}</span><span class="num">${i&&typeof r[1]==="number"?sg(r[1]):num(r[1])}</span>`).join("")}${d.noTotal?"":`<span class="tot">Total</span><span class="num tot">${num(tot)}</span>`}</div>
    ${d.note?`<div class="muted tinfonote">${d.note}</div>`:""}</div>`); }
/* Fenêtre Vitesse : calcul, autres déplacements (modifiables) et rappels de règles. */
const SPD_MODES=[["escalade","Escalade"],["nage","Nage"],["vol","Vol"],["fouissement","Fouissement"]];
function speedPop(ch,D,wrap){ const v=ch.speeds||{}, fo=+ch.abilities?.for||10, tot=D.speedParts.reduce((t,r)=>t+r[1],0);
  return wrap("Vitesse",`<div class="texpl"><div class="tinfotop"><b class="num">${mFmt(D.speed)} m</b><span class="muted">La distance que tu peux parcourir à ton tour, en une ou plusieurs fois.</span></div>
    <div class="label">Calcul</div><div class="tinfocalc">${D.speedParts.map(r=>`<span>${esc(r[0])}</span><span class="num">${r[1]<0?"−"+mFmt(-r[1]):mFmt(r[1])} m</span>`).join("")}<span class="tot">Total</span><span class="num tot">${mFmt(Math.max(0,tot))} m</span></div>
    <div class="label" style="margin-top:12px">Autres déplacements</div><div class="tspd">${SPD_MODES.map(([k,l])=>`<span>${l}</span><span class="hpstep"><button class="btn stepb" data-act="spdstep" data-k="${k}" data-v="-1.5" aria-label="${l} : retirer 1,5 m" ${+v[k]>0?"":"disabled"}>−</button><b class="num">${+v[k]>0?mFmt(+v[k])+" m":"—"}</b><button class="btn stepb" data-act="spdstep" data-k="${k}" data-v="1.5" aria-label="${l} : ajouter 1,5 m">+</button></span><button class="btn small ghost" data-act="spdset" data-k="${k}" data-v="${+v[k]===D.speed?0:D.speed}">${+v[k]===D.speed?"Aucune":"= vitesse"}</button>`).join("")}</div>
    <div class="muted tinfonote">Sans vitesse d'escalade ou de nage, chaque mètre grimpé ou nagé en coûte un de plus. Même règle pour ramper et pour le terrain difficile. Se relever quand on est à terre coûte la moitié de ta vitesse.</div>
    <div class="label" style="margin-top:12px">Sauts (Force ${fo})</div><div class="tinfocalc"><span>En longueur, avec 3 m d'élan</span><span class="num">${mFmt(fo*0.3)} m</span><span>En longueur, sans élan</span><span class="num">${mFmt(fo*0.15)} m</span><span>En hauteur, avec 3 m d'élan</span><span class="num">${mFmt(Math.max(0,3+D.mods.for)*0.3)} m</span><span>En hauteur, sans élan</span><span class="num">${mFmt(Math.max(0,3+D.mods.for)*0.15)} m</span></div>
    <div class="muted tinfonote">Chaque mètre sauté se paie sur ton déplacement.</div></div>`); }
/* Repères : rangées équilibrées sur une grille de 12 (4 → 1 rangée ; 5 → 3+2 ; 6 → 3+3 ; 7 → 4+3 ; 8 → 4+4), jamais de case vide. */
function reperesTiles(ch,D,size,k=4){ const T=repTileMap(ch,D,size), h=blockTiles(ch,"reperes").map(id=>T[id]&&T[id]()).filter(Boolean), n=h.length;
  // k tuiles au plus par rangée (largeur du bloc) ; rangées équilibrées, la première en a une de plus s'il le faut
  const rows=Math.max(1,Math.ceil(n/k)), base=Math.floor(n/rows), extra=n%rows, per=[]; for(let r=0;r<rows;r++) per.push(base+(r<extra?1:0));
  let i=0; return per.flatMap(c=>h.slice(i,i+=c).map(x=>x.replace(/^<(\w+)/,`<$1 style="grid-column:span ${12/c}"`))).join(""); }
/* Blocs personnalisés (étape 6) : ch.layout.custom = [{id,name,r,c,tiles:[{id,sz}]}] ; taille d'une tuile : "1" (1×1), "2" (2×2), "l" (ligne entière).
   Placement automatique dans l'ordre (les tuiles comblent les trous) ; les cases restantes affichent « + ». */
/* Tuiles générales (lot T2) : proposées dans tous les blocs selon la largeur. */
const TILE_GEN={insp:"Inspiration héroïque",conc:"Concentration",search:"Recherche",comp:"Compagnon"};
function customCat(ch=cur()){ return Object.assign({},TILE_CAT.reperes,TILE_CAT.raccourcis,TILE_GEN,{slots:"Emplacements de sorts"},ctrCat(ch)); }
function customBlocks(ch){ return Array.isArray(ch.layout?.custom)?ch.layout.custom.filter(b=>b&&typeof b.id==="string"&&/^c_[a-z0-9]{4,20}$/.test(b.id)&&b.r>=1&&b.r<=4&&b.c>=1&&b.c<=4).map(b=>Object.assign({},b,{w:blkWidth(ch,b.id,b)},Array.isArray(b.tiles)?{tiles:b.tiles.filter(t=>!(t&&isCtr(t.id))||ctrGet(ch,t.id))}:{})):[]; }
/* Compteurs (chantier 1, 12 nov. 2026, décisions d'Angle) : un objet du sac (quantité ou charges) ou un compteur maison devient une tuile.
   Tuile « obj:<id> » (objet du sac) ou « cnt:<id> » (compteur maison, ch.counters) ; un toucher ouvre sa petite fenêtre « ctr:<tuile> ».
   Lumière, rations et munitions sont reconnues au nom de l'objet. Une tuile dont l'objet ou le compteur a disparu s'efface d'elle-même.
   Un compteur ne modifie aucune autre valeur de la fiche. */
const isCtr=id=>typeof id==="string"&&/^(obj|cnt):/.test(id);
function objKind(b){ const n=norm(b&&b.name);
  if(/^torche/.test(n)) return "torche"; if(/^bougie/.test(n)) return "bougie";
  if(/^(flasques? d'huile|huile)(\s*\(|$)/.test(n)) return "huile"; if(/^lanterne/.test(n)) return "lanterne";
  if(/^rations?(\s|\(|$)/.test(n)) return "rations"; if(/^(fleche|carreau|bille|balle|aiguille)/.test(n)) return "munitions"; return ""; }
const CTR_ICON={torche:'<path d="M12 3c2.5 3 3.5 5 3.5 7a3.5 3.5 0 0 1-7 0c0-1.5.8-2.8 1.8-3.8.2 1.3.9 2.1 1.7 2.3C12 7 11.5 5 12 3z"/><path d="M10 14h4l-1 7h-2z"/>',
  rations:'<path d="M4 13h16a8 8 0 0 1-16 0z"/><path d="M8 10c0-2 1-2 1-4M12 10c0-2 1-2 1-4M16 10c0-2 1-2 1-4"/>',
  munitions:'<path d="M4 20 18 6"/><path d="M14 5h5v5"/><path d="M4 20l1-4M4 20l4-1M7 17l-2-2M9 15l-2-2"/>',
  charges:'<path d="m12 3 2.5 6H20l-4.5 3.8 1.7 6.2L12 15.5 6.8 19l1.7-6.2L4 9h5.5z"/>',
  qte:'<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V5h6v2M8 12h8"/>',
  cnt:'<path d="M5 5v14M9 5v14M13 5v14M17 5v14M3 15l18-6"/>'};
CTR_ICON.bougie=CTR_ICON.huile=CTR_ICON.lanterne=CTR_ICON.torche;
// Objets proposés dans la réserve : lumière, rations, munitions, objets à charges ou en plusieurs exemplaires
const ctrOffer=(ch,b)=>!!(objKind(b)||itemCharges(ch,b)||(+b.qty||0)>1);
function ctrCat(ch){ if(!ch) return {}; const o={};
  for(const b of ch.bag||[]) if(b&&b.id) o["obj:"+b.id]=String(b.name||"Objet");
  for(const c of ch.counters||[]) if(c&&c.id) o["cnt:"+c.id]=String(c.name||"Compteur");
  return o; }
const LIGHT_TXT={torche:"Lumière vive sur 6 m et faible sur 6 m de plus, pendant 1 heure.",bougie:"Lumière vive sur 1,5 m et faible sur 1,5 m de plus, pendant 1 heure.",
  huile:"Une flasque brûle 6 heures dans une lampe ou une lanterne."};
const lanternTxt=b=>{ const n=norm(b.name); return (/sourde/.test(n)?"Lumière vive sur un cône de 18 m et faible sur 18 m de plus.":/capote|capuchon/.test(n)?"Lumière vive sur 9 m et faible sur 9 m de plus.":"Brûle de l'huile.")+" Une flasque d'huile la fait brûler 6 heures."; };
const oilOf=ch=>(ch.bag||[]).find(x=>objKind(x)==="huile"&&(+x.qty||0)>0);
/* Données d'une tuile de compteur : nom, valeur affichée, sous-titre, icône, vide. */
function ctrGet(ch,id){ if(!ch||!isCtr(id)) return null; const k=id.slice(4);
  if(id.startsWith("cnt:")){ const c=(ch.counters||[]).find(x=>x.id===k); if(!c) return null; const cur0=+c.cur||0, max=+c.max||0;
    return {c,left:cur0,max,name:String(c.name||"Compteur"),val:`${cur0}/${max}`,sub:c.recharge?"revient au "+rechargeLabel(c.recharge):"compteur",icon:CTR_ICON.cnt,empty:cur0<=0}; }
  const b=(ch.bag||[]).find(x=>x.id===k); if(!b) return null; const kind=objKind(b), chg=itemCharges(ch,b), q=+b.qty||0;
  if(chg&&chg.max){ const left=chg.max-(+chg.used||0); return {b,kind,chg,left,max:chg.max,name:String(b.name),val:`${left}/${chg.max}`,sub:"charges",icon:CTR_ICON.charges,empty:left<=0}; }
  const sub={torche:"vive 6 m",bougie:"vive 1,5 m",huile:"6 h de lumière",lanterne:/sourde/.test(norm(b.name))?"cône 18 m":"vive 9 m",rations:"1 par jour",munitions:"1 par attaque"}[kind]||"quantité";
  return {b,kind,left:q,max:q,name:String(b.name),val:"×"+q,sub,icon:CTR_ICON[kind]||CTR_ICON.qte,empty:q<=0&&kind!=="lanterne"}; }
/* Tuile : compacte (1×1) = chiffres ; large (1×2, ligne, 2×2) = petites pastilles si elles tiennent, sinon chiffres (décision d'Angle).
   Pastilles pleines = ce qui reste ; vides = ce qui est utilisé (une quantité de l'Inventaire n'a que des pleines).
   Un toucher ouvre la fenêtre, où les pastilles sont grandes et se touchent (comme les emplacements de la carte PV une fois déverrouillés). */
const ctrCap=(px,sz)=>Math.min(12,Math.max(0,Math.floor((px-12)/18))*(sz==="2"||sz==="b"?2:1));
function ctrTile(ch,id,cap){ const x=ctrGet(ch,id); if(!x) return "";
  if(!cap) return `<button class="rtile rctr${x.empty?" vide0":""}" data-act="tpop" data-v="ctr:${esc(id)}" title="${esc(x.name)} : ${esc(x.sub)}"><svg class="rico" viewBox="0 0 24 24" aria-hidden="true">${x.icon}</svg><b class="num">${esc(x.val)}</b><span class="label">${esc(x.name)}</span></button>`;
  const dots=x.max>0&&x.max<=cap?`<span class="ctrdots" aria-hidden="true">${pips("",x.max,x.max-x.left,true,true)}</span>`:"";
  return `<button class="tpbtn rctrw${x.empty?" vide0":""}${dots?" dots":""}" data-act="tpop" data-v="ctr:${esc(id)}" aria-label="${esc(x.name)} : ${esc(x.val)}"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true">${x.icon}</svg>${esc(x.name)}${dots||`<small class="tpsub"><b class="num">${esc(x.val)}</b> · ${esc(x.sub)}</small>`}</button>`; }
const ctrMap=(ch,wide)=>Object.fromEntries(Object.keys(ctrCat(ch)).map(id=>[id,()=>ctrTile(ch,id,wide?ctrCap(BLK_CELL_W.raccourcis,"1"):0)]));
/* Fenêtre d'un compteur : − / + (ou les charges), et l'action propre à l'objet. */
function ctrPop(ch,D,id,wrap){ const x=ctrGet(ch,id); if(!x){ S.T.pop=null; return ""; }
  const step=(act,attr,v,max,lab)=>`<span class="hpstep ctrstep"><button class="btn stepb" data-act="${act}" ${attr} data-v="-1" aria-label="${esc(lab)} : retirer 1" ${v<=0?"disabled":""}>−</button><b class="num">${v}${max!=null?`<small> / ${max}</small>`:""}</b><button class="btn stepb" data-act="${act}" ${attr} data-v="1" aria-label="${esc(lab)} : ajouter 1" ${max!=null&&v>=max?"disabled":""}>+</button></span>`;
  const note=t=>`<div class="muted" style="font-size:var(--fs-sm);margin-top:10px">${t}</div>`, btn=(t,dis,extra="")=>`<div class="row" style="justify-content:center;margin-top:12px"><button class="btn primary" data-act="ctrUse" data-v="${esc(id)}"${extra} ${dis?"disabled":""}>${t}</button></div>`;
  let h="";
  if(x.c){ const c=x.c, mx=+c.max||0, v=+c.cur||0;
    h=`${mx>0&&mx<=20?`<div class="row ctrbig" style="justify-content:center;margin-bottom:10px">${pips("cnt:"+c.id,mx,mx-v,true)}</div>`:""}<div class="row" style="justify-content:center">${step("cnt",`data-id="${esc(c.id)}"`,v,mx,c.name)}</div>${note("Récupération : "+(c.recharge?rechargeLabel(c.recharge):"aucune (tu le remets à jour toi-même)")+".")}`; }
  else { const b=x.b, q=+b.qty||0, lab=b.name;
    h=x.chg?`<div class="label" style="text-align:center;margin-bottom:6px">Charges</div><div class="row ctrbig" style="justify-content:center">${chargePips(ch,b)}</div>`
      :`<div class="label" style="text-align:center;margin-bottom:6px">Quantité</div><div class="row" style="justify-content:center">${step("bagq",`data-id="${esc(b.id)}"`,q,null,lab)}</div>`;
    if(x.kind==="torche"||x.kind==="bougie") h+=note(LIGHT_TXT[x.kind])+btn(x.kind==="torche"?"Allumer une torche":"Allumer une bougie",q<=0);
    else if(x.kind==="huile") h+=note(LIGHT_TXT.huile)+btn("Remplir une lanterne",q<=0);
    else if(x.kind==="lanterne"){ const oil=oilOf(ch); h+=note(lanternTxt(b))+(oil?note("Dans ton sac : "+esc(oil.name)+" ×"+(+oil.qty||0)+".")+btn("Remettre de l'huile",false):note("Pas d'huile dans le sac.")); }
    else if(x.kind==="rations") h+=note("Une ration nourrit pendant une journée.")+btn("Un jour passe",q<=0);
    else if(x.kind==="munitions"){ const old=(ch.counters||[]).find(c=>norm(c.name||"").startsWith(norm(b.name).slice(0,5)));
      h+=old?note("Tes attaques retirent des munitions de ton compteur « "+esc(old.name)+" », pas de cet objet.")
        :note("Chaque jet d'attaque d'une arme qui les tire en retire une. Après le combat, en passant une minute à chercher, tu récupères la moitié de ce que tu as tiré.")+(+b.spent?`<div class="row" style="justify-content:center;margin-top:12px"><button class="btn primary" data-act="ammoEnd" data-obj="${esc(b.id)}">Fin du combat : récupérer ${Math.floor((+b.spent||0)/2)} sur ${+b.spent}</button></div>`:""); } }
  return wrap(x.name,`<div class="texpl ctrpop">${h}</div>`); }
/* Réserve des compteurs dans la fenêtre d'un bloc : objets du sac et compteurs maison, plus « Nouveau compteur » (fenêtre Inventaire). */
function ctrRes(ch,cat,ids,attrs,face,blk){ const cells=ids.map(x=>{ const a=attrs(x); return a?`<button class="tcell tmini" ${a} aria-label="Placer : ${esc(cat[x])}">${face(x)}</button>`:`<span class="tcell tmini toff" aria-disabled="true" title="Trop large pour cette case">${face(x)}<small class="toffwhy">Trop large</small></span>`; }).join("");
  return `<div class="label" style="margin:10px 0 6px">Objets et compteurs</div><div class="ctrres" data-tres="${esc(blk)}">${cells||`<span class="muted" style="font-size:var(--fs-sm)">Aucun objet à compter dans ton sac (lumière, rations, munitions, objets à charges ou en plusieurs exemplaires).</span>`}</div>
    <div class="row" style="margin-top:8px"><button class="btn small ghost" data-act="tpop" data-v="inv">Nouveau compteur…</button></div>`; }
/* Action propre à un objet compté : allumer, remplir, un jour passe. Renvoie le message du journal, ou "" si rien n'a changé. */
function ctrUse(ch,id){ const x=ctrGet(ch,id); if(!x||!x.b) return "";
  if(x.kind==="lanterne"){ const oil=oilOf(ch); if(!oil) return ""; oil.qty=(+oil.qty||0)-1; touch(S.cur);
    addLog({label:"Huile remise dans "+x.name.toLowerCase(),total:"6 h",bd:"Il reste "+oil.qty+" "+oil.name.toLowerCase()+".",kind:"info"}); return "ok"; }
  const L={torche:"Torche allumée",bougie:"Bougie allumée",huile:"Lanterne remplie",rations:"Un jour passe"}[x.kind]; if(!L||(+x.b.qty||0)<=0) return "";
  x.b.qty=(+x.b.qty||0)-1; touch(S.cur); addLog({label:L,total:"−1",bd:"Il reste "+x.b.qty+" × "+x.name+".",kind:"info"}); return "ok"; }
/* Largeur des blocs sur la grille invisible de 4 colonnes (lot 2) : ch.layout.width = {id: 1..4}. Personnage et PV restent en pleine largeur. */
const BLK_WIDTHS={perso:[4],pv:[4],reperes:[2,3,4],ressources:[1,2,3,4],recherche:[2,3,4],tour:[2,3,4],raccourcis:[2,3,4],notes:[2,3,4]};
const blkWidths=(id,b)=>id.startsWith("c_")?[1,2,3,4].filter(w=>w>=(b?.c||1)):(BLK_WIDTHS[id]||[4]);
function blkWidth(ch,id,b){ const w=+ch.layout?.width?.[id]; if(blkWidths(id,b).includes(w)) return w; if((id==="reperes"||id==="ressources")&&ch===cur()&&pairOn()) return id==="reperes"?3:1; return 4; }
const blkWidthSet=(ch,id)=>Number.isInteger(+ch.layout?.width?.[id])&&!!ch.layout.width[id];
/* Formats d'un bloc créé : largeur sur la page × rangées de tuiles ; une tuile = une colonne de page. Les 16 formats (1 à 4 rangées × 1 à 4 colonnes, décision d'Angle du 12 nov. 2026 : plus de plafond de 8 cases). */
const CUSTOM_PATS=[1,2,3,4].flatMap(r=>[1,2,3,4].map(w=>[r,w]));
/* Tableau des formats : une ligne par nombre de rangées (ou de tuiles par rangée), une colonne par largeur ; case vide si le format n'existe pas pour ce bloc. */
function fmtMatrix(rows,rowLab,cell){ const cols=[1,2,3,4];
  return `<div class="bfmt" role="group" aria-label="Formats"><span></span>${cols.map(w=>`<span class="bfh">${w} col.</span>`).join("")}${rows.map(r=>`<span class="bfh bfr">${rowLab(r)}</span>${cols.map(w=>cell(r,w)||`<span class="bpat bnone" aria-hidden="true"></span>`).join("")}`).join("")}</div>`; }
/* Tuiles déjà visibles ailleurs sur la page (Repères, Raccourcis, Notes, Recherche, autres blocs créés) : la réserve d'un bloc ne les propose pas (pas de doublon). */
function tilesOnPage(ch,D,except){ const on=new Set(), vis=id=>id!==except&&!blkHidden(ch,id);
  if(vis("reperes")){ const T=repTileMap(ch,D); blockTiles(ch,"reperes").forEach(id=>{ if(T[id]&&T[id]()) on.add(id); }); }
  if(vis("raccourcis")) blockTiles(ch,"raccourcis").forEach(id=>id&&on.add(id));
  if(vis("notes")) ["notes","hist"].forEach(id=>on.add(id));
  if(vis("recherche")) on.add("search");
  for(const b of customBlocks(ch)) if(b.id!==except) cGrid(b).tiles.forEach(t=>on.add(t.id));
  return on; }
/* Nombre d'éléments d'un bloc de base (miniatures des formats) */
function blkCount(ch,D,id){ if(id==="tour") return 5; if(id==="ressources") return Math.max(1,D.res.length); if(id==="notes") return 2; if(id==="raccourcis") return Math.max(1,blockTiles(ch,"raccourcis").length);
  if(id==="reperes"){ const T=repTileMap(ch,D); return Math.max(1,blockTiles(ch,"reperes").filter(x=>T[x]&&T[x]()).length); } return 1; }
const rangLab=r=>r+" rangée"+(r>1?"s":"");
/* Tuiles par rangée des blocs de base (Ressources, Ce tour, Raccourcis, Notes) : ch.layout.cols[id] ; sinon valeur par défaut selon la largeur.
   Un choix n'est proposé que si chaque case reste assez large pour ses tuiles. */
const COLS_MIN={ressources:"E",tour:"M",raccourcis:"M",notes:"M"};
const COLS_DEF={ressources:{1:1,2:1,3:1,4:2},tour:{2:1,3:2,4:2},raccourcis:{2:1,3:2,4:2},notes:{2:1,3:2,4:2}};
const colsOk=(id,w,n)=>Number.isInteger(n)&&n>=1&&n<=w&&cellW(n,1,w)>=TILE_W[COLS_MIN[id]];
function blkCols(ch,id,w=blkWidth(ch,id)){ if(!COLS_MIN[id]) return 0; const n=+ch.layout?.cols?.[id]; if(colsOk(id,w,n)) return n; const d=COLS_DEF[id][w]||1; return colsOk(id,w,d)?d:1; }
const colsStyle=(ch,id)=>{ const n=blkCols(ch,id); return n?` style="grid-template-columns:repeat(${n},minmax(0,1fr))"`:""; };
// Miniature d'un format : la page sur 4 colonnes, le bloc occupe w colonnes, avec sa grille de tuiles
const patThumb=(w,r,c,on,attrs,label,count)=>`<button class="bpat" aria-pressed="${!!on}" ${attrs} aria-label="${esc(label)}" title="${esc(label)}"><span class="bpg"><span class="bpb" style="grid-column:span ${w};grid-template-columns:repeat(${c},1fr)">${"<i></i>".repeat(Number.isInteger(count)?count:r*c)}</span>${"<span class=\"bpe\"></span>".repeat(4-w)}</span></button>`;
/* Agencements d'un bloc créé (décision d'Angle) : découpes prêtes des cases (lignes entières, grande case 2×2, demi-lignes).
   b.ag = identifiant ; agSlots donne les cases {r,c,sz} qui couvrent tout le bloc ; une tuile posée dans une case prend sa taille. */
function agList(R,C){ const L=[["s","Cases simples"]];
  if(C>=2&&R===1) L.push(["l","Une ligne entière"]);
  if(C>=2&&R>=2) L.push(["lb","Ligne entière en bas"],["lt","Ligne entière en haut"]);
  if(C>=2&&R>=2) L.push(["g","Grande case à gauche"]);
  if(C>=3&&R>=2) L.push(["gr","Grande case à droite"]);
  if(C>=2&&R>=2) L.push(["ll","Lignes entières"]);
  if(C===4) L.push(["h","Demi-lignes"]);
  // Seulement les découpes qui changent quelque chose : deux agencements identiques pour ce format ne sont proposés qu'une fois
  const seen=new Set(); return L.filter(([a])=>{ const k=agSlots(R,C,a).map(x=>x.r+","+x.c+","+tileSpan(x.sz,R,C)).join(";"); if(seen.has(k)) return false; seen.add(k); return true; }); }
function agSlots(R,C,ag){ const S0=[], used=Array.from({length:R},()=>Array(C).fill(false)), put=(r,c,sz)=>{ const [h,w]=tileSpan(sz,R,C); for(let i=r;i<r+h;i++) for(let j=c;j<c+w;j++) used[i][j]=true; S0.push({r,c,sz}); };
  if(ag==="l"||ag==="ll") for(let r=0;r<R;r++) put(r,0,"l");
  if(ag==="lb") put(R-1,0,"l"); if(ag==="lt") put(0,0,"l");
  if(ag==="g") put(0,0,"2"); if(ag==="gr") put(0,C-2,"2");
  if(ag==="h") for(let r=0;r<R;r++){ put(r,0,"12"); put(r,2,"12"); }
  for(let r=0;r<R;r++) for(let c=0;c<C;c++) if(!used[r][c]) put(r,c,"1");
  return S0.sort((a,b)=>a.r-b.r||a.c-b.c); }
const bSlots=b=>agSlots(b.r,b.c,agList(b.r,b.c).some(a=>a[0]===b.ag)?b.ag:"s");
const slotAt=(b,r,c)=>bSlots(b).find(x=>x.r===r&&x.c===c);
const slotOk=(b,id,sl)=>tileSizeOk(id,sl.sz,b.r,b.c)&&tileFits(id,sizeW(sl.sz,b.c,b.w||4));
const agThumb=(R,C,ag,on,attrs,label)=>`<button class="bpat" aria-pressed="${!!on}" ${attrs} aria-label="${esc(label)}" title="${esc(label)}"><span class="bpb bag" style="grid-template-columns:repeat(${C},1fr);grid-template-rows:repeat(${R},9px);width:${C*12+8}px">${agSlots(R,C,ag).map(x=>{ const [h,w]=tileSpan(x.sz,R,C); return `<i style="grid-row:${x.r+1}/span ${h};grid-column:${x.c+1}/span ${w};height:auto"></i>`; }).join("")}</span></button>`;
// Largeur de l'aperçu dans la fenêtre : w colonnes sur 4 (écart 8 px), comme sur la page
const prevW=w=>`width:calc((100% - 12px) * ${w} / 4 + ${4*(w-1)-16}px)`; // largeur intérieure du bloc sur la page
/* Titre des blocs de base (lot 3) : ch.layout.titles[id] ; vide = pas de titre. */
const BLK_TITLED=["reperes","ressources","recherche","tour","raccourcis","notes"];
function blkTitle(ch,id,def){ const t=ch?.layout?.titles?.[id]; return typeof t==="string"?t:def; }
/* Fenêtre du crayon d'un bloc de base : titre, format (largeurs possibles), aperçu à la taille réelle ; Raccourcis : ses tuiles ; « Remettre comme à l'origine ». */
function builtinPop(ch,D,id,wrap){ const def=(TBLK.find(b=>b[0]===id)||[])[1]||id, w=blkWidth(ch,id), ws=blkWidths(id);
  const title=BLK_TITLED.includes(id)?`<label class="field"><span>Titre (vide = pas de titre)</span><input type="text" maxlength="40" data-btitle="${id}" value="${esc(blkTitle(ch,id,def))}"></label>`:"";
  // Format : largeur × tuiles par rangée (Ressources, Ce tour, Raccourcis, Notes) ; largeur seule pour Repères (contenu automatique) et Recherche
  // Miniatures fidèles (demande d'Angle) : le vrai nombre d'éléments du bloc, répartis selon le format ; phrase du format choisi sous le tableau
  const nCur=blkCols(ch,id,w), cnt=blkCount(ch,D,id), tl=n=>n+" tuile"+(n>1?"s":""), rows=n=>Math.max(1,Math.ceil(cnt/n));
  const pats=COLS_MIN[id]?`<div class="label" style="margin:14px 0 6px">Format <span class="muted" style="text-transform:none;letter-spacing:0">· largeur et tuiles par rangée</span></div>${fmtMatrix([1,2,3,4],n=>tl(n)+" par rangée",(n,x)=>ws.includes(x)&&colsOk(id,x,n)?patThumb(x,rows(n),n,x===w&&n===nCur,`data-act="blkFmt" data-v="${id}" data-w="${x}" data-n="${n}"`,`${x} colonne${x>1?"s":""} · ${tl(n)} par rangée`,cnt):"")}
      <div class="bfmtsum">${w} colonne${w>1?"s":""} · ${tl(nCur)} par rangée · ${rangLab(rows(nCur))}</div>`
    :ws.length>1?`<div class="label" style="margin:14px 0 6px">Format <span class="muted" style="text-transform:none;letter-spacing:0">· largeur</span></div>${fmtMatrix([0],()=>"",(r,x)=>ws.includes(x)?patThumb(x,id==="reperes"?Math.max(1,Math.ceil(cnt/x)):1,id==="reperes"?x:1,x===w,`data-act="blkWidth" data-v="${id}" data-w="${x}"`,`${x} colonne${x>1?"s":""}`,id==="reperes"?cnt:1):"")}
      <div class="bfmtsum">${w} colonne${w>1?"s":""}${id==="reperes"?" · "+rangLab(Math.max(1,Math.ceil(cnt/w))):""}</div>`:"";
  const note={reperes:"Son contenu s’adapte tout seul à ton personnage (classe, sous-classe, espèce).",ressources:"Son contenu montre tout seul les ressources de ton personnage (classe, sous-classe, dons).",tour:"Ce bloc ne se personnalise pas, en dehors de son titre et de sa largeur."}[id];
  let body;
  if(id==="raccourcis"){ const T=S.T, blk=id, cat=customCat(ch), arr=blockTiles(ch,blk), free=arr.indexOf(""), onPage=tilesOnPage(ch,D,blk), unused=Object.keys(cat).filter(x=>!isCtr(x)&&!arr.includes(x)&&!onPage.has(x)&&tileAvailable(ch,blk,x)).sort((a,c)=>!tileOkInBlk(a,blk)-!tileOkInBlk(c,blk)), sel=Number.isInteger(T.tileSlot)?T.tileSlot:-1;
    const face=x=>`<span class="tface">${tileFace(ch,D,blk,x)}</span><span class="tname">${esc(cat[x])}</span>`;
    const cells=arr.map((x,i)=>x?`<button class="tcell${sel===i?" on":""}${TILE_META[x]?.act?" tact":""}" data-act="tileCell" data-blk="${blk}" data-i="${i}" data-tslot="${i}" data-tdrag="cell" aria-pressed="${sel===i}" aria-label="Case ${i+1} : ${esc(cat[x])}">${face(x)}</button>`
      :`<button class="tcell libre${sel===i?" on":""}" data-act="tileCell" data-blk="${blk}" data-i="${i}" data-tslot="${i}" aria-pressed="${sel===i}" aria-label="Case ${i+1} libre">+</button>`).join("");
    const res=unused.length?unused.map(x=>tileOkInBlk(x,blk)?`<button class="tcell tmini${TILE_META[x]?.act?" tact":""}" data-act="tileAdd" data-blk="${blk}" data-v="${x}" data-tdrag="res" aria-label="Placer : ${esc(cat[x])}">${face(x)}</button>`
      :`<span class="tcell tmini toff" aria-disabled="true" title="${tileWhy(x,blk)}">${face(x)}<small class="toffwhy">${tileWhy(x,blk)}</small></span>`).join(""):`<span class="muted" style="font-size:var(--fs-sm)">Toutes les tuiles sont placées.</span>`;
    const selBar=sel>=0&&arr[sel]?`<div class="row" style="gap:8px;margin-top:8px;align-items:center"><span class="muted" style="font-size:var(--fs-sm)">Case ${sel+1} : ${esc(cat[arr[sel]])}</span><button class="btn small ghost" data-act="tileDel" data-blk="${blk}" data-i="${sel}">Retirer cette tuile</button></div>`:"";
    body=`<div class="label" style="margin:14px 0 6px">Tuiles <span class="muted" style="text-transform:none;letter-spacing:0">· aperçu à la taille réelle</span></div>
      <div class="bprev" style="${prevW(w)}"><div class="tpgrid" data-tblk="${blk}" style="grid-template-columns:repeat(${blkCols(ch,blk,w)},minmax(0,1fr))">${cells}</div></div>${selBar}
      <div class="row" style="justify-content:space-between;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap"><span class="muted" style="font-size:var(--fs-sm)">Touche une case puis une tuile de la réserve, ou glisse-la.</span><button class="btn small ghost" data-act="tileReset" data-blk="${blk}" title="Remet les tuiles conseillées : Tests, Sauvegardes, États, Inventaire, Équipement, Inspiration">Automatique (recommandé)</button></div>
      <div class="label" style="margin:10px 0 6px">Réserve${free<0&&unused.length?" (bloc plein : retire d’abord une tuile)":""}</div><div class="tres" data-tres="${blk}">${res}</div>
      ${ctrRes(ch,cat,Object.keys(cat).filter(x=>isCtr(x)&&!arr.includes(x)&&!onPage.has(x)&&tileAvailable(ch,blk,x)),x=>`data-act="tileAdd" data-blk="${blk}" data-v="${esc(x)}" data-tdrag="res"`,face,blk)}`; }
  // Aperçu fidèle : le bloc dessiné avec les styles de la page (marge de 8 px, tuiles, largeur réelle sur 4 colonnes)
  else body=`<div class="label" style="margin:14px 0 6px">Aperçu <span class="muted" style="text-transform:none;letter-spacing:0">· taille réelle</span></div><div class="bprev bprevc" inert><div class="tblocks tfree tprev"><section class="tblk w${w}" style="width:calc((100% - 12px) * ${w} / 4 + ${4*(w-1)}px)"><div class="tband"><span class="tbandt">${esc(blkTitle(ch,id,def))}</span></div><div class="tblkc">${(S.Tblocks||{})[id]||`<div class="muted" style="font-size:var(--fs-sm)">Vide pour ce personnage pour l’instant.</div>`}</div></section></div></div>${note?`<div class="muted" style="font-size:var(--fs-sm);margin-top:8px">${note}</div>`:""}`;
  return wrap("Bloc : "+def,`${title}${pats}${body}<div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn small ghost" data-act="blkResetOne" data-v="${id}">Remettre comme à l’origine</button></div>`); }
function customCopy(ch){ return customBlocks(ch).map(b=>Object.assign({},b,{tiles:(Array.isArray(b.tiles)?b.tiles:[]).map(t=>Object.assign({},t))})); }
function saveCustom(ch,list){ ch.layout=Object.assign({},ch.layout,{custom:list}); touch(S.cur); }
/* Position exacte des tuiles : {id,sz,r,c} (ligne et colonne de la case en haut à gauche). Taille : [hauteur, largeur] en cases. */
const tileSpan=(sz,R,C)=>sz==="l"?[1,C]:sz==="b"?[Math.min(2,R),C]:sz==="12"&&C>=2?[1,2]:sz==="2"&&R>=2&&C>=2?[2,2]:[1,1];
/* Tailles : 1×1, 1×2 (une ligne, deux colonnes), 2×2, ligne entière, bandeau (deux lignes sur toute la largeur). */
const TILE_SIZES=[["1","1×1"],["12","1×2"],["2","2×2"],["l","Ligne"],["b","Bandeau"]];
const sizeOk=(sz,R,C)=>sz==="1"||(sz==="12"&&C>=3)||(sz==="2"&&R>=2&&C>=2)||(sz==="l"&&C>1)||(sz==="b"&&R>=2);
const sizeW=(sz,C,W=4)=>cellW(C,tileSpan(sz,4,C)[1],W);
const tileSizeOk=(id,sz,R,C)=>sizeOk(sz,R,C)&&!((TILE_META[id]||{}).h1&&(sz==="2"||sz==="b"));
const fitSize=(b,id)=>(["1","12","l","2","b"].find(z=>tileSizeOk(id,z,b.r,b.c)&&tileFits(id,sizeW(z,b.c,b.w||4))))||null;
/* Première place libre pour une tuile de cette taille (sans rien recouvrir), à partir de la case n si elle est donnée. */
function cFreeSpot(b,sz,n){ const R=b.r,C=b.c, {tiles}=cGrid(b), [h,w]=tileSpan(sz,R,C), free=(r,c)=>r+h<=R&&c+w<=C&&!tiles.some(x=>tilesHit(x,{sz,r,c},R,C));
  if(Number.isInteger(n)){ const r=Math.floor(n/C), c=sz==="l"||sz==="b"?0:n%C; if(free(r,c)) return {r,c}; }
  for(let r=0;r<R;r++) for(let c=0;c<C;c++) if(free(r,c)) return {r,c}; return null; }
const tilesHit=(a,b,R,C)=>{ const [ha,wa]=tileSpan(a.sz,R,C),[hb,wb]=tileSpan(b.sz,R,C); return a.r<b.r+hb&&b.r<a.r+ha&&a.c<b.c+wb&&b.c<a.c+wa; };
/* Tuiles posées d'un bloc : les positions enregistrées d'abord, puis (anciens blocs v128 ou position invalide) au premier trou, dans l'ordre ; une tuile sans place est écartée. */
function cGrid(b){ const R=b.r,C=b.c, out=[], seen=new Set();
  const fits=t=>{ const [h,w]=tileSpan(t.sz,R,C); return t.r>=0&&t.c>=0&&t.r+h<=R&&t.c+w<=C&&!out.some(o=>tilesHit(o,t,R,C)); };
  const src=(Array.isArray(b.tiles)?b.tiles:[]).filter(t=>t&&typeof t.id==="string"&&t.id!=="exh"&&!seen.has(t.id)&&seen.add(t.id)) /* exh : tuile Épuisement retirée (doublon des États) */.map(t=>({id:t.id,sz:["1","12","2","l","b"].includes(t.sz)?t.sz:"1",r:t.r,c:t.c}));
  src.forEach(t=>{ if(t.sz==="l"||t.sz==="b") t.c=0; if(Number.isInteger(t.r)&&Number.isInteger(t.c)&&fits(t)){ out.push(t); t.ok=1; } });
  src.forEach(t=>{ if(t.ok) return; for(let r=0;r<R;r++) for(let c=0;c<C;c++){ const n={id:t.id,sz:t.sz,r,c}; if(fits(n)){ out.push(n); return; } } });
  const occ=Array.from({length:R},()=>Array(C).fill(-1));
  out.forEach((t,k)=>{ const [h,w]=tileSpan(t.sz,R,C); for(let i=t.r;i<t.r+h;i++) for(let j=t.c;j<t.c+w;j++) occ[i][j]=k; });
  return {tiles:out,occ}; }
/* Poser une tuile (src {i} déjà posée ou {id} venue de la réserve) sur la case {r,c} ; renvoie la nouvelle liste, ou null s'il n'y a pas la place.
   Une tuile de la réserve remplace ce qu'elle recouvre ; une tuile déplacée sur une autre l'échange si l'autre tient à son ancienne place. */
function cMove(b,src,dst){ const R=b.r,C=b.c, list=cGrid(b).tiles.map(t=>Object.assign({},t)); let t, old=null;
  if(src.id!==undefined){ if(list.some(x=>x.id===src.id)) return null; const sl=!src.sz&&slotAt(b,dst.r,dst.c), sz=src.sz||(sl&&slotOk(b,src.id,sl)?sl.sz:fitSize(b,src.id)); if(!sz) return null; t={id:src.id,sz}; } else { t=list[src.i]; if(!t) return null; old={r:t.r,c:t.c}; list.splice(src.i,1); }
  const [h,w]=tileSpan(t.sz,R,C); t=Object.assign({},t,{r:Math.max(0,Math.min(dst.r,R-h)),c:t.sz==="l"||t.sz==="b"?0:Math.max(0,Math.min(dst.c,C-w))});
  const conf=list.filter(x=>tilesHit(x,t,R,C));
  if(conf.length){
    if(!old) conf.forEach(x=>list.splice(list.indexOf(x),1));
    else if(conf.length===1){ const x=conf[0], [hx,wx]=tileSpan(x.sz,R,C), nx=Object.assign({},x,{r:Math.min(old.r,R-hx),c:x.sz==="l"||x.sz==="b"?0:Math.min(old.c,C-wx)});
      if(tilesHit(nx,t,R,C)||list.some(y=>y!==x&&tilesHit(nx,y,R,C))) return null; Object.assign(x,nx); }
    else return null; }
  if(old) list.splice(src.i,0,t); else list.push(t); return list; }
function cResize(b,i,sz){ const R=b.r,C=b.c, list=cGrid(b).tiles.map(t=>Object.assign({},t)), t=list[i]; if(!t) return null;
  if(!tileSizeOk(t.id,sz,R,C)||!tileFits(t.id,sizeW(sz,C,b.w||4))) return null;
  const [h,w]=tileSpan(sz,R,C), n=Object.assign({},t,{sz,r:Math.min(t.r,R-h),c:sz==="l"||sz==="b"?0:Math.min(t.c,C-w)});
  if(list.some((y,k)=>k!==i&&tilesHit(n,y,R,C))) return null; list[i]=n; return list; }
function cUpdate(ch,id,fn){ seeInsp(ch); const list=customCopy(ch), b=list.find(x=>x.id===id); if(!b) return false; const tiles=fn(b); if(!tiles) return false;
  b.tiles=tiles.map(t=>({id:t.id,sz:t.sz||"1",r:t.r,c:t.c})); saveCustom(ch,list); return true; }
const cellStyle=(t,R,C)=>{ const [h,w]=tileSpan(t.sz,R,C); return `grid-row:${t.r+1}/span ${h};grid-column:${t.c+1}/span ${w}`; };
function customBlockHtml(ch,D,b,ctx){
  const Rm=racTileMap(ch,D), T=repTileMap(ch,D,ctx.size), {tiles,occ}=cGrid(b), wide=t=>sizeW(t.sz,b.c,b.w||4)>=TILE_W.L;
  const one=t=>{ const h=t.id==="slots"?`<div class="rtile rslots">${ctx.slots||`<span class="muted">Pas d’emplacements</span>`}<span class="label">Emplacements</span></div>`:t.id==="search"&&wide(t)&&!S.T._tq?searchBar():isCtr(t.id)?ctrTile(ch,t.id,wide(t)?ctrCap(sizeW(t.sz,b.c,b.w||4),t.sz):0):(wide(t)&&(TILE_GEN[t.id]||isCtr(t.id))&&Rm[t.id]?Rm[t.id]():((T[t.id]&&T[t.id]())||(Rm[t.id]&&Rm[t.id]())||""));
    return h?`<div class="ccell" data-sz="${esc(t.sz)}" style="${cellStyle(t,b.r,b.c)}">${h}</div>`:""; };
  let html=tiles.map(one).join("");
  occ.forEach((row,r)=>row.forEach((k,c)=>{ if(k<0) html+=`<div class="ccell" style="grid-row:${r+1};grid-column:${c+1}">${plusTile(b.id,r*b.c+c,"rtile vide")}</div>`; }));
  return `${tbHead(b.id,b.name)}<div class="cgrid" style="grid-template-columns:repeat(${b.c},minmax(0,1fr));grid-template-rows:repeat(${b.r},var(--th))">${html}</div>`;
}
function customPop(ch,D,id,wrap){
  const b=customBlocks(ch).find(x=>x.id===id); if(!b){ S.T.pop=null; return ""; }
  const cat=customCat(ch), {tiles,occ}=cGrid(b), R=b.r, C=b.c, selT=Number.isInteger(S.T.ctile)&&tiles[S.T.ctile]?S.T.ctile:-1, selC=Number.isInteger(S.T.tileSlot)?S.T.tileSlot:-1;
  const face=x=>`<span class="tface">${tileFace(ch,D,"",x)}</span><span class="tname">${esc(cat[x]||x)}</span>`;
  let cells=tiles.map((t,i)=>`<button class="tcell${selT===i?" on":""}${TILE_META[t.id]?.act?" tact":""}" style="${cellStyle(t,R,C)}" data-act="ctileSel" data-v="${id}" data-i="${i}" data-tslot="" data-tdrag="ctile" data-cblk="${id}" aria-pressed="${selT===i}" aria-label="${esc(cat[t.id]||t.id)}">${face(t.id)}</button>`).join("");
  // Cases libres selon l'agencement : une case n'apparaît que si aucune de ses cellules n'est prise ; sinon ses cellules libres restent simples
  const slots=bSlots(b), done=Array.from({length:R},()=>Array(C).fill(false));
  for(const sl of slots){ const [h,w]=tileSpan(sl.sz,R,C); let free=true; for(let i=sl.r;i<sl.r+h;i++) for(let j=sl.c;j<sl.c+w;j++) if(occ[i][j]>=0) free=false;
    if(!free) continue; const n=sl.r*C+sl.c; for(let i=sl.r;i<sl.r+h;i++) for(let j=sl.c;j<sl.c+w;j++) done[i][j]=true;
    cells+=`<button class="tcell libre${selC===n?" on":""}" style="${cellStyle(sl,R,C)}" data-act="ctileCell" data-v="${id}" data-cell="${n}" data-tslot="" aria-pressed="${selC===n}" aria-label="Case libre, ligne ${sl.r+1}, colonne ${sl.c+1}">+</button>`; }
  occ.forEach((row,r)=>row.forEach((k,c)=>{ const n=r*C+c; if(k<0&&!done[r][c]) cells+=`<button class="tcell libre${selC===n?" on":""}" style="grid-row:${r+1};grid-column:${c+1}" data-act="ctileCell" data-v="${id}" data-cell="${n}" data-tslot="" aria-pressed="${selC===n}" aria-label="Case libre, ligne ${r+1}, colonne ${c+1}">+</button>`; }));
  const selSlot=selC>=0?slotAt(b,Math.floor(selC/C),selC%C):null, okT=x=>selSlot?slotOk(b,x,selSlot):!!fitSize(b,x);
  const free=occ.flat().some(k=>k<0);
  const onPage=tilesOnPage(ch,D,id), unused=Object.keys(cat).filter(x=>!isCtr(x)&&!tiles.some(t=>t.id===x)&&!onPage.has(x)&&tileAvailable(ch,"",x)).sort((a,c)=>!okT(a)-!okT(c));
  const res=unused.length?unused.map(x=>okT(x)?`<button class="tcell tmini${TILE_META[x]?.act?" tact":""}" data-act="ctileAdd" data-v="${id}" data-t="${x}" data-tdrag="cres" data-cblk="${id}" aria-label="Placer : ${esc(cat[x])}">${face(x)}</button>`
      :`<span class="tcell tmini toff" aria-disabled="true" title="Trop large pour ${selSlot?"cette case":"ce bloc"}">${face(x)}<small class="toffwhy">Trop large pour ${selSlot?"cette case":"ce bloc"}</small></span>`).join(""):`<span class="muted" style="font-size:var(--fs-sm)">Toutes les tuiles sont placées.</span>`;
  const t=tiles[selT], sizes=t?TILE_SIZES.filter(([z])=>tileSizeOk(t.id,z,R,C)):[];
  const selBar=t?`<div class="row" style="gap:6px;margin-top:8px;align-items:center;flex-wrap:wrap"><span class="muted" style="font-size:var(--fs-sm)">${esc(cat[t.id]||t.id)} :</span>${sizes.map(([z,l])=>tileFits(t.id,sizeW(z,C,b.w||4))?`<button class="chip" aria-pressed="${t.sz===z}" data-act="ctileSize" data-v="${id}" data-i="${selT}" data-z="${z}">${l}</button>`:`<span class="chip toff" aria-disabled="true" title="Trop étroit pour cette tuile">${l}</span>`).join("")}<button class="btn small ghost" data-act="ctileDel" data-v="${id}" data-i="${selT}">Retirer cette tuile</button></div>`:"";
  const w=b.w||4, pats=fmtMatrix([1,2,3,4],rangLab,(r,ww)=>patThumb(ww,r,ww,r===R&&ww===C&&ww===w,`data-act="blkPat" data-v="${id}" data-r="${r}" data-c="${ww}"`,`${ww} colonne${ww>1?"s":""} · ${rangLab(r)}`));
  return wrap("Bloc : "+(b.name||"sans titre"),`<label class="field"><span>Titre (vide = pas de titre)</span><input type="text" maxlength="40" data-cname="${id}" value="${esc(b.name)}"></label>
    <div class="label" style="margin:14px 0 6px">Format</div>${pats}<div class="bfmtsum">${C} colonne${C>1?"s":""} · ${rangLab(R)} · ${R*C} case${R*C>1?"s":""}</div>
    ${agList(R,C).length>1?`<div class="label" style="margin:14px 0 6px">Agencement</div><div class="bpats">${agList(R,C).map(([a,l])=>agThumb(R,C,a,(agList(R,C).some(z=>z[0]===b.ag)?b.ag:"s")===a,`data-act="blkAg" data-v="${id}" data-ag="${a}"`,l)).join("")}</div>`:""}
    <div class="label" style="margin:14px 0 6px">Tuiles <span class="muted" style="text-transform:none;letter-spacing:0">· aperçu à la taille réelle</span></div>
    <div class="bprev" style="${prevW(w)}"><div class="tpgrid" data-cgrid="${id}" data-r="${R}" data-c="${C}" style="grid-template-columns:repeat(${C},minmax(0,1fr));grid-template-rows:repeat(${R},var(--th))">${cells}</div></div>${selBar}
    <div class="muted" style="font-size:var(--fs-sm);margin:8px 0">Touche une case libre puis une tuile de la réserve, ou glisse une tuile (au doigt : appui long). Touche une tuile posée pour changer sa taille ; glisse-la hors du bloc pour la retirer.</div>
    <div class="label" style="margin:10px 0 6px">Réserve${!free&&unused.length?" (bloc plein : retire d’abord une tuile)":""}</div><div class="tres" data-tres="${id}">${res}</div>
    ${ctrRes(ch,cat,Object.keys(cat).filter(x=>isCtr(x)&&!tiles.some(t=>t.id===x)&&!onPage.has(x)&&tileAvailable(ch,"",x)),x=>okT(x)?`data-act="ctileAdd" data-v="${id}" data-t="${esc(x)}" data-tdrag="cres" data-cblk="${id}"`:"",face,id)}
    <div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn small ghost" data-act="blkDup" data-v="${id}">Dupliquer le bloc</button></div>`);
}
/* Blocs d'« À la table » : ordre enregistré dans la fiche (ch.layout.order) ; un bloc vide n'est pas affiché. */
const TBLK=[["perso","Personnage"],["reperes","Repères"],["pv","Points de vie"],["recherche","Recherche"],["ressources","Ressources"],["tour","Combat!"],["raccourcis","Raccourcis"],["notes","Notes et historique"]];
function blkLabel(ch,id){ const d=(TBLK.find(b=>b[0]===id)||[])[1]; if(d) return blkTitle(ch,id,d)||d; const c=customBlocks(ch).find(b=>b.id===id); return c?(c.name||"Bloc sans titre"):id; }
function tableOrder(ch){ const ids=[...TBLK.map(b=>b[0]),...customBlocks(ch).map(b=>b.id)]; const saved=Array.isArray(ch.layout?.order)?ch.layout.order.filter(id=>ids.includes(id)):[];
  // Ressources (lot T3b) arrive après un ordre déjà enregistré : on le place sous la carte PV, pas en bas de page
  if(saved.length&&!saved.includes("ressources")&&saved.includes("pv")) saved.splice(saved.indexOf("pv")+1,0,"ressources");
  const o=[...new Set([...saved,...ids])];
  if(ch===cur()&&pairOn()){ o.splice(o.indexOf("ressources"),1); o.splice(o.indexOf("reperes")+1,0,"ressources"); } // Ressources juste à droite de Repères
  return o; }
/* « À la table » en placement libre (lot B, décision d'Angle) : 4 colonnes, pas de rangées. Chaque bloc a sa colonne de départ et sa largeur ;
   verticalement, il est posé par rapport à un autre (sous, en face, aligné sur une rangée de tuiles…) : ch.layout.pos[id] = {c, t, a, k, px}.
   Sans position enregistrée, les blocs se rangent dans l'ordre et montent dans leurs colonnes. Les positions sont calculées après le rendu (tableLayoutDom). */
function tableBlocks(ch,blocks){
  const ed=!!S.layoutEdit, ids=tableOrder(ch).filter(id=>!blkHidden(ch,id)&&(ed||blocks[id])), label=id=>blkLabel(ch,id);
  const charges=chargeRecoveryForms(ch);
  const cb=Object.fromEntries(customBlocks(ch).map(b=>[b.id,b]));
  const title=id=>id==="perso"||id==="pv"?"":id.startsWith("c_")?(cb[id]?.name||""):blkTitle(ch,id,(TBLK.find(b=>b[0]===id)||[])[1]||"");
  const pen=id=>id==="perso"||id==="pv"?"":`<button class="tedpen" data-act="tpop" data-v="${id==="raccourcis"||id.startsWith("c_")?"tiles:":"blk:"}${id}" aria-label="Modifier le bloc ${esc(label(id))}" title="Modifier le bloc">${PEN_SVG}</button>`;
  const sec=id=>`<section class="tblk${ed?" ted":""} w${blkWidth(ch,id,cb[id])}" data-blk="${id}" data-w="${blkWidth(ch,id,cb[id])}" aria-label="${esc(label(id))}">
    <div class="tband"><span class="tbandt">${esc(title(id))}</span></div>${ed?`<span class="tblkgrip" data-blkgrip="${id}" role="button" aria-label="Déplacer le bloc ${esc(label(id))}" title="Glisser pour déplacer">⋮⋮</span>${pen(id)}${BLK_KEEP.includes(id)?"":`<button class="tdel" data-act="blkDelNow" data-v="${id}" aria-label="Supprimer le bloc ${esc(label(id))}" title="Supprimer le bloc">✕</button>`}`:""}
    <div class="tblkc"${ed?" inert":""}>${blocks[id]||(ed?`<div class="muted" style="font-size:var(--fs-sm)">Vide pour ce personnage pour l’instant.</div>`:"")}</div></section>`;
  const box=`<div class="tblocks tfree${ed?" editing":""}">${ids.map(sec).join("")}</div>`;
  if(!ed) return `${charges?`<div class="tcharges">${charges}</div>`:""}${box}`;
  const u=S.undo&&S.undo.doc===S.cur?S.undo:null, mag=ch.layout?.mag!==false, grav=!!ch.layout?.grav;
  // Un seul bandeau (décision d'Angle) : titre et « Terminé », puis les quatre outils de même forme
  return `<div class="tlayouttop tedbar" role="status"><div class="tedl1"><span><b>Mode édition</b> <span class="muted" style="font-size:var(--fs-xs)">· glisse un bloc par ⋮⋮</span></span><button class="btn small primary" data-act="layoutDone">Terminé</button></div>
  <div class="tedl2"><button class="chip" data-act="tpop" data-v="blkadd" aria-label="Ajouter un bloc">＋ Bloc</button><button class="chip" data-act="layoutAuto" title="Disposition recommandée pour ce personnage">Automatique</button><button class="chip" data-act="layoutMag" aria-pressed="${mag}" title="Aimanter aux bords et aux rangées de tuiles des voisins">Aimant</button><button class="chip" data-act="layoutGrav" aria-pressed="${grav}" title="Réduire les marges entre blocs et faire remonter les blocs">Tasser</button></div></div>
  ${box}
  ${u?`<div class="tundo" role="status"><span>${u.auto?"Disposition automatique appliquée":`Bloc « ${esc(u.label)} » supprimé`}</span><button class="btn small ghost" data-act="blkUndo">Annuler</button></div>`:""}`;
}
/* Géométrie du placement libre : mêmes mesures que le prototype validé par Angle. */
const TL={G:12,FG:4,M:8,BAND:24,VGAP:16,GAP:4}; // G : entre tuiles ; FG : entre colonnes de page ; M : marge intérieure (bordure comprise) ; BAND : bande du titre
/* Écart vertical entre deux blocs empilés (décision d'Angle) : une marge de 16 px par défaut ; « Tasser » le réduit à 4 px (comme entre deux colonnes) et fait remonter les blocs.
   Les relations enregistrées ne changent pas : en décochant « Tasser », les marges reviennent. */
const tlGapV=ch=>ch.layout?.grav?TL.GAP:TL.VGAP;
function tableGeom(ch,list,ord){ // list : [{id,w,h}] ; renvoie {id:{c,y}}
  const gv=tlGapV(ch), pos=ch.layout?.pos||{}, by=Object.fromEntries(list.map(b=>[b.id,b])), res={}, colB=[0,0,0,0]; let curc=0;
  const ordered=ord.filter(id=>by[id]);
  for(const id of ordered){ if(pos[id]) continue; const b=by[id]; let c=curc; if(c+b.w>4) c=0; const y=Math.max(0,...colB.slice(c,c+b.w)); res[id]={c,y}; for(let i=c;i<c+b.w;i++) colB[i]=y+b.h+gv; curc=(c+b.w)%4; }
  const busy=new Set();
  const Y=id=>{ if(res[id]) return res[id].y; const b=by[id], p=pos[id]||{}, c=Math.max(0,Math.min(4-b.w,+p.c||0)); if(busy.has(id)){ res[id]={c,y:0}; return 0; } busy.add(id);
    const a=p.a&&by[p.a]&&p.a!==id?p.a:null, px=+p.px||0, k=+p.k||0; let y;
    if(!a) y=Math.max(0,px);
    else { const ay=Y(a), ah=by[a].h; y=p.t==="below"?ay+ah+gv+px:p.t==="row"?ay+k*(TH_PX()+TL.G):p.t==="bottom"?ay+ah-b.h:ay+px; }
    res[id]={c,y:Math.max(0,Math.round(y))}; busy.delete(id); return res[id].y; };
  for(const id of ordered) Y(id);
  // Pas de chevauchement : un bloc qui en recouvre un autre descend dessous (dans l'ordre de haut en bas)
  const over=(a,b)=>res[a].c<res[b].c+by[b].w&&res[b].c<res[a].c+by[a].w;
  const seq=[...ordered].sort((a,b)=>res[a].y-res[b].y||ordered.indexOf(a)-ordered.indexOf(b)), placed=[];
  for(const id of seq){ let again=true; while(again){ again=false; for(const q of placed) if(over(id,q)&&res[id].y<res[q].y+by[q].h+gv&&res[q].y<res[id].y+by[id].h+gv){ res[id].y=res[q].y+by[q].h+gv; again=true; } } placed.push(id); }
  if(ch.layout?.grav){ const pl=[]; for(const id of [...ordered].sort((a,b)=>res[a].y-res[b].y)){ let y=0; for(const q of pl) if(over(id,q)) y=Math.max(y,res[q].y+by[q].h+gv); res[id].y=y; pl.push(id); } }
  return res; }
const TH_PX=()=>{ const v=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--th")); return v||80; };
// Après chaque rendu : largeur des colonnes, hauteur réelle des blocs, puis position de chacun
function tableLayoutDom(){ const box=document.querySelector(".tblocks.tfree:not(.tprev)"), ch=cur(); if(!box||!ch) return;
  // Colonnes de page séparées de 4 px ; chaque bloc a 8 px de marge intérieure (maquette validée par Angle)
  const W=box.clientWidth, CW=(W-3*TL.FG)/4, secs=[...box.querySelectorAll(":scope > .tblk")];
  for(const el of secs){ const w=+el.dataset.w||4; el.style.width=(w*CW+(w-1)*TL.FG)+"px"; }
  const list=secs.map(el=>({id:el.dataset.blk,w:+el.dataset.w||4,h:el.offsetHeight}));
  const g=tableGeom(ch,list,tableOrder(ch)); let bottom=0;
  for(const el of secs){ const p=g[el.dataset.blk]; if(!p) continue; el.style.left=(p.c*(CW+TL.FG))+"px"; el.style.top=p.y+"px"; bottom=Math.max(bottom,p.y+el.offsetHeight); }
  box.style.height=(bottom+(S.layoutEdit?120:4))+"px"; S.TL={W,CW,g,list};
  // Un bloc qui change de taille sans nouveau rendu (champ ouvert, texte saisi…) : on replace les blocs, sans chevauchement
  if(typeof ResizeObserver==="function"&&!document.body.classList.contains("blkdragging")){ TL_RO=TL_RO||new ResizeObserver(()=>{ if(TL_RAF) return; TL_RAF=requestAnimationFrame(()=>{ TL_RAF=0; if(!document.body.classList.contains("blkdragging")) tableLayoutDom(); }); });
    TL_RO.disconnect(); secs.forEach(el=>TL_RO.observe(el)); } }
let TL_RO=null, TL_RAF=0;
window.addEventListener("resize",()=>{ if(S.view==="sheet"&&S.tab==="table") tableLayoutDom(); });
/* « Automatique (recommandé) » (demande d'Angle) : la disposition conseillée pour ce perso. Tous les blocs de base sont remis ;
   Repères à 3 colonnes avec Ressources en colonne à droite quand ses tuiles tiennent sur une ou deux rangées et qu'il y a une ressource par rangée,
   sinon pleine largeur ; Raccourcis conseillés ; Recherche et Notes côte à côte en bas ; les blocs créés sont retirés (décision d'Angle ; « Annuler » les rend). Titres d'origine. */
function autoLayout(ch){ const D=derive(ch), n=reperesAuto(ch,D).length, nr=D.res.length, cb=[];
  const width={recherche:4,notes:4}, order=["perso"];
  if(nr&&n<=6&&nr===Math.ceil(n/3)){ width.reperes=3; width.ressources=1; order.push("reperes","ressources","pv","recherche"); }
  else { order.push("reperes","pv","recherche"); if(nr) order.push("ressources"); }
  order.push("tour","raccourcis","notes",...cb);
  for(const id of cb){ const b=customBlocks(ch).find(x=>x.id===id); width[id]=blkWidth(ch,id,b); }
  const tiles=Object.assign({},ch.layout?.tiles); delete tiles.raccourcis;
  ch.layout=Object.assign({},ch.layout,{order,width,hidden:[],titles:{},tiles,custom:[],pos:{},cols:{},inspSeen:true}); touch(S.cur); }
/* Blocs retirés (ch.layout.hidden) : tous sauf Personnage et Points de vie ; on les remet par « Ajouter un bloc ». */
const BLK_FIXED=["perso","pv"];
const BLK_KEEP=["pv"]; // seul Points de vie ne se supprime pas (décision d'Angle) ; les autres se remettent par « + Ajouter un bloc »
const blkHidden=(ch,id)=>!BLK_KEEP.includes(id)&&Array.isArray(ch.layout?.hidden)&&ch.layout.hidden.includes(id);
function setBlkHidden(ch,id,on){ const h=(Array.isArray(ch.layout?.hidden)?ch.layout.hidden:[]).filter(x=>x!==id); if(on&&!BLK_KEEP.includes(id)) h.push(id); ch.layout=Object.assign({},ch.layout,{hidden:h}); touch(S.cur); }
function saveTableOrder(ch,order){ ch.layout=Object.assign({},ch.layout,{order}); touch(S.cur); }
function moveTableBlock(ch,id,d){ const o=tableOrder(ch), vis=o.filter(x=>!blkHidden(ch,x)), i=vis.indexOf(id), j=i+d; if(i<0||j<0||j>=vis.length) return; [vis[i],vis[j]]=[vis[j],vis[i]]; let k=0; saveTableOrder(ch,o.map(x=>blkHidden(ch,x)?x:vis[k++])); }
function hpStepper(ch,D){
  const hp=ch.hp||{cur:D.hpMax,temp:0}, ed=S.hpEdit;
  const val = ed ? `<input id="hp-set" type="number" inputmode="numeric" value="${+hp.cur||0}" aria-label="PV actuels" style="width:70px;font-size:var(--fs-lg)">` : `<button class="hpval" data-act="hpedit" title="Toucher pour saisir une valeur"><b class="num">${+hp.cur||0}</b></button>`;
  if(S.tab==="table"){
    const current=Math.max(0,+hp.cur||0), maximum=Math.max(0,+D.hpMax||0);
    const percent=maximum>0?Math.min(100,current/maximum*100):0;
    const healthClass=percent<=25?"critical":percent<=50?"wounded":"healthy";
    return `<span class="table-hp-meter"><span class="table-hp-value"><span class="label">Points de vie</span>${val}<button class="hpmaxb num${D.hpBonus>0?" up":D.hpBonus<0?" down":""}" data-act="tpop" data-v="hpmax" title="Modifier les PV max (sort, objet, effet)">/ ${D.hpMax}${D.hpBonus?` <small>(${sg(D.hpBonus)})</small>`:""}</button></span><span class="table-hp-track ${healthClass}" role="meter" aria-label="Points de vie" aria-valuemin="0" aria-valuemax="${maximum||1}" aria-valuenow="${Math.min(current,maximum||1)}" aria-valuetext="${current} sur ${maximum} PV"><span style="width:${percent}%"></span></span></span><span class="table-hp-actions"><button class="btn stepb hpdmgb" data-act="hpask" data-v="dmg" aria-label="Dégâts" title="Saisir des dégâts">Dégâts</button><button class="btn stepb hphealb" data-act="hpask" data-v="heal" aria-label="Soins" title="Saisir des soins">Soins</button></span>`;
  }
  return `<span class="hpstep"><button class="btn stepb hpdmgb" data-act="hpask" data-v="dmg" aria-label="Dégâts" title="Saisir des dégâts">Dégâts</button>${val}${S.tab==="table"?`<button class="hpmaxb num${D.hpBonus>0?" up":D.hpBonus<0?" down":""}" data-act="tpop" data-v="hpmax" title="Modifier les PV max (sort, objet, effet)">/ ${D.hpMax}${D.hpBonus?` <small>(${sg(D.hpBonus)})</small>`:""}</button>`:`<span class="muted num">/ ${D.hpMax}${D.hpBonus?` (${sg(D.hpBonus)})`:""}</span>`}<button class="btn stepb hphealb" data-act="hpask" data-v="heal" aria-label="Soins" title="Saisir des soins">Soins</button></span>`;
}
/* Fenêtres PV temp. et PV max ± : même présentation ; un champ numérique permet de saisir la valeur directement. */
function pvPop(wrap,o){ return wrap(o.title,`<div class="pvpop"><div class="label">${o.label}</div>
  <div class="pvline"><span class="hpstep"><button class="btn stepb" data-act="${o.act}" data-v="-1" aria-label="Retirer 1" ${o.minusOff?"disabled":""}>−</button><b class="num pvval">${o.val}</b><button class="btn stepb" data-act="${o.act}" data-v="1" aria-label="Ajouter 1">+</button></span>
  <input type="number" inputmode="numeric" class="pvset" data-pvset="${o.kind}" min="${o.min}" max="999" placeholder="Valeur" aria-label="${esc(o.label)} : saisir une valeur"></div>
  ${o.info?`<div class="pvinfo">${o.info}</div>`:""}<div class="row pvquick">${o.quick}</div><div class="muted pvnote">${o.note}</div></div>`); }
function hpMaxAdd(ch,d){ const D=derive(ch); ch.hpMaxBonus=(+ch.hpMaxBonus||0)+d; if(D.hpBase+ch.hpMaxBonus<1) ch.hpMaxBonus=1-D.hpBase; const real=ch.hpMaxBonus-D.hpBonus; ch.hp=ch.hp||{cur:D.hpMax,temp:0}; const D2=derive(ch); ch.hp.cur=Math.max(0,Math.min(D2.hpMax,(+ch.hp.cur||0)+(real>0?real:0))); touch(S.cur); }
function tempStepper(ch){
  const t=+(ch.hp?.temp||0);
  if(S.tab==="table") return `<span class="table-temp"><span class="table-temp-value"><span class="label">PV temporaires</span><b class="num">${t}</b></span><span class="table-temp-actions"><button class="btn stepb" data-act="tmpstep" data-v="1" aria-label="Ajouter 1 PV temporaire">+</button><button class="btn stepb" data-act="tmpstep" data-v="-1" aria-label="Retirer 1 PV temporaire" ${t<=0?"disabled":""}>−</button></span></span>`;
  return `<span class="hpstep"><span class="label">PV temp.</span><button class="btn stepb" data-act="tmpstep" data-v="-1" aria-label="Retirer 1 PV temporaire" ${t<=0?"disabled":""}>−</button><b class="num" style="font-size:var(--fs-xl);min-width:1.5em;text-align:center">${t}</b><button class="btn stepb" data-act="tmpstep" data-v="1" aria-label="Ajouter 1 PV temporaire">+</button></span>`;
}
/* Barre de recherche (tuile Recherche en largeur, ou bloc Recherche) : résultats dans une liste déroulante sous la barre. Une seule barre par écran. */
function searchBar(){ S.T._tq=true; const T=S.T; return `<div class="tsearchwrap"><form data-form="tq" class="tsearch"><input id="tq" type="search" autocomplete="off" placeholder="Jet, action, sort…" value="${esc(T.q)}" aria-label="Recherche rapide"><button type="button" class="tqclear" data-act="tqclear" aria-label="Effacer la recherche" ${T.q?"":"hidden"}>×</button></form><div id="tres" class="tresdrop${T.qOpen===false?" closed":""}">${tResults()}</div></div>`; }
function tResults(){
  const T=S.T; if(!T||!T.q.trim()) return "";
  const r=searchItems(S.Titems||[],T.q);
  if(!r.length) return `<div class="muted" style="padding:6px 2px">Rien trouvé pour « ${esc(T.q)} ».</div>`;
  return `<div class="tlist">${r.map((i,n)=>tRow(i,n===0)).join("")}</div>`;
}
function tRow(i,first,inEco){
  const kv=(l,v)=>`<span class="tk"><span class="tkl">${l}</span><b class="num">${esc(v)}</b></span>`;
  // Jet direct (Toucher, Dégâts, Soins) : la valeur est un bouton ; le reste de la ligne ouvre la fiche
  const kb=(l,v,r)=>`<span class="tk tkb" role="button" tabindex="0" data-act="tqroll" data-k="${esc(i.key)}" data-r="${r}" aria-label="${l} : lancer (${esc(i.name)})" title="${l} : lancer"><span class="tkl">${l}</span><b class="num">${esc(v)}</b></span>`;
  let right="";
  if(i.kind==="atk") right=kb("Toucher",sg(i.mod),"hit")+kb("Dégâts",i.dmg,"dmg");
  else if(i.kind==="spell"){
    // Sort de niveau 1+ : un seul bouton « Lancer » (emplacement choisi dans le mini-menu, puis jets dans la fenêtre de résultat) ; sort mineur : Toucher / Dégâts, ou « Lancer » s'il n'a pas de jet
    const lv=i.sp.level>0, cl=`<span class="tk tkb tkcast" role="button" tabindex="0" data-act="tqroll" data-k="${esc(i.key)}" data-r="cast" aria-label="Lancer ${esc(i.name)}" title="Lancer le sort"><b>Lancer</b></span>`;
    if(i.roll) right+= i.roll.startsWith("DD") ? kv("DD",i.roll.slice(3)) : (lv?kv("Toucher",i.roll):kb("Toucher",i.roll,"hit"));
    if(i.dice){ const D=S.Tderived; const b=(i.sp.level===0&&i.m&&i.m.beams&&D)?1+(D.L>=5)+(D.L>=11)+(D.L>=17):1; const t=(b>1?b+" × ":"")+i.dice; right+=lv?kv(i.heal?"Soins":"Dégâts",t):kb(i.heal?"Soins":"Dégâts",t,"dmg"); }
    if(lv||(!i.dice&&!(i.roll&&!i.roll.startsWith("DD")))) right+=cl;
    right+=`<span class="tklvl">${i.sp.level?"niv. "+i.sp.level:"mineur"}</span>`;
  }
  else if(i.mod!==undefined) right=`<b class="num tkv">${sg(i.mod)}</b>`;
  else if(i.cost&&!inEco) right=`<span class="badge">${ECO[i.cost]}</span>`;
  return `<button class="trow ${first?"first":""}${(i.kind==="atk"||i.kind==="bagitem")&&i.held===false?" sheathed":""}" data-act="tsel" data-k="${esc(i.key)}"><span class="tname"><b>${esc(i.name)}</b>${(()=>{ const sub = inEco ? (i.kind==="spell" ? (i.sp.range||"") : (i.kind==="atk" ? (i.held===true?(i.pact?"arme de pacte":"en main"):i.held===false?"au fourreau":"") : i.sub)) : i.sub; return sub?`<span class="muted"> · ${esc(sub)}</span>`:""; })()}</span><span class="tinfo" role="button" data-act="tip" data-k="${esc(i.key)}" aria-label="Règle : ${esc(i.name)}" title="Règle">i</span><span class="tright">${right}</span></button>`;
}
function tEco(ch,D){
  const T=S.T; if(!T.eco) return `<div class="muted" style="font-size:var(--fs-sm);padding:8px 0">Choisis un type d'action pour voir tout ce que ${esc(ch.name||"ton personnage")} peut faire avec.</div>`;
  const own=S.Titems.filter(i=>(i.cost===T.eco||(i.costs&&i.costs.includes(T.eco)))&&i.kind!=="basic"&&i.kind!=="rule");
  const basic=S.Titems.filter(i=>i.cost===T.eco&&(i.kind==="basic"||i.kind==="rule")&&!["attaque","magie"].includes(i.key.replace(/^basic:/,"")));
  const grp=(title,list)=>list.length?`<div class="tgrp"><div class="label">${esc(title)}</div><div class="tlist">${list.map(i=>tRow(i,false,true)).join("")}</div></div>`:"";
  let h="";
  if(T.eco==="action"){
    const atk=own.filter(i=>i.kind==="atk").sort((x,y)=>(y.held===true)-(x.held===true)||(x.held===false)-(y.held===false));
    const magie=own.filter(i=>i.kind==="spell"||(i.kind==="feat"&&(i.magic||/action Magie/.test(i.text||""))));
    const objs=own.filter(i=>i.kind==="bagitem");
    const other=own.filter(i=>!atk.includes(i)&&!magie.includes(i)&&!objs.includes(i));
    h=grp("Attaque",atk)+grp("Magie",magie)+grp("Aptitudes",other)+grp("Objets",objs);
  } else if(own.some(i=>i.kind==="bagitem")||own.length>6){
    h=grp("Sorts",own.filter(i=>i.kind==="spell"))+grp("Aptitudes",own.filter(i=>i.kind!=="spell"&&i.kind!=="bagitem"))+grp("Objets",own.filter(i=>i.kind==="bagitem"));
  } else h=own.length?`<div class="tlist">${own.map(i=>tRow(i,false,true)).join("")}</div>`:"";
  if(!own.length) h=`<div class="muted" style="padding:6px 2px">Rien de propre à ton personnage.</div>`;
  if(basic.length) h+=`<details class="tskills" style="margin-top:8px"><summary class="label">Autres actions${T.eco==="action"?"":" communes"} (${basic.length})</summary><div class="tlist">${basic.map(i=>tRow(i,false,true)).join("")}</div></details>`;
  return h;
}
function tCard(ch,D){
  const T=S.T; const i=(S.Titems||[]).find(x=>x.key===T.sel);
  if(!i) return "";
  const canEditCost=(i.kind==="feat"||i.kind==="basic"||i.kind==="rule")&&!i.info;
  const lockIc=open=>`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/>${open?'<path d="M8 11V7a4 4 0 0 1 7.5-2"/>':'<path d="M8 11V7a4 4 0 0 1 8 0v4"/>'}</svg>`;
  const costSel=canEditCost&&S.unlockCost
    ? `<label class="row" style="gap:6px;font-size:var(--fs-sm)"><span class="muted">Coût</span><select id="t-cost" data-act-change="tcost" data-k="${esc(i.key)}">${[["","Aucun"],...Object.entries(ECO)].map(([k,l])=>`<option value="${k}" ${(i.cost||"")===k?"selected":""}>${l}</option>`).join("")}</select><button class="btn small ghost lock" data-act="lockCost" aria-pressed="true" title="Verrouiller le coût">${lockIc(true)}</button></label>`
    : `<span class="row" style="gap:4px">${i.costs&&i.use&&i.use.spells?`<span class="badge">${ECO[costOfSpell((i.use.spells[Math.min(i.use.spells.length-1,+T.itemSp||0)]||{}).sp)||"action"]}</span>`:i.cost?`<span class="badge">${ECO[i.cost]}</span>`:(canEditCost?`<span class="muted" style="font-size:var(--fs-sm)">sans coût</span>`:"")}${canEditCost?`<button class="btn small ghost lock" data-act="lockCost" aria-pressed="false" title="Modifier le coût">${lockIc(false)}</button>`:""}</span>`;
  const head=costSel?`<div class="row" style="justify-content:flex-end">${costSel}</div>`:"";
  const d20=(kind,mod,parts,ab,label,noBig)=>{
    const adv=condAdvice(ch,kind,ab), mode=T.mode;
    const sugg = adv.mode && adv.mode!=="n" && adv.mode!==mode ? `<div class="tadvice">${adv.mode==="f"?"<b>Échec automatique</b> à cause de ton état.":`Suggestion : <b>${adv.mode==="a"?"avantage":"désavantage"}</b>.`} ${adv.mode!=="f"?`<button class="btn small" data-act="tmode" data-v="${adv.mode}">Appliquer</button>`:""}</div>`:"";
    const exh=2*(+ch.exhaustion||0);
    return `${noBig?"":`<div class="tbig"><span class="num">${sg(mod-exh)}</span><span class="muted">au d20${exh?" (épuisement compris)":""}</span></div>`}
      <div class="tparts">${parts.map(p=>`<span>${esc(p.l)} <b class="num">${sg(p.v)}</b></span>`).join("")}${exh?`<span>Épuisement <b class="num">−${exh}</b></span>`:""}</div>
      ${adv.notes.length?`<div class="tnotes">${adv.notes.join("<br>")}</div>`:""}${sugg}
      <div class="adv" role="group" aria-label="Mode du jet" style="margin-top:8px">${[["n","Normal"],["a","Avantage"],["d","Désavantage"]].map(([k,l])=>`<button aria-pressed="${mode===k}" data-act="tmode" data-v="${k}">${l}</button>`).join("")}</div>
      <div class="row tin"><label class="field"><span>${mode==="n"?"Ton d20":"1er d20"}</span><input id="t-d1" type="number" inputmode="numeric" min="1" max="20" value="${esc(T.d1)}" data-tin="d1"></label>
      ${mode!=="n"?`<label class="field"><span>2e d20</span><input id="t-d2" type="number" inputmode="numeric" min="1" max="20" value="${esc(T.d2)}" data-tin="d2"></label>`:""}
      <div class="ttotal" id="t-tot" data-mod="${mod-exh}" data-label="${esc(label)}">${totalHtml(mod-exh)}</div>
      <button class="btn small vroll" data-virtual data-act="tvroll" title="Lance ${mode==="n"?"un d20":"deux d20"} à ta place">Lancer ${mode==="n"?"le d20":"les 2 d20"}</button></div>`;
  };
  const dmgBlock=(expr,type,label,crit=true,noBig)=>{
    if(!expr) return "";
    const m=String(expr).match(/^(.*?)([+-]\d+)?$/); const dice=m[1], flat=+(m[2]||0);
    const re1=type==="soins"&&D.guerisseur, r1=re1?' data-re1="1"':"";
    return `<div class="tdmg">${noBig?"":`<div class="tbig"><span class="num">${esc(expr)}</span><span class="muted">${esc(type||"")}</span></div>`}
      ${crit?`<div class="muted" style="font-size:var(--fs-sm)">Critique : lance ${esc(doubleDice(dice))}${flat?" "+sg(flat):""}</div>`:""}
      ${(()=>{ const rg=diceRange(dice), rc=crit?diceRange(doubleDice(dice)):rg; return `<div class="row tin"><label class="field"><span>Total de tes dés${rg?` (${rg[0]} à ${rc[1]}${crit?", critique compris":""})`:""}</span><input id="t-dmg" type="number" min="${rg?rg[0]:0}"${rg?` max="${rc[1]}"`:""} step="1" inputmode="numeric" value="${esc(T.dmg)}" data-tin="dmg"></label>`; })()}
      <div class="ttotal" id="t-dtot" data-flat="${flat}">${damageTotalHtml(T.dmg,flat)}</div>
      <button class="btn small vroll" data-virtual data-act="tvdmg" data-e="${esc(dice)}"${r1} title="Lance ${esc(dice)} à ta place">Lancer ${esc(dice)}</button>
      ${crit?`<button class="btn small ghost vroll" data-virtual data-act="tvdmg" data-e="${esc(doubleDice(dice))}" data-crit="1" title="Lance ${esc(doubleDice(dice))} à ta place">Critique</button>`:""}</div>
      ${re1?`<div class="muted" style="font-size:var(--fs-sm)">Guérisseur : un dé de soins qui fait 1 est relancé une fois (automatique au lancer virtuel).</div>`:""}
      ${T.dmgBd?`<div class="muted num" style="font-size:var(--fs-sm)">${esc(T.dmgBd)}</div>`:""}</div>`;
  };
  let body="";
  const sec=(t,inner)=>inner?`<section class="tsec"><h3 class="tsech">${esc(t)}</h3>${inner}</section>`:"";
  const exhN=2*(+ch.exhaustion||0);
  if(["abil","save","skill","init"].includes(i.kind)){ body=d20(i.kind==="init"?"init":i.kind,i.mod,i.parts,i.ab,i.name);
    if(i.kind==="skill"){ const sk=S.C.skills.find(x=>"skill:"+x.id===i.key); const lv=D.skills[sk.id].lv;
      body+=`<div class="tskinfo"><div class="muted" style="font-size:var(--fs-sm)">${["Non maîtrisée","Maîtrisée","Expertise"][lv]}</div>${sk.examples?`<div class="prose" style="font-size:var(--fs-md)"><p><b>Exemples d'application.</b> ${esc(sk.examples)}</p></div>`:""}</div>`; } }
  else if(i.kind==="atk") body=sec("Toucher",d20("atk",i.mod,i.parts,null,i.name+" — toucher"))+sec("Dégâts",dmgBlock(i.dmg,i.dtype,"Dégâts",true))+smiteBlock(ch,D,i)+(()=>{ const w=i.wref; let ref=""; if(w.startsWith("srd:")) ref="item:arme:"+w.slice(4); else if(w.startsWith("hb:")) ref=w; const h=ref?itemTipHtml(ref).replace(/<div class="tiphead">[\s\S]*?<\/div>/,""):""; return h?`<details class="tdesc"><summary class="label">Description de l'arme</summary><div class="prose">${h}</div></details>`:""; })()+(i.mastery?`<div class="muted" style="font-size:var(--fs-sm);margin-top:6px">Botte d'arme : ${esc(i.mastery)}</div>`:"")+(i.held===false?`<div class="tnotes" style="margin-top:6px">Au fourreau : tu peux la dégainer gratuitement au moment de cette attaque (une arme par attaque).${i.bagId?` <button class="btn small" data-act="eqset" data-slot="mainP" data-id="${esc(i.bagId)}">Prendre en main</button>`:""}</div>`:"")+((i.pact?D.atkNpact:D.atkN)>1?`<div class="tnotes" style="margin-top:6px">L'action Attaque te permet d'attaquer <b>${i.pact?D.atkNpact:D.atkN} fois</b>${i.pact&&D.atkNpact>D.atkN?" avec ton arme de pacte (Lame assoiffée)":""}.</div>`:"")+ammoBlock(ch,i);
  else if(i.kind==="spell"){
    const sp=i.sp, m=i.m;
    const opts=sp.level===0?[]:(D.cast.type==="pact"?[D.cast.pactLevel]:(D.cast.slots||[]).map((n,k)=>k+1)).filter(l=>l>=sp.level);
    const lvl=opts.includes(+T.slot)?+T.slot:(opts[0]||0);
    const sel=opts.length>1?`<select id="t-slot" data-act-change="tslot">${opts.map(l=>`<option value="${l}" ${l===lvl?"selected":""}>emplacement niv. ${l}</option>`).join("")}</select>`:(opts.length?`<span class="badge">emplacement niv. ${opts[0]}</span>`:"");
    const al=arcLevel(D,i.ref), arcUsed=al&&+(ch.resUsed?.["arc:"+al]||0)>=1;
    const canCast = al ? !arcUsed : (sp.level===0 || opts.length);
    const done = T.castDone===i.key;
    const info=`<div class="muted" style="font-size:var(--fs-sm)">${esc([sp.casting_time,sp.range,sp.duration,sp.components].filter(Boolean).join(" · "))}${sp.concentration?" · <b>Concentration</b>":""}</div>`;
    let castCtl="";
    if(sp.level>0 && !done){
      const fr=(D.res||[]).find(r=>r.freeSpell===i.ref), frLeft=fr?fr.max-(+ch.resUsed?.[fr.id]||0):0;
      body=info; castCtl=`${fr?`<div class="row" style="margin:6px 0">${frLeft>0?`<button class="btn primary" data-act="tcast" data-ref="${esc(i.ref)}" data-k="${esc(i.key)}" data-l="${sp.level}" data-free="${esc(fr.id)}">Lancer sans emplacement</button><span class="muted" style="font-size:var(--fs-sm)">${frLeft}/${fr.max} · revient au repos long</span>`:`<span class="muted" style="font-size:var(--fs-sm)">Lancer gratuit déjà utilisé (revient au repos long).</span>`}</div>`:""}<div class="row" style="margin:6px 0">${sel}${canCast?`<button class="btn primary" data-act="tcast" data-ref="${esc(i.ref)}" data-k="${esc(i.key)}" data-l="${al||lvl}" ${al?`data-arc="${al}"`:""}>Lancer le sort</button>`:`<span class="muted">${al?"Arcanum déjà utilisé : revient au repos long.":"Aucun emplacement disponible."}</span>`}${sp.ritual?`<button class="btn" data-act="tcast" data-rit="1" data-ref="${esc(i.ref)}" data-k="${esc(i.key)}" data-l="${sp.level}">En rituel</button>`:""}</div>
        <div class="muted" style="font-size:var(--fs-sm)">${al?"Arcanum mystique : une fois par repos long, sans emplacement.":"Lancer le sort dépense l'emplacement de "+(D.cast.type==="pact"?"pacte":"sort")+", puis affiche les jets."}</div>`;
    } else {
      const used = done ? (T.castRit?"en rituel":"niv. "+T.castLvl) : "";
      const cOK=costOfSpell(sp);
      castCtl=done?`<div class="row tcastdone"><span class="badge srd">Lancé ${sp.level>0?esc(used):""}</span><span class="muted">${T.castRit||sp.level===0?"Aucun emplacement dépensé.":"Emplacement ou ressource de lancement dépensé."}</span></div>`:(!m.attack&&!m.dice?`<div class="row"><button class="btn primary" data-act="tcast" data-ref="${esc(i.ref)}" data-k="${esc(i.key)}" data-l="0">Lancer le sort</button></div>`:""); body=info;
      const ex=diceAt(m,sp,done?(T.castRit?sp.level:T.castLvl):(lvl||sp.level),D);
      if(m.attack) body+=sec("Toucher",d20("spellatk",D.cast.atk,[{l:ABN[D.cast.ability],v:D.mods[D.cast.ability]},{l:"Maîtrise",v:D.pb}],null,sp.name+" — toucher"));
      else if(m.save) body+=sec("Jet de sauvegarde de la cible",`<div class="tbig"><span class="num">DD ${D.cast.dc}</span><span class="muted">JS de ${esc(m.save)}</span></div>`);
      if(ex) body+=sec(m.heal?"Soins":"Dégâts",dmgBlock(ex,m.heal?"soins":m.dmgType,m.heal?"Soins":"Dégâts",!!m.attack));
      const th=+(sp.mech&&sp.mech.tempHp)||0;
      if(th){ const L2=done?(T.castRit?sp.level:T.castLvl):(lvl||sp.level), v=th*Math.max(1,L2), cur0=+(ch.hp&&ch.hp.temp)||0;
        body+=sec("PV temporaires",`<div class="tbig"><span class="num">${v}</span><span class="muted">au niveau ${Math.max(1,L2)}</span></div>${done?(()=>{ const ct=T.castTemp; return ct&&ct.b0>=ct.v?`<div class="muted" style="font-size:var(--fs-sm)">Tu avais déjà ${ct.b0} PV temporaires : on garde le plus haut, ils ne se cumulent pas.</div>`:`<div class="muted" style="font-size:var(--fs-sm)">✓ Ajoutés à tes PV temporaires.</div>`; })():`<div class="muted" style="font-size:var(--fs-sm)">Ajoutés automatiquement au lancement du sort.</div>`}${sp.mech.tempNote?`<div class="muted" style="font-size:var(--fs-sm);margin-top:4px">${esc(sp.mech.tempNote.replace(/\{n\}/g,v))}</div>`:""}`); }
    }
    { const nn=invNotes(D,i.ref,sp); if(nn.length) body+=`<div class="tnotes" style="margin-top:6px">${nn.map(esc).join("<br>")}</div>`; }
    if(sp.level===0&&m.beams){ const b=1+(D.L>=5)+(D.L>=11)+(D.L>=17); if(b>1) body+=`<div class="muted">${b} rayons : une attaque et des dégâts par rayon.</div>`; }
    body+=`<details class="tdesc"><summary class="label">Description du sort</summary><div class="prose">${prose(sp.text)}</div></details>`;
    if(castCtl) body+=`<div class="tuse">${castCtl}</div>`;
  }
  else if(i.kind==="feat"){
    const r=i.res; let ctl="";
    if(r){ const used=+(ch.resUsed?.[r.id]||0), left=r.max-used;
      if(r.id==="cls:rouerie-magique") ctl=`<div class="row">${pips("res:"+r.id,r.max,used,true,true)}${left>0?`<button class="btn small primary" data-act="rouerie">Utiliser</button>`:`<span class="muted">Revient au repos long</span>`}</div>`;
      else if(r.pool) ctl=`<div class="row"><b class="num">${left} / ${r.max} d${r.die}</b><label class="row" style="gap:4px">Dés à dépenser <input id="t-pool" type="number" min="1" max="${Math.min(left,r.maxUse||left)}" value="${Math.min(left,r.maxUse||left)||1}" style="width:60px"></label><button class="btn small primary" data-act="tpool" data-id="${esc(r.id)}" ${left<=0?"disabled":""}>Dépenser</button></div><div class="muted" style="font-size:var(--fs-sm)">Dépense les dés, puis lance-les ci-dessous : dés physiques ou jet virtuel.</div>`;
      else ctl=`<div class="row">${r.max<=10?pips("res:"+r.id,r.max,used,true):`<b class="num">${left} / ${r.max}</b>`}<span class="muted" style="font-size:var(--fs-sm)">${rechargeLabel(r.recharge)}</span></div>`;
    }
    let roll="";
    if(r&&r.pool&&T.poolKey===i.key&&T.poolN){ const expr=T.poolN+"d"+r.die; const heal=/soin|récup|guéri/i.test(i.name+" "+(i.text||""));
      roll=sec(heal?"Soins":"Dégâts",dmgBlock(expr,heal?"soins":"",heal?"Soins":"Dégâts",false)+`<div class="row" style="gap:8px;margin-top:6px">${heal?`<button class="btn small" data-act="tpoolself" title="Ajoute le total à tes propres PV">Appliquer à moi</button>`:""}<button class="btn small ghost" data-act="tpoolundo">Annuler la dépense</button></div>`); }
    body=ctl+roll+(i.text?`<details class="tdesc" ${ctl||roll?"":"open"}><summary class="label">Description</summary><div class="prose">${prose(i.text)}</div></details>`:"");
  }
  else if(i.kind==="counter"){ const c=i.counter; body=`<div class="row">${(+c.max||0)<=20?pips("cnt:"+c.id,+c.max||0,(+c.max||0)-(+c.cur||0),true):""}<b class="num">${+c.cur||0}/${+c.max||0}</b></div>`; }
  else if(i.kind==="bagitem"&&i.use){ const b=(ch.bag||[]).find(z=>z.id===i.bagId), u=itemUse(ch,b)||i.use; let x="";
    if(u.held===false) x+=`<div class="tnotes">Cet objet doit être tenu en main pour servir.${` <button class="btn small" data-act="eqset" data-slot="mainP" data-id="${esc(b.id)}">Prendre en main</button>`}</div>`;
    if(u.c&&u.c.max) x+=sec("Charges",`<div class="row" style="gap:10px">${chargePips(ch,b)}</div>`);
    let nUse=1, uCost=u.cost;
    if(u.spells){ const k=Math.min(u.spells.length-1,Math.max(0,+T.itemSp||0)), e=u.spells[k], sp=e.sp, m=spellMech(sp), left=u.left??0;
      x+=sec("Sort à lancer",`<div class="adv" role="group" style="flex-wrap:wrap">${u.spells.map((z,j)=>`<button aria-pressed="${j===k}" data-act="itemSp" data-v="${j}"${z.cost>left?' class="dim"':""}>${esc(z.sp.name)} · ${z.perLvl?"1 charge/niv.":z.cost+" charge"+(z.cost>1?"s":"")}</button>`).join("")}</div>`);
      let lvl=+sp.level||0;
      if(e.perLvl){ const mxL=Math.min(e.max||9,left); const opts=[]; for(let l=Math.max(1,sp.level);l<=mxL;l++) opts.push(l); const ch0=opts.includes(+T.itemN)?+T.itemN:(opts[0]||Math.max(1,sp.level)); lvl=ch0; nUse=ch0;
        if(opts.length>1) x+=`<div class="adv" role="group" style="margin-top:8px">${opts.map(l=>`<button aria-pressed="${l===ch0}" data-act="itemN" data-v="${l}">niv. ${l} · ${l} charge${l>1?"s":""}</button>`).join("")}</div>`; }
      else nUse=e.cost;
      x+=`<div class="muted" style="font-size:var(--fs-sm);margin-top:6px">${esc([sp.casting_time,sp.range,sp.duration].filter(Boolean).join(" · "))}${sp.concentration?" · <b>Concentration</b>":""} · niveau ${lvl||"mineur"}</div>`;
      if(m.attack) x+=sec("Toucher",d20("spellatk",D.cast?.atk||D.pb,[{l:"Attaque de sort",v:D.cast?.atk||D.pb}],null,sp.name+" — toucher"));
      else if(m.save) x+=sec("Jet de sauvegarde de la cible",`<div class="tbig"><span class="num">DD ${u.dd||D.cast?.dc||"?"}</span><span class="muted">JS de ${esc(m.save)}${u.dd?" · DD de l'objet":" · ton DD de sorts"}</span></div>`);
      const ex=m.dice?diceAt(m,sp,lvl||sp.level,D):""; if(ex) x+=sec(m.heal?"Soins":"Dégâts",dmgBlock(ex,m.heal?"soins":m.dmgType,m.heal?"Soins":"Dégâts",!!m.attack));
      x+=`<details class="tdesc"><summary class="label">Description du sort</summary><div class="prose">${prose(sp.text)}</div></details>`;
      uCost=costOfSpell(sp)||u.cost;
    } else if(u.sp){ const sp=u.sp, m=spellMech(sp); const maxN=Math.max(1,Math.min(u.maxCh,u.left??1)); nUse=Math.min(maxN,Math.max(1,+T.itemN||1)); const lvl=sp.level+(nUse-1);
      x+=sec("Sort lancé",`<div class="tbig"><span class="num" style="font-size:var(--fs-xl)">${esc(sp.name)}</span><span class="muted">niveau ${lvl}${u.maxCh>1?` · ${nUse} charge${nUse>1?"s":""}`:""}</span></div>${u.maxCh>1?`<div class="adv" role="group" style="margin-top:8px">${Array.from({length:maxN},(_,k)=>`<button aria-pressed="${nUse===k+1}" data-act="itemN" data-v="${k+1}">${k+1} charge${k?"s":""} · niv. ${sp.level+k}</button>`).join("")}</div>`:""}`);
      if(m.attack) x+=sec("Toucher",d20("spellatk",D.cast?.atk||D.pb,[{l:"Attaque de sort",v:D.cast?.atk||D.pb}],null,sp.name+" — toucher"));
      else if(m.save) x+=sec("Jet de sauvegarde de la cible",`<div class="tbig"><span class="num">DD ${u.dd||D.cast?.dc||"?"}</span><span class="muted">JS de ${esc(m.save)}${u.dd?" · DD de l'objet":""}</span></div>`);
      const ex=m.dice?diceAt(m,sp,lvl,D):""; if(ex) x+=sec(m.heal?"Soins":"Dégâts",dmgBlock(ex,m.heal?"soins":m.dmgType,m.heal?"Soins":"Dégâts",!!m.attack));
    } else if(u.potion){ const hm=String(bagRefText(b).text).match(/(\d+d\d+(?:\s*\+\s*\d+)?) points de vie/i); if(hm){ const ex=hm[1].replace(/\s/g,""); x+=sec("Soins",dmgBlock(ex,"soins","Soins",false)+`<div class="row" style="margin-top:6px"><button class="btn small" data-act="tpoolself">Appliquer à moi</button></div>`); } }
    if(D.guerisseur&&/trousse de soins/.test(norm(b.name))){ const f=[6,8,10,12].includes(+T.gdie)?+T.gdie:(D.hd||8);
      x+=sec("Soins de Guérisseur",`<div class="muted" style="font-size:var(--fs-sm)">La cible (à 1,50 m) dépense un de ses dés de vie ; tu le lances et elle récupère le résultat + ton bonus de maîtrise.</div><div class="adv" role="group" style="margin:8px 0">${[6,8,10,12].map(k=>`<button aria-pressed="${f===k}" data-act="gdie" data-v="${k}">d${k}</button>`).join("")}</div>`+dmgBlock("1d"+f+"+"+D.pb,"soins","Soins",false)+`<div class="row" style="margin-top:6px"><button class="btn small" data-act="tpoolself">Appliquer à moi</button></div>`); }
    const lab=uCost&&ECO[uCost]?ECO[uCost]:"";
    x+=`<details class="tdesc"><summary class="label">Description</summary><div class="prose">${i.html||prose(i.text)}</div></details>`;
    const canUse=u.c&&u.c.max?(u.left||0)>=nUse:(+b.qty||0)>0;
    x+=`<div class="tuse">${S.T.itemUseReceipt===tableItemReceipt()?`<span class="badge srd">Objet utilisé · ressource dépensée</span>`:canUse?`<button class="btn primary" data-act="itemUse" data-id="${esc(b.id)}" data-n="${nUse}" data-cost="${esc(uCost||"")}">Utiliser${lab?" · "+lab:""}</button><span class="muted" style="font-size:var(--fs-sm)">${u.c&&u.c.max?(nUse>1?nUse+" charges dépensées":"1 charge dépensée"):"1 "+esc(b.name)+" consommé"}${lab&&uCost!=="autre"?" · barre « "+lab+" »":""}</span>`:`<span class="muted">${u.c&&u.c.max?"Plus assez de charges.":"Plus aucun exemplaire."}</span>`}</div>`;
    body=x; }
  else body=`<details class="tdesc" open><summary class="label">Description</summary><div class="prose">${i.html||prose(i.text)}</div></details>`;
  if(i.cond){ const on=(ch.conditions||[]).includes(i.cond); body=`<div class="tuse"><button class="btn${on?"":" primary"}" data-act="cond" data-v="${esc(i.cond)}" aria-pressed="${on}">${on?"Retirer l’état":"Activer l’état"}</button></div>`+body; }
  if(i.rest) body=`<div class="tuse"><button class="btn primary" data-act="restOpen" data-v="${i.rest}">${i.rest==="court"?"Faire un repos court":"Faire un repos long"}</button></div>`+body;
  const kv=(l,v)=>`<span class="tk"><span class="tkl">${l}</span><b class="num">${esc(v)}</b></span>`;
  let sum="";
  if(["abil","save","skill","init"].includes(i.kind)) sum=kv("Bonus",sg(i.mod-exhN));
  else if(i.kind==="atk") sum=kv("Toucher",sg(i.mod-exhN))+kv("Dégâts",i.dmg);
  else if(i.kind==="spell"){ const m=i.m; if(m.attack) sum+=kv("Toucher",sg(D.cast.atk-exhN)); else if(m.save) sum+=kv("DD",D.cast.dc); if(i.dice) sum+=kv(m.heal?"Soins":"Dégâts",i.dice); if(i.sp.level) sum+=`<span class="tklvl">niv. ${i.sp.level}</span>`; }
  else if(i.kind==="feat"&&i.res){ const r=i.res; sum=kv("Reste",(r.max-(+ch.resUsed?.[r.id]||0))+"/"+r.max+(r.pool?" d"+r.die:"")); }
  else if(i.kind==="counter") sum=kv("Reste",(+i.counter.cur||0)+"/"+(+i.counter.max||0));
  const lkRef=i.kind==="spell"?i.ref:i.kind==="feat"?i.src:i.kind==="bagitem"?(((ch.bag||[]).find(z=>z.id===i.bagId)||{}).ref||matchItem(i.name)):null;
  if(lkRef&&isHb(lkRef)) body+=hbFoot(hb(lkRef));
  return `<div class="tcard tcardpop"><div class="tcsum"><span class="tcname"><b>${esc(i.name)}</b><span class="muted"> · ${esc(i.sub)}</span></span><span class="tright">${sum}</span></div><div class="tcbody">${head}<div id="t-action-state">${tableActionFeedback(ch,i)}</div>${body}</div></div>`;
}
function smiteBlock(ch,D,i){
  if(!i.pact||!D.inv.has("frappe-occulte")||!D.cast||D.cast.type!=="pact"||D.L<5) return "";
  const T=S.T, on=!!(ch.turn||{}).smite, left=(+D.cast.pactSlots||0)-(+ch.pactUsed||0), lv=+D.cast.pactLevel||1, ex=(1+lv)+"d8", cx=(2*(1+lv))+"d8";
  let x;
  if(on) x=`<div class="tbig"><span class="num">${ex}</span><span class="muted">force · emplacement niv. ${lv} dépensé</span></div>
    <form class="row tin" data-form="smitePhysical"><label class="field"><span>Total des dés physiques (${ex}, critique ${cx})</span><input name="total" type="number" inputmode="numeric" min="0" step="1" required></label><button class="btn small" type="submit">Appliquer</button><span>Bonus : +0</span></form>
    <div class="row" style="gap:6px;margin-top:6px"><button class="btn small vroll" data-virtual data-act="smiteRoll" data-e="${ex}">Lancer ${ex}</button><button class="btn small ghost vroll" data-virtual data-act="smiteRoll" data-e="${cx}" data-crit="1">Critique</button><button class="btn small ghost" data-act="smiteUndo">Annuler</button></div>
    ${T.smiteBd?`<div class="muted num" style="font-size:var(--fs-sm);margin-top:4px">${esc(T.smiteBd)}</div>`:""}
    <div class="muted" style="font-size:var(--fs-sm);margin-top:4px">Si la cible est de taille TG ou moins, elle tombe À terre.</div>`;
  else x=`<div class="muted" style="font-size:var(--fs-sm)">Une fois par tour, après un coup avec ton arme de pacte : dépense un emplacement de pacte pour ${ex} dégâts de force en plus. Une cible de taille TG ou moins tombe À terre.</div>
    <div class="row" style="margin-top:6px">${left>0?`<button class="btn small" data-act="smite">Frappe occulte · emplacement niv. ${lv}</button><span class="muted" style="font-size:var(--fs-sm)">${left} emplacement${left>1?"s":""} de pacte</span>`:`<span class="muted">Plus d'emplacement de pacte.</span>`}</div>`;
  return `<section class="tsec"><h3 class="tsech">Frappe occulte</h3>${x}</section>`;
}
/* Jets directs (demande d'Angle) : un toucher sur Toucher ou Dégâts dans une ligne ouvre un mini-menu
   (Toucher : avantage, normal, désavantage — imposé par un état, les autres grisés ; Dégâts : normal ou critique),
   puis une petite fenêtre qui ne montre que le résultat. Dés physiques : le pavé demande le ou les dés d'abord. */
let QMENU=null;
function qMenuClose(){ if(QMENU){ QMENU.remove(); QMENU=null; } }
function castOpts(ch,D,i){ const sp=i.sp, out=[], al=arcLevel(D,i.ref), fr=(D.res||[]).find(r=>r.freeSpell===i.ref), pl=n=>n+" restant"+(n>1?"s":"");
  if(al){ const used=+(ch.resUsed?.["arc:"+al]||0)>=1; out.push(["arc:"+al,`Arcanum mystique (niv. ${al})${used?" · déjà utilisé":""}`,used]); return out; }
  if(fr){ const left=fr.max-(+ch.resUsed?.[fr.id]||0); out.push(["free:"+fr.id,`Sans emplacement (${left}/${fr.max})`,left<=0]); }
  if(!D.cast) return out;
  if(D.cast.type==="pact"){ if(D.cast.pactLevel>=sp.level){ const left=Math.max(0,(D.cast.pactSlots||0)-(+ch.pactUsed||0)); out.push(["slot:"+D.cast.pactLevel,`Niv. ${D.cast.pactLevel} · pacte (${pl(left)})`,left<=0]); } }
  else (D.cast.slots||[]).forEach((n,k)=>{ const l=k+1; if(l<sp.level||!n) return; const left=Math.max(0,n-(+ch.slotsUsed?.[l]||0)); out.push(["slot:"+l,`Niv. ${l} (${pl(left)})`,left<=0]); });
  return out; }
function qMenuOpen(btn){ qMenuClose(); const k=btn.dataset.k, r=btn.dataset.r, from=btn.dataset.from||"", i=(S.Titems||[]).find(x=>x.key===k), ch=cur(); if(!i||!ch) return;
  if(r==="cast"&&i.sp&&i.sp.level===0){ quickCast(k,"slot:0"); return; }
  const adv=r==="hit"?condAdvice(ch,i.kind==="atk"?"atk":"spellatk",i.ab):{mode:"n"}, forced=adv.mode==="a"||adv.mode==="d"?adv.mode:null;
  const opts=r==="cast"?castOpts(ch,derive(ch),i).map(([v,l,dis])=>[v,l,"✦",dis]):r==="hit"?[["a","Avantage","˄"],["n","Normal","–"],["d","Désavantage","˅"]]:[["n","Normal","–"],["c","Critique (dés doublés)","×2"]];
  const m=document.createElement("div"); m.className="qmenu"; m.setAttribute("role","menu"); m.setAttribute("aria-label",(r==="cast"?"Lancer : ":r==="hit"?"Jet d'attaque : ":"Dégâts : ")+i.name);
  m.innerHTML=(opts.length?opts.map(([v,l,ic,dis])=>`<button role="menuitem" class="qm-${v.split(":")[0]}" data-act="tqgo" data-k="${esc(k)}" data-r="${r}" data-m="${esc(v)}" data-from="${esc(from)}"${dis||(forced&&forced!==v)?" disabled":""}${forced===v?' aria-current="true"':""}><span class="qmi" aria-hidden="true">${ic}</span>${esc(l)}</button>`).join(""):`<div class="qmnote">Aucun emplacement pour ce sort.</div>`)+(forced?`<div class="qmnote">${forced==="a"?"Avantage":"Désavantage"} imposé par ton état</div>`:"");
  document.body.append(m); QMENU=m;
  const b=btn.getBoundingClientRect(), w=m.offsetWidth, h=m.offsetHeight;
  m.style.left=Math.max(8,Math.min(innerWidth-w-8,b.right-w))+"px"; m.style.top=(b.bottom+6+h>innerHeight-8?Math.max(8,b.top-6-h):b.bottom+6)+"px";
  (m.querySelector("[aria-current]")||m.querySelector("button:not([disabled])"))?.focus(); }
document.addEventListener("pointerdown",e=>{ if(QMENU&&!e.target.closest(".qmenu")&&!e.target.closest('[data-act="tqroll"]')) qMenuClose(); },true);
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&QMENU){ qMenuClose(); e.stopPropagation(); } },true);
function qBack(){ const T=S.T; if(T.pop&&T.pop!=="qroll"&&T.pop!=="card") T.qrBack=T.pop; else if(T.pop!=="qroll") T.qrBack=null; }
function quickRoll(key,r,m,from){ const T=S.T, ch=cur(), i=(S.Titems||[]).find(x=>x.key===key); if(!i||!ch) return; qBack();
  const keep=from==="cast"&&T.castDone===key; // jets d'un sort qui vient d'être lancé : on ne relance pas le sort
  Object.assign(T,{sel:key,logSig:"",itemN:1,itemSp:0,smiteBd:"",d1:"",d2:"",dmg:"",dmgBd:"",slot:null,itemUseReceipt:null,mode:r==="hit"?(m==="a"||m==="d"?m:"n"):"n"}); if(!keep) T.castDone=null;
  T.recent=[key,...(T.recent||[]).filter(k=>k!==key)].slice(0,6);
  const D=derive(ch), exh=2*(+ch.exhaustion||0), heal=!!i.heal;
  if(r==="hit"){ const mod=(i.kind==="atk"?+i.mod:parseInt(i.roll,10)||0)-exh; T.qr={k:key,r,mode:T.mode,mod,label:i.name+" — toucher"}; }
  else { const b=(i.kind==="spell"&&i.sp&&i.sp.level===0&&i.m&&i.m.beams)?1+(D.L>=5)+(D.L>=11)+(D.L>=17):1;
    const expr=String(i.kind==="atk"?i.dmg:(keep&&i.m&&i.sp?diceAt(i.m,i.sp,T.castRit?i.sp.level:T.castLvl,D):i.dice)||""), mm=expr.match(/^(.*?)([+-]\d+)?$/), dice=mm[1], flat=+(mm[2]||0);
    T.qr={k:key,r,crit:m==="c",dice:m==="c"?doubleDice(dice):dice,flat,heal,beams:b,re1:heal&&!!D.guerisseur}; }
  T.pop="qroll"; render();
  if(virtualDiceEnabled()){ if(!ensureTableRollUse()){ render(); return; }
    if(r==="hit"){ T.d1=String(rnd(20)); T.d2=T.mode!=="n"?String(rnd(20)):""; render(); if(logD20(false)) tableRollCommitted("d20"); }
    else { const x=rollExpr(T.qr.dice,T.qr.re1); T.dmg=String(x.total); T.dmgBd=(T.qr.crit?"Critique · ":"")+x.bd; render(); if(logDmg(false)) tableRollCommitted("dmg"); }
    render(); }
  else { const inp=document.getElementById(r==="hit"?"t-d1":"t-dmg"); if(inp) inp.focus(); } } // dés physiques : la case est active, le clavier sort
function quickCast(key,m){ const T=S.T, ch=cur(), i=(S.Titems||[]).find(x=>x.key===key); if(!i||!ch||!i.sp) return; qMenuClose(); qBack();
  Object.assign(T,{sel:key,logSig:"",itemN:1,itemSp:0,smiteBd:"",d1:"",d2:"",dmg:"",dmgBd:"",slot:null,castDone:null,itemUseReceipt:null,mode:"n"});
  T.recent=[key,...(T.recent||[]).filter(k=>k!==key)].slice(0,6);
  const [kind,v]=String(m||"slot:0").split(":"), data={ref:i.ref,k:key,l:String(i.sp.level===0?0:i.sp.level)};
  if(kind==="slot"&&i.sp.level>0) data.l=String(+v||i.sp.level); if(kind==="free") data.free=v; if(kind==="arc") data.arc=v;
  const ok=performTableCast(data); T.qr={k:key,r:"cast",ok}; T.pop="qroll"; render(); }
function qrollPop(ch,D,wrap){ const T=S.T, q=T.qr, i=q&&(S.Titems||[]).find(x=>x.key===q.k); if(!i){ T.pop=null; return ""; }
  const phys=!virtualDiceEnabled(), ML={n:"Normal",a:"Avantage",d:"Désavantage"};
  if(q.r==="cast"){ const sp=i.sp, m=i.m||{}, done=T.castDone===q.k, L=T.castRit?sp.level:T.castLvl, last=(ch.rollLog||[])[0]||{};
    if(!done) return wrap(esc(i.name)+" · Lancer",`<div class="qres"><div class="tnotes">${esc(last.label||"Lancement impossible")}${last.bd?" : "+esc(last.bd):""}</div></div>`);
    const ex=diceAt(m,sp,L,D), btn=(r,l,v)=>`<button class="btn qchain" data-act="tqroll" data-k="${esc(q.k)}" data-r="${r}" data-from="cast"><span class="tkl">${l}</span> <b class="num">${esc(v)}</b></button>`;
    return wrap(esc(i.name)+" · Lancé",`<div class="qres"><div class="qmode label">${sp.level?"Lancé au niveau "+L:"Sort mineur lancé"}</div>
      <div class="muted" style="font-size:var(--fs-sm)">${sp.level&&!T.castRit?(T.castArc?"Arcanum mystique utilisé.":T.castFree?"Lancer gratuit utilisé.":"Emplacement dépensé."):"Aucun emplacement dépensé."}${sp.concentration?` Concentration : <b>${esc(sp.name)}</b>.`:""}</div>
      ${m.save?`<div class="tbig"><span class="num">DD ${D.cast.dc}</span><span class="muted">JS de ${esc(m.save)}</span></div>`:""}
      ${T.castTemp?`<div class="muted">PV temporaires : ${T.castTemp.v}${T.castTemp.b0>=T.castTemp.v?" (tu en avais déjà autant ou plus)":""}</div>`:""}
      ${m.attack||ex?`<div class="row qchains">${m.attack?btn("hit","Toucher",sg(D.cast.atk)):""}${ex?btn("dmg",m.heal?"Soins":"Dégâts",ex):""}</div>`:""}</div>`); }
  if(q.r==="hit") return wrap(esc(i.name)+" · Toucher",`<div class="qres"><div class="qmode label">${ML[q.mode]}</div>
    ${phys?`<div class="row tin"><label class="field"><span>${q.mode==="n"?"Ton d20":"1er d20"}</span><input id="t-d1" type="number" inputmode="numeric" min="1" max="20" value="${esc(T.d1)}" data-tin="d1"></label>${q.mode!=="n"?`<label class="field"><span>2e d20</span><input id="t-d2" type="number" inputmode="numeric" min="1" max="20" value="${esc(T.d2)}" data-tin="d2"></label>`:""}</div>`:""}
    <div class="ttotal qtot" id="t-tot" data-mod="${q.mod}" data-label="${esc(q.label)}">${totalHtml(q.mod)}</div></div>`);
  return wrap(esc(i.name)+" · "+(q.heal?"Soins":"Dégâts"),`<div class="qres"><div class="qmode label">${q.crit?"Critique : dés doublés":"Normal"}${q.beams>1?` · un rayon sur ${q.beams}`:""}</div>
    ${phys?(()=>{ const rg=diceRange(q.dice); return `<div class="row tin"><label class="field"><span>Total de tes ${esc(q.dice)}${rg?` (${rg[0]} à ${rg[1]})`:""}</span><input id="t-dmg" type="number" min="${rg?rg[0]:0}"${rg?` max="${rg[1]}"`:""} step="1" inputmode="numeric" value="${esc(T.dmg)}" data-tin="dmg"></label></div>`; })():""}
    ${!phys&&T.dmgBd?`<div class="qbd muted">${esc(T.dmgBd)}</div>`:""}
    <div class="ttotal qtot" id="t-dtot" data-flat="${q.flat}">${damageTotalHtml(T.dmg,q.flat)}</div></div>`); }
/* Plage d'un total de dés (2d8 : 2 à 16 ; 1d8+1d6 : 2 à 14) ; les nombres fixes ne comptent pas */
function diceRange(expr){ let lo=0,hi=0; for(const m of String(expr||"").matchAll(/(\d*)d(\d+)/gi)){ const n=+m[1]||1, f=+m[2]; lo+=n; hi+=n*f; } return hi?[lo,hi]:null; }
function dmgInRange(v){ const inp=document.getElementById("t-dmg"); if(!inp||inp.max==="") return true; return +v>=+inp.min&&+v<=+inp.max; }
function selName(){ const i=(S.Titems||[]).find(x=>x.key===S.T.sel); return i?i.name:"Jet"; }
// Un jet physique déjà journalisé (même carte, mêmes dés) ne l'est pas une seconde fois ; une nouvelle saisie efface la marque.
function physLogged(phys,sig){ const T=S.T; if(!phys) return false; if(T.logSig===sig) return true; T.logSig=sig; return false; }
function logD20(phys){ if(phys&&virtualDiceEnabled()) return; const T=S.T, tt=document.getElementById("t-tot"); if(!tt) return; const mod=+tt.dataset.mod, a=parseInt(T.d1), b=parseInt(T.d2); if(!validDie(T.d1,20)||(T.mode!=="n"&&!validDie(T.d2,20))) return;
  if(physLogged(phys,["d20",S.cur,T.sel,T.mode,T.d1,T.mode==="n"?"":T.d2].join("|"))) return;
  const d=T.mode==="n"?a:(T.mode==="a"?Math.max(a,b):Math.min(a,b));
  addLog({label:tt.dataset.label||selName(),total:d+mod,bd:(T.mode==="n"?"d20 "+a:(T.mode==="a"?"avantage ":"désavantage ")+a+" / "+b)+" "+sg(mod)+(phys?" · dés physiques":""),crit:d===20,fumble:d===1,quiet:true}); return true; }
function logDmg(phys){ if(phys&&virtualDiceEnabled()) return; const T=S.T, dt=document.getElementById("t-dtot"); if(!validDiceTotal(T.dmg)||(phys&&!dmgInRange(T.dmg))) return; const f=dt?+dt.dataset.flat:0;
  if(physLogged(phys,["dmg",S.cur,T.sel,T.dmg].join("|"))) return;
  const sit=(S.Titems||[]).find(x=>x.key===T.sel); const isHeal=(sit&&sit.kind==="spell"&&sit.m&&sit.m.heal)||(T.poolKey&&T.poolKey===T.sel);
  addLog({label:selName()+(isHeal?" · soins":" · dégâts"),total:(+T.dmg)+f,bd:(T.dmgBd||"dés "+T.dmg)+(f?" "+sg(f):"")+(phys?" · dés physiques":""),quiet:true}); return true; }
function totalHtml(mod){
  const T=S.T, a=parseInt(T.d1), b=parseInt(T.d2);
  if(isNaN(a)) return `<span class="muted">${virtualDiceEnabled()?"Lance le dé pour le total":"Saisis ton dé pour le total"}</span>`;
  let d=a;
  if(T.mode!=="n"){ if(isNaN(b)) return `<span class="muted">Saisis le 2e dé</span>`; d=T.mode==="a"?Math.max(a,b):Math.min(a,b); }
  const nat = d===20?` <span class="badge srd">20 naturel</span>`:(d===1?` <span class="badge perso">1 naturel</span>`:"");
  if(!validDie(T.d1,20)||(T.mode!=="n"&&!validDie(T.d2,20))) return `<span class="muted">Chaque d20 doit être un entier de 1 à 20</span>`;
  return `<span class="tcalculation">${T.mode==="n"?"Dé : "+a:(T.mode==="a"?"Avantage":"Désavantage")+" : "+a+" et "+b+" → "+d+" retenu"}<br>Bonus : ${sg(mod)}<br>Total : <b class="num tot">${d+mod}</b>${nat}</span>`;
}
function tSelect(key){
  const T=S.T; T.pop="card"; T.sel=key; T.logSig=""; T.itemN=1; T.itemSp=0; T.smiteBd=""; T.d1=""; T.d2=""; T.dmg=""; T.dmgBd=""; T.slot=null; T.castDone=null; T.itemUseReceipt=null;
  const i=S.Titems.find(x=>x.key===key);
  if(i&&i.costs&&T.eco&&i.use&&i.use.spells){ const k=i.use.spells.findIndex(z=>(costOfSpell(z.sp)||"action")===T.eco); if(k>=0) T.itemSp=k; }
  if(i){ const adv=condAdvice(cur(),i.kind==="atk"?"atk":i.kind,i.ab); T.mode = adv.mode&&adv.mode!=="f"?adv.mode:"n";
    T.recent=[key,...T.recent.filter(k=>k!==key)].slice(0,6); }
  render();
}
function validDie(value,max){ return value!==""&&Number.isInteger(+value)&&+value>=1&&+value<=max; }
function validDiceTotal(value){ return value!==""&&Number.isSafeInteger(+value)&&+value>=0; }
function damageTotalHtml(value,flat){
  return `<span class="tcalculation">${validDiceTotal(value)?"Dés : "+esc(value)+"<br>":""}Bonus : ${sg(flat)}<br>Total : ${validDiceTotal(value)?`<b class="num">${+value+flat}</b>`:virtualDiceEnabled()?"lance les dés":"saisis le total de tes dés"}</span>`;
}
function expressionBonus(expr){
  return (String(expr).replace(/\s/g,"").match(/[+-]?[^+-]+/g)||[]).reduce((n,p)=>n+(/d/i.test(p)?0:Number(p)),0);
}
function chargeRecoveryForms(ch){
  return (ch.bag||[]).filter(b=>b.charges?.pendingRecovery).map(b=>`<form class="row tin" data-form="chargeRecovery" data-id="${esc(b.id)}"><label class="field"><span>${esc(b.name)} · récupération ${esc(b.charges.rec)} : total des dés physiques</span><input name="total" type="number" min="0" step="1" inputmode="numeric" required></label><span>Bonus : ${sg(expressionBonus(b.charges.rec))}</span><button class="btn" type="submit">Appliquer</button><button class="btn" type="button" data-virtual data-act="chargeRecoveryRoll" data-id="${esc(b.id)}">Lancer virtuellement</button></form>`).join("");
}
function applyChargeRecovery(ch,id,total,virtual=false){
  if(!virtual&&virtualDiceEnabled()) return;
  const b=(ch.bag||[]).find(b=>b.id===id), c=b?.charges; if(!c?.pendingRecovery) return;
  const flat=virtual?0:expressionBonus(c.rec), before=+c.used||0;
  b.charges=Object.assign({},c,{used:Math.max(0,before-Math.max(0,total+flat))}); delete b.charges.pendingRecovery;
  addLog({label:b.name+" · charges récupérées",total:before-b.charges.used,bd:virtual?"Dés virtuels":"Dés physiques : "+total+" · Bonus : "+sg(flat)+" · Total : "+(total+flat),quiet:true}); touch(S.cur);
}

/* Pavé de saisie des dés physiques, commun aux deux modes de dés. */
const DICE_INPUTS='input[data-tin],#cc-d1,#cc-d2,#t-hd,#t-death,input[data-w^="dice."],input[data-lu="roll"],[data-form="smitePhysical"] input[name="total"],[data-form="chargeRecovery"] input[name="total"],[data-form="free"] input[name="physical"]';
/* Dés physiques (décision d'Angle, 12 nov. 2026) : plus de pavé à l'écran. Les cases de dés sont des champs numériques
   (clavier numérique sur iPhone / iPad, clavier normal sur ordinateur) ; une valeur hors limites affiche un message et n'est pas enregistrée. */
function diceFieldError(inp){ const v=String(inp.value||"").trim(); if(v==="") return ""; const n=Number(v), min=inp.min===""?0:Number(inp.min), max=inp.max===""?Infinity:Number(inp.max);
  return (!Number.isSafeInteger(n)||n<min||n>max)?(max===Infinity?`Saisis un entier à partir de ${min}.`:`Saisis un entier de ${min} à ${max}.`):""; }
function showDiceErr(inp,msg){ const host=inp.closest("label")||inp; let el=host.nextElementSibling; if(!(el&&el.classList.contains("dicerr"))){ if(!msg) return; el=document.createElement("div"); el.className="dicerr warntxt"; el.setAttribute("role","alert"); host.after(el); } if(msg) el.textContent=msg; else el.remove(); }
function syncDiceInputMode(){
  const virtual=virtualDiceEnabled();
  document.querySelectorAll(DICE_INPUTS).forEach(input=>{
    if(input.dataset.w?.startsWith('dice.')){ input.readOnly=virtual||!!S.W?.rolled; return; }
    input.dataset.physical='';
    const label=input.closest('label'); if(label) label.dataset.physical='';
    input.disabled=virtual||!!input.closest("[data-full]");
  });
  document.querySelectorAll('[data-form="cc"],[data-form="hdroll"],[data-form="death"],[data-form="chargeRecovery"],[data-form="free"]').forEach(form=>{
    form.querySelectorAll('button[type="submit"]:not([data-virtual])').forEach(button=>{ button.dataset.physical=''; button.disabled=virtual||form.hasAttribute("data-full"); });
  });
  document.querySelectorAll('[data-form="smitePhysical"]').forEach(form=>{ form.dataset.physical=''; });
}

const TURN_COSTS=["action","bonus","reaction"];
const TURN_DONE={action:"Action consommée",bonus:"Action bonus consommée",reaction:"Réaction consommée",move:"Mouvement terminé",autre:"Autre terminé"};
function tableSelected(){ return (S.Titems||[]).find(i=>i.key===S.T?.sel); }
function tableCardCost(i=tableSelected()){
  if(!i) return null;
  if(i.kind==="bagitem"&&i.use?.spells){ const spells=i.use.spells; return costOfSpell(spells[Math.min(spells.length-1,+S.T.itemSp||0)].sp); }
  return i.cost;
}
function consumeTableCost(cost=tableCardCost()){
  if(!TURN_COSTS.includes(cost)) return;
  const ch=cur(); ch.turn=ch.turn||{};
  if(!ch.turn[cost]){ ch.turn[cost]=true; touch(S.cur); }
}
function tableActionFeedback(ch,i){
  const cost=tableCardCost(i); if(!TURN_COSTS.includes(cost)) return "";
  if(ch.turn?.[cost]) return `<div class="taction-feedback" role="status"><b>✓ ${TURN_DONE[cost]}${cost==="reaction"?"":" pour ce tour"}</b><button class="btn small ghost" data-act="tuse" data-v="${cost}" data-off="1">Annuler la consommation</button><span class="muted">Annule uniquement le suivi du tour ; les résultats et les ressources dépensées sont conservés.</span></div>`;
  const manual=!["atk","spell","bagitem"].includes(i.kind)&&!i.res?.pool;
  return manual?`<div class="tuse"><button class="btn primary" data-act="tuse" data-v="${cost}">${({action:"Utiliser l’action",bonus:"Utiliser l’action bonus",reaction:"Utiliser la réaction"})[cost]}</button></div>`:"";
}
function tableItemReceipt(){ return S.cur+":"+S.T.sel+":"+(S.T.itemSp||0)+":"+(S.T.itemN||1); }
function ensureTableRollUse(){
  const i=tableSelected();
  if(i?.kind==="spell") return performTableCast({ref:i.ref,k:i.key,l:String(i.sp.level===0?0:S.T.castLvl||i.sp.level)});
  if(i?.kind==="bagitem"&&i.use){
    if(S.T.itemUseReceipt===tableItemReceipt()) return true;
    const button=document.querySelector('.tcard [data-act="itemUse"]');
    return !!button&&performTableItemUse(button.dataset);
  }
  return true;
}
function tableRollCommitted(kind){
  const i=tableSelected();
  // Weapon damage never changes turn tracking, even after an explicit undo.
  if(i?.kind==="atk"&&kind!=="d20") return;
  if(i?.kind==="atk"){ consumeTableCost(); ammoSpend(cur(),i); }
}
/* Munitions (lot T4, demande d'Angle) : une arme à munitions est reliée au consommable du même type (Flèches, Carreaux, Billes, Balles).
   Chaque jet d'attaque en retire une ; « Fin du combat » rend la moitié des munitions tirées depuis (arrondi à l'inférieur). */
function ammoType(i){ const w=i&&i.wref&&i.wref.startsWith("srd:")?S.idx.weapons?.[i.wref.slice(4)]:null; const m=w&&String(w.properties||"").match(/Munitions \([^;)]*;\s*([^)]+)\)/i); return m?m[1].trim():""; }
/* Chantier Compteurs (12 nov. 2026) : les munitions se comptent sur l'objet du sac (Flèches ×20) ; un ancien compteur de munitions reste prioritaire. */
function ammoCounter(ch,type){ const k=norm(type).slice(0,5); return k?(ch.counters||[]).find(c=>norm(c.name||"").startsWith(k)):null; }
function ammoItem(ch,type){ const k=norm(type).slice(0,5); return k?(ch.bag||[]).find(b=>norm(b.name||"").startsWith(k)):null; }
function ammoSpend(ch,i){ if(!ch) return; const type=ammoType(i), c=ammoCounter(ch,type)||ammoItem(ch,type); if(!c) return; const isC=c.max!==undefined&&(ch.counters||[]).includes(c), f=isC?"cur":"qty";
  if((+c[f]||0)<=0){ addLog({label:"Plus de "+String(c.name).toLowerCase(),total:"0",bd:(isC?"Ton consommable « ":"Ton objet « ")+c.name+" » est vide.",kind:"info"}); return; }
  c[f]=(+c[f]||0)-1; c.spent=(+c.spent||0)+1; touch(S.cur); }
function ammoBlock(ch,i){ const type=ammoType(i); if(!type) return ""; const c=ammoCounter(ch,type), T=type.charAt(0).toUpperCase()+type.slice(1);
  if(!c){ const b=ammoItem(ch,type);
    if(!b) return `<div class="tnotes tammo" style="margin-top:6px">Cette arme tire des ${esc(type)}, mais ton sac n'en contient pas. <button class="btn small" data-act="ammoNew" data-v="${esc(T)}">Ajouter 20 ${esc(type)} au sac</button></div>`;
    const q=+b.qty||0, back=Math.floor((+b.spent||0)/2);
    return `<div class="tnotes tammo" style="margin-top:6px"><div class="row" style="gap:8px;align-items:center;flex-wrap:wrap"><b>${esc(b.name)}</b><span class="hpstep"><button class="btn stepb" data-act="bagq" data-id="${esc(b.id)}" data-v="-1" aria-label="Retirer 1" ${q<=0?"disabled":""}>−</button><b class="num">${q}</b><button class="btn stepb" data-act="bagq" data-id="${esc(b.id)}" data-v="1" aria-label="Ajouter 1">+</button></span></div>
    <div class="muted" style="font-size:var(--fs-sm);margin-top:4px">Chaque jet d'attaque en retire une de ton sac. Après le combat, en passant une minute à chercher, tu récupères la moitié de ce que tu as tiré. Pour les voir en permanence, pose la tuile « ${esc(b.name)} » dans un bloc (crayon).</div>
    ${+b.spent?`<button class="btn small" style="margin-top:6px" data-act="ammoEnd" data-obj="${esc(b.id)}">Fin du combat : récupérer ${back} sur ${+b.spent}</button>`:""}</div>`; }
  const back=Math.floor((+c.spent||0)/2);
  return `<div class="tnotes tammo" style="margin-top:6px"><div class="row" style="gap:8px;align-items:center;flex-wrap:wrap"><b>${esc(c.name)}</b><span class="hpstep"><button class="btn stepb" data-act="cnt" data-id="${esc(c.id)}" data-v="-1" aria-label="Retirer 1" ${(+c.cur||0)<=0?"disabled":""}>−</button><b class="num">${+c.cur||0} / ${+c.max||0}</b><button class="btn stepb" data-act="cnt" data-id="${esc(c.id)}" data-v="1" aria-label="Ajouter 1">+</button></span></div>
    <div class="muted" style="font-size:var(--fs-sm);margin-top:4px">Chaque jet d'attaque en retire une. Après le combat, en passant une minute à chercher, tu récupères la moitié de ce que tu as tiré.</div>
    ${+c.spent?`<button class="btn small" style="margin-top:6px" data-act="ammoEnd" data-id="${esc(c.id)}">Fin du combat : récupérer ${back} sur ${+c.spent}</button>`:""}</div>`; }

function performTableCast(data){
  const ch=cur(), key=data.k||("spell:"+data.ref);
  if(S.T.castDone===key) return true;
 const D=derive(ch), sp=spellOf(data.ref), rit=data.rit==="1"; const sel=document.getElementById("t-slot"); const arc=+data.arc||0; const lvl=arc||(sp.level===0?0:+(sel?.value||data.l||sp.level)); S.T.castArc=0; S.T.castFree=null;
      const free=data.free||"";
      if(free){ const fr=(D.res||[]).find(r=>r.id===free); ch.resUsed=ch.resUsed||{}; if(!fr||+(ch.resUsed[free]||0)>=fr.max){ addLog({label:"Plus de lancer gratuit",total:"0",bd:"Il revient au repos long.",kind:"info"}); return false; } ch.resUsed[free]=(+ch.resUsed[free]||0)+1; S.T.castFree=free; }
      else if(arc){ ch.resUsed=ch.resUsed||{}; if(+(ch.resUsed["arc:"+arc]||0)>=1){ addLog({label:"Arcanum déjà utilisé",total:"0",bd:"Il revient au repos long.",kind:"info"}); return false; } ch.resUsed["arc:"+arc]=1; S.T.castArc=arc; }
      else if(sp.level>0&&!rit){
        if(D.cast.type==="pact"){ if((+ch.pactUsed||0)>=D.cast.pactSlots){ addLog({label:"Plus d'emplacement de pacte",total:"0",bd:"Un repos court les restaure.",kind:"info"}); return false; } ch.pactUsed=(+ch.pactUsed||0)+1; }
        else { ch.slotsUsed=ch.slotsUsed||{}; const n=D.cast.slots[lvl-1]||0; if((+ch.slotsUsed[lvl]||0)>=n){ addLog({label:"Plus d'emplacement de niveau "+lvl,total:"0",bd:"Choisis un autre niveau.",kind:"info"}); return false; } ch.slotsUsed[lvl]=(+ch.slotsUsed[lvl]||0)+1; }
      }
      if(sp.concentration){ if(ch.conc&&ch.conc!==sp.name) addLog({label:"Fin de concentration",total:"✕",bd:ch.conc+" prend fin : tu te concentres maintenant sur "+sp.name+".",kind:"info"}); ch.conc=sp.name; }
      const c=tableCardCost(); consumeTableCost(c);
      addLog({label:sp.name+(rit?" en rituel":" déclaré"),total:sp.level?"niv. "+(rit?sp.level:lvl):"mineur",bd:free?"Lancer gratuit utilisé (revient au repos long).":arc?"Arcanum mystique utilisé (revient au repos long).":(sp.level&&!rit?"Emplacement dépensé.":"Aucun emplacement dépensé."),kind:"info"});
      const th=+(sp.mech&&sp.mech.tempHp)||0; S.T.castTemp=null;
      if(th){ const v=th*Math.max(1,rit?sp.level:lvl); ch.hp=ch.hp||{cur:D.hpMax,temp:0}; const b0=+ch.hp.temp||0; S.T.castTemp={v,b0};
        if(v>b0){ ch.hp.temp=v; addLog({label:sp.name+" · PV temporaires",total:"+"+v,bd:b0?"remplacent tes "+b0+" PV temporaires (pas de cumul)":"",quiet:true}); } }
      S.T.castDone=data.k||("spell:"+data.ref); S.T.castLvl=rit?sp.level:lvl; S.T.castRit=rit; S.T.castConc=sp.concentration?sp.name:null;
      touch(S.cur); return true;
}

function performTableItemUse(data){
  const ch=cur();
  if(S.T.itemUseReceipt===tableItemReceipt()) return true;
 const b=(ch.bag||[]).find(x=>x.id===data.id); if(!b) return false; const n=+data.n||1, c0=itemCharges(ch,b);
      if(c0&&c0.max){ const c=Object.assign({},c0); if(c.max-(+c.used||0)<n) return false; c.used=(+c.used||0)+n; c.auto=false; b.charges=c; }
      else { b.qty=Math.max(0,(+b.qty||0)-1); }
      const cost=data.cost; consumeTableCost(cost);
      addLog({label:b.name,total:c0&&c0.max?(c0.max-(+c0.used||0)-n)+"/"+c0.max:"×"+b.qty,bd:c0&&c0.max?n+" charge"+(n>1?"s":"")+" dépensée"+(n>1?"s":"")+".":"Objet utilisé.",kind:"info",quiet:true});
      S.T.itemUseReceipt=tableItemReceipt(); touch(S.cur); return true;
}
/* ---------- Historique des jets : un jour à la fois, attaque et dégâts regroupés, « Voir plus » ---------- */
const HIST_PAGE=30, HIST_PAIR_MS=600000;
function histDayKey(t){ const d=new Date(t); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
// Lignes affichées pour un jour, de la plus récente à la plus ancienne ; i = indices dans ch.rollLog.
// Des dégâts (ou soins) qui suivent le jet pour toucher du même nom, le même jour et à moins de 10 minutes, forment une seule ligne.
function histRows(HL,day){
  const rows=[], used=new Set();
  for(let i=0;i<HL.length;i++){
    const e=HL[i]; if(used.has(i)||histDayKey(e.t)!==day) continue;
    const m=/^(.*) (?:·|—) (dégâts|soins)(?:\s|$)/.exec(e.label||""), h=HL[i+1];
    if(m&&h&&!used.has(i+1)&&h.label===m[1]+" — toucher"&&histDayKey(h.t)===day&&e.t>=h.t&&e.t-h.t<=HIST_PAIR_MS){
      used.add(i+1); rows.push({pair:true,name:m[1],kind:m[2],hit:h,dmg:e,i:[i,i+1]});
    } else rows.push({e,i:[i]});
  }
  return rows;
}
function histBody(ch){
  const HL=ch.rollLog||[];
  if(!HL.length) return `<div class="muted" style="font-size:var(--fs-sm)">Aucun jet pour l'instant. Les jets virtuels et les dés physiques que tu saisis apparaîtront ici.</div>`;
  const days=[], cnt={};
  for(const e of HL){ const k=histDayKey(e.t); if(!(k in cnt)){ cnt[k]=0; days.push(k); } cnt[k]++; }
  if(!S.hist||!days.includes(S.hist.day)) S.hist={day:days[0],n:HIST_PAGE};
  const H=S.hist, rows=histRows(HL,H.day), shown=rows.slice(0,H.n);
  const dayLabel=k=>new Date(k+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
  const hhmm=t=>new Date(t).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
  const del=r=>`<button class="btn small ghost thdel btndel" data-act="histDel" data-i="${r.i.join(",")}" aria-label="Supprimer cette ligne" title="Supprimer cette ligne">${ICON_TRASH}</button>`;
  const cf=e=>(e.crit?" crit":"")+(e.fumble?" fumble":"");
  const line=r=>{
    if(r.pair){ const {hit,dmg}=r, bd=[hit.bd?"toucher "+hit.bd:"",dmg.bd?r.kind+" "+dmg.bd:""].filter(Boolean).join(" · ");
      return `<div class="throw thpair"><span class="tht">${hhmm(hit.t)}</span><span class="thl"><b>${esc(r.name)}</b>${bd?`<small class="thbd">${esc(bd)}</small>`:""}</span><span class="thv thv2"><span class="thk">toucher</span> <b class="num thhit${cf(hit)}">${esc(String(hit.total??""))}</b> <span class="thk">${esc(r.kind)}</span> <b class="num">${esc(String(dmg.total??""))}</b></span>${del(r)}</div>`; }
    const e=r.e;
    return `<div class="throw${cf(e)}"><span class="tht">${hhmm(e.t)}</span><span class="thl"><b>${esc(e.label)}</b>${e.bd?`<small class="thbd">${esc(e.bd)}</small>`:""}</span><b class="num thv">${esc(String(e.total??""))}</b>${del(r)}</div>`;
  };
  const clear=S.histConfirm?`<span class="row" style="gap:6px"><span class="muted" style="font-size:var(--fs-sm)">Tout effacer ?</span><button class="btn small" data-act="clearLog" data-ok="1">Oui, effacer</button></span>`:`<button class="btn small ghost" data-act="clearLog">Effacer l'historique</button>`;
  return `<div class="thtop"><div class="row thdays">${days.map(k=>`<button class="chip" aria-pressed="${k===H.day}" data-act="histDay" data-v="${k}">${esc(dayLabel(k))} <span class="num">(${cnt[k]})</span></button>`).join("")}</div>${clear}</div>
    <div class="thist">${shown.map(line).join("")}</div>${rows.length>shown.length?`<button class="btn small ghost thmore" data-act="histMore">Voir plus (${rows.length-shown.length})</button>`:""}`;
}
