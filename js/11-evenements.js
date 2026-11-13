/* ---------- events ---------- */
/* Fenêtre qui ne saute pas : le bouton touché (format, agencement, largeur) reste sous le doigt après le nouveau rendu (voir render). */
function keepAnchor(t){ if(!S.T) return; const sel='[data-act="'+t.dataset.act+'"]'+["v","r","c","w","n","ag"].filter(k=>t.dataset[k]!==undefined).map(k=>`[data-${k}="${t.dataset[k]}"]`).join("");
  S.T.anchor={sel,top:t.getBoundingClientRect().top}; }
/* Liste des résultats de recherche : se replie quand on touche ailleurs, se rouvre en revenant dans la barre. */
document.addEventListener("pointerdown",e=>{ if(!S.T) return; const inside=e.target.closest&&e.target.closest(".tsearchwrap");
  // Un jet direct lancé depuis un résultat (mini-menu, pavé, fenêtre de résultat) ne replie pas la liste
  if(e.target.closest&&(e.target.closest(".qmenu")||(S.T.pop==="qroll"&&e.target.closest(".tpopback")))) return;
  const d=document.getElementById("tres"); if(!d) return; if(inside){ S.T.qOpen=true; d.classList.remove("closed"); } else if(!e.target.closest(".tpop")||!d.closest(".tpop")){ S.T.qOpen=false; d.classList.add("closed"); } },true);
/* Menu déroulant : se ferme au choix d'un élément, au clic ailleurs et avec Échap. */
document.addEventListener("click",e=>{ if(!S.menuOpen) return; const inMenu=e.target.closest&&e.target.closest("#hmenu");
  if(!inMenu||(e.target.closest(".hditem")&&!e.target.closest('[data-act="menuToggle"]'))){ S.menuOpen=false; if(!inMenu) render(); } },true);
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&S.menuOpen){ S.menuOpen=false; render(); document.querySelector(".hmenu")?.focus(); } });
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-act]"); if(!t) return;
  if(t.dataset.act==="tip"){ e.preventDefault(); openTip(t.dataset.k,t); return; }
  if(t.dataset.act==="tipclose"){ closeTip(); return; }
  const a=t.dataset.act, ch=cur();
  if(VIRTUAL_ACTIONS.has(a)&&!virtualDiceEnabled()){ e.preventDefault(); return; }
  if(a==="closeModal"){ if(e.target===t||t.tagName==="BUTTON"){ S.pending=null; renderModal(); render(); } return; }
  if(a!=="bagdel"&&a!=="bagrm") S.bagDel=null;
  if(a!=="ask"&&S.confirm&&!["del","hbDel","rest"].includes(a)) S.confirm=null;
  switch(a){
    case "layoutEdit": S.layoutEdit=true; render(); break;
    case "layoutDone": S.layoutEdit=false; S.undo=null; render(); break;
    // Supprimer en mode édition : tout de suite, sans confirmation ; « Annuler » rétablit la disposition d'avant pendant quelques secondes
    case "blkDelNow": if(ch){ const id=t.dataset.v; if(BLK_KEEP.includes(id)) break; const label=blkLabel(ch,id), snap=JSON.parse(JSON.stringify(ch.layout||{}));
      if(id.startsWith("c_")){ saveCustom(ch,customCopy(ch).filter(b=>b.id!==id)); saveTableOrder(ch,tableOrder(ch)); } else setBlkHidden(ch,id,true);
      const u=S.undo={doc:S.cur,layout:snap,label,at:Date.now()}; clearTimeout(S.undoTimer); S.undoTimer=setTimeout(()=>{ if(S.undo===u){ S.undo=null; render(); } },6000); render(); } break;
    case "blkWidth": if(ch){ const id=t.dataset.v, w=+t.dataset.w, b=customBlocks(ch).find(x=>x.id===id); if(!blkWidths(id,b).includes(w)) break; keepAnchor(t);
      ch.layout=Object.assign({},ch.layout,{width:Object.assign({},ch.layout?.width,{[id]:w})});
      // Bloc créé : les tuiles qui ne tiennent plus dans les cases plus étroites retournent dans la réserve
      if(b){ const list=customCopy(ch), bb=list.find(x=>x.id===id); bb.w=w; const keep=cGrid(bb).tiles.filter(x=>tileFits(x.id,sizeW(x.sz,bb.c,w))), n=cGrid(bb).tiles.length-keep.length;
        bb.tiles=keep.map(x=>({id:x.id,sz:x.sz,r:x.r,c:x.c})); list.forEach(x=>delete x.w); saveCustom(ch,list); if(n) setBanner(n+" tuile"+(n>1?"s retournent":" retourne")+" dans la réserve : trop large"+(n>1?"s":"")+" pour cette largeur."); }
      touch(S.cur); render(); } break;
    // Format d'un bloc créé : rangées × largeur. Une tuile garde sa place si elle y tient, sinon elle va dans la première case libre (à sa taille, puis en 1×1) ;
    // celles qui ne tiennent plus attendent (b.park) et reviennent d'elles-mêmes quand le bloc s'agrandit.
    case "blkPat": if(ch){ const id=t.dataset.v, list=customCopy(ch), b=list.find(x=>x.id===id), r=+t.dataset.r, c=+t.dataset.c;
      if(b&&CUSTOM_PATS.some(([a,w])=>a===r&&w===c)){ keepAnchor(t); const prev=cGrid(b).tiles, park=(Array.isArray(b.park)?b.park:[]).filter(x=>typeof x==="string"&&!prev.some(y=>y.id===x));
        b.w=c; delete b.ag; b.r=r; b.c=c; const placed=[], out=[], tmp={r,c,tiles:placed};
        for(const x of prev.concat(park.map(id=>({id,sz:"1"})))){ let ok=false;
          for(const sz of [...new Set([x.sz||"1","1"])]){ if(!sizeOk(sz,r,c)||!tileSizeOk(x.id,sz,r,c)||!tileFits(x.id,sizeW(sz,c,c))) continue; const [h,w]=tileSpan(sz,r,c), cc=sz==="l"||sz==="b"?0:x.c;
            const here=Number.isInteger(x.r)&&x.r+h<=r&&cc+w<=c&&!placed.some(y=>tilesHit(y,{sz,r:x.r,c:cc},r,c))?{r:x.r,c:cc}:cFreeSpot(tmp,sz);
            if(here){ placed.push({id:x.id,sz,r:here.r,c:here.c}); ok=true; break; } }
          if(!ok) out.push(x.id); }
        b.tiles=placed.map(x=>({id:x.id,sz:x.sz,r:x.r,c:x.c})); if(out.length) b.park=out; else delete b.park;
        list.forEach(x=>delete x.w); saveCustom(ch,list); ch.layout.width=Object.assign({},ch.layout.width,{[id]:c}); touch(S.cur);
        const fresh=out.filter(x=>!park.includes(x)); if(fresh.length){ const cat=customCat(); setBanner("Plus de place pour : "+fresh.map(x=>cat[x]||x).join(", ")+". "+(fresh.length>1?"Elles reviendront":"Elle reviendra")+" si le bloc s’agrandit."); } }
      S.T.ctile=null; S.T.tileSlot=null; render(); } break;
    // Format d'un bloc de base : largeur et tuiles par rangée
    case "blkFmt": if(ch){ const id=t.dataset.v, w=+t.dataset.w, n=+t.dataset.n; if(!blkWidths(id).includes(w)||!COLS_MIN[id]||!colsOk(id,w,n)) break; keepAnchor(t);
      ch.layout=Object.assign({},ch.layout,{width:Object.assign({},ch.layout?.width,{[id]:w}),cols:Object.assign({},ch.layout?.cols,{[id]:n})}); touch(S.cur); render(); } break;
    // Agencement d'un bloc créé : les tuiles posées au coin d'une nouvelle case en prennent la taille si elles y tiennent ; les autres retournent dans la réserve
    case "blkAg": if(ch){ const id=t.dataset.v, list=customCopy(ch), b=list.find(x=>x.id===id), ag=t.dataset.ag; if(!b||!agList(b.r,b.c).some(a=>a[0]===ag)) break; keepAnchor(t);
      b.w=blkWidth(ch,id,b); b.ag=ag; const sl=agSlots(b.r,b.c,ag), keep=[], out=[];
      for(const x of cGrid(b).tiles){ const s0=sl.find(y=>y.r===x.r&&y.c===x.c); if(s0&&slotOk(b,x.id,s0)) keep.push({id:x.id,sz:s0.sz,r:x.r,c:x.c}); else out.push(x.id); }
      b.tiles=keep; list.forEach(x=>delete x.w); saveCustom(ch,list); if(out.length){ const cat=customCat(); setBanner("Retour dans la réserve : "+out.map(x=>cat[x]||x).join(", ")+"."); }
      S.T.ctile=null; S.T.tileSlot=null; render(); } break;
    case "blkDup": if(ch){ const list=customCopy(ch), b=list.find(x=>x.id===t.dataset.v); if(!b||list.length>=20) break; const id="c_"+Math.random().toString(36).slice(2,10);
      list.forEach(x=>delete x.w); list.push(Object.assign(JSON.parse(JSON.stringify(b)),{id,name:(b.name||"Bloc")+" (copie)"})); delete list[list.length-1].w; saveCustom(ch,list);
      const o=tableOrder(ch).filter(x=>x!==id); o.splice(o.indexOf(b.id)+1,0,id); saveTableOrder(ch,o); if(ch.layout.width?.[b.id]) ch.layout.width=Object.assign({},ch.layout.width,{[id]:ch.layout.width[b.id]});
      S.T.pop="tiles:"+id; render(); } break;
    case "blkResetOne": if(ch){ const id=t.dataset.v; ch.layout=Object.assign({},ch.layout); for(const k of ["width","titles","tiles","cols"]) if(ch.layout[k]&&id in ch.layout[k]){ ch.layout[k]=Object.assign({},ch.layout[k]); delete ch.layout[k][id]; }
      touch(S.cur); S.T.tileSlot=null; render(); } break;
    case "layoutAuto": if(ch){ const snap=JSON.parse(JSON.stringify(ch.layout||{})); autoLayout(ch); const u=S.undo={doc:S.cur,layout:snap,label:"",auto:true,at:Date.now()};
      clearTimeout(S.undoTimer); S.undoTimer=setTimeout(()=>{ if(S.undo===u){ S.undo=null; render(); } },6000); render(); } break;
    case "blkUndo": if(ch&&S.undo&&S.undo.doc===S.cur){ ch.layout=S.undo.layout; S.undo=null; clearTimeout(S.undoTimer); touch(S.cur); render(); } break;
    case "layoutMag": case "layoutGrav": if(ch){ const k=a==="layoutMag"?"mag":"grav", on=k==="mag"?ch.layout?.mag===false:!ch.layout?.grav; ch.layout=Object.assign({},ch.layout,{[k]:on}); touch(S.cur); render(); } break;
    case "layoutReset": if(ch){ ch.layout=Object.assign({},ch.layout); delete ch.layout.order; delete ch.layout.pos; touch(S.cur); } if(S.T) S.T.pop=null; render(); break;
    case "tileAdd": if(ch&&!tileOkInBlk(t.dataset.v,t.dataset.blk)) break; if(ch){ const blk=t.dataset.blk, arr=blockTiles(ch,blk), i=Number.isInteger(S.T.tileSlot)&&S.T.tileSlot<arr.length?S.T.tileSlot:arr.indexOf(""); if(i>=0){ arr[i]=t.dataset.v; setBlockTiles(ch,blk,arr); S.T.tileSlot=null; } else setBanner("Bloc plein : retire d’abord une tuile."); render(); } break;
    case "tileCell": if(ch){ const blk=t.dataset.blk, arr=blockTiles(ch,blk), i=+t.dataset.i, j=S.T.tileSlot; // toucher une case la sélectionne ; une case pleine sélectionnée puis une autre case = déplacer ou échanger
      if(Number.isInteger(j)&&j!==i&&arr[j]){ [arr[i],arr[j]]=[arr[j],arr[i]]; setBlockTiles(ch,blk,arr); S.T.tileSlot=null; } else S.T.tileSlot=j===i?null:i; render(); } break;
    case "tileDel": if(ch){ const arr=blockTiles(ch,t.dataset.blk); arr[+t.dataset.i]=""; setBlockTiles(ch,t.dataset.blk,arr); S.T.tileSlot=null; render(); } break;
    case "tileReset": if(ch){ ch.layout=Object.assign({},ch.layout); ch.layout.tiles=Object.assign({},ch.layout.tiles); delete ch.layout.tiles[t.dataset.blk]; touch(S.cur); S.T.tileSlot=null; render(); } break;
    case "blkCreate": if(ch){ const list=customCopy(ch); if(list.length>=20) break; const id="c_"+Math.random().toString(36).slice(2,10);
      const c=Math.min(4,Math.max(1,+t.dataset.c)); list.push({id,name:"Mon bloc "+(list.length+1),r:Math.min(4,Math.max(1,+t.dataset.r)),c,tiles:[]}); saveCustom(ch,list); saveTableOrder(ch,tableOrder(ch));
      ch.layout.width=Object.assign({},ch.layout.width,{[id]:c}); S.T.tileSlot=null; S.T.ctile=null; S.T.pop="tiles:"+id; render(); } break;
    case "ctileAdd": if(ch){ const id=t.dataset.v, b=customBlocks(ch).find(x=>x.id===id); if(b){
        // Case choisie (agencement) : la tuile prend sa taille ; sinon, première case de l'agencement où elle tient, puis l'ancien placement
        const n=S.T.tileSlot, sel=Number.isInteger(n)?slotAt(b,Math.floor(n/b.c),n%b.c):null, occ=cGrid(b).occ, freeSl=sl=>{ const [h,w]=tileSpan(sl.sz,b.r,b.c); for(let i=sl.r;i<sl.r+h;i++) for(let j=sl.c;j<sl.c+w;j++) if(occ[i][j]>=0) return false; return true; };
        const sl=sel?(slotOk(b,t.dataset.t,sel)&&freeSl(sel)?sel:null):Number.isInteger(n)?null:bSlots(b).find(x=>freeSl(x)&&slotOk(b,t.dataset.t,x));
        if(sel&&!sl){ setBanner("Cette tuile ne tient pas dans cette case."); render(); break; }
        const sz=sl?sl.sz:fitSize(b,t.dataset.t), spot=sl?{r:sl.r,c:sl.c}:sz&&cFreeSpot(b,sz,S.T.tileSlot);
        if(!spot) setBanner(sz?"Pas assez de place libre pour cette tuile : retire ou réduis une tuile.":"Cette tuile est trop large pour ce bloc."); else if(cUpdate(ch,id,bb=>cMove(bb,{id:t.dataset.t,sz},spot))){ S.T.tileSlot=null; S.T.ctile=null; } } render(); } break;
    case "ctileSel": { const i=+t.dataset.i; S.T.ctile=S.T.ctile===i?null:i; S.T.tileSlot=null; render(); } break; // toucher une tuile la sélectionne (tailles, retirer, puis case libre pour la déplacer)
    case "ctileCell": { const n=+t.dataset.cell, j=S.T.ctile; // une tuile sélectionnée puis une case libre : déplacer
      if(ch&&Number.isInteger(j)){ const b=customBlocks(ch).find(x=>x.id===t.dataset.v);
        if(b&&cUpdate(ch,b.id,bb=>cMove(bb,{i:j},{r:Math.floor(n/b.c),c:n%b.c}))) S.T.ctile=null; else setBanner("Pas la place ici."); S.T.tileSlot=null; }
      else S.T.tileSlot=S.T.tileSlot===n?null:n; render(); } break;
    case "ctileDel": if(ch){ cUpdate(ch,t.dataset.v,b=>{ const l=cGrid(b).tiles; l.splice(+t.dataset.i,1); return l; }); S.T.ctile=null; render(); } break;
    case "ctileSize": if(ch){ if(!cUpdate(ch,t.dataset.v,b=>cResize(b,+t.dataset.i,t.dataset.z))) setBanner("Pas assez de place dans ce bloc pour cette taille ici."); render(); } break;
    case "cblkDel": S.T.cdel=S.T.cdel===t.dataset.v?null:t.dataset.v; render(); { const pb=document.querySelector(".tpopbody"); if(pb) pb.scrollTop=0; } break;
    case "cblkDelNo": S.T.cdel=null; render(); break;
    case "cblkDelYes": if(ch){ const id=t.dataset.v; if(id.startsWith("c_")){ saveCustom(ch,customCopy(ch).filter(b=>b.id!==id)); saveTableOrder(ch,tableOrder(ch)); } else if(!BLK_KEEP.includes(id)){ setBlkHidden(ch,id,true); setBanner("Bloc retiré : « Ajouter un bloc » permet de le remettre."); } S.T.cdel=null; S.T.pop=null; render(); } break;
    case "blkRestore": if(ch){ setBlkHidden(ch,t.dataset.v,false); S.T.pop=null; render(); } break;
    case "blkMove": if(ch){ moveTableBlock(ch,t.dataset.v,+t.dataset.d); render(); } break;
    case "chargeRecoveryRoll": { const b=(ch.bag||[]).find(b=>b.id===t.dataset.id); if(b?.charges?.pendingRecovery) applyChargeRecovery(ch,b.id,rollExpr(b.charges.rec).total,true); render(); break; }
    case "virtualDice": setVirtualDice(!virtualDiceEnabled()); render(); renderDice(); break;
    case "nav": if(t.dataset.v==="hb"||t.dataset.v==="comp"){ if(S.view==="sheet") S.navFrom="perso"; else if(S.view==="list") S.navFrom="menu"; }
      if(t.dataset.v==="main"||t.dataset.v==="table"){ // rester sur le perso affiché ; le perso principal seulement en venant d'ailleurs
        const here=S.cur&&S.docs[S.cur]&&S.docs[S.cur].type==="perso"; const m=here?S.cur:mainId(); if(m){ S.tab = t.dataset.v==="table" ? "table" : (S.cur===m&&S.tab!=="table"?S.tab:"jeu"); if(t.dataset.v==="main") S.unlockEdit=false; S.cur=m; S.view="sheet"; render(); window.scrollTo(0,0); } break; } S.view=t.dataset.v; S.cur=S.view==="list"?null:S.cur; render(); break;
    case "open": S.unlockEdit=false; S.cur=t.dataset.id; S.view="sheet"; S.tab="jeu"; if(!mainId()) setMain(t.dataset.id); render(); window.scrollTo(0,0); break;
    case "setMain": setMain(t.dataset.id); render(); break;
    case "openTable": S.unlockEdit=false; S.cur=t.dataset.id; S.view="sheet"; S.tab="table"; if(!mainId()) setMain(t.dataset.id); render(); window.scrollTo(0,0); break;
    case "new": newChar(); break;
    case "wizard": S.W=wNew(); S.view="wizard"; window.scrollTo(0,0); render(); break;
    case "wcancel": { const made=(S.W&&S.W.catMade)||[]; S.W=null; for(const id of made) if(S.docs[id]&&S.docs[id].pending&&!hbUsed(id)) removeDoc(id); S.view="list"; render(); break; }
    case "wgo": { const v=+t.dataset.v; if(v>S.W.step&&wCheck(S.W,S.W.step)) break; S.W.step=v; render(); window.scrollTo(0,0); break; }
    case "wpick": { const W=S.W, k=t.dataset.k, v=catRes(t.dataset.v); if(!v) break; if(k==="cls"&&W.cls!==v){ W.skills=[]; W.can=[]; W.spl=[]; W.inv=[]; W.invc=[]; W.eqOff={}; W.eqC="A"; }
      if(k==="bg"&&W.bg!==v){ W.asi2=""; W.asi1=""; W.asiT=["","",""]; W.feat=""; W.eqB="A"; W.skills=W.skills.filter(s=>!(srd("backgrounds",v)||{skills:[]}).skills.includes(s)); }
      if(k==="sp"&&W.sp!==v){ W.hFeat=""; W.extraSkill=""; }
      W[k]=v; if(k==="bg"){ const x=hb(v); if(x&&x.featRef&&!W.feat) W.feat=catRes(x.featRef); } render(); break; }
    case "wpt": { const a=t.dataset.a; S.W.pts[a]=Math.max(8,Math.min(15,(+S.W.pts[a]||8)+(+t.dataset.v))); render(); break; }
    case "wroll": { const W=S.W; if(W.rolled||W.dice.some(v=>v!=="")) break; const bd=[]; W.dice=W.dice.map(()=>{ const r=[rnd(6),rnd(6),rnd(6),rnd(6)].sort((x,y)=>y-x); bd.push(r[0]+r[1]+r[2]); return r[0]+r[1]+r[2]; }); W.rolled=true; W.rollBd=bd.join(", "); W.diceAs={};
      addLog({label:"Création · 6 jets de 4d6",total:"✓",bd:W.rollBd,kind:"info",quiet:true}); render(); break; }
    case "wskill": { const W=S.W, v=t.dataset.v, n=wCls(W).skillChoices.count; if(W.skills.includes(v)) W.skills=W.skills.filter(x=>x!==v); else if(W.skills.length<n) W.skills.push(v); if(W.extraSkill===v) W.extraSkill=""; render(); break; }
    case "weq": { S.W.eqOff[t.dataset.v]=!t.checked; render(); break; }
    case "wcreate": wCreate(); break;
    case "afRun": afRun(t.dataset.mode==="hb"?{mode:"hb",id:t.dataset.id}:{mode:"nh"}); break;
    case "afClose": S.af=null; renderModal(); break;
    case "afApply": afApply(); break;
    case "afMem": { const A=S.af; if(A&&(A.state==="mem"||A.state==="near")) afMem(A.target,A.kind,A.name); break; }
    case "afWeb": { const A=S.af; if(A&&A.state==="near") afWeb(A.target,A.kind,A.name); break; }
    case "afNearUse": { const A=S.af; if(A&&A.state==="near") afRun(A.target,A.near.url,true); break; }
    case "afNearLink": { const A=S.af; if(!A||A.state!=="near") break; if(A.target.mode==="hb"){ const d=S.docs[A.target.id]; if(d){ d.link=A.near.url; touch(A.target.id); } } else if(S.W&&S.W.nh) S.W.nh.link=A.near.url; S.af=null; renderModal(); render(); break; }
    case "wnh": S.W.nh={kind:t.dataset.k,target:t.dataset.v,name:"",label:"",text:"",tools:"",speed:9,abs:["","",""],sk:["",""]}; render(); break;
    case "wnhCancel": S.W.nh=null; render(); break;
    case "wnhSave": { const W=S.W, n=W.nh; if(!n||!String(n.name||"").trim()){ const i=document.querySelector('[data-w="nh.name"]'); if(i){ i.focus(); i.style.borderColor="var(--blood)"; } break; }
      const id="hb_"+uid(); const d=Object.assign({},n.patch||{},{type:"hb",kind:n.kind,name:n.name.trim(),label:n.label||"",text:n.text||"",effects:[],updatedAt:Date.now()}); if(n.link) d.link=n.link; if(n.links) d.links=n.links;
      if(n.kind==="classe"){ d.hitDie=+n.hitDie||(n.patch&&n.patch.hitDie)||8; if(n.save1) d.save1=n.save1; if(n.save2) d.save2=n.save2; if(n.primary1) d.primary1=n.primary1; d.castType=n.castType||d.castType||""; if(n.castAbility) d.castAbility=n.castAbility; d.features=d.features||[]; }
      if(n.kind==="historique"){ d.abilities=n.abs.filter(Boolean).length===3?n.abs.slice():[]; d.effects=n.sk.filter(Boolean).map(k=>({t:"maitrise",cible:"comp:"+k,niveau:1})); d.tools=n.tools||""; }
      if(n.kind==="espece") d.speed=+n.speed||9;
      S.docs[id]=d; touch(id); const tg=n.target; W.nh=null;
      if(tg==="cls"){ W.cls="hb:"+id; W.skills=[]; W.can=[]; W.spl=[]; W.inv=[]; W.invc=[]; W.eqOff={}; W.eqC="A"; }
      else if(tg==="bg"){ W.bg="hb:"+id; W.asi2=""; W.asi1=""; W.asiT=["","",""]; W.feat=""; } else W[tg]="hb:"+id;
      render(); break; }
    case "dup": { const id="perso_"+uid(); const c=clone(S.docs[t.dataset.id]); c.name+=" (copie)"; S.docs[id]=c; touch(id); render(); break; }
    case "askdel": S.confirm="del:"+t.dataset.id; render(); break;
    case "del": removeDoc(t.dataset.id); S.confirm=null; render(); break;
    case "export": exportChar(t.dataset.id); break;
    case "tab": S.tab=t.dataset.v; render(); { const tb=document.querySelector(".sheettabs"); if(tb&&tb.getBoundingClientRect().top<0) window.scrollTo(0,0); } break;
    case "ask": S.confirm=t.dataset.v; render(); break;
    case "rest": applyRest(t.dataset.v); S.confirm=null; touch(S.cur); render(); break; // applyRest refuse à 0 PV
    case "r20": rollD20(t.dataset.l, +t.dataset.m); break;
    case "dmg": rollDmg(t.dataset.l, t.dataset.e, t.dataset.crit==="1"); break;
    case "adv": S.adv=t.dataset.v; renderDice(); break;
    case "histDel": { const ix=String(t.dataset.i).split(",").map(Number).sort((a,b)=>b-a); if(ch&&ch.rollLog&&ix.length&&ix.every(i=>Number.isInteger(i)&&ch.rollLog[i])){ for(const i of ix) ch.rollLog.splice(i,1); touch(S.cur); render(); } break; }
    case "histDay": S.hist={day:t.dataset.v,n:HIST_PAGE}; S.histConfirm=false; render(); break;
    case "histMore": if(S.hist) S.hist.n+=HIST_PAGE; render(); break;
    case "clearLog": S.log=[]; if(ch&&S.T&&S.T.pop==="hist"){ if(t.dataset.ok){ ch.rollLog=[]; touch(S.cur); S.histConfirm=false; } else { S.histConfirm=true; } } renderDice(); render(); break;
    case "death": { const r=rnd(20); ch.death=ch.death||{s:0,f:0}; let txt;
      if(r===20){ ch.hp.cur=1; ch.death={s:0,f:0}; txt="20 naturel : tu reprends conscience avec 1 PV."; }
      else if(r===1){ ch.death.f=Math.min(3,ch.death.f+2); txt="1 naturel : deux échecs."; }
      else if(r>=10){ ch.death.s=Math.min(3,ch.death.s+1); txt="Réussite."+(ch.death.s>=3?" Trois réussites : tu es stabilisé.":""); }
      else { ch.death.f=Math.min(3,ch.death.f+1); txt="Échec."+(ch.death.f>=3?" Trois échecs : ton personnage meurt.":""); }
      addLog({label:"Jet contre la mort",total:r,bd:txt,crit:r===20,fumble:r===1}); touch(S.cur); render(); break; }
    case "spendhd": { const D=derive(ch); if((+ch.hdUsed||0)>=D.L) break; const r=rollExpr("1d"+D.hd); const heal=Math.max(1,r.total+D.mods.con); ch.hdUsed=(+ch.hdUsed||0)+1; ch.hp=ch.hp||{cur:0,temp:0}; ch.hp.cur=Math.min(D.hpMax,(+ch.hp.cur||0)+heal);
      addLog({label:"Dé de vie dépensé",total:heal,bd:r.bd+" "+sg(D.mods.con)+" Con"}); touch(S.cur); render(); break; }
    case "pip": { const k=t.dataset.k, i=+t.dataset.i, max=+t.dataset.max, isUsed=t.dataset.used==="1";
      if(k.startsWith("cnt:")){ const c=(ch.counters||[]).find(x=>x.id===k.slice(4)); if(!c) break; const left=+c.cur||0; c.cur = i<left ? i : i+1; touch(S.cur); render(); break; }
      let cv = k==="pact"?(+ch.pactUsed||0) : k.startsWith("slot:")?+(ch.slotsUsed?.[k.slice(5)]||0) : k.startsWith("res:")?+(ch.resUsed?.[k.slice(4)]||0) : +(getPath(ch,k)||0);
      let nv;
      if(isUsed){ const left=max-cv; nv = i<left ? max-i : max-(i+1); nv=Math.max(0,Math.min(max,nv)); }
      else { nv = cv===i+1 ? i : i+1; }
      if(k==="pact") ch.pactUsed=nv; else if(k.startsWith("slot:")){ ch.slotsUsed=ch.slotsUsed||{}; ch.slotsUsed[k.slice(5)]=nv; } else if(k.startsWith("res:")){ ch.resUsed=ch.resUsed||{}; ch.resUsed[k.slice(4)]=nv; } else setPath(ch,k,nv);
      touch(S.cur); render(); break; }
    case "ammoNew": if(ch){ const name=String(t.dataset.v||"Munitions").slice(0,40); if(!ammoCounter(ch,name)&&!ammoItem(ch,name)){ ensureBag(ch); ch.bag.push({id:uid(),name,qty:20,note:""}); touch(S.cur); } render(); } break;
    case "ammoEnd": if(ch){ const c=t.dataset.obj?(ch.bag||[]).find(x=>x.id===t.dataset.obj):(ch.counters||[]).find(x=>x.id===t.dataset.id); if(!c) break; const back=Math.floor((+c.spent||0)/2);
      if(t.dataset.obj) c.qty=(+c.qty||0)+back; else c.cur=Math.min(+c.max||Infinity,(+c.cur||0)+back); c.spent=0;
      addLog({label:c.name+" récupérées",total:back,bd:"Moitié des munitions tirées pendant le combat",kind:"info"}); touch(S.cur); render(); } break;
    case "ctrUse": if(ch&&ctrUse(ch,t.dataset.v)) render(); break;
    case "compstep": if(ch){ const c=JSON.parse(JSON.stringify(ch.companion||{name:"",ac:10,hp:{cur:10,max:10}})); c.hp=c.hp||{cur:0,max:0}; const d=+t.dataset.v, k=t.dataset.k;
      if(k==="ac") c.ac=Math.max(0,Math.min(40,(+c.ac||10)+d)); else if(k==="max"){ c.hp.max=Math.max(1,Math.min(999,(+c.hp.max||0)+d)); c.hp.cur=Math.min(c.hp.cur,c.hp.max); } else if(k==="cur") c.hp.cur=Math.max(0,Math.min(+c.hp.max||0,(+c.hp.cur||0)+d));
      ch.companion=c; touch(S.cur); render(); } break;
    case "resstep": if(ch){ const D=derive(ch), r=D.res.find(x=>x.id===t.dataset.id); if(!r) break; ch.resUsed=Object.assign({},ch.resUsed); ch.resUsed[r.id]=Math.max(0,Math.min(r.max,(+ch.resUsed[r.id]||0)+(+t.dataset.v))); touch(S.cur); render(); } break;
    case "resuse": { const id=t.dataset.id, inp=document.getElementById("resn-"+id.replace(/[^a-z0-9]/g,"")); const n=+inp.value||0; if(!n) break; const D=derive(ch); const r=D.res.find(x=>x.id===id); ch.resUsed=ch.resUsed||{}; ch.resUsed[id]=Math.max(0,Math.min(r.max,(+ch.resUsed[id]||0)+n)); touch(S.cur); render(); break; }
    case "pool": { const id=t.dataset.id, D=derive(ch), r=D.res.find(x=>x.id===id); const inp=document.getElementById("pool-"+id.replace(/[^a-z0-9]/g,"")); let n=Math.max(1,+inp.value||1); const left=r.max-(+ch.resUsed?.[id]||0); n=Math.min(n,left,r.maxUse||n); if(n<=0) break; const rr=rollExpr(n+"d"+r.die); ch.resUsed=ch.resUsed||{}; ch.resUsed[id]=(+ch.resUsed[id]||0)+n; addLog({label:r.name+" ("+n+"d"+r.die+")",total:rr.total,bd:rr.bd}); touch(S.cur); render(); break; }
    case "rouerie": { const D=derive(ch); if(!D.cast||D.cast.type!=="pact") break; const used=+(ch.resUsed?.["cls:rouerie-magique"]||0); if(used>=1) break;
      const spent=+ch.pactUsed||0; if(spent<=0){ addLog({label:"Rouerie magique",total:"—",bd:"Aucun emplacement de pacte à récupérer : la Rouerie n'a pas été utilisée.",kind:"info"}); break; }
      const gain=D.L>=20?spent:Math.min(spent,Math.ceil(D.cast.pactSlots/2)); ch.pactUsed=spent-gain; ch.resUsed=ch.resUsed||{}; ch.resUsed["cls:rouerie-magique"]=1;
      addLog({label:"Rouerie magique",total:"+"+gain,bd:gain+" emplacement(s) de pacte récupéré(s). Utilisable à nouveau après un repos long.",kind:"info"}); touch(S.cur); render(); break; }
    case "tsel": tSelect(t.dataset.k); break;
    case "tqroll": qMenuOpen(t); break; // jet direct depuis une ligne : d'abord le mini-menu (avantage… ou critique)
    case "tqdet": qMenuClose(); tSelect(t.dataset.k); break;
    case "tqgo": qMenuClose(); if(t.dataset.r==="cast") quickCast(t.dataset.k,t.dataset.m); else quickRoll(t.dataset.k,t.dataset.r,t.dataset.m,t.dataset.from); break;
    case "saveApp": saveApp(); break;
    case "hpmaxb": hpMaxAdd(ch,+t.dataset.v); render(); break;
    case "hpask": S.pending={type:"hp",mode:t.dataset.v}; renderModal(); break;
    case "hpquick": hpApply(+t.dataset.v); break;
    case "chg": { const b=(ch.bag||[]).find(x=>x.id===t.dataset.id); if(!b) break; const c=Object.assign({},itemCharges(ch,b)); const i=+t.dataset.i, left=c.max-(+c.used||0);
      c.used = i<left ? c.max-i : c.max-(i+1); c.auto=false; b.charges=c; touch(S.cur); render(); break; }
    case "itemN": S.T.itemN=+t.dataset.v; render(); break;
    case "itemUse": if(performTableItemUse(t.dataset)) render(); break;
    case "chgedit": S.pending={type:"chg",id:t.dataset.id}; renderModal(); break;
    case "chgSave": { const P=S.pending, b=(ch.bag||[]).find(x=>x.id===P.id); if(!b) break; const mx=Math.max(0,parseInt(document.getElementById("chg-max").value)||0);
      if(!mx){ b.charges=null; } else { const old=itemCharges(ch,b)||{}; b.charges={max:mx,used:Math.min(mx,+old.used||0),when:document.getElementById("chg-when").value,rec:document.getElementById("chg-rec").value.trim().replace(/\s/g,""),cost:document.getElementById("chg-cost").value,auto:false}; }
      S.pending=null; renderModal(); touch(S.cur); render(); break; }
    case "eqslot": S.T.eqSlot=t.dataset.v; render(); break;
    case "eqback": S.T.eqSlot=null; render(); break;
    case "eqset": eqSet(ch,t.dataset.slot,t.dataset.id||null); S.T.eqSlot=null; touch(S.cur); render(); break;
    case "eqatt": { ch.attuned=ch.attuned||[]; const id=t.dataset.id; if(ch.attuned.includes(id)) ch.attuned=ch.attuned.filter(x=>x!==id); else { if(ch.attuned.length>=3){ addLog({label:"Harmonisation",total:"3/3",bd:"Tu es déjà harmonisé avec 3 objets : retire-en un d'abord.",kind:"info"}); break; } ch.attuned.push(id); } touch(S.cur); render(); break; }
    case "ccopen": S.T.cc={dmg:0,mode:"n",d1:"",d2:"",res:null}; S.T.pop="concchk"; render(); break;
    case "ccmode": if(S.T.cc){ S.T.cc.mode=t.dataset.v; S.T.cc.d2=""; render(); } break;
    case "ccroll": { const c=S.T.cc; if(!c||c.res) break; const a1=rnd(20), b1=c.mode==="n"?0:rnd(20); ccResolve(a1,b1,true); break; }
    case "ccclose": S.T.pop=null; S.T.cc=null; render(); break;
    case "hdvirt": { const D=derive(ch); const r=rnd(D.hd); hdSpend(ch,D,r,false); break; }
    case "bannerClose": { const k=t.dataset.k; if(k){ try{ localStorage.setItem("registre-banner-"+k,"1"); }catch(e){} } setBanner(""); break; }
    case "menuToggle": S.menuOpen=!S.menuOpen; render(); break;
    case "theme": setTheme(curTheme()==="dark"?"light":"dark"); render(); break;
    case "pvTileSet": if(ch){ const v=t.dataset.v; ch.layout=Object.assign({},ch.layout); if(v==="__def") delete ch.layout.pvTile; else ch.layout.pvTile=String(v).slice(0,80); touch(S.cur); render(); } break;
    case "restOpen": S.T=S.T||{}; S.T.restKind=t.dataset.v||""; S.T.pop="rest"; render(); break;
    case "restKind": S.T.restKind=t.dataset.v; render(); break;
    case "restLong": if(applyRest("long")===false){ render(); break; } S.T.pop=null; S.T.restKind=""; S.T.hdLast=""; touch(S.cur); render(); break;
    case "restShort": if(applyRest("court")===false){ render(); break; } S.T.pop=null; S.T.hdLast=""; addLog({label:"Repos court",total:"✓",bd:"Emplacements et ressources de repos court récupérés.",kind:"info"}); touch(S.cur); render(); break;
    case "tpop": S.T.eqSlot=null; S.T.cdel=null; S.T.tileSlot=null; S.T.ctile=null; S.T.pop=t.dataset.v; S.histConfirm=false; S.hist=null; render(); if(t.dataset.v==="notes") setTimeout(()=>{ const n=document.getElementById("t-notes"); if(n){ n.focus(); n.setSelectionRange(n.value.length,n.value.length); } },0); break;
    case "tpopclose": if(e.target.closest("[data-act]")===t){ if(S.T.pop==="equip"&&S.T.eqSlot){ S.T.eqSlot=null; render(); break; } if(S.T.pop==="qroll"&&S.T.qrBack){ S.T.pop=S.T.qrBack; S.T.qrBack=null; render(); break; } S.T.pop=null; render(); } break;
    case "noop": break;
    case "tqclear": { S.T.q=""; const q=document.getElementById("tq"); if(q){ q.value=""; q.focus(); } document.getElementById("tres").innerHTML=""; t.hidden=true; break; }
    case "tvroll": { if(!ensureTableRollUse()) break; const T=S.T; T.d1=String(rnd(20)); T.d2=T.mode!=="n"?String(rnd(20)):""; if(logD20(false)) tableRollCommitted("d20"); render(); break; }
    case "gdie": { S.T.gdie=+t.dataset.v; S.T.dmg=""; S.T.dmgBd=""; render(); break; }
    case "hbGuessLink": { const d=S.docs[t.dataset.id]; if(!d) break; d.link=aideGuess(Object.assign({_id:t.dataset.id},d)); touch(t.dataset.id); render(); break; }
    case "tvdmg": { if(!ensureTableRollUse()) break; const T=S.T; const r=rollExpr(t.dataset.e,!!t.dataset.re1); T.dmg=String(r.total); T.dmgBd=(t.dataset.crit?"Critique · ":"")+r.bd; if(logDmg(false)) tableRollCommitted("dmg"); render(); break; }
    case "hpstep": { const D=derive(ch); ch.hp=ch.hp||{cur:D.hpMax,temp:0}; const v=+t.dataset.v, before=+ch.hp.cur||0;
      if(v<0&&before<=0){ ch.death=ch.death||{s:0,f:0}; if((ch.death.s||0)<3){ ch.death.f=Math.min(3,(ch.death.f||0)+1); addLog({label:"Dégâts à 0 PV",total:"échec",bd:"Subir des dégâts à 0 PV compte comme un échec (deux sur un coup critique).",kind:"info"}); } }
      ch.hp.cur=Math.max(0,Math.min(D.hpMax,before+v)); if(before<=0&&ch.hp.cur>0) ch.death={s:0,f:0};
      if(v<0&&ch.conc&&before>0) concDamage(1);
      touch(S.cur); render(); break; }
    case "tmpstep": { const D=derive(ch); ch.hp=ch.hp||{cur:D.hpMax,temp:0}; ch.hp.temp=Math.max(0,(+ch.hp.temp||0)+(+t.dataset.v)); touch(S.cur); render(); break; }
    case "portrait": { // champ fichier gardé hors du rendu : un nouveau rendu pendant le choix de l'image ne le détruit plus
      let inp=document.getElementById("portrait-file"); if(!inp){ inp=document.createElement("input"); inp.type="file"; inp.id="portrait-file"; inp.accept="image/*"; inp.hidden=true; document.body.appendChild(inp); }
      inp.dataset.id=S.cur||""; inp.value=""; inp.click(); break; }
    case "hpedit": S.hpEdit=true; render(); setTimeout(()=>{ const i=document.getElementById("hp-set"); if(i){ i.focus(); i.select(); } },0); break;
    case "teco": S.T.eco = S.T.eco===t.dataset.v?null:t.dataset.v; render(); break;
    case "tmode": S.T.mode=t.dataset.v; S.T.d1=""; S.T.d2=""; render(); break;
    case "tturn": { ch.turn=ch.turn||{}; ch.turn[t.dataset.v]=!ch.turn[t.dataset.v]; touch(S.cur); render(); break; }
    case "tnewturn": ch.turn={}; if(S.T){ S.T.castDone=null; S.T.itemUseReceipt=null; } touch(S.cur); render(); break;
    case "tconcEnd": ch.conc=""; touch(S.cur); render(); break;
    case "tcast": if(performTableCast(t.dataset)) render(); break;
    case "tuse": { const cost=t.dataset.v; if(!TURN_COSTS.includes(cost)) break; ch.turn=ch.turn||{}; ch.turn[cost]=!t.dataset.off; touch(S.cur); render(); break; }
    case "tpool": { const D=derive(ch), r=D.res.find(x=>x.id===t.dataset.id); if(!r) break; const left=r.max-(+ch.resUsed?.[r.id]||0); const n=Math.max(1,Math.min(+document.getElementById("t-pool").value||1,left,r.maxUse||left)); if(left<=0) break;
      ch.resUsed=ch.resUsed||{}; ch.resUsed[r.id]=(+ch.resUsed[r.id]||0)+n; const it=S.Titems.find(x=>x.res&&x.res.id===r.id); if(it) consumeTableCost(it.cost);
      S.T.poolKey=it?it.key:null; S.T.poolN=n; S.T.poolId=r.id; S.T.dmg=""; S.T.dmgBd="";
      addLog({label:r.name,total:n+"d"+r.die,bd:n+" dé"+(n>1?"s":"")+" dépensé"+(n>1?"s":"")+".",kind:"info",quiet:true}); touch(S.cur); render(); break; }
    case "tpoolundo": { const id=S.T.poolId; if(id&&S.T.poolN){ ch.resUsed=ch.resUsed||{}; ch.resUsed[id]=Math.max(0,(+ch.resUsed[id]||0)-S.T.poolN); } S.T.poolKey=null; S.T.poolN=0; S.T.dmg=""; S.T.dmgBd=""; touch(S.cur); render(); break; }
    case "tpoolself": { const D=derive(ch); const dt=document.getElementById("t-dtot"); const v=(+S.T.dmg||0)+(dt?+dt.dataset.flat||0:0); if(!v) break; ch.hp=ch.hp||{cur:D.hpMax,temp:0}; const before=+ch.hp.cur||0; ch.hp.cur=Math.min(D.hpMax,before+v); if(before<=0&&ch.hp.cur>0) ch.death={s:0,f:0}; addLog({label:"Soins reçus",total:"+"+(ch.hp.cur-before),bd:"PV "+ch.hp.cur+" / "+D.hpMax,quiet:true}); touch(S.cur); render(); break; }
    case "cnt": { const c=(ch.counters||[]).find(x=>x.id===t.dataset.id); if(!c) break; c.cur=Math.max(0,Math.min(+c.max||Infinity,(+c.cur||0)+(+t.dataset.v))); touch(S.cur); render(); break; }
    case "cntRm": ch.counters=(ch.counters||[]).filter(x=>x.id!==t.dataset.id); touch(S.cur); render(); break;
    case "cntRec": { const c=(ch.counters||[]).find(x=>x.id===t.dataset.id); if(!c) break; const v=t.dataset.v; if(v==="court"||v==="long") c.recharge=v; else delete c.recharge; touch(S.cur); render(); break; }
    case "bagq": { const b=(ch.bag||[]).find(x=>x.id===t.dataset.id); if(b){ b.qty=Math.max(0,(+b.qty||0)+(+t.dataset.v)); touch(S.cur); render(); } break; }
    case "mkItem": { const b=(ch.bag||[]).find(x=>x.id===t.dataset.id); if(!b) break; const id="hb_"+uid(); S.docs[id]={type:"hb",kind:"objet",name:b.name.replace(/\s*\(.*?\)\s*/g," ").trim()||b.name,label:"",text:"",effects:[],updatedAt:Date.now()}; touch(id); b.ref="hb:"+id; touch(S.cur); S.view="hb"; S.hbSel=id; render(); window.scrollTo(0,0); break; }
    case "bagdel": S.bagDel=t.dataset.id; render(); break;
    case "bagrm": S.bagDel=null; for(const k in ch.equip||{}) if(ch.equip[k]===t.dataset.id) eqSet(ch,k,null); ch.bag=(ch.bag||[]).filter(x=>x.id!==t.dataset.id); touch(S.cur); render(); break;
    case "editChar": S.cur=t.dataset.id; S.view="sheet"; S.tab="build"; S.unlockEdit=true; render(); window.scrollTo(0,0); break;
    case "lockEdit": S.unlockEdit=!S.unlockEdit; render(); break;
    case "lockCost": S.unlockCost=!S.unlockCost; render(); break;
    case "lockSlots": S.unlockSlots=!S.unlockSlots; render(); break;
    case "rouerieUndo": { ch.resUsed=ch.resUsed||{}; ch.resUsed["cls:rouerie-magique"]=0; touch(S.cur); render(); break; }
    case "cond": { const c=t.dataset.v; ch.conditions=ch.conditions||[]; ch.conditions=ch.conditions.includes(c)?ch.conditions.filter(x=>x!==c):[...ch.conditions,c]; touch(S.cur); render(); break; }
    case "exh": ch.exhaustion=Math.max(0,Math.min(6,(+ch.exhaustion||0)+(+t.dataset.v))); touch(S.cur); render(); break;
    case "tsearch": { const q=document.getElementById("tq"); if(q&&!q.closest(".tpop")){ q.scrollIntoView({block:"center",behavior:"smooth"}); q.focus({preventScroll:true}); } else { S.T.pop="search"; render(); setTimeout(()=>document.getElementById("tq")?.focus(),0); } break; }
    case "insp": // fiche : simple case à cocher ; à la table : un toucher la dépense, la regagner passe par le repos long ou le MJ
      if(t.dataset.v==="toggle"){ ch.inspiration=!ch.inspiration; touch(S.cur); render(); break; }
      if(ch.inspiration){ ch.inspiration=false; addLog({label:"Inspiration héroïque utilisée",total:"✓",bd:"Revient au repos long (Ingénieux) ou quand le MJ l'accorde.",kind:"info"}); touch(S.cur); render(); }
      else { S.T=S.T||{}; S.T.pop="insp"; render(); }
      break;
    case "inspGain": ch.inspiration=true; addLog({label:"Inspiration héroïque regagnée",total:"✓",bd:"Accordée par le MJ.",kind:"info"}); S.T.pop=null; touch(S.cur); render(); break;
    case "spdstep": case "spdset": if(ch){ const k=t.dataset.k; if(!SPD_MODES.some(m=>m[0]===k)) break; const sp=Object.assign({},ch.speeds), n=a==="spdset"?+t.dataset.v:(+sp[k]||0)+(+t.dataset.v);
      sp[k]=Math.max(0,Math.min(60,Math.round(n*10)/10)); if(!sp[k]) delete sp[k]; ch.speeds=sp; touch(S.cur); render(); } break;
    case "addAttack": { ch.attacks=ch.attacks||[]; const id=uid(); ch.attacks.push({id,name:"",weapon:"",ability:"auto",prof:true}); touch(S.cur); S.pending={type:"attack",id}; render(); break; }
    case "editAttack": S.pending={type:"attack",id:t.dataset.id}; renderModal(); break;
    case "rmAttack": ch.attacks=(ch.attacks||[]).filter(x=>x.id!==t.dataset.id); S.pending=null; touch(S.cur); render(); break;
    case "lvlUp": S.pending={type:"lvl",hp:"avg"}; renderModal(); break;
    case "lvlStop": if(S.pending) S.pending.stop=true; renderModal(); break;
    case "lvlStopNo": if(S.pending) S.pending.stop=false; renderModal(); break;
    case "lvlStopYes": S.lvlTarget=null; S.pending=null; renderModal(); render(); rvStart(S.cur); break;
    case "rvGo": for(const it of (S.rv?S.rv.items:[])) if(it.state==="err") it.state="wait"; rvRun(); break;
    case "rvStop": if(S.rv){ S.rv.stop=true; S.af=null; renderModal(); } break;
    case "rvOk": { const it=S.rv&&S.rv.items.find(i=>i.id===t.dataset.id); if(it) rvApply(it); renderModal(); render(); break; }
    case "rvSkip": { const it=S.rv&&S.rv.items.find(i=>i.id===t.dataset.id); const d=it&&S.docs[it.id]; if(d){ d.pendingSkip=true; touch(it.id); it.state="skip"; } renderModal(); break; }
    case "rvAll": for(const it of (S.rv?S.rv.items:[])) if(it.state==="ok") rvApply(it); renderModal(); render(); break;
    case "rvClose": if(S.rv&&!S.rv.run){ S.rv=null; renderModal(); render(); } break;
    case "catPick": S.catPick={q:"",k:S.hbFilter||""}; renderModal(); break;
    case "catClose": if(e.target.closest("[data-act]")===t){ S.catPick=null; renderModal(); } break;
    case "catAdd": { const r=catMat(t.dataset.id); S.catPick=null; renderModal(); if(r){ S.hbSel=r.slice(3); S.view="hb"; } render(); break; }
    case "catOpen": S.catPick=null; renderModal(); S.hbSel=t.dataset.id; S.view="hb"; render(); break;
    case "lvlApply": lvlApply(); break;
    case "pickSpell": S.pending={type:"spell",q:"",all:false}; renderModal(); break;
    case "addSpell": ch.spells=ch.spells||[]; ch.spells.push({ref:t.dataset.ref,prepared:true}); touch(S.cur); renderModal(); render(); break;
    case "rmSpell": ch.spells=(ch.spells||[]).filter(s=>s.ref!==t.dataset.ref); touch(S.cur); render(); break;
    case "prep": { const s=(ch.spells||[]).find(s=>s.ref===t.dataset.ref); if(s){ s.prepared=!(s.prepared!==false); touch(S.cur); render(); } break; }
    case "cast": { const D=derive(ch), sp=spellOf(t.dataset.ref), m=spellMech(sp), rit=t.dataset.rit==="1"; const sel=document.getElementById(t.dataset.sel||("slot-"+t.dataset.ref.replace(/[^a-z0-9]/gi,""))); const arc=+t.dataset.arc||0; const lvl=arc||(sp.level===0?0:+(sel?.value||sp.level));
      let left="";
      if(arc){ ch.resUsed=ch.resUsed||{}; if(+(ch.resUsed["arc:"+arc]||0)>=1){ addLog({label:"Arcanum déjà utilisé",total:"0",bd:"Il revient au repos long."}); break; } ch.resUsed["arc:"+arc]=1; left="Arcanum mystique utilisé (revient au repos long)."; }
      else if(sp.level>0 && !rit){
        if(D.cast.type==="pact"){ if((+ch.pactUsed||0)>=D.cast.pactSlots){ addLog({label:"Plus d'emplacement de pacte",total:"0",bd:"Un repos court les restaure."}); break; } ch.pactUsed=(+ch.pactUsed||0)+1; left=(D.cast.pactSlots-ch.pactUsed)+" emplacement(s) de pacte restant(s)"; }
        else { ch.slotsUsed=ch.slotsUsed||{}; const n=D.cast.slots[lvl-1]||0; if((+ch.slotsUsed[lvl]||0)>=n){ addLog({label:"Plus d'emplacement de niveau "+lvl,total:"0",bd:"Choisis un autre niveau ou fais un repos long."}); break; } ch.slotsUsed[lvl]=(+ch.slotsUsed[lvl]||0)+1; left=(n-ch.slotsUsed[lvl])+" emplacement(s) de niveau "+lvl+" restant(s)"; }
      }
      if(sp.concentration) ch.conc=sp.name;
      addLog({label:sp.name+(rit?" lancé en rituel":" lancé"),total:sp.level?"niv. "+(rit?sp.level:lvl):"mineur",bd:[rit?"Aucun emplacement dépensé.":left,sp.concentration?"Concentration notée.":"",m.save?"Cibles : JS de "+m.save+" DD "+D.cast.dc+".":""].filter(Boolean).join(" "),kind:"info"});
      const ex=diceAt(m,sp,rit?sp.level:lvl,D);
      const beams=beamsAt(m,sp,rit?sp.level:lvl,D);
      for(let b=1;b<=beams;b++){ const tag=beams>1?" ("+beamWord(m)+" "+b+")":""; if(m.attack) rollD20(sp.name+tag+" — toucher",D.cast.atk); if(ex) rollDmg(sp.name+tag+(m.heal?" — soins":" — dégâts "+(m.dmgType||"")),ex,false); }
      touch(S.cur); render(); break; }
    case "sdmg": { const D=derive(ch), sp=spellOf(t.dataset.ref), m=spellMech(sp); const sel=document.getElementById("slot-"+t.dataset.ref.replace(/[^a-z0-9]/gi,"")); const lvl=+(sel?.value||sp.level); const ex=diceAt(m,sp,lvl,D), nb=beamsAt(m,sp,lvl,D); for(let b=1;b<=nb;b++) rollDmg(sp.name+(nb>1?" ("+beamWord(m)+" "+b+")":"")+(m.heal?" — soins":" — dégâts "+(m.dmgType||"")),ex,false); break; }
    case "saveProf": { const v=t.dataset.v; ch.saveProfs=ch.saveProfs||[]; ch.saveProfs=t.checked?[...new Set([...ch.saveProfs,v])]:ch.saveProfs.filter(x=>x!==v); touch(S.cur); render(); break; }
    case "addInv": { const s1=document.getElementById("addInvSel"); if(!s1||!s1.value) break; const id=s1.value, s2=document.getElementById("addInvCh"); const c=INV_CHOICE[id]?(s2&&s2.value||""):"";
      if(INV_CHOICE[id]&&!c) break; ch.invocations=ch.invocations||[]; const v=id+(c?"|"+c:""); if(!ch.invocations.includes(v)) ch.invocations.push(v); S.invSel=null; touch(S.cur); render(); break; }
    case "smite": { const D=derive(ch); if((+ch.pactUsed||0)>=D.cast.pactSlots) break; ch.pactUsed=(+ch.pactUsed||0)+1; ch.turn=ch.turn||{}; ch.turn.smite=true; S.T.smiteBd="";
      addLog({label:"Frappe occulte",total:"niv. "+D.cast.pactLevel,bd:"Emplacement de pacte dépensé.",kind:"info",quiet:true}); touch(S.cur); render(); break; }
    case "smiteUndo": { ch.pactUsed=Math.max(0,(+ch.pactUsed||0)-1); ch.turn=ch.turn||{}; ch.turn.smite=false; S.T.smiteBd=""; addLog({label:"Frappe occulte annulée",total:"↺",bd:"Emplacement rendu.",kind:"info",quiet:true}); touch(S.cur); render(); break; }
    case "smiteRoll": { const r=rollExpr(t.dataset.e); S.T.smiteBd=r.total+" · "+r.bd; addLog({label:"Frappe occulte · dégâts de force",total:r.total,bd:(t.dataset.crit?"Critique · ":"")+r.bd,quiet:true}); render(); break; }
    case "itemSp": S.T.itemSp=+t.dataset.v; S.T.itemN=1; render(); break;
    case "addList": { const src=document.getElementById(t.dataset.src); if(!src||!src.value) break; const k=t.dataset.k, v=catRes(src.value); if(!v) break; ch[k]=ch[k]||[]; if(!ch[k].includes(v)) ch[k].push(v); touch(S.cur); render(); if(v!==src.value) rvStart(S.cur); break; }
    case "rmList": { const k=t.dataset.k; ch[k].splice(+t.dataset.i,1); touch(S.cur); render(); break; }
    case "addItem": { const v=document.getElementById("addItemSel").value; ch.items=ch.items||[]; ch.items.push({ref:v,equipped:true}); touch(S.cur); render(); break; }
    case "equip": { const it=ch.items[+t.dataset.i]; it.equipped=!it.equipped; touch(S.cur); render(); break; }
    case "rmItem": ch.items.splice(+t.dataset.i,1); touch(S.cur); render(); break;
    case "hbNew": { const k=document.getElementById("hbNewKind").value; const id="hb_"+uid(); S.docs[id]={type:"hb",kind:k,name:"Nouveau "+HB_KINDS[k].toLowerCase(),text:"",effects:[],features:(k==="sous-classe"||k==="classe")?[]:undefined,mech:k==="sort"?{}:undefined,level:k==="sort"?1:undefined,updatedAt:Date.now()}; Object.keys(S.docs[id]).forEach(x=>S.docs[id][x]===undefined&&delete S.docs[id][x]); touch(id); S.hbSel=id; render(); break; }
    case "hbSel": S.hbSel=t.dataset.id; render(); break;
    case "hbDel": removeDoc(t.dataset.id); S.hbSel=null; S.confirm=null; render(); break;
    case "hbAddFeat": { const d=S.docs[t.dataset.id]; d.features=d.features||[]; d.features.push({level:d.kind==="classe"?1:3,name:"",text:"",effects:[]}); touch(t.dataset.id); render(); break; }
    case "hbRmFeat": { const d=S.docs[t.dataset.id]; d.features.splice(+t.dataset.i,1); touch(t.dataset.id); render(); break; }
    case "effAdd": { const d=S.docs[t.dataset.id]; const ty=document.getElementById(t.dataset.src).value; let arr=getPath(d,t.dataset.path); if(!arr){ setPath(d,t.dataset.path,[]); arr=getPath(d,t.dataset.path); }
      const base={bonus:{t:"bonus",cible:"ca",val:"1"},maitrise:{t:"maitrise",cible:"comp:medecine",niveau:1},ressource:{t:"ressource",nom:"",max:"1",recharge:"long"},reserve:{t:"reserve",nom:"",des:"niv+1",face:6,recharge:"long"},attaque:{t:"attaque",nom:"",carac:"sort",des:"1d8",type:""},sorts:{t:"sorts",noms:""}}[ty];
      arr.push(base); touch(t.dataset.id); render(); break; }
    case "effRm": { const d=S.docs[t.dataset.id]; getPath(d,t.dataset.path).splice(+t.dataset.i,1); touch(t.dataset.id); render(); break; }
    case "spellAll": S.pending.all=t.checked; renderModal(); break;
  }
});
 
document.addEventListener("change",async e=>{
  if(e.target.id!=="portrait-file") return;
  const file=e.target.files?.[0], id=e.target.dataset.id||S.cur;
  if(!file||!id) return;
  if((file.type&&!file.type.startsWith("image/"))||file.size>15*1024*1024){ setBanner("Choisis une image (JPG, PNG ou WebP) de moins de 15 Mo."); return; }
  try{
    const data=await new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=reject; reader.readAsDataURL(file); });
    const img=await new Promise((resolve,reject)=>{ const image=new Image(); image.onload=()=>resolve(image); image.onerror=reject; image.src=data; });
    // Portrait léger : une fiche en ligne est limitée à 256 Ko, on vise moins de 60 Ko pour l'image.
    let portrait="";
    for(const [px,q] of [[320,.85],[320,.7],[256,.6],[192,.5]]){
      const scale=Math.min(1,px/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement("canvas"); canvas.width=Math.max(1,Math.round(img.naturalWidth*scale)); canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
      portrait=canvas.toDataURL("image/webp",q); if(!portrait.startsWith("data:image/webp")) portrait=canvas.toDataURL("image/jpeg",q); // Safari n'encode pas le WebP
      if(portrait.length<60000) break; }
    if(!S.docs[id]) return;
    S.docs[id].portrait=portrait; touch(id);
    if(S.cur===id) render();
  }catch(err){ setBanner("Cette image n’a pas pu être lue. Essaie une image JPG ou PNG (les photos HEIC de l'iPhone ne passent pas toujours)."); }
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(virtualDiceEnabled()&&t.matches(DICE_INPUTS)) return;
  if(t.id==="catk"&&S.catPick){ S.catPick.k=t.value; const l=document.getElementById("catlist"); if(l) l.innerHTML=catPickList(); return; }
  if(t.tagName==="SELECT"&&String(t.value).startsWith("cat:")&&t.id!=="addFeatSel"){ const lab=(t.selectedOptions[0]||{}).textContent||""; const r=catRes(t.value); if(r){ const o=document.createElement("option"); o.value=r; o.textContent=lab; t.appendChild(o); t.value=r; } }
  if(t.dataset&&t.dataset.w&&S.W){ let v=t.value; const k=t.dataset.w;
    if(k.startsWith("dice.")&&v!==""){ v=String(Math.max(3,Math.min(18,Math.round(+v)||3))); }
    if(k==="level") v=String(Math.max(1,Math.min(20,Math.round(+v)||1)));
    if(k.startsWith("nh.")&&!S.W.nh) return;
    setPath(S.W,k,v); if(t.tagName==="SELECT"||k.startsWith("dice.")||k==="level") render(); return; }
  if(t.id==="cc-dmg"&&S.T&&S.T.cc){ S.T.cc.dmg=Math.max(0,+t.value||0); render(); return; }
  if(t.dataset.arcsel){ const ch=cur(); if(ch){ ch.arcanum=ch.arcanum||{}; if(t.value) ch.arcanum[t.dataset.arcsel]=t.value; else delete ch.arcanum[t.dataset.arcsel]; touch(S.cur); render(); } return; }
  if(t.dataset.lu&&S.pending&&S.pending.type==="lvl"){ const P=S.pending,k=t.dataset.lu; if(t.dataset.i!==undefined){ P[k]=P[k]||[]; P[k][+t.dataset.i]=t.value; } else P[k]=t.value; renderModal(); return; }
  if(t.id==="importFile"&&t.files&&t.files[0]){ const file=t.files[0]; if(file.size>20*1024*1024){ setBanner("Ce fichier dépasse 20 Mo et ne peut pas être importé."); t.value=""; return; } const fr=new FileReader(); fr.onload=()=>{ try{ const id=importPack(JSON.parse(fr.result)); S.cur=null; S.view="list"; render(); window.scrollTo(0,0); setBanner((S.docs[id].name||"Personnage")+" importé : il est dans ta liste de personnages."); }catch(err){ setBanner(err&&err.message==="version"?`Cet export utilise le format ${err.dataVersion}, plus récent que celui accepté par cette application. Mets l'application à jour avant de l'importer.`:err&&err.message==="import_invalid"?`Import refusé : ${err.detail}`:"Ce fichier JSON est illisible ou n'est pas un export du Registre."); } }; fr.onerror=()=>setBanner("Le fichier n'a pas pu être lu."); fr.readAsText(file); return; }
  if(t.dataset.actChange==="hbFilter"){ S.hbFilter=t.value; render(); return; }
  if(t.dataset.actChange==="invsel"){ S.invSel=t.value; render(); return; }
  if(t.dataset.invfix!==undefined&&t.value){ const ch=cur(); const i=+t.dataset.invfix; if(ch.invocations&&ch.invocations[i]){ ch.invocations[i]=invId(ch.invocations[i])+"|"+t.value; touch(S.cur); render(); } return; }
  if(t.id==="hp-set"){ if(t.value.trim()===""||!Number.isFinite(+t.value)){ S.hpEdit=false; render(); return; } /* garde-fou : champ vidé = on annule, les PV ne passent pas à 0 */ const ch=cur(); const D=derive(ch); ch.hp=ch.hp||{cur:0,temp:0}; const before=+ch.hp.cur||0; ch.hp.cur=Math.max(0,Math.min(D.hpMax,+t.value||0)); if(before<=0&&ch.hp.cur>0) ch.death={s:0,f:0}; S.hpEdit=false; touch(S.cur); render(); return; }
  if(t.dataset.actChange==="tcost"){ const ch=cur(); ch.costs=ch.costs||{}; ch.costs[t.dataset.k]=t.value; S.unlockCost=false; touch(S.cur); render(); return; }
  if(t.dataset.btitle){ const ch=cur(); if(ch){ const id=t.dataset.btitle; ch.layout=Object.assign({},ch.layout,{titles:Object.assign({},ch.layout?.titles,{[id]:t.value.trim().slice(0,40)})}); touch(S.cur); render(); } return; }
  if(t.dataset.cname){ const ch=cur(); if(ch){ const list=customCopy(ch), b=list.find(x=>x.id===t.dataset.cname); if(b){ b.name=t.value.trim().slice(0,40); saveCustom(ch,list); render(); } } return; }
  if(t.dataset.comp==="name"){ const ch=cur(); if(ch){ ch.companion=Object.assign({ac:10,hp:{cur:10,max:10}},ch.companion,{name:t.value.trim().slice(0,40)}); touch(S.cur); render(); } return; }
  if(t.dataset.pvset){ const ch=cur(); if(ch&&t.value!==""){ const D=derive(ch), v=Math.floor(+t.value||0);
      if(t.dataset.pvset==="temp"){ ch.hp=ch.hp||{cur:D.hpMax,temp:0}; ch.hp.temp=Math.max(0,Math.min(999,v)); touch(S.cur); } else hpMaxAdd(ch,Math.max(-999,Math.min(999,v))-D.hpBonus); render(); } return; }
  if(t.dataset.actChange==="tslot"){ S.T.slot=+t.value; render(); return; }
  if(t.dataset.actChange==="compType"){ S.comp.type=t.value; render(); return; }
  // Une seule validation : un jet physique complet (pavé validé ou saisie terminée) est enregistré et compte pour le tour.
  if(t.dataset.tin&&S.T){ if(virtualDiceEnabled()) return; const T=S.T, kind=t.dataset.tin==="dmg"?"dmg":"d20";
    if(T.pop==="qroll"&&t.dataset.tin==="d1"&&T.mode!=="n"&&validDie(T.d1,20)&&!validDie(T.d2,20)){ render(); const d2=document.getElementById("t-d2"); if(d2) d2.focus(); return; }
    if(kind==="d20"?(!validDie(T.d1,20)||(T.mode!=="n"&&!validDie(T.d2,20))):(!validDiceTotal(T.dmg)||!dmgInRange(T.dmg))) return;
    if(ensureTableRollUse()&&(kind==="d20"?logD20(true):logDmg(true))) tableRollCommitted(kind);
    render(); return; }
  if(!t.dataset.bind) return;
  let v = t.type==="checkbox"?t.checked:t.value;
  if("num" in t.dataset) v = v===""?0:+v;
  if(t.dataset.hb){ const d=S.docs[t.dataset.hb]; if(!d) return; setPath(d,t.dataset.bind,v); touch(t.dataset.hb); softRender(); return; }
  if(t.dataset.bag){ const ch=cur(); const b=(ch.bag||[]).find(x=>x.id===t.dataset.bag); if(!b) return; b[t.dataset.bind]=v; touch(S.cur); softRender(); return; }
  if(t.dataset.cnt){ const ch=cur(); const c=(ch.counters||[]).find(x=>x.id===t.dataset.cnt); if(!c) return; c[t.dataset.bind]=Math.max(0,v); touch(S.cur); softRender(); return; }
  if(t.dataset.att){ const ch=cur(); const a=(ch.attacks||[]).find(x=>x.id===t.dataset.att); if(!a) return; setPath(a,t.dataset.bind,v); if(t.dataset.bind==="weapon"&&!a.name){ const w=srd("weapons",v)||hb(v); if(w) a.name=w.name; } touch(S.cur); render(); return; }
  const ch=cur(); if(!ch) return;
  // Garde-fous : niveau de 1 à 20, pièces entières et positives
  if(t.dataset.bind==="level"){ v=Math.max(1,Math.min(20,Math.round(+v||1))); t.value=v; }
  if(/^gold\./.test(t.dataset.bind)){ v=Math.max(0,Math.min(1e9,Math.floor(+v||0))); t.value=v; }
  setPath(ch,t.dataset.bind,v);
  if(t.dataset.bind==="classId") ch.subclass="";
  touch(S.cur); if(t.tagName==="SELECT"||t.type==="checkbox") render(); else softRender();
});
document.addEventListener("toggle",e=>{ const d=e.target; if(d&&d.dataset&&S.T){ if(d.dataset.actToggle==="skills") S.T.skillsOpen=d.open; if(d.dataset.actToggle==="saves") S.T.savesOpen=d.open; if(d.dataset.actToggle==="card") S.T.cardOpen=d.open; if(d.dataset.actToggle==="notes") S.T.notesOpen=d.open; if(d.dataset.actToggle==="cond") S.T.condOpen=d.open; if(d.dataset.actToggle==="inv") S.T.invOpen=d.open; } },true);
document.addEventListener("focusout",e=>{ if(e.target&&e.target.id==="hp-set"&&S.hpEdit){ S.hpEdit=false; setTimeout(render,0); } });
let numTimer=null;
document.addEventListener("input",e=>{
  if(e.target&&(e.target.id==="catq")&&S.catPick){ S.catPick.q=e.target.value; const l=document.getElementById("catlist"); if(l) l.innerHTML=catPickList(); return; }
  const t=e.target;
  if(virtualDiceEnabled()&&t.matches(DICE_INPUTS)) return;
  if(t.dataset&&t.dataset.w&&S.W&&t.tagName!=="SELECT"&&!t.dataset.w.startsWith("dice.")&&t.dataset.w!=="level"){ setPath(S.W,t.dataset.w,t.value); if(t.dataset.w==="name"){ const b=document.querySelector(".wprev b"); if(b) b.textContent=t.value||"Nouveau personnage"; } return; }
  if(t.dataset&&t.dataset.bind&&t.type==="number"&&!t.dataset.hb&&!t.dataset.bag&&!t.dataset.att&&!t.dataset.cnt&&t.value!==""&&t.id){
    const ch=cur(); if(ch){ let nv=+t.value; if(/^abilities\./.test(t.dataset.bind)){ nv=Math.max(1,Math.min(30,Math.round(nv)||1)); if(String(nv)!==t.value&&t.value.length>=2) t.value=nv; } setPath(ch,t.dataset.bind,nv); touch(S.cur); clearTimeout(numTimer); const id=t.id;
      numTimer=setTimeout(()=>{ const a=document.activeElement; const still=a&&a.id===id; render(); if(still){ const n=document.getElementById(id); if(n){ try{ n.focus({preventScroll:true}); }catch(e){} } } },450); }
    return; }
  if(!S.T) return;
  if(t.dataset.bind==="sessionNotes"){ const ch=cur(); if(ch){ ch.sessionNotes=t.value; touch(S.cur); } return; }
  if(t.id==="tq"){ S.T.q=t.value; S.T.qOpen=true; const r=document.getElementById("tres"); if(r){ r.innerHTML=tResults(); r.classList.remove("closed"); } const c=document.querySelector(".tqclear"); if(c) c.hidden=!t.value; return; }
  if(t.dataset.tin){ S.T[t.dataset.tin]=t.value; S.T.logSig=""; if(t.dataset.tin==="dmg") S.T.dmgBd=""; const tt=document.getElementById("t-tot"); if(tt) tt.innerHTML=totalHtml(+tt.dataset.mod);
    const dt=document.getElementById("t-dtot"); if(dt&&t.dataset.tin==="dmg"){ const f=+dt.dataset.flat; dt.innerHTML=damageTotalHtml(t.value,f); } }
});
document.addEventListener("submit",e=>{
  const f=e.target; e.preventDefault();
  if(virtualDiceEnabled()&&["cc","hdroll","death","smitePhysical","chargeRecovery"].includes(f.dataset.form)) return;
  if(f.dataset.form==="free"){
    const v=document.getElementById("freeExpr").value.trim();
    if(!/^(?:\d*d\d+|\d+)(?:\s*[+-]\s*(?:\d*d\d+|\d+))*$/i.test(v)) return;
    if(e.submitter?.name==="virtual"){
      if(!virtualDiceEnabled()) return;
      const r=rollExpr(v); addLog({label:"Jet libre "+v,total:r.total,bd:r.bd});
    }else{
      if(virtualDiceEnabled()) return;
      const value=f.elements.physical.value; if(!validDiceTotal(value)) return;
      const flat=expressionBonus(v);
      addLog({label:"Jet libre "+v,total:+value+flat,bd:"Dés physiques : "+value+" · Bonus : "+sg(flat)+" · Total : "+(+value+flat)});
      f.elements.physical.value="";
    }
    return;
  }
  if(f.dataset.form==="smitePhysical"){
    const value=f.elements.total.value; if(!validDiceTotal(value)) return;
    S.T.smiteBd="Dés physiques : "+value+" · Bonus : +0 · Total : "+value;
    addLog({label:"Frappe occulte · dégâts de force",total:+value,bd:S.T.smiteBd,quiet:true}); render(); return;
  }
  if(f.dataset.form==="chargeRecovery"){
    const value=f.elements.total.value; if(!validDiceTotal(value)) return;
    applyChargeRecovery(cur(),f.dataset.id,+value); render(); return;
  }
  if(f.dataset.form==="hpamt"){ const raw=(document.getElementById("hp-amt").value||"").trim(); if(!/^\d+$/.test(raw)||+raw<=0){ const er=document.getElementById("hp-amt-err"); if(er) er.textContent="Saisis un nombre entier supérieur à 0."; return; } hpApply(+raw); return; }
  if(f.dataset.form==="cc"){ const c=S.T.cc; if(!c||c.res) return; const a1=parseInt(document.getElementById("cc-d1").value), b1=c.mode==="n"?0:parseInt(document.getElementById("cc-d2")?.value); if(!(a1>=1&&a1<=20)) return; if(c.mode!=="n"&&!(b1>=1&&b1<=20)) return; ccResolve(a1,b1,false); return; }
  if(f.dataset.form==="hdroll"){ const ch=cur(), D=derive(ch); const r=parseInt(document.getElementById("t-hd").value); if(!(r>=1&&r<=D.hd)) return; hdSpend(ch,D,r,true); setTimeout(()=>{ const i=document.getElementById("t-hd"); if(i) i.focus(); },0); return; }
  if(f.dataset.form==="death"){ const ch=cur(); const r=parseInt(document.getElementById("t-death").value); if(!(r>=1&&r<=20)) return; ch.death=ch.death||{s:0,f:0}; ch.hp=ch.hp||{cur:0,temp:0};
    if(r===20){ ch.hp.cur=1; ch.death={s:0,f:0}; } else if(r===1) ch.death.f=Math.min(3,ch.death.f+2); else if(r>=10) ch.death.s=Math.min(3,ch.death.s+1); else ch.death.f=Math.min(3,ch.death.f+1);
    touch(S.cur); render(); return; }
  if(f.dataset.form==="bag"){ const ch=cur(); const n=document.getElementById("bag-new").value.trim(); const q=Math.max(1,+document.getElementById("bag-newq").value||1); if(ch&&n){ ensureBag(ch); ch.bag.push({id:uid(),name:n,qty:q,note:""}); touch(S.cur); render(); setTimeout(()=>document.getElementById("bag-new")?.focus(),0); } return; }
  if(f.dataset.form==="cnt"){ const ch=cur(), q=s=>f.querySelector(s); const n=(q(".cnt-name")?.value||"").trim().slice(0,60), mx=Math.min(999,Math.floor(+(q(".cnt-max")?.value)||0)), rc=q(".cnt-rec")?.value;
    if(ch&&n&&mx>0){ ch.counters=ch.counters||[]; const c={id:uid(),name:n,cur:mx,max:mx}; if(rc==="court"||rc==="long") c.recharge=rc; ch.counters.push(c); touch(S.cur); render(); } else if(ch) setBanner("Donne un nom et un maximum (au moins 1) au compteur."); }
  if(f.dataset.form==="tq"){ const r=searchItems(S.Titems||[],S.T.q); if(r[0]){ const row=document.querySelector('#tres .trow.first[data-act="tqroll"]'); if(row){ qMenuOpen(row); return; } S.T.q=""; tSelect(r[0].key); } return; } // Entrée sur un jet : le mini-menu, comme au toucher
  if(f.dataset.form==="comp"){ S.comp.q=document.getElementById("compQ").value; render(); }
  if(f.dataset.form==="spellq"){ S.pending.q=document.getElementById("spellQ").value; renderModal(); }
});
new MutationObserver(()=>{ if(document.getElementById("dice")&&!document.getElementById("dice").childElementCount) renderDice(); }).observe(document.getElementById("app"),{childList:true});
 
boot();

// Champs de dés (dés physiques) : Entrée valide la case ; pas de flèches (↑/↓ enregistreraient un faux jet) ; valeur hors limites refusée avec un message.
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.matches&&e.target.matches('input[data-pvset]')){ e.preventDefault(); e.target.dispatchEvent(new Event('change',{bubbles:true})); return; }
  if(!e.target.matches||!e.target.matches(DICE_INPUTS)) return;
  if(e.key==='ArrowUp'||e.key==='ArrowDown'){ e.preventDefault(); return; }
  if(e.key==='Enter'&&!e.target.closest('form')){ e.preventDefault(); e.target.dispatchEvent(new Event('change',{bubbles:true})); }
},true);
document.addEventListener('change',e=>{ const t=e.target; if(!t.matches||!t.matches(DICE_INPUTS)||virtualDiceEnabled()) return; const m=diceFieldError(t); showDiceErr(t,m); if(m) e.stopImmediatePropagation(); },true);
document.addEventListener('submit',e=>{ const f=e.target; if(!f.querySelectorAll||virtualDiceEnabled()) return; let bad=false; f.querySelectorAll(DICE_INPUTS).forEach(i=>{ const m=diceFieldError(i); showDiceErr(i,m); if(m) bad=true; }); if(bad){ e.preventDefault(); e.stopImmediatePropagation(); } },true);

// Molette sur un champ de dés : la page défile, la valeur ne change pas.
document.addEventListener('wheel',e=>{ if(e.target.matches?.(DICE_INPUTS)&&document.activeElement===e.target) e.target.blur(); },{passive:true});

/* ---------- « À la table » : glisser un bloc par sa poignée (mode disposition seulement) ---------- */
/* Copie semi-transparente qui suit le doigt ou la souris pendant un glisser (blocs, équipement). */
function dragGhost(el,cls){ const r=el.getBoundingClientRect(), g=document.createElement("div"), c=el.cloneNode(true);
  [c,...c.querySelectorAll("*")].forEach(n=>{ n.removeAttribute("id"); n.removeAttribute("name"); n.removeAttribute("for"); [...n.attributes].filter(a=>a.name.startsWith("data-")).forEach(a=>n.removeAttribute(a.name)); });
  c.classList.remove("dragging","blkph","eqsrc","eqok","eqno","eqover"); c.style.cssText="position:static;inset:auto;transform:none;width:100%;height:100%;margin:0;box-sizing:border-box";
  g.className="dragghost "+(cls||""); g.setAttribute("aria-hidden","true"); g.style.width=r.width+"px"; g.style.height=r.height+"px"; g.appendChild(c); document.body.appendChild(g); return {g,r}; }
let BLKD=null, BLKP=null;
const LONG_PRESS_MS=350; // appui long avant tout glisser au doigt (blocs, tuiles, équipement)
/* Placement libre (lot B) : le bloc suit le doigt ; sa colonne s'aimante sur la grille de 4, sa hauteur sur les voisins (aimant activable).
   Au lâcher, on enregistre une relation (« sous tel bloc », « même hauteur », « rangée 2 »…) plutôt que des pixels. */
const SNAP=22;
function blkDeps(ch,id){ const pos=ch.layout?.pos||{}, out=new Set([id]); let more=true; while(more){ more=false; for(const k in pos) if(!out.has(k)&&out.has(pos[k]?.a)){ out.add(k); more=true; } } return out; }
function blkSnap(ch,id,c,y,cache){ const L=S.TL, me=L.list.find(b=>b.id===id), g=(cache&&cache.g)||L.g, BAND=TL.BAND, M=TL.M, GAP=tlGapV(ch), TH=TH_PX(), dep=cache&&cache.g?new Set([id]):blkDeps(ch,id);
  // Les positions possibles ne dépendent que de la colonne : calculées une fois par colonne pendant un glisser
  let cands=cache&&cache[c];
  if(!cands){ cands=[{y:0,rel:{t:"top",px:0},lab:"en haut"}];
  for(const o of L.list){ if(dep.has(o.id)||!g[o.id]) continue; const oy=g[o.id].y, oc=g[o.id].c, ov=c<oc+o.w&&oc<c+me.w, nm=blkLabel(ch,o.id);
    if(ov){ cands.push({y:oy+o.h+GAP,rel:{t:"below",a:o.id,px:0},lab:"sous « "+nm+" »"}, {y:oy+o.h+GAP+TL.VGAP,rel:{t:"below",a:o.id,px:TL.VGAP},lab:"sous « "+nm+" », espacé"}); continue; }
    cands.push({y:oy,rel:{t:"same",a:o.id,px:0},lab:"même hauteur que « "+nm+" »"},{y:oy+BAND,rel:{t:"same",a:o.id,px:BAND},lab:"décalé d’une bande de titre"},{y:oy+o.h-me.h,rel:{t:"bottom",a:o.id},lab:"même bas que « "+nm+" »"});
    const rows=document.querySelector(`.tblocks.tfree>[data-blk="${o.id}"] .rtile`)?Math.round((o.h-BAND-M-1+TL.G)/(TH+TL.G)):0;
    for(let k=1;k<rows;k++) cands.push({y:oy+k*(TH+TL.G),rel:{t:"row",a:o.id,k},lab:"rangée "+(k+1)+" de « "+nm+" »"}); }
  if(cache) cache[c]=cands; }
  if(ch.layout?.mag!==false){ let best=null; for(const k of cands){ const d=Math.abs(k.y-y); if((cache||d<=SNAP)&&(!best||d<best.d)) best=Object.assign({d},k); } if(best) return best; } // pendant un glisser, Aimant : toujours la position la plus proche (plus d'écart libre)
  // Sans aimant : sous le bloc le plus bas qui le précède dans ses colonnes, avec l'écart choisi
  let a=null, ab=0; for(const o of L.list){ if(dep.has(o.id)||!g[o.id]) continue; const oc=g[o.id].c, b=g[o.id].y+o.h+GAP; if(c<oc+o.w&&oc<c+me.w&&b<=y+1&&b>=ab){ a=o.id; ab=b; } }
  y=Math.max(0,Math.round(y)); return {y,rel:a?{t:"below",a,px:y-ab}:{t:"top",px:y},lab:""}; }
/* Retirer un bloc de sa pile : les blocs accrochés à lui prennent sa relation (ils remontent à sa place). */
function blkDetach(pos,bid){ const o=pos[bid]||{t:"top",px:0};
  for(const x in pos){ const p=pos[x]; if(x===bid||!p||p.a!==bid) continue; const n={c:p.c,t:o.t,px:+o.px||0}; if(o.a) n.a=o.a; if(o.t==="row") n.k=o.k; if(o.t==="bottom") delete n.px; pos[x]=n; }
  delete pos[bid]; return pos; }
/* Poser un bloc : sous A (ou en haut), les blocs qui étaient juste sous A dans ses colonnes passent sous lui (insertion entre deux blocs). */
function blkInsert(pos,bid,drop,w){ const r=drop.rel; pos[bid]=Object.assign({c:drop.c},r); if(r.t!=="below"&&r.t!=="top") return pos;
  const L=S.TL, c0=drop.c, c1=drop.c+w;
  for(const x in pos){ const p=pos[x], b=L&&L.list.find(o=>o.id===x); if(x===bid||!p||!b) continue; const xc=+p.c||0; if(!(xc<c1&&c0<xc+b.w)) continue;
    if(r.t==="below"?(p.t==="below"&&p.a===r.a):(p.t==="top"&&(+p.px||0)<=1)) pos[x]={c:p.c,t:"below",a:bid,px:r.t==="below"?(+p.px||0):0}; }
  return pos; }
/* Avant le premier déplacement, les blocs encore rangés « dans l'ordre » reçoivent leur relation, pour que rien d'autre ne bouge. */
function blkFreeze(ch){ const L=S.TL, pos=Object.assign({},ch.layout?.pos), order=tableOrder(ch).filter(id=>L.g[id]);
  for(const id of [...order].sort((a,b)=>L.g[a].y-L.g[b].y)){ if(pos[id]) continue; const me=L.list.find(b=>b.id===id), c=L.g[id].c, y=L.g[id].y; let a=null, ab=0;
    for(const o of L.list){ if(o.id===id||!L.g[o.id]||!pos[o.id]) continue; const oc=L.g[o.id].c, b=L.g[o.id].y+o.h+tlGapV(ch); if(c<oc+o.w&&oc<c+me.w&&b<=y+1&&b>=ab){ a=o.id; ab=b; } }
    pos[id]=a?{c,t:"below",a,px:Math.max(0,y-ab)}:{c,t:"top",px:y}; }
  return pos; }
function blkPlace(){ if(!BLKD||!S.TL) return; const ch=cur(), box=BLKD.el.parentElement; if(!ch||!box) return;
  const r=box.getBoundingClientRect(), L=S.TL, me=L.list.find(b=>b.id===BLKD.bid), x=BLKD.x-r.left-BLKD.dx, y=BLKD.y-r.top-BLKD.dy;
  const c=Math.max(0,Math.min(4-me.w,Math.round(x/(L.CW+TL.FG)))), s=blkSnap(ch,BLKD.bid,c,y,BLKD.cache); BLKD.drop={c,y:s.y,rel:s.rel};
  // Aperçu : les autres blocs s'écartent en direct pour montrer la place (recalculé seulement quand la cible change)
  const pk=c+"|"+JSON.stringify(s.rel); if(pk!==BLKD.pk){ BLKD.pk=pk; const pos=blkInsert(JSON.parse(JSON.stringify(BLKD.posB)),BLKD.bid,{c,rel:s.rel},me.w), g2=tableGeom({layout:Object.assign({},ch.layout,{pos})},L.list,tableOrder(ch)); let bot=0;
    for(const el of box.querySelectorAll(":scope > .tblk")){ const p=g2[el.dataset.blk]; if(!p) continue; if(el!==BLKD.el){ el.style.top=p.y+"px"; el.style.left=(p.c*(L.CW+TL.FG))+"px"; } bot=Math.max(bot,p.y+el.offsetHeight); }
    BLKD.py=g2[BLKD.bid]?g2[BLKD.bid].y:s.y; box.style.height=(bot+120)+"px"; }
  BLKD.drop.y=BLKD.py;
  const gh=BLKD.ph; gh.style.left=(c*(L.CW+TL.FG))+"px"; gh.style.top=BLKD.py+"px"; gh.style.width=BLKD.el.offsetWidth+"px"; gh.style.height=me.h+"px";
  BLKD.guide.style.top=BLKD.py+"px"; BLKD.guide.style.display=s.lab?"":"none"; BLKD.guide.firstChild.textContent=s.lab; }
function blkGhostAt(){ if(BLKD&&BLKD.ghost){ BLKD.ghost.style.left=(BLKD.x-BLKD.dx)+"px"; BLKD.ghost.style.top=(BLKD.y-BLKD.dy)+"px"; } }
const BLK_ZONE=100, BLK_VMAX=3000; // zone de défilement près des bords (px) ; vitesse au bord (px par seconde)
function blkLoop(ts){ if(!BLKD) return; // défilement automatique près des bords, même sans bouger ; un seul placement par image
  const dt=BLKD.t?Math.min(50,ts-BLKD.t):16; BLKD.t=ts;
  const top=(document.querySelector(".tlayouttop")?.getBoundingClientRect().bottom||0)+BLK_ZONE, bot=innerHeight-BLK_ZONE;
  const k=BLKD.y<top?-Math.min(1,(top-BLKD.y)/BLK_ZONE):BLKD.y>bot?Math.min(1,(BLKD.y-bot)/BLK_ZONE):0;
  if(k){ BLKD.acc+=BLK_VMAX*k*Math.abs(k)*dt/1000; const s=Math.trunc(BLKD.acc); if(s){ BLKD.acc-=s; window.scrollBy(0,s); } } else BLKD.acc=0;
  if(scrollY!==BLKD.sy){ BLKD.sy=scrollY; BLKD.dirty=true; }
  if(BLKD.dirty){ BLKD.dirty=false; blkPlace(); }
  BLKD.raf=requestAnimationFrame(blkLoop); }
document.addEventListener("pointerdown",e=>{
  // Tout le bloc sert de poignée (son contenu est inactif en édition), sauf le crayon et le ✕. Au doigt : appui long, un glissement rapide fait défiler.
  if(!S.layoutEdit||!e.target.closest||(e.pointerType==="mouse"&&e.button!==0)) return;
  const g=e.target.closest("[data-blkgrip]")||(!e.target.closest(".tedpen,.tdel")?e.target.closest(".tblocks.editing > .tblk"):null); if(!g) return;
  const el=g.closest(".tblk"); if(!el) return;
  if(e.pointerType!=="mouse"){ // au doigt : appui long sur le bloc, sinon la page défile
    BLKP={el,g,id:e.pointerId,x:e.clientX,y:e.clientY,timer:setTimeout(()=>{ const P=BLKP; BLKP=null; if(P) blkStart(P.el,P.g,P.id,P.x,P.y); },LONG_PRESS_MS)}; return; }
  e.preventDefault(); blkStart(el,g,e.pointerId,e.clientX,e.clientY);
});
function blkStart(el,g,pid,x,y){ if(!el.isConnected||!S.TL) return; const box=el.parentElement;
  const {g:ghost,r}=dragGhost(el,"blkghost"), ph=document.createElement("div"), guide=document.createElement("div");
  ph.className="tlghost"; guide.className="tlguide"; guide.innerHTML="<span></span>"; box.append(ph,guide);
  const ch0=cur(), bid0=el.dataset.blk, posB=blkDetach(blkFreeze(ch0),bid0), gB=tableGeom({layout:Object.assign({},ch0.layout,{pos:posB})},S.TL.list.filter(b=>b.id!==bid0),tableOrder(ch0));
  BLKD={el,bid:bid0,id:pid,ghost,ph,guide,x,y,dx:x-r.left,dy:y-r.top,cache:{g:gB},posB,pk:"",sy:scrollY,acc:0,t:0,dirty:false};
  blkGhostAt(); el.classList.add("dragging"); document.body.classList.add("blkdragging");
  try{ g.setPointerCapture(pid); }catch(err){}
  blkPlace(); BLKD.raf=requestAnimationFrame(blkLoop); }
document.addEventListener("pointermove",e=>{ if(BLKP&&e.pointerId===BLKP.id&&Math.hypot(e.clientX-BLKP.x,e.clientY-BLKP.y)>8){ clearTimeout(BLKP.timer); BLKP=null; } });
["pointerup","pointercancel"].forEach(t=>document.addEventListener(t,e=>{ if(BLKP&&e.pointerId===BLKP.id){ clearTimeout(BLKP.timer); BLKP=null; } }));
document.addEventListener("touchmove",e=>{ if(BLKD) e.preventDefault(); },{passive:false});
document.addEventListener("pointermove",e=>{
  if(!BLKD||e.pointerId!==BLKD.id) return; e.preventDefault();
  BLKD.x=e.clientX; BLKD.y=e.clientY; blkGhostAt(); BLKD.dirty=true; // le placement attend la prochaine image
});
function blkDragEnd(e){ if(!BLKD||e.pointerId!==BLKD.id) return; if(BLKD.dirty){ BLKD.dirty=false; blkPlace(); } const D0=BLKD; BLKD=null;
  cancelAnimationFrame(D0.raf); D0.ghost.remove(); D0.ph.remove(); D0.guide.remove(); D0.el.classList.remove("dragging"); document.body.classList.remove("blkdragging");
  const ch=cur(); if(ch&&D0.drop){ const me=S.TL.list.find(b=>b.id===D0.bid), pos=blkInsert(blkDetach(blkFreeze(ch),D0.bid),D0.bid,D0.drop,me?me.w:4);
    // À hauteur égale, le bloc posé passe devant : il remonte dans l'ordre avant le premier bloc qui n'est pas plus haut que lui (tient après rechargement)
    const g=S.TL.g, o=tableOrder(ch).filter(id=>id!==D0.bid), k=o.findIndex(id=>g[id]&&g[id].y>=D0.drop.y-1); o.splice(k<0?o.length:k,0,D0.bid);
    ch.layout=Object.assign({},ch.layout,{pos,order:o}); touch(S.cur); }
  render(); }
document.addEventListener("pointerup",blkDragEnd);
document.addEventListener("pointercancel",blkDragEnd);

/* ---------- Personnaliser : glisser les tuiles (réserve → case, case → case, case → hors du bloc) ; départ dès que le doigt bouge ---------- */
let TDG=null, tdgEnd=0;
/* Case (ligne, colonne) d'une grille sous le pointeur, d'après ses pistes (une tuile de 2×2 peut ainsi glisser d'une case). */
function gridCellAt(g,x,y){ const cs=getComputedStyle(g), b=g.getBoundingClientRect(), R=+g.dataset.r, C=+g.dataset.c;
  if(x<b.left||x>b.right||y<b.top||y>b.bottom) return null;
  const pick=(sizes,gap,v)=>{ let k=0; for(;k<sizes.length-1&&v>sizes[k]+gap/2;k++) v-=sizes[k]+gap; return k; };
  const rows=cs.gridTemplateRows.split(" ").map(parseFloat), cols=cs.gridTemplateColumns.split(" ").map(parseFloat);
  return {r:Math.min(R-1,pick(rows,parseFloat(cs.rowGap)||0,y-b.top)),c:Math.min(C-1,pick(cols,parseFloat(cs.columnGap)||0,x-b.left))}; }
function tdgTarget(x,y){ const t=document.elementFromPoint(x,y); if(!t||!t.closest(".tpop")) return {out:true};
  const c=t.closest("[data-tslot]"); if(c) return {slot:+c.dataset.tslot,el:c}; const r=t.closest("[data-tres]"); return r?{res:true,el:r}:{out:true}; }
function tdgMove(x,y){ if(!TDG) return; const g=TDG.ghost; if(g){ g.style.left=(TDG.touch?x-TDG.gw/2:x-TDG.dx)+"px"; g.style.top=(TDG.touch?y-TDG.gh-14:y-TDG.dy)+"px"; }
  document.querySelectorAll(".tover").forEach(e=>e.classList.remove("tover")); const d=tdgTarget(x,y);
  if(d.el&&(d.slot!==undefined||TDG.cell!==undefined)) d.el.classList.add("tover"); }
function tdgStop(drop){ const D0=TDG; TDG=null; if(!D0||!D0.active) return; tdgEnd=Date.now();
  D0.ghost.remove(); document.body.classList.remove("tdragging"); document.querySelectorAll(".tover,.tdsrc").forEach(e=>e.classList.remove("tover","tdsrc"));
  const ch=cur(); if(!drop||!ch) { render(); return; }
  if(D0.cblk){ const g=document.querySelector(`.tpop [data-cgrid="${D0.cblk}"]`), cell=g&&gridCellAt(g,drop.x,drop.y), d=tdgTarget(drop.x,drop.y), src=D0.ctile!==undefined?{i:D0.ctile}:{id:D0.id};
    if(cell){ if(!cUpdate(ch,D0.cblk,b=>cMove(b,src,cell))) setBanner("Pas la place ici."); }
    else if(D0.ctile!==undefined&&(d.res||d.out)) cUpdate(ch,D0.cblk,b=>{ const l=cGrid(b).tiles; l.splice(D0.ctile,1); return l; });
    S.T.ctile=null; S.T.tileSlot=null; render(); return; }
  const d=tdgTarget(drop.x,drop.y), arr=blockTiles(ch,D0.blk);
  if(d.slot!==undefined){ if(D0.cell!==undefined){ if(d.slot!==D0.cell) [arr[d.slot],arr[D0.cell]]=[arr[D0.cell],arr[d.slot]]; } else arr[d.slot]=D0.id; }
  else if(D0.cell!==undefined) arr[D0.cell]=""; else { render(); return; }
  setBlockTiles(ch,D0.blk,arr); S.T.tileSlot=null; render(); }
document.addEventListener("pointerdown",e=>{
  tdgEnd=0; // un nouvel appui est un vrai toucher : ne plus bloquer le clic
  const el=e.target.closest&&e.target.closest(".tpop [data-tdrag]"); if(!el||(e.pointerType==="mouse"&&e.button!==0)) return;
  if(e.pointerType!=="mouse"){ // au doigt : appui long (la fenêtre doit pouvoir défiler)
    const startT=e; TDG={el,blk:el.dataset.blk,cblk:el.dataset.cblk,ctile:el.dataset.tdrag==="ctile"?+el.dataset.i:undefined,cell:el.dataset.tdrag==="cell"||el.dataset.tdrag==="ctile"?+el.dataset.i:undefined,id:el.dataset.tdrag==="cres"?el.dataset.t:el.dataset.v,x0:e.clientX,y0:e.clientY,touch:true,pid:e.pointerId,active:false,armed:false};
    TDG.timer=setTimeout(()=>{ if(TDG&&!TDG.active){ TDG.armed=true; tdgStart(TDG.x0,TDG.y0); } },LONG_PRESS_MS); return; }
  TDG={el,blk:el.dataset.blk,cblk:el.dataset.cblk,ctile:el.dataset.tdrag==="ctile"?+el.dataset.i:undefined,cell:el.dataset.tdrag==="cell"||el.dataset.tdrag==="ctile"?+el.dataset.i:undefined,id:el.dataset.tdrag==="cres"?el.dataset.t:el.dataset.v,x0:e.clientX,y0:e.clientY,touch:e.pointerType!=="mouse",pid:e.pointerId,active:false};
});
function tdgStart(x,y){ const {g,r}=dragGhost(TDG.el,"tghost"); Object.assign(TDG,{active:true,ghost:g,gw:r.width,gh:r.height,dx:TDG.x0-r.left,dy:TDG.y0-r.top}); TDG.el.classList.add("tdsrc"); document.body.classList.add("tdragging"); tdgMove(x,y); }
document.addEventListener("pointermove",e=>{ if(!TDG||e.pointerId!==TDG.pid) return;
  if(!TDG.active){ const far=Math.hypot(e.clientX-TDG.x0,e.clientY-TDG.y0);
    if(TDG.touch){ if(far>8){ clearTimeout(TDG.timer); TDG=null; } return; } // le doigt bouge avant l'appui long : c'est un défilement
    if(far<=6) return; tdgStart(e.clientX,e.clientY); return; }
  e.preventDefault(); tdgMove(e.clientX,e.clientY); });
document.addEventListener("touchmove",e=>{ if(TDG&&TDG.active) e.preventDefault(); },{passive:false});
document.addEventListener("pointerup",e=>{ if(TDG&&e.pointerId===TDG.pid){ clearTimeout(TDG.timer); if(TDG.active) tdgStop({x:e.clientX,y:e.clientY}); else TDG=null; } });
document.addEventListener("pointercancel",e=>{ if(TDG&&e.pointerId===TDG.pid){ clearTimeout(TDG.timer); if(TDG.active) tdgStop(null); else TDG=null; } });
document.addEventListener("click",e=>{ if(Date.now()-tdgEnd<400){ e.stopPropagation(); e.preventDefault(); } },true);

/* ---------- Équipement : glisser-déposer (souris ; au doigt, appui long puis glisser) ---------- */
let EQD=null, eqdEnd=0;
const eqdSrc=el=>el.dataset.v?{slot:el.dataset.v}:{bag:el.dataset.id};
const eqdDst=el=>el.dataset.eqdrop==="sac"?{sac:true}:{slot:el.dataset.v};
function eqdStart(){ const ch=cur(); if(!ch||!EQD) return; EQD.active=true; EQD.el.classList.add("eqsrc");
  const {g,r}=dragGhost(EQD.el,"eqghost"); EQD.ghost=g; EQD.gw=r.width; EQD.gh=r.height; EQD.dx=EQD.x0-r.left; EQD.dy=EQD.y0-r.top;
  document.querySelectorAll("[data-eqdrop]").forEach(t=>t.classList.add(eqMoveOk(ch,EQD.src,eqdDst(t))?"eqok":"eqno"));
  document.body.classList.add("eqdragging"); eqdMove(EQD.x,EQD.y); }
function eqdMove(x,y){ if(EQD&&EQD.ghost){ // au doigt, la copie passe au-dessus du doigt pour rester visible
    const gx=EQD.touch?x-EQD.gw/2:x-EQD.dx, gy=EQD.touch?y-EQD.gh-18:y-EQD.dy; EQD.ghost.style.left=gx+"px"; EQD.ghost.style.top=gy+"px"; }
  document.querySelectorAll(".eqover").forEach(e=>e.classList.remove("eqover"));
  const t=document.elementFromPoint(x,y), d=t&&t.closest("[data-eqdrop]"); if(d&&d.classList.contains("eqok")) d.classList.add("eqover"); }
function eqdStop(drop){ const D0=EQD; EQD=null; if(!D0) return; clearTimeout(D0.timer); if(!D0.active) return;
  eqdEnd=Date.now(); if(D0.ghost) D0.ghost.remove(); document.body.classList.remove("eqdragging");
  document.querySelectorAll(".eqok,.eqno,.eqover,.eqsrc").forEach(e=>e.classList.remove("eqok","eqno","eqover","eqsrc"));
  if(!drop) return; const t=document.elementFromPoint(drop.x,drop.y), d=t&&t.closest("[data-eqdrop]"), ch=cur();
  if(d&&ch&&eqMove(ch,D0.src,eqdDst(d))){ touch(S.cur); render(); } }
document.addEventListener("pointerdown",e=>{
  eqdEnd=0; // un nouvel appui est un vrai toucher : ne plus bloquer le clic
  const el=e.target.closest&&e.target.closest("[data-eqdrag]"); if(!el||(e.pointerType==="mouse"&&e.button!==0)) return;
  if(EQD) eqdStop(null);
  EQD={el,src:eqdSrc(el),name:el.dataset.name||el.textContent.trim(),x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,touch:e.pointerType!=="mouse",active:false,id:e.pointerId};
  if(EQD.touch) EQD.timer=setTimeout(()=>{ if(EQD&&!EQD.active) eqdStart(); },LONG_PRESS_MS);
});
document.addEventListener("pointermove",e=>{
  if(!EQD||e.pointerId!==EQD.id) return; EQD.x=e.clientX; EQD.y=e.clientY;
  const far=Math.hypot(e.clientX-EQD.x0,e.clientY-EQD.y0);
  if(!EQD.active){ if(EQD.touch){ if(far>8){ clearTimeout(EQD.timer); EQD=null; } return; } if(far<=6) return; eqdStart(); }
  e.preventDefault(); eqdMove(e.clientX,e.clientY);
});
document.addEventListener("pointerup",e=>{ if(EQD&&e.pointerId===EQD.id) eqdStop({x:e.clientX,y:e.clientY}); });
document.addEventListener("pointercancel",e=>{ if(EQD&&e.pointerId===EQD.id) eqdStop(null); });
document.addEventListener("touchmove",e=>{ if(EQD&&EQD.active) e.preventDefault(); },{passive:false});
document.addEventListener("contextmenu",e=>{ if(EQD) e.preventDefault(); });
// Le clic qui suit un glisser ne doit pas ouvrir la liste de l'emplacement.
document.addEventListener("click",e=>{ if(Date.now()-eqdEnd<400){ e.stopPropagation(); e.preventDefault(); } },true);
