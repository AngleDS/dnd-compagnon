// Kept separate so exported single-file backups do not register a service worker.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
 window.addEventListener('load', async () => {
  try {
   const registration = await navigator.serviceWorker.register('./sw.js', {scope:'./', updateViaCache:'none'});
   await navigator.serviceWorker.ready;
   const note = document.createElement('p'); note.className='muted'; note.style.fontSize='12px';
   note.textContent='Application prête hors ligne. Sur iPhone : Partager → Sur l’écran d’accueil.';
   document.getElementById('foot')?.append(note);
   if(registration.waiting) note.textContent='Mise à jour disponible : ferme toutes les fenêtres de l’application puis rouvre-la.';
   registration.addEventListener('updatefound',()=>{ const w=registration.installing; w?.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller) note.textContent='Mise à jour disponible : ferme toutes les fenêtres de l’application puis rouvre-la.';});});
  } catch(e) { const note=document.createElement('p'); note.textContent='Installation hors ligne indisponible. Recharge avec une connexion Internet.'; document.getElementById('foot')?.append(note); }
 });
}
