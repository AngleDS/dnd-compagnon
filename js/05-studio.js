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
