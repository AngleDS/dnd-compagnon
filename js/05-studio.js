/* Studio de dés : les ressources sont embarquées par build.py dans le HTML autonome. */
let studioUrls=[];
function studioDecode(s){ const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0)); return new TextDecoder().decode(bytes); }
function studioClose(){ const m=document.getElementById('modal'); if(m&&m.querySelector('.dice-studio-box')) m.innerHTML=''; studioUrls.forEach(URL.revokeObjectURL); studioUrls=[]; S.studio=false; document.querySelector('.hmenu')?.focus(); }
function studioOpen(){
  studioClose(); S.studio=true;
  const html=studioDecode(STUDIO_ASSETS[0]), sources=STUDIO_ASSETS.slice(1,3).map(studioDecode);
  studioUrls=sources.map(src=>URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
  const content=html.replace("'https://esm.sh/three@0.180.0'",JSON.stringify(studioUrls[0])).replace("'https://esm.sh/cannon-es@0.20.0'",JSON.stringify(studioUrls[1]));
  const m=document.getElementById('modal'); m.innerHTML=`<div class="picker" data-act="studioClose"><div class="box dice-studio-box" role="dialog" aria-modal="true" aria-label="Studio de dés" data-act="noop">${winHead('Studio de dés','studioClose')}<iframe class="dice-studio-frame" title="Studio de dés" sandbox="allow-scripts allow-same-origin"></iframe></div></div>`;
  const frame=m.querySelector('iframe'); frame.srcdoc='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;background:#f8f2e4}html[data-theme="dark"],html[data-theme="dark"] body{background:#1b1c20}*{box-sizing:border-box}</style></head><body>'+content+'</body></html>';
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&S.studio){ e.preventDefault(); studioClose(); } });

/* Un lancer de jeu réutilise le moteur du studio dans la fenêtre existante. */
function studioGameRoll(specs){
  if(!virtualDiceEnabled()||diceDisplayMode()!=='3d') return Promise.reject(new Error('Jets 3D désactivés'));
  const body=document.querySelector('.tpop .tpopbody'); if(!body) return Promise.reject(new Error('Fenêtre de jet indisponible'));
  let prefs={}; try{ prefs=JSON.parse(localStorage.getItem('registre-dice-studio-v1')||'{}'); }catch(_){}
  const fullscreen=prefs.trayMode==='screen', urls=STUDIO_ASSETS.slice(1,3).map(s=>URL.createObjectURL(new Blob([studioDecode(s)],{type:'text/javascript'})));
  let html=studioDecode(STUDIO_ASSETS[0]).replace("'https://esm.sh/three@0.180.0'",JSON.stringify(urls[0])).replace("'https://esm.sh/cannon-es@0.20.0'",JSON.stringify(urls[1]));
  html=html.replace('tray.hidden=true;ambiance.hidden=true;', 'tray.hidden=true;ambiance.hidden=false;');
  if(fullscreen){
    html=html.replace('antialias:true,alpha:false','antialias:true,alpha:true');
    html=html.replace("function polygon(shape){return basePolygon(shape).map(([x,z])=>[x*1.45,z*1.45])}","function polygon(shape){const z=5.45,x=z*stage.clientWidth/Math.max(1,stage.clientHeight);return [[-x,-z],[x,-z],[x,z],[-x,z]]}");
    html=html.replace('function fitTray(){camera.zoom=1;', 'function fitTray(){camera.position.set(0,18,.001);camera.lookAt(0,0,0);camera.zoom=1;camera.updateProjectionMatrix();return;');
    html=html.replace('syncPalettes();restoring=false;', 'syncPalettes();restoring=false;scene.background=null;renderer.setClearAlpha(0);trayMeshes.forEach(m=>m.visible=false);');
  }
  const style='#physics-dice-demo{border:0!important;background:transparent!important;padding:0!important;max-width:none!important;width:100%!important;height:100%!important;overflow:hidden}#physics-dice-demo>.head,#physics-dice-demo>.ecrin-tabs,#physics-dice-demo>.studio:not(.launch-section){display:none!important}#physics-dice-demo .launch-section{display:block!important;margin:0!important;padding:0!important;border:0!important;height:100%!important}#physics-dice-demo .launch-section>*:not(.stage){display:none!important}#physics-dice-demo .stage{display:block!important;width:100%!important;height:100%!important;margin:0!important;border:0!important;background:'+ (fullscreen?'transparent':'#211b17')+'!important}';
  const iframe=document.createElement('iframe'); iframe.title='Lancer des dés 3D'; iframe.className=fullscreen?'game-dice-frame fullscreen':'game-dice-frame'; iframe.setAttribute('sandbox','allow-scripts allow-same-origin'); body.prepend(iframe);
  const doc='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden}'+style+'</style></head><body>'+html+'</body></html>';
  return new Promise((resolve,reject)=>{let timer=0, poll=0,watch=0,finished=false; const done=(err,val)=>{if(finished)return;finished=true;clearTimeout(timer);clearInterval(poll);clearInterval(watch);iframe.remove();urls.forEach(URL.revokeObjectURL);err?reject(err):resolve(val)};
    timer=setTimeout(()=>done(new Error('Lancer 3D indisponible')),30000);
    watch=setInterval(()=>{if(!iframe.isConnected)done(new Error('Lancer annulé'))},100);
    iframe.onload=()=>{poll=setInterval(()=>{if(!iframe.isConnected){done(new Error('Lancer annulé'));return}const win=iframe.contentWindow;if(win&&typeof win.studioRoll3D==='function'){clearInterval(poll);setTimeout(()=>{try{Promise.resolve(win.studioRoll3D(specs)).then(v=>done(null,v),e=>done(e))}catch(e){done(e)}},50)}},50)};
    iframe.srcdoc=doc;
  });
}
