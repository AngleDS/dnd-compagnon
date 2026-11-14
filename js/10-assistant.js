/* ---------- assistant de création ---------- */
const STD_ARRAY=[15,14,13,12,10,8], PT_COST={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9}, PT_EXT={3:-9,4:-6,5:-4,6:-2,7:-1,8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9,16:12,17:15,18:19};
function wNew(){ return {step:0,cls:"",bg:"",sp:"",asiMode:"21",asi2:"",asi1:"",asiT:["","",""],feat:"",hFeat:"",method:"std",std:{},pts:{for:8,dex:8,con:8,int:8,sag:8,cha:8},dice:["","","","","",""],diceAs:{},rolled:false,alO:"",alM:"",nh:null,skills:[],extraSkill:"",can:[],spl:[],inv:[],invc:[],eqC:"A",eqB:"A",eqOff:{},name:"",player:"",align:"",level:1,notes:""}; }
function eqOptions(txt){ const t=String(txt||"").replace(/^Choisissez[^:]*:\s*/,""); const out=[]; const re=/\(([A-Z])\)\s*([\s\S]*?)(?=\s*;\s*(?:ou\s*)?\([A-Z]\)|$)/g; let m;
  while((m=re.exec(t))){ const items=[]; let gold=0;
    for(let part of m[2].replace(/\s*;?\s*$/,"").split(/,\s*|\s+\+\s+/)){ part=part.trim(); const last=part.match(/^(.*)\s+et\s+(\d+ po)$/); const segs=last?[last[1],last[2]]:[part];
      for(const s0 of segs){ const s=s0.trim(); if(!s) continue; const g=s.match(/^(\d+)\s*po$/); if(g){ gold+=+g[1]; continue; }
        const q=s.match(/^(\d+)\s+(.+)$/); const name=q?q[2]:s; items.push({name:name.charAt(0).toUpperCase()+name.slice(1),qty:q?+q[1]:1}); } }
    out.push({k:m[1],items,gold}); }
  return out; }
function wStyle1(W){ const c=wCls(W); return !!(c&&c.features.some(f=>f.level===1&&/^Style de combat/i.test(f.name))); }
function wAlign(W){ if(!W.alO&&!W.alM) return ""; if(W.alO==="Neutre"&&W.alM==="neutre") return "Neutre strict"; return [W.alO,W.alM].filter(Boolean).join(" "); }
function wNhBtn(W,kind,target,label){ return W.nh&&W.nh.target===target?wNhPanel(W):`<button class="btn small ghost" data-act="wnh" data-k="${kind}" data-v="${target}" style="margin-top:8px">+ ${esc(label)}</button>`; }
function wNhPanel(W){ const n=W.nh, K={historique:"historique",espece:"espèce",don:"don",classe:"classe"}[n.kind];
  let x=`<div class="panel stack wnh" style="margin-top:10px"><b>${n.kind==="espece"||n.kind==="classe"?"Nouvelle":"Nouveau"} ${esc(K)} hors SRD</b>
    <div class="grid2"><label class="field"><span>Nom</span><input type="text" data-w="nh.name" value="${esc(n.name||"")}"></label><label class="field"><span>Livre (vide = Personnalisée)</span><input type="text" data-w="nh.label" value="${esc(n.label||"")}" placeholder="Manuel des joueurs (2024)…"></label><label class="field" style="grid-column:1/-1"><span>Lien AideDD (facultatif)</span><input type="url" data-w="nh.link" value="${esc(n.link||"")}" placeholder="https://www.aidedd.org/…"></label></div>`;
  if(n.kind==="historique") x+=`<div class="field"><span>Caractéristiques concernées (3)</span><div class="row" style="gap:6px">${[0,1,2].map(i=>wSel("nh.abs."+i,AB.filter(a=>!n.abs.some((z,j)=>j!==i&&z===a)).map(a=>[a,ABN[a]]),n.abs[i])).join("")}</div></div>
    <div class="field"><span>Compétences (2)</span><div class="row" style="gap:6px">${[0,1].map(i=>wSel("nh.sk."+i,S.C.skills.filter(k=>!n.sk.some((z,j)=>j!==i&&z===k.id)).map(k=>[k.id,k.name]),n.sk[i])).join("")}</div></div>
    <label class="field"><span>Outil</span><input type="text" data-w="nh.tools" value="${esc(n.tools||"")}"></label>`;
  if(n.kind==="classe") x+=`<div class="grid2"><label class="field"><span>Dé de vie</span>${wSel("nh.hitDie",[6,8,10,12].map(v=>[v,"d"+v]),n.hitDie||8,"—")}</label><label class="field"><span>Caractéristique principale</span>${wSel("nh.primary1",AB.map(a=>[a,ABN[a]]),n.primary1)}</label>
    <div class="field"><span>Jets de sauvegarde</span><div class="row" style="gap:6px">${wSel("nh.save1",AB.map(a=>[a,ABN[a]]),n.save1)}${wSel("nh.save2",AB.map(a=>[a,ABN[a]]),n.save2)}</div></div><label class="field"><span>Incantation</span>${wSel("nh.castType",CAST_TYPES.slice(1),n.castType||"","Aucune")}</label></div>
    <div class="muted" style="font-size:var(--fs-sm)">Le reste (compétences, armures, aptitudes par niveau…) se complète dans « Mes contenus ».</div>`;
  if(n.kind==="espece") x+=`<label class="field"><span>Vitesse (m)</span><input type="number" step="1.5" min="0" data-w="nh.speed" value="${esc(n.speed||9)}"></label>`;
  x+=`<label class="field"><span>Description${n.kind==="espece"?" et traits":""}</span><textarea data-w="nh.text" style="min-height:90px">${esc(n.text||"")}</textarea></label>
    <div class="row" style="justify-content:space-between;gap:6px;flex-wrap:wrap">${afBtn('data-mode="nh"')}<span class="row" style="gap:6px;margin-left:auto"><button class="btn small ghost" data-act="wnhCancel">Annuler</button><button class="btn small primary" data-act="wnhSave">Créer et choisir</button></span></div>
    <div class="muted" style="font-size:var(--fs-sm)">Il sera rangé dans « Mes contenus » pour tous tes personnages. Tu pourras y ajouter des effets automatisés et un lien AideDD.</div></div>`;
  return x; }
function wCls(W){ return clsOf(W.cls); }
function wBg(W){ return srd("backgrounds",W.bg)||hb(W.bg); }
function wBgAbs(W){ const b=srd("backgrounds",W.bg); if(b) return b.abilities; const h=hb(W.bg); return h&&Array.isArray(h.abilities)&&h.abilities.filter(Boolean).length===3?h.abilities:AB.slice(); }
function wBgSkills(W){ const b=srd("backgrounds",W.bg); if(b) return b.skills||[]; const h=hb(W.bg); return h?(h.effects||[]).filter(e=>e.t==="maitrise"&&/^comp:/.test(e.cible||"")).map(e=>e.cible.slice(5)):[]; }
function wBgFeat(W){ const b=srd("backgrounds",W.bg); if(!b) return W.feat||""; const n=norm(String(b.feat||"").replace(/\s*\(.*\)\s*/,"")); const f=S.C.feats.find(x=>norm(x.name)===n); return f?"srd:"+f.id:""; }
// Choix d'espèce en plus du lignage (chantier 17) : la compétence de Sens aiguisés (elfe) et la taille quand l'espèce en propose deux
const SP_SKILL={"Sens aiguisés":["intuition","perception","survie"]};
function wSpSkills(W){ const s=srd("species",W.sp), t=s&&s.traits.find(t=>SP_SKILL[t.name]); return t?{name:t.name,from:SP_SKILL[t.name]}:null; }
function wSizes(W){ const s=srd("species",W.sp), m=s?String(s.size||"").replace(/,\s*à choisir.*$/,"").split(/\s+ou\s+/):[]; return m.length===2?m:null; }
// Choix de classe du niveau 1 (chantier 17) : expertise (2 compétences maîtrisées) et bottes d'arme (parmi les armes du lot choisi)
function wExpN(W){ const c=wCls(W); return c&&c.features.some(f=>f.level===1&&/^Expertise$/.test(f.name))?2:0; }
function wProf(W){ return [...new Set([...wBgSkills(W),wSpSkills(W)?W.spSkill:"",...W.skills,W.extraSkill].filter(Boolean))]; }
function wExp(W){ const p=wProf(W); return (W.exp||[]).filter(s=>p.includes(s)).slice(0,wExpN(W)); }
function wMast(W){ const c=wCls(W), n=c?bottesN({cls:c,L:1}):0; if(!n) return {n:0,cands:[],list:[]};
  const cands=[...new Set(wEqItems(W).items.map(it=>eqInfo({name:it.name})).filter(e=>e.type==="weapon"&&e.w.mastery).map(e=>"srd:"+e.w.id))];
  return {n,cands,list:(Array.isArray(W.mast)?W.mast.filter(w=>cands.includes(w)):cands).slice(0,n)}; }
// Styles de combat proposés à la création : règles de base et dons complets, rien d'« à remplir »
function wStyles(){ return styleOpts({feats:[]}).filter(([v])=>!String(v).startsWith("cat:")&&!(hb(v)||{}).pending).map(([v,l])=>[v,String(l).replace(/\s*\(hors SRD[^)]*\)$/,"")]); }
function wIsHuman(W){ const s=srd("species",W.sp); return !!(s&&s.traits.some(t=>t.name==="Polyvalent")); }
// Dons d'origine proposés : règles de base, puis dons complets de « Mes contenus ». cur : le don déjà retenu reste dans la liste.
function wOriginFeats(cur){ const l=[...S.C.feats.filter(f=>/origine/i.test(f.category||"")).map(f=>["srd:"+f.id,f.name]),...hbs("don").filter(h=>!h.pending).map(h=>["hb:"+h._id,h.name])];
  if(cur&&!l.some(x=>x[0]===cur)){ const h=hb(cur); if(h) l.push([cur,h.name]); } return l; }
/* Contenus proposés par l'assistant (décision du 14 nov. 2026) : « Règles de base » (SRD) et « Autres contenus », c'est-à-dire seulement
   les fiches complètes de « Mes contenus ». Rien d'« à remplir » ; la création de contenu se fait dans « Mes contenus », pas ici.
   Un historique est complet dès qu'il a ses 3 caractéristiques, ses 2 compétences et son don (les 12 du Manuel des joueurs dans le catalogue). */
function wBgReady(h){ return Array.isArray(h.abilities)&&h.abilities.filter(Boolean).length===3&&(h.effects||[]).filter(e=>e.t==="maitrise"&&/^comp:/.test(e.cible||"")).length>=2&&!!(h.feat||h.featRef); }
function wSources(kind){ const tag=h=>catShort(h.label)||"Personnalisée";
  if(kind==="classe") return {base:S.C.classes.map(x=>[x.id,x.name,`d${x.hitDie} · ${x.primary.map(a=>ABN[a]).join(" ou ")}${x.casting?" · sorts":""}`]),
    other:hbs("classe").filter(h=>!h.pending).map(x=>["hb:"+x._id,x.name,tag(x)+" · d"+(+x.hitDie||8)])};
  if(kind==="historique") return {base:S.C.backgrounds.map(b=>["srd:"+b.id,b.name,b.abilities.map(a=>ABS[a]).join(", ")+" · "+b.feat]),
    other:[...hbs("historique").filter(h=>!h.pending||wBgReady(h)).map(x=>["hb:"+x._id,x.name,tag(x)+(x.feat?" · "+x.feat:"")]),
      ...catAll().filter(e=>e.k==="historique"&&!catHb(e)&&(e.ab||[]).length===3&&(e.sk||[]).length===2&&(e.feat||e.featRef)).map(e=>["cat:"+e.id,e.n,catShort(e.b)+" · "+e.feat])].sort((a,b)=>a[1].localeCompare(b[1],"fr"))};
  return {base:S.C.species.map(x=>["srd:"+x.id,x.name,x.traits.map(t=>t.name).join(", ")]),other:hbs("espece").filter(h=>!h.pending).map(x=>["hb:"+x._id,x.name,tag(x)])}; }
// Liste de choix avec ses deux onglets ; « Autres contenus » n'existe que s'il y a quelque chose de complet à y montrer
function wPick(W,kind,key){ const s=wSources(kind), tab=s.other.length&&(W.src||{})[kind]==="other"?"other":"base";
  // Une fois le choix fait, la liste se replie : ses détails et ses sous-choix sont juste dessous, pas sous le pli
  const got=W[key]&&W.chg!==key?[...s.base,...s.other].find(x=>x[0]===W[key]):null;
  if(got) return `<div class="wchosen"><span><b>${esc(got[1])}</b>${got[2]?`<span class="muted">${esc(got[2])}</span>`:""}</span><button class="btn small" data-act="wchg" data-k="${key}">Changer</button></div>`;
  return (s.other.length?`<div class="adv wsrc" role="group" style="grid-template-columns:1fr 1fr"><button aria-pressed="${tab==="base"}" data-act="wsrc" data-k="${kind}" data-v="base">Règles de base</button><button aria-pressed="${tab==="other"}" data-act="wsrc" data-k="${kind}" data-v="other">Autres contenus (${s.other.length})</button></div>`:"")
    +wCards(s[tab],W[key],key)
    +`<div class="muted wmore" style="font-size:var(--fs-sm);margin-top:8px">Tu ne trouves pas ? Ce qui sort des règles de base se prépare dans <button class="btn small ghost" data-act="nav" data-v="hb">Mes contenus</button> Ta création en cours t'attendra.</div>`; }
function wBase(W){ const o={};
  for(const a of AB){ if(W.method==="std") o[a]=W.std[a]?+W.std[a]:null; else if(W.method==="pts") o[a]=+W.pts[a]||8; else { const i=W.diceAs[a]; o[a]=i!==undefined&&i!==""&&W.dice[+i]!==""?+W.dice[+i]:null; } }
  return o; }
function wBonus(W){ const o={}; for(const a of AB) o[a]=0; const abs=wBgAbs(W);
  if(W.asiMode==="21"){ if(W.asi2) o[W.asi2]+=2; if(W.asi1&&W.asi1!==W.asi2) o[W.asi1]+=1; }
  else { const list=abs.length===3?abs:W.asiT.filter(Boolean); for(const a of new Set(list)) o[a]+=1; }
  return o; }
function wAbilities(W){ const b=wBase(W), x=wBonus(W), o={}; for(const a of AB) o[a]=Math.min(20,(b[a]??10)+x[a]); return o; }
function wCast(W){ const c=wCls(W); return c&&c.casting?c.casting:null; }
/* Langues (chantier 17) : tout personnage parle le commun et choisit 2 langues standard ; le Roublard reçoit l'argot des voleurs et une langue de plus,
   le Druide le druidique. Le résultat va dans le champ texte ch.languages, qui reste libre dans la fiche (langues rares, avec l'accord du MJ). */
const LANGS=["Draconique","Elfique","Géant","Gnome","Gobelin","Halfelin","Langue des signes commune","Nain","Orc"];
function wLangHas(W,n){ const c=wCls(W); return !!(c&&c.features.some(f=>f.level===1&&f.name===n)); }
function wLangFixed(W){ return ["Commun",...(wLangHas(W,"Argot des voleurs")?["Argot des voleurs"]:[]),...(wLangHas(W,"Druidique")?["Druidique"]:[])]; }
function wLangN(W){ return 2+(wLangHas(W,"Argot des voleurs")?1:0); }
function wLangs(W){ return (W.langs||[]).filter(l=>LANGS.includes(l)).slice(0,wLangN(W)); }
function wOrder(W){ return orderOf({order:W.order},wCls(W)); }
// Sorts mineurs à choisir au niveau 1 (un de plus pour le Thaumaturge et le Mage)
function wNC(W){ const cast=wCast(W), n=cast?(cast.cantrips||[])[0]||0:0, o=wOrder(W); return n+(n&&o&&o.cantrip?o.cantrip:0); }
function wSteps(W){ const c=wCls(W), cast=wCast(W); const st=["Classe","Historique","Espèce","Caractéristiques","Compétences"];
  if((cast&&((cast.cantrips||[])[0]||(cast.prepared||[])[0]))||(c&&c.id==="occultiste")) st.push("Sorts"); st.push("Langues","Équipement","Identité"); return st; }
function wEqItems(W){ const c=wCls(W), out=[]; let gold=0; const add=(txt,key)=>{ const opts=eqOptions(txt); const cur=opts.find(o=>o.k===W[key])||opts[0]; if(!cur) return; gold+=cur.gold; cur.items.forEach((it,ix)=>{ if(!W.eqOff[key+cur.k+ix]) out.push(it); }); };
  if(c) add(c.equipment,"eqC"); const bgS=srd("backgrounds",W.bg); if(bgS) add(bgS.equipment,"eqB"); return {items:out,gold}; }
function wDoc(W){ const c=wCls(W); const skills={}; for(const s of [...W.skills,...wBgSkills(W),W.extraSkill,wSpSkills(W)?W.spSkill:""].filter(Boolean)) skills[s]=1; for(const s of wExp(W)) skills[s]=2;
  const feats=[...new Set([wBgFeat(W), wIsHuman(W)?W.hFeat:"", wStyle1(W)?W.style:""].filter(Boolean))];
  const bgS=srd("backgrounds",W.bg);
  return {type:"perso",name:W.name||"Nouveau personnage",player:W.player||"",level:1,classId:W.cls,species:W.sp,size:wSizes(W)&&W.size?W.size:undefined,lineage:W.lin&&LINEAGES[String(W.sp||"").replace(/^srd:/,"")]?{id:W.lin,ab:W.linAb||"cha"}:undefined,background:W.bg,abilities:wAbilities(W),skills,
    hp:{cur:1,temp:0},attacks:[],order:c&&ORDERS[c.id]&&ORDERS[c.id].opts[W.order]?W.order:undefined,spells:[...W.can.slice(0,wNC(W)),...W.spl].filter(Boolean).map(r=>({ref:r,prepared:true})),feats,features:[],invocations:W.inv.map((id,i)=>id?id+(W.invc[i]?"|"+W.invc[i]:""):"").filter(Boolean),
    conditions:[],gold:{po:0},tools:[bgS?bgS.tools:(hb(W.bg)||{}).tools,c&&c.tools].filter(Boolean).join(" ; "),alignment:wAlign(W),languages:[...wLangFixed(W),...wLangs(W)].join(", "),notes:W.notes||"",hpMode:"auto",bag:[],updatedAt:Date.now(),
    ...(()=>{ const its=wEqItems(W).items.map(it=>eqInfo({name:it.name})); const a=its.find(e=>e.type==="armor"), sh=its.find(e=>e.type==="shield"); return {armor:a?"srd:"+a.a.id:"none",shield:!!(sh&&c&&(c.armor||[]).includes("bouclier"))}; })()}; }
function wCheck(W,i){ const st=wSteps(W)[i], c=wCls(W);
  if(!c&&(st==="Compétences"||st==="Sorts"||st==="Équipement")) return "Choisis d'abord une classe.";
  if(st==="Classe"){ if(!c) return "Choisis une classe."; const od=ORDERS[c.id]; return od&&!od.opts[W.order]?od.label+" : fais ton choix.":""; }
  if(st==="Historique"){ if(!W.bg) return "Choisis un historique."; if(W.asiMode==="21"&&(!W.asi2||!W.asi1||W.asi1===W.asi2)) return "Choisis +2 et +1 sur deux caractéristiques différentes."; if(W.asiMode==="111"&&wBgAbs(W).length!==3&&new Set(W.asiT.filter(Boolean)).size<3) return "Choisis trois caractéristiques différentes."; if(!srd("backgrounds",W.bg)&&!W.feat) return "Choisis le don d'origine de cet historique."; return ""; }
  if(st==="Espèce"){ if(!W.sp) return "Choisis une espèce."; if(wIsHuman(W)&&!W.hFeat) return "Humain : choisis ton don d'origine (Polyvalent).";
    const def=LINEAGES[String(W.sp).replace(/^srd:/,"")]; if(def&&!(W.lin&&def.opts[W.lin])) return def.label+" : fais ton choix.";
    const sk=wSpSkills(W); if(sk&&!W.spSkill) return sk.name+" : choisis ta compétence."; if(wSizes(W)&&!W.size) return "Choisis ta taille."; return ""; }
  if(st==="Caractéristiques"){ const b=wBase(W); if(AB.some(a=>b[a]==null)) return "Attribue une valeur à chaque caractéristique."; if(W.method==="std"){ const v=AB.map(a=>+W.std[a]).sort((x,y)=>y-x); if(v.join()!==STD_ARRAY.join()) return "Chaque valeur du tableau standard ne s'utilise qu'une fois."; } if(W.method==="dice"){ const ix=AB.map(a=>W.diceAs[a]); if(new Set(ix).size<6) return "Chaque résultat ne s'utilise qu'une fois."; }
    if(W.method==="pts"&&AB.reduce((t,a)=>t+PT_COST[+W.pts[a]],0)>27) return "Tu dépasses les 27 points."; return ""; }
  if(st==="Compétences"){ const n=c.skillChoices.count; if(W.skills.length!==n) return `Choisis ${n} compétences de classe.`; if(wIsHuman(W)&&srd("species",W.sp).traits.some(t=>t.name==="Compétent")&&!W.extraSkill) return "Humain : choisis ta compétence en plus (Compétent)."; if(wStyle1(W)&&!W.style) return "Choisis ton style de combat."; const ne=wExpN(W); if(ne&&wExp(W).length<ne) return `Choisis ${ne} expertises parmi tes compétences.`; return ""; }
  if(st==="Sorts"){ const cast=wCast(W); const nc=wNC(W), np=cast?(cast.prepared||[])[0]||0:0; if(W.can.slice(0,nc).filter(Boolean).length<nc) return `Choisis ${nc} sorts mineurs.`; if(W.spl.filter(Boolean).length<np) return `Choisis ${np} sorts de niveau 1.`; if(c.id==="occultiste"&&W.inv.filter(Boolean).length<wInvN(W)) return "Choisis ta manifestation occulte."; if(W.inv.some((id,i)=>id&&INV_CHOICE[id]&&!W.invc[i])) return "Choisis la cible de ta manifestation."; return ""; }
  if(st==="Langues"){ const n=wLangN(W); return wLangs(W).length<n?`Choisis ${n} langues.`:""; }
  if(st==="Identité") return String(W.name||"").trim()?"":"Donne un nom à ton personnage.";
  return ""; }
// Tout ce qui manque encore avant de pouvoir créer : [{step, name, msg}] (une entrée par étape incomplète)
function wNeeds(W){ return wSteps(W).map((name,step)=>({step,name,msg:wCheck(W,step)})).filter(x=>x.msg).sort((a,b)=>(b.name==="Identité")-(a.name==="Identité")); }
// Pendant la saisie du nom (pas de nouveau rendu) : le bouton Créer et le message suivent
function wNavSync(){ const W=S.W, f=document.getElementById("wfoot"); if(W&&f) f.outerHTML=wFoot(W); }
function wInvN(W){ const c=wCls(W); if(!c||c.id!=="occultiste") return 0; const col=c.columns.find(x=>x.label.startsWith("Manifestations")); return col?+col.values[0]||0:0; }
function wCards(list,cur,key){ return `<div class="wcards">${list.map(([v,t,sub])=>`<button class="wcard" aria-pressed="${v===cur}" data-act="wpick" data-k="${key}" data-v="${esc(v)}"><b>${esc(t)}</b>${sub?`<span class="muted">${esc(sub)}</span>`:""}</button>`).join("")}</div>`; }
// Lignage ou ascendance de l'espèce (chantier 13) : choisi ici, modifiable ensuite dans l'onglet Personnage
function wLineage(W,s){ const def=LINEAGES[s.id]; if(!def) return ""; const o=def.opts[W.lin];
  return `<label class="field"><span>${esc(def.label)}</span>${wSel("lin",Object.entries(def.opts).map(([v,x])=>[v,x.name]),W.lin)}</label>`
    +(def.ability?`<label class="field"><span>Caractéristique d'incantation</span>${wSel("linAb",LINEAGE_AB,W.linAb||"cha")}</label>`:"")
    +(o?`<div class="muted" style="font-size:var(--fs-sm)">${esc(lineageSummary(def,o))}.</div>`:""); }
function wSel(key,opts,cur,ph){ return `<select data-w="${key}"><option value="">${esc(ph||"— Choisir —")}</option>${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(cur)?"selected":""}>${esc(l)}</option>`).join("")}</select>`; }
/* Page de création (mode direct, chantier 17) : une ligne par sujet, chaque ligne ouvre ses choix dans une fenêtre.
   wStepBody : contenu d'une fenêtre ; wLines / wLineVal / wLineMsg : les lignes ; wFoot : compteur et bouton d'état ; wPreview : la fiche chiffrée. */
function wStepBody(W,st){ const c=wCls(W);
  if(!c&&(st==="Compétences"||st==="Sorts"||st==="Équipement")) return `<p class="muted">Choisis d'abord une classe.</p>`;
  let h="";
  if(st==="Classe"){
    h+=`<p class="muted">La classe définit ton rôle : dé de vie, maîtrises, sorts et aptitudes.</p>`+wPick(W,"classe","cls");
    if(c&&ORDERS[c.id]){ const od=ORDERS[c.id], o=od.opts[W.order]; h+=`<div class="panel stack wchoices" style="margin-top:12px"><div class="label">Tes choix</div><label class="field"><span>${esc(od.label)}</span>${wSel("order",Object.entries(od.opts).map(([v,x])=>[v,x.name]),W.order)}</label>${o?`<div class="muted" style="font-size:var(--fs-sm)">${esc(o.note)}</div>`:""}</div>`; }
    if(c) h+=`<div class="panel stack" style="margin-top:12px"><b>${esc(c.name)}</b><div class="muted" style="font-size:var(--fs-sm)">Dé de vie d${c.hitDie} · Sauvegardes : ${c.saves.map(a=>ABN[a]).join(", ")} · Armures : ${esc((c.armor||[]).join(", ")||"aucune")} · Armes : ${esc(c.weapons||"")}${c.tools?" · Outils : "+esc(c.tools):""}</div></div>`;
  }
  if(st==="Historique"){
    h+=`<p class="muted">L'historique donne des bonus de caractéristiques, un don d'origine, 2 compétences et un outil.</p>`+wPick(W,"historique","bg");
    if(W.bg){ const abs=wBgAbs(W), b=srd("backgrounds",W.bg), x=hb(W.bg);
      h+=`<div class="panel stack" style="margin-top:12px">${b?`<div class="muted" style="font-size:var(--fs-sm)">Don : ${esc(b.feat)} · Compétences : ${b.skills.map(s=>(S.C.skills.find(k=>k.id===s)||{}).name).join(", ")} · Outil : ${esc(b.tools||"")}</div>`:`<div class="muted" style="font-size:var(--fs-sm)">${esc(x&&x.text||"")}</div>`}
        <div class="label">Bonus de caractéristiques</div>
        <div class="adv" role="group"><button aria-pressed="${W.asiMode==="21"}" data-act="wpick" data-k="asiMode" data-v="21">+2 et +1</button><button aria-pressed="${W.asiMode==="111"}" data-act="wpick" data-k="asiMode" data-v="111">+1 / +1 / +1</button></div>
        ${W.asiMode==="21"?`<div class="row">+2 ${wSel("asi2",abs.map(a=>[a,ABN[a]]),W.asi2)} +1 ${wSel("asi1",abs.filter(a=>a!==W.asi2).map(a=>[a,ABN[a]]),W.asi1)}</div>`:(abs.length===3?`<div class="muted">+1 en ${abs.map(a=>ABN[a]).join(", ")}</div>`:`<div class="row">${[0,1,2].map(i=>wSel("asiT."+i,AB.map(a=>[a,ABN[a]]),W.asiT[i])).join(" ")}</div>`)}
        ${b?"":(x&&(x.featRef||x.feat)&&W.feat?`<div class="muted" style="font-size:var(--fs-sm)">Don d'origine : ${esc((hb(W.feat)||S.C.feats.find(f=>"srd:"+f.id===W.feat)||{}).name||x.feat||"")}</div>`:`<label class="field"><span>Don d'origine</span>${wSel("feat",wOriginFeats(W.feat),W.feat)}</label>`)}</div>`; }
  }
  if(st==="Espèce"){
    h+=`<p class="muted">L'espèce donne des traits : vision, résistances, capacités spéciales.</p>`+wPick(W,"espece","sp");
    { const xh=hb(W.sp); if(xh) h+=`<div class="panel stack" style="margin-top:12px"><div class="prose">${prose(xh.text)||'<span class="muted">Pas de description.</span>'}</div>${hbFoot(xh)}</div>`; }
    const s=srd("species",W.sp);
    if(s){ const sk=wSpSkills(W), sz=wSizes(W), bgS=wBgSkills(W);
      const ch=(wIsHuman(W)?`<label class="field"><span>Polyvalent : don d'origine</span>${wSel("hFeat",wOriginFeats(W.hFeat),W.hFeat)}</label>`:"")+wLineage(W,s)
        +(sk?`<label class="field"><span>${esc(sk.name)} : une compétence</span>${wSel("spSkill",sk.from.filter(k=>!bgS.includes(k)).map(k=>[k,(S.C.skills.find(x=>x.id===k)||{}).name]),W.spSkill)}</label>`:"")
        +(sz?`<label class="field"><span>Taille</span>${wSel("size",sz.map(v=>[v,v]),W.size)}</label>`:"");
      // les choix d'abord, la lecture des traits ensuite
      h+=(ch?`<div class="panel stack wchoices" style="margin-top:12px"><div class="label">Tes choix</div>${ch}</div>`:"")
        +`<div class="panel stack" style="margin-top:12px">${s.traits.map(t=>`<details class="feat"><summary><span class="nm">${esc(t.name)}</span></summary><div class="prose">${prose(t.text)}</div></details>`).join("")}</div>`; }
  }
  if(st==="Caractéristiques"){
    const b=wBase(W), x=wBonus(W), fin=wAbilities(W);
    h+=`<div class="adv" role="group">${[["std","Tableau standard"],["pts","Achat de points"],["dice","Dés (4d6)"]].map(([k,l])=>`<button aria-pressed="${W.method===k}" data-act="wpick" data-k="method" data-v="${k}">${l}</button>`).join("")}</div>`;
    if(W.method==="std"){ const used=AB.map(a=>W.std[a]).filter(Boolean).map(Number); h+=`<p class="muted" style="font-size:var(--fs-sm)">Répartis 15, 14, 13, 12, 10 et 8. Restent : ${STD_ARRAY.filter((v,i)=>used.filter(u=>u===v).length<1).join(", ")||"—"}</p>`; }
    if(W.method==="pts"){ const spent=AB.reduce((t,a)=>t+PT_COST[+W.pts[a]],0), left=27-spent; h+=`<div class="wpts"><span class="label">Points dépensés</span><b class="num">${spent} / 27</b><span class="${left<0?"warntxt":"muted"}">${left>0?"reste "+left:left===0?"tout est dépensé":"dépassement de "+(-left)}</span></div><p class="muted" style="font-size:var(--fs-sm)">Chaque caractéristique va de 8 à 15 (avant les bonus d'historique). Coût : 9 à 13 = 1 point par cran, 14 = 7, 15 = 9.</p>`; }
    if(W.method==="dice"){ const usedI=AB.map(a=>W.diceAs[a]).filter(x=>x!==undefined&&x!=="").map(Number);
      h+=`<p class="muted" style="font-size:var(--fs-sm)">Six jets de 4d6 (on garde les 3 meilleurs dés), puis répartis les résultats. Les jets virtuels ne se lancent qu'une fois ; avec de vrais dés, saisis tes 6 résultats (3 à 18).</p>
      <div class="row" style="gap:6px;flex-wrap:wrap">${W.dice.map((v,i)=>`<input type="number" min="3" max="18" data-w="dice.${i}" value="${esc(v)}" ${W.rolled?"readonly":""} style="width:58px" aria-label="Résultat ${i+1}"${usedI.includes(i)?' class="used"':""}>`).join("")}
      ${W.rolled?`<span class="muted" style="font-size:var(--fs-sm)">Lancés : ${esc(W.rollBd||"")}</span>`:(W.dice.some(v=>v!=="")?"":`<button class="btn small vroll" data-virtual data-act="wroll">Lancer les 6 jets</button>`)}</div>`;
      const filled=W.dice.filter(v=>v!==""); if(filled.length){ const eq=filled.reduce((t,v)=>t+(PT_EXT[+v]??0),0);
        h+=`<div class="wpts"><span class="label">Équivalent en achat de points</span><b class="num">${eq} / 27</b><span class="${eq>27?"warntxt":"muted"}">${filled.length<6?"("+filled.length+"/6 jets) ":""}${eq>27?"au-delà des 27 points : tirage plus fort que la normale":eq<27?"en dessous des 27 points":"pile dans la norme"}</span></div>`; } }
    const cp=c?c.primary:[];
    h+=`<div class="wabil">${AB.map(a=>{ let inp="";
      if(W.method==="std") inp=wSel("std."+a,STD_ARRAY.filter(v=>!AB.some(z=>z!==a&&+W.std[z]===v)).map(v=>[v,String(v)]),W.std[a]||"","—");
      if(W.method==="pts") inp=`<span class="row" style="gap:4px"><button class="btn small" data-act="wpt" data-a="${a}" data-v="-1" ${+W.pts[a]<=8?"disabled":""}>−</button><b class="num" style="min-width:22px;text-align:center">${W.pts[a]}</b><button class="btn small" data-act="wpt" data-a="${a}" data-v="1" ${+W.pts[a]>=15?"disabled":""}>+</button></span>`;
      if(W.method==="dice") inp=wSel("diceAs."+a,W.dice.map((v,i)=>[i,v===""?"—":String(v)]).filter(([i,v])=>v!=="—"&&!AB.some(z=>z!==a&&String(W.diceAs[z]??"")===String(i))),W.diceAs[a]??"","—");
      return `<div class="wab${cp.includes(a)?" prim":""}"><span class="nm">${ABN[a]}${cp.includes(a)?` <small class="muted">principale</small>`:""}</span>${inp}<span class="muted num">${x[a]?sg(x[a])+" historique":""}</span><b class="num">${b[a]==null?"—":fin[a]} <small class="muted">${b[a]==null?"":sg(Math.floor((fin[a]-10)/2))}</small></b></div>`; }).join("")}</div>`;
  }
  if(st==="Compétences"){ const have=new Set(wBgSkills(W)), spk=wSpSkills(W)?W.spSkill:""; const n=c.skillChoices.count;
    h+=`<p class="muted">Choisis ${n} compétences de ${esc(c.name)} (${W.skills.length}/${n}). Celles de ton historique sont déjà acquises.</p><div class="row" style="flex-wrap:wrap;gap:6px">${c.skillChoices.from.map(s=>{ const k=S.C.skills.find(x=>x.id===s); const bg=have.has(s), sp=!bg&&s===spk; return `<button class="chip" aria-pressed="${bg||sp||W.skills.includes(s)}" ${bg||sp?"disabled":""} data-act="wskill" data-v="${s}">${esc(k?k.name:s)}${bg?" · historique":sp?" · espèce":""}</button>`; }).join("")}</div>`;
    if(wStyle1(W)) h+=`<label class="field" style="margin-top:12px"><span>Style de combat</span>${wSel("style",wStyles(),W.style||"")}</label><div class="muted" style="font-size:var(--fs-sm)">Défense : +1 CA en armure (recommandé). Archerie : +2 aux attaques à distance.</div>`;
    if(wIsHuman(W)&&srd("species",W.sp).traits.some(t=>t.name==="Compétent")) h+=`<label class="field" style="margin-top:12px"><span>Humain · Compétent : une compétence en plus</span>${wSel("extraSkill",S.C.skills.filter(s=>!have.has(s.id)&&s.id!==spk&&!W.skills.includes(s.id)).map(s=>[s.id,s.name]),W.extraSkill)}</label>`;
    { const ne=wExpN(W); if(ne){ const ex=wExp(W); h+=`<div class="label" style="margin-top:12px">Expertise (${ex.length}/${ne})</div><div class="muted" style="font-size:var(--fs-sm)">Ton bonus de maîtrise compte double pour ces compétences.</div><div class="row wexp" style="flex-wrap:wrap;gap:6px">${wProf(W).map(s=>`<button class="chip" aria-pressed="${ex.includes(s)}" data-act="wexp" data-v="${s}">${esc((S.C.skills.find(x=>x.id===s)||{}).name||s)}</button>`).join("")||`<span class="muted">Choisis d'abord tes compétences.</span>`}</div>`; } }
  }
  if(st==="Sorts"){ const cast=wCast(W), nc=wNC(W), np=cast?(cast.prepared||[])[0]||0:0, Dt={cls:c};
    const can=classSpells(Dt,0), l1=classSpells(Dt,null,1);
    const pick=(key,n,list,lab)=>n?`<div class="label" style="margin-top:10px">${lab} (${n})</div><div class="stack">${Array.from({length:n},(_,i)=>wSel(key+"."+i,list.filter(x=>!W[key].some((r,j)=>j!==i&&r===x.ref)).map(x=>[x.ref,x.s.name]),W[key][i]||"")).join("")}</div>`:"";
    h+=pick("can",nc,can,"Sorts mineurs")+pick("spl",np,l1,"Sorts de niveau 1");
    const ni=wInvN(W); if(ni){ const tmp=wDoc(W); h+=`<div class="label" style="margin-top:10px">Manifestation occulte (${ni})</div>`+Array.from({length:ni},(_,i)=>{ const id=W.inv[i]||""; return `<div class="row" style="gap:6px">${wSel("inv."+i,invAvailFor(tmp,1).map(x=>[x.id,x.name]),id)}${INV_CHOICE[id]?wSel("invc."+i,invChoices(tmp,id,W.can),W.invc[i]||"","— Cible —"):""}</div>`; }).join(""); }
  }
  if(st==="Équipement"){ const bgS=srd("backgrounds",W.bg);
    const block=(title,txt,key)=>{ const opts=eqOptions(txt); if(!opts.length) return `<div class="panel"><b>${esc(title)}</b><div class="muted">${esc(txt||"Rien à choisir.")}</div></div>`; const cur=opts.find(o=>o.k===W[key])||opts[0];
      return `<div class="panel stack"><b>${esc(title)}</b><div class="adv" role="group">${opts.map(o=>`<button aria-pressed="${o.k===cur.k}" data-act="wpick" data-k="${key}" data-v="${o.k}">Option ${o.k}${o.items.length?"":" · "+o.gold+" po"}</button>`).join("")}</div>
        ${cur.items.length?`<div class="stack" style="gap:2px">${cur.items.map((it,ix)=>{ const id=key+cur.k+ix; return `<label class="row" style="gap:8px"><input type="checkbox" data-act="weq" data-v="${id}" ${W.eqOff[id]?"":"checked"}>${it.qty>1?it.qty+" × ":""}${esc(it.name)}</label>`; }).join("")}</div>`:""}
        <div class="muted" style="font-size:var(--fs-sm)">${cur.gold} po</div></div>`; };
    h+=`<p class="muted">Suggestion des règles : prends l'un des lots ou l'or à la place. Décoche ce que tu ne veux pas, tout reste modifiable dans l'inventaire.</p>`+block("Classe · "+c.name,c.equipment,"eqC")+(bgS?block("Historique · "+bgS.name,bgS.equipment,"eqB"):`<div class="panel muted">Cet historique ne fait pas partie des règles de base : ajoute son équipement dans l'inventaire après la création.</div>`);
    { const m=wMast(W); if(m.n&&m.cands.length) h+=`<div class="panel stack wmast"><b>Bottes d'arme (${m.list.length}/${m.n})</b><div class="muted" style="font-size:var(--fs-sm)">Les armes dont tu utilises la botte. Tu peux en changer à chaque repos long.</div><div class="row" style="flex-wrap:wrap;gap:6px">${m.cands.map(w=>{ const x=srd("weapons",w); return `<button class="chip" aria-pressed="${m.list.includes(w)}" data-act="wmast" data-v="${w}">${esc(x.name)} · ${esc(x.mastery)}</button>`; }).join("")}</div></div>`; }
  }
  if(st==="Langues"){ const n=wLangN(W), L=wLangs(W), fx=wLangFixed(W);
    h+=`<p class="muted">Tu parles déjà : ${esc(fx.join(", "))}. Choisis ${n} autres langues (${L.length}/${n}).</p><div class="row wlangs" style="flex-wrap:wrap;gap:6px">${LANGS.map(l=>`<button class="chip" aria-pressed="${L.includes(l)}" data-act="wlang" data-v="${esc(l)}">${esc(l)}</button>`).join("")}</div>
      <div class="muted" style="font-size:var(--fs-sm);margin-top:10px">Les langues rares se décident avec ton MJ : tu pourras les ajouter dans la fiche.</div>`;
  }
  if(st==="Détails"){
    h+=`<div class="field"><span>Alignement (facultatif)</span><div class="row" style="gap:6px">${wSel("alO",[["Loyal","Loyal"],["Neutre","Neutre"],["Chaotique","Chaotique"]],W.alO,"— Ordre —")}${wSel("alM",[["bon","Bon"],["neutre","Neutre"],["mauvais","Mauvais"]],W.alM,"— Morale —")}</div>${wAlign(W)?`<span class="muted" style="font-size:var(--fs-sm)">${esc(wAlign(W))}</span>`:""}</div>
      <label class="field"><span>Notes (apparence, personnalité, histoire)</span><textarea data-w="notes" style="min-height:120px">${esc(W.notes)}</textarea></label>`;
  }
  return h; }
function wPreview(W){ const c=wCls(W); let pv="";
  if(c){ try{ const d=wDoc(W), D=derive(d); pv=`<div class="panel stack wprev"><div class="label">Aperçu</div><b>${esc(W.name||"Nouveau personnage")}</b><div class="muted" style="font-size:var(--fs-sm)">${esc([(srd("species",W.sp)||hb(W.sp)||{}).name,c.name+" 1",(wBg(W)||{}).name].filter(Boolean).join(" · "))}</div>
    <div class="wstats"><span><small class="label">PV</small><b class="num">${D.hpMax}</b></span><span><small class="label">CA</small><b class="num">${D.ac}</b></span><span><small class="label">Init.</small><b class="num">${sg(D.init)}</b></span><span><small class="label">Perc. passive</small><b class="num">${D.passive}</b></span></div>
    <div class="wabmini">${AB.map(a=>`<span><small>${ABS[a]}</small><b class="num">${D.abEff[a]}</b><small class="num">${sg(D.mods[a])}</small></span>`).join("")}</div>
    <div class="muted wsaves" style="font-size:var(--fs-sm)">Sauvegardes : ${AB.filter(a=>D.saves[a].prof).map(a=>ABN[a]).join(", ")}</div></div>`; }catch(e){ pv=""; } }
  return pv||`<div class="panel stack wprev"><div class="label">Aperçu</div><b>${esc(W.name||"Nouveau personnage")}</b><div class="muted" style="font-size:var(--fs-sm)">La fiche se calcule dès que la classe est choisie.</div></div>`; }
function wLines(W){ return [...wSteps(W).filter(s=>s!=="Identité"),"Détails"]; }
function wLineMsg(W,st){ const i=wSteps(W).indexOf(st); return i<0?"":wCheck(W,i); }
function wLineVal(W,st){ const c=wCls(W), nm=id=>(S.C.skills.find(k=>k.id===id)||{}).name||id, pl=(n,w)=>n+" "+w+(n>1?"s":"");
  if(st==="Classe"){ const o=wOrder(W); return c?c.name+(o?" · "+o.name:""):""; }
  if(st==="Historique"){ const b=wBg(W); if(!b) return ""; const x=wBonus(W), bon=AB.filter(a=>x[a]).map(a=>"+"+x[a]+" "+ABS[a]).join(", "); return b.name+(bon?" · "+bon:""); }
  if(st==="Espèce"){ const s=srd("species",W.sp)||hb(W.sp); if(!s) return ""; const def=LINEAGES[String(W.sp||"").replace(/^srd:/,"")], o=def&&def.opts[W.lin]; return s.name+(o?" · "+o.name:""); }
  if(st==="Caractéristiques"){ const b=wBase(W), f=wAbilities(W); return AB.some(a=>b[a]==null)?({std:"Tableau standard",pts:"Achat de points",dice:"Dés (4d6)"})[W.method]:AB.map(a=>ABS[a]+" "+f[a]).join(" · "); }
  if(st==="Compétences"){ if(!c) return ""; const l=[...W.skills,W.extraSkill].filter(Boolean); return l.length?l.map(nm).join(", "):"0 / "+c.skillChoices.count; }
  if(st==="Sorts"){ const n=[...W.can,...W.spl].filter(Boolean).length; return n?pl(n,"sort")+" choisi"+(n>1?"s":""):""; }
  if(st==="Langues") return [...wLangFixed(W),...wLangs(W)].join(", ");
  if(st==="Équipement"){ if(!c) return ""; const e=wEqItems(W); return pl(e.items.length,"objet")+" · "+e.gold+" po"; }
  if(st==="Détails") return [wAlign(W),String(W.notes||"").trim()?"notes":""].filter(Boolean).join(" · ")||"Alignement, notes (facultatif)";
  return ""; }
// Compteur de ce qui reste à faire et bouton d'état : tant qu'il manque quelque chose, le bouton est grisé et le nomme
function wFoot(W){ const n=wNeeds(W), names=n.map(x=>x.name==="Identité"?"nom":x.name.toLowerCase());
  return `<div class="wfootbar" id="wfoot"><div class="wleft" role="status">${n.length?`<b>Reste à faire (${n.length})</b> <span class="muted">${esc(names.join(", "))}</span>`:`<span class="muted">Tout est choisi.</span>`}</div><button class="btn primary" data-act="wcreate" ${n.length?"disabled":""}>${esc(n.length?n[0].msg:"Créer le personnage")}</button></div>`; }
function viewWizard(){ const W=S.W, c=wCls(W), lv=+W.level||1;
  const rows=wLines(W).map(st=>{ const msg=wLineMsg(W,st), val=wLineVal(W,st), lock=!c&&(st==="Compétences"||st==="Équipement");
    return `<button class="wline${msg?" todo":" done"}" data-act="wopen" data-v="${esc(st)}" ${lock?"disabled":""}><span class="nm">${esc(st)}</span><span class="val">${val?esc(val):`<span class="muted">—</span>`}${msg?`<small class="${lock?"muted":"warntxt"}">${esc(msg)}</small>`:""}</span><span class="st" aria-hidden="true">${msg||st==="Détails"?"":"✓"}</span></button>`; }).join("");
  return `<div class="list-head"><div><h1>Nouveau personnage</h1><div class="muted">Chaque ligne ouvre ses choix. Fais-les dans l'ordre que tu veux.</div></div><button class="btn ghost" data-act="wcancel">Annuler</button></div>
    <div class="wz"><section class="stack" style="min-width:0">
      <div class="wid"><label class="field"><span>Nom (obligatoire)</span><input type="text" data-w="name" value="${esc(W.name)}" maxlength="80" autocomplete="off"></label><label class="field"><span>Joueur</span><input type="text" data-w="player" value="${esc(W.player)}"></label><label class="field"><span>Niveau de départ</span><input type="number" min="1" max="20" data-w="level" value="${esc(W.level)}"></label></div>
      ${lv>1?`<div class="muted" style="font-size:var(--fs-sm)">Après la création, l'assistant de montée de niveau s'ouvrira pour chaque niveau jusqu'au niveau ${lv}.</div>`:""}
      <div class="wlines">${rows}</div>${wFoot(W)}</section>${wPreview(W)}</div>`; }
// Fenêtre d'une ligne : ses choix, ce qui manque encore, et un bouton pour revenir à la page
function wModal(){ const W=S.W, st=W.open, msg=wLineMsg(W,st);
  return `<div class="picker" data-act="wclose"><div class="box wbox" role="dialog" aria-label="${esc(st)}" style="grid-template-rows:auto minmax(0,1fr) auto;max-width:760px">
    ${winHead(esc(st),"wclose")}<div class="stack wbody">${wStepBody(W,st)}</div>
    ${winFoot(`<span class="warntxt wmsg" role="status" style="font-size:var(--fs-sm);flex:1;align-self:center">${esc(msg)}</span><button class="btn primary" data-act="wclose">${msg?"Fermer":"Valider"}</button>`)}</div></div>`; }
function wCreate(){
  const W=S.W, c=wCls(W); const id="perso_"+uid(); const d=wDoc(W); S.docs[id]=d; d.armor="none"; d.shield=false;
  const eq=wEqItems(W); for(const it of eq.items) d.bag.push({id:uid(),name:it.name,qty:it.qty,note:""}); d.gold={po:eq.gold};
  for(const b of d.bag){ const e=eqInfo(b); if(e.type==="weapon"&&!d.attacks.some(a=>a.weapon==="srd:"+e.w.id)) d.attacks.push({id:uid(),name:e.w.name,weapon:"srd:"+e.w.id,ability:"auto",prof:true}); }
  { const m=wMast(W); if(m.n&&Array.isArray(W.mast)) d.masteries=m.list; } // sans retouche : la fiche garde son choix par défaut (premières armes)
  const arm=d.bag.find(b=>eqInfo(b).type==="armor"); if(arm) eqSet(d,"corps",arm.id);
  const sh=d.bag.find(b=>eqInfo(b).type==="shield"); if(sh&&(c.armor||[]).includes("bouclier")) eqSet(d,"mainS",sh.id);
  const D=derive(d); d.hp={cur:D.hpMax,temp:0};
  touch(id); S.cur=id; S.view="sheet"; S.tab="jeu"; const lv=Math.max(1,Math.min(20,+W.level||1)); S.W=null;
  for(const hid of W.catMade||[]) if(S.docs[hid]&&S.docs[hid].pending&&!hbUsed(hid)) removeDoc(hid);
  if(lv>1){ S.lvlTarget={id,to:lv}; S.pending={type:"lvl",hp:"avg"}; }
  render(); if(lv<=1) rvStart(id);
}
function newNameModal(){ return `<div class="picker" data-act="newCancel"><div class="box" role="dialog" aria-label="Fiche vide" style="grid-template-rows:auto auto auto;max-width:420px">
    ${winHead("Fiche vide","newCancel")}
    <form class="stack" id="nnform" data-form="newname" novalidate><label class="field"><span>Nom du personnage</span><input id="nn-name" type="text" maxlength="80" style="width:100%" autocomplete="off"></label>
      <div id="nn-err" class="warntxt" role="alert" style="font-size:var(--fs-sm)"></div><div class="muted" style="font-size:var(--fs-sm)">La fiche est créée vide : tu la remplis à la main dans l'onglet de construction.</div></form>
    ${winFoot(`<button class="btn primary" type="submit" form="nnform">Créer la fiche</button>`)}</div></div>`; }
function newChar(name){
  name=String(name||"").trim(); if(!name) return;
  const id="perso_"+uid();
  S.docs[id]={type:"perso",name,level:1,classId:"",abilities:{for:10,dex:10,con:10,int:10,sag:10,cha:10},skills:{},hp:{cur:8,temp:0},attacks:[],spells:[],feats:[],features:[],invocations:[],conditions:[],gold:{po:0},updatedAt:Date.now()};
  touch(id); S.cur=id; S.view="sheet"; S.tab="build"; S.unlockEdit=true; render();
}
function applyRest(kind){
  const ch=cur(), D=derive(ch);
  if(ch.hp&&(+ch.hp.cur||0)<=0){ addLog({label:"Repos impossible",total:"0 PV",bd:"Il faut au moins 1 PV pour commencer un repos.",kind:"info"}); return false; }
  ch.turn={}; if(S.T){ S.T.castDone=null; S.T.castTurn=null; }
  ch.pactUsed=0;
  ch.resUsed=ch.resUsed||{};
  for(const r of D.res){
    if(kind==="long"||r.recharge==="court"||(r.recharge==="long_court5"&&D.L>=5)) ch.resUsed[r.id]=0;
    else if(r.recharge==="long_court1"||r.recharge==="court_partiel") ch.resUsed[r.id]=Math.max(0,(ch.resUsed[r.id]||0)-1);
  }
  if(kind==="long"){
    ch.hpMaxBonus=0; ch.slotsUsed={}; ch.hp={cur:D.hpBase,temp:0}; ch.hdUsed=0; ch.exhaustion=Math.max(0,(+ch.exhaustion||0)-1); ch.death={s:0,f:0};
    const sp=srd("species",ch.species); if(sp&&sp.traits.some(t=>t.name==="Ingénieux")) ch.inspiration=true;
  }
  for(const c of ch.counters||[]) if(c&&(c.recharge==="court"||(kind==="long"&&c.recharge==="long"))) c.cur=+c.max||0; // compteurs maison
  const cl=chargeRest(ch,kind); if(cl.length) addLog({label:"Charges récupérées",total:"✓",bd:cl.join(", "),kind:"info",quiet:true});
  addLog({label:kind==="long"?"Repos long terminé":"Repos court terminé",total:"✓",bd:kind==="long"?"PV, dés de vie, emplacements et ressources restaurés.":"Emplacements de pacte et ressources de repos court restaurés.",kind:"info"});
}
function saveFile(fname,data,type){
  const local=()=>{ try{ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([data],{type:type+";charset=utf-8"})); a.download=fname; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); }catch(e){ setBanner("Le téléchargement n'est pas disponible ici."); } };
  PLATFORM.download(fname,data).then(ok=>{ if(!ok) local(); });
}
function saveApp(){
  const c=PAGE_CLONE.cloneNode(true);
  c.querySelectorAll("script:not([data-keep]),base,iframe").forEach(n=>n.remove());
  const docs={}; for(const [k,v] of Object.entries(S.docs)) if(v&&["perso","hb","prefs"].includes(v.type)) docs[k]=v;
  const sd=c.querySelector("#seed-docs"); if(sd) sd.textContent=JSON.stringify({at:Date.now(),dataVersion:DATA_VERSION,docs}).replace(/</g,"\\u003c");
  const head=c.querySelector("head");
  if(head&&!c.querySelector("meta[name=viewport]")){ const m=document.createElement("meta"); m.setAttribute("name","viewport"); m.setAttribute("content","width=device-width,initial-scale=1,viewport-fit=cover"); head.prepend(m); }
  if(head&&!c.querySelector("meta[charset]")){ const m=document.createElement("meta"); m.setAttribute("charset","utf-8"); head.prepend(m); }
  c.setAttribute("lang","fr");
  saveFile("dnd-compagnon-personnel.html","<!doctype html>\n"+c.outerHTML,"text/html");
  const n=Object.values(docs).filter(d=>d.type==="perso").length;
  setBanner(`Copie personnelle enregistrée avec ${n} personnage${n>1?"s":""}. Elle contient aussi les portraits, notes et contenus personnalisés : garde-la privée ou partage-la en connaissance de cause.`);
}
function exportChar(id){
  const ch=S.docs[id]; const refs=new Set();
  JSON.stringify(ch).replace(/"hb:([a-z0-9_-]+)"/gi,(m,k)=>refs.add(k));
  for(const b of ch.bag||[]){ const r=b.ref||matchItem(b.name); if(r&&r.startsWith("hb:")) refs.add(r.slice(3)); }
  const pack={registre:1,dataVersion:DATA_VERSION,perso:ch,hb:[...refs].map(k=>Object.assign({_id:k},S.docs[k])).filter(x=>x.type)};
  const data=JSON.stringify(pack,null,1);
  saveFile((ch.name||"personnage").replace(/[^\w\u00C0-\u00FF -]/g,"")+".json", data, "application/json");
}
function importFail(detail){ const e=new Error("import_invalid"); e.detail=detail; throw e; }
function plainObject(v){ return !!v&&typeof v==="object"&&!Array.isArray(v); }
function validateImportTree(v,depth=0){
  if(depth>30) importFail("Le fichier est trop profondément imbriqué.");
  if(typeof v==="string"&&v.length>2*1024*1024) importFail("Un champ texte est anormalement volumineux.");
  if(!v||typeof v!=="object") return;
  if(Array.isArray(v)){ if(v.length>5000) importFail("Une liste contient trop d'éléments."); for(const x of v) validateImportTree(x,depth+1); return; }
  for(const [k,x] of Object.entries(v)){ if(["__proto__","prototype","constructor"].includes(k)) importFail("Le fichier contient une propriété interdite."); validateImportTree(x,depth+1); }
}
function validateImportPack(pack){
  if(!plainObject(pack)) importFail("Le fichier ne contient pas un export de personnage.");
  validateImportTree(pack);
  if(pack.registre!==undefined&&pack.registre!==1) importFail("Ce fichier ne vient pas de cette application.");
  if(!plainObject(pack.perso)) importFail("La fiche de personnage est absente ou illisible.");
  const ch=pack.perso;
  if(typeof ch.name!=="string"||!ch.name.trim()||ch.name.length>200) importFail("Le nom du personnage est absent ou invalide.");
  if(!Number.isInteger(+ch.level)||+ch.level<1||+ch.level>20) importFail("Le niveau doit être compris entre 1 et 20.");
  if(!plainObject(ch.abilities)) importFail("Les caractéristiques sont absentes.");
  for(const a of AB) if(!Number.isFinite(+ch.abilities[a])||+ch.abilities[a]<1||+ch.abilities[a]>30) importFail(`La caractéristique ${ABS[a]} est invalide.`);
  if(ch.type!==undefined&&ch.type!=="perso") importFail("Le document importé n'est pas un personnage.");
  for(const k of ["attacks","bag","conditions","counters","feats","features","invocations","items","spells"]){ if(ch[k]!==undefined&&!Array.isArray(ch[k])) importFail(`Le champ « ${k} » doit être une liste.`); }
  if(ch.layout!==undefined&&(!plainObject(ch.layout)||(ch.layout.order!==undefined&&(!Array.isArray(ch.layout.order)||ch.layout.order.length>50||ch.layout.order.some(x=>typeof x!=="string"))))) importFail("La disposition d'« À la table » est invalide.");
  if(ch.layout?.tiles!==undefined&&(!plainObject(ch.layout.tiles)||Object.values(ch.layout.tiles).some(v=>!Array.isArray(v)||v.length>16||v.some(x=>typeof x!=="string")))) importFail("Les tuiles d'« À la table » sont invalides.");
  if(ch.companion!==undefined&&(!plainObject(ch.companion)||(ch.companion.name!==undefined&&(typeof ch.companion.name!=="string"||ch.companion.name.length>60))||(ch.companion.ac!==undefined&&!Number.isFinite(ch.companion.ac))||(ch.companion.hp!==undefined&&(!plainObject(ch.companion.hp)||!Number.isFinite(ch.companion.hp.cur)||!Number.isFinite(ch.companion.hp.max))))) importFail("Le compagnon est invalide.");
  // Lignage (chantier 13), défenses et effets en cours (chantier 5)
  if(ch.masteries!==undefined&&(!Array.isArray(ch.masteries)||ch.masteries.length>20||ch.masteries.some(x=>typeof x!=="string"||x.length>60))) importFail("Les bottes d'arme sont invalides.");
  if(ch.lineage!==undefined&&(!plainObject(ch.lineage)||typeof ch.lineage.id!=="string"||ch.lineage.id.length>30||(ch.lineage.ab!==undefined&&!["int","sag","cha"].includes(ch.lineage.ab)))) importFail("Le lignage ou l'ascendance est invalide.");
  if(ch.defenses!==undefined&&(!plainObject(ch.defenses)||Object.entries(ch.defenses).some(([k,v])=>!["res","imm","vul","cond","off"].includes(k)||!Array.isArray(v)||v.length>40||v.some(x=>typeof x!=="string"||x.length>40)))) importFail("Les défenses sont invalides.");
  if(ch.effects!==undefined&&(!Array.isArray(ch.effects)||ch.effects.length>50||ch.effects.some(e=>!plainObject(e)||typeof e.name!=="string"||!e.name||e.name.length>80||["dur","src","note","id"].some(k=>e[k]!==undefined&&typeof e[k]!=="string")))) importFail("Les effets en cours sont invalides.");
  if(ch.speeds!==undefined&&(!plainObject(ch.speeds)||Object.entries(ch.speeds).some(([k,v])=>!["escalade","nage","vol","fouissement"].includes(k)||typeof v!=="number"||!(v>=0&&v<=60)))) importFail("Les autres déplacements (escalade, nage…) sont invalides.");
  if(ch.layout?.width!==undefined&&(!plainObject(ch.layout.width)||Object.keys(ch.layout.width).length>40||Object.values(ch.layout.width).some(v=>![1,2,3,4].includes(v)))) importFail("Les largeurs des blocs d'« À la table » sont invalides.");
  if(ch.layout?.titles!==undefined&&(!plainObject(ch.layout.titles)||Object.keys(ch.layout.titles).length>40||Object.values(ch.layout.titles).some(v=>typeof v!=="string"||v.length>60))) importFail("Les titres des blocs d'« À la table » sont invalides.");
  if(ch.layout?.hidden!==undefined&&(!Array.isArray(ch.layout.hidden)||ch.layout.hidden.length>30||ch.layout.hidden.some(x=>typeof x!=="string"))) importFail("Les blocs retirés d'« À la table » sont invalides.");
  if(ch.layout?.pos!==undefined&&(!plainObject(ch.layout.pos)||Object.keys(ch.layout.pos).length>40||Object.values(ch.layout.pos).some(p=>!plainObject(p)||![0,1,2,3].includes(p.c)||!["top","below","same","row","bottom"].includes(p.t)||(p.a!==undefined&&typeof p.a!=="string")||(p.px!==undefined&&!(Number.isFinite(p.px)&&Math.abs(p.px)<5000))||(p.k!==undefined&&!(Number.isInteger(p.k)&&p.k>=0&&p.k<20))))) importFail("Les positions des blocs d'« À la table » sont invalides.");
  if(ch.layout?.cols!==undefined&&(!plainObject(ch.layout.cols)||Object.keys(ch.layout.cols).length>10||Object.values(ch.layout.cols).some(n=>![1,2,3,4].includes(n)))) importFail("Les tuiles par rangée des blocs d'« À la table » sont invalides.");
  if(Array.isArray(ch.layout?.custom)&&ch.layout.custom.some(b=>plainObject(b)&&b.park!==undefined&&(!Array.isArray(b.park)||b.park.length>16||b.park.some(x=>typeof x!=="string")))) importFail("Les blocs personnalisés d'« À la table » sont invalides.");
  if(ch.layout?.shown!==undefined&&(!Array.isArray(ch.layout.shown)||ch.layout.shown.length>10||ch.layout.shown.some(x=>typeof x!=="string"))) importFail("Les blocs affichés d'« À la table » sont invalides.");
  if(ch.layout?.pvTile!==undefined&&(typeof ch.layout.pvTile!=="string"||ch.layout.pvTile.length>80)) importFail("La tuile de la carte Points de vie est invalide.");
  for(const k of ["mag","grav"]) if(ch.layout?.[k]!==undefined&&typeof ch.layout[k]!=="boolean") importFail("Les réglages de placement d'« À la table » sont invalides.");
  if(ch.layout?.custom!==undefined&&(!Array.isArray(ch.layout.custom)||ch.layout.custom.length>20||ch.layout.custom.some(b=>!plainObject(b)||typeof b.id!=="string"||typeof b.name!=="string"||b.name.length>60||!Array.isArray(b.tiles||[])||(b.tiles||[]).length>16))) importFail("Les blocs personnalisés d'« À la table » sont invalides.");
  if(Array.isArray(ch.counters)&&(ch.counters.length>100||ch.counters.some(c=>!plainObject(c)||typeof c.id!=="string"||!c.id||typeof c.name!=="string"||c.name.length>60||!Number.isFinite(+c.cur)||+c.cur<0||!Number.isFinite(+c.max)||+c.max<0||(c.recharge!==undefined&&!["court","long"].includes(c.recharge))))) importFail("Les compteurs sont invalides.");
  if(ch.hp!==undefined&&(!plainObject(ch.hp)||!Number.isFinite(+ch.hp.cur)||+ch.hp.cur<0||!Number.isFinite(+(ch.hp.temp||0))||+(ch.hp.temp||0)<0)) importFail("Les points de vie sont invalides.");
  const hb=pack.hb===undefined?[]:pack.hb; if(!Array.isArray(hb)||hb.length>500) importFail("Le contenu personnalisé est invalide ou trop volumineux.");
  const ids=new Set(); for(const h of hb){
    if(!plainObject(h)||typeof h._id!=="string"||!/^[a-z0-9_-]{1,120}$/i.test(h._id)) importFail("Un contenu personnalisé possède un identifiant invalide.");
    if(ids.has(h._id)) importFail("Le fichier contient deux contenus personnalisés avec le même identifiant."); ids.add(h._id);
    if(h.type!=="hb"||typeof h.name!=="string"||!h.name.trim()) importFail("Un contenu personnalisé est incomplet.");
  }
  return hb;
}
function importPack(pack){
  const v=+(pack.dataVersion||1); if(v>DATA_VERSION){ const e=new Error("version"); e.dataVersion=v; throw e; }
  const hb=validateImportPack(pack);
  const map={};
  for(const h of hb){ const nid="hb_"+uid(); map[h._id]=nid; const d=Object.assign({},h); delete d._id; d.type="hb"; S.docs[nid]=d; touch(nid); }
  let s=JSON.stringify(pack.perso).replace(/"hb:([a-z0-9_-]+)"/gi,(m,k)=>map[k]?`"hb:${map[k]}"`:m);
  const ch=JSON.parse(s); ch.type="perso";
  const id="perso_"+uid(); S.docs[id]=ch; touch(id); return id;
}
