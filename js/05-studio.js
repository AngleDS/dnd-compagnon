/* Studio de dés : les ressources sont embarquées par build.py dans le HTML autonome. */
function studioDecode(s){ return s; } // ressources embarquées en texte par build.py (plus de base64 : fichier plus léger, rien à décoder)
/* Le moteur 3D peut ne pas démarrer (WebGL absent ou coupé, script refusé…). Les erreurs du document 3D sont recueillies
   dans __studioErr pour être affichées (studio) ou pour basculer sur le résultat direct (jets de partie). */
const STUDIO_ERRCATCH="<script>window.__studioErr=[];window.__studioCsp=[];addEventListener('error',e=>__studioErr.push(e.message||'erreur de script'));addEventListener('unhandledrejection',e=>__studioErr.push(String(e.reason&&e.reason.message||e.reason)));addEventListener('securitypolicyviolation',e=>__studioCsp.push(e.violatedDirective+(e.blockedURI?' ('+e.blockedURI+')':'')));</"+"script>";
/* Pas de module chargé à la volée (URL blob:) : la vue artefact de l'app Claude sur Mac les refusait probablement (studio vide,
   jets 3D muets, 13 nov. 2026, alors que le navigateur intégré affichait tout). Les deux moteurs sont mis tels quels dans le
   document du studio, en modules intégrés ; leur unique « export{…} » final devient une variable du document (__STUDIO_THREE,
   __STUDIO_CANNON). Chaque script et style reçoit le jeton de sécurité (nonce) de la page quand l'hébergeur en utilise un. */
const STUDIO_IMPORTS=["import * as THREE from 'https://esm.sh/three@0.180.0'","import * as CANNON from 'https://esm.sh/cannon-es@0.20.0'"];
function studioNonce(sel){ const el=document.querySelector(sel); return el&&(el.nonce||el.getAttribute('nonce'))||''; }
function studioLib(src,name){ const i=src.indexOf('export{'), j=src.indexOf('}',i); if(i<0||j<0||src.indexOf('export{',i+1)>=0||/^import /m.test(src)) throw new Error('Studio de dés : moteur embarqué inattendu');
  const names=src.slice(i+7,j).split(',').map(e=>{ const [a,b]=e.trim().split(/\s+as\s+/); return JSON.stringify(b||a)+':'+a; });
  return src.slice(0,i)+'window.'+name+'={'+names.join(',')+'};'+src.slice(j+1); }
function studioSrcdoc(html,css){
  const sn=studioNonce('script[nonce]'), cn=studioNonce('style[nonce]')||sn, na=v=>v?' nonce="'+esc(v)+'"':'';
  html=studioPatch(html,[[STUDIO_IMPORTS[0],'const THREE=window.__STUDIO_THREE'],[STUDIO_IMPORTS[1],'const CANNON=window.__STUDIO_CANNON']]);
  html=html.replace(/<script(\s|>)/g,'<script'+na(sn)+'$1').replace(/<style(\s|>)/g,'<style'+na(cn)+'$1');
  const lib=(k,name)=>'<script type="module"'+na(sn)+'>'+studioLib(studioDecode(STUDIO_ASSETS[k]),name).replace(/<\/script/gi,'<\\/script')+'</'+'script>';
  return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+STUDIO_ERRCATCH.replace('<script>','<script'+na(sn)+'>')+'<style'+na(cn)+'>'+css+'</style>'+lib(1,'__STUDIO_THREE')+lib(2,'__STUDIO_CANNON')+'</head><body>'+html+'</body></html>'; }
// Moteur qui ne démarre pas : à quelle étape ça bloque (affiché dans le studio et dans le bandeau des jets)
function studioWhy(win){ if(!win) return 'document 3D absent'; const csp=win.__studioCsp&&win.__studioCsp[0]?' ; règle de sécurité : '+win.__studioCsp[0]:'';
  if(win.__studioErr===undefined) return 'scripts du studio refusés par la page'+csp;
  if(!win.__STUDIO_THREE) return 'moteur Three.js non chargé'+csp; if(!win.__STUDIO_CANNON) return 'moteur physique non chargé'+csp;
  return 'le moteur ne répond pas'+csp; }
let studioBroken=""; // raison du dernier échec du moteur : les jets suivants de la session passent en résultat direct
function webglOk(){ if(webglOk.v===undefined){ try{ const c=document.createElement('canvas'); webglOk.v=!!(c.getContext('webgl2')||c.getContext('webgl')); }catch(_){ webglOk.v=false; } } return webglOk.v; }
function studioErrShow(msg){ const box=document.querySelector('.dice-studio-box'); if(!box||box.querySelector('.studio-error')) return; const p=document.createElement('p'); p.className='studio-error'; p.setAttribute('role','alert');
  p.textContent='Le studio 3D n’a pas pu démarrer ici : '+msg+'. Les jets restent possibles, avec le résultat direct.'; box.querySelector('.dice-studio-frame')?.before(p); }
function studioClose(){ if(S.studio) studioEngineDrop(); const m=document.getElementById('modal'); if(m&&m.querySelector('.dice-studio-box')) m.innerHTML=''; S.studio=false; document.querySelector('.hmenu')?.focus(); }
function studioOpen(){
  studioClose(); S.studio=true;
  const m=document.getElementById('modal'); m.innerHTML=`<div class="picker" data-act="studioClose"><div class="box dice-studio-box" role="dialog" aria-modal="true" aria-label="Studio de dés" data-act="noop">${winHead('Studio de dés','studioClose')}<iframe class="dice-studio-frame" title="Studio de dés" sandbox="allow-scripts allow-same-origin"></iframe></div></div>`;
  const frame=m.querySelector('iframe');
  if(!webglOk()){ studioErrShow('rendu 3D (WebGL) indisponible dans ce navigateur'); }
  else { const t0=Date.now(), chk=setInterval(()=>{ const win=frame.isConnected&&frame.contentWindow; if(!win||!S.studio){ clearInterval(chk); return; }
    if(win.__studioErr&&win.__studioErr.length){ clearInterval(chk); studioErrShow(win.__studioErr[0]); } else if(typeof win.studioRoll3D==='function') clearInterval(chk);
    else if(Date.now()-t0>20000){ clearInterval(chk); studioErrShow(studioWhy(win)); } },250); }
  frame.srcdoc=studioSrcdoc(studioDecode(STUDIO_ASSETS[0]),'html,body{margin:0;padding:0;background:#f8f2e4}html[data-theme="dark"],html[data-theme="dark"] body{background:#1b1c20}*{box-sizing:border-box}');
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&S.studio){ e.preventDefault(); studioClose(); } });

/* Un lancer de jeu réutilise le moteur du studio dans la fenêtre existante.
   Le studio est adapté en remplaçant des morceaux exacts de studio.html : chaque morceau doit s'y trouver une seule fois
   (vérifié ici et par le test « Studio de dés : morceaux remplacés ») ; s'il manque, le lancer 3D échoue proprement au lieu de se dérégler.
   Les jets de partie roulent toujours au-dessus de la page (le mode « avec plateau » a été retiré à la demande d'Angle, 13 nov. 2026). */
const STUDIO_GAME_PATCHES=[
  ['tray.hidden=true;ambiance.hidden=true;','tray.hidden=true;ambiance.hidden=false;'],
  // Les aperçus du studio ne sont pas visibles pendant un jet de jeu.
  ['function previewRenderer(box){const r=new THREE.WebGLRenderer({antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio||1,2));r.outputColorSpace=THREE.SRGBColorSpace;box.append(r.domElement);return r}','function previewRenderer(){return {setSize(){},render(){}}}'],
  ['dieRenderer.render(dieScene,dieCamera);trayPreviewGroup.rotation.y+=delta*.32;trayRenderer.render(trayScene,trayCamera);','']];
const STUDIO_SCREEN_PATCHES=[
  ['antialias:true,alpha:false','antialias:true,alpha:true'],
  // La définition reste celle du studio (jusqu'à 2) : à 1, la toile agrandie sur un écran d'iPhone (2x ou 3x) rendait les dés flous.
  ['force.value=1.02;prepareAudio();',"force.value=1.9;root.dataset.externalPower='1.9';prepareAudio();"],
  ["function polygon(shape){return basePolygon(shape).map(([x,z])=>[x*1.45,z*1.45])}","function polygon(shape){const z=5.45,x=z*stage.clientWidth/Math.max(1,stage.clientHeight);return [[-x,-z],[x,-z],[x,z],[-x,z]]}"],
  ['function fitTray(){camera.zoom=1;','function fitTray(){camera.position.set(0,18,.001);camera.lookAt(0,0,0);camera.zoom=1;camera.updateProjectionMatrix();return;'],
  ['syncPalettes();restoring=false;','syncPalettes();restoring=false;scene.background=null;renderer.setClearAlpha(0);trayMeshes.forEach(m=>m.visible=false);']];
function studioPatch(html,pairs){ for(const [a,b] of pairs){ if(html.split(a).length!==2) throw new Error("Studio de dés : morceau à remplacer introuvable ou en double : "+a.slice(0,40)); html=html.replace(a,()=>b); } return html; }
/* Moteur des jets de partie, gardé prêt entre deux jets (demande d'Angle : jets rapides).
   Un seul document caché, créé au premier besoin ou à l'avance (menu de jet ouvert, après le démarrage) et réutilisé :
   plus de décodage, de chargement du moteur ni de nouveau rendu 3D à chaque jet. Il est jeté si les jets 3D sont coupés
   ou après un passage dans le Studio (nouvelles apparences). Sa toile passe au-dessus de toute la page pendant le lancer. */
let studioEngine=null;
const studioTimes=[]; // chronométrage des derniers jets 3D : [démarrage du moteur (ms, 0 si déjà prêt), roulement (ms)]
function studioEngineDrop(){ const E=studioEngine; studioEngine=null; if(!E) return; cancelAnimationFrame(E.raf); E.overlay?.remove(); E.iframe.remove(); document.body.classList.remove('game-dice-screen'); }
function studioWarm(){
  if(!virtualDiceEnabled()||diceDisplayMode()!=='3d'){ studioEngineDrop(); return null; }
  if(studioEngine) return studioEngine;
  let html=studioDecode(STUDIO_ASSETS[0]);
  html=studioPatch(html,STUDIO_GAME_PATCHES); html=studioPatch(html,STUDIO_SCREEN_PATCHES);
  const style='#physics-dice-demo{border:0!important;background:transparent!important;padding:0!important;max-width:none!important;width:100%!important;height:100%!important;overflow:hidden}#physics-dice-demo>.head,#physics-dice-demo>.ecrin-tabs,#physics-dice-demo>.studio:not(.launch-section){display:none!important}#physics-dice-demo .launch-section{display:block!important;margin:0!important;padding:0!important;border:0!important;height:100%!important}#physics-dice-demo .launch-section>*:not(.stage){display:none!important}#physics-dice-demo .stage{display:block!important;width:100%!important;height:100%!important;margin:0!important;border:0!important;background:'+(screen?'transparent':'#211b17')+'!important}';
  const iframe=document.createElement('iframe'); iframe.title='Lancer des dés 3D'; iframe.className='game-dice-frame engine'; iframe.setAttribute('aria-hidden','true'); iframe.setAttribute('tabindex','-1'); iframe.setAttribute('sandbox','allow-scripts allow-same-origin');
  const E={iframe,overlay:null,raf:0,busy:false,t0:performance.now()}; studioEngine=E;
  E.ready=new Promise((resolve,reject)=>{ const timer=setTimeout(()=>reject(new Error(studioWhy(iframe.contentWindow))),20000);
    iframe.onload=()=>{ const poll=setInterval(()=>{ if(studioEngine!==E){ clearInterval(poll); clearTimeout(timer); reject(new Error('Moteur 3D remplacé')); return; }
      const win=iframe.contentWindow; if(win&&win.__studioErr&&win.__studioErr.length){ clearInterval(poll); clearTimeout(timer); reject(new Error(win.__studioErr[0])); return; }
      if(win&&typeof win.studioRoll3D==='function'){ clearInterval(poll); clearTimeout(timer); win.studioGameMode=true;
        const canvas=iframe.contentDocument.querySelector('.stage canvas'); if(!canvas){ reject(new Error('Rendu 3D indisponible')); return; } E.overlay=document.adoptNode(canvas); E.overlay.className='game-dice-overlay'; E.overlay.setAttribute('aria-hidden','true'); E.overlay.hidden=true; document.body.append(E.overlay);
        E.warm=Math.round(performance.now()-E.t0); resolve(win); } },50); };
  });
  E.ready.catch(()=>{ if(studioEngine===E) studioEngineDrop(); });
  iframe.srcdoc=studioSrcdoc(html,'html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden}'+style);
  document.body.append(iframe); return E;
}
// Jet qui n'est plus attendu (fenêtre fermée, autre personnage…) : les dés s'arrêtent tout de suite.
function studioFollow(E){ cancelAnimationFrame(E.raf); const step=()=>{ if(studioEngine!==E||!E.busy) return;
    if(!E.alive()) E.win?.studioSkip?.();
    E.raf=requestAnimationFrame(step); }; step(); }
function studioSkip(){ const E=studioEngine; if(E&&E.busy) E.win?.studioSkip?.(); }
async function studioGameRoll(specs,alive=()=>!!document.querySelector('.tpop')){
  if(!virtualDiceEnabled()||diceDisplayMode()!=='3d') throw new Error('Jets 3D désactivés');
  const E=studioWarm(); if(!E) throw new Error('Jets 3D désactivés'); if(E.busy) throw new Error('Un lancer est déjà en cours');
  const wasReady=!!E.warm; E.busy=true; E.alive=alive; const t1=performance.now();
  try{ let iv=0; const closed=new Promise((_,rej)=>{ iv=setInterval(()=>{ if(!alive()) rej(new Error('Lancer annulé')); },100); }); // fenêtre fermée pendant que le moteur démarre
    let win; try{ win=await Promise.race([E.ready,closed]); } finally{ clearInterval(iv); } E.win=win; if(studioEngine!==E) throw new Error('Lancer annulé');
    // le moteur était prêt : on ne compte que le roulement ; sinon, le temps de démarrage est noté à part
    const t2=performance.now(); E.overlay.hidden=false; document.body.classList.add('game-dice-screen'); studioFollow(E);
    const values=await win.studioRoll3D(specs);
    studioTimes.unshift([wasReady?0:Math.round(t2-t1),Math.round(performance.now()-t2)]); studioTimes.length=Math.min(studioTimes.length,10);
    return values;
  } finally { if(studioEngine===E){ E.busy=false; cancelAnimationFrame(E.raf); if(E.overlay) E.overlay.hidden=true; document.body.classList.remove('game-dice-screen'); } }
}

/* Chemin commun de tous les jets virtuels (chantier 29).
   specs : faces des dés que le calcul va tirer, dans l'ordre (sans les relances). Dés 3D actifs : le moteur lance ces dés ;
   une fois arrêtés, apply() tourne en lisant leurs faces (rnd les prend dans l'ordre) : aucun résultat, journal ni dépense
   avant l'arrêt des dés. o.re1 : un dé qui fait 1 est relancé une fois (Guérisseur) ; la relance roule aussi en 3D.
   o.alive : le jet est-il toujours attendu ? Par défaut : même personnage, même vue, même onglet, même fenêtre. Sinon le jet
   est annulé sans rien appliquer (fermer la fenêtre pendant le lancer ne dépense rien).
   o.pending(v) : affichage propre à une fenêtre de jet (jets rapides) ; sinon « Passer l'animation » flotte en bas de l'écran.
   Sans dés 3D, ou avec des dés que le moteur ne sait pas lancer, apply() tourne tout de suite avec des tirages directs. */
const DICE3D_FACES=[4,6,8,10,12,20,100];
let dice3dBusy=false;
function d20Specs(mode){ return mode==="a"||mode==="d"?[20,20]:[20]; }
function exprSpecs(expr){ const out=[]; for(const p of String(expr||"").replace(/\s+/g,"").replace(/-/g,"+-").split("+").filter(Boolean)){ const m=p.match(/^(-?)(\d*)d(\d+)$/i); if(m) for(let i=0;i<Math.min(+(m[2]||1),100);i++) out.push(+m[3]); } return out; }
function dice3dCan(specs){ return virtualDiceEnabled()&&diceDisplayMode()==="3d"&&!studioBroken&&webglOk()&&specs.length>0&&specs.length<=100&&specs.every(f=>DICE3D_FACES.includes(f)); }
function rollAlive(){ const key=()=>[S.cur,S.view,S.tab,S.T,S.T&&S.T.pop,S.W], k=key(); return ()=>key().every((x,i)=>x===k[i]); }
async function roll3d(specs,apply,o={}){
  if(!dice3dCan(specs)){ apply(); return true; }
  if(dice3dBusy){ o.pending?.(false); return false; } // un seul lancer à la fois
  const alive=o.alive||rollAlive(); let skip=null, applied=false; dice3dBusy=true; document.body.classList.add("dice3d-busy");
  if(o.pending) o.pending(true); else { skip=document.createElement("button"); skip.className="btn small dice3dskip dice3dfloat"; skip.dataset.act="dice3dSkip"; skip.textContent="Passer l’animation"; document.body.append(skip); }
  try{
    const values=await studioGameRoll(specs,alive);
    const again=o.re1?specs.filter((f,j)=>values[j]===1):[], extra=again.length?await studioGameRoll(again,alive):[];
    if(!alive()||!virtualDiceEnabled()) return false;
    const queue=[]; let x=0; specs.forEach((f,j)=>{ queue.push({f,v:values[j]}); if(o.re1&&values[j]===1) queue.push({f,v:extra[x++]}); });
    applied=true; diceQueue=queue; try{ apply(); } finally { diceQueue=null; }
    return true;
  }catch(e){ const msg=String(e&&e.message||e);
    if(applied||/annulé|remplacé/.test(msg)||!alive()||!virtualDiceEnabled()) return false; // jet annulé ou déjà appliqué : rien de plus
    // moteur 3D en panne : le jet n'est pas perdu, il donne son résultat direct ; la session continue sans 3D
    studioBroken=msg; studioEngineDrop(); apply(); setBanner("Dés 3D indisponibles ici ("+msg+") : résultat direct."); return true; }
  finally{ dice3dBusy=false; document.body.classList.remove("dice3d-busy"); skip?.remove(); if(o.pending) o.pending(false); }
}

// Le moteur se prépare à l'avance : quelques secondes après l'ouverture de l'appli si les jets 3D sont actifs.
window.addEventListener('load',()=>setTimeout(()=>{ if(virtualDiceEnabled()&&diceDisplayMode()==='3d'){ try{ studioWarm(); }catch(_){} } },4000));
