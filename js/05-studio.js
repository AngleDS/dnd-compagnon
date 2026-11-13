/* Studio de dés : les ressources sont embarquées par build.py dans le HTML autonome. */
let studioUrls=[];
function studioDecode(s){ return s; } // ressources embarquées en texte par build.py (plus de base64 : fichier plus léger, rien à décoder)
function studioClose(){ if(S.studio) studioEngineDrop(); const m=document.getElementById('modal'); if(m&&m.querySelector('.dice-studio-box')) m.innerHTML=''; studioUrls.forEach(URL.revokeObjectURL); studioUrls=[]; S.studio=false; document.querySelector('.hmenu')?.focus(); }
function studioOpen(){
  studioClose(); S.studio=true;
  const html=studioDecode(STUDIO_ASSETS[0]), sources=STUDIO_ASSETS.slice(1,3).map(studioDecode);
  studioUrls=sources.map(src=>URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
  const content=studioPatch(html,STUDIO_URLS.map((a,k)=>[a,JSON.stringify(studioUrls[k])]));
  const m=document.getElementById('modal'); m.innerHTML=`<div class="picker" data-act="studioClose"><div class="box dice-studio-box" role="dialog" aria-modal="true" aria-label="Studio de dés" data-act="noop">${winHead('Studio de dés','studioClose')}<iframe class="dice-studio-frame" title="Studio de dés" sandbox="allow-scripts allow-same-origin"></iframe></div></div>`;
  const frame=m.querySelector('iframe'); frame.srcdoc='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:#f8f2e4}html[data-theme="dark"],html[data-theme="dark"] body{background:#1b1c20}*{box-sizing:border-box}</style></head><body>'+content+'</body></html>';
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&S.studio){ e.preventDefault(); studioClose(); } });

/* Un lancer de jeu réutilise le moteur du studio dans la fenêtre existante.
   Le studio est adapté en remplaçant des morceaux exacts de studio.html : chaque morceau doit s'y trouver une seule fois
   (vérifié ici et par le test « Studio de dés : morceaux remplacés ») ; s'il manque, le lancer 3D échoue proprement au lieu de se dérégler.
   Les jets de partie roulent toujours au-dessus de la page (le mode « avec plateau » a été retiré à la demande d'Angle, 13 nov. 2026). */
const STUDIO_URLS=["'https://esm.sh/three@0.180.0'","'https://esm.sh/cannon-es@0.20.0'"];
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
function studioEngineDrop(){ const E=studioEngine; studioEngine=null; if(!E) return; cancelAnimationFrame(E.raf); E.overlay?.remove(); E.iframe.remove(); E.urls.forEach(URL.revokeObjectURL); document.body.classList.remove('game-dice-screen'); }
function studioWarm(){
  if(!virtualDiceEnabled()||diceDisplayMode()!=='3d'){ studioEngineDrop(); return null; }
  if(studioEngine) return studioEngine;
  const urls=STUDIO_ASSETS.slice(1,3).map(s=>URL.createObjectURL(new Blob([studioDecode(s)],{type:'text/javascript'})));
  let html=studioPatch(studioDecode(STUDIO_ASSETS[0]),STUDIO_URLS.map((x,k)=>[x,JSON.stringify(urls[k])]));
  html=studioPatch(html,STUDIO_GAME_PATCHES); html=studioPatch(html,STUDIO_SCREEN_PATCHES);
  const style='#physics-dice-demo{border:0!important;background:transparent!important;padding:0!important;max-width:none!important;width:100%!important;height:100%!important;overflow:hidden}#physics-dice-demo>.head,#physics-dice-demo>.ecrin-tabs,#physics-dice-demo>.studio:not(.launch-section){display:none!important}#physics-dice-demo .launch-section{display:block!important;margin:0!important;padding:0!important;border:0!important;height:100%!important}#physics-dice-demo .launch-section>*:not(.stage){display:none!important}#physics-dice-demo .stage{display:block!important;width:100%!important;height:100%!important;margin:0!important;border:0!important;background:'+(screen?'transparent':'#211b17')+'!important}';
  const iframe=document.createElement('iframe'); iframe.title='Lancer des dés 3D'; iframe.className='game-dice-frame engine'; iframe.setAttribute('aria-hidden','true'); iframe.setAttribute('tabindex','-1'); iframe.setAttribute('sandbox','allow-scripts allow-same-origin');
  const E={iframe,urls,overlay:null,raf:0,busy:false,t0:performance.now()}; studioEngine=E;
  E.ready=new Promise((resolve,reject)=>{ const timer=setTimeout(()=>reject(new Error('Lancer 3D indisponible')),30000);
    iframe.onload=()=>{ const poll=setInterval(()=>{ if(studioEngine!==E){ clearInterval(poll); clearTimeout(timer); reject(new Error('Moteur 3D remplacé')); return; }
      const win=iframe.contentWindow; if(win&&typeof win.studioRoll3D==='function'){ clearInterval(poll); clearTimeout(timer); win.studioGameMode=true;
        const canvas=iframe.contentDocument.querySelector('.stage canvas'); if(!canvas){ reject(new Error('Rendu 3D indisponible')); return; } E.overlay=document.adoptNode(canvas); E.overlay.className='game-dice-overlay'; E.overlay.setAttribute('aria-hidden','true'); E.overlay.hidden=true; document.body.append(E.overlay);
        E.warm=Math.round(performance.now()-E.t0); resolve(win); } },50); };
  });
  E.ready.catch(()=>{ if(studioEngine===E) studioEngineDrop(); });
  iframe.srcdoc='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden}'+style+'</style></head><body>'+html+'</body></html>';
  document.body.append(iframe); return E;
}
// Fenêtre de jet fermée pendant le lancer : les dés s'arrêtent tout de suite.
function studioFollow(E){ cancelAnimationFrame(E.raf); const step=()=>{ if(studioEngine!==E||!E.busy) return;
    if(!document.querySelector('.tpop')) E.win?.studioSkip?.();
    E.raf=requestAnimationFrame(step); }; step(); }
function studioSkip(){ const E=studioEngine; if(E&&E.busy) E.win?.studioSkip?.(); }
async function studioGameRoll(specs){
  if(!virtualDiceEnabled()||diceDisplayMode()!=='3d') throw new Error('Jets 3D désactivés');
  const E=studioWarm(); if(!E) throw new Error('Jets 3D désactivés'); if(E.busy) throw new Error('Un lancer est déjà en cours');
  const wasReady=!!E.warm; E.busy=true; const t1=performance.now();
  try{ let iv=0; const closed=new Promise((_,rej)=>{ iv=setInterval(()=>{ if(!document.querySelector('.tpop')) rej(new Error('Lancer annulé')); },100); }); // fenêtre fermée pendant que le moteur démarre
    let win; try{ win=await Promise.race([E.ready,closed]); } finally{ clearInterval(iv); } E.win=win; if(studioEngine!==E) throw new Error('Lancer annulé');
    // le moteur était prêt : on ne compte que le roulement ; sinon, le temps de démarrage est noté à part
    const t2=performance.now(); E.overlay.hidden=false; document.body.classList.add('game-dice-screen'); studioFollow(E);
    const values=await win.studioRoll3D(specs);
    studioTimes.unshift([wasReady?0:Math.round(t2-t1),Math.round(performance.now()-t2)]); studioTimes.length=Math.min(studioTimes.length,10);
    return values;
  } finally { if(studioEngine===E){ E.busy=false; cancelAnimationFrame(E.raf); if(E.overlay) E.overlay.hidden=true; document.body.classList.remove('game-dice-screen'); } }
}

// Le moteur se prépare à l'avance : quelques secondes après l'ouverture de l'appli si les jets 3D sont actifs.
window.addEventListener('load',()=>setTimeout(()=>{ if(virtualDiceEnabled()&&diceDisplayMode()==='3d'){ try{ studioWarm(); }catch(_){} } },4000));
