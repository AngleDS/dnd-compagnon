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
function wIsHuman(W){ const s=srd("species",W.sp); return !!(s&&s.traits.some(t=>t.name==="Polyvalent")); }
function wOriginFeats(){ return [...S.C.feats.filter(f=>/origine/i.test(f.category||"")).map(f=>["srd:"+f.id,f.name]),...hbs("don").map(h=>["hb:"+h._id,h.name+hbTag(h)]),...catOpts("don",e=>e.cat==="origines"||e.cat==="don sombre")]; }
function wBase(W){ const o={};
  for(const a of AB){ if(W.method==="std") o[a]=W.std[a]?+W.std[a]:null; else if(W.method==="pts") o[a]=+W.pts[a]||8; else { const i=W.diceAs[a]; o[a]=i!==undefined&&i!==""&&W.dice[+i]!==""?+W.dice[+i]:null; } }
  return o; }
function wBonus(W){ const o={}; for(const a of AB) o[a]=0; const abs=wBgAbs(W);
  if(W.asiMode==="21"){ if(W.asi2) o[W.asi2]+=2; if(W.asi1&&W.asi1!==W.asi2) o[W.asi1]+=1; }
  else { const list=abs.length===3?abs:W.asiT.filter(Boolean); for(const a of new Set(list)) o[a]+=1; }
  return o; }
function wAbilities(W){ const b=wBase(W), x=wBonus(W), o={}; for(const a of AB) o[a]=Math.min(20,(b[a]??10)+x[a]); return o; }
function wCast(W){ const c=wCls(W); return c&&c.casting?c.casting:null; }
function wSteps(W){ const c=wCls(W), cast=wCast(W); const st=["Classe","Historique","Espèce","Caractéristiques","Compétences"];
  if((cast&&((cast.cantrips||[])[0]||(cast.prepared||[])[0]))||(c&&c.id==="occultiste")) st.push("Sorts"); st.push("Équipement","Identité"); return st; }
function wEqItems(W){ const c=wCls(W), out=[]; let gold=0; const add=(txt,key)=>{ const opts=eqOptions(txt); const cur=opts.find(o=>o.k===W[key])||opts[0]; if(!cur) return; gold+=cur.gold; cur.items.forEach((it,ix)=>{ if(!W.eqOff[key+cur.k+ix]) out.push(it); }); };
  if(c) add(c.equipment,"eqC"); const bgS=srd("backgrounds",W.bg); if(bgS) add(bgS.equipment,"eqB"); return {items:out,gold}; }
function wDoc(W){ const c=wCls(W); const skills={}; for(const s of [...W.skills,...wBgSkills(W),W.extraSkill].filter(Boolean)) skills[s]=1;
  const feats=[...new Set([wBgFeat(W), wIsHuman(W)?W.hFeat:"", wStyle1(W)?W.style:""].filter(Boolean))];
  const bgS=srd("backgrounds",W.bg);
  return {type:"perso",name:W.name||"Nouveau personnage",player:W.player||"",level:1,classId:W.cls,species:W.sp,background:W.bg,abilities:wAbilities(W),skills,
    hp:{cur:1,temp:0},attacks:[],spells:[...W.can,...W.spl].filter(Boolean).map(r=>({ref:r,prepared:true})),feats,features:[],invocations:W.inv.map((id,i)=>id?id+(W.invc[i]?"|"+W.invc[i]:""):"").filter(Boolean),
    conditions:[],gold:{po:0},tools:[bgS?bgS.tools:(hb(W.bg)||{}).tools,c&&c.tools].filter(Boolean).join(" ; "),alignment:wAlign(W),notes:W.notes||"",hpMode:"auto",bag:[],updatedAt:Date.now(),
    ...(()=>{ const its=wEqItems(W).items.map(it=>eqInfo({name:it.name})); const a=its.find(e=>e.type==="armor"), sh=its.find(e=>e.type==="shield"); return {armor:a?"srd:"+a.a.id:"none",shield:!!(sh&&c&&(c.armor||[]).includes("bouclier"))}; })()}; }
function wCheck(W,i){ const st=wSteps(W)[i], c=wCls(W);
  if(st==="Classe") return c?"":"Choisis une classe.";
  if(st==="Historique"){ if(!W.bg) return "Choisis un historique."; if(W.asiMode==="21"&&(!W.asi2||!W.asi1||W.asi1===W.asi2)) return "Choisis +2 et +1 sur deux caractéristiques différentes."; if(W.asiMode==="111"&&wBgAbs(W).length!==3&&new Set(W.asiT.filter(Boolean)).size<3) return "Choisis trois caractéristiques différentes."; if(!srd("backgrounds",W.bg)&&!W.feat) return "Choisis le don d'origine de cet historique."; return ""; }
  if(st==="Espèce"){ if(!W.sp) return "Choisis une espèce."; if(wIsHuman(W)&&!W.hFeat) return "Humain : choisis ton don d'origine (Polyvalent)."; return ""; }
  if(st==="Caractéristiques"){ const b=wBase(W); if(AB.some(a=>b[a]==null)) return "Attribue une valeur à chaque caractéristique."; if(W.method==="std"){ const v=AB.map(a=>+W.std[a]).sort((x,y)=>y-x); if(v.join()!==STD_ARRAY.join()) return "Chaque valeur du tableau standard ne s'utilise qu'une fois."; } if(W.method==="dice"){ const ix=AB.map(a=>W.diceAs[a]); if(new Set(ix).size<6) return "Chaque résultat ne s'utilise qu'une fois."; }
    if(W.method==="pts"&&AB.reduce((t,a)=>t+PT_COST[+W.pts[a]],0)>27) return "Tu dépasses les 27 points."; return ""; }
  if(st==="Compétences"){ const n=c.skillChoices.count; if(W.skills.length!==n) return `Choisis ${n} compétences de classe.`; if(wIsHuman(W)&&srd("species",W.sp).traits.some(t=>t.name==="Compétent")&&!W.extraSkill) return "Humain : choisis ta compétence en plus (Compétent)."; if(wStyle1(W)&&!W.style) return "Choisis ton style de combat."; return ""; }
  if(st==="Sorts"){ const cast=wCast(W); const nc=cast?(cast.cantrips||[])[0]||0:0, np=cast?(cast.prepared||[])[0]||0:0; if(W.can.filter(Boolean).length<nc) return `Choisis ${nc} sorts mineurs.`; if(W.spl.filter(Boolean).length<np) return `Choisis ${np} sorts de niveau 1.`; if(c.id==="occultiste"&&W.inv.filter(Boolean).length<wInvN(W)) return "Choisis ta manifestation occulte."; if(W.inv.some((id,i)=>id&&INV_CHOICE[id]&&!W.invc[i])) return "Choisis la cible de ta manifestation."; return ""; }
  return ""; }
function wInvN(W){ const c=wCls(W); if(!c||c.id!=="occultiste") return 0; const col=c.columns.find(x=>x.label.startsWith("Manifestations")); return col?+col.values[0]||0:0; }
function wCards(list,cur,key){ return `<div class="wcards">${list.map(([v,t,sub])=>`<button class="wcard" aria-pressed="${v===cur}" data-act="wpick" data-k="${key}" data-v="${esc(v)}"><b>${esc(t)}</b>${sub?`<span class="muted">${esc(sub)}</span>`:""}</button>`).join("")}</div>`; }
function wSel(key,opts,cur,ph){ return `<select data-w="${key}"><option value="">${esc(ph||"— Choisir —")}</option>${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(cur)?"selected":""}>${esc(l)}</option>`).join("")}</select>`; }
function viewWizard(){
  const W=S.W, steps=wSteps(W); W.step=Math.min(W.step,steps.length-1); const st=steps[W.step], c=wCls(W);
  let h="";
  if(st==="Classe"){
    h+=`<p class="muted">La classe définit ton rôle : dé de vie, maîtrises, sorts et aptitudes.</p>`+wCards([...S.C.classes.map(x=>[x.id,x.name,`d${x.hitDie} · ${x.primary.map(a=>ABN[a]).join(" ou ")}${x.casting?" · sorts":""}`]),...hbs("classe").map(x=>["hb:"+x._id,x.name,"hors SRD · d"+(+x.hitDie||8)+(x.pending?" · à remplir":"")]),...catAll().filter(e=>e.k==="classe"&&!catHb(e)).map(e=>["cat:"+e.id,e.n,"hors SRD · "+catShort(e.b)+" · à remplir"])],W.cls,"cls")+wNhBtn(W,"classe","cls","Nouvelle classe hors SRD");
    if(c) h+=`<div class="panel stack" style="margin-top:12px"><b>${esc(c.name)}</b><div class="muted" style="font-size:var(--fs-sm)">Dé de vie d${c.hitDie} · Sauvegardes : ${c.saves.map(a=>ABN[a]).join(", ")} · Armures : ${esc((c.armor||[]).join(", ")||"aucune")} · Armes : ${esc(c.weapons||"")}${c.tools?" · Outils : "+esc(c.tools):""}</div></div>`;
  }
  if(st==="Historique"){
    const list=[...S.C.backgrounds.map(b=>["srd:"+b.id,b.name,b.abilities.map(a=>ABS[a]).join(", ")+" · "+b.feat]),...hbs("historique").map(x=>["hb:"+x._id,x.name,x.pending?"hors SRD · à remplir":"hors SRD"]),...catAll().filter(e=>e.k==="historique"&&!catHb(e)).map(e=>["cat:"+e.id,e.n,"hors SRD · "+catShort(e.b)+" · à remplir"])];
    h+=`<p class="muted">L'historique donne des bonus de caractéristiques, un don d'origine, 2 compétences et un outil.</p>`+wCards(list,W.bg,"bg")+wNhBtn(W,"historique","bg","Nouvel historique hors SRD");
    if(W.bg){ const abs=wBgAbs(W), b=srd("backgrounds",W.bg), x=hb(W.bg);
      h+=`<div class="panel stack" style="margin-top:12px">${b?`<div class="muted" style="font-size:var(--fs-sm)">Don : ${esc(b.feat)} · Compétences : ${b.skills.map(s=>(S.C.skills.find(k=>k.id===s)||{}).name).join(", ")} · Outil : ${esc(b.tools||"")}</div>`:`<div class="muted" style="font-size:var(--fs-sm)">${esc(x&&x.text||"")}</div>`}
        <div class="label">Bonus de caractéristiques</div>
        <div class="adv" role="group"><button aria-pressed="${W.asiMode==="21"}" data-act="wpick" data-k="asiMode" data-v="21">+2 et +1</button><button aria-pressed="${W.asiMode==="111"}" data-act="wpick" data-k="asiMode" data-v="111">+1 / +1 / +1</button></div>
        ${W.asiMode==="21"?`<div class="row">+2 ${wSel("asi2",abs.map(a=>[a,ABN[a]]),W.asi2)} +1 ${wSel("asi1",abs.filter(a=>a!==W.asi2).map(a=>[a,ABN[a]]),W.asi1)}</div>`:(abs.length===3?`<div class="muted">+1 en ${abs.map(a=>ABN[a]).join(", ")}</div>`:`<div class="row">${[0,1,2].map(i=>wSel("asiT."+i,AB.map(a=>[a,ABN[a]]),W.asiT[i])).join(" ")}</div>`)}
        ${b?"":`<label class="field"><span>Don d'origine</span>${wSel("feat",wOriginFeats(),W.feat)}</label>${wNhBtn(W,"don","feat","Nouveau don hors SRD")}`}</div>`; }
  }
  if(st==="Espèce"){
    const list=[...S.C.species.map(x=>["srd:"+x.id,x.name,x.traits.map(t=>t.name).join(", ")]),...hbs("espece").map(x=>["hb:"+x._id,x.name,x.pending?"hors SRD · à remplir":"hors SRD"]),...catAll().filter(e=>e.k==="espece"&&!catHb(e)).map(e=>["cat:"+e.id,e.n,"hors SRD · "+catShort(e.b)+" · à remplir"])];
    h+=`<p class="muted">L'espèce donne des traits : vision, résistances, capacités spéciales.</p>`+wCards(list,W.sp,"sp")+wNhBtn(W,"espece","sp","Nouvelle espèce hors SRD");
    { const xh=hb(W.sp); if(xh) h+=`<div class="panel stack" style="margin-top:12px"><div class="prose">${prose(xh.text)||'<span class="muted">Pas de description.</span>'}</div>${hbFoot(xh)}</div>`; }
    const s=srd("species",W.sp);
    if(s) h+=`<div class="panel stack" style="margin-top:12px">${s.traits.map(t=>`<details class="feat"><summary><span class="nm">${esc(t.name)}</span></summary><div class="prose">${prose(t.text)}</div></details>`).join("")}
      ${wIsHuman(W)?`<label class="field"><span>Polyvalent : don d'origine</span>${wSel("hFeat",wOriginFeats(),W.hFeat)}</label>${wNhBtn(W,"don","hFeat","Nouveau don hors SRD")}`:""}
      ${/Choisissez/i.test(s.traits.map(t=>t.text).join(" "))&&!wIsHuman(W)?`<div class="muted" style="font-size:var(--fs-sm)">Certains traits demandent un choix (lignage, ascendance…) : note-le dans la fiche après la création.</div>`:""}</div>`;
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
      if(W.method==="std") inp=wSel("std."+a,STD_ARRAY.map(v=>[v,String(v)]),W.std[a]||"","—");
      if(W.method==="pts") inp=`<span class="row" style="gap:4px"><button class="btn small" data-act="wpt" data-a="${a}" data-v="-1" ${+W.pts[a]<=8?"disabled":""}>−</button><b class="num" style="min-width:22px;text-align:center">${W.pts[a]}</b><button class="btn small" data-act="wpt" data-a="${a}" data-v="1" ${+W.pts[a]>=15?"disabled":""}>+</button></span>`;
      if(W.method==="dice") inp=wSel("diceAs."+a,W.dice.map((v,i)=>[i,v===""?"—":String(v)]).filter(([i,v])=>v!=="—"),W.diceAs[a]??"","—");
      return `<div class="wab${cp.includes(a)?" prim":""}"><span class="nm">${ABN[a]}${cp.includes(a)?` <small class="muted">principale</small>`:""}</span>${inp}<span class="muted num">${x[a]?sg(x[a])+" historique":""}</span><b class="num">${b[a]==null?"—":fin[a]} <small class="muted">${b[a]==null?"":sg(Math.floor((fin[a]-10)/2))}</small></b></div>`; }).join("")}</div>`;
  }
  if(st==="Compétences"){ const have=new Set(wBgSkills(W)); const n=c.skillChoices.count;
    h+=`<p class="muted">Choisis ${n} compétences de ${esc(c.name)} (${W.skills.length}/${n}). Celles de ton historique sont déjà acquises.</p><div class="row" style="flex-wrap:wrap;gap:6px">${c.skillChoices.from.map(s=>{ const k=S.C.skills.find(x=>x.id===s); const bg=have.has(s); return `<button class="chip" aria-pressed="${bg||W.skills.includes(s)}" ${bg?"disabled title=\"Déjà acquise par l'historique\"":""} data-act="wskill" data-v="${s}">${esc(k?k.name:s)}${bg?" · historique":""}</button>`; }).join("")}</div>`;
    if(wStyle1(W)) h+=`<label class="field" style="margin-top:12px"><span>Style de combat</span>${wSel("style",styleOpts({feats:[]}),W.style||"")}</label><div class="muted" style="font-size:var(--fs-sm)">Défense : +1 CA en armure (recommandé). Archerie : +2 aux attaques à distance.</div>`;
    if(wIsHuman(W)&&srd("species",W.sp).traits.some(t=>t.name==="Compétent")) h+=`<label class="field" style="margin-top:12px"><span>Humain · Compétent : une compétence en plus</span>${wSel("extraSkill",S.C.skills.filter(s=>!have.has(s.id)&&!W.skills.includes(s.id)).map(s=>[s.id,s.name]),W.extraSkill)}</label>`;
  }
  if(st==="Sorts"){ const cast=wCast(W), nc=cast?(cast.cantrips||[])[0]||0:0, np=cast?(cast.prepared||[])[0]||0:0, Dt={cls:c};
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
    h+=`<p class="muted">Suggestion des règles : prends l'un des lots ou l'or à la place. Décoche ce que tu ne veux pas, tout reste modifiable dans l'inventaire.</p>`+block("Classe · "+c.name,c.equipment,"eqC")+(bgS?block("Historique · "+bgS.name,bgS.equipment,"eqB"):`<div class="panel muted">Historique hors SRD : ajoute son équipement dans l'inventaire après la création.</div>`);
  }
  if(st==="Identité"){
    h+=`<div class="grid2"><label class="field"><span>Nom</span><input type="text" data-w="name" value="${esc(W.name)}"></label><label class="field"><span>Joueur</span><input type="text" data-w="player" value="${esc(W.player)}"></label>
      <div class="field"><span>Alignement (facultatif)</span><div class="row" style="gap:6px">${wSel("alO",[["Loyal","Loyal"],["Neutre","Neutre"],["Chaotique","Chaotique"]],W.alO,"— Ordre —")}${wSel("alM",[["bon","Bon"],["neutre","Neutre"],["mauvais","Mauvais"]],W.alM,"— Morale —")}</div>${wAlign(W)?`<span class="muted" style="font-size:var(--fs-sm)">${esc(wAlign(W))}</span>`:""}</div><label class="field"><span>Niveau de départ</span><input type="number" min="1" max="20" data-w="level" value="${esc(W.level)}"></label></div>
      <label class="field"><span>Notes (apparence, personnalité, histoire)</span><textarea data-w="notes" style="min-height:120px">${esc(W.notes)}</textarea></label>
      ${+W.level>1?`<div class="muted" style="font-size:var(--fs-sm)">Après la création, l'assistant de montée de niveau s'ouvrira pour chaque niveau jusqu'au niveau ${+W.level}.</div>`:""}`;
  }
  const err=wCheck(W,W.step); let pv="";
  if(c){ try{ const d=wDoc(W), D=derive(d); pv=`<div class="panel stack wprev"><div class="label">Aperçu</div><b>${esc(W.name||"Nouveau personnage")}</b><div class="muted" style="font-size:var(--fs-sm)">${esc([(srd("species",W.sp)||hb(W.sp)||{}).name,c.name+" 1",(wBg(W)||{}).name].filter(Boolean).join(" · "))}</div>
    <div class="wstats"><span><small class="label">PV</small><b class="num">${D.hpMax}</b></span><span><small class="label">CA</small><b class="num">${D.ac}</b></span><span><small class="label">Init.</small><b class="num">${sg(D.init)}</b></span><span><small class="label">Perc. passive</small><b class="num">${D.passive}</b></span></div>
    <div class="wabmini">${AB.map(a=>`<span><small>${ABS[a]}</small><b class="num">${D.abEff[a]}</b><small class="num">${sg(D.mods[a])}</small></span>`).join("")}</div>
    <div class="muted" style="font-size:var(--fs-sm)">Sauvegardes : ${AB.filter(a=>D.saves[a].prof).map(a=>ABN[a]).join(", ")}</div></div>`; }catch(e){ pv=""; } }
  return `<div class="list-head"><div><h1>Nouveau personnage</h1><div class="muted">Étape ${W.step+1} sur ${steps.length} · ${esc(st)}</div></div><button class="btn ghost" data-act="wcancel">Annuler</button></div>
    <div class="wsteps">${steps.map((s,i)=>`<button class="wstep${i===W.step?" on":""}${i<W.step?" done":""}" data-act="wgo" data-v="${i}" ${i>W.step&&steps.slice(0,i).some((_,j)=>wCheck(W,j))?"disabled":""}>${i+1}. ${esc(s)}</button>`).join("")}</div>
    <div class="wz"><section class="stack" style="min-width:0">${h}
      <div class="row wnav">${W.step?`<button class="btn" data-act="wgo" data-v="${W.step-1}">← Précédent</button>`:""}<span class="muted warntxt" style="font-size:var(--fs-sm);flex:1;text-align:right">${esc(err)}</span>
      ${W.step<steps.length-1?`<button class="btn primary" data-act="wgo" data-v="${W.step+1}" ${err?"disabled":""}>Suivant →</button>`:`<button class="btn primary" data-act="wcreate" ${steps.some((_,j)=>wCheck(W,j))?"disabled":""}>Créer le personnage</button>`}</div></section>${pv}</div>`;
}
function wCreate(){
  const W=S.W, c=wCls(W); const id="perso_"+uid(); const d=wDoc(W); S.docs[id]=d; d.armor="none"; d.shield=false;
  const eq=wEqItems(W); for(const it of eq.items) d.bag.push({id:uid(),name:it.name,qty:it.qty,note:""}); d.gold={po:eq.gold};
  for(const b of d.bag){ const e=eqInfo(b); if(e.type==="weapon"&&!d.attacks.some(a=>a.weapon==="srd:"+e.w.id)) d.attacks.push({id:uid(),name:e.w.name,weapon:"srd:"+e.w.id,ability:"auto",prof:true}); }
  const arm=d.bag.find(b=>eqInfo(b).type==="armor"); if(arm) eqSet(d,"corps",arm.id);
  const sh=d.bag.find(b=>eqInfo(b).type==="shield"); if(sh&&(c.armor||[]).includes("bouclier")) eqSet(d,"mainS",sh.id);
  const D=derive(d); d.hp={cur:D.hpMax,temp:0};
  touch(id); S.cur=id; S.view="sheet"; S.tab="jeu"; const lv=Math.max(1,Math.min(20,+W.level||1)); S.W=null;
  for(const hid of W.catMade||[]) if(S.docs[hid]&&S.docs[hid].pending&&!hbUsed(hid)) removeDoc(hid);
  if(lv>1){ S.lvlTarget={id,to:lv}; S.pending={type:"lvl",hp:"avg"}; }
  render(); if(lv<=1) rvStart(id);
}
function newChar(){
  const id="perso_"+uid();
  S.docs[id]={type:"perso",name:"Nouveau personnage",level:1,classId:"",abilities:{for:10,dex:10,con:10,int:10,sag:10,cha:10},skills:{},hp:{cur:8,temp:0},attacks:[],spells:[],feats:[],features:[],invocations:[],conditions:[],gold:{po:0},updatedAt:Date.now()};
  touch(id); S.cur=id; S.view="sheet"; S.tab="build"; S.unlockEdit=true; render();
}
function applyRest(kind){
  const ch=cur(), D=derive(ch);
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
  if(ch.speeds!==undefined&&(!plainObject(ch.speeds)||Object.entries(ch.speeds).some(([k,v])=>!["escalade","nage","vol","fouissement"].includes(k)||typeof v!=="number"||!(v>=0&&v<=60)))) importFail("Les autres déplacements (escalade, nage…) sont invalides.");
  if(ch.layout?.width!==undefined&&(!plainObject(ch.layout.width)||Object.keys(ch.layout.width).length>40||Object.values(ch.layout.width).some(v=>![1,2,3,4].includes(v)))) importFail("Les largeurs des blocs d'« À la table » sont invalides.");
  if(ch.layout?.titles!==undefined&&(!plainObject(ch.layout.titles)||Object.keys(ch.layout.titles).length>40||Object.values(ch.layout.titles).some(v=>typeof v!=="string"||v.length>60))) importFail("Les titres des blocs d'« À la table » sont invalides.");
  if(ch.layout?.hidden!==undefined&&(!Array.isArray(ch.layout.hidden)||ch.layout.hidden.length>30||ch.layout.hidden.some(x=>typeof x!=="string"))) importFail("Les blocs retirés d'« À la table » sont invalides.");
  if(ch.layout?.pos!==undefined&&(!plainObject(ch.layout.pos)||Object.keys(ch.layout.pos).length>40||Object.values(ch.layout.pos).some(p=>!plainObject(p)||![0,1,2,3].includes(p.c)||!["top","below","same","row","bottom"].includes(p.t)||(p.a!==undefined&&typeof p.a!=="string")||(p.px!==undefined&&!(Number.isFinite(p.px)&&Math.abs(p.px)<5000))||(p.k!==undefined&&!(Number.isInteger(p.k)&&p.k>=0&&p.k<20))))) importFail("Les positions des blocs d'« À la table » sont invalides.");
  for(const k of ["mag","grav"]) if(ch.layout?.[k]!==undefined&&typeof ch.layout[k]!=="boolean") importFail("Les réglages de placement d'« À la table » sont invalides.");
  if(ch.layout?.custom!==undefined&&(!Array.isArray(ch.layout.custom)||ch.layout.custom.length>20||ch.layout.custom.some(b=>!plainObject(b)||typeof b.id!=="string"||typeof b.name!=="string"||b.name.length>60||!Array.isArray(b.tiles||[])||(b.tiles||[]).length>16))) importFail("Les blocs personnalisés d'« À la table » sont invalides.");
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
