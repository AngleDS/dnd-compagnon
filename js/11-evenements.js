/* ---------- events ---------- */
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
    case "layoutDone": S.layoutEdit=false; render(); break;
    case "layoutReset": if(ch){ ch.layout=Object.assign({},ch.layout); delete ch.layout.order; touch(S.cur); } render(); break;
    case "tilePick": { S.T.tileSlot=+t.dataset.i; S.T.pop="tiles:"+t.dataset.blk; render(); break; }
    case "tileAdd": if(ch){ const blk=t.dataset.blk, arr=blockTiles(ch,blk), i=Number.isInteger(S.T.tileSlot)&&arr[S.T.tileSlot]===""?S.T.tileSlot:arr.indexOf(""); if(i>=0){ arr[i]=t.dataset.v; setBlockTiles(ch,blk,arr); S.T.tileSlot=null; } render(); } break;
    case "tileDel": if(ch){ const arr=blockTiles(ch,t.dataset.blk); arr[+t.dataset.i]=""; setBlockTiles(ch,t.dataset.blk,arr); S.T.tileSlot=+t.dataset.i; render(); } break;
    case "tileMove": if(ch){ const arr=blockTiles(ch,t.dataset.blk), i=+t.dataset.i, j=i+(+t.dataset.d); if(j>=0&&j<arr.length){ [arr[i],arr[j]]=[arr[j],arr[i]]; setBlockTiles(ch,t.dataset.blk,arr); if(S.T.tileSlot===i) S.T.tileSlot=j; } render(); } break;
    case "tileReset": if(ch){ ch.layout=Object.assign({},ch.layout); ch.layout.tiles=Object.assign({},ch.layout.tiles); delete ch.layout.tiles[t.dataset.blk]; touch(S.cur); S.T.tileSlot=null; render(); } break;
    case "blkCreate": if(ch){ const list=customCopy(ch); if(list.length>=20) break; const id="c_"+Math.random().toString(36).slice(2,10);
      list.push({id,name:"Mon bloc "+(list.length+1),r:Math.min(4,Math.max(1,+t.dataset.r)),c:Math.min(4,Math.max(1,+t.dataset.c)),tiles:[]}); saveCustom(ch,list); saveTableOrder(ch,tableOrder(ch)); S.T.pop="tiles:"+id; render(); } break;
    case "ctileAdd": if(ch){ const list=customCopy(ch), b=list.find(x=>x.id===t.dataset.v); if(b&&customUsed(b)<b.r*b.c&&!b.tiles.some(x=>x.id===t.dataset.t)){ b.tiles.push({id:t.dataset.t,sz:"1"}); saveCustom(ch,list); } render(); } break;
    case "ctileDel": if(ch){ const list=customCopy(ch), b=list.find(x=>x.id===t.dataset.v); if(b){ b.tiles.splice(+t.dataset.i,1); saveCustom(ch,list); } render(); } break;
    case "ctileMove": if(ch){ const list=customCopy(ch), b=list.find(x=>x.id===t.dataset.v), i=+t.dataset.i, j=i+(+t.dataset.d); if(b&&j>=0&&j<b.tiles.length){ [b.tiles[i],b.tiles[j]]=[b.tiles[j],b.tiles[i]]; saveCustom(ch,list); } render(); } break;
    case "ctileSize": if(ch){ const list=customCopy(ch), b=list.find(x=>x.id===t.dataset.v), tl=b&&b.tiles[+t.dataset.i]; if(tl){ const old=tl.sz; tl.sz=t.dataset.z; if(customUsed(b)>b.r*b.c){ tl.sz=old; setBanner("Pas assez de place dans ce bloc pour agrandir la tuile."); } else saveCustom(ch,list); } render(); } break;
    case "cblkDel": S.T.cdel=t.dataset.v; render(); break;
    case "cblkDelNo": S.T.cdel=null; render(); break;
    case "cblkDelYes": if(ch){ saveCustom(ch,customCopy(ch).filter(b=>b.id!==t.dataset.v)); saveTableOrder(ch,tableOrder(ch)); S.T.cdel=null; S.T.pop=null; render(); } break;
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
    case "rest": applyRest(t.dataset.v); S.confirm=null; touch(S.cur); render(); break;
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
    case "hpdmg": case "hpheal": { const n=+document.getElementById("hp-delta").value||0; if(!n) break; const D=derive(ch); ch.hp=ch.hp||{cur:D.hpMax,temp:0};
      if(a==="hpdmg"){ let left=n; const tmp=+ch.hp.temp||0; const ab=Math.min(tmp,left); ch.hp.temp=tmp-ab; left-=ab; ch.hp.cur=Math.max(0,(+ch.hp.cur||0)-left);
        if(ch.conc) addLog({label:"Concentration : JS de Constitution",total:"DD "+Math.max(10,Math.floor(n/2)),bd:"Maintien de "+ch.conc+". Clique sur « JS Concentration ».",kind:"info"}); }
      else ch.hp.cur=Math.min(D.hpMax,(+ch.hp.cur||0)+n);
      if((+ch.hp.cur||0)>0&&ch.death&&(ch.death.s||ch.death.f)) ch.death={s:0,f:0};
      touch(S.cur); render(); break; }
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
    case "resuse": { const id=t.dataset.id, inp=document.getElementById("resn-"+id.replace(/[^a-z0-9]/g,"")); const n=+inp.value||0; if(!n) break; const D=derive(ch); const r=D.res.find(x=>x.id===id); ch.resUsed=ch.resUsed||{}; ch.resUsed[id]=Math.max(0,Math.min(r.max,(+ch.resUsed[id]||0)+n)); touch(S.cur); render(); break; }
    case "pool": { const id=t.dataset.id, D=derive(ch), r=D.res.find(x=>x.id===id); const inp=document.getElementById("pool-"+id.replace(/[^a-z0-9]/g,"")); let n=Math.max(1,+inp.value||1); const left=r.max-(+ch.resUsed?.[id]||0); n=Math.min(n,left,r.maxUse||n); if(n<=0) break; const rr=rollExpr(n+"d"+r.die); ch.resUsed=ch.resUsed||{}; ch.resUsed[id]=(+ch.resUsed[id]||0)+n; addLog({label:r.name+" ("+n+"d"+r.die+")",total:rr.total,bd:rr.bd}); touch(S.cur); render(); break; }
    case "rouerie": { const D=derive(ch); if(!D.cast||D.cast.type!=="pact") break; const used=+(ch.resUsed?.["cls:rouerie-magique"]||0); if(used>=1) break;
      const spent=+ch.pactUsed||0; if(spent<=0){ addLog({label:"Rouerie magique",total:"—",bd:"Aucun emplacement de pacte à récupérer : la Rouerie n'a pas été utilisée.",kind:"info"}); break; }
      const gain=D.L>=20?spent:Math.min(spent,Math.ceil(D.cast.pactSlots/2)); ch.pactUsed=spent-gain; ch.resUsed=ch.resUsed||{}; ch.resUsed["cls:rouerie-magique"]=1;
      addLog({label:"Rouerie magique",total:"+"+gain,bd:gain+" emplacement(s) de pacte récupéré(s). Utilisable à nouveau après un repos long.",kind:"info"}); touch(S.cur); render(); break; }
    case "tsel": tSelect(t.dataset.k); break;
    case "saveApp": saveApp(); break;
    case "hpmaxb": { const D=derive(ch), d=+t.dataset.v; ch.hpMaxBonus=(+ch.hpMaxBonus||0)+d; if(D.hpBase+ch.hpMaxBonus<1) ch.hpMaxBonus=1-D.hpBase; const real=ch.hpMaxBonus-D.hpBonus; ch.hp=ch.hp||{cur:D.hpMax,temp:0}; const D2=derive(ch); ch.hp.cur=Math.max(0,Math.min(D2.hpMax,(+ch.hp.cur||0)+(real>0?real:0))); touch(S.cur); render(); break; }
    case "hpask": S.pending={type:"hp",mode:t.dataset.v}; renderModal(); break;
    case "hpquick": hpApply(+t.dataset.v); break;
    case "chg": { const b=(ch.bag||[]).find(x=>x.id===t.dataset.id); if(!b) break; const c=Object.assign({},itemCharges(ch,b)); const i=+t.dataset.i, left=c.max-(+c.used||0);
      c.used = i<left ? c.max-i : c.max-(i+1); c.auto=false; b.charges=c; touch(S.cur); render(); break; }
    case "itemN": S.T.itemN=+t.dataset.v; render(); break;
    case "itemUse": if(performTableItemUse(t.dataset)) render(); break;
    case "chgUse": { const b=(ch.bag||[]).find(x=>x.id===t.dataset.id); if(!b) break; const c=Object.assign({},itemCharges(ch,b)); if((+c.used||0)>=c.max){ addLog({label:b.name,total:"0",bd:"Plus de charge.",kind:"info"}); break; } c.used=(+c.used||0)+1; c.auto=false; b.charges=c; addLog({label:b.name,total:(c.max-c.used)+"/"+c.max,bd:"1 charge dépensée.",kind:"info",quiet:true}); touch(S.cur); render(); break; }
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
    case "theme": setTheme(curTheme()==="dark"?"light":"dark"); render(); break;
    case "restOpen": S.T=S.T||{}; S.T.restKind=t.dataset.v||""; S.T.pop="rest"; render(); break;
    case "restKind": S.T.restKind=t.dataset.v; render(); break;
    case "restLong": applyRest("long"); S.T.pop=null; S.T.restKind=""; S.T.hdLast=""; touch(S.cur); render(); break;
    case "restShort": applyRest("court"); S.T.pop=null; S.T.hdLast=""; addLog({label:"Repos court",total:"✓",bd:"Emplacements et ressources de repos court récupérés.",kind:"info"}); touch(S.cur); render(); break;
    case "tpop": S.T.eqSlot=null; S.T.pop=t.dataset.v; S.histConfirm=false; S.hist=null; render(); if(t.dataset.v==="notes") setTimeout(()=>{ const n=document.getElementById("t-notes"); if(n){ n.focus(); n.setSelectionRange(n.value.length,n.value.length); } },0); break;
    case "tpopclose": if(e.target.closest("[data-act]")===t){ if(S.T.pop==="equip"&&S.T.eqSlot){ S.T.eqSlot=null; render(); break; } if(S.T.pop==="card") S.T.q=""; S.T.pop=null; render(); } break;
    case "noop": break;
    case "tqclear": { S.T.q=""; const q=document.getElementById("tq"); if(q){ q.value=""; q.focus(); } document.getElementById("tres").innerHTML=""; t.hidden=true; break; }
    case "tvroll": { if(!ensureTableRollUse()) break; const T=S.T; T.d1=String(rnd(20)); T.d2=T.mode!=="n"?String(rnd(20)):""; if(logD20(false)) tableRollCommitted("d20"); render(); break; }
    case "gdie": { S.T.gdie=+t.dataset.v; S.T.dmg=""; S.T.dmgBd=""; render(); break; }
    case "tempgain": { const D=derive(ch); ch.hp=ch.hp||{cur:D.hpMax,temp:0}; const v=+t.dataset.v||0, b0=+ch.hp.temp||0; ch.hp.temp=Math.max(b0,v); addLog({label:(t.dataset.n||"Sort")+" · PV temporaires",total:ch.hp.temp,bd:b0?"remplace "+b0+" PV temporaires":"",quiet:true}); touch(S.cur); render(); break; }
    case "hbGuessLink": { const d=S.docs[t.dataset.id]; if(!d) break; d.link=aideGuess(Object.assign({_id:t.dataset.id},d)); touch(t.dataset.id); render(); break; }
    case "tvdmg": { if(!ensureTableRollUse()) break; const T=S.T; const r=rollExpr(t.dataset.e,!!t.dataset.re1); T.dmg=String(r.total); T.dmgBd=(t.dataset.crit?"Critique · ":"")+r.bd; if(logDmg(false)) tableRollCommitted("dmg"); render(); break; }
    case "tclose": e.preventDefault(); S.T.sel=null; render(); break;
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
    case "thp": { const n=+document.getElementById("t-hp").value||0; if(!n) break; const D=derive(ch); ch.hp=ch.hp||{cur:D.hpMax,temp:0};
      if(+t.dataset.v<0){ let left=n; const tmp=+ch.hp.temp||0; const ab=Math.min(tmp,left); ch.hp.temp=tmp-ab; left-=ab; ch.hp.cur=Math.max(0,(+ch.hp.cur||0)-left);
        if(ch.conc) concDamage(n,true); }
      else ch.hp.cur=Math.min(D.hpMax,(+ch.hp.cur||0)+n);
      if((+ch.hp.cur||0)>0&&ch.death&&(ch.death.s||ch.death.f)) ch.death={s:0,f:0};
      touch(S.cur); render(); break; }
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
    case "insp": ch.inspiration=!ch.inspiration; touch(S.cur); render(); break;
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
      const beams=(sp.level===0&&m.beams)?1+(D.L>=5)+(D.L>=11)+(D.L>=17):1;
      for(let b=1;b<=beams;b++){ const tag=beams>1?" (rayon "+b+")":""; if(m.attack) rollD20(sp.name+tag+" — toucher",D.cast.atk); if(ex) rollDmg(sp.name+tag+(m.heal?" — soins":" — dégâts "+(m.dmgType||"")),ex,false); }
      touch(S.cur); render(); break; }
    case "sdmg": { const D=derive(ch), sp=spellOf(t.dataset.ref), m=spellMech(sp); const sel=document.getElementById("slot-"+t.dataset.ref.replace(/[^a-z0-9]/gi,"")); const lvl=+(sel?.value||sp.level); const ex=diceAt(m,sp,lvl,D); rollDmg(sp.name+(m.heal?" — soins":" — dégâts "+(m.dmgType||"")),ex,false); break; }
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
  if(t.id==="hp-set"){ const ch=cur(); const D=derive(ch); ch.hp=ch.hp||{cur:0,temp:0}; const before=+ch.hp.cur||0; ch.hp.cur=Math.max(0,Math.min(D.hpMax,+t.value||0)); if(before<=0&&ch.hp.cur>0) ch.death={s:0,f:0}; S.hpEdit=false; touch(S.cur); render(); return; }
  if(t.dataset.actChange==="tcost"){ const ch=cur(); ch.costs=ch.costs||{}; ch.costs[t.dataset.k]=t.value; S.unlockCost=false; touch(S.cur); render(); return; }
  if(t.dataset.cname){ const ch=cur(); if(ch){ const list=customCopy(ch), b=list.find(x=>x.id===t.dataset.cname); if(b){ b.name=t.value.trim().slice(0,40)||"Mon bloc"; saveCustom(ch,list); render(); } } return; }
  if(t.dataset.actChange==="tslot"){ S.T.slot=+t.value; render(); return; }
  if(t.dataset.actChange==="compType"){ S.comp.type=t.value; render(); return; }
  // Une seule validation : un jet physique complet (pavé validé ou saisie terminée) est enregistré et compte pour le tour.
  if(t.dataset.tin&&S.T){ if(virtualDiceEnabled()) return; const T=S.T, kind=t.dataset.tin==="dmg"?"dmg":"d20";
    if(kind==="d20"?(!validDie(T.d1,20)||(T.mode!=="n"&&!validDie(T.d2,20))):!validDiceTotal(T.dmg)) return;
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
  if(t.id==="tq"){ S.T.q=t.value; const r=document.getElementById("tres"); if(r) r.innerHTML=tResults(); const c=document.querySelector(".tqclear"); if(c) c.hidden=!t.value; return; }
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
  if(f.dataset.form==="hpamt"){ hpApply(parseInt(document.getElementById("hp-amt").value)||0); return; }
  if(f.dataset.form==="cc"){ const c=S.T.cc; if(!c||c.res) return; const a1=parseInt(document.getElementById("cc-d1").value), b1=c.mode==="n"?0:parseInt(document.getElementById("cc-d2")?.value); if(!(a1>=1&&a1<=20)) return; if(c.mode!=="n"&&!(b1>=1&&b1<=20)) return; ccResolve(a1,b1,false); return; }
  if(f.dataset.form==="hdroll"){ const ch=cur(), D=derive(ch); const r=parseInt(document.getElementById("t-hd").value); if(!(r>=1&&r<=D.hd)) return; hdSpend(ch,D,r,true); setTimeout(()=>{ const i=document.getElementById("t-hd"); if(i) i.focus(); },0); return; }
  if(f.dataset.form==="death"){ const ch=cur(); const r=parseInt(document.getElementById("t-death").value); if(!(r>=1&&r<=20)) return; ch.death=ch.death||{s:0,f:0}; ch.hp=ch.hp||{cur:0,temp:0};
    if(r===20){ ch.hp.cur=1; ch.death={s:0,f:0}; } else if(r===1) ch.death.f=Math.min(3,ch.death.f+2); else if(r>=10) ch.death.s=Math.min(3,ch.death.s+1); else ch.death.f=Math.min(3,ch.death.f+1);
    touch(S.cur); render(); return; }
  if(f.dataset.form==="bag"){ const ch=cur(); const n=document.getElementById("bag-new").value.trim(); const q=Math.max(1,+document.getElementById("bag-newq").value||1); if(ch&&n){ ensureBag(ch); ch.bag.push({id:uid(),name:n,qty:q,note:""}); touch(S.cur); render(); setTimeout(()=>document.getElementById("bag-new")?.focus(),0); } return; }
  if(f.dataset.form==="cnt"){ const ch=cur(); const n=document.getElementById("cnt-name").value.trim(); const mx=+document.getElementById("cnt-max").value||0; if(ch&&n&&mx>0){ ch.counters=ch.counters||[]; ch.counters.push({id:uid(),name:n,cur:mx,max:mx}); touch(S.cur); render(); } }
  if(f.dataset.form==="tq"){ const r=searchItems(S.Titems||[],S.T.q); if(r[0]){ S.T.q=""; tSelect(r[0].key); } return; }
  if(f.dataset.form==="comp"){ S.comp.q=document.getElementById("compQ").value; render(); }
  if(f.dataset.form==="spellq"){ S.pending.q=document.getElementById("spellQ").value; renderModal(); }
});
new MutationObserver(()=>{ if(document.getElementById("dice")&&!document.getElementById("dice").childElementCount) renderDice(); }).observe(document.getElementById("app"),{childList:true});
 
boot();

// Capture avant les événements de carte : le pavé ne ferme jamais la carte du jet.
document.addEventListener('pointerdown',e=>{
  const input=e.target.closest(DICE_INPUTS);
  if(input&&!input.disabled&&!input.readOnly){ e.preventDefault(); openDicePad(input); }
},true);
document.addEventListener('click',e=>{
  const pad=e.target.closest('#dice-pad');
  if(pad){
    e.preventDefault(); e.stopImmediatePropagation();
    const key=e.target.closest('[data-pad]')?.dataset.pad;
    if(key) dicePadKey(key); else if(e.target===pad) closeDicePad();
    return;
  }
  const input=e.target.closest(DICE_INPUTS);
  if(input&&!input.disabled&&!input.readOnly){ e.preventDefault(); e.stopImmediatePropagation(); if(dicePad?.target!==input) openDicePad(input); }
},true);
document.addEventListener('keydown',e=>{
  if(!dicePad){
    if((e.key==='Enter'||e.key===' ')&&e.target.matches(DICE_INPUTS)){ e.preventDefault(); e.stopImmediatePropagation(); openDicePad(e.target); }
    // Pas de flèches : ↑/↓ modifieraient la valeur, donc enregistreraient un faux jet.
    else if((e.key==='ArrowUp'||e.key==='ArrowDown')&&e.target.matches(DICE_INPUTS)) e.preventDefault();
    return;
  }
  if(e.key==='Tab'){
    const buttons=[...document.querySelectorAll('#dice-pad button')], first=buttons[0], last=buttons[buttons.length-1];
    if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); }
    e.stopImmediatePropagation(); return;
  }
  const key=/^\d$/.test(e.key)?e.key:({Enter:'ok',Escape:'cancel',Backspace:'back',Delete:'clear'})[e.key];
  if(key){ e.preventDefault(); e.stopImmediatePropagation(); dicePadKey(key); }
},true);

// Molette sur un champ de dés : la page défile, la valeur ne change pas.
document.addEventListener('wheel',e=>{ if(e.target.matches?.(DICE_INPUTS)&&document.activeElement===e.target) e.target.blur(); },{passive:true});

/* ---------- « À la table » : glisser un bloc par sa poignée (mode disposition seulement) ---------- */
/* Copie semi-transparente qui suit le doigt ou la souris pendant un glisser (blocs, équipement). */
function dragGhost(el,cls){ const r=el.getBoundingClientRect(), g=document.createElement("div"), c=el.cloneNode(true);
  [c,...c.querySelectorAll("*")].forEach(n=>{ n.removeAttribute("id"); n.removeAttribute("name"); n.removeAttribute("for"); [...n.attributes].filter(a=>a.name.startsWith("data-")).forEach(a=>n.removeAttribute(a.name)); });
  c.classList.remove("dragging","blkph","eqsrc","eqok","eqno","eqover"); c.style.cssText="position:static;inset:auto;transform:none;width:100%;height:100%;margin:0;box-sizing:border-box";
  g.className="dragghost "+(cls||""); g.setAttribute("aria-hidden","true"); g.style.width=r.width+"px"; g.style.height=r.height+"px"; g.appendChild(c); document.body.appendChild(g); return {g,r}; }
const reduceMotion=()=>{ try{ return matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } };
/* Déplacement animé des autres blocs (technique FLIP) : ils glissent vers leur nouvelle place au lieu de sauter. */
function flipMove(box,mutate){ const els=[...box.children], before=new Map(els.map(b=>[b,b.getBoundingClientRect().top])); mutate();
  if(reduceMotion()) return;
  els.forEach(b=>{ const dy=before.get(b)-b.getBoundingClientRect().top; if(!dy) return; b.style.transition="none"; b.style.transform=`translateY(${dy}px)`; b.offsetHeight; b.style.transition="transform .16s ease-out"; b.style.transform=""; }); }
const layoutTop=b=>(b.offsetParent?b.offsetParent.getBoundingClientRect().top+b.offsetParent.clientTop:0)+b.offsetTop; // place sans l'animation en cours
let BLKD=null;
function blkPlace(){ if(!BLKD) return; const el=BLKD.el, box=el.parentElement; if(!box) return;
  const others=[...box.querySelectorAll(":scope > .tblk")].filter(b=>b!==el);
  const next=others.find(b=>BLKD.y<layoutTop(b)+b.offsetHeight/2)||null;
  if(el.nextElementSibling!==next) flipMove(box,()=>box.insertBefore(el,next)); }
function blkGhostAt(){ if(BLKD&&BLKD.ghost){ BLKD.ghost.style.left=(BLKD.x-BLKD.dx)+"px"; BLKD.ghost.style.top=(BLKD.y-BLKD.dy)+"px"; } }
function blkLoop(){ if(!BLKD) return; // défilement automatique près des bords, même sans bouger le doigt
  const top=(document.querySelector(".tlayouttop")?.getBoundingClientRect().bottom||0)+50;
  const v=BLKD.y<top?-Math.min(18,(top-BLKD.y)/3+4):BLKD.y>innerHeight-60?Math.min(18,(BLKD.y-innerHeight+60)/3+4):0;
  if(v){ const s0=scrollY; window.scrollBy(0,v); if(scrollY!==s0) blkPlace(); }
  BLKD.raf=requestAnimationFrame(blkLoop); }
document.addEventListener("pointerdown",e=>{
  // Au doigt : la poignée seule (la page doit pouvoir défiler) ; à la souris : tout le bloc, sauf ses boutons.
  if(!S.layoutEdit||!e.target.closest||(e.pointerType==="mouse"&&e.button!==0)) return;
  const g=e.target.closest("[data-blkgrip]")||(e.pointerType==="mouse"&&!e.target.closest("button")?e.target.closest(".tblocks.editing > .tblk"):null); if(!g) return;
  const el=g.closest(".tblk"); if(!el) return; e.preventDefault();
  const {g:ghost,r}=dragGhost(el,"blkghost");
  BLKD={el,id:e.pointerId,ghost,x:e.clientX,y:e.clientY,dx:Math.min(e.clientX-r.left,r.width-20),dy:Math.min(e.clientY-r.top,60)};
  blkGhostAt(); el.classList.add("dragging","blkph"); document.body.classList.add("blkdragging");
  try{ g.setPointerCapture(e.pointerId); }catch(err){}
  BLKD.raf=requestAnimationFrame(blkLoop);
});
document.addEventListener("pointermove",e=>{
  if(!BLKD||e.pointerId!==BLKD.id) return; e.preventDefault();
  BLKD.x=e.clientX; BLKD.y=e.clientY; blkGhostAt(); blkPlace();
});
function blkDragEnd(e){ if(!BLKD||e.pointerId!==BLKD.id) return; const D0=BLKD, box=D0.el.parentElement; BLKD=null;
  cancelAnimationFrame(D0.raf); D0.ghost.remove(); D0.el.classList.remove("dragging","blkph"); document.body.classList.remove("blkdragging");
  const ch=cur(); if(ch&&box) saveTableOrder(ch,[...box.querySelectorAll(":scope > .tblk")].map(b=>b.dataset.blk)); render(); }
document.addEventListener("pointerup",blkDragEnd);
document.addEventListener("pointercancel",blkDragEnd);

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
  if(EQD.touch) EQD.timer=setTimeout(()=>{ if(EQD&&!EQD.active) eqdStart(); },350);
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
