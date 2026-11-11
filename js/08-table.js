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
  const T=S.T, k=T.pop; if(!k){ S.lastPop=null; return ""; }
  const saves=AB.map(a=>`<button class="tabhead ${sgc(D.saves[a].val)}" data-act="tsel" data-k="save:${a}"><span>${D.saves[a].prof?`<span class="pdot p1" title="Maîtrise"></span>`:""}${ABN[a]}</span><b class="num">${sg(D.saves[a].val)}</b></button>`).join("");
  const anim=S.lastPop!==k; S.lastPop=k;
  const wrap=(title,inner,extra="")=>`<div class="tpopback${anim?"":" still"}" data-act="tpopclose"><div class="tpop${extra}" role="dialog" aria-modal="true" aria-label="${esc(title)}" data-act="noop"><div class="tpophead"><b>${esc(title)}</b><button class="btn small ghost" data-act="tpopclose" aria-label="Fermer">×</button></div><div class="tpopbody">${inner}</div></div></div>`;
  if(k.startsWith("tiles:c_")) return customPop(ch,D,k.slice(6),wrap);
  if(k==="blkadd") return wrap("Ajouter un bloc",`<div class="muted" style="font-size:var(--fs-sm);margin-bottom:10px">Choisis la taille du bloc (lignes × colonnes) ; tu y placeras ensuite les tuiles de ton choix.</div>${blkTemplates("blkCreate")}`);
  if(k.startsWith("blkfmt:")){ const b=customBlocks(ch).find(x=>x.id===k.slice(7)); if(!b){ T.pop=null; return ""; }
    return wrap("Changer de format : "+b.name,`<div class="muted" style="font-size:var(--fs-sm);margin-bottom:10px">Les tuiles qui tiennent gardent leur place ; les autres retournent dans la réserve.</div>${blkTemplates("blkFormat",b)}
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn small ghost" data-act="tpop" data-v="tiles:${b.id}">Retour</button></div>`); }
  if(k.startsWith("tiles:")){ const blk=k.slice(6), cat=TILE_CAT[blk]; if(!cat){ T.pop=null; return ""; }
    const arr=blockTiles(ch,blk), free=arr.indexOf(""), unused=Object.keys(cat).filter(x=>!arr.includes(x)&&tileAvailable(ch,blk,x)), sel=Number.isInteger(T.tileSlot)?T.tileSlot:-1;
    const face=id=>`<span class="tface">${tileFace(ch,D,blk,id)}</span><span class="tname">${esc(cat[id])}</span>`;
    const cells=arr.map((id,i)=>id?`<button class="tcell${sel===i?" on":""}" data-act="tileCell" data-blk="${blk}" data-i="${i}" data-tslot="${i}" data-tdrag="cell" aria-pressed="${sel===i}" aria-label="Case ${i+1} : ${esc(cat[id])}">${face(id)}</button>`
      :`<button class="tcell libre${sel===i?" on":""}" data-act="tileCell" data-blk="${blk}" data-i="${i}" data-tslot="${i}" aria-pressed="${sel===i}" aria-label="Case ${i+1} libre">+</button>`).join("");
    const res=unused.length?unused.map(x=>`<button class="tcell tmini" data-act="tileAdd" data-blk="${blk}" data-v="${x}" data-tdrag="res" aria-label="Placer : ${esc(cat[x])}">${face(x)}</button>`).join(""):`<span class="muted" style="font-size:var(--fs-sm)">Toutes les tuiles sont placées.</span>`;
    const selBar=sel>=0&&arr[sel]?`<div class="row" style="gap:8px;margin-top:8px;align-items:center"><span class="muted" style="font-size:var(--fs-sm)">Case ${sel+1} : ${esc(cat[arr[sel]])}</span><button class="btn small ghost" data-act="tileDel" data-blk="${blk}" data-i="${sel}">Retirer cette tuile</button></div>`:"";
    return wrap("Personnaliser : "+TBLK.find(b=>b[0]===blk)[1],`<div class="muted" style="font-size:var(--fs-sm);margin-bottom:10px">Glisse une tuile de la réserve vers une case, ou d’une case à l’autre. Glisse-la hors du bloc pour la retirer.</div>
      <div class="tpgrid" data-tblk="${blk}" style="grid-template-columns:repeat(${blk==="reperes"?4:2},minmax(0,1fr))">${cells}</div>${selBar}
      <div class="label" style="margin:14px 0 6px">Réserve${free<0&&unused.length?" (bloc plein : retire d’abord une tuile)":""}</div><div class="tres" data-tres="${blk}">${res}</div>
      <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn small ghost" data-act="tileReset" data-blk="${blk}">Tuiles par défaut</button></div>`); }
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
  if(k==="rest"){ const hdLeft=Math.max(0,D.L-(+ch.hdUsed||0)), cur0=+(ch.hp?.cur||0);
    const shortRes=D.res.filter(r=>r.recharge==="court"||r.recharge==="long_court1"||r.recharge==="court_partiel"||(r.recharge==="long_court5"&&D.L>=5)).map(r=>r.name);
    const kind=S.T.restKind||"";
    const pick=`<div class="adv" role="group" aria-label="Type de repos" style="margin-bottom:12px;grid-template-columns:repeat(2,1fr)"><button aria-pressed="${kind==="court"}" data-act="restKind" data-v="court">Repos court</button><button aria-pressed="${kind==="long"}" data-act="restKind" data-v="long">Repos long</button></div>`;
    if(!kind) return wrap("Repos",`<div class="restpick"><button class="restcard" data-act="restKind" data-v="court"><b>Repos court</b><span class="muted">1 heure au moins. Tu peux dépenser des dés de vie (${hdLeft} restant${hdLeft>1?"s":""}) ; ${D.cast&&D.cast.type==="pact"?"tes emplacements de pacte reviennent, ":""}ainsi que les ressources de repos court.</span></button><button class="restcard" data-act="restKind" data-v="long"><b>Repos long</b><span class="muted">8 heures au moins. Tout revient : PV, dés de vie, emplacements et ressources ; l'épuisement baisse d'un niveau.</span></button></div>`);
    if(kind==="long"){ const human=(()=>{ const sp=srd("species",ch.species); return !!(sp&&sp.traits.some(t=>t.name==="Ingénieux")); })();
      return wrap("Repos",pick+`<div class="row" style="gap:18px;align-items:flex-end"><div><div class="label">Points de vie</div><b class="num" style="font-size:var(--fs-2xl)">${cur0}</b><span class="muted num"> / ${D.hpBase}</span></div><div><div class="label">Dés de vie restants</div><b class="num" style="font-size:var(--fs-2xl)">${hdLeft}</b><span class="muted num"> / ${D.L}</span></div></div>
        <div class="lusec"><div class="label">À la fin du repos long</div><ul class="lul"><li>PV au maximum (${D.hpBase})${D.hpBonus?", bonus de PV max temporaire retiré":""}</li><li>Tous les dés de vie récupérés</li><li>${D.cast?"Tous les emplacements de sorts récupérés":"Ressources récupérées"}</li>${D.res.length?`<li>${D.res.map(r=>esc(r.name)).join(", ")}</li>`:""}${+ch.exhaustion?`<li>Épuisement : ${+ch.exhaustion} → ${+ch.exhaustion-1}</li>`:""}${human?"<li>Inspiration héroïque regagnée (Ingénieux)</li>":""}</ul></div>
        <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" data-act="restLong">Terminer le repos long</button></div>`); }
    return wrap("Repos",pick+`${cur0<=0?`<div class="tnotes" style="color:var(--blood)">Il faut au moins 1 PV pour commencer un repos court.</div>`:""}
      <div class="row" style="gap:18px;align-items:flex-end"><div><div class="label">Points de vie</div><b class="num" style="font-size:var(--fs-2xl)">${cur0}</b><span class="muted num"> / ${D.hpMax}</span></div>
      <div><div class="label">Dés de vie restants</div><b class="num" style="font-size:var(--fs-2xl)">${hdLeft}</b><span class="muted num"> / ${D.L} · d${D.hd} ${sg(D.mods.con)}</span></div></div>
      <div class="lusec"><div class="label">Dépenser un dé de vie</div>
        ${hdLeft>0&&cur0<D.hpMax?`<form class="row" data-form="hdroll" style="gap:8px"><label class="row" style="gap:6px">Ton d${D.hd}<input id="t-hd" type="number" inputmode="numeric" min="1" max="${D.hd}" style="width:70px;font-size:var(--fs-lg)"></label><button class="btn primary" type="submit">Appliquer</button><button class="btn" type="button" data-virtual data-act="hdvirt">Lancer virtuellement</button></form>
        <div class="muted" style="font-size:var(--fs-sm)">Chaque dé rend son résultat ${sg(D.mods.con)} PV (minimum 1). Tu peux en dépenser plusieurs, un par un.</div>`:`<div class="muted" style="font-size:var(--fs-sm)">${hdLeft<=0?"Plus de dé de vie : ils reviennent au repos long.":"Tes PV sont au maximum."}</div>`}
        ${S.T.hdLast?`<div class="tnotes">${esc(S.T.hdLast)}</div>`:""}</div>
      <div class="lusec"><div class="label">À la fin du repos</div><ul class="lul"><li>${D.cast&&D.cast.type==="pact"?"Emplacements de pacte récupérés":"Pas d'emplacement récupéré (repos long)"}</li>${shortRes.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></div>
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn primary" data-act="restShort" ${cur0<=0?"disabled":""}>Terminer le repos court</button></div>`); }
  if(k==="notes") return wrap("Notes de partie",`<textarea id="t-notes" data-bind="sessionNotes" placeholder="Nom d'un PNJ, un indice, une somme gagnée…" style="min-height:260px;width:100%">${esc(ch.sessionNotes||"")}</textarea><div class="muted" style="font-size:var(--fs-sm);margin-top:6px">Séparées des notes du personnage. Enregistrées au fil de la frappe.</div>`);
  if(k==="card"){ const c=tCard(ch,D); if(!c){ T.pop=null; return ""; } return wrap("Détails",c," wide"); }
  if(k==="hist") return wrap("Historique des jets", histBody(ch));
  if(k.startsWith("eco:")){ const e=k.slice(4); T.eco=e; const used=!!(ch.turn||{})[e];
    return `<div class="tpopback${anim?"":" still"}" data-act="tpopclose"><div class="tpop" role="dialog" aria-modal="true" aria-label="${ECO[e]}" data-act="noop"><div class="tpophead"><b>${ECO[e]}</b><span class="row" style="gap:6px"><button class="btn small" data-act="tturn" data-v="${e}">${used?"Annuler":e==="autre"?"Marquer Autre terminé":"Marquer comme consommée"}</button><button class="btn small ghost" data-act="tpopclose" aria-label="Fermer">×</button></span></div><div class="tpopbody">${used?`<div class="muted" style="font-size:var(--fs-sm);margin-bottom:8px">✓ ${TURN_DONE[e]}</div>`:""}${tEco(ch,D)}</div></div></div>`; }
  const B={skills:["Tests de caractéristique",`<div class="tabil">${AB.map(a=>`<div class="tabrow"><button class="tabhead ${sgc(D.mods[a])}" data-act="tsel" data-k="abil:${a}"><span>${ABN[a]}</span><b class="num">${sg(D.mods[a])}</b></button><div class="tabsk">${S.C.skills.filter(s=>s.ability===a).map(s=>`<button class="tskc ${sgc(D.skills[s.id].val)}" data-act="tsel" data-k="skill:${s.id}">${D.skills[s.id].lv?`<span class="pdot p${D.skills[s.id].lv}" title="${D.skills[s.id].lv>1?"Expertise":"Maîtrise"}"></span>`:""}${esc(s.name)} <b class="num">${sg(D.skills[s.id].val)}</b></button>`).join("")||`<span class="muted" style="font-size:var(--fs-sm)">Aucune compétence</span>`}</div></div>`).join("")}</div>${pLegend(true)}`],saves:["Jets de sauvegarde",`<div class="tsavegrid">${saves}</div>${pLegend(false)}`],cond:["États",`<div class="condgrid">${CONDS.map(c=>`<span class="condpick"><button class="chip" aria-pressed="${(ch.conditions||[]).includes(c)}" data-act="cond" data-v="${esc(c)}">${esc(c)}</button>${S.idx.cond[c]?`<span class="tinfo" role="button" data-act="tip" data-k="rule:${esc(S.idx.cond[c].id)}" aria-label="Règle : ${esc(c)}" title="Règle">i</span>`:""}</span>`).join("")}</div>
        <div class="row"><span class="label">Épuisement</span><span class="hpstep"><button class="btn small stepq" data-act="exh" data-v="-1" aria-label="Retirer un niveau">−</button><b class="num">${+ch.exhaustion||0}</b><button class="btn small stepq" data-act="exh" data-v="1" aria-label="Ajouter un niveau">+</button></span>${+ch.exhaustion?`<span class="muted" style="font-size:var(--fs-sm)">−${2*ch.exhaustion} aux tests d20, vitesse −${String(1.5*ch.exhaustion).replace(".",",")} m</span>`:""}</div>`],inv:["Inventaire",`${(ch.counters||[]).map(c=>`<div class="res"><b class="tipl" data-act="tip" data-k="cnt:${esc(c.id)}">${esc(c.name)}</b><div class="row">${(+c.max||0)<=20?pips("cnt:"+c.id,+c.max||0,(+c.max||0)-(+c.cur||0),true):""}<span class="muted num" style="font-size:var(--fs-sm)">${+c.cur||0}/${+c.max||0}</span></div></div>`).join("")}
        <div class="tbag">${(ch.bag||[]).map(b=>`<div class="tbagrow${(+b.qty||0)>0?"":" empty"}"><span>${itemName(b)}${b.note?` <span class="muted" style="font-size:var(--fs-sm)">· ${esc(b.note)}</span>`:""}${(b.ref||matchItem(b.name))?"":` <button class="btn small ghost infob mk" data-act="mkItem" data-id="${b.id}" title="Créer la fiche de cet objet dans Mes contenus">+ fiche</button>`}${chargePips(ch,b)}<button class="btn small ghost chgb" data-act="chgedit" data-id="${b.id}" title="${itemCharges(ch,b)?"Modifier le compteur":"Ajouter un compteur (charges, utilisations)"}">${itemCharges(ch,b)?"⚙":"+ compteur"}</button></span><span class="hpstep"><button class="btn small stepq" data-act="bagq" data-id="${b.id}" data-v="-1" aria-label="Utiliser un">−</button><b class="num">${+b.qty||0}</b><button class="btn small stepq" data-act="bagq" data-id="${b.id}" data-v="1" aria-label="Ajouter un">+</button>${S.bagDel===b.id?`<button class="btn small danger" data-act="bagrm" data-id="${b.id}">Supprimer</button>`:`<button class="btn small ghost btndel" data-act="bagdel" data-id="${b.id}" aria-label="Supprimer ${esc(b.name)}" title="Supprimer de l'inventaire">${ICON_TRASH}</button>`}</span></div>`).join("")||`<div class="muted" style="font-size:var(--fs-sm)">Le sac est vide.</div>`}</div>
        <form class="row" data-form="bag" style="margin-top:8px;gap:6px"><input id="bag-new" type="text" list="bag-dl" placeholder="Ajouter un objet" aria-label="Nouvel objet" style="flex:1;min-width:140px"><input id="bag-newq" type="number" min="1" value="1" aria-label="Quantité" style="width:60px"><button class="btn small" type="submit">Ajouter</button></form>
        <datalist id="bag-dl">${[...hbs("objet"),...S.C.items,...S.C.weapons,...S.C.armors].map(w=>`<option value="${esc(w.name)}">`).join("")}</datalist>
        <div class="row" style="gap:12px;margin-top:6px">${["pp","po","pe","pa","pc"].filter(k=>+ch.gold?.[k]).map(k=>`<span class="num"><b>${ch.gold[k]}</b> ${k}</span>`).join("")}</div>`]}[k];
  if(!B) return "";
  return `<div class="tpopback${anim?"":" still"}" data-act="tpopclose"><div class="tpop" role="dialog" aria-modal="true" aria-label="${B[0]}" data-act="noop"><div class="tpophead"><b>${B[0]}</b><button class="btn small ghost" data-act="tpopclose" aria-label="Fermer">×</button></div><div class="tpopbody">${B[1]}</div></div></div>`;
}
function viewTable(ch,D,banner=""){
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
  const statsBlk=`${tbHead("reperes","Repères")}<div class="rtiles" role="group" aria-label="Repères">${reperesTiles(ch,D,overviewSize)}</div>`;
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
      <div class="health-detail health-rest"><span class="label">Repos</span><button class="btn hprest" data-act="restOpen" data-v="" aria-label="Repos court ou long" title="Repos court ou repos long"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18M5 18v-5.5A2.5 2.5 0 0 1 7.5 10h9a2.5 2.5 0 0 1 2.5 2.5V18"/><path d="M7 10V7.5A1.5 1.5 0 0 1 8.5 6h2A1.5 1.5 0 0 1 12 7.5V10"/><path d="M16.5 3.5h3l-3 3h3"/></svg></button></div>
    </div>${slotsRow}
  <div class="health-footer"><span class="tconc${ch.conc?" on":""}"><button class="tconcb" data-act="${ch.conc?"ccopen":"tsel"}" data-k="conc" title="${ch.conc?"Faire un jet de sauvegarde de concentration":"Aucun sort de concentration en cours"}"><span class="label">Concentration</span><b>${ch.conc?esc(ch.conc):"—"}</b></button>${ch.conc?`<button class="btn small ghost" data-act="tconcEnd" aria-label="Fin de concentration" title="Mettre fin à la concentration">×</button>`:""}</span><button class="chip insp overview-inspiration" aria-pressed="${!!ch.inspiration}" data-act="insp" title="Toucher pour l'utiliser ou la regagner"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 21 7.5v9L12 22l-9-5.5v-9Z"/><path d="m12 2.5-5 12h10ZM3 7.5l4 7 5 7.5 5-7.5 4-7M7 14.5h10"/></svg><span>Inspiration héroïque${ch.inspiration?" ✓":""}</span></button></div></section></div>`;
  const turnPips=[["action","Action"],["bonus","Bonus"],["reaction","Réaction"],["move","Mouvement"]].map(([k,l])=>`<button class="tpip" aria-pressed="${!!turn[k]}" data-act="tturn" data-v="${k}">${l}</button>`).join("");
  const saves=AB.map(a=>`<button class="tabhead ${sgc(D.saves[a].val)}" data-act="tsel" data-k="save:${a}"><span>${D.saves[a].prof?`<span class="pdot p1" title="Maîtrise"></span>`:""}${ABN[a]}</span><b class="num">${sg(D.saves[a].val)}</b></button>`).join("");
  const TT=[["action","Action"],["bonus","Action bonus"],["reaction","Réaction"],["move","Mouvement"],["autre","Autre"]];
  const turnBtns=TT.map(([k,l])=>{ const used=!!turn[k], n=items.filter(i=>i.cost===k&&i.kind!=="basic"&&i.kind!=="rule").length;
    const label=used?"✓ "+TURN_DONE[k]:({action:"Actions",bonus:"Actions bonus",reaction:"Réactions"}[k]||l)+(n&&TURN_COSTS.includes(k)?" ("+n+")":"");
    return `<button class="tturnbtn${k==="autre"?" wide":""}" aria-pressed="${used}" data-act="${k==="move"?"tturn":"tpop"}" data-v="${k==="move"?"move":"eco:"+k}" title="${k==="move"?(used?"Annuler":"Marquer le mouvement terminé"):"Options disponibles"}"><span>${label}</span>${used&&k==="move"?`<span class="tused">Annuler</span>`:""}</button>`; }).join("");
  const ecoBtns=Object.entries(ECO).map(([k,l])=>`<button class="teco" aria-pressed="${T.eco===k}" data-act="teco" data-v="${k}">${l}<span class="muted num">${items.filter(i=>i.cost===k&&i.kind!=="basic"&&i.kind!=="rule").length}</span></button>`).join("");
  const recent=T.recent.map(k=>items.find(i=>i.key===k)).filter(Boolean).map(i=>`<button class="chip" data-act="tsel" data-k="${esc(i.key)}">${esc(i.name)}</button>`).join("");
  const blocks={
    perso:banner,
    reperes:statsBlk,
    pv:`${(+hp.cur||0)<=0?`<div class="tdeath"><div class="row" style="justify-content:space-between"><b>À 0 PV : jets contre la mort</b><span class="muted" style="font-size:var(--fs-sm)">10 ou plus : réussite · 1 : deux échecs · 20 : tu reviens à 1 PV</span></div>
        <div class="row" style="gap:16px"><span class="row" style="gap:6px"><span class="label">Réussites</span>${pips("death.s",3,ch.death?.s||0)}</span><span class="row" style="gap:6px"><span class="label">Échecs</span>${pips("death.f",3,ch.death?.f||0)}</span></div>
        ${(ch.death?.s||0)>=3?`<div><b>Stabilisé.</b> Tu restes inconscient à 0 PV, mais tu ne fais plus de jets.</div>`:(ch.death?.f||0)>=3?`<div style="color:var(--blood)"><b>Trois échecs : ton personnage meurt.</b></div>`:`<form class="row" data-form="death"><label class="field"><span>Ton d20</span><input id="t-death" type="number" inputmode="numeric" min="1" max="20" style="width:84px;font-size:var(--fs-lg)"></label><button class="btn primary" type="submit">Appliquer</button><button class="btn" type="button" data-virtual data-act="death">Lancer virtuellement</button></form>`}</div>`:""}${healthBlk}`,
    recherche:`<div class="tgrid tb-solo"><div class="tmain"><form data-form="tq" class="tsearch"><input id="tq" type="search" autocomplete="off" placeholder="Jet, action, sort…" value="${esc(T.q)}" aria-label="Recherche rapide"><button type="button" class="tqclear" data-act="tqclear" aria-label="Effacer la recherche" ${T.q?"":"hidden"}>×</button></form>
      <div id="tres">${tResults()}</div></div></div>`,
    tour:`<div class="tgrid tb-solo"><div class="tside table-turn">
      <div class="row" style="justify-content:space-between"><span class="label">Ce tour</span><button class="btn small" data-act="tnewturn">Nouveau tour</button></div>
      <div class="tturnb">${turnBtns}</div>
      <div class="muted" style="font-size:var(--fs-sm);margin-top:6px">Les options restent accessibles après consommation. Mouvement et Autre se terminent manuellement.</div></div></div>`,
    raccourcis:`<div class="tgrid tb-solo"><div class="tside table-reference">
      ${tbHead("raccourcis","Raccourcis")}
      <div class="tpanels">${raccourcisTiles(ch,D)}
      </div></div></div>`,
    notes:`<div class="tgrid tb-solo"><div class="tbottom">
      <div class="row" style="gap:8px"><button class="btn" data-act="tpop" data-v="notes">Notes de partie${(ch.sessionNotes||"").trim()?` <span class="muted num">(${(ch.sessionNotes||"").trim().split(/\n+/).length} l.)</span>`:""}</button>
      <button class="btn" data-act="tpop" data-v="hist">Historique des jets${(ch.rollLog||[]).length?` <span class="muted num">(${ch.rollLog.length})</span>`:""}</button>
      <button class="btn" data-act="virtualDice" role="switch" aria-checked="${virtualDiceEnabled()}">Dés virtuels : ${virtualDiceEnabled()?"activés":"désactivés"}</button></div>
      ${chargeRecoveryForms(ch)}</div></div>`
  };
  for(const b of customBlocks(ch)) blocks[b.id]=customBlockHtml(ch,D,b,{slots:otherSlots,size:overviewSize});
  return `${tPop(ch,D)}${tableBlocks(ch,blocks)}`;
}
/* Tuiles des blocs Repères (8 cases) et Raccourcis (6 cases) : choix enregistré par perso dans ch.layout.tiles ;
   une case libre affiche un « + » qui ouvre « Personnaliser ». Une valeur absente (DD sans sorts) laisse la case libre. */
const REPERES_DEFAUT=["ca","init","vitesse","dd","pp","maitrise","attaques","taille"];
const RACC_DEFAUT=["skills","saves","cond","inv","equip",""];
const TILE_CAT={
  reperes:{ca:"CA",init:"Initiative",vitesse:"Vitesse",dd:"DD des sorts",atks:"Attaque de sort",pp:"Perception passive",ip:"Intuition passive",ivp:"Investigation passive",maitrise:"Maîtrise",attaques:"Attaques par action",taille:"Taille",dv:"Dés de vie"},
  raccourcis:{skills:"Tests de caractéristique",saves:"Jets de sauvegarde",cond:"États",inv:"Inventaire",equip:"Équipement",rest:"Repos",hist:"Historique des jets",notes:"Notes de partie"}
};
function blockTiles(ch,blk){
  const def=blk==="reperes"?REPERES_DEFAUT:RACC_DEFAUT, cat=TILE_CAT[blk], saved=ch.layout?.tiles?.[blk];
  const arr=Array.isArray(saved)?saved.slice(0,def.length).map(x=>typeof x==="string"&&cat[x]?x:""):def.slice();
  while(arr.length<def.length) arr.push("");
  // Sans sorts, DD et attaque de sort n'ont pas de valeur : leur case est libre.
  if(blk==="reperes"&&!derive(ch).cast) return arr.map(x=>x==="dd"||x==="atks"?"":x);
  return arr;
}
const tileAvailable=(ch,blk,id)=>!(blk==="reperes"&&(id==="dd"||id==="atks")&&!derive(ch).cast);
function setBlockTiles(ch,blk,arr){ ch.layout=Object.assign({},ch.layout); ch.layout.tiles=Object.assign({},ch.layout.tiles,{[blk]:arr}); touch(S.cur); }
const plusTile=(blk,i,cls)=>`<button class="${cls}" data-act="tilePick" data-blk="${blk}" data-i="${i}" aria-label="Case libre : ajouter une tuile" title="Ajouter une tuile">+</button>`;
/* En-tête d'un bloc à tuiles : nom et petit crayon (toujours visible) qui ouvre la personnalisation du bloc. */
const PEN_SVG=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>`;
const tbHead=(blk,label)=>`<div class="tbhead"><span class="label">${esc(label)}</span><button class="tbpen" data-act="tpop" data-v="tiles:${blk}" aria-label="Personnaliser les tuiles : ${esc(label)}" title="Personnaliser les tuiles">${PEN_SVG}</button></div>`;
/* Visuel réduit d'une tuile (popup Personnaliser) : l'icône des Raccourcis ou la valeur des Repères. */
function tileFace(ch,D,blk,id){
  if(id==="slots") return `<svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="3"/><circle cx="12" cy="12" r="3"/><circle cx="18" cy="12" r="3"/></svg>`;
  if(TILE_CAT.raccourcis[id]){ const h=racTileMap(ch,D)[id]?.()||""; return (h.match(/<svg[\s\S]*?<\/svg>/)||[""])[0]; }
  const size=String(ch.size||(srd("species",ch.species)||hb(ch.species))?.size||"—");
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
    notes:()=>`<button class="tpbtn" data-act="tpop" data-v="notes"><svg class="tpi" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6M9 18h4"/></svg>Notes de partie<small class="tpsub">Pour cette séance</small></button>`,
  };
}
function raccourcisTiles(ch,D){ const R=racTileMap(ch,D); return blockTiles(ch,"raccourcis").map((id,i)=>id?R[id]():plusTile("raccourcis",i,"tpbtn tplus")).join(""); }
function repTileMap(ch,D,size){
  const t=(v,l,title)=>`<span class="rtile"${title?` title="${esc(title)}"`:""}><b class="num">${v}</b><span class="label">${l}</span></span>`;
  const T={
    ca:()=>t(D.ac,"CA",D.acNote||""),
    init:()=>`<button class="rtile act" data-act="tsel" data-k="init" title="Jet d'initiative"><b class="num">${sg(D.init)}</b><span class="label">Initiative</span></button>`,
    vitesse:()=>t(String(D.speed).replace(".",",")+" m","Vitesse"),
    dd:()=>D.cast?t(D.cast.dc,"DD des sorts","Degré de difficulté de tes sorts"):"",
    pp:()=>t(D.passive,"Perception passive","10 + ton modificateur de Perception"),
    maitrise:()=>t(sg(D.pb),"Maîtrise","Bonus de maîtrise"),
    attaques:()=>t(D.atkN,"Attaques par action"),
    taille:()=>t(esc(String(size).split(" (")[0]),"Taille",String(size)),
    atks:()=>D.cast?t(sg(D.cast.atk),"Attaque de sort"):"",
    ip:()=>t(10+D.skills.intuition.val,"Intuition passive","10 + ton modificateur d'Intuition"),
    ivp:()=>t(10+D.skills.investigation.val,"Investigation passive","10 + ton modificateur d'Investigation"),
    dv:()=>t(`${Math.max(0,D.L-(+ch.hdUsed||0))}/${D.L}`,"Dés de vie","Dés de vie restants (d"+D.hd+")")
  };
  return T;
}
function reperesTiles(ch,D,size){ const T=repTileMap(ch,D,size); return blockTiles(ch,"reperes").map((id,i)=>(id&&T[id]())||plusTile("reperes",i,"rtile vide")).join(""); }
/* Blocs personnalisés (étape 6) : ch.layout.custom = [{id,name,r,c,tiles:[{id,sz}]}] ; taille d'une tuile : "1" (1×1), "2" (2×2), "l" (ligne entière).
   Placement automatique dans l'ordre (les tuiles comblent les trous) ; les cases restantes affichent « + ». */
/* Modèles de blocs personnalisés : 8 cases au plus (décision d'Angle). */
const BLK_TPL=[1,2,3,4].flatMap(r=>[1,2,3,4].map(c=>[r,c])).filter(([r,c])=>r*c<=8);
const blkTemplates=(act,b)=>`<div class="ctpls">${BLK_TPL.map(([r,c])=>`<button class="ctpl${b&&b.r===r&&b.c===c?" on":""}" data-act="${act}"${b?` data-v="${b.id}"`:""} data-r="${r}" data-c="${c}" aria-label="Bloc de ${r} ligne${r>1?"s":""} et ${c} colonne${c>1?"s":""}"${b&&b.r===r&&b.c===c?' aria-current="true"':""}><span class="ctplg" style="grid-template-columns:repeat(${c},1fr)">${"<i></i>".repeat(r*c)}</span><small>${r}×${c}</small></button>`).join("")}</div>`;
/* Nouveau format : les tuiles qui tiennent à leur place sont gardées, dans l'ordre ; renvoie [tuiles gardées, noms retirés]. */
function cReformat(b,r,c){ const keep=[], out=[], nb={r,c}; for(const t of cGrid(b).tiles){ const [h,w]=tileSpan(t.sz,r,c), n=Object.assign({},t,{c:t.sz==="l"?0:t.c});
    if(n.r+h<=r&&n.c+w<=c&&!keep.some(k=>tilesHit(k,n,r,c))) keep.push(n); else out.push(t.id); } return [keep,out]; }
function customCat(){ return Object.assign({},TILE_CAT.reperes,TILE_CAT.raccourcis,{slots:"Emplacements de sorts"}); }
function customBlocks(ch){ return Array.isArray(ch.layout?.custom)?ch.layout.custom.filter(b=>b&&typeof b.id==="string"&&/^c_[a-z0-9]{4,20}$/.test(b.id)&&b.r>=1&&b.r<=4&&b.c>=1&&b.c<=4):[]; }
function customCopy(ch){ return customBlocks(ch).map(b=>Object.assign({},b,{tiles:(Array.isArray(b.tiles)?b.tiles:[]).map(t=>Object.assign({},t))})); }
function saveCustom(ch,list){ ch.layout=Object.assign({},ch.layout,{custom:list}); touch(S.cur); }
/* Position exacte des tuiles : {id,sz,r,c} (ligne et colonne de la case en haut à gauche). Taille : [hauteur, largeur] en cases. */
const tileSpan=(sz,R,C)=>sz==="l"?[1,C]:(sz==="2"&&R>=2&&C>=2?[2,2]:[1,1]);
const tilesHit=(a,b,R,C)=>{ const [ha,wa]=tileSpan(a.sz,R,C),[hb,wb]=tileSpan(b.sz,R,C); return a.r<b.r+hb&&b.r<a.r+ha&&a.c<b.c+wb&&b.c<a.c+wa; };
/* Tuiles posées d'un bloc : les positions enregistrées d'abord, puis (anciens blocs v128 ou position invalide) au premier trou, dans l'ordre ; une tuile sans place est écartée. */
function cGrid(b){ const R=b.r,C=b.c, out=[], seen=new Set();
  const fits=t=>{ const [h,w]=tileSpan(t.sz,R,C); return t.r>=0&&t.c>=0&&t.r+h<=R&&t.c+w<=C&&!out.some(o=>tilesHit(o,t,R,C)); };
  const src=(Array.isArray(b.tiles)?b.tiles:[]).filter(t=>t&&typeof t.id==="string"&&!seen.has(t.id)&&seen.add(t.id)).map(t=>({id:t.id,sz:["1","2","l"].includes(t.sz)?t.sz:"1",r:t.r,c:t.c}));
  src.forEach(t=>{ if(t.sz==="l") t.c=0; if(Number.isInteger(t.r)&&Number.isInteger(t.c)&&fits(t)){ out.push(t); t.ok=1; } });
  src.forEach(t=>{ if(t.ok) return; for(let r=0;r<R;r++) for(let c=0;c<C;c++){ const n={id:t.id,sz:t.sz,r,c}; if(fits(n)){ out.push(n); return; } } });
  const occ=Array.from({length:R},()=>Array(C).fill(-1));
  out.forEach((t,k)=>{ const [h,w]=tileSpan(t.sz,R,C); for(let i=t.r;i<t.r+h;i++) for(let j=t.c;j<t.c+w;j++) occ[i][j]=k; });
  return {tiles:out,occ}; }
/* Poser une tuile (src {i} déjà posée ou {id} venue de la réserve) sur la case {r,c} ; renvoie la nouvelle liste, ou null s'il n'y a pas la place.
   Une tuile de la réserve remplace ce qu'elle recouvre ; une tuile déplacée sur une autre l'échange si l'autre tient à son ancienne place. */
function cMove(b,src,dst){ const R=b.r,C=b.c, list=cGrid(b).tiles.map(t=>Object.assign({},t)); let t, old=null;
  if(src.id!==undefined){ if(list.some(x=>x.id===src.id)) return null; t={id:src.id,sz:"1"}; } else { t=list[src.i]; if(!t) return null; old={r:t.r,c:t.c}; list.splice(src.i,1); }
  const [h,w]=tileSpan(t.sz,R,C); t=Object.assign({},t,{r:Math.max(0,Math.min(dst.r,R-h)),c:t.sz==="l"?0:Math.max(0,Math.min(dst.c,C-w))});
  const conf=list.filter(x=>tilesHit(x,t,R,C));
  if(conf.length){
    if(!old) conf.forEach(x=>list.splice(list.indexOf(x),1));
    else if(conf.length===1){ const x=conf[0], [hx,wx]=tileSpan(x.sz,R,C), nx=Object.assign({},x,{r:Math.min(old.r,R-hx),c:x.sz==="l"?0:Math.min(old.c,C-wx)});
      if(tilesHit(nx,t,R,C)||list.some(y=>y!==x&&tilesHit(nx,y,R,C))) return null; Object.assign(x,nx); }
    else return null; }
  if(old) list.splice(src.i,0,t); else list.push(t); return list; }
function cResize(b,i,sz){ const R=b.r,C=b.c, list=cGrid(b).tiles.map(t=>Object.assign({},t)), t=list[i]; if(!t) return null;
  const [h,w]=tileSpan(sz,R,C), n=Object.assign({},t,{sz,r:Math.min(t.r,R-h),c:sz==="l"?0:Math.min(t.c,C-w)});
  if(list.some((y,k)=>k!==i&&tilesHit(n,y,R,C))) return null; list[i]=n; return list; }
function cUpdate(ch,id,fn){ const list=customCopy(ch), b=list.find(x=>x.id===id); if(!b) return false; const tiles=fn(b); if(!tiles) return false;
  b.tiles=tiles.map(t=>({id:t.id,sz:t.sz||"1",r:t.r,c:t.c})); saveCustom(ch,list); return true; }
const cellStyle=(t,R,C)=>{ const [h,w]=tileSpan(t.sz,R,C); return `grid-row:${t.r+1}/span ${h};grid-column:${t.c+1}/span ${w}`; };
function customBlockHtml(ch,D,b,ctx){
  const Rm=racTileMap(ch,D), T=repTileMap(ch,D,ctx.size), {tiles,occ}=cGrid(b);
  const one=t=>{ const h=t.id==="slots"?`<div class="rtile rslots">${ctx.slots||`<span class="muted">Pas d’emplacements</span>`}<span class="label">Emplacements</span></div>`:((T[t.id]&&T[t.id]())||(Rm[t.id]&&Rm[t.id]())||"");
    return h?`<div class="ccell" style="${cellStyle(t,b.r,b.c)}">${h}</div>`:""; };
  let html=tiles.map(one).join("");
  occ.forEach((row,r)=>row.forEach((k,c)=>{ if(k<0) html+=`<div class="ccell" style="grid-row:${r+1};grid-column:${c+1}">${plusTile(b.id,r*b.c+c,"rtile vide")}</div>`; }));
  return `${tbHead(b.id,b.name)}<div class="cgrid" style="grid-template-columns:repeat(${b.c},minmax(0,1fr));grid-template-rows:repeat(${b.r},minmax(68px,auto))">${html}</div>`;
}
function customPop(ch,D,id,wrap){
  const b=customBlocks(ch).find(x=>x.id===id); if(!b){ S.T.pop=null; return ""; }
  const cat=customCat(), {tiles,occ}=cGrid(b), R=b.r, C=b.c, selT=Number.isInteger(S.T.ctile)&&tiles[S.T.ctile]?S.T.ctile:-1, selC=Number.isInteger(S.T.tileSlot)?S.T.tileSlot:-1;
  const face=x=>`<span class="tface">${tileFace(ch,D,"",x)}</span><span class="tname">${esc(cat[x]||x)}</span>`;
  let cells=tiles.map((t,i)=>`<button class="tcell${selT===i?" on":""}" style="${cellStyle(t,R,C)}" data-act="ctileSel" data-v="${id}" data-i="${i}" data-tslot="" data-tdrag="ctile" data-cblk="${id}" aria-pressed="${selT===i}" aria-label="${esc(cat[t.id]||t.id)}">${face(t.id)}</button>`).join("");
  occ.forEach((row,r)=>row.forEach((k,c)=>{ const n=r*C+c; if(k<0) cells+=`<button class="tcell libre${selC===n?" on":""}" style="grid-row:${r+1};grid-column:${c+1}" data-act="ctileCell" data-v="${id}" data-cell="${n}" data-tslot="" aria-pressed="${selC===n}" aria-label="Case libre, ligne ${r+1}, colonne ${c+1}">+</button>`; }));
  const free=occ.flat().some(k=>k<0);
  const unused=Object.keys(cat).filter(x=>!tiles.some(t=>t.id===x)&&(x==="slots"?!!D.cast:tileAvailable(ch,"reperes",x)));
  const res=unused.length?unused.map(x=>`<button class="tcell tmini" data-act="ctileAdd" data-v="${id}" data-t="${x}" data-tdrag="cres" data-cblk="${id}" aria-label="Placer : ${esc(cat[x])}">${face(x)}</button>`).join(""):`<span class="muted" style="font-size:var(--fs-sm)">Toutes les tuiles sont placées.</span>`;
  const t=tiles[selT], sizes=t?[["1","1×1"],["2","2×2"],["l","Ligne"]].filter(([z])=>z!=="2"||(R>=2&&C>=2)).filter(([z])=>z!=="l"||C>1):[];
  const selBar=t?`<div class="row" style="gap:6px;margin-top:8px;align-items:center;flex-wrap:wrap"><span class="muted" style="font-size:var(--fs-sm)">${esc(cat[t.id]||t.id)} :</span>${sizes.map(([z,l])=>`<button class="chip" aria-pressed="${t.sz===z}" data-act="ctileSize" data-v="${id}" data-i="${selT}" data-z="${z}">${l}</button>`).join("")}<button class="btn small ghost" data-act="ctileDel" data-v="${id}" data-i="${selT}">Retirer cette tuile</button></div>`:"";
  const del=S.T.cdel===id?`<span class="row" style="gap:6px"><span>Supprimer ce bloc ?</span><button class="btn small danger" data-act="cblkDelYes" data-v="${id}">Supprimer</button><button class="btn small ghost" data-act="cblkDelNo">Annuler</button></span>`:`<button class="btn small ghost" data-act="cblkDel" data-v="${id}">Supprimer le bloc</button>`;
  return wrap("Personnaliser : "+b.name,`<label class="field"><span>Nom du bloc</span><input type="text" maxlength="40" data-cname="${id}" value="${esc(b.name)}"></label>
    <div class="muted" style="font-size:var(--fs-sm);margin:10px 0">Glisse une tuile de la réserve vers une case, ou d’une case à l’autre ; hors du bloc pour la retirer. Touche une tuile posée pour changer sa taille.</div>
    <div class="tpgrid" data-cgrid="${id}" data-r="${R}" data-c="${C}" style="grid-template-columns:repeat(${C},minmax(0,1fr));grid-template-rows:repeat(${R},minmax(60px,auto))">${cells}</div>${selBar}
    <div class="label" style="margin:14px 0 6px">Réserve${!free&&unused.length?" (bloc plein : retire d’abord une tuile)":""}</div><div class="tres" data-tres="${id}">${res}</div>
    <div class="row" style="justify-content:space-between;margin-top:14px;gap:8px;flex-wrap:wrap"><button class="btn small ghost" data-act="tpop" data-v="blkfmt:${id}">Changer de format (${R}×${C})</button>${del}</div>`);
}
/* Blocs d'« À la table » : ordre enregistré dans la fiche (ch.layout.order) ; un bloc vide n'est pas affiché. */
const TBLK=[["perso","Personnage"],["reperes","Repères"],["pv","Points de vie"],["recherche","Recherche"],["tour","Ce tour"],["raccourcis","Raccourcis"],["notes","Notes et historique"]];
function blkLabel(ch,id){ return (TBLK.find(b=>b[0]===id)||[])[1]||customBlocks(ch).find(b=>b.id===id)?.name||id; }
function tableOrder(ch){ const ids=[...TBLK.map(b=>b[0]),...customBlocks(ch).map(b=>b.id)]; const saved=Array.isArray(ch.layout?.order)?ch.layout.order.filter(id=>ids.includes(id)):[]; return [...new Set([...saved,...ids])]; }
function tableBlocks(ch,blocks){
  const ed=!!S.layoutEdit, ids=tableOrder(ch).filter(id=>ed||blocks[id]), label=id=>blkLabel(ch,id);
  if(!ed) return `<div class="tblocks">${ids.map(id=>`<section class="tblk" data-blk="${id}" aria-label="${esc(label(id))}">${blocks[id]}</section>`).join("")}</div>
    <div class="tlayoutbar"><button class="btn small ghost" data-act="layoutEdit">Modifier la disposition</button></div>`;
  // Mode disposition : poignée et flèches sur chaque bloc ; le contenu est inactif pour éviter toute action par erreur.
  return `<div class="tlayouttop" role="status"><span>Disposition : glisse un bloc par sa poignée ⋮⋮ ou utilise les flèches.</span><span class="row" style="gap:6px"><button class="btn small" data-act="tpop" data-v="blkadd">Ajouter un bloc</button><button class="btn small ghost" data-act="layoutReset">Ordre par défaut</button><button class="btn small primary" data-act="layoutDone">Terminé</button></span></div>
  <div class="tblocks editing">${ids.map((id,n)=>`<section class="tblk" data-blk="${id}" aria-label="${esc(label(id))}">
    <div class="tblkh"><span class="tblkgrip" data-blkgrip="${id}" role="button" aria-label="Déplacer le bloc ${esc(label(id))}" title="Glisser pour déplacer">⋮⋮</span><b>${esc(label(id))}</b>${TILE_CAT[id]||id.startsWith("c_")?`<button class="btn small" data-act="tpop" data-v="tiles:${id}">Personnaliser</button>`:""}
      <span class="row tblkmv"><button class="btn small ghost" data-act="blkMove" data-v="${id}" data-d="-1" aria-label="Monter le bloc ${esc(label(id))}" ${n?"":"disabled"}>↑</button><button class="btn small ghost" data-act="blkMove" data-v="${id}" data-d="1" aria-label="Descendre le bloc ${esc(label(id))}" ${n<ids.length-1?"":"disabled"}>↓</button></span></div>
    <div class="tblkc" inert>${blocks[id]||`<div class="muted" style="font-size:var(--fs-sm)">Vide pour ce personnage pour l’instant.</div>`}</div></section>`).join("")}</div>`;
}
function saveTableOrder(ch,order){ ch.layout=Object.assign({},ch.layout,{order}); touch(S.cur); }
function moveTableBlock(ch,id,d){ const o=tableOrder(ch), i=o.indexOf(id), j=i+d; if(i<0||j<0||j>=o.length) return; [o[i],o[j]]=[o[j],o[i]]; saveTableOrder(ch,o); }
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
/* Fenêtres PV temp. et PV max ± : même présentation ; l'icône clavier ouvre le pavé numérique (saisie directe, pratique au doigt). */
const KBD_SVG=`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6.5 14h11"/></svg>`;
function pvPop(wrap,o){ return wrap(o.title,`<div class="pvpop"><div class="label">${o.label}</div>
  <div class="pvline"><span class="hpstep"><button class="btn stepb" data-act="${o.act}" data-v="-1" aria-label="Retirer 1" ${o.minusOff?"disabled":""}>−</button><b class="num pvval">${o.val}</b><button class="btn stepb" data-act="${o.act}" data-v="1" aria-label="Ajouter 1">+</button></span>
  <button class="btn pvkbd" data-act="pvpad" aria-label="Saisir la valeur au pavé numérique" title="Saisir la valeur au pavé numérique">${KBD_SVG}</button><input type="number" hidden data-pvset="${o.kind}" min="${o.min}" max="999" aria-label="${esc(o.label)}"></div>
  ${o.info?`<div class="pvinfo">${o.info}</div>`:""}<div class="row pvquick">${o.quick}</div><div class="muted pvnote">${o.note}</div></div>`); }
function hpMaxAdd(ch,d){ const D=derive(ch); ch.hpMaxBonus=(+ch.hpMaxBonus||0)+d; if(D.hpBase+ch.hpMaxBonus<1) ch.hpMaxBonus=1-D.hpBase; const real=ch.hpMaxBonus-D.hpBonus; ch.hp=ch.hp||{cur:D.hpMax,temp:0}; const D2=derive(ch); ch.hp.cur=Math.max(0,Math.min(D2.hpMax,(+ch.hp.cur||0)+(real>0?real:0))); touch(S.cur); }
function tempStepper(ch){
  const t=+(ch.hp?.temp||0);
  if(S.tab==="table") return `<span class="table-temp"><span class="table-temp-value"><span class="label">PV temporaires</span><b class="num">${t}</b></span><span class="table-temp-actions"><button class="btn stepb" data-act="tmpstep" data-v="1" aria-label="Ajouter 1 PV temporaire">+</button><button class="btn stepb" data-act="tmpstep" data-v="-1" aria-label="Retirer 1 PV temporaire" ${t<=0?"disabled":""}>−</button></span></span>`;
  return `<span class="hpstep"><span class="label">PV temp.</span><button class="btn stepb" data-act="tmpstep" data-v="-1" aria-label="Retirer 1 PV temporaire" ${t<=0?"disabled":""}>−</button><b class="num" style="font-size:var(--fs-xl);min-width:1.5em;text-align:center">${t}</b><button class="btn stepb" data-act="tmpstep" data-v="1" aria-label="Ajouter 1 PV temporaire">+</button></span>`;
}
function tResults(){
  const T=S.T; if(!T||!T.q.trim()) return "";
  const r=searchItems(S.Titems||[],T.q);
  if(!r.length) return `<div class="muted" style="padding:6px 2px">Rien trouvé pour « ${esc(T.q)} ».</div>`;
  return `<div class="tlist">${r.map((i,n)=>tRow(i,n===0)).join("")}</div>`;
}
function tRow(i,first,inEco){
  const kv=(l,v)=>`<span class="tk"><span class="tkl">${l}</span><b class="num">${esc(v)}</b></span>`;
  let right="";
  if(i.kind==="atk") right=kv("Toucher",sg(i.mod))+kv("Dégâts",i.dmg);
  else if(i.kind==="spell"){
    if(i.roll) right+= i.roll.startsWith("DD") ? kv("DD",i.roll.slice(3)) : kv("Toucher",i.roll);
    if(i.dice){ const D=S.Tderived; const b=(i.sp.level===0&&i.m&&i.m.beams&&D)?1+(D.L>=5)+(D.L>=11)+(D.L>=17):1; right+=kv(i.heal?"Soins":"Dégâts",(b>1?b+" × ":"")+i.dice); }
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
      <div class="row tin"><label class="field"><span>Total de tes dés</span><input id="t-dmg" type="number" min="0" step="1" inputmode="numeric" value="${esc(T.dmg)}" data-tin="dmg"></label>
      <div class="ttotal" id="t-dtot" data-flat="${flat}">${damageTotalHtml(T.dmg,flat)}</div>
      <button class="btn small vroll" data-virtual data-act="tvdmg" data-e="${esc(dice)}"${r1} title="Lance ${esc(dice)} à ta place">Lancer ${esc(dice)}</button>
      ${crit?`<button class="btn small ghost vroll" data-virtual data-act="tvdmg" data-e="${esc(doubleDice(dice))}" data-crit="1" title="Lance ${esc(doubleDice(dice))} à ta place">Critique</button>`:""}</div>
      ${re1?`<div class="muted" style="font-size:var(--fs-sm)">Guérisseur : un dé de soins qui fait 1 est relancé une fois (automatique au lancer virtuel).</div>`:""}
      ${T.dmgBd?`<div class="muted num" style="font-size:var(--fs-sm)">${esc(T.dmgBd)}</div>`:""}</div>`;
  };
  let body="";
  const sec=(t,inner)=>inner?`<section class="tsec"><h3 class="tsech">${esc(t)}</h3>${inner}</section>`:"";
  const duo=(a,b)=>`<div class="tduo">${[a,b].filter(Boolean).map(([l,v,sub])=>`<div><div class="label">${esc(l)}</div><div class="tduov num">${esc(v)}</div>${sub?`<div class="muted" style="font-size:var(--fs-sm)">${esc(sub)}</div>`:""}</div>`).join("")}</div>`;
  const exhN=2*(+ch.exhaustion||0);
  if(["abil","save","skill","init"].includes(i.kind)){ body=d20(i.kind==="init"?"init":i.kind,i.mod,i.parts,i.ab,i.name);
    if(i.kind==="skill"){ const sk=S.C.skills.find(x=>"skill:"+x.id===i.key); const lv=D.skills[sk.id].lv;
      body+=`<div class="tskinfo"><div class="muted" style="font-size:var(--fs-sm)">${["Non maîtrisée","Maîtrisée","Expertise"][lv]}</div>${sk.examples?`<div class="prose" style="font-size:var(--fs-md)"><p><b>Exemples d'application.</b> ${esc(sk.examples)}</p></div>`:""}</div>`; } }
  else if(i.kind==="atk") body=sec("Toucher",d20("atk",i.mod,i.parts,null,i.name+" — toucher"))+sec("Dégâts",dmgBlock(i.dmg,i.dtype,"Dégâts",true))+smiteBlock(ch,D,i)+(()=>{ const w=i.wref; let ref=""; if(w.startsWith("srd:")) ref="item:arme:"+w.slice(4); else if(w.startsWith("hb:")) ref=w; const h=ref?itemTipHtml(ref).replace(/<div class="tiphead">[\s\S]*?<\/div>/,""):""; return h?`<details class="tdesc"><summary class="label">Description de l'arme</summary><div class="prose">${h}</div></details>`:""; })()+(i.mastery?`<div class="muted" style="font-size:var(--fs-sm);margin-top:6px">Botte d'arme : ${esc(i.mastery)}</div>`:"")+(i.held===false?`<div class="tnotes" style="margin-top:6px">Au fourreau : tu peux la dégainer gratuitement au moment de cette attaque (une arme par attaque).${i.bagId?` <button class="btn small" data-act="eqset" data-slot="mainP" data-id="${esc(i.bagId)}">Prendre en main</button>`:""}</div>`:"")+((i.pact?D.atkNpact:D.atkN)>1?`<div class="tnotes" style="margin-top:6px">L'action Attaque te permet d'attaquer <b>${i.pact?D.atkNpact:D.atkN} fois</b>${i.pact&&D.atkNpact>D.atkN?" avec ton arme de pacte (Lame assoiffée)":""}.</div>`:"");
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
function selName(){ const i=(S.Titems||[]).find(x=>x.key===S.T.sel); return i?i.name:"Jet"; }
// Un jet physique déjà journalisé (même carte, mêmes dés) ne l'est pas une seconde fois ; une nouvelle saisie efface la marque.
function physLogged(phys,sig){ const T=S.T; if(!phys) return false; if(T.logSig===sig) return true; T.logSig=sig; return false; }
function logD20(phys){ if(phys&&virtualDiceEnabled()) return; const T=S.T, tt=document.getElementById("t-tot"); if(!tt) return; const mod=+tt.dataset.mod, a=parseInt(T.d1), b=parseInt(T.d2); if(!validDie(T.d1,20)||(T.mode!=="n"&&!validDie(T.d2,20))) return;
  if(physLogged(phys,["d20",S.cur,T.sel,T.mode,T.d1,T.mode==="n"?"":T.d2].join("|"))) return;
  const d=T.mode==="n"?a:(T.mode==="a"?Math.max(a,b):Math.min(a,b));
  addLog({label:tt.dataset.label||selName(),total:d+mod,bd:(T.mode==="n"?"d20 "+a:(T.mode==="a"?"avantage ":"désavantage ")+a+" / "+b)+" "+sg(mod)+(phys?" · dés physiques":""),crit:d===20,fumble:d===1,quiet:true}); return true; }
function logDmg(phys){ if(phys&&virtualDiceEnabled()) return; const T=S.T, dt=document.getElementById("t-dtot"); if(!validDiceTotal(T.dmg)) return; const f=dt?+dt.dataset.flat:0;
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
const PAD_SUBMIT_FORMS=["cc","hdroll","death","chargeRecovery","smitePhysical","free"];
let dicePad=null;
function closeDicePad(restore=true){
  const target=dicePad?.target; dicePad=null;
  document.getElementById("dice-pad")?.remove();
  if(restore&&target?.isConnected) target.focus({preventScroll:true});
}
function openDicePad(target,force=false){
  if((!force&&virtualDiceEnabled())||target.disabled||target.readOnly) return;
  closeDicePad(false);
  const label=target.closest('label')?.textContent.trim()||target.getAttribute('aria-label')||'Résultat des dés';
  dicePad={target,value:target.value,fresh:true};
  const back=document.createElement('div'); back.id='dice-pad'; back.className='dice-pad-back';
  back.innerHTML=`<section class="dice-pad" role="dialog" aria-modal="true" aria-labelledby="dice-pad-title"><div class="row" style="justify-content:space-between"><b id="dice-pad-title">${esc(label)}</b><button class="btn small ghost" type="button" data-pad="cancel" aria-label="Fermer le pavé numérique">×</button></div><output id="dice-pad-value" aria-live="polite"></output><div id="dice-pad-error" role="status"></div><div class="dice-pad-keys">${['7','8','9','4','5','6','1','2','3',Number(target.min)<0?'neg':'clear','0','back'].map(k=>`<button type="button" class="btn" data-pad="${k}"${k==='back'?' aria-label="Effacer le dernier chiffre"':k==='neg'?' aria-label="Changer le signe"':''}>${k==='clear'?'Effacer':k==='back'?'⌫':k==='neg'?'±':k}</button>`).join('')}</div><div class="row dice-pad-actions"><button type="button" class="btn" data-pad="cancel">Annuler</button><button type="button" class="btn primary" data-pad="ok">Valider</button></div></section>`;
  document.body.appendChild(back); updateDicePad();
  back.querySelector('[data-pad="7"]').focus({preventScroll:true});
}
function updateDicePad(){
  document.getElementById('dice-pad-value').textContent=dicePad.value||'—';
  document.getElementById('dice-pad-error').textContent='';
}
function dicePadKey(key){
  if(!dicePad) return;
  const P=dicePad;
  if(key==='cancel'){ closeDicePad(); return; }
  if(key==='ok'){
    const target=P.target, value=Number(P.value), min=target.min===''?0:Number(target.min), max=target.max===''?Number.MAX_SAFE_INTEGER:Number(target.max);
    if(P.value===''||!Number.isSafeInteger(value)||value<min||value>max){
      document.getElementById('dice-pad-error').textContent=max===Number.MAX_SAFE_INTEGER?`Saisis un entier à partir de ${min}.`:`Saisis un entier de ${min} à ${max}.`; return;
    }
    closeDicePad(false);
    if(!target.isConnected) return;
    target.value=String(value);
    target.dispatchEvent(new Event('input',{bubbles:true}));
    target.dispatchEvent(new Event('change',{bubbles:true}));
    // Une seule validation : le Valider du pavé applique aussi la saisie dès que tous les dés du formulaire sont remplis.
    const form=target.isConnected&&target.closest('form[data-form]');
    if(form&&PAD_SUBMIT_FORMS.includes(form.dataset.form)&&[...form.querySelectorAll(DICE_INPUTS)].every(x=>x.value!=="")){
      form.requestSubmit(form.querySelector('button[type="submit"]:not([data-virtual])')||undefined); return; }
    if(target.isConnected) target.focus({preventScroll:true});
    return;
  }
  if(key==='clear') P.value='';
  else if(key==='neg') P.value=P.fresh?'-':(P.value.startsWith('-')?P.value.slice(1):'-'+P.value);
  else if(key==='back') P.value=P.value.slice(0,-1);
  else if(/^\d$/.test(key)) P.value=P.fresh?key:(P.value+key).slice(0,10);
  P.fresh=false; updateDicePad();
}

function syncDiceInputMode(){
  const virtual=virtualDiceEnabled();
  document.querySelectorAll(DICE_INPUTS).forEach(input=>{
    if(input.dataset.w?.startsWith('dice.')){ input.readOnly=virtual||!!S.W?.rolled; return; }
    input.dataset.physical='';
    const label=input.closest('label'); if(label) label.dataset.physical='';
    input.disabled=virtual;
  });
  document.querySelectorAll('[data-form="cc"],[data-form="hdroll"],[data-form="death"],[data-form="chargeRecovery"],[data-form="free"]').forEach(form=>{
    form.querySelectorAll('button[type="submit"]:not([data-virtual])').forEach(button=>{ button.dataset.physical=''; button.disabled=virtual; });
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
  if(i?.kind==="atk") consumeTableCost();
}

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
