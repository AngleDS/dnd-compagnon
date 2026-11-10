/* ---------- formulas & effects ---------- */
function evalF(expr, ctx){
  if(expr===undefined||expr===null||expr==="") return 0;
  if(typeof expr==="number") return expr;
  let s=String(expr).toLowerCase().replace(/niveau|niv/g,"("+ctx.level+")").replace(/\bmb\b|\bpb\b/g,"("+ctx.pb+")");
  for(const a of AB) s=s.replace(new RegExp("\\b"+a+"\\b","g"),"("+ctx.mods[a]+")");
  s=s.replace(/,/g,".");
  if(!/^[\d+\-*/(). <>=?:]+$/.test(s)||/=>|[^<>=!]=[^=]/.test(s)) return 0;
  try{ return Math.floor(Function("return ("+s+")")()); }catch(e){ return 0; }
}
function srdAuto(ref){
  const id=ref.slice(4), out=[];
  if(id==="vigilant") out.push({t:"bonus",cible:"init",val:"mb"});
  if(id==="defense") out.push({t:"bonus",cible:"ca_armure",val:"1"});
  if(id==="archerie") out.push({t:"bonus",cible:"attaque_dist",val:"2"});
  return out;
}
function collectSources(ch){
  // returns [{ref, name, kind, level, effects, text, origin}]
  const out=[], L=ch.level||1;
  const push=(ref,kind,origin,extra={})=>{
    const h=hb(ref);
    if(!h&&kind==="espece") return;
    if(h){ out.push(Object.assign({ref,kind,origin,name:h.name,text:h.text||"",effects:h.effects||[]},extra)); }
    else if(ref&&ref.startsWith("srd:")){
      const tbl={don:"feats",espece:"species",historique:"backgrounds"}[kind];
      const x=tbl?S.idx[tbl][ref.slice(4)]:null;
      if(x) out.push(Object.assign({ref,kind,origin,name:x.name,text:x.text,effects:srdAuto(ref)},extra));
    }
  };
  if(ch.species) push(ch.species,"espece","Espèce");
  if(ch.background) push(ch.background,"historique","Historique");
  for(const f of ch.feats||[]) push(f,"don","Don");
  for(const f of ch.features||[]) push(f,"aptitude","Aptitude");
  for(const x of ch.invocations||[]) if(invId(x)==="enseignement-des-premiers-nes"&&invCh(x)) push(invCh(x),"don","Enseignement des Premiers-Nés");
  const sub=hb(ch.subclass);
  if(sub){ for(const f of sub.features||[]) if((+f.level||1)<=L) out.push({ref:ch.subclass,kind:"sous-classe",origin:sub.name,name:f.name,level:+f.level||1,text:f.text||"",effects:f.effects||[]}); }
  for(const id of Object.values(ch.equip||{})){ const b=(ch.bag||[]).find(x=>x.id===id); const r=b&&(b.ref||matchItem(b.name)); const h=r&&r.startsWith("hb:")&&hb(r); if(h&&(h.effects||[]).length&&(!/harmonisation/i.test(h.text||"")||(ch.attuned||[]).includes(id))) out.push({ref:r,kind:"objet",origin:"Objet porté",name:h.name,text:h.text||"",effects:h.effects||[]}); }
  for(const it of ch.items||[]) if(it.equipped){ const h=hb(it.ref); if(h) out.push({ref:it.ref,kind:"objet",origin:"Objet",name:h.name,text:h.text||"",effects:h.effects||[]}); }
  return out;
}
 
/* ---------- manifestations : choix et répétables ---------- */
const invId = x => String(x||"").split("|")[0];
const invCh = x => String(x||"").split("|")[1]||"";
const INV_CHOICE={"decharge-dechirante":"dmg","decharge-repulsive":"atk","lance-occulte":"range","enseignement-des-premiers-nes":"feat"};
function rangeM(r){ const m=String(r||"").match(/(\d+(?:[.,]\d+)?)\s*m\b/); return m?parseFloat(m[1].replace(",",".")):0; }
function invChoices(ch,id,extra){
  const k=INV_CHOICE[id]; if(!k) return [];
  if(k==="feat") return [...S.C.feats.filter(f=>/origine/i.test(f.category||"")).map(f=>["srd:"+f.id,f.name]),...hbs("don").map(h=>["hb:"+h._id,h.name+hbTag(h)])];
  const refs=[...new Set([...(ch.spells||[]).map(x=>x.ref),...(extra||[])].filter(Boolean))];
  return refs.map(r=>[r,spellOf(r)]).filter(([r,sp])=>sp&&(+sp.level||0)===0).filter(([r,sp])=>{ const m=spellMech(sp);
    if(!m.dice||m.heal) return false; if(k==="atk") return !!m.attack; if(k==="range") return rangeM(sp.range)>=3; return true; }).map(([r,sp])=>[r,sp.name]);
}
function invTaken(list,id){ return (list||[]).filter(x=>invId(x)===id).map(invCh); }
function invLabel(x){ const iv=S.idx.invocations[invId(x)], c=invCh(x); let n=iv?iv.name:invId(x); if(c){ const cn=(spellOf(c)||hb(c)||srd("feats",c)||{}).name; if(cn) n+=" → "+cn; } return n; }
function invAvailFor(ch,lvl,extra){ const have=ch.invocations||[];
  return S.C.invocations.filter(i=>i.minLevel<=lvl&&(i.repeatable?(!INV_CHOICE[i.id]||invChoices(ch,i.id,extra).some(([v])=>!invTaken(have,i.id).includes(v))):!have.some(x=>invId(x)===i.id))); }
function invNotes(D,ref,sp){ const out=[]; for(const p of D.invPick||[]){ if(!p.c||p.c!==ref) continue;
  if(p.id==="decharge-repulsive") out.push("Décharge répulsive : quand ce sort touche une créature de taille G ou moins, tu peux la repousser de 3 m maximum en ligne droite.");
  if(p.id==="lance-occulte"){ const b=rangeM(sp.range); out.push(`Lance occulte : portée ${b+9*D.L} m (au lieu de ${b} m).`); }
  if(p.id==="decharge-dechirante") out.push("Décharge déchirante : ton modificateur de Charisme est déjà ajouté aux dégâts."); }
  return out; }
 
/* ---------- objets magiques : bonus et charges ---------- */
const GIANT={colline:21,collines:21,pierre:23,givre:23,feu:25,nuages:27,"nuage":27,"tempête":29,tempete:29};
function bagRefText(b){ const ref=b.ref||matchItem(b.name)||""; let m=null,h=null,text="";
  if(ref.startsWith("item:magique:")){ m=S.C.items.find(x=>x.kind==="magique"&&"item:magique:"+x.id===ref); text=m?m.text||"":""; }
  else if(ref.startsWith("hb:")){ h=hb(ref); text=h?h.text||"":""; }
  else if(ref.startsWith("item:")){ const p=ref.split(":"); const it=S.C.items.find(x=>x.id===p[2]); if(it) text=it.text||""; }
  return {ref,m,h,text}; }
function magicOf(ch){
  const out={eff:[],setAb:{},wpn:{},spellAtk:0,notes:[]};
  const eq=ch.equip||{}, att=ch.attuned||[];
  for(const b of ch.bag||[]){ if(!((+b.qty||0)>0)) continue;
    const {ref,m,text}=bagRefText(b); const slot=Object.keys(eq).find(k=>eq[k]===b.id);
    const needAtt=!!(m&&m.attune), active=!needAtt||att.includes(b.id);
    const plusM=String(b.name).match(/\+\s?([123])\b/); const plus=plusM?+plusM[1]:0;
    const src=b.name+(needAtt&&!active?" (non harmonisé)":"");
    // armes : bonus lié à l'objet (appliqué aux attaques reliées)
    const wt=text.match(/bonus de \+(\d) aux jets d.attaque et de dégâts effectués avec cette arme/i)||text.match(/combat magique (?:qui )?octro\w+ un bonus de \+(\d) aux jets d.attaque et de dégâts/i);
    const isWeapon=ref.startsWith("item:arme:")||!!wt;
    if(isWeapon&&active){ const n=Math.max(plus, wt?+wt[1]:0); if(n) out.wpn[b.id]=n; }
    // armure / bouclier +N portés
    if(plus&&(slot==="corps"||(slot==="mainS"&&/bouclier/i.test(b.name)))) out.eff.push({t:"bonus",cible:"ca",val:String(plus),_src:b.name});
    // baguette du mage de guerre +N tenue
    if(/mage de guerre/i.test(b.name)&&plus&&(slot==="mainP"||slot==="mainS")&&active) out.eff.push({t:"bonus",cible:"attaque_sort",val:String(plus),_src:b.name});
    if(!text||!active) continue;
    const worn=!!slot||/sur vous/i.test(text);
    if(!worn) continue;
    // CA
    const ca=text.match(/bonus de \+(\d) (?:à la CA|à la classe d.armure)/i);
    if(ca&&!/contre les jets d.attaque à distance/i.test(text)&&!isWeapon&&slot!=="corps"){
      if(/ni armure ni bouclier/i.test(text)){ const arm=ch.armor||""; if(!arm.startsWith("srd:")&&!ch.shield) out.eff.push({t:"bonus",cible:"ca",val:ca[1],_src:src}); else out.notes.push(b.name+" : sans effet avec une armure ou un bouclier"); }
      else if(!/bouclier/i.test(b.name)||slot==="mainS") out.eff.push({t:"bonus",cible:"ca",val:ca[1],_src:src}); }
    // sauvegardes
    const js=text.match(/\+(\d) (?:à la CA et |à la classe d.armure et |aux tests de caractéristique et )?aux jets de sauvegarde/i);
    if(js) out.eff.push({t:"bonus",cible:"jds:all",val:js[1],_src:src});
    // tests de caractéristique
    const tc=text.match(/\+(\d) aux tests de caractéristique/i);
    if(tc){ out.eff.push({t:"bonus",cible:"comp:all",val:tc[1],_src:src}); out.eff.push({t:"bonus",cible:"test:all",val:tc[1],_src:src}); }
    // caractéristique fixée
    const AN={force:"for",dextérité:"dex",constitution:"con",intelligence:"int",sagesse:"sag",charisme:"cha"};
    const fx=text.match(/(Force|Dextérité|Constitution|Intelligence|Sagesse|Charisme) (?:passe à|est de|devient de) (\d\d)/i);
    if(fx){ const a=AN[fx[1].toLowerCase()]; out.setAb[a]=Math.max(out.setAb[a]||0,+fx[2]); }
    if(/force de géant/i.test(b.name)&&/ceinturon|ceinture/i.test(b.name)){ const k=Object.keys(GIANT).find(g=>new RegExp("\\b"+g+"\\b","i").test(b.name)); if(k) out.setAb.for=Math.max(out.setAb.for||0,GIANT[k]); else out.notes.push(b.name+" : précise le type de géant dans le nom (colline, pierre, givre, feu, nuages, tempête)"); }
  }
  return out;
}
function chargesOf(b){ // détecte les charges d'un objet SRD
  const {text}=bagRefText(b); const nm=String(b.name).match(/\((\d+)\s*\/\s*(\d+)/);
  if(!text&&!nm) return null;
  const u=text.match(/(\d+) utilisations/i);
  const m=text.match(/(?:dispose(?:nt)? de|qui dispose de) (\d+) charges/i)||text.match(/(\d+) charges/i);
  if(!m&&(u||nm)){ const mx=nm?+nm[2]:+u[1]; return {max:mx,used:nm?Math.max(0,mx-+nm[1]):0,rec:"",when:"aucune",auto:true}; }
  if(!m) return null;
  const rg=text.match(/récupère(?:nt)? (?:quotidiennement )?(\d+d\d+(?: ?\+ ?\d+)?|\d+|toutes? (?:ses|leurs) charges)[^.]*?(?:à l.aube|quotidiennement)/i)||text.match(/récupère(?:nt)? (\d+d\d+(?: ?\+ ?\d+)?) charges/i);
  let rec=""; if(rg) rec=/toute/i.test(rg[1])?"full":rg[1].replace(/\s/g,"");
  return {max:+m[1],used:0,rec,when:"long",auto:true};
}
function itemCharges(ch,b){ if(b.charges===undefined){ if((ch.counters||[]).some(k=>norm(k.name||"")&&norm(b.name).startsWith(norm(k.name||"")))) return null; const c=chargesOf(b); if(c) return c; return null; } return b.charges; }
// utilisation d'un objet en jeu : coût, sort lancé, charges, prise en main
function itemSpells(t){
  const low=norm(t).replace(/\s+/g," "); const st0=String(t).search(/lancer|lance /i); if(st0<0) return [];
  let rest=String(t).slice(st0); const cut=rest.search(/\n[A-ZÀ-Ý][^\n.]{2,40}\.\s/); if(cut>0) rest=rest.slice(0,cut);
  let seg=norm(rest).replace(/\s+/g," ").split(/recuperation des charges/)[0];
  const names=S.C.spells.map(x=>[norm(x.name),x]).filter(([n])=>n.length>3).sort((a,b)=>b[0].length-a[0].length);
  const found=[];
  for(const [n,x] of names){ const re=new RegExp("(^|[^a-z0-9])"+n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(?=[^a-z0-9]|$)"); const m=seg.match(re); if(!m) continue;
    const at=m.index+m[1].length, after=seg.slice(at+n.length, at+n.length+80);
    found.push({sp:x,at,after}); seg=seg.slice(0,at)+"#".repeat(n.length)+seg.slice(at+n.length); }
  if(found.length<2) return [];
  const def=+((low.match(/depenser (\d+) charges? (?:du baton|de la baguette|de l.anneau|pour)/)||[])[1]||1);
  return found.sort((a,b)=>a.at-b.at).map(f=>{ const per=/^\s*1 charge par niveau/.test(f.after), mx=f.after.match(/maximum (\d+)/), num=f.after.match(/^\s*(\d+)\b/);
    return {sp:f.sp, cost:per?+f.sp.level||1:(num?+num[1]:def), perLvl:per, max:per&&mx?+mx[1]:null}; });
}
function itemUse(ch,b){
  const c=itemCharges(ch,b), potion=/^potion|\bpotion\b|élixir|elixir/i.test(b.name);
  if(!(c&&c.max)&&!potion) return null;
  const {text}=bagRefText(b); const t=text||"";
  let cost=c&&c.cost&&c.cost!=="auto"?c.cost:null, sp=null;
  if(!cost){
    // sort lancé par l'objet
    const low=norm(t); let best=null;
    if(/lancer|lance /i.test(t)) for(const x of S.C.spells){ const n=norm(x.name); if(n.length>3&&low.includes("lancer "+n)&&(!best||n.length>norm(best.name).length)) best=x; }
    sp=best;
    if(potion) cost="bonus";
    else if(/action Bonus/i.test(t)) cost="bonus";
    else if(/par une Réaction|votre Réaction|en Réaction/i.test(t)) cost="reaction";
    else if(sp) cost=costOfSpell(sp)||"action";
    else if(/action (?:Magie|Utilisation)|entreprendre l.action/i.test(t)) cost="action";
    else cost=c&&!text?"action":"autre";
  } else { const low=norm(t); for(const x of S.C.spells){ const n=norm(x.name); if(n.length>3&&low.includes("lancer "+n)&&(!sp||n.length>norm(sp.name).length)) sp=x; } }
  if(cost==="none") return null;
  const spells=itemSpells(t); if(spells.length){ sp=null; if(!(c&&c.cost&&c.cost!=="auto")&&!potion) cost=costOfSpell(spells[0].sp)||"action"; }
  const eq=ch.equip||{}; const needHold=/(?:lorsque|tant que) vous (?:la|le|les) tenez|en (?:la|le) tenant/i.test(t);
  const held=(!eq.mainP&&!eq.mainS)||!needHold?null:(eq.mainP===b.id||eq.mainS===b.id);
  const mx=t.match(/dépenser jusqu.à (\d+) charges/i), dd=t.match(/DD de sauvegarde (\d+)/i);
  const left=c&&c.max?c.max-(+c.used||0):null;
  return {cost,sp,spells:spells.length?spells:null,c,left,potion,held,needHold,maxCh:mx?+mx[1]:1,dd:dd?+dd[1]:null,
    sub:(c&&c.max?`${left}/${c.max} charges`:`×${+b.qty||0}`)+(sp?" · "+sp.name:spells.length?" · "+spells.length+" sorts":"")+(held===false?" · pas en main":"")};
}
function chargePips(ch,b){ const c=itemCharges(ch,b); if(!c||!c.max) return "";
  const left=Math.max(0,c.max-(+c.used||0)); const n=Math.min(c.max,20);
  return `<span class="chg" title="${left}/${c.max} charges${c.rec?" · récupère "+(c.rec==="full"?"tout":c.rec)+(c.when==="court"?" au repos court":" au repos long / à l'aube"):""}">${c.max<=20?Array.from({length:n},(_,i)=>`<button class="pip${i<left?"":" used"}" data-act="chg" data-id="${esc(b.id)}" data-i="${i}" aria-label="Charge ${i+1}"></button>`).join(""):""}<b class="num">${left}/${c.max}</b></span>`; }
function chargeRest(ch,kind){ const log=[];
  for(const b of ch.bag||[]){ const c=itemCharges(ch,b); if(!c||!c.max||!(+c.used)) continue;
    if(c.when==="aucune") continue; if(kind==="court"&&c.when!=="court") continue;
    if(c.pendingRecovery) continue;
    if(c.rec&&/d/i.test(c.rec)&&!virtualDiceEnabled()){
      b.charges=Object.assign({},c,{pendingRecovery:true,auto:false});
      log.push(b.name+" : récupération "+c.rec+" à saisir dans À la table"); continue;
    }
    let g=c.max; if(c.rec&&c.rec!=="full"){ g=/d/i.test(c.rec)?rollExpr(c.rec).total:+c.rec; }
    const before=+c.used; b.charges=Object.assign({},c,{used:Math.max(0,before-g),auto:false}); log.push(b.name+" +"+(before-b.charges.used)); }
  return log; }
 
/* ---------- derived sheet ---------- */
function derive(ch){
  const L=Math.max(1,Math.min(20,+ch.level||1)), pb=PB(L);
  const cls=clsOf(ch.classId);
  const MG=magicOf(ch);
  const abEff={}; for(const a of AB) abEff[a]=Math.max(+(ch.abilities?.[a]??10), MG.setAb[a]||0);
  const mods={}; for(const a of AB) mods[a]=mod(abEff[a]);
  const ctx={level:L,pb,mods};
  const sources=collectSources(ch);
  const effs=[]; for(const s of sources) for(const e of s.effects||[]) effs.push(Object.assign({_src:s.name},e));
  for(const e of MG.eff) effs.push(e);
  if(cls&&cls.hb) for(const f of cls.features) if(f.level<=L) for(const e of f.effects||[]) effs.push(Object.assign({_src:f.name},e));
  const bonus=c=>effs.filter(e=>e.t==="bonus"&&e.cible===c).reduce((t,e)=>t+evalF(e.val,ctx),0);
  const D={L,pb,mods,cls,sources,effs,ctx,mg:MG,abEff};
  D.testB=bonus("test:all");
  // saves
  D.saves={}; for(const a of AB){
    const prof=(cls&&cls.saves.includes(a))||(ch.saveProfs||[]).includes(a)||effs.some(e=>e.t==="maitrise"&&e.cible==="jds:"+a);
    D.saves[a]={prof, val:mods[a]+(prof?pb:0)+bonus("jds:"+a)+bonus("jds:all")};
  }
  // skills
  D.skills={}; for(const s of S.C.skills){
    let lv=+(ch.skills?.[s.id]||0);
    for(const e of effs) if(e.t==="maitrise"&&e.cible==="comp:"+s.id) lv=Math.max(lv,+e.niveau||1);
    D.skills[s.id]={lv, val:mods[s.ability]+lv*pb+bonus("comp:"+s.id)+bonus("comp:all"), ab:s.ability, name:s.name};
  }
  D.passive=10+D.skills.perception.val;
  D.init=mods.dex+bonus("init");
  // AC
  const inv=(ch.invocations||[]);
  let ac, acNote;
  const arm=ch.armor||"none";
  if(arm==="mage"){ ac=13+mods.dex; acNote="Armure du mage"; }
  else if(arm==="custom"){ ac=evalF(ch.acCustom||"10+dex",ctx); acNote="Formule perso"; }
  else if(arm.startsWith("srd:")){ const a=S.idx.armors[arm.slice(4)]; ac=a.ac+(a.dexMax===0?0:a.dexMax?Math.min(a.dexMax,mods.dex):mods.dex)+bonus("ca_armure"); acNote=a.name; }
  else { const u=cls&&cls.unarmoredAC; ac=u?evalF(u.replace(/\+/g,"+"),ctx):10+mods.dex; acNote=u?"Défense sans armure":"Sans armure"; }
  if(ch.shield){ if(!cls||(cls.armor||[]).includes("bouclier")){ ac+=2; acNote+=" + bouclier"; } else acNote+=" (bouclier sans formation : pas de bonus)"; }
  ac+=bonus("ca")+(+ch.acBonus||0);
  D.ac=ac; D.acNote=acNote;
  // speed
  const sp=hb(ch.species)||srd("species",ch.species);
  D.speed=(+(sp?.speed)||9)+bonus("vitesse")+(+ch.speedBonus||0);
  if(arm.startsWith("srd:")){ const a=S.idx.armors[arm.slice(4)]; if(a&&a.strength&&(+ch.abilities?.for||10)<a.strength) D.speed=Math.max(0,D.speed-3); }
  // HP
  const hd=cls?cls.hitDie:8;
  D.hd=hd;
  let hpAuto=hd+mods.con+(L-1)*(hd/2+1+mods.con)+bonus("pvniv")*L+bonus("pvmax");
  D.hpAuto=Math.max(1,hpAuto);
  D.hpBase=ch.hpMode==="manual"?(+ch.hpMaxManual||D.hpAuto):D.hpAuto;
  D.hpBonus=+ch.hpMaxBonus||0;
  D.hpMax=Math.max(1,D.hpBase+D.hpBonus);
  // casting
  const cast=cls&&cls.casting;
  D.cast=null;
  if(cast||effs.some(e=>e.t==="sorts")){
    const ab=cast?cast.ability:"cha";
    D.cast={ability:ab, dc:8+pb+mods[ab]+bonus("dd"), atk:pb+mods[ab]+bonus("attaque_sort"), type:cast?cast.type:null};
    if(cast){
      D.cast.cantrips=cast.cantrips[L-1]; D.cast.prepared=cast.prepared[L-1];
      if(cast.type==="pact"){ D.cast.pactSlots=cast.pactSlots[L-1]; D.cast.pactLevel=cast.pactLevel[L-1]; }
      else if(cast.slots){ D.cast.slots=cast.slots[L-1]||[]; }
    }
  }
  // always prepared spells: SRD subclass + hb subclass + effects
  D.always={};
  if(ch.subclass&&ch.subclass.startsWith("srd:")&&cls){
    const sc=cls.subclasses.find(s=>"srd:"+s.id===ch.subclass);
    if(sc){ for(const f of sc.features) for(const g of (f.grantedSpells||[])) if(g.level<=L) for(const n of g.spells){ const s=findSpellByName(n); if(s) D.always[s.ref]=sc.name; } }
  }
  for(const e of effs) if(e.t==="sorts"){ for(const n of String(e.noms||"").split(",")){ const s=findSpellByName(n); if(s) D.always[s.ref]=e._src; } }
  // invocations auto
  D.inv=new Set(inv.map(invId)); D.invPick=inv.map(x=>({id:invId(x),c:invCh(x)}));
  // arcanum mystique
  D.arc=arcanumOf(ch,D);
  for(const r of Object.values(D.arc)) if(r) D.always[r]="Arcanum mystique";
  // attaques par action Attaque
  const fl=cls?cls.features.filter(f=>f.level<=L).map(f=>f.name):[];
  D.atkN=1+(fl.some(n=>/^Attaque supplémentaire/i.test(n))?1:0)+(fl.some(n=>/^Deux attaques supplémentaires/i.test(n))?1:0)+(fl.some(n=>/^Trois attaques supplémentaires/i.test(n))?1:0);
  D.atkNpact=Math.max(D.atkN, D.inv.has("lame-assoiffee")?2:1);
  // resources
  D.res=[];
  if(cls) for(const r of cls.resources){
    let max;
    if(Array.isArray(r.max)) max=r.max[L-1]; else if(r.max==="cha_min1") max=Math.max(1,mods.cha); else if(r.max==="lvl5") max=5*L; else max=0;
    if(typeof max==="string") max=parseInt(max)||0;
    if(max>0) D.res.push({id:"cls:"+r.id,name:r.name,max,recharge:r.recharge,origin:cls.name});
  }
  for(const [sl,r] of Object.entries(D.arc||{})) D.res.push({id:"arc:"+sl,name:"Arcanum mystique (niv. "+sl+")"+(r?" · "+(spellOf(r)?.name||""):""),max:1,recharge:"long",origin:cls.name});
  if(cls) for(const f of cls.features) if(f.level<=L){ const m=String(f.text||"").match(/Le sort (.+?) est toujours préparé/i); if(!m) continue; const sf=findSpellByName(m[1].trim()); if(!sf) continue;
    D.always[sf.ref]=f.name;
    if(/sans dépenser d.emplacement/i.test(f.text)){ const nm=norm(sf.s.name); let r=D.res.find(x=>norm(x.name).includes(nm));
      if(!r){ r={id:"free:"+sf.ref,name:sf.s.name+" sans emplacement",max:/deux fois/i.test(f.text)?2:1,recharge:"long",origin:f.name}; if(r.max>0) D.res.push(r); }
      r.freeSpell=sf.ref; } }
  if(cls&&cls.id==="occultiste"&&L>=9) D.res.push({id:"cls:communication-protecteur",name:"Communication avec le protecteur",max:1,recharge:"long",origin:cls.name});
  D.guerisseur=sources.some(s=>norm(s.name)==="guerisseur"||(s.effects||[]).some(e=>e.t==="guerisseur"));
  for(const s of sources) for(const e of s.effects||[]){
    if(e.t==="ressource"){ const max=evalF(e.max,ctx); if(max>0) D.res.push({id:"hb:"+norm(e.nom||s.name),name:e.nom||s.name,max,recharge:e.recharge||"long",origin:s.name,note:e.note}); }
    if(e.t==="reserve"){ const n=evalF(e.des,ctx); if(n>0) D.res.push({id:"hb:"+norm(e.nom||s.name),name:e.nom||s.name,max:n,die:+e.face||6,recharge:e.recharge||"long",origin:s.name,pool:true,maxUse:e.maxUse?evalF(e.maxUse,ctx):null,note:e.note}); }
  }
  D.exh=+ch.exhaustion||0;
  return D;
}
function findSpellByName(n){
  const k=norm(n); if(!k) return null;
  const s=S.idx.spellByName[k]; if(s) return {ref:"srd:"+s.id, s};
  for(const h of hbs("sort")) if(norm(h.name)===k) return {ref:"hb:"+h._id, s:h};
  return null;
}
 
/* ---------- spell mechanics ---------- */
function spellMech(sp){
  if(sp.mech&&(sp.mech.dice||sp.mech.attack||sp.mech.save)) return Object.assign({},sp.mech);
  const t=sp.text||"", m={};
  if(/attaque de sort (?:à distance|au corps à corps)/i.test(t)) m.attack=true;
  const sv=t.match(/jet de sauvegarde (?:de |d’)(Force|Dextérité|Constitution|Intelligence|Sagesse|Charisme)/i);
  if(sv) m.save=sv[1];
  const first=t.split(/\n(?:Emplacement de niveau supérieur|Amélioration de sort mineur)\./)[0];
  const dm=first.match(/(\d+d\d+)(?:\s*\+\s*votre modificateur de caractéristique d’incantation)?\s+(?:dégâts?|points de dégâts)\s+(?:de\s+)?([a-zéèêàç]+)/i);
  const heal=first.match(/(?:récupère|regagne)[^.]{0,80}?(\d+d\d+)(\s*\+\s*votre modificateur de caractéristique d’incantation)?/i)||first.match(/points de vie égal à (\d+d\d+)(\s*\+\s*votre modificateur de caractéristique d’incantation)?/i);
  if(heal&&(!dm||first.indexOf(heal[1])<first.indexOf(dm[1]))){ m.dice=heal[1]; m.heal=true; m.addMod=!!heal[2]; }
  else if(dm){ m.dice=dm[1]; m.dmgType=dm[2]; m.addMod=/\d+d\d+\s*\+\s*votre modificateur de caractéristique d’incantation/.test(first); }
  const up=t.match(/Emplacement de niveau supérieur\.[^\n]*?(\d+d\d+)[^.\n]{0,50}?par niveau d’emplacement au-delà du (\d+)/);
  if(up){ m.upDice=up[1]; }
  if(sp.level===0 && /Amélioration de sort mineur/.test(t)){ m.scale=true; m.beams=/rayons/.test(t); }
  return m;
}
function diceAt(m, sp, slot, D){
  if(!m.dice) return null;
  let [n,f]=m.dice.split("d").map(Number);
  if(sp.level===0 && m.scale && !m.beams){ n*=1+(D.L>=5)+(D.L>=11)+(D.L>=17); }
  let expr=n+"d"+f;
  if(m.upDice && slot>sp.level){ const [un,uf]=m.upDice.split("d").map(Number); if(uf===f){ expr=(n+un*(slot-sp.level))+"d"+f; } else expr+="+"+(un*(slot-sp.level))+"d"+uf; }
  let bonus=0;
  if(m.addMod) bonus+=D.mods[D.cast?.ability||"cha"];
  if(sp.level===0 && (D.invPick||[]).some(p=>p.id==="decharge-dechirante"&&(p.c?norm((spellOf(p.c)||{}).name)===norm(sp.name):norm(sp.name)===norm("Décharge occulte")))) bonus+=D.mods.cha;
  if(m.bonus) bonus+=evalF(m.bonus,D.ctx);
  return expr+(bonus?sg(bonus):"");
}
 
/* ---------- dice ---------- */
function rnd(f){ if(!virtualDiceEnabled()) throw new Error("Dés virtuels désactivés"); const a=new Uint32Array(1); crypto.getRandomValues(a); return 1+(a[0]%f); }
function rollExpr(expr,re1){
  if(!virtualDiceEnabled()) throw new Error("Dés virtuels désactivés");
  const parts=String(expr).replace(/\s+/g,"").replace(/-/g,"+-").split("+").filter(Boolean);
  let total=0; const bd=[];
  for(const p of parts){
    const m=p.match(/^(-?)(\d*)d(\d+)$/i);
    if(m){ const n=+(m[2]||1), f=+m[3], sgn=m[1]?-1:1; const rs=[]; let tot1=0; for(let i=0;i<Math.min(n,100);i++){ let v=rnd(f); if(re1&&v===1){ const w=rnd(f); rs.push("1→"+w); v=w; } else rs.push(v); tot1+=v; } total+=sgn*tot1; bd.push(`${m[1]}${n}d${f} [${rs.join(", ")}]`); }
    else if(/^-?\d+$/.test(p)){ total+=+p; bd.push(p); }
  }
  return {total, bd:bd.join(" + ").replace(/\+ -/g,"− ")};
}
function doubleDice(expr){ return String(expr).replace(/(\d*)d(\d+)/g,(m,n,f)=>(2*(+n||1))+"d"+f); }
function addLog(e){ const en=Object.assign({t:Date.now()},e); S.log.unshift(en); S.log=S.log.slice(0,60);
  const ch=cur(); if(ch){ const {quiet,...keep}=en; ch.rollLog=[keep,...(ch.rollLog||[])].slice(0,200); touch(S.cur); }
  renderDice(); if(!e.quiet) showToast(e); }
function rollD20(label, m, opts={}){
  if(!virtualDiceEnabled()) return;
  const D=S.cur?derive(cur()):null;
  const exh=D?D.exh*2:0;
  const mode=opts.mode||S.adv;
  const a=rnd(20), b=rnd(20);
  let used=a, other=null;
  if(mode==="a"){ used=Math.max(a,b); other=Math.min(a,b); }
  if(mode==="d"){ used=Math.min(a,b); other=Math.max(a,b); }
  const total=used+m-exh;
  let bd=`d20 : ${used}`+(other!==null?` (${other} écarté, ${mode==="a"?"avantage":"désavantage"})`:"")+` ${m>=0?"+":"−"} ${Math.abs(m)}`+(exh?` − ${exh} épuisement`:"");
  addLog({label, total, bd, crit:used===20, fumble:used===1, kind:"d20"});
  if(S.adv!=="n"){ S.adv="n"; renderDice(); }
}
function rollDmg(label, expr, crit){
  if(!virtualDiceEnabled()) return;
  const e=crit?doubleDice(expr):expr; const r=rollExpr(e);
  addLog({label:label+(crit?" (critique)":""), total:r.total, bd:r.bd, kind:"dmg"});
}
let toastT=null;
function showToast(e){
  const t=document.getElementById("toast");
  t.innerHTML=`<span class="tot">${e.total}</span><span><b>${esc(e.label)}</b><br><span style="opacity:.75;font-size:12px">${esc(e.bd)}</span></span>`;
  t.classList.toggle("rolls",!!document.getElementById("dice")); t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>t.hidden=true,4000);
}