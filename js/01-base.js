"use strict";
const PAGE_CLONE = document.documentElement.cloneNode(true);
/* ---------- constants ---------- */
// Icône des boutons de suppression (corbeille), distincte de la croix de fermeture.
const ICON_TRASH='<svg class="ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
const AB = ["for","dex","con","int","sag","cha"];
const ABN = {for:"Force",dex:"Dextérité",con:"Constitution",int:"Intelligence",sag:"Sagesse",cha:"Charisme"};
const ABS = {for:"FOR",dex:"DEX",con:"CON",int:"INT",sag:"SAG",cha:"CHA"};
const PB = l => 2 + Math.floor((Math.max(1,l)-1)/4);
const mod = s => Math.floor(((+s||10)-10)/2);
const sg = n => (n>=0?"+":"")+n;
const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const uid = () => Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const norm = s => String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[’']/g,"'").trim();
const AIDE="https://www.aidedd.org";
const aideSlug = s => norm(s).replace(/'/g,"-").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
function aideGuess(h){ const sl=aideSlug(h.name);
  if(h.kind==="sort") return AIDE+"/spell/fr/"+sl; if(h.kind==="don") return AIDE+"/feat/fr/"+sl; if(h.kind==="objet") return AIDE+"/magic-item/fr/"+sl;
  if(h.kind==="classe") return AIDE+"/regles-24/classes/"+sl+"/";
  if(h.kind==="sous-classe"){ const c=(S.C.classes||[]).find(c=>c.id===h.classId); return AIDE+"/regles-24/classes/"+(c?aideSlug(c.name)+"/":""); }
  return AIDE+"/"; }
const safeUrl = u => /^https?:\/\/[^\s"'<>]+$/i.test(String(u||"").trim())?String(u).trim():"";
function hbBook(h){ const l=String(h&&h.label||"").trim(); return l&&!/^(hors srd|mon livre|perso)$/i.test(l)?l:"Personnalisée"; }
function hbFoot(h){ if(!h) return ""; const lk=linkHtml(h); const more=(Array.isArray(h.links)?h.links:[]).filter(l=>safeUrl(l.url)&&l.url!==h.link); return `<div class="hbfoot muted" style="font-size:var(--fs-sm);margin-top:8px">Source : ${esc(hbBook(h))}${lk?" · "+lk:""}${more.length?` · Références : ${more.map(l=>`<a class="aidelink" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(hostOf(l.url))} ↗</a>`).join(" · ")}`:""}</div>`; }
const hostOf=u=>{ try{ return new URL(u).hostname.replace(/^www\./,""); }catch(e){ return u; } };
function linkHtml(h){ const u=h&&safeUrl(h.link); return u?`<a class="aidelink" href="${esc(u)}" target="_blank" rel="noopener noreferrer">Voir sur ${/aidedd\.org/i.test(u)?"AideDD":hostOf(u)} ↗</a>`:""; }
const CONDS = ["À terre","Agrippé","Assourdi","Aveuglé","Charmé","Effrayé","Empoisonné","Entravé","Étourdi","Inconscient","Invisible","Neutralisé","Paralysé","Pétrifié"];
const HB_KINDS = {classe:"Classe",sort:"Sort",don:"Don","sous-classe":"Sous-classe",espece:"Espèce",historique:"Historique",aptitude:"Aptitude",objet:"Objet / arme"};
 
/* ---------- state ---------- */
const S = {C:null, idx:{}, uid:null, db:null, mode:"loading", loaded:false, docs:{}, dirty:{}, view:"list", cur:null, tab:"jeu", adv:"n", log:[], hbSel:null, hbFilter:"", pending:null, confirm:null, comp:{q:"",type:"sorts"}};
 
/* ---------- classes hors SRD ---------- */
const ASI_DEF="4,8,12,16,19", CAST_TYPES=[["","Aucune"],["full","Lanceur complet"],["half","Demi-lanceur"],["pact","Magie de pacte"]];
function hbClass(h){ if(!h) return null; const C=S.idx.classes;
  const arr=(s,def)=>{ const a=String(s||"").split(/[,;\s]+/).filter(Boolean).map(Number); return a.length===20&&a.every(n=>!isNaN(n))?a:def; };
  let casting=null; const ct=h.castType||"";
  if(ct&&C.magicien){ const base=(ct==="pact"?C.occultiste:ct==="half"?C.paladin:C.magicien).casting;
    casting=Object.assign({},base,{ability:h.castAbility||"int",type:ct,cantrips:arr(h.cantrips,Array(20).fill(0)),prepared:arr(h.prepared,base.prepared)}); }
  const asi=String(h.asiLevels??ASI_DEF).split(/[,;\s]+/).map(Number).filter(n=>n>=1&&n<=20).map(l=>({level:l,name:"Amélioration de caractéristique",text:"+2 à une caractéristique ou +1 à deux caractéristiques (maximum 20), ou un don."}));
  const feats=[...(h.features||[]).map(f=>({level:+f.level||1,name:f.name||"Aptitude",text:f.text||"",effects:f.effects||[]})),...asi].sort((a,b)=>a.level-b.level);
  const af=h.armorFlags||{}, sf=h.skillFlags||{};
  return {id:"hb:"+h._id,hb:true,name:h.name||"Classe hors SRD",hitDie:+h.hitDie||8,primary:[h.primary1,h.primary2].filter(Boolean).length?[h.primary1,h.primary2].filter(Boolean):["for"],saves:[h.save1,h.save2].filter(Boolean),
    armor:["legere","intermediaire","lourde","bouclier"].filter(k=>af[k]),weapons:h.weapons||"",tools:h.tools||null,
    skillChoices:{count:+h.skillCount||2,from:S.C.skills.map(s=>s.id).filter(id=>sf[id]).length?S.C.skills.map(s=>s.id).filter(id=>sf[id]):S.C.skills.map(s=>s.id)},
    equipment:h.equipment||"",unarmoredAC:h.unarmoredAC||null,casting,resources:[],features:feats,subclasses:[],subclassLevel:+h.subclassLevel||3,columns:[],spellList:h.spellList||""}; }
function clsOf(id){ if(!id) return null; if(String(id).startsWith("hb:")){ const h=hb(id); return h&&h.kind==="classe"?hbClass(h):null; } return S.idx.classes[id]||null; }
function hbClassEditor(id,h){ const b=k=>`data-hb="${id}" data-bind="${k}"`; const o=(v,l,c)=>`<option value="${esc(v)}" ${String(v)===String(c??"")?"selected":""}>${esc(l)}</option>`;
  const abSel=(k,ph)=>`<select ${b(k)}>${o("",ph,h[k])}${AB.map(a=>o(a,ABN[a],h[k])).join("")}</select>`;
  return `<div class="sect"><h2>Profil de classe</h2></div>
  <div class="grid2"><label class="field"><span>Dé de vie</span><select ${b("hitDie")} data-num>${[6,8,10,12].map(n=>o(n,"d"+n,h.hitDie||8)).join("")}</select></label>
  <div class="field"><span>Caractéristique(s) principale(s)</span><div class="row" style="gap:6px">${abSel("primary1","— Principale —")}${abSel("primary2","— (facultatif) —")}</div></div>
  <div class="field"><span>Jets de sauvegarde maîtrisés</span><div class="row" style="gap:6px">${abSel("save1","— JS 1 —")}${abSel("save2","— JS 2 —")}</div></div>
  <div class="field"><span>Armures</span><div class="row" style="gap:10px">${[["legere","Légères"],["intermediaire","Intermédiaires"],["lourde","Lourdes"],["bouclier","Boucliers"]].map(([k,l])=>`<label class="row" style="gap:4px"><input type="checkbox" ${b("armorFlags."+k)} ${(h.armorFlags||{})[k]?"checked":""}>${l}</label>`).join("")}</div></div>
  <label class="field"><span>Armes</span><input type="text" ${b("weapons")} value="${esc(h.weapons||"")}" placeholder="Armes courantes…"></label>
  <label class="field"><span>Outils</span><input type="text" ${b("tools")} value="${esc(h.tools||"")}"></label>
  <label class="field"><span>Compétences à choisir</span><input type="number" min="0" max="6" ${b("skillCount")} data-num value="${esc(h.skillCount||2)}"></label>
  <label class="field"><span>Niveau de sous-classe</span><input type="number" min="1" max="20" ${b("subclassLevel")} data-num value="${esc(h.subclassLevel||3)}"></label></div>
  <div class="field"><span>Compétences proposées (aucune cochée = toutes)</span><div class="row" style="gap:4px;flex-wrap:wrap">${S.C.skills.map(s=>`<label class="chip" style="gap:4px"><input type="checkbox" ${b("skillFlags."+s.id)} ${(h.skillFlags||{})[s.id]?"checked":""}>${esc(s.name)}</label>`).join("")}</div></div>
  <label class="field"><span>Équipement de départ</span><input type="text" ${b("equipment")} value="${esc(h.equipment||"")}" placeholder="(A) Armure de cuir, 2 dagues et 10 po ; ou (B) 75 po"></label>
  <label class="field"><span>CA sans armure (formule, facultatif)</span><input type="text" ${b("unarmoredAC")} value="${esc(h.unarmoredAC||"")}" placeholder="10+dex+con"></label>
  <label class="field"><span>Niveaux d'amélioration de caractéristique</span><input type="text" ${b("asiLevels")} value="${esc(h.asiLevels??ASI_DEF)}"></label>
  <div class="sect"><h2>Incantation</h2></div>
  <div class="grid2"><label class="field"><span>Type</span><select ${b("castType")}>${CAST_TYPES.map(([v,l])=>o(v,l,h.castType||"")).join("")}</select></label>
  ${h.castType?`<label class="field"><span>Caractéristique d'incantation</span><select ${b("castAbility")}>${AB.map(a=>o(a,ABN[a],h.castAbility||"int")).join("")}</select></label>
  <label class="field"><span>Liste de sorts</span><select ${b("spellList")}>${o("","Tous les sorts",h.spellList)}${S.C.classes.filter(c=>c.casting).map(c=>o(c.name,"Sorts de "+c.name,h.spellList)).join("")}</select></label>
  <label class="field"><span>Sorts mineurs (20 valeurs, niveaux 1→20)</span><input type="text" ${b("cantrips")} value="${esc(h.cantrips||"")}" placeholder="2,2,2,3,3,3,3,3,3,4,…"></label>
  <label class="field"><span>Sorts préparés (20 valeurs)</span><input type="text" ${b("prepared")} value="${esc(h.prepared||"")}" placeholder="vide = table standard du type"></label>`:""}</div>
  ${h.castType?`<div class="muted" style="font-size:var(--fs-sm)">Emplacements : table du ${h.castType==="pact"?"Occultiste":h.castType==="half"?"Paladin":"Magicien"}.</div>`:""}`; }
/* Fenêtres harmonisées (chantier 10, décisions d'Angle, 13 nov. 2026) : en-tête unique (titre + croix 44 px), pied avec le bouton principal
   toujours visible ; sur téléphone, les fenêtres montent du bas de l'écran (CSS en fin de theme.css). */
function winHead(title,act="closeModal",style=""){ return `<div class="whead"><h2${style?` style="${style}"`:""}>${title}</h2><button class="btn small ghost wclose" type="button" data-act="${act}" aria-label="Fermer">×</button></div>`; }
const winFoot=inner=>`<div class="wfoot">${inner}</div>`;

