/* ---------- remplissage automatique (AideDD + Claude) ---------- */
const AF={ready:false,web:false};
async function afInit(){ AF.ready=PLATFORM.hasAI; AF.web=PLATFORM.hasBrowser; if(AF.ready) render(); }
function afBtn(attrs){ if(!AF.ready) return ""; return `<span class="afwrap"><button class="btn small" data-act="afRun" ${attrs}>Remplir automatiquement</button><small class="muted">Nécessite un compte Claude AI · sources web : app Claude sur ordinateur</small></span>`; }
const AF_SKILLS=()=>S.C.skills.map(s=>s.id+"="+s.name).join(", ");
function afSpec(kind){
  const ab='"for"|"dex"|"con"|"int"|"sag"|"cha"';
  if(kind==="sort") return `"level": 0-9, "school": "Abjuration…", "casting_time": "Action|Action bonus|Réaction|1 minute…", "range": "…", "components": "V, S, M (…)", "duration": "…", "concentration": bool, "ritual": bool, "mech": {"attack": bool (jet d'attaque de sort), "save": "Force|Dextérité|Constitution|Intelligence|Sagesse|Charisme" ou "", "dice": "2d10" ou "", "dmgType": "feu…" ou "", "upDice": dés en plus par niveau d'emplacement supérieur ("1d10") ou "", "heal": bool (soins), "addMod": bool (ajoute le modificateur d'incantation), "tempHp": PV temporaires par niveau d'emplacement (nombre, 0 sinon)}`;
  if(kind==="objet") return `"dice": dés de dégâts si c'est une arme sinon "", "dmgType": "", "properties": ""`;
  if(kind==="espece") return `"speed": vitesse en mètres (nombre)`;
  if(kind==="historique") return `"abilities": [3 parmi ${ab}], "skills": [2 identifiants de compétence], "tools": "outil"`;
  if(kind==="sous-classe") return `"features": [{"level": n, "name": "…", "summary": "résumé de l'aptitude avec tes mots"}]`;
  if(kind==="classe") return `"hitDie": 6|8|10|12, "primary": [${ab}], "saves": [2 × ${ab}], "armor": {"legere":bool,"intermediaire":bool,"lourde":bool,"bouclier":bool}, "weapons": "", "tools": "", "skillCount": n, "skillFrom": [identifiants de compétence], "castType": ""|"full"|"half"|"pact", "castAbility": ${ab}, "subclassLevel": n, "features": [{"level": n, "name": "…", "summary": "…"}] (sans les améliorations de caractéristique)`;
  return "";
}
function afPrompt(kind,name,url,page){
  return `Tu remplis une fiche de règles D&D 2024 en français pour une appli de personnage, à partir du texte d'une page AideDD.
Élément cherché : « ${name} » (type : ${HB_KINDS[kind]||kind}). URL : ${url}
 
Règles :
- Si la page ne décrit pas cet élément (page d'erreur, autre élément, contenu vide), réponds {"found": false}.
- "summary" : un résumé en français, écrit avec TES mots (3 à 8 phrases), qui garde toute la mécanique utile en jeu : dés, DD, portée, durée, niveaux, coût d'action, recharges, bonus, conditions. Ne recopie aucune phrase de la page.
- Les champs mécaniques doivent être exacts d'après la page ; mets "" ou 0 quand l'information n'existe pas.
- "book" : le livre source indiqué sur la page, traduit en français s'il y a un équivalent (Player's Handbook 2024 → "Manuel des joueurs (2024)"), sinon "".
- Identifiants de compétence autorisés : ${AF_SKILLS()}.
Réponds uniquement avec un objet JSON : {"found": true, "book": "…", "summary": "…"${afSpec(kind)?", "+afSpec(kind):""}}
 
Texte de la page :
"""
${String(page).slice(0,16000)}
"""`; }
/* index des pages AideDD candidates pour « la page la plus proche » */
const AIDE_IDX=(()=>{ const r=(l)=>l.split("|").map(x=>{ const [n,p]=x.split("="); return [n,AIDE+p]; });
  const ua="/dnd-5/unearthed-arcana/", ua5="/dnd-5/unearthed-arcana-5-5/";
  const cls="barbare,barde,clerc,druide,ensorceleur,guerrier,magicien,moine,occultiste,paladin,rodeur,roublard".split(",");
  const races=r("Elfe (2014)=/regles/races/elfe/|Halfelin (2014)=/regles/races/halfelin/|Humain (2014)=/regles/races/humain/|Nain (2014)=/regles/races/nain/|Demi-elfe (2014)=/regles/races/demi-elfe/|Demi-orc (2014)=/regles/races/demi-orc/|Drakéide (2014)=/regles/races/drakeide/|Gnome (2014)=/regles/races/gnome/|Tieffelin (2014)=/regles/races/tieffelin/|Aarakocra (2014)=/regles/races/aarakocra/|Génasi (2014)=/regles/races/genasis/|Gnome des profondeurs (2014)=/regles/races/gnome-des-profondeurs/|Goliath (2014)=/regles/races/goliath/|Espèces 2024 (SRD)=/regles-24/origines-des-personnages/description-des-especes/");
  const uaRaces=r(`UA Eberron : Races=${ua}eberron/|UA Éladrin et gith=${ua}eladrin-et-gith/|UA Elfes=${ua}elfes/|UA Fiélons=${ua}fielons/|UA Peuples de la Féerie=${ua}peuples-de-la-feerie/|UA Races de Ravnica=${ua}races-de-ravnica/|UA Voyageurs du multivers=${ua}voyageurs-du-multivers/|UA Lignées gothiques=${ua}lignees-gothiques/|UA Héros de Krynn=${ua}heros-de-krynn/|UA Options draconiques=${ua}options-draconiques/|UA 5.5 Options d'Outreterre=${ua5}options-doutreterre/|UA 5.5 Options d'Outreterre 2=${ua5}options-doutreterre-2/|UA 5.5 Options maléfiques=${ua5}options-malefiques/|UA 5.5 Options maléfiques 2=${ua5}options-malefiques-2/`);
  const hist=r("Historiques 2024 (SRD)=/regles-24/origines-des-personnages/description-des-historiques/|"+"acolyte,artisan-de-guilde,artiste,charlatan,criminel,enfant-des-rues,ermite,heros-du-peuple,marin,noble,sage,sauvageon,soldat,chasseur-de-primes-urbain,hante,voyageur,captif,idiot-du-village".split(",").map(s=>s.replace(/-/g," ").replace(/^./,c=>c.toUpperCase())+" (2014)=/regles/historiques/"+s+"/").join("|"));
  const uaHist=r(`UA Héros gothiques=${ua}heros-gothiques/|UA Mages de Strixhaven=${ua}mages-de-strixhaven/|UA Héros de Krynn=${ua}heros-de-krynn/|UA 5.5 Options d'Outreterre=${ua5}options-doutreterre/|UA 5.5 Options maléfiques=${ua5}options-malefiques/`);
  const classes=[...cls.map(c=>[c.charAt(0).toUpperCase()+c.slice(1)+" (2024)",AIDE+"/regles-24/classes/"+c+"/"]),...cls.map(c=>[c.charAt(0).toUpperCase()+c.slice(1)+" (2014)",AIDE+"/regles/classes/"+c+"/"]),...r(`UA Eberron : Artificier=${ua}artificier/|UA 5.5 Psion=${ua5}psion/|UA Psioniques : mystique=${ua}psioniques/|UA Le fidèle=${ua}le-fidele/|UA Rôdeur v2=${ua}rodeur/|UA Classes de prestige=${ua}classes-de-prestige/`)];
  const subs=r(`UA Archétypes martiaux=${ua}archetypes-martiaux/|UA Archétypes de rôdeur=${ua}archetypes-de-rodeur/|UA Archétypes de roublard=${ua}archetypes-de-roublard/|UA Cercles druidiques=${ua}cercles-druidiques/|UA Collèges bardiques=${ua}colleges-bardiques/|UA Domaines divins=${ua}domaines-divins/|UA Origines magiques d'ensorceleur=${ua}origines-magiques-densorceleur/|UA Patrons d'Outremonde=${ua}patrons-doutremonde/|UA Serments sacrés=${ua}serments-sacres/|UA Traditions arcaniques=${ua}traditions-arcaniques/|UA Traditions monastiques=${ua}traditions-monastiques/|UA Voies primitives=${ua}voies-primitives/|UA Sous-classes psioniques=${ua}sous-classes-psioniques/|UA 5.5 Sous-classes des Royaumes Oubliés=${ua5}sous-classes-des-royaumes-oublies/|UA 5.5 Sous-classes horrifiques=${ua5}sous-classes-horrifiques/|UA 5.5 Sous-classes arcaniques=${ua5}sous-classes-arcaniques/|UA 5.5 Sous-classes apocalyptiques=${ua5}sous-classes-apocalyptiques/|UA 5.5 Sous-classes mystiques=${ua5}sous-classes-mystiques/`);
  const feats=r(`Liste des dons 2024=/feat/fr/|UA Dons=${ua}dons/|UA Dons (armes & outils)=${ua}dons-1/|UA Dons (compétences)=${ua}dons-2/`);
  return {espece:[...races,...uaRaces],historique:[...hist,...uaHist],classe:classes,"sous-classe":[...subs,...classes.slice(0,12)],don:feats,aptitude:[...feats,...subs],sort:r(`Liste des sorts 2024=/spell/fr/|UA Tatouages magiques=${ua}sorts-et-tatouages-magiques/`),objet:r(`Liste des objets magiques 2024=/magic-item/fr/|UA Eberron : Objets magiques=${ua}eberron-objets-magiques/`)}; })();
async function afNearest(kind,name){
  const list=AIDE_IDX[kind]||[]; if(!list.length) return null;
  const d=await PLATFORM.aiJson(`Sur le site AideDD, aucune page dédiée n'existe pour l'élément D&D « ${name} » (type : ${HB_KINDS[kind]||kind}). Choisis dans la liste ci-dessous la page la plus susceptible de le décrire, ou la plus proche (autre version : 2014, Unearthed Arcana ; ou élément très voisin). Si rien n'est pertinent, renvoie "url": "".
Réponds uniquement en JSON : {"url": "…", "title": "…", "why": "une phrase courte en français"}
Liste (titre = url) :
${list.map(([n,u])=>n+" = "+u).join("\n")}`,{modelTier:"quick"});
  if(!d||!d.url||!list.some(([,u])=>u===d.url)) return null;
  return {url:d.url,title:String(d.title||list.find(([,u])=>u===d.url)[0]),why:String(d.why||"")};
}
async function afRun(target,forceUrl,approx){
  const src=target.mode==="hb"?Object.assign({_id:target.id},S.docs[target.id]):Object.assign({},S.W&&S.W.nh);
  const name=String(src.name||"").trim(), kind=src.kind;
  if(!name){ S.af={state:"err",msg:"Donne d'abord un nom à l'élément."}; renderModal(); return; }
  if(!forceUrl&&!safeUrl(src.link)&&!["sort","don","objet","classe","sous-classe"].includes(kind)) return afNear(target,kind,name,"AideDD n'a pas de page dédiée à ce type d'élément hors SRD.");
  const url=forceUrl||safeUrl(src.link)||aideGuess(Object.assign({},src,{name}));
  if(!AF.web){ S.af={state:"mem",msg:"Ici, Claude ne peut pas lire de pages web (il faut l'app Claude sur ordinateur, pour le propriétaire de l'appli).",name,kind,target}; renderModal(); return; }
  S.af={state:"run",msg:"Lecture de la page AideDD…",url,name}; renderModal();
  let page="", tab=null, opened=null; S.afTabNote=null;
  try{
    const r=await PLATFORM.browserCall("preview_start",{url}); opened=r; tab=afTab(r);
    const big=/#/.test(url);
    const g=await PLATFORM.browserCall("get_page_text",Object.assign({max_chars:big?200000:20000},tab?{tabId:tab}:{}));
    page=afTxt(g); if(big&&!/Title:\s*Error|Error 404|does not exist|n'existe pas|introuvable/i.test(page.slice(0,600))) page=afSection(page,name);
  }catch(e){ if(e&&e.code==="cancelled"){ S.af=null; renderModal(); return; } S.af={state:"mem",msg:({server_not_connected:"La lecture des pages web ne marche que dans l'app Claude sur ordinateur, pour le propriétaire de l'appli.",not_in_manifest:"Tu as refusé l'accès au navigateur de l'app Claude pour cette page.",approval_required:"L'accès au navigateur de l'app Claude n'a pas été autorisé."})[e&&e.code]||"Impossible de lire la page AideDD ("+((e&&e.code)||"erreur")+").",name,kind,target}; renderModal(); return; }
  finally{ if(opened) await afCloseTab(tab,opened); }
  if(/Title:\s*Error|Error 404|does not exist|n'existe pas|introuvable/i.test(page.slice(0,600))||page.replace(/\s+/g,"").length<200){ if(!forceUrl) return afNear(target,kind,name,`Aucune page AideDD à l'adresse ${url}.`); S.af={state:"err",msg:`La page ${url} n'a pas pu être lue.`,manual:true}; renderModal(); return; }
  if(!S.af||S.af.state!=="run") return;
  S.af.msg="Claude rédige le résumé et extrait la mécanique…"; renderModal();
  let data=null;
  try{ data=await PLATFORM.aiJson(afPrompt(kind,name,url,page)+(approx?`\n\nAttention : cette page n'est pas dédiée à « ${name} ». Elle peut en décrire une autre version (2014, Unearthed Arcana) ou plusieurs éléments à la fois : ne garde que ce qui concerne « ${name} » ou son équivalent le plus direct, et commence le résumé par la source, par exemple « D'après Unearthed Arcana : » ou « D'après les règles 2014 : ». Si la page ne contient rien d'utilisable, réponds {"found": false}.`:""),{modelTier:"default"}); }
  catch(e){ S.af={state:"err",msg:({not_granted:"Tu n'as pas autorisé cette page à utiliser Claude.",rate_limited:"Limite d'usage Claude atteinte pour le moment. Réessaie plus tard.",invalid_json:"La réponse de Claude n'était pas exploitable. Réessaie.",sampling_disabled:"Claude n'est pas disponible pour ce compte."})[e&&e.code]||"Claude n'a pas pu répondre ("+((e&&e.code)||"erreur")+").",manual:true}; renderModal(); return; }
  if(!S.af||S.af.state!=="run") return;
  if(!data||data.found===false||!data.summary){ S.af={state:"err",msg:`La page ${url} ne décrit pas « ${name} ».`,manual:true}; renderModal(); return; }
  S.af={state:"ok",data,url,name,kind,target}; renderModal();
}
/* recherche web (repli quand AideDD n'a rien) */
const KIND_EN={espece:"species",historique:"background",classe:"class","sous-classe":"subclass",don:"feat",sort:"spell",objet:"magic item",aptitude:"class feature"};
const afTxt=r=>{ if(!r) return ""; const pl=r.payload; if(typeof pl==="string") return pl; const t=(r.content||[]).map(c=>c&&c.text||"").join("\n"); if(t) return t; return pl!=null?JSON.stringify(pl):""; };
function afTab(r){ // identifiant d'onglet, quelle que soit la forme de la réponse
  const seen=new Set(); const dig=o=>{ if(!o||typeof o!=="object"||seen.has(o)) return null; seen.add(o); for(const k of Object.keys(o)){ if(/^tab_?id$/i.test(k)&&(typeof o[k]==="string"||typeof o[k]==="number")) return String(o[k]); } for(const k of Object.keys(o)){ const v=dig(o[k]); if(v) return v; } return null; };
  const d=r&&(dig(r.structuredContent)||dig(r.payload)); if(d) return d;
  const txt=[typeof (r&&r.payload)==="string"?r.payload:"",...((r&&r.content)||[]).map(c=>c&&c.text||"")].join("\n");
  const m=txt.match(/tab[ _-]?id["'\s:=(]*([A-Za-z0-9_.-]+)/i); return m?m[1].replace(/[.)]+$/,""):null; }
async function afCloseTab(tab,raw){
  if(!tab){ S.afTabNote="Onglet du navigateur non refermé : identifiant introuvable dans la réponse ("+String(afTxt(raw)).slice(0,120)+")."; console.warn("[D&D Compagnon]",S.afTabNote,raw); return; }
  try{ await PLATFORM.browserCall("tabs_close",{tabId:tab}); }
  catch(e){ S.afTabNote="Onglet « "+tab+" » non refermé ("+((e&&(e.code||e.message))||"erreur")+")."; console.warn("[D&D Compagnon]",S.afTabNote,e); } }
function afSection(text,name){ // page à ancres (sous-classes, historiques) : garder la section de l'élément
  const t=String(text), low=t.toLowerCase(), n=String(name||"").toLowerCase(); if(!n) return t.slice(0,20000);
  const at=[]; for(let i=low.indexOf(n);i>=0&&at.length<40;i=low.indexOf(n,i+1)) at.push(i);
  if(!at.length) return t.slice(0,20000);
  const i=at.find(k=>/Niveau \d|Valeurs? de caract|Don\s*[.:]|Maîtrises? de/i.test(t.slice(k,k+700)))??at[at.length-1];
  return t.slice(0,300)+"\n[…]\n"+t.slice(Math.max(0,i-100),i+14000); }
async function afBrowse(url){ // ouvre, lit, ferme ; demande l'accès au site si besoin
  const once=async()=>{ const r=await PLATFORM.browserCall("preview_start",{url}); const t=afTxt(r); if(/hasn't allowed|request_access/i.test(t)) throw {code:"needs_access",message:t}; const tab=afTab(r);
    try{ const g=await PLATFORM.browserCall("get_page_text",Object.assign({max_chars:14000},tab?{tabId:tab}:{})); return afTxt(g); } finally{ await afCloseTab(tab,r); } };
  try{ return await once(); }
  catch(e){ const msg=String((e&&e.message)||"")+" "+JSON.stringify((e&&e.result)||""); if(/hasn't allowed|request_access|needs_access/i.test(msg+(e&&e.code))) throw {code:"site_blocked",message:url}; throw e; } }
const WEB_SITES=["dndbeyond.com","dungeonmister.com","arcaneeye.com","dungeonsanddragonsfan.com","theroleplayersguild.com"];
async function afWeb(target,kind,name){
  S.af={state:"run",msg:"Recherche sur le web…",url:"",name}; S.afTabNote=null; renderModal();
  try{
    const q=`${name} ${KIND_EN[kind]||""} D&D 2024 5e (${WEB_SITES.map(d=>"site:"+d).join(" OR ")})`;
    let res; try{ res=await afBrowse("https://html.duckduckgo.com/html/?q="+encodeURIComponent(q)); }catch(e){ if(e&&e.code==="site_blocked"){ S.af={state:"err",msg:"Le navigateur de l'app Claude n'est pas autorisé sur duckduckgo.com (moteur de recherche). Autorise ce site, puis réessaie.",manual:true}; renderModal(); return; } throw e; }
    if(!S.af||S.af.state!=="run") return;
    S.af.msg="Choix des meilleures sources…"; renderModal();
    const pick=await PLATFORM.aiJson(`Voici des résultats de recherche web pour l'élément D&D « ${name} » (type : ${HB_KINDS[kind]||kind}), version 2024 de préférence.
Choisis au plus 3 pages qui décrivent sa mécanique de façon fiable, UNIQUEMENT sur ces sites : ${WEB_SITES.join(", ")}. Priorité : D&D Beyond (site officiel), puis les guides. N'utilise PAS les sites qui recopient le texte intégral des livres sans autorisation (wikidot, wikis de copie de règles), ni les forums.
Réponds uniquement en JSON : {"pages": [{"url": "https://…", "title": "…"}]} (url complète avec https://). Si rien n'est pertinent : {"pages": []}.
 
Résultats :
${res.slice(0,9000)}`,{modelTier:"quick"});
    const pages=((pick&&pick.pages)||[]).filter(p=>/^https?:\/\//.test(p.url||"")&&WEB_SITES.some(d=>hostOf(p.url).endsWith(d))).slice(0,3);
    if(!S.af||S.af.state!=="run") return;
    if(!pages.length){ S.af={state:"err",msg:`Rien de fiable trouvé sur le web pour « ${name} ».`,manual:true}; renderModal(); return; }
    const read=[], blocked=[];
    for(const p of pages){ if(!S.af||S.af.state!=="run") return; S.af.msg="Lecture de "+(()=>{ try{ return new URL(p.url).hostname; }catch(e){ return p.url; } })()+"…"; renderModal();
      try{ const t=await afBrowse(p.url); if(t.replace(/\s+/g,"").length>300&&!/Title:\s*(Error|404)/i.test(t.slice(0,300))) read.push({url:p.url,title:String(p.title||p.url),text:t}); }catch(e){ if(e&&e.code==="site_blocked") blocked.push(hostOf(p.url)); } }
    if(!read.length){ S.af={state:"err",msg:blocked.length?"Le navigateur de l'app Claude n'est pas autorisé sur : "+blocked.join(", ")+". Autorise ces sites dans les réglages du navigateur de l'app, puis réessaie.":"Les pages trouvées n'ont pas pu être lues (page protégée ou vide).",manual:true}; renderModal(); return; }
    S.af.msg="Claude rédige le résumé à partir de "+read.length+" source"+(read.length>1?"s":"")+"…"; renderModal();
    const spec=afSpec(kind);
    const data=await PLATFORM.aiJson(`Tu remplis une fiche de règles D&D 2024 en français pour une appli de personnage, à partir de plusieurs pages web (souvent en anglais).
Élément : « ${name} » (type : ${HB_KINDS[kind]||kind}).
Règles :
- Recoupe les sources ; en cas de désaccord, privilégie D&D Beyond puis la version 2024, et signale-le en fin de résumé.
- "summary" : résumé en français, écrit avec TES mots (3 à 8 phrases), avec toute la mécanique utile en jeu (dés, DD, portées en mètres — 30 pieds = 9 m, 60 pieds = 18 m —, durées, niveaux, coût d'action, recharges, bonus). Ne recopie aucune phrase des pages.
- "book" : le livre d'origine en français si connu (Player's Handbook 2024 → "Manuel des joueurs (2024)"), sinon "".
- "sources" : les url des pages réellement utilisées.
- Si aucune page ne décrit vraiment « ${name} », réponds {"found": false}.
- Identifiants de compétence autorisés : ${AF_SKILLS()}.
Réponds uniquement en JSON : {"found": true, "book": "…", "summary": "…", "sources": ["https://…"]${spec?", "+spec:""}}
 
${read.map((p,i)=>`=== Page ${i+1} : ${p.title} (${p.url})\n${p.text.slice(0,Math.floor(30000/read.length))}`).join("\n\n")}`,{modelTier:"default"});
    if(!S.af||S.af.state!=="run") return;
    if(!data||data.found===false||!data.summary){ S.af={state:"err",msg:`Les pages trouvées ne décrivent pas « ${name} ».`,manual:true}; renderModal(); return; }
    const used=(data.sources||[]).filter(u=>read.some(p=>p.url===u)); const links=(used.length?used:read.map(p=>p.url)).map(u=>({url:u,title:(read.find(p=>p.url===u)||{}).title||u}));
    S.af={state:"ok",data,url:links[0].url,links,name,kind,target,web:true}; renderModal();
  }catch(e){ if(e&&e.code==="server_not_connected"){ S.af={state:"mem",msg:"La recherche web ne marche que dans l'app Claude sur ordinateur, pour le propriétaire de l'appli.",name,kind,target}; renderModal(); return; } S.af={state:"err",msg:({not_granted:"Tu n'as pas autorisé cette page à utiliser Claude.",server_not_connected:"La recherche web fonctionne seulement dans l'app Claude sur ordinateur (compte Claude AI).",rate_limited:"Limite d'usage Claude atteinte pour le moment.",invalid_json:"La réponse de Claude n'était pas exploitable. Réessaie.",cancelled:"Recherche annulée."})[e&&e.code]||"La recherche web a échoué ("+((e&&e.code)||"erreur")+").",manual:true}; renderModal(); }
}
async function afMem(target,kind,name){
  S.af={state:"run",msg:"Claude remplit de mémoire…",url:"",name}; renderModal();
  try{ const spec=afSpec(kind);
    const data=await PLATFORM.aiJson(`Tu remplis une fiche de règles D&D (version 2024 de préférence) en français pour une appli de personnage, SANS accès au web : uniquement à partir de ce que tu sais.
Élément : « ${name} » (type : ${HB_KINDS[kind]||kind}).
Règles :
- Si tu ne connais pas cet élément avec certitude dans un livre officiel, réponds {"found": false}. N'invente rien.
- "summary" : résumé en français avec tes mots (3 à 8 phrases), avec la mécanique utile en jeu (dés, DD, portées en mètres, durées, niveaux, coût d'action, recharges, bonus).
- "book" : le livre officiel en français (Player's Handbook 2024 → "Manuel des joueurs (2024)").
- "confidence" : "haute", "moyenne" ou "basse".
- Identifiants de compétence autorisés : ${AF_SKILLS()}.
Réponds uniquement en JSON : {"found": true, "book": "…", "confidence": "…", "summary": "…"${spec?", "+spec:""}}`,{modelTier:"default"});
    if(!S.af||S.af.state!=="run") return;
    if(!data||data.found===false||!data.summary){ S.af={state:"err",msg:`Claude ne connaît pas « ${name} » avec assez de certitude pour le remplir de mémoire.`,manual:true}; renderModal(); return; }
    data.summary=String(data.summary)+"\n(Rempli de mémoire par Claude, sans source consultée : à vérifier"+(data.confidence?" · confiance "+data.confidence:"")+".)";
    S.af={state:"ok",data,url:"",name,kind,target,memory:true}; renderModal();
  }catch(e){ S.af={state:"err",msg:({not_granted:"Tu n'as pas autorisé cette page à utiliser Claude.",rate_limited:"Limite d'usage Claude atteinte pour le moment.",invalid_json:"La réponse de Claude n'était pas exploitable. Réessaie.",sampling_disabled:"Claude n'est pas disponible pour ce compte."})[e&&e.code]||"Claude n'a pas pu répondre ("+((e&&e.code)||"erreur")+").",manual:true}; renderModal(); } }
async function afNear(target,kind,name,why){
  S.af={state:"run",msg:"Pas de page exacte : recherche de la page AideDD la plus proche…",url:"",name}; renderModal();
  let n=null; try{ n=await afNearest(kind,name); }catch(e){ if(e&&e.code==="not_granted"){ S.af={state:"err",msg:"Tu n'as pas autorisé cette page à utiliser Claude.",manual:true}; renderModal(); return; } }
  if(!S.af||S.af.state!=="run") return;
  if(!n){ S.af={state:"near",msg:why+" Aucune page AideDD proche pour « "+name+" ».",near:null,name,kind,target}; renderModal(); return; }
  S.af={state:"near",msg:why,near:n,name,kind,target}; renderModal(); }
function afPatch(kind,d,url){ const p={text:String(d.summary||"")}; if(url) p.link=url; if(d.book) p.label=String(d.book);
  if(kind==="sort"){ for(const k of ["school","casting_time","range","components","duration"]) if(d[k]) p[k]=String(d[k]); if(d.level!==undefined) p.level=+d.level||0; p.concentration=!!d.concentration; p.ritual=!!d.ritual;
    const m=d.mech||{}; p.mech={attack:!!m.attack,save:String(m.save||""),dice:String(m.dice||""),dmgType:String(m.dmgType||""),upDice:String(m.upDice||""),heal:!!m.heal,addMod:!!m.addMod}; if(+m.tempHp) p.mech.tempHp=+m.tempHp; }
  if(kind==="objet"){ for(const k of ["dice","dmgType","properties"]) if(d[k]) p[k]=String(d[k]); }
  if(kind==="espece"&&+d.speed) p.speed=+d.speed;
  if(kind==="historique"){ const abs=(d.abilities||[]).filter(a=>AB.includes(a)); if(abs.length===3) p.abilities=abs; const sk=(d.skills||[]).filter(s=>S.C.skills.some(k=>k.id===s)); p.effects=sk.map(s=>({t:"maitrise",cible:"comp:"+s,niveau:1})); if(d.tools) p.tools=String(d.tools); }
  if(kind==="sous-classe"||kind==="classe") p.features=(d.features||[]).map(f=>({level:+f.level||1,name:String(f.name||""),text:String(f.summary||f.text||""),effects:[]}));
  if(kind==="classe"){ if([6,8,10,12].includes(+d.hitDie)) p.hitDie=+d.hitDie; const pr=(d.primary||[]).filter(a=>AB.includes(a)); p.primary1=pr[0]||""; p.primary2=pr[1]||""; const sv=(d.saves||[]).filter(a=>AB.includes(a)); p.save1=sv[0]||""; p.save2=sv[1]||"";
    p.armorFlags=Object.assign({},d.armor||{}); p.weapons=String(d.weapons||""); p.tools=String(d.tools||""); p.skillCount=+d.skillCount||2; p.skillFlags={}; for(const s of d.skillFrom||[]) if(S.C.skills.some(k=>k.id===s)) p.skillFlags[s]=true;
    p.castType=["full","half","pact"].includes(d.castType)?d.castType:""; if(AB.includes(d.castAbility)) p.castAbility=d.castAbility; if(+d.subclassLevel) p.subclassLevel=+d.subclassLevel; }
  return p; }
function afApply(){ const A=S.af; if(!A||A.state!=="ok") return; const p=afPatch(A.kind,A.data,A.url); if(A.links) p.links=A.links.map(l=>({url:l.url,title:String(l.title||"")}));
  if(A.target.mode==="hb"){ const d=S.docs[A.target.id]; if(d){ Object.assign(d,p); touch(A.target.id); } }
  else if(S.W&&S.W.nh){ const n=S.W.nh; n.text=p.text; if(p.link) n.link=p.link; if(p.links) n.links=p.links; if(p.label) n.label=p.label; if(p.speed) n.speed=p.speed; if(p.abilities) n.abs=p.abilities.slice(); if(p.effects) n.sk=[...p.effects.map(e=>e.cible.slice(5)),"",""].slice(0,2); if(p.tools) n.tools=p.tools; if(A.kind==="classe"){ for(const k of ["hitDie","primary1","save1","save2","castType","castAbility"]) if(p[k]!==undefined) n[k]=p[k]; } n.patch=p; }
  S.af=null; renderModal(); render(); }
function afModal(){ const A=S.af;
  const box=(inner)=>`<div class="picker" data-act="${A.state==="run"?"noop":"afClose"}"><div class="box" role="dialog" aria-label="Remplissage automatique" data-act="noop" style="max-width:620px;grid-template-rows:auto 1fr auto">${(note=>note?inner.replace('<div class="wfoot"',note+'<div class="wfoot"'):inner)(A.state!=="run"&&S.afTabNote?`<div class="muted warntxt" style="font-size:var(--fs-sm)">${esc(S.afTabNote)} Ferme-le à la main dans le navigateur de l'app.</div>`:"")}</div></div>`; // lot 2 : même en-tête (croix) et même pied que les autres fenêtres
  if(A.state==="run") return box(`${winHead("Remplissage automatique","afClose")}<div class="stack"><div>${esc(A.msg)}</div><div class="muted" style="font-size:var(--fs-sm)">${esc(A.url||"")}</div><div class="muted" style="font-size:var(--fs-sm)">L'app Claude peut te demander d'autoriser l'accès. Ça peut prendre jusqu'à une minute.</div></div>`);
  if(A.state==="mem") return box(`${winHead("Sources web indisponibles","afClose")}<div class="stack"><div>${esc(A.msg)}</div><div>Claude peut remplir la fiche <b>de mémoire</b>, à partir de ce qu'il sait du livre. Le résultat sera marqué « à vérifier », sans lien de source.</div></div>
    <div class="wfoot" style="flex-wrap:wrap"><button class="btn ghost" data-act="afClose">Saisie manuelle</button><button class="btn primary" data-act="afMem">Remplir de mémoire</button></div>`);
  if(A.state==="near") return box(`${winHead("Pas de page exacte","afClose")}<div class="stack"><div>${esc(A.msg)}</div>${A.near?`<div>Page la plus proche sur AideDD : <a class="aidelink" href="${esc(A.near.url)}" target="_blank" rel="noopener noreferrer">${esc(A.near.title)} ↗</a></div>${A.near.why?`<div class="muted" style="font-size:var(--fs-sm)">${esc(A.near.why)}</div>`:""}<div class="muted" style="font-size:var(--fs-sm)">Le résumé précisera de quelle version il s'agit. Tu valides avant l'enregistrement.</div>`:""}
    <div class="muted" style="font-size:var(--fs-sm)">« Chercher sur le web » lit jusqu'à 3 pages de référence : D&D Beyond en priorité, puis des guides reconnus.</div></div>
    <div class="wfoot" style="flex-wrap:wrap"><button class="btn ghost" data-act="afClose">Saisie manuelle</button>${A.near?`<button class="btn" data-act="afNearLink">Garder juste le lien</button>`:""}<button class="btn" data-act="afMem">Remplir de mémoire</button><button class="btn${A.near?"":" primary"}" data-act="afWeb">Chercher sur le web</button>${A.near?`<button class="btn primary" data-act="afNearUse">Remplir depuis cette page</button>`:""}</div>`);
  if(A.state==="err") return box(`${winHead("Remplissage impossible","afClose")}<div class="stack"><div>${esc(A.msg)}</div>${A.manual?`<div class="muted">Saisis la fiche à la main. Tu peux aussi corriger le lien AideDD puis réessayer.</div>`:""}</div><div class="wfoot"><button class="btn primary" data-act="afClose">Saisie manuelle</button></div>`);
  const d=A.data, rows=[];
  if(d.book) rows.push(["Livre",d.book]);
  if(A.kind==="sort") rows.push(["Sort",`niv. ${d.level} · ${d.school||""} · ${d.casting_time||""} · ${d.range||""} · ${d.duration||""}${d.concentration?" · concentration":""}${d.ritual?" · rituel":""}`],["Mécanique",[d.mech?.attack?"attaque de sort":"",d.mech?.save?"JS "+d.mech.save:"",d.mech?.dice?(d.mech.dice+" "+(d.mech.dmgType||"")+(d.mech.upDice?" (+"+d.mech.upDice+"/niv.)":"")):"",d.mech?.heal?"soins":"",+d.mech?.tempHp?d.mech.tempHp+" PV temp./niv.":""].filter(Boolean).join(" · ")||"—"]);
  if(A.kind==="espece"&&d.speed) rows.push(["Vitesse",d.speed+" m"]);
  if(A.kind==="historique") rows.push(["Caractéristiques",(d.abilities||[]).map(a=>ABN[a]||a).join(", ")],["Compétences",(d.skills||[]).map(s=>(S.C.skills.find(k=>k.id===s)||{}).name||s).join(", ")],["Outil",d.tools||"—"]);
  if(A.kind==="objet"&&d.dice) rows.push(["Dégâts",d.dice+" "+(d.dmgType||"")]);
  if(A.kind==="classe") rows.push(["Profil",`d${d.hitDie} · JS ${(d.saves||[]).map(a=>ABN[a]||a).join(", ")} · ${d.skillCount} compétences${d.castType?" · "+(({full:"lanceur complet",half:"demi-lanceur",pact:"magie de pacte"})[d.castType]||d.castType):""}`]);
  if((A.kind==="classe"||A.kind==="sous-classe")&&(d.features||[]).length) rows.push(["Aptitudes",(d.features||[]).map(f=>"niv. "+f.level+" "+f.name).join(" · ")]);
  return box(`${winHead(esc(A.name),"afClose")}<div class="stack" style="overflow:auto;max-height:60vh">${rows.map(([l,v])=>`<div><span class="label">${esc(l)}</span> ${esc(String(v))}</div>`).join("")}<div class="prose">${prose(d.summary)}</div>${A.links?`<div style="font-size:var(--fs-sm)"><span class="label">Sources</span> ${A.links.map(l=>`<a class="aidelink" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(hostOf(l.url))} ↗</a>`).join(" · ")}</div>`:(A.memory?`<div class="muted warntxt" style="font-size:var(--fs-sm)">Rempli de mémoire : vérifie avant de t'en servir en partie.</div>`:`<a class="aidelink" href="${esc(A.url)}" target="_blank" rel="noopener noreferrer">Voir sur AideDD ↗</a>`)}</div>
    <div class="wfoot"><button class="btn primary" data-act="afApply">Appliquer à la fiche</button></div>`); }
