/* ---------- Lignages et ascendances (chantier 13) ----------
   Choix d'espèce du SRD 5.2.1 : lignage elfique, lignage gnome, héritage fiélon, ascendance draconique, ascendance gigante.
   Le choix est gardé dans ch.lineage = {id, ab} (ab : caractéristique d'incantation des sorts du lignage, Int, Sag ou Cha).
   Effets calculés dans derive() : sorts mineurs et sorts toujours préparés (D.always), lancers sans emplacement (D.res,
   même mécanique que les sorts de classe « freeSpell »), vitesse, vision dans le noir, résistances (Défenses), type du Souffle. */
const LINEAGES={
  elfe:{label:"Lignage elfique",ability:true,opts:{
    drow:{name:"Drow",cantrips:["lumieres-dansantes"],l3:"lueurs-feeriques",l5:"tenebres",vision:36},
    "haut-elfe":{name:"Haut-elfe",cantrips:["prestidigitation"],l3:"detection-de-la-magie",l5:"foulee-brumeuse"},
    sylvestre:{name:"Elfe sylvestre",cantrips:["druidisme"],l3:"communication-avec-les-animaux",l5:"passage-sans-trace",speed:1.5}}},
  gnome:{label:"Lignage gnome",ability:true,opts:{
    forets:{name:"Gnome des forêts",cantrips:["illusion-mineure"],l1pb:"communication-avec-les-animaux"},
    roches:{name:"Gnome des roches",cantrips:["prestidigitation","reparation"],note:"Bricolage : en 10 minutes, tu fabriques un petit appareil mécanique qui reproduit un effet de prestidigitation (3 à la fois, 8 heures)."}}},
  tieffelin:{label:"Héritage fiélon",ability:true,always:["thaumaturgie"],opts:{
    abyssal:{name:"Abyssal",res:"Poison",cantrips:["bouffee-de-poison"],l3:"rayon-empoisonne",l5:"immobilisation-de-personne"},
    chtonien:{name:"Chtonien",res:"Nécrotique",cantrips:["contact-glacial"],l3:"simulacre-de-vie",l5:"rayon-affaiblissant"},
    infernal:{name:"Infernal",res:"Feu",cantrips:["trait-de-feu"],l3:"represailles-infernales",l5:"tenebres"}}},
  drakeide:{label:"Ascendance draconique",opts:Object.fromEntries([["airain","Airain","Feu"],["argent","Argent","Froid"],["blanc","Blanc","Froid"],["bleu","Bleu","Foudre"],["bronze","Bronze","Foudre"],["cuivre","Cuivre","Acide"],["noir","Noir","Acide"],["or","Or","Feu"],["rouge","Rouge","Feu"],["vert","Vert","Poison"]]
    .map(([id,n,t])=>[id,{name:"Dragon "+n.toLowerCase()+" ("+t.toLowerCase()+")",res:t,breath:t}]))},
  goliath:{label:"Ascendance gigante",opts:{
    feu:{name:"Brûlure ignée",note:"Quand tu touches et infliges des dégâts : +1d10 dégâts de feu."},
    pierres:{name:"Endurance de la pierre",note:"Réaction quand tu subis des dégâts : tu les réduis de 1d12 + ton modificateur de Constitution."},
    givre:{name:"Froid mordant",note:"Quand tu touches et infliges des dégâts : +1d6 dégâts de froid et la cible perd 3 m de vitesse jusqu'à ton prochain tour."},
    collines:{name:"Renversement des coteaux",note:"Quand tu touches une créature de taille G ou moins et lui infliges des dégâts : elle tombe À terre."},
    nuages:{name:"Saut des nuées",note:"Action bonus : tu te téléportes jusqu'à 9 m dans un espace inoccupé que tu vois."},
    tempetes:{name:"Tonnerre des cieux",note:"Réaction quand une créature à 18 m ou moins t'inflige des dégâts : 1d8 dégâts de tonnerre."}}}
};
const LINEAGE_AB=[["int","Intelligence"],["sag","Sagesse"],["cha","Charisme"]];
function speciesId(ch){ return String(ch&&ch.species||"").startsWith("srd:")?ch.species.slice(4):""; }
// Lignage choisi pour ce perso : {def, opt, id, ab} ou null (espèce sans choix, ou choix pas encore fait)
function lineageOf(ch){ const def=LINEAGES[speciesId(ch)], l=ch&&ch.lineage; if(!def||!l||!def.opts[l.id]) return null;
  return {def,opt:def.opts[l.id],id:l.id,ab:def.ability?(["int","sag","cha"].includes(l.ab)?l.ab:"cha"):null}; }
function spellRefById(id){ return S.idx.spells[id]?"srd:"+id:null; }
// Sorts du lignage au niveau L : [{ref, src, free:"pb"|1|0}]
function lineageSpells(ch,L){ const lo=lineageOf(ch); if(!lo) return []; const src=lo.def.label+" · "+lo.opt.name, out=[], add=(id,free)=>{ const ref=spellRefById(id); if(ref) out.push({ref,src,free}); };
  for(const id of lo.def.always||[]) add(id,0); for(const id of lo.opt.cantrips||[]) add(id,0);
  if(lo.opt.l1pb) add(lo.opt.l1pb,"pb"); if(lo.opt.l3&&L>=3) add(lo.opt.l3,1); if(lo.opt.l5&&L>=5) add(lo.opt.l5,1);
  return out; }
// Résumé d'un lignage (fiche, assistant)
function lineageSummary(def,o){ const nm=id=>(S.idx.spells[id]||{}).name||id, parts=[];
  if(o.res) parts.push("résistance "+o.res.toLowerCase()); if(o.breath) parts.push("Souffle de "+o.breath.toLowerCase());
  if(o.vision) parts.push("vision dans le noir "+o.vision+" m"); if(o.speed) parts.push("vitesse +"+String(o.speed).replace(".",",")+" m");
  const c=[...(def.always||[]),...(o.cantrips||[])]; if(c.length) parts.push("sorts mineurs : "+c.map(nm).join(", "));
  if(o.l1pb) parts.push(nm(o.l1pb)+" toujours préparé, sans emplacement (bonus de maîtrise par repos long)");
  if(o.l3) parts.push("niv. 3 : "+nm(o.l3)); if(o.l5) parts.push("niv. 5 : "+nm(o.l5));
  if(o.l3||o.l5) parts.push("1 lancer sans emplacement par repos long");
  return (parts.join(" ; ")+(o.note?(parts.length?". ":"")+o.note:"")).replace(/^./,x=>x.toUpperCase()); }
// Sélecteurs du lignage (onglet Personnage de la fiche) : liés à ch.lineage
function lineageFields(ch){ const def=LINEAGES[speciesId(ch)]; if(!def) return ""; const l=ch.lineage||{}, o=def.opts[l.id];
  return `<label class="field"><span>${esc(def.label)}</span><select id="b-lineage" data-bind="lineage.id"><option value="">— Choisir —</option>${Object.entries(def.opts).map(([v,x])=>`<option value="${esc(v)}" ${v===l.id?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label>`
    +(def.ability?`<label class="field"><span>Caractéristique d'incantation (${esc(def.label.toLowerCase())})</span><select id="b-lineage-ab" data-bind="lineage.ab">${LINEAGE_AB.map(([v,n])=>`<option value="${v}" ${(l.ab||"cha")===v?"selected":""}>${n}</option>`).join("")}</select></label>`:"")
    +(o?`<div class="muted lineage-sum" style="font-size:var(--fs-sm);grid-column:1/-1">${esc(lineageSummary(def,o))}.</div>`:`<div class="muted" style="font-size:var(--fs-sm);grid-column:1/-1">Choisis ${def.label==="Héritage fiélon"?"ton héritage":"ton "+def.label.toLowerCase().replace(/^lignage /,"lignage ").replace(/^ascendance /,"ascendance ")} : il donne des sorts, une résistance ou un pouvoir.</div>`); }
