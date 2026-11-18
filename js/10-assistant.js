/* ---------- assistant de création ---------- */
const STD_ARRAY=[15,14,13,12,10,8], PT_COST={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9}, PT_EXT={3:-9,4:-6,5:-4,6:-2,7:-1,8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9,16:12,17:15,18:19};
/* Brouillon de création (chantier 17) : la création en cours est enregistrée dans ce navigateur sous sa propre clé, à part des fiches
   (elle n'est ni dans S.docs, ni dans la copie personnelle, ni synchronisée). Elle survit à un rechargement ; elle est effacée quand le
   personnage est créé ou la création abandonnée. Un brouillon illisible ou mal formé est ignoré. */
const W_DRAFT_KEY="registre-creation-v1";
function wDraftSave(){ try{ const W=S.W; if(!W) return; const o=Object.assign({},W); for(const k of ["open","openShown","chg","nh","askGuide"]) delete o[k]; localStorage.setItem(W_DRAFT_KEY,JSON.stringify({v:1,t:Date.now(),W:o})); }catch(e){} }
function wDraftHas(){ try{ return !!localStorage.getItem(W_DRAFT_KEY); }catch(e){ return false; } }
function wDraftClear(){ try{ localStorage.removeItem(W_DRAFT_KEY); }catch(e){} }
function wDraftLoad(){ try{ const j=JSON.parse(localStorage.getItem(W_DRAFT_KEY)||"null"); if(!j||j.v!==1||!j.W||typeof j.W!=="object"||Array.isArray(j.W)) return null;
    const b=wNew(), W=Object.assign({},b), isO=v=>!!v&&typeof v==="object"&&!Array.isArray(v), extra={lvSel:Number.isFinite,langs:Array.isArray,exp:Array.isArray,catMade:Array.isArray,mast:v=>v===null||Array.isArray(v),seen:isO,src:isO};
    for(const k of Object.keys(j.W)){ const v=j.W[k], d=b[k]; if(k==="nh") continue;
      if(d!==undefined){ if(Array.isArray(d)?Array.isArray(v):isO(d)?isO(v):typeof d===typeof v) W[k]=v; }
      else if(extra[k]?extra[k](v):typeof v==="string") W[k]=v; }
    for(const L of Object.keys(W.lv||{})){ const P=W.lv[L]; if(!/^\d{1,2}$/.test(L)||!isO(P)){ delete W.lv[L]; continue; } for(const [f,v] of Object.entries(P)) if(!(typeof v==="string"||(Array.isArray(v)&&v.length<=10&&v.every(x=>typeof x==="string")))) delete P[f]; }
    if(W.cls&&!clsOf(W.cls)) W.cls=""; if(W.bg&&!wBg(W)) W.bg=""; if(W.sp&&!(srd("species",W.sp)||hb(W.sp))) W.sp=""; return W; }catch(e){ return null; } }
// Abandonner : le brouillon et les fiches du catalogue créées pour lui (encore à remplir et inutilisées) disparaissent
function wAbandon(){ S.wReview=false; S.wClsAsk=null; const W=S.W||wDraftLoad(), made=(W&&W.catMade)||[]; S.W=null; wDraftClear(); for(const id of made) if(S.docs[id]&&S.docs[id].pending&&!hbUsed(id)) removeDoc(id); S.view="list"; render(); }
function wNew(){ return {mode:"",gstep:0,step:0,lv:{},cls:"",bg:"",sp:"",asiMode:"21",asi2:"",asi1:"",asiT:["","",""],feat:"",hFeat:"",method:"std",std:{},pts:{for:8,dex:8,con:8,int:8,sag:8,cha:8},dice:["","","","","",""],diceAs:{},rolled:false,alO:"",alM:"",nh:null,skills:[],extraSkill:"",can:[],spl:[],inv:[],invc:[],eqC:"A",eqB:"A",eqOff:{},name:"",player:"",align:"",level:1,notes:""}; }
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
// Équipement de départ de l'historique : règles de base, fiche de « Mes contenus », ou catalogue pour une fiche créée avant que le catalogue ne le connaisse
function wBgEquip(W){ const b=srd("backgrounds",W.bg); if(b) return b.equipment||""; const h=hb(W.bg); return h?(h.equipment||(catGet(h.catId)||{}).eq||""):""; }
// Historique hors des règles de base : dire dès le choix ce qui restera à faire après la création (plutôt que de le découvrir à la fin)
function wBgNote(W,x){ if(!x) return ""; const fd=(hb(W.feat)||{}).pending, todo=x.pending||fd, noEq=!wBgEquip(W); if(!todo&&!noEq) return "";
  return `<div class="muted wbgnote" style="font-size:var(--fs-sm)">${todo?`Cet historique sort des règles de base : ses effets de jeu sont pris en compte, mais sa description${fd?" et celle de son don restent":" reste"} à compléter. Une fenêtre te le proposera après la création.`:""}${noEq?" Son équipement n'est pas connu de l'appli : tu l'ajouteras à la main dans l'inventaire.":""}</div>`; }
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
/* Cartes d'explication (chantier 17, lot B) : pour chaque classe et chaque espèce des règles de base, une accroche (t), ce que ça donne
   en jeu (p) et une complexité (cx). Textes rédigés pour l'appli, à partir des traits et aptitudes du SRD ; ce ne sont pas des règles. */
const W_INFO={classe:{
  barbare:{t:"Un combattant porté par sa rage, qui encaisse et frappe fort.",p:"Tu fonces au contact, tu entres en rage pour résister aux coups et tu fais très mal.",cx:"Simple"},
  barde:{t:"Un artiste dont la musique et les mots sont de la magie.",p:"Tu inspires tes alliés, tu embrouilles tes ennemis et tu te débrouilles dans presque toutes les situations.",cx:"Intermédiaire"},
  clerc:{t:"Le serviteur d'une divinité, qui soigne et protège.",p:"Tu soignes, tu bénis tes alliés et tu frappes avec la magie divine. Selon ton ordre, tu tiens la ligne en armure ou tu maîtrises plus de magie.",cx:"Intermédiaire"},
  druide:{t:"Un gardien de la nature, qui commande aux éléments et aux bêtes.",p:"Tu lances des sorts de nature et, dès le niveau 2, tu prends la forme d'animaux.",cx:"Avancée"},
  ensorceleur:{t:"Un lanceur de sorts dont la magie est innée.",p:"Tu connais peu de sorts, mais tu les lances souvent et tu apprends à les modifier. Reste loin des coups.",cx:"Intermédiaire"},
  guerrier:{t:"Un maître des armes et des armures.",p:"Tu attaques, tu tiens bon et tu récupères en plein combat. Peu de règles à retenir.",cx:"Simple"},
  magicien:{t:"Un érudit qui apprend la magie dans ses livres.",p:"Tu as le plus grand choix de sorts du jeu, mais très peu de points de vie : reste à l'abri.",cx:"Avancée"},
  moine:{t:"Un artiste martial rapide, qui combat à mains nues.",p:"Tu frappes plusieurs fois par tour, tu te déplaces vite et tu évites les coups sans armure.",cx:"Intermédiaire"},
  occultiste:{t:"Un lanceur de sorts lié par un pacte à une puissance surnaturelle.",p:"Tu as peu d'emplacements de sorts, mais ils reviennent après un repos court, et tu disposes d'une attaque magique à volonté.",cx:"Intermédiaire"},
  paladin:{t:"Un chevalier lié par un serment sacré.",p:"Tu combats en armure lourde, tu soignes par imposition des mains et, très vite, tu renforces tes coups avec la magie divine.",cx:"Intermédiaire"},
  rodeur:{t:"Un chasseur et pisteur à l'aise dans la nature.",p:"Tu combats à l'arc ou à deux armes, tu marques ta proie et tu aides le groupe à explorer.",cx:"Intermédiaire"},
  roublard:{t:"Un spécialiste de la discrétion et des coups précis.",p:"Tu places une attaque sournoise par tour, tu excelles dans beaucoup de compétences et tu te sors des mauvais pas.",cx:"Simple"}},
 espece:{
  drakeide:{t:"Un descendant de dragons.",p:"Tu craches un souffle d'énergie, tu résistes à un type de dégâts et tu vois dans le noir.",cx:"Simple"},
  elfe:{t:"Un être ancien, perceptif et magique.",p:"Tu vois dans le noir, tu résistes aux charmes, tu n'as pas besoin de dormir et ton lignage te donne des sorts.",cx:"Intermédiaire"},
  gnome:{t:"Un petit être curieux et rusé.",p:"Tu vois dans le noir, tu résistes mieux à ce qui vise l'esprit et ton lignage te donne quelques tours de magie.",cx:"Intermédiaire"},
  goliath:{t:"Un lointain descendant des géants, grand et puissant.",p:"Tu te déplaces plus vite, tu portes plus lourd et ton ascendance te donne un pouvoir de géant.",cx:"Simple"},
  halfelin:{t:"Un petit être chanceux et courageux.",p:"Tu relances tes 1 au d20, tu résistes à la peur et tu te faufiles entre les créatures plus grandes que toi.",cx:"Simple"},
  humain:{t:"Polyvalent et débrouillard.",p:"Tu gagnes un don d'origine et une compétence de plus, et tu retrouves l'inspiration héroïque à chaque repos long.",cx:"Simple"},
  nain:{t:"Un être robuste, né sous la montagne.",p:"Tu vois dans le noir, tu résistes au poison et tu as plus de points de vie.",cx:"Simple"},
  orc:{t:"Un être endurant, taillé pour l'effort.",p:"Tu vois dans le noir, tu peux foncer en action bonus et, une fois par repos long, tu restes debout au lieu de tomber à 0 PV.",cx:"Simple"},
  tieffelin:{t:"Un être marqué par un héritage des plans inférieurs.",p:"Tu vois dans le noir, tu connais un tour de magie et ton héritage te donne une résistance et des sorts.",cx:"Intermédiaire"}}};
function wInfoOf(kind,ref){ return (W_INFO[kind]||{})[String(ref||"").replace(/^srd:/,"")]||null; }
/* Explications dans l'appli (retours d'Angle, 17 nov. 2026) : un bouton « i » ouvre une bulle (#tip, clé « wx:… ») avec le texte
   embarqué (SRD ou fiche de « Mes contenus »). wxI(kind,ref) donne le bouton ; wxTip(spec) le contenu. */
const W_ABIL={for:"puissance physique : attaques au corps à corps avec la plupart des armes, Athlétisme, charges lourdes.",
  dex:"agilité et réflexes : armes à distance et armes de finesse, CA sans armure ou en armure légère, initiative, Acrobaties, Discrétion, Escamotage.",
  con:"santé et endurance : points de vie gagnés à chaque niveau, maintien de la concentration.",
  int:"raisonnement et mémoire : sorts du magicien, Arcanes, Histoire, Investigation, Nature, Religion.",
  sag:"perception et intuition : sorts du clerc, du druide et du rôdeur, Perception, Intuition, Médecine, Survie, Dressage.",
  cha:"présence et personnalité : sorts du barde, de l'ensorceleur, de l'occultiste et du paladin, Persuasion, Tromperie, Intimidation, Représentation."};
function wxI(kind,ref,lab){ return ref&&/^(srd:|hb:)/.test(String(ref))||(ref&&["abil","skills","cls"].includes(kind))?`<button class="btn small ghost wxi" type="button" data-act="tip" data-k="wx:${kind}:${esc(String(ref))}" aria-label="Explication${lab?" : "+esc(lab):""}">${lab?esc(lab):"i"}</button>`:""; }
/* Lien AideDD sous l'explication d'un contenu des règles de base (adresses vérifiées le 17 nov. 2026). Les sorts et dons
   dont AideDD utilise un autre nom ont leur adresse ici ; null = pas de page trouvée, donc pas de lien. Hors SRD : le lien de la fiche. */
const AIDE_FIX={spell:{"armure-du-mage":"armure-de-mage","aspersion-acide":"aspersion-d-acide","aura-magique-de-larcaniste":"aura-magique-de-nystul",
  "chien-de-garde":"chien-de-garde-de-mordenkainen","coffre-secret":"coffre-secret-de-leomund","convocations-instantanees":"convocations-instantanees-de-drawmij",
  "danse-irresistible":"danse-irresistible-d-otto","disque-flottant":"disque-flottant-de-tenser","epee-arcanique":"epee-de-mordenkainen","fleche-acide":"fleche-acide-de-melf",
  "fou-rire":"fou-rire-de-tasha","lien-telepathique":"lien-telepathique-de-rary","main-arcanique":"main-de-bigby","main-du-mage":"main-de-mage",
  "manoir-somptueux":"manoir-somptueux-de-mordenkainen","petite-hutte":"petite-hutte-de-leomund","sanctuaire-prive":"sanctuaire-prive-de-mordenkainen",
  "sphere-glacee":"sphere-glacee-d-otiluke","sphere-resiliente":"sphere-resiliente-d-otiluke","tentacules-noirs":"tentacules-noirs-d-evard",
  "marche-sur-londe":null,"possession":null,"terreur":null,"verrou-magique":null},
  feat:{"armes-a-deux-mains":"arme-a-deux-mains","faveur-de-vision-lucide":null},
  sub:{"voie-du-berserker":"berserker","college-du-savoir":"savoir","domaine-de-la-vie":"vie","cercle-de-la-terre":"terre","sorcellerie-draconique":"draconique",
  "champion":"champion","evocateur":"evocateur","credo-de-la-paume":"paume","protecteur-fielon":"fielon","serment-de-devotion":"devotion","chasseur":"chasseur","voleur":"voleur"}};
function wxAide(kind,ref){ const id=String(ref||"").replace(/^srd:/,""), fix=(m,dflt)=>m&&id in m?m[id]:dflt, ORI=AIDE+"/regles-24/origines-des-personnages/";
  if(!String(ref).startsWith("srd:")&&kind!=="cls") return "";
  if(kind==="spell"){ const sp=S.idx.spells[id]; const sl=sp?fix(AIDE_FIX.spell,aideSlug(sp.name)):null; return sl?AIDE+"/spell/fr/"+sl:""; }
  if(kind==="feat"){ const f=S.C.feats.find(x=>x.id===id); const sl=f?fix(AIDE_FIX.feat,aideSlug(f.name)):null; return sl?AIDE+"/feat/fr/"+sl:""; }
  if(kind==="cls") return S.C.classes.some(c=>c.id===id)?AIDE+"/regles-24/classes/"+id+"/":"";
  if(kind==="sub"){ for(const c of S.C.classes) if((c.subclasses||[]).some(z=>z.id===id)) return AIDE+"/regles-24/classes/"+c.id+"/#"+(AIDE_FIX.sub[id]||"sous-classes"); return ""; }
  if(kind==="bg") return srd("backgrounds",ref)?ORI+"description-des-historiques/#"+id:"";
  if(kind==="sp") return srd("species",ref)?ORI+"description-des-especes/#"+id:"";
  return ""; }
function wxTip(spec){ const html=wxTipBody(spec), i=spec.indexOf(":"), u=html&&wxAide(spec.slice(0,i),spec.slice(i+1));
  return html+(u?`<div class="hbfoot muted wxaide" style="font-size:var(--fs-sm);margin-top:8px">${linkHtml({link:u})}</div>`:""); }
function wxTipBody(spec){ const i=spec.indexOf(":"), kind=spec.slice(0,i), ref=spec.slice(i+1), P=t=>`<div class="prose tiptext">${prose(t||"")||`<p class="muted">Pas encore de description.</p>`}</div>`, h=hb(ref);
  const tail=x=>h?hbFoot(h):"";
  if(kind==="abil") return tipHead("Les caractéristiques","À quoi elles servent")+`<div class="prose tiptext"><p>Chaque caractéristique donne un modificateur (+2 pour 14 ou 15, +3 pour 16 ou 17…), ajouté aux jets qui l'utilisent.</p>${AB.map(a=>`<p><b>${ABN[a]}</b> : ${esc(W_ABIL[a])}</p>`).join("")}</div>`;
  if(kind==="skills") return tipHead("Les compétences","À quoi elles servent")+`<div class="prose tiptext">${ref.split(",").map(id=>S.C.skills.find(k=>k.id===id)).filter(Boolean).map(k=>`<p><b>${esc(k.name)}</b> (${esc(ABN[k.ability]||"")})${k.examples?" : "+esc(k.examples):""}</p>`).join("")}</div>`;
  if(kind==="spell"){ const sp=ref.startsWith("srd:")?S.idx.spells[ref.slice(4)]:null;
    if(sp) return tipHead(sp.name,(sp.level?"Sort de niveau "+sp.level:"Sort mineur")+(sp.school?" · "+sp.school:""))+tipMeta([["Incantation",sp.casting_time],["Portée",sp.range],["Durée",sp.duration],["Composantes",sp.components]])+P(sp.text);
    return h?tipHead(h.name,"Sort")+P(h.text)+tail():""; }
  if(kind==="feat"){ const f=ref.startsWith("srd:")?S.C.feats.find(x=>"srd:"+x.id===ref):null;
    if(f) return tipHead(f.name,"Don"+(f.category?" · "+f.category:""))+tipMeta([["Prérequis",f.prerequisite||""]])+P(f.text);
    return h?tipHead(h.name,"Don")+P(h.text)+tail():""; }
  if(kind==="bg"){ const b=srd("backgrounds",ref); if(b) return tipHead(b.name,"Historique")+P(b.text); return h?tipHead(h.name,"Historique")+P(h.text)+tail():""; }
  if(kind==="sp"){ const s=srd("species",ref); if(s) return tipHead(s.name,"Espèce")+`<div class="prose tiptext">${s.traits.map(t=>`<p><b>${esc(t.name)}.</b> ${esc(t.text)}</p>`).join("")}</div>`; return h?tipHead(h.name,"Espèce")+P(h.text)+tail():""; }
  if(kind==="cls"){ const c=clsOf(ref); if(!c) return ""; const by=L=>c.features.filter(f=>f.level===L).map(f=>f.name);
    return tipHead(c.name,"Classe")+tipMeta([["Dé de vie","d"+c.hitDie],["Sauvegardes",c.saves.map(a=>ABN[a]).join(", ")],["Armures",(c.armor||[]).join(", ")||"aucune"],["Armes",c.weapons||""]])
      +`<div class="prose tiptext">${[1,2,3].map(L=>by(L).length?`<p><b>Niveau ${L}</b> : ${esc(by(L).join(", "))}.</p>`:"").join("")}${c.features.filter(f=>f.level===1).map(f=>`<p><b>${esc(f.name)}.</b> ${esc(String(f.text||"").slice(0,600))}${String(f.text||"").length>600?"…":""}</p>`).join("")}</div>`+(c.hb?tail():""); }
  if(kind==="sub"){ let s=null, cl=null; if(ref.startsWith("srd:")) for(const c of S.C.classes){ const x=(c.subclasses||[]).find(z=>"srd:"+z.id===ref); if(x){ s=x; cl=c; break; } }
    if(s) return tipHead(s.name,"Sous-classe · "+cl.name)+`<div class="prose tiptext">${prose(s.intro||"")}${s.features.map(f=>`<p><b>Niveau ${f.level} · ${esc(f.name)}.</b> ${esc(String(f.text||"").slice(0,400))}${String(f.text||"").length>400?"…":""}</p>`).join("")}</div>`;
    return h?tipHead(h.name,"Sous-classe")+P(h.text)+((h.features||[]).length?`<div class="prose tiptext">${h.features.map(f=>`<p><b>Niveau ${+f.level||"?"} · ${esc(f.name||"")}.</b> ${esc(f.text||"")}</p>`).join("")}</div>`:"")+tail():""; }
  return ""; }
function wInfoCard(kind,ref){ const i=wInfoOf(kind,ref); return i?`<div class="winfo"><div><span class="label">En jeu</span> ${esc(i.p)}</div><div class="muted" style="font-size:var(--fs-sm)">Complexité : ${esc(i.cx)}</div></div>`:""; }
function wBgReady(h){ return Array.isArray(h.abilities)&&h.abilities.filter(Boolean).length===3&&(h.effects||[]).filter(e=>e.t==="maitrise"&&/^comp:/.test(e.cible||"")).length>=2&&!!(h.feat||h.featRef); }
function wSources(kind){ const tag=h=>catShort(h.label)||"Personnalisée";
  if(kind==="classe") return {base:S.C.classes.map(x=>[x.id,x.name,(wInfoOf("classe",x.id)||{}).t||`d${x.hitDie} · ${x.primary.map(a=>ABN[a]).join(" ou ")}${x.casting?" · sorts":""}`]),
    other:hbs("classe").filter(h=>!h.pending).map(x=>["hb:"+x._id,x.name,tag(x)+" · d"+(+x.hitDie||8)])};
  if(kind==="historique") return {base:S.C.backgrounds.map(b=>["srd:"+b.id,b.name,b.abilities.map(a=>ABS[a]).join(", ")+" · "+b.feat]),
    other:[...hbs("historique").filter(h=>!h.pending||wBgReady(h)).map(x=>["hb:"+x._id,x.name,tag(x)+(x.feat?" · "+x.feat:"")]),
      ...catAll().filter(e=>e.k==="historique"&&!catHb(e)&&(e.ab||[]).length===3&&(e.sk||[]).length===2&&(e.feat||e.featRef)).map(e=>["cat:"+e.id,e.n,catShort(e.b)+" · "+e.feat])].sort((a,b)=>a[1].localeCompare(b[1],"fr"))};
  return {base:S.C.species.map(x=>["srd:"+x.id,x.name,(wInfoOf("espece",x.id)||{}).t||x.traits.map(t=>t.name).join(", ")]),other:hbs("espece").filter(h=>!h.pending).map(x=>["hb:"+x._id,x.name,tag(x)])}; }
// Liste de choix avec ses deux onglets ; « Autres contenus » n'existe que s'il y a quelque chose de complet à y montrer
function wPick(W,kind,key){ const s=wSources(kind), tab=s.other.length&&(W.src||{})[kind]==="other"?"other":"base";
  // Une fois le choix fait, la liste se replie : ses détails et ses sous-choix sont juste dessous, pas sous le pli
  const got=W[key]&&W.chg!==key?[...s.base,...s.other].find(x=>x[0]===W[key]):null;
  if(got) return `<div class="wchosen"><span><b>${esc(got[1])}</b>${got[2]?`<span class="muted">${esc(got[2])}</span>`:""}</span><span class="row" style="gap:6px">${wxI({classe:"cls",historique:"bg",espece:"sp"}[kind],W[key],"En savoir plus")}<button class="btn small" data-act="wchg" data-k="${key}">Changer</button></span></div>${wInfoCard(kind,W[key])}`;
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
  if((cast&&((cast.cantrips||[])[0]||(cast.prepared||[])[0]))||(c&&c.id==="occultiste")) st.push("Sorts"); st.push("Langues","Équipement"); if(wLvN(W)>1) st.push("Niveaux"); st.push("Identité"); return st; }
function wEqItems(W){ const c=wCls(W), out=[]; let gold=0; const add=(txt,key)=>{ const opts=eqOptions(txt); const cur=opts.find(o=>o.k===W[key])||opts[0]; if(!cur) return; gold+=cur.gold; cur.items.forEach((it,ix)=>{ if(!W.eqOff[key+cur.k+ix]) out.push(it); }); };
  if(c) add(c.equipment,"eqC"); const be=wBgEquip(W); if(be) add(be,"eqB"); return {items:out,gold}; }
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
  if(st==="Espèce"){ if(!W.sp) return "Choisis une espèce."; if(wIsHuman(W)&&(!W.hFeat||W.hFeat===wBgFeat(W))) return "Humain : choisis ton don d'origine (Polyvalent).";
    const def=LINEAGES[String(W.sp).replace(/^srd:/,"")]; if(def&&!(W.lin&&def.opts[W.lin])) return def.label+" : fais ton choix.";
    const sk=wSpSkills(W); if(sk&&!W.spSkill) return sk.name+" : choisis ta compétence."; if(wSizes(W)&&!W.size) return "Choisis ta taille."; return ""; }
  if(st==="Caractéristiques"){ const b=wBase(W); if(AB.some(a=>b[a]==null)) return "Attribue une valeur à chaque caractéristique."; if(W.method==="std"){ const v=AB.map(a=>+W.std[a]).sort((x,y)=>y-x); if(v.join()!==STD_ARRAY.join()) return "Chaque valeur du tableau standard ne s'utilise qu'une fois."; } if(W.method==="dice"){ const ix=AB.map(a=>W.diceAs[a]); if(new Set(ix).size<6) return "Chaque résultat ne s'utilise qu'une fois."; }
    if(W.method==="pts"&&AB.reduce((t,a)=>t+PT_COST[+W.pts[a]],0)>27) return "Tu dépasses les 27 points."; return ""; }
  if(st==="Compétences"){ const n=c.skillChoices.count; if(W.skills.length!==n) return `Choisis ${n} compétences de classe.`; if(wIsHuman(W)&&srd("species",W.sp).traits.some(t=>t.name==="Compétent")&&!W.extraSkill) return "Humain : choisis ta compétence en plus (Compétent)."; if(wStyle1(W)&&!W.style) return "Choisis ton style de combat."; const ne=wExpN(W); if(ne&&wExp(W).length<ne) return `Choisis ${ne} expertises parmi tes compétences.`; return ""; }
  if(st==="Sorts"){ const cast=wCast(W); const nc=wNC(W), np=cast?(cast.prepared||[])[0]||0:0; if(W.can.slice(0,nc).filter(Boolean).length<nc) return `Choisis ${nc} sorts mineurs.`; if(W.spl.filter(Boolean).length<np) return `Choisis ${np} sorts de niveau 1.`; if(c.id==="occultiste"&&W.inv.filter(Boolean).length<wInvN(W)) return "Choisis ta manifestation occulte."; if(W.inv.some((id,i)=>id&&INV_CHOICE[id]&&!W.invc[i])) return "Choisis la cible de ta manifestation."; return ""; }
  if(st==="Langues"){ const n=wLangN(W); return wLangs(W).length<n?`Choisis ${n} langues.`:""; }
  if(st==="Niveaux"){ for(const x of wLevels(W).steps){ const m=wLvMsg(x); if(m) return m; } return ""; }
  if(st==="Identité") return String(W.name||"").trim()?"":"Donne un nom à ton personnage.";
  return ""; }
// Tout ce qui manque encore avant de pouvoir créer : [{step, name, msg}] (une entrée par étape incomplète)
function wNeeds(W){ return wSteps(W).map((name,step)=>({step,name,msg:wCheck(W,step)})).filter(x=>x.msg).sort((a,b)=>(b.name==="Identité")-(a.name==="Identité")); }
// Pendant la saisie du nom (pas de nouveau rendu) : le bouton Créer et le message suivent
function wNavSync(){ const W=S.W, f=document.getElementById("wfoot"), t=document.getElementById("wcount"); if(W&&f) f.outerHTML=wFoot(W); if(W&&t) t.outerHTML=wCount(W); }
function wInvN(W){ const c=wCls(W); if(!c||c.id!=="occultiste") return 0; const col=c.columns.find(x=>x.label.startsWith("Manifestations")); return col?+col.values[0]||0:0; }
function wCards(list,cur,key){ return `<div class="wcards">${list.map(([v,t,sub])=>`<button class="wcard" aria-pressed="${v===cur}" data-act="wpick" data-k="${key}" data-v="${esc(v)}"><b>${esc(t)}</b>${sub?`<span class="muted">${esc(sub)}</span>`:""}</button>`).join("")}</div>`; }
// Lignage ou ascendance de l'espèce (chantier 13) : choisi ici, modifiable ensuite dans l'onglet Personnage
function wLineage(W,s){ const def=LINEAGES[s.id]; if(!def) return ""; const o=def.opts[W.lin];
  return `<label class="field"><span>${esc(def.label)}</span>${wSel("lin",Object.entries(def.opts).map(([v,x])=>[v,x.name]),W.lin)}</label>`
    +(def.ability?`<label class="field"><span>Caractéristique d'incantation${W.linAb?"":` <small class="muted wprop">(Charisme proposé, modifiable)</small>`}</span>${wSel("linAb",LINEAGE_AB,W.linAb||"cha")}</label>`:"")
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
      h+=`<div class="panel stack" style="margin-top:12px">${b?`<div class="muted" style="font-size:var(--fs-sm)">Don : ${esc(b.feat)} · Compétences : ${b.skills.map(s=>(S.C.skills.find(k=>k.id===s)||{}).name).join(", ")} · Outil : ${esc(b.tools||"")}</div>`:`<div class="muted" style="font-size:var(--fs-sm)">${esc(x&&x.text||"")}</div>${wBgNote(W,x)}`}
        <div class="label">Bonus de caractéristiques</div>
        <div class="adv" role="group"><button aria-pressed="${W.asiMode==="21"}" data-act="wpick" data-k="asiMode" data-v="21">+2 et +1</button><button aria-pressed="${W.asiMode==="111"}" data-act="wpick" data-k="asiMode" data-v="111">+1 / +1 / +1</button></div>
        ${W.asiMode==="21"?`<div class="row">+2 ${wSel("asi2",abs.map(a=>[a,ABN[a]]),W.asi2)} +1 ${wSel("asi1",abs.filter(a=>a!==W.asi2).map(a=>[a,ABN[a]]),W.asi1)}</div>`:(abs.length===3?`<div class="muted">+1 en ${abs.map(a=>ABN[a]).join(", ")}</div>`:`<div class="row">${[0,1,2].map(i=>wSel("asiT."+i,AB.map(a=>[a,ABN[a]]),W.asiT[i])).join(" ")}</div>`)}
        ${b?"":(x&&(x.featRef||x.feat)&&W.feat?`<div class="muted" style="font-size:var(--fs-sm)">Don d'origine : ${esc((hb(W.feat)||S.C.feats.find(f=>"srd:"+f.id===W.feat)||{}).name||x.feat||"")}</div>`:`<label class="field"><span>Don d'origine</span>${wSel("feat",wOriginFeats(W.feat),W.feat)}</label>${wxI("feat",W.feat)}`)}</div>`; }
  }
  if(st==="Espèce"){
    h+=`<p class="muted">L'espèce donne des traits : vision, résistances, capacités spéciales.</p>`+wPick(W,"espece","sp");
    { const xh=hb(W.sp); if(xh) h+=`<div class="panel stack" style="margin-top:12px"><div class="prose">${prose(xh.text)||'<span class="muted">Pas de description.</span>'}</div>${hbFoot(xh)}</div>`; }
    const s=srd("species",W.sp);
    if(s){ const sk=wSpSkills(W), sz=wSizes(W), bgS=wBgSkills(W);
      // Le don de l'historique n'est pas proposé une seconde fois : la fiche ne garde chaque don qu'une fois, le choix de l'humain serait perdu
      const bf=wBgFeat(W), bfd=bf?(S.C.feats.find(f=>"srd:"+f.id===bf)||hb(bf)):null, hf=W.hFeat===bf?"":W.hFeat;
      const ch=(wIsHuman(W)?`<label class="field"><span>Polyvalent : don d'origine</span>${wSel("hFeat",wOriginFeats(hf).filter(([v])=>v!==bf),hf)}</label>${wxI("feat",hf)}${bfd?`<div class="muted wdup" style="font-size:var(--fs-sm)">${esc(bfd.name)} vient déjà de ton historique : choisis un autre don.${bfd.repeatable?" Les règles permettent de le prendre deux fois, mais la fiche ne le note qu'une fois : vois avec ton MJ et ajoute-le à la main.":""}</div>`:""}`:"")+wLineage(W,s)
        +(sk?`<label class="field"><span>${esc(sk.name)} : une compétence</span>${wSel("spSkill",sk.from.filter(k=>!bgS.includes(k)).map(k=>[k,(S.C.skills.find(x=>x.id===k)||{}).name]),W.spSkill)}</label>`:"")
        +(sz?`<label class="field"><span>Taille</span>${wSel("size",sz.map(v=>[v,v]),W.size)}</label>`:"");
      // les choix d'abord, la lecture des traits ensuite
      h+=(ch?`<div class="panel stack wchoices" style="margin-top:12px"><div class="label">Tes choix</div>${ch}</div>`:"")
        +`<div class="panel stack" style="margin-top:12px">${s.traits.map(t=>`<details class="feat"><summary><span class="nm">${esc(t.name)}</span></summary><div class="prose">${prose(t.text)}</div></details>`).join("")}</div>`; }
  }
  if(st==="Caractéristiques"){
    const b=wBase(W), x=wBonus(W), fin=wAbilities(W);
    h+=`<div>${wxI("abil","1","À quoi servent les caractéristiques ?")}</div>`;
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
    h+=`<div style="margin-top:8px">${wxI("skills",c.skillChoices.from.join(","),"À quoi servent ces compétences ?")}</div>`;
    if(wStyle1(W)) h+=`<label class="field" style="margin-top:12px"><span>Style de combat</span>${wSel("style",wStyles(),W.style||"")}</label>${wxI("feat",W.style)}<div class="muted" style="font-size:var(--fs-sm)">Défense : +1 CA en armure (recommandé). Archerie : +2 aux attaques à distance.</div>`;
    if(wIsHuman(W)&&srd("species",W.sp).traits.some(t=>t.name==="Compétent")) h+=`<label class="field" style="margin-top:12px"><span>Humain · Compétent : une compétence en plus</span>${wSel("extraSkill",S.C.skills.filter(s=>!have.has(s.id)&&s.id!==spk&&!W.skills.includes(s.id)).map(s=>[s.id,s.name]),W.extraSkill)}</label>`;
    { const ne=wExpN(W); if(ne){ const ex=wExp(W); h+=`<div class="label" style="margin-top:12px">Expertise (${ex.length}/${ne})</div><div class="muted" style="font-size:var(--fs-sm)">Ton bonus de maîtrise compte double pour ces compétences.</div><div class="row wexp" style="flex-wrap:wrap;gap:6px">${wProf(W).map(s=>`<button class="chip" aria-pressed="${ex.includes(s)}" data-act="wexp" data-v="${s}">${esc((S.C.skills.find(x=>x.id===s)||{}).name||s)}</button>`).join("")||`<span class="muted">Choisis d'abord tes compétences.</span>`}</div>`; } }
  }
  if(st==="Sorts"){ const cast=wCast(W), nc=wNC(W), np=cast?(cast.prepared||[])[0]||0:0, Dt={cls:c};
    const can=classSpells(Dt,0), l1=classSpells(Dt,null,1);
    const pick=(key,n,list,lab)=>n?`<div class="label" style="margin-top:10px">${lab} (${n})</div><div class="stack">${Array.from({length:n},(_,i)=>`<div class="row wxrow">${wSel(key+"."+i,list.filter(x=>!W[key].some((r,j)=>j!==i&&r===x.ref)).map(x=>[x.ref,x.s.name]),W[key][i]||"")}${wxI("spell",W[key][i])}</div>`).join("")}</div>`:"";
    h+=pick("can",nc,can,"Sorts mineurs")+pick("spl",np,l1,"Sorts de niveau 1");
    const ni=wInvN(W); if(ni){ const tmp=wDoc(W); h+=`<div class="label" style="margin-top:10px">Manifestation occulte (${ni})</div>`+Array.from({length:ni},(_,i)=>{ const id=W.inv[i]||""; return `<div class="row" style="gap:6px">${wSel("inv."+i,invAvailFor(tmp,1).map(x=>[x.id,x.name]),id)}${INV_CHOICE[id]?wSel("invc."+i,invChoices(tmp,id,W.can),W.invc[i]||"","— Cible —"):""}</div>${id?`<div class="muted winvtxt" style="font-size:var(--fs-sm)">${esc((S.C.invocations.find(x=>x.id===id)||{}).text||"")}</div>`:""}`; }).join(""); }
  }
  if(st==="Équipement"){ const be=wBgEquip(W), bgN=(wBg(W)||{}).name||"";
    const block=(title,txt,key)=>{ const opts=eqOptions(txt); if(!opts.length) return `<div class="panel"><b>${esc(title)}</b><div class="muted">${esc(txt||"Rien à choisir.")}</div></div>`; const cur=opts.find(o=>o.k===W[key])||opts[0];
      return `<div class="panel stack"><b>${esc(title)}</b><div class="adv" role="group">${opts.map(o=>`<button aria-pressed="${o.k===cur.k}" data-act="wpick" data-k="${key}" data-v="${o.k}">Option ${o.k}${o.items.length?"":" · "+o.gold+" po"}</button>`).join("")}</div>
        ${cur.items.length?`<div class="stack" style="gap:2px">${cur.items.map((it,ix)=>{ const id=key+cur.k+ix; return `<label class="row" style="gap:8px"><input type="checkbox" data-act="weq" data-v="${id}" ${W.eqOff[id]?"":"checked"}>${it.qty>1?it.qty+" × ":""}${esc(it.name)}</label>`; }).join("")}</div>`:""}
        <div class="muted" style="font-size:var(--fs-sm)">${cur.gold} po</div></div>`; };
    h+=`<p class="muted">Suggestion des règles : prends l'un des lots ou l'or à la place. Décoche ce que tu ne veux pas, tout reste modifiable dans l'inventaire.</p>`+block("Classe · "+c.name,c.equipment,"eqC")+(be?block("Historique · "+bgN,be,"eqB"):W.bg?`<div class="panel muted wnoeq">L'appli ne connaît pas l'équipement de cet historique : ajoute-le dans l'inventaire après la création.</div>`:"");
    { const m=wMast(W); if(m.n&&m.cands.length) h+=`<div class="panel stack wmast"><b>Bottes d'arme (${m.list.length}/${m.n})</b><div class="muted" style="font-size:var(--fs-sm)">Les armes dont tu utilises la botte. Tu peux en changer à chaque repos long.</div><div class="row" style="flex-wrap:wrap;gap:6px">${m.cands.map(w=>{ const x=srd("weapons",w); return `<button class="chip" aria-pressed="${m.list.includes(w)}" data-act="wmast" data-v="${w}">${esc(x.name)} · ${esc(x.mastery)}</button>`; }).join("")}</div></div>`; }
  }
  if(st==="Langues"){ const n=wLangN(W), L=wLangs(W), fx=wLangFixed(W);
    h+=`<p class="muted">Tu parles déjà : ${esc(fx.join(", "))}. Choisis ${n} autres langues (${L.length}/${n}).</p><div class="row wlangs" style="flex-wrap:wrap;gap:6px">${LANGS.map(l=>`<button class="chip" aria-pressed="${L.includes(l)}" data-act="wlang" data-v="${esc(l)}">${esc(l)}</button>`).join("")}</div>
      <div class="muted" style="font-size:var(--fs-sm);margin-top:10px">Les langues rares se décident avec ton MJ : tu pourras les ajouter dans la fiche.</div>`;
  }
  if(st==="Niveaux"){ const {steps}=wLevels(W); if(!steps.length) return `<p class="muted">Choisis d'abord une classe.</p>`;
    let sel=+W.lvSel; if(!steps.some(x=>x.L===sel)) sel=(steps.find(x=>wLvMsg(x))||steps[0]).L; const cs=steps.find(x=>x.L===sel);
    h+=`<p class="muted" style="font-size:var(--fs-sm)">Les choix de chaque niveau, comme lors d'une montée de niveau. Le personnage sera créé directement au niveau ${wLvN(W)}.</p>
      <div class="row wlvpills" role="tablist" style="flex-wrap:wrap;gap:6px">${steps.map(x=>`<button class="chip" role="tab" aria-pressed="${x.L===sel}" data-act="wlvsel" data-v="${x.L}">Niv. ${x.L} ${wLvMsg(x)?"•":"✓"}</button>`).join("")}</div>
      <h3 class="wgh">Niveau ${sel}</h3><div class="stack wlvbody">${lvlBody(cs.before,cs.P,cs.p,(k,i)=>`data-w="lv.${sel}.${k}${i!==undefined?"."+i:""}"`,true)}</div>`;
    return h; }
  if(st==="Détails"){
    h+=`<div class="field"><span>Alignement (facultatif)</span><div class="row" style="gap:6px">${wSel("alO",[["Loyal","Loyal"],["Neutre","Neutre"],["Chaotique","Chaotique"]],W.alO,"— Ordre —")}${wSel("alM",[["bon","Bon"],["neutre","Neutre"],["mauvais","Mauvais"]],W.alM,"— Morale —")}</div>${wAlign(W)?`<span class="muted" style="font-size:var(--fs-sm)">${esc(wAlign(W))}</span>`:""}</div>
      <label class="field"><span>Notes (apparence, personnalité, histoire)</span><textarea data-w="notes" style="min-height:120px">${esc(W.notes)}</textarea></label>`;
  }
  return h; }
function wPreview(W){ const c=wCls(W); let pv="";
  if(c){ try{ const d=wLevels(W).d, D=derive(d); pv=`<div class="panel stack wprev"><div class="label">Aperçu</div><b>${esc(W.name||"Nouveau personnage")}</b><div class="muted" style="font-size:var(--fs-sm)">${esc([(srd("species",W.sp)||hb(W.sp)||{}).name,c.name+" "+wLvN(W),(wBg(W)||{}).name].filter(Boolean).join(" · "))}</div>
    <div class="wstats"><span><small class="label">PV</small><b class="num">${D.hpMax}</b></span><span><small class="label">CA</small><b class="num">${D.ac}</b></span><span><small class="label">Init.</small><b class="num">${sg(D.init)}</b></span><span><small class="label">Perc. passive</small><b class="num">${D.passive}</b></span></div>
    <div class="wabmini">${AB.map(a=>`<span><small>${ABS[a]}</small><b class="num">${D.abEff[a]}</b><small class="num">${sg(D.mods[a])}</small></span>`).join("")}</div>
    <div class="muted wsaves" style="font-size:var(--fs-sm)">Sauvegardes : ${AB.filter(a=>D.saves[a].prof).map(a=>ABN[a]).join(", ")}</div></div>`; }catch(e){ pv=""; } }
  return pv||`<div class="panel stack wprev"><div class="label">Aperçu</div><b>${esc(W.name||"Nouveau personnage")}</b><div class="muted" style="font-size:var(--fs-sm)">La fiche se calcule dès que la classe est choisie.</div></div>`; }
/* Suggestions (chantier 17) : un bouton par fenêtre remplit ce qui est encore vide, sans jamais remplacer un choix déjà fait.
   Le joueur valide ou change ensuite. Les listes ci-dessous sont des propositions de départ, pas des règles. */
const SUG_SK={barbare:["athletisme","perception"],barde:["persuasion","representation","tromperie"],clerc:["intuition","religion"],druide:["nature","perception"],ensorceleur:["arcanes","persuasion"],guerrier:["athletisme","perception"],
  magicien:["arcanes","investigation"],moine:["acrobaties","discretion"],occultiste:["arcanes","tromperie"],paladin:["athletisme","persuasion"],rodeur:["perception","discretion","survie"],roublard:["discretion","escamotage","perception","tromperie"]};
const SUG_SP={barde:[["moquerie-cruelle","lumiere","main-du-mage"],["mot-de-guerison","charme-personne","vague-tonnante","murmures-dissonants","lueurs-feeriques"]],
  clerc:[["flamme-sacree","assistance","lumiere","thaumaturgie"],["soins","benediction","mot-de-guerison","bouclier-de-la-foi","rayon-tracant"]],
  druide:[["crosse-des-druides","assistance","flammes"],["soins","enchevetrement","lueurs-feeriques","mot-de-guerison","vague-tonnante"]],
  ensorceleur:[["trait-de-feu","main-du-mage","lumiere","prestidigitation","rayon-de-givre"],["bouclier","projectile-magique","armure-du-mage","mains-brulantes"]],
  magicien:[["trait-de-feu","main-du-mage","lumiere","prestidigitation"],["bouclier","projectile-magique","armure-du-mage","detection-de-la-magie","sommeil","mains-brulantes"]],
  occultiste:[["decharge-occulte","main-du-mage","illusion-mineure"],["malefice","represailles-infernales","charme-personne"]],
  paladin:[[],["benediction","soins","bouclier-de-la-foi","faveur-divine"]],rodeur:[[],["marque-du-chasseur","soins","enchevetrement"]]};
function wSugPrio(W){ const c=wCls(W); return [...new Set([...(c?c.primary:[]),"con",...(c?c.saves:[]),"dex","sag","cha","int","for"])]; }
// Ce que la suggestion changerait pour cette fenêtre : {champ: valeur} (vide s'il n'y a rien à proposer)
function wSugDraft(W,st){ const c=wCls(W), o={}, fill=(cur,n,cands)=>{ const a=Array.from({length:n},(_,i)=>cur[i]||""); const pool=cands.filter(x=>!a.includes(x)); for(let i=0;i<n;i++) if(!a[i]&&pool.length) a[i]=pool.shift(); return a; };
  const diff=(k,v)=>{ if(JSON.stringify(v)!==JSON.stringify(W[k])) o[k]=v; };
  if(st==="Historique"&&W.bg&&W.asiMode==="21"){ const abs=wBgAbs(W); if(abs.length===3){ const pr=wSugPrio(W).filter(a=>abs.includes(a)); const a2=W.asi2||pr.find(a=>a!==W.asi1), a1=W.asi1||pr.find(a=>a!==a2); diff("asi2",a2); diff("asi1",a1); } }
  if(st==="Caractéristiques"&&W.method==="std"){ const std=Object.assign({},W.std), free=STD_ARRAY.filter(v=>!AB.some(a=>+std[a]===v)); for(const a of wSugPrio(W)) if(!std[a]&&free.length) std[a]=String(free.shift()); diff("std",std); }
  if(st==="Compétences"&&c){ const have=[...wBgSkills(W),wSpSkills(W)?W.spSkill:""].filter(Boolean), n=c.skillChoices.count, from=c.skillChoices.from.filter(s=>!have.includes(s));
    const skills=fill(W.skills,n,[...(SUG_SK[c.id]||[]).filter(s=>from.includes(s)),...from]).filter(Boolean); diff("skills",skills);
    let extra=W.extraSkill; if(wIsHuman(W)&&srd("species",W.sp).traits.some(t=>t.name==="Compétent")&&!extra){ extra=["perception","discretion","athletisme",...S.C.skills.map(s=>s.id)].find(s=>!have.includes(s)&&!skills.includes(s))||""; diff("extraSkill",extra); }
    if(wStyle1(W)&&!W.style){ const l=wStyles(), d=l.find(x=>x[1]==="Défense")||l[0]; if(d) o.style=d[0]; }
    const ne=wExpN(W); if(ne){ const prof=[...new Set([...have,...skills,extra].filter(Boolean))], cur=(W.exp||[]).filter(s=>prof.includes(s)).slice(0,ne); diff("exp",fill(cur,ne,[...["discretion","escamotage","perception"].filter(s=>prof.includes(s)),...prof]).filter(Boolean)); } }
  if(st==="Sorts"&&c){ const cast=wCast(W), sg=SUG_SP[c.id]||[[],[]], D={cls:c}, refs=(l,pref)=>{ const all=l.map(x=>x.ref); return [...pref.map(i=>"srd:"+i).filter(r=>all.includes(r)),...all]; };
    const nc=wNC(W), np=cast?(cast.prepared||[])[0]||0:0; if(nc) diff("can",fill(W.can,nc,refs(classSpells(D,0),sg[0]))); if(np) diff("spl",fill(W.spl,np,refs(classSpells(D,null,1),sg[1])));
    // Manifestation : une qui ne demande pas d'autre choix (Armure d'ombres d'abord : meilleure CA qu'une armure légère au niveau 1)
    const ni=wInvN(W); if(ni){ const av=invAvailFor(wDoc(W),1).map(x=>x.id).filter(id=>!INV_CHOICE[id]); diff("inv",fill(W.inv,ni,["armure-dombres","esprit-occulte",...av].filter(id=>av.includes(id)))); } }
  if(st==="Niveaux"&&c){ const lv=wLvSug(W); if(JSON.stringify(lv)!==JSON.stringify(W.lv||{})) o.lv=lv; }
  if(st==="Langues") diff("langs",fill(wLangs(W),wLangN(W),["Elfique","Nain","Gobelin",...LANGS]).filter(Boolean));
  return o; }
function wLineName(W,st){ return st==="Niveaux"?`Niveaux 2 à ${wLvN(W)}`:st; }
/* Suggestions des niveaux 2 à N : remplit ce qui est vide, niveau par niveau (chaque niveau tient compte des précédents), sans toucher aux
   choix faits. Jamais de sous-classe ni de faveur épique proposée ; le style de combat va à Défense ; +2 sur la caractéristique principale. */
function wLvSug(W){ const c=wCls(W), out=JSON.parse(JSON.stringify(W.lv||{})), d=wBuild(W), sg=SUG_SP[c&&c.id]||[[],[]];
  const fill=(cur,n,cands)=>{ const a=Array.from({length:n},(_,i)=>(cur||[])[i]||""); const pool=cands.filter(x=>!a.includes(x)); for(let i=0;i<n;i++) if(!a[i]&&pool.length) a[i]=pool.shift(); return a; };
  for(let L=2;L<=wLvN(W);L++){ const before=JSON.parse(JSON.stringify(d)), p=levelPlan(before); if(p.from>=20||!p.cls) break;
    const P=Object.assign({},out[L]||{}), have=new Set((before.spells||[]).map(s=>s.ref).concat(Object.keys(p.D0.always||{})));
    if(p.asi&&P.asi!=="feat"&&!(P.ab1&&P.ab2)){ const ab=before.abilities||{}, room=a=>20-(+ab[a]||10), pr=wSugPrio(W).filter(a=>room(a)>0);
      if(pr.length){ const a=pr[0]; if(!P.ab1) P.ab1=a; if(!P.ab2) P.ab2=room(a)>=2?a:(pr[1]||a); } }
    if(p.style&&!P.style){ const l=wStyles(), x=l.find(s=>s[1]==="Défense")||l[0]; if(x) P.style=x[0]; }
    if(p.dInv){ const ex=(P.can||[]).filter(Boolean), av=invAvailFor(before,p.to,ex).map(x=>x.id).filter(id=>!INV_CHOICE[id]); P.inv=fill(P.inv,p.dInv,["armure-dombres","esprit-occulte","pacte-de-la-lame",...av].filter(id=>av.includes(id))); }
    if(p.dCantrips){ const l=classSpells(p.D0,0).map(x=>x.ref).filter(r=>!have.has(r)); P.can=fill(P.can,p.dCantrips,[...sg[0].map(i=>"srd:"+i).filter(r=>l.includes(r)),...l]); }
    if(p.dPrepared&&p.maxSpell){ const l=classSpells(p.D0,null,p.maxSpell).filter(x=>!have.has(x.ref)).sort((a,b)=>b.s.level-a.s.level), refs=l.map(x=>x.ref);
      P.spl=fill(P.spl,p.dPrepared,[...sg[1].map(i=>"srd:"+i).filter(r=>refs.includes(r)&&l.find(x=>x.ref===r).s.level===p.maxSpell),...refs]); }
    if(p.arc&&!P.arc){ const l=classSpells(p.D0,p.arc).map(x=>x.ref).filter(r=>!have.has(r)); if(l[0]) P.arc=l[0]; }
    for(const k of ["inv","can","spl"]) if(Array.isArray(P[k])&&!P[k].some(Boolean)) delete P[k];
    if(Object.keys(P).length) out[L]=P; lvlApplyTo(d,Object.assign({hp:"avg"},P),p); }
  return out; }
function wLines(W){ return [...wSteps(W).filter(s=>s!=="Identité"),"Détails"]; }
/* Suggestions visibles (retours d'Angle, 17 nov. 2026) : une ligne qui correspond à la suggestion affiche « Proposé » ; si le joueur
   la change, sa fenêtre propose « Revenir à la suggestion », qui ne remplace que les champs de cette ligne. Pour les niveaux, la
   sous-classe, la faveur épique et les PV choisis sont gardés. */
const SUG_F={"Historique":["asi2","asi1"],"Caractéristiques":["std"],"Compétences":["skills","extraSkill","style","exp"],"Sorts":["can","spl","inv"],"Langues":["langs"]};
const SUG_LV=["asi","ab1","ab2","style","inv","can","spl","arc"];
const wNz=v=>v==null?"":Array.isArray(v)?JSON.stringify(v.filter(Boolean)):typeof v==="object"?JSON.stringify(Object.keys(v).sort().filter(k=>v[k]!==""&&v[k]!=null).map(k=>[k,String(v[k])])):String(v);
// Ce que la suggestion donnerait pour cette ligne si elle était vide : {champ: valeur}, ou null si la ligne n'a pas de suggestion
function wSugFresh(W,st){ const C=JSON.parse(JSON.stringify(W)), N=wLvN(W);
  if(st==="Niveaux"){ if(N<2||!wCls(W)) return null; for(const L of Object.keys(C.lv||{})) if(+L<=N) for(const f of SUG_LV) delete C.lv[L][f]; return {lv:wLvSug(C)}; }
  const F=SUG_F[st]; if(!F||!wCls(W)) return null;
  for(const f of F) C[f]=Array.isArray(W[f])?[]:(f==="std"?{}:"");
  Object.assign(C,wSugDraft(C,st)); const o={}; for(const f of F) o[f]=C[f];
  return F.some(f=>wNz(o[f])!==wNz(f==="std"?{}:Array.isArray(W[f])?[]:""))?o:null; }
function wSugKey(W,st,o){ if(st!=="Niveaux") return SUG_F[st].map(f=>wNz(o[f])).join("|"); const N=wLvN(W), lv=o.lv||{};
  return Array.from({length:Math.max(0,N-1)},(_,i)=>SUG_LV.map(f=>wNz((lv[i+2]||{})[f])).join(",")).join("|"); }
function wSugSame(W,st){ const R=wSugFresh(W,st); return !!R&&wSugKey(W,st,W)===wSugKey(W,st,R); }
function wSugReset(W,st){ const R=wSugFresh(W,st); if(!R) return; if(st!=="Niveaux"){ Object.assign(W,R); return; }
  const N=wLvN(W); W.lv=W.lv||{}; for(const L of Object.keys(R.lv)) if(+L<=N){ const P=W.lv[L]=W.lv[L]||{}; for(const f of SUG_LV){ if(R.lv[L][f]!==undefined) P[f]=R.lv[L][f]; else delete P[f]; } } }
function wLineMsg(W,st){ const i=wSteps(W).indexOf(st); return i<0?"":wCheck(W,i); }
function wLineVal(W,st){ const c=wCls(W), nm=id=>(S.C.skills.find(k=>k.id===id)||{}).name||id, pl=(n,w)=>n+" "+w+(n>1?"s":"");
  if(st==="Classe"){ const o=wOrder(W); return c?c.name+(o?" · "+o.name:""):""; }
  if(st==="Historique"){ const b=wBg(W); if(!b) return ""; const x=wBonus(W), bon=AB.filter(a=>x[a]).map(a=>"+"+x[a]+" "+ABS[a]).join(", "), sb=srd("backgrounds",W.bg), ft=sb?sb.feat:(hb(W.feat)||S.C.feats.find(f=>"srd:"+f.id===W.feat)||{}).name||b.feat||""; return b.name+(bon?" · "+bon:"")+(ft?" · don : "+ft:""); }
  if(st==="Espèce"){ const s=srd("species",W.sp)||hb(W.sp); if(!s) return ""; const def=LINEAGES[String(W.sp||"").replace(/^srd:/,"")], o=def&&def.opts[W.lin], hf=wIsHuman(W)&&W.hFeat&&W.hFeat!==wBgFeat(W)?(S.C.feats.find(f=>"srd:"+f.id===W.hFeat)||hb(W.hFeat)||{}).name:""; return s.name+(o?" · "+o.name:"")+(hf?" · don : "+hf:""); }
  if(st==="Caractéristiques"){ const b=wBase(W), f=wAbilities(W); return AB.some(a=>b[a]==null)?({std:"Tableau standard",pts:"Achat de points",dice:"Dés (4d6)"})[W.method]:AB.map(a=>ABS[a]+" "+f[a]).join(" · "); }
  if(st==="Compétences"){ if(!c) return ""; const l=[...W.skills,W.extraSkill].filter(Boolean); return l.length?l.map(nm).join(", "):"0 / "+c.skillChoices.count; }
  if(st==="Sorts"){ const n=[...W.can,...W.spl].filter(Boolean).length; return n?pl(n,"sort")+" choisi"+(n>1?"s":""):""; }
  if(st==="Langues") return [...wLangFixed(W),...wLangs(W)].join(", ");
  if(st==="Niveaux"){ const s=wLevels(W).steps, ok=s.filter(x=>!wLvMsg(x)).length; return `${s.length} niveau${s.length>1?"x":""} · ${ok}/${s.length} complet${ok>1?"s":""}`; }
  if(st==="Équipement"){ if(!c) return ""; const e=wEqItems(W); return pl(e.items.length,"objet")+" · "+e.gold+" po"; }
  if(st==="Détails") return [wAlign(W),String(W.notes||"").trim()?"notes":""].filter(Boolean).join(" · ")||"Alignement, notes (facultatif)";
  return ""; }
// Compteur de ce qui reste à faire et bouton d'état : tant qu'il manque quelque chose, le bouton est grisé et le nomme
function wFoot(W){ if(W.mode==="guide") return wGFoot(W); const n=wNeeds(W), names=n.map(x=>x.name==="Identité"?"nom":x.name.toLowerCase());
  return `<div class="wfootbar" id="wfoot"><div class="wleft" role="status">${n.length?`<b>Reste à faire (${n.length})</b> <span class="muted">${esc(names.join(", "))}</span>`:`<span class="muted">Tout est choisi.</span>`}</div><button class="btn primary" data-act="wcreate" ${n.length?"disabled":""}>${esc(n.length?n[0].msg:"Créer le personnage")}</button></div>`; }
// Sur téléphone, le compteur est aussi en haut de la page (le pied est loin) ; caché sur ordinateur
function wCount(W){ const g=W.mode==="guide", n=g?wGNeeds(W,wGStep(W)):wNeeds(W); return `<div class="wcount" id="wcount" aria-hidden="true">${n.length?`<b>Reste à faire (${n.length})</b> <span class="muted">${esc(n.map(x=>x.name==="Identité"?"nom":x.name.toLowerCase()).join(", "))}</span>`:`<b>Tout est choisi.</b> <span class="muted">${g&&wGStep(W)<2?"Tu peux passer à la suite.":"Tu peux créer le personnage."}</span>`}</div>`; }
/* Deux modes sur le même état S.W (chantier 17) : W.mode "" = direct (une page, toutes les lignes), "guide" = trois écrans préremplis,
   "?" = écran de choix du mode, montré seulement à l'entrée d'une création neuve. On passe de l'un à l'autre sans rien perdre. */
function viewWizard(){ const W=S.W; wDraftSave(); // chaque affichage enregistre le brouillon
  return (W.mode==="?"?wModeView(W):W.mode==="guide"?wGuideView(W):wDirectView(W))+wClsAskHtml(W)+(S.wReview&&W.mode!=="guide"&&W.mode!=="?"?wReviewHtml(W):""); }
/* Suites de l'audit ChatGPT de la création (17 nov. 2026)
   1. Changer de classe efface ce qui en dépend : on le dit avant, avec Annuler (S.wClsAsk = classe demandée). */
function wClsLoss(W){ const L=[], some=a=>(Array.isArray(a)?a:[]).some(Boolean), N=wLvN(W);
  if(some(W.skills)) L.push("compétences de classe"); if(some(W.exp)) L.push("expertise"); if(W.order) L.push("ordre"); if(Array.isArray(W.mast)) L.push("bottes d’arme");
  if(some(W.can)||some(W.spl)) L.push("sorts"); if(some(W.inv)) L.push("manifestations");
  if(W.eqC!=="A"||Object.keys(W.eqOff||{}).length) L.push("équipement de classe");
  if(N>1&&Object.keys(W.lv||{}).some(k=>+k<=N&&W.lv[k]&&Object.keys(W.lv[k]).length)) L.push("choix des niveaux 2 à "+N);
  return L; }
function wClsAskHtml(W){ const v=S.wClsAsk; if(!v) return ""; const c=srd("classes",catRes(v))||hb(catRes(v))||{}, L=wClsLoss(W);
  return `<div class="askover" role="alertdialog" aria-modal="true" aria-label="Changer de classe ?"><div class="askbox"><b>Passer en ${esc(c.name||"nouvelle classe")} ?</b><div class="muted" style="font-size:var(--fs-sm)">Ces choix dépendent de la classe et seront à refaire : ${esc(L.join(", "))}.</div><div class="row" style="justify-content:flex-end;gap:8px"><button class="btn small ghost" data-act="wclsNo">Annuler</button><button class="btn small primary" data-act="wpick" data-k="cls" data-v="${esc(v)}" data-ok="1">Changer de classe</button></div></div></div>`; }
/* 2. Relecture avant création (mode direct) : chaque ligne ouvre ses choix ; un résumé par niveau. */
function wLvSum(st){ const {p,P}=st, out=[], ft=r=>(S.C.feats.find(f=>"srd:"+f.id===r)||hb(r)||{}).name||"", sn=r=>(spellOf(r)||{}).name||"";
  if(P.sub) out.push("sous-classe "+(((p.cls&&p.cls.subclasses)||[]).find(s=>"srd:"+s.id===P.sub)||hb(P.sub)||{name:"choisie"}).name);
  if(p.epic&&P.feat) out.push("faveur "+ft(P.feat)); else if(p.asi){ if(P.asi==="feat"&&P.feat) out.push("don "+ft(P.feat)); else if(P.ab1&&P.ab2) out.push(P.ab1===P.ab2?"+2 "+ABN[P.ab1]:"+1 "+ABN[P.ab1]+", +1 "+ABN[P.ab2]); }
  if(P.style) out.push("style "+(ft(P.style)||"choisi"));
  const sp=[...(P.can||[]),...(P.spl||[])].filter(Boolean).map(sn).filter(Boolean); if(sp.length) out.push("sorts : "+sp.join(", "));
  const inv=(P.inv||[]).filter(Boolean).length; if(inv) out.push(inv+" manifestation"+(inv>1?"s":""));
  if(P.arc) out.push("arcanum "+sn(P.arc));
  out.push(P.hp==="roll"?"PV : dé de "+P.roll:"PV : moyenne");
  return out.join(" · "); }
function wReviewHtml(W){ const n=wNeeds(W), rows=wLines(W).filter(st=>st!=="Niveaux").map(st=>`<button class="wrevrow" data-act="wrevgo" data-v="${esc(st)}"><span class="label">${esc(st)}</span> <span>${esc(wLineVal(W,st)||"—")}</span></button>`).join("");
  const lv=wLvN(W)>1?wLevels(W).steps.map(st=>`<button class="wrevrow" data-act="wrevgo" data-v="Niveaux" data-l="${st.L}"><span class="label">Niveau ${st.L}</span> <span>${esc(wLvMsg(st)||wLvSum(st))}</span></button>`).join(""):"";
  return `<div class="askover" role="dialog" aria-modal="true" aria-label="Relecture avant création"><div class="askbox wreview"><b>Relecture avant création</b><div class="muted" style="font-size:var(--fs-sm)">${esc(W.name||"Nouveau personnage")} · niveau ${wLvN(W)}. Touche une ligne pour la modifier.</div>
    <div class="wrevlist">${rows}${lv?`<div class="label" style="margin-top:6px">Niveaux 2 à ${wLvN(W)}</div>${lv}`:""}</div>
    <div class="row" style="justify-content:flex-end;gap:8px"><button class="btn small ghost" data-act="wrevNo">Modifier</button><button class="btn small primary" data-act="wcreate" data-ok="1"${n.length?" disabled":""}>Créer le personnage</button></div></div></div>`; }
function wModeView(W){ return `<div class="list-head"><div><h1>Nouveau personnage</h1><div class="muted">Comment veux-tu le créer ? Tu pourras changer de mode en cours de route.</div></div><button class="btn ghost" data-act="wcancel" title="Efface cette création en cours">Abandonner</button></div>
    <div class="wmodes"><button class="wcard wmodec" data-act="wmode" data-v="guide"><b>Guidé</b><span>Pour débuter. Trois écrans, et des propositions déjà faites : tu valides ou tu changes. Le personnage commence au niveau 1.</span></button>
    <button class="wcard wmodec" data-act="wmode" data-v="direct"><b>Direct</b><span>Une seule page avec tous les choix, dans l'ordre que tu veux. Pour créer vite, ou à un niveau plus élevé.</span></button></div>`; }
// Mode guidé : les trois écrans et les sujets de chacun
const G_STEPS=[["Qui es-tu ?",["Identité","Classe"]],["D'où viens-tu ?",["Historique","Espèce"]],["Finitions",["Caractéristiques","Compétences","Sorts","Langues","Équipement"]]];
function wGStep(W){ return Math.max(0,Math.min(2,+W.gstep||0)); }
function wGNeeds(W,i){ return wNeeds(W).filter(n=>G_STEPS[i][1].includes(n.name)); }
function wGFirst(W){ for(let i=0;i<3;i++) if(wGNeeds(W,i).length) return i; return 2; }
// Préremplissage du mode guidé : les suggestions, qui ne touchent jamais à un choix déjà fait
function wGuideFill(W,list){ for(const st of list) Object.assign(W,wSugDraft(W,st)); }
function wGFoot(W){ const i=wGStep(W), n=wGNeeds(W,i);
  return `<div class="wfootbar" id="wfoot">${i?`<button class="btn" data-act="wgprev">← Retour</button>`:""}<div class="wleft muted" role="status">Étape ${i+1} sur 3</div><button class="btn primary" data-act="${i<2?"wgnext":"wcreate"}" ${n.length?"disabled":""}>${esc(n.length?n[0].msg:i<2?"Suivant : "+G_STEPS[i+1][0]:"Créer le personnage")}</button></div>`; }
function wGuideView(W){ const i=wGStep(W); let h="";
  if(i===0) h=`<label class="field wgname"><span>Comment s'appelle ton personnage ?</span><input type="text" data-w="name" value="${esc(W.name)}" maxlength="80" autocomplete="off"></label><h2 class="wgh">Sa classe</h2>${wStepBody(W,"Classe")}`;
  if(i===1) h=`<h2 class="wgh">Son historique</h2>${wStepBody(W,"Historique")}${W.bg&&wSugFresh(W,"Historique")&&!wSugSame(W,"Historique")?`<div><button class="btn small" data-act="wsugreset" data-v="Historique">Revenir à la suggestion (bonus de caractéristiques)</button></div>`:""}<h2 class="wgh">Son espèce</h2>${wStepBody(W,"Espèce")}`;
  if(i===2){ const n=wGNeeds(W,2); h=`<p class="${n.length?"wgleft":"muted"}">${n.length?`Presque tout est proposé d'après ta classe et ton origine. Il reste à choisir : ${esc(n.map(x=>x.msg.replace(/\.$/,"").replace(/^Choisis /,"").replace(/^ta /,"")+" (ligne "+x.name+")").join(" ; "))}.`:"Tout est déjà proposé d'après ta classe et ton origine. Touche une ligne pour voir ou changer."}</p>`; }
  if(i===2) h+=`<div class="wlines">${[...G_STEPS[2][1].filter(s=>wSteps(W).includes(s)),"Détails"].map(st=>wRow(W,st)).join("")}</div>`;
  return `<div class="list-head"><div><h1>${esc(G_STEPS[i][0])}</h1><div class="muted">Étape ${i+1} sur 3 · mode guidé <button class="btn small ghost wswitch" data-act="wmode" data-v="direct">Passer en mode direct</button></div></div><button class="btn ghost" data-act="wcancel" title="Efface cette création en cours">Abandonner</button></div>${wCount(W)}
    <div class="wz"><section class="stack" style="min-width:0">${h}${wGFoot(W)}</section>${wPreview(W)}</div>`; }
// Une ligne pas encore ouverte reste neutre (« À choisir ») ; le rouge est gardé pour une ligne ouverte puis laissée incomplète
function wRow(W,st){ const c=wCls(W), msg=wLineMsg(W,st), val=wLineVal(W,st), lock=!c&&(st==="Compétences"||st==="Équipement"), seen=!!(W.seen||{})[st];
    return `<button class="wline${msg?" todo":" done"}" data-act="wopen" data-v="${esc(st)}" ${lock?"disabled":""}><span class="nm">${esc(wLineName(W,st))}</span><span class="val">${val?esc(val):`<span class="muted">—</span>`}${!msg&&(SUG_F[st]||st==="Niveaux")&&wSugSame(W,st)?`<small class="wsugtag">Proposé · modifiable</small>`:""}${msg?(lock||!seen?`<small class="muted">${esc(lock?msg:"À choisir")}</small>`:`<small class="warntxt">${esc(msg)}</small>`):""}</span><span class="st" aria-hidden="true">${msg||st==="Détails"?"":"✓"}</span></button>`; }
function wDirectView(W){ const c=wCls(W), lv=+W.level||1, rows=wLines(W).map(st=>wRow(W,st)).join("");
  return `<div class="list-head"><div><h1>Nouveau personnage</h1><div class="muted">Chaque ligne ouvre ses choix. Fais-les dans l'ordre que tu veux. <button class="btn small ghost wswitch" data-act="${+W.level>1?"wmodeask":"wmode"}" data-v="guide">Passer en mode guidé</button></div></div><button class="btn ghost" data-act="wcancel" title="Efface cette création en cours">Abandonner</button></div>${wCount(W)}
    ${W.askGuide&&+W.level>1?`<div class="panel stack wask" role="alert"><div>Le mode guidé crée le personnage au <b>niveau 1</b>. Ton niveau de départ (${+W.level}) sera remis à 1 ; tes autres choix sont gardés.</div><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn primary" data-act="wmode" data-v="guide">Passer en guidé, au niveau 1</button><button class="btn" data-act="wmodeno">Rester en direct</button></div></div>`:""}
    <div class="wz"><section class="stack" style="min-width:0">
      <div class="wid"><label class="field"><span>Nom (obligatoire)</span><input type="text" data-w="name" value="${esc(W.name)}" maxlength="80" autocomplete="off"></label><label class="field"><span>Joueur</span><input type="text" data-w="player" value="${esc(W.player)}"></label><label class="field"><span>Niveau de départ</span><input type="number" min="1" max="20" data-w="level" value="${esc(W.level)}"></label></div>
      <div class="wlines">${rows}</div>${wFoot(W)}</section>${wPreview(W)}</div>`; }
// Fenêtre d'une ligne : ses choix, ce qui manque encore, et un bouton pour revenir à la page
function wModal(){ const W=S.W, st=W.open, msg=wLineMsg(W,st);
  return `<div class="picker" data-act="wclose"><div class="box wbox" role="dialog" aria-label="${esc(st)}" style="grid-template-rows:auto minmax(0,1fr) auto;max-width:760px">
    ${winHead(esc(wLineName(W,st)),"wclose")}<div class="stack wbody">${wStepBody(W,st)}</div>
    ${winFoot(`${Object.keys(wSugDraft(W,st)).length?`<button class="btn small" data-act="wsug" title="Remplit ce qui est encore vide ; tu peux tout changer ensuite">Suggestion</button>`:wSugFresh(W,st)&&!wSugSame(W,st)?`<button class="btn small" data-act="wsugreset" title="Remplace les choix de cette ligne par la proposition">Revenir à la suggestion</button>`:""}<span class="warntxt wmsg" role="status" style="font-size:var(--fs-sm);flex:1;align-self:center">${esc(msg)}</span><button class="btn primary" data-act="wclose">${msg?"Fermer":"Valider"}</button>`)}</div></div>`; }
// Fiche de niveau 1 telle qu'elle sera créée (équipement porté, attaques, PV) : sert à l'aperçu, aux niveaux 2 à N et à la création
function wBuild(W){ const c=wCls(W), d=wDoc(W); d.armor="none"; d.shield=false;
  const eq=wEqItems(W); for(const it of eq.items) d.bag.push({id:uid(),name:it.name,qty:it.qty,note:""}); d.gold={po:eq.gold};
  for(const b of d.bag){ const e=eqInfo(b); if(e.type==="weapon"&&!d.attacks.some(a=>a.weapon==="srd:"+e.w.id)) d.attacks.push({id:uid(),name:e.w.name,weapon:"srd:"+e.w.id,ability:"auto",prof:true}); }
  { const m=wMast(W); if(m.n&&Array.isArray(W.mast)) d.masteries=m.list; } // sans retouche : la fiche garde son choix par défaut (premières armes)
  const arm=d.bag.find(b=>eqInfo(b).type==="armor"); if(arm) eqSet(d,"corps",arm.id);
  const sh=d.bag.find(b=>eqInfo(b).type==="shield"); if(sh&&c&&(c.armor||[]).includes("bouclier")) eqSet(d,"mainS",sh.id);
  const D=derive(d); d.hp={cur:D.hpMax,temp:0}; return d; }
/* Niveaux 2 à N (chantier 17, lot C) : les choix de chaque niveau sont dans W.lv[L] (mêmes clés que la fenêtre de montée de niveau : hp, roll,
   sub, asi, ab1, ab2, feat, style, stc, inv, invc, can, spl, arc). Ils sont appliqués dans l'ordre, avec lvlApplyTo, sur une copie (aperçu)
   ou sur la fiche créée : un personnage créé au niveau N est identique à un personnage monté de 1 à N à la main. */
function wLvN(W){ return W.mode==="guide"?1:Math.max(1,Math.min(20,Math.round(+W.level)||1)); }
function wLvP(W,L){ const P=W.lv&&W.lv[L]; return Object.assign({hp:"avg"},P&&typeof P==="object"&&!Array.isArray(P)?JSON.parse(JSON.stringify(P)):{}); }
let W_LV_CACHE={k:"",v:null};
function wLevels(W,fresh){ const k=JSON.stringify([W,Object.keys(S.docs).length]); if(!fresh&&W_LV_CACHE.k===k) return W_LV_CACHE.v;
  const d=wBuild(W), steps=[]; for(let L=2;L<=wLvN(W);L++){ const before=JSON.parse(JSON.stringify(d)), p=levelPlan(before); if(p.from>=20||!p.cls) break; const P=wLvP(W,L); steps.push({L,p,P,before}); lvlApplyTo(d,P,p); }
  const v={d,steps}; if(!fresh) W_LV_CACHE={k,v}; return v; }
// Ce qui manque à un niveau (tous les choix sont obligatoires à la création ; les PV ont la moyenne par défaut)
function wLvMsg(st){ const {L,p,P,before}=st, x="Niveau "+L+" : ", n=(a,k)=>(Array.isArray(a)?a:[]).slice(0,k).filter(Boolean).length;
  const have=new Set((before.spells||[]).map(s=>s.ref).concat(Object.keys(p.D0.always||{}))), left=l=>l.filter(s=>!have.has(s.ref)).length;
  if(P.hp==="roll"&&!(+P.roll>=1&&+P.roll<=p.hd)) return x+"saisis ton dé de vie (1 à "+p.hd+").";
  if(p.needSub&&!P.sub) return x+"choisis ta sous-classe.";
  if(p.asi&&P.asi!=="feat"&&!(P.ab1&&P.ab2)) return x+"choisis tes augmentations de caractéristique.";
  if(((p.asi&&P.asi==="feat")||p.epic)&&!P.feat) return x+(p.epic?"choisis ta faveur épique.":"choisis ton don.");
  if(p.style&&!P.style) return x+"choisis ton style de combat.";
  if(p.style&&P.style==="alt"&&n(P.stc,2)<2) return x+"choisis tes deux sorts mineurs.";
  if(p.dInv){ if(n(P.inv,p.dInv)<p.dInv) return x+"choisis "+(p.dInv>1?"tes manifestations.":"ta manifestation."); if((P.inv||[]).slice(0,p.dInv).some((id,i)=>id&&INV_CHOICE[id]&&!(P.invc||[])[i])) return x+"choisis la cible de ta manifestation."; }
  if(p.dCantrips&&n(P.can,p.dCantrips)<Math.min(p.dCantrips,left(classSpells(p.D0,0)))) return x+"choisis "+(p.dCantrips>1?"tes sorts mineurs.":"ton sort mineur.");
  if(p.dPrepared&&p.maxSpell&&n(P.spl,p.dPrepared)<Math.min(p.dPrepared,left(classSpells(p.D0,null,p.maxSpell)))) return x+"choisis "+(p.dPrepared>1?"tes sorts.":"ton sort.");
  if(p.arc&&!P.arc) return x+"choisis ton arcanum mystique.";
  return ""; }
function wCreate(){ S.wReview=false; S.wClsAsk=null;
  const W=S.W; const id="perso_"+uid(); const d=wLevels(W,true).d; S.docs[id]=d; // niveaux 2 à N déjà appliqués : pas de fenêtre ensuite
  touch(id); S.cur=id; S.view="sheet"; S.tab="jeu"; S.W=null; wDraftClear();
  for(const hid of W.catMade||[]) if(S.docs[hid]&&S.docs[hid].pending&&!hbUsed(hid)) removeDoc(hid);
  render(); rvStart(id);
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
  if(ch.noteLog!==undefined&&(!Array.isArray(ch.noteLog)||ch.noteLog.length>500||ch.noteLog.some(n=>!n||typeof n.id!=="string"||n.id.length>40||!Number.isFinite(n.t)||(n.u!==undefined&&!Number.isFinite(n.u))||typeof n.text!=="string"||n.text.length>20000))) importFail("Les notes de partie sont invalides.");
  if(ch.useFreq!==undefined&&(!ch.useFreq||typeof ch.useFreq!=="object"||Array.isArray(ch.useFreq)||Object.keys(ch.useFreq).length>60||Object.entries(ch.useFreq).some(([k,v])=>k.length>120||!Array.isArray(v)||v.length!==2||v.some(x=>!Number.isFinite(x))))) importFail("Les jets les plus utilisés sont invalides.");
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
