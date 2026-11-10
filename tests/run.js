// Batterie de tests de l'appli D&D Compagnon (Playwright, fichier autonome local).
// Usage : node tests/run.js [chemin/vers/dnd-compagnon.html] [--only "texte" ...]   (par défaut dist/dnd-compagnon.html)
//   --only : ne lance que les tests dont le nom contient ce texte (sans tenir compte des majuscules ; option répétable).
//   Pendant le travail seulement : toute la suite reste obligatoire une fois par lot (voir AGENTS.md).
// Aucune donnée réelle : les persos sont créés pendant les tests ; Claude et le navigateur de l'app sont simulés.
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ARGS = process.argv.slice(2), ONLY = [], POS = [];
for (let i = 0; i < ARGS.length; i++) { if (ARGS[i] === '--only') ONLY.push(String(ARGS[++i] || '').toLowerCase()); else POS.push(ARGS[i]); }
const FILE = path.resolve(POS[0] || path.join(__dirname, '..', 'dist', 'dnd-compagnon.html'));
let SKIPPED = 0;
const HTML_SOURCE = fs.readFileSync(FILE, 'utf8');
 
const results = [];
// Un seul navigateur pour toute la suite ; chaque test a son propre contexte (stockage, cookies et pages isolés).
let BROWSER = null;
async function test(name, fn) {
  if (ONLY.length && !ONLY.some(o => o && name.toLowerCase().includes(o))) { SKIPPED++; return; }
  BROWSER = BROWSER || await chromium.launch();
  const ctx = await BROWSER.newContext({ viewport: { width: 1200, height: 900 } }); const p = await ctx.newPage(); p.setDefaultTimeout(8000);
  const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  try { await fn(p, errors); if (errors.length) throw new Error('Erreur JS : ' + errors.join(' | ')); results.push([name, true]); console.log('✓', name); }
  catch (e) { results.push([name, false]); console.log('✗', name, '\n   ', e.message); }
  finally { await ctx.close(); }
}
function ok(cond, msg) { if (!cond) throw new Error(msg); }
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg} : obtenu ${JSON.stringify(a)}, attendu ${JSON.stringify(b)}`); }
 
// Simulation de window.claude.use : sample (réponses JSON) et, si demandé, le navigateur de l'app (host:claude_browser).
async function open(p, o = {}) {
  await p.addInitScript(o => {
    if (o.noClaude) return;
    const reply = () => JSON.parse(JSON.stringify(o.json || { found: true, summary: 'Résumé de test.', book: 'Manuel des joueurs (2024)', abilities: [], skills: [], pages: [] }));
    const sample = async () => ({ text: '{}' }); sample.json = async () => reply();
    const txt = t => ({ content: [{ type: 'text', text: t }], payload: t });
    const mcp = o.mcp ? { callTool: async (s, t, i) => { (window.__calls = window.__calls || []).push([t, i]);
      if (t === 'preview_start') return o.ps || txt('Opened ' + i.url + ' in the browser pane (tabId seed). Read the page to see the result.');
      if (t === 'get_page_text') return txt('Title: Page\n' + 'texte '.repeat(200));
      if (t === 'tabs_close' && o.closeFails) throw { code: 'tool_error', message: 'refus' };
      return txt('Closed'); } } : null;
    window.claude = { use: async n => n === 'sample' ? (o.noSample ? null : sample) : n === 'mcp' ? mcp : null };
  }, o);
  await p.goto('file://' + FILE); await p.waitForFunction(() => typeof S !== 'undefined' && S.C && S.CAT);
}
const newWizardChar = (p, w) => p.evaluate(w => { const W = S.W = wNew(); Object.assign(W, { method: 'std', std: { for: 15, dex: 14, con: 13, int: 12, sag: 10, cha: 8 }, name: 'Test' }, w);
  for (const k of ['bg', 'sp', 'feat', 'cls']) if (W[k]) W[k] = catRes(W[k]); wCreate(); return S.cur; }, w);
 
(async () => {
  await test('Démarrage : SRD et catalogue chargés', async p => {
    await open(p);
    const r = await p.evaluate(() => ({ cls: S.C.classes.length, spells: S.C.spells.length, cat: S.CAT.length, ids: new Set(S.CAT.map(e => e.id)).size }));
    eq(r.cls, 12, 'classes SRD'); ok(r.spells > 300, 'sorts SRD'); ok(r.cat > 400, 'catalogue'); eq(r.ids, r.cat, 'identifiants du catalogue uniques');
  });

  await test('Isolation (1/2) : un test écrit dans le stockage du navigateur', async p => {
    await open(p); await p.evaluate(() => { localStorage.setItem('isolation-test','1'); setVirtualDice(true); });
    eq(await p.evaluate(() => localStorage.getItem('isolation-test')),'1','écriture faite');
  });

  await test('Isolation (2/2) : le test suivant repart d’un navigateur vierge', async p => {
    await open(p);
    eq(await p.evaluate(() => [localStorage.getItem('isolation-test'), virtualDiceEnabled()]),[null,false],'aucune trace du test précédent');
  });

  await test('Mode local pur : aucun besoin de Claude, catalogues SRD et hors SRD embarqués', async p => {
    await open(p, { noClaude: true });
    const r = await p.evaluate(() => ({
      claude: typeof window.claude,
      mode: S.mode,
      srd: S.C.spells.length + S.C.classes.length + S.C.items.length,
      cat: S.CAT.length,
      embeddedSrd: document.getElementById('srd-data').textContent.length,
      embeddedCat: document.getElementById('hb-cat').textContent.length,
      platform: { ai: PLATFORM.hasAI, browser: PLATFORM.hasBrowser }
    }));
    eq(r.claude, 'undefined', 'API Claude absente'); eq(r.mode, 'local', 'mode local');
    ok(r.srd > 300 && r.embeddedSrd > 500000, 'catalogue SRD embarqué');
    ok(r.cat > 400 && r.embeddedCat > 50000, 'catalogue hors SRD embarqué');
    eq(r.platform, { ai: false, browser: false }, 'capacités Claude désactivées proprement');
  });

  await test('HTML propre : une seule page, métadonnées uniques et aucun Cornelius caché', async p => {
    await open(p, { noClaude: true });
    const markup = HTML_SOURCE.replace(/<script\b[\s\S]*?<\/script>/gi, '');
    const count = pattern => (markup.match(pattern) || []).length;
    eq(count(/<!doctype html>/gi), 1, 'doctype');
    const r = await p.evaluate(() => ({
      html: document.querySelectorAll('html').length,
      head: document.querySelectorAll('head').length,
      lang: document.documentElement.lang,
      charset: document.querySelectorAll('meta[charset]').length,
      viewport: document.querySelectorAll('meta[name="viewport"]').length,
      titleInHead: document.querySelector('head > title')?.textContent,
      exampleState: Object.prototype.hasOwnProperty.call(S, 'example'),
      exampleButton: !!document.querySelector('[data-act="loadExample"]')
    }));
    eq(r, { html: 1, head: 1, lang: 'fr', charset: 1, viewport: 1, titleInHead: 'D&D Compagnon', exampleState: false, exampleButton: false }, 'structure de la page');
  });
 
  await test('Calculs Occultiste (Cha 17, Con 15) aux niveaux 1, 5, 11, 17', async p => {
    await open(p);
    const r = await p.evaluate(() => [1, 5, 11, 17].map(L => { const D = derive({ type: 'perso', name: 'T', level: L, classId: 'occultiste', abilities: { for: 8, dex: 12, con: 15, int: 10, sag: 13, cha: 17 }, skills: {}, attacks: [], spells: [], feats: [], features: [], invocations: [], conditions: [] });
      return [D.pb, D.hpMax, D.cast.pactSlots, D.cast.pactLevel, D.cast.dc]; }));
    eq(r, [[2, 10, 1, 1, 13], [3, 38, 2, 3, 14], [4, 80, 3, 5, 15], [6, 122, 4, 5, 17]], 'maîtrise, PV, emplacements, niveau, DD');
  });
 
  await test('Assistant : choix du catalogue, relecture et validation', async p => {
    await open(p);
    await p.evaluate(() => { S.W = wNew(); S.W.cls = 'guerrier'; S.view = 'wizard'; S.W.step = 1; render(); });
    await p.click('[data-act="wpick"][data-k="bg"][data-v="cat:bg-artisan"]');
    const w = await p.evaluate(() => ({ feat: (hb(S.W.feat) || {}).name, bgSk: wBgSkills(S.W) }));
    eq(w, { feat: 'Façonneur', bgSk: ['investigation', 'persuasion'] }, 'don et compétences de l’historique');
    await p.evaluate(() => { const W = S.W; W.sp = catRes('cat:sp-aasimar'); Object.assign(W, { method: 'std', std: { for: 15, dex: 14, con: 13, int: 12, sag: 10, cha: 8 }, name: 'Test' }); wCreate(); });
    eq(await p.evaluate(() => S.rv.items.map(i => S.docs[i.id].name).sort()), ['Aasimar', 'Artisan', 'Façonneur'], 'éléments à relire');
    await p.click('[data-act="rvGo"]'); await p.waitForFunction(() => S.rv && !S.rv.run && S.rv.items.every(i => i.state === 'ok'));
    await p.click('[data-act="rvAll"]'); await p.click('[data-act="rvClose"]');
    const d = await p.evaluate(() => ({ pending: hbs().filter(h => h.pending).length, art: hbs('historique').find(h => h.name === 'Artisan') }));
    eq(d.pending, 0, 'fiches encore à remplir'); ok(d.art.text.startsWith('Résumé de test.'), 'résumé appliqué'); eq(d.art.effects.length, 2, 'compétences gardées');
    ok(/aidedd\.org/.test(d.art.link), 'lien du catalogue gardé');
  });
 
  await test('Assistant : les choix abandonnés sont supprimés', async p => {
    await open(p);
    await p.evaluate(() => { S.W = wNew(); S.W.cls = 'guerrier'; S.view = 'wizard'; S.W.step = 1; render(); });
    await p.click('[data-act="wpick"][data-k="bg"][data-v="cat:bg-ermite"]');
    ok(await p.evaluate(() => hbs().length === 2), 'fiches créées au choix');
    await p.click('[data-act="wcancel"]');
    eq(await p.evaluate(() => hbs().length), 0, 'fiches restantes après annulation');
  });
 
  await test('Création niveau 3 : popup protégée, arrêt confirmé, sous-classe du catalogue', async p => {
    await open(p, { mcp: true, json: { found: true, summary: 'Lu sur la page.', features: [{ level: 3, name: 'Aptitude', summary: 'x' }], pages: [] } });
    await newWizardChar(p, { cls: 'paladin', bg: 'srd:soldat', sp: 'srd:humain', level: 3 });
    ok(await p.evaluate(() => S.pending && S.pending.type === 'lvl'), 'popup de niveau ouverte');
    await p.mouse.click(3, 450); ok(await p.evaluate(() => !!S.pending), 'un clic à côté ne ferme pas');
    await p.click('[data-act="lvlStop"]'); ok(await p.evaluate(() => document.getElementById('modal').innerText.includes('Arrêter la création ici')), 'confirmation affichée');
    await p.click('[data-act="lvlStopNo"]'); await p.click('[data-act="lvlApply"]');
    ok(await p.evaluate(() => cur().level === 2 && S.pending), 'niveau 2 puis suite');
    const opts = await p.evaluate(() => [...document.querySelectorAll('#modal select[data-lu="sub"] option')].map(o => o.value));
    ok(opts.includes('cat:sc-paladin-anciens') && !opts.some(v => /occultiste|barde/.test(v)), 'sous-classes filtrées par classe');
    await p.selectOption('#modal select[data-lu="sub"]', 'cat:sc-paladin-anciens'); await p.click('[data-act="lvlApply"]');
    eq(await p.evaluate(() => [cur().level, (hb(cur().subclass) || {}).name, S.rv && S.rv.items.length]), [3, 'Serment des Anciens', 1], 'niveau, sous-classe, relecture');
    await p.click('[data-act="rvGo"]'); await p.waitForFunction(() => S.rv && !S.rv.run);
    eq(await p.evaluate(() => (window.__calls || []).map(c => c[0] + (c[1].tabId ? ':' + c[1].tabId : ''))), ['preview_start', 'get_page_text:seed', 'tabs_close:seed'], 'lecture AideDD puis fermeture de l’onglet');
    await p.click('[data-act="rvOk"]');
    eq(await p.evaluate(() => { const h = hb(cur().subclass); return [!!h.pending, h.features.length]; }), [false, 1], 'sous-classe remplie');
  });
 
  await test('Arrêter la création au niveau 1', async p => {
    await open(p);
    await newWizardChar(p, { cls: 'guerrier', bg: 'srd:soldat', sp: 'srd:humain', level: 4 });
    await p.click('[data-act="lvlStop"]'); await p.click('[data-act="lvlStopYes"]');
    eq(await p.evaluate(() => [cur().level, !!S.pending, !!S.lvlTarget]), [1, false, false], 'niveau, popup, enchaînement');
  });
 
  for (const [label, o, want, noteRe] of [
    ['texte réel', {}, 'tabs_close:seed', null],
    ['réponse structurée', { ps: { content: [{ type: 'text', text: '{}' }], structuredContent: { tabId: 't42' }, payload: { tabId: 't42' } } }, 'tabs_close:t42', null],
    ['sans identifiant', { ps: { content: [{ type: 'text', text: 'Opened page.' }], payload: 'Opened page.' } }, '', /identifiant introuvable/],
    ['fermeture refusée', { closeFails: true }, 'tabs_close:seed', /non refermé/],
  ]) await test('Onglets du navigateur : ' + label, async p => {
    await open(p, Object.assign({ mcp: true }, o));
    const r = await p.evaluate(async () => { await afBrowse('https://www.dndbeyond.com/x'); return { calls: (window.__calls || []).filter(c => c[0] === 'tabs_close').map(c => 'tabs_close:' + c[1].tabId).join(' '), note: S.afTabNote || '' }; });
    eq(r.calls, want, 'fermeture'); ok(noteRe ? noteRe.test(r.note) : !r.note, 'signalement : ' + r.note);
  });
 
  await test('Contenu perso : recherche et ajout depuis le catalogue', async p => {
    await open(p);
    await p.evaluate(() => { S.view = 'hb'; render(); }); await p.click('[data-act="catPick"]');
    await p.fill('#catq', 'toll the dead');
    ok(await p.evaluate(() => document.getElementById('catlist').innerText.includes('Glas')), 'recherche en VO');
    await p.click('#catlist [data-act="catAdd"]');
    eq(await p.evaluate(() => { const h = S.docs[S.hbSel]; return [h.name, h.level, h.pending]; }), ['Glas', 0, true], 'fiche ajoutée');
  });
 
  await test('Pas de doublon avec une fiche hors SRD existante', async p => {
    await open(p);
    const r = await p.evaluate(() => { S.docs.h_x = { type: 'hb', kind: 'sous-classe', name: 'Protecteur céleste', text: '', effects: [] };
      return catOpts('sous-classe', e => catClassOk(e, { id: 'occultiste', name: 'Occultiste' })).map(o => o[0]); });
    ok(!r.includes('cat:sc-occultiste-celeste') && r.includes('cat:sc-occultiste-archifee'), 'catalogue filtré');
  });
 
  await test('Sans Claude : la relecture propose seulement de fermer', async p => {
    await open(p, { noSample: true });
    await newWizardChar(p, { cls: 'guerrier', bg: 'cat:bg-artisan', sp: 'srd:humain' });
    ok(await p.evaluate(() => !!document.querySelector('#modal [data-act="rvClose"]') && !document.querySelector('#modal [data-act="rvGo"]')), 'boutons');
  });
 
  await test('À la table : ouverture et carte de détails', async p => {
    await open(p);
    await newWizardChar(p, { cls: 'occultiste', bg: 'srd:sage', sp: 'srd:humain' });
    await p.evaluate(() => { S.rv = null; renderModal(); S.tab = 'table'; render(); });
    ok(await p.evaluate(() => (S.Titems || []).length > 20 && !!document.querySelector('.tpanels')), 'tuiles et éléments');
    await p.click('.tpanels .tpbtn'); ok(await p.evaluate(() => !!document.querySelector('.tpop')), 'popup');
  });

  await test('À la table : la recherche propose de trouver une mécanique, pas de décrire une intention', async p => {
    await open(p);
    await newWizardChar(p, { cls: 'occultiste', bg: 'srd:sage', sp: 'srd:humain' });
    await p.evaluate(() => { S.rv = null; renderModal(); S.tab = 'table'; render(); });
    const r = await p.evaluate(() => { const i = document.querySelector('#tq'); return { ph: i && i.placeholder, label: i && i.getAttribute('aria-label') }; });
    eq(r, { ph: 'Trouver un jet, une action, un sort…', label: 'Recherche rapide' }, 'texte de la recherche');
    ok(await p.evaluate(() => !document.body.innerHTML.includes('Que fais-tu')), 'ancien texte absent');
  });

  // Historique des jets : jets fabriqués pour le test (dates locales construites dans la page).
  async function histSetup(p, spec) {
    await open(p);
    await newWizardChar(p, { cls: 'guerrier', bg: 'srd:soldat', sp: 'srd:humain' });
    await p.evaluate(spec => {
      cur().rollLog = spec.map(([label, total, d, h, mi, s, extra]) => Object.assign({ label, total, bd: 'd20 ' + total, t: new Date(2026, 10, d, h, mi, s || 0).getTime() }, extra || {}));
      S.rv = null; renderModal(); S.tab = 'table'; render();
    }, spec);
    await p.click('[data-act="tpop"][data-v="hist"]');
  }
  const histRowsShown = p => p.evaluate(() => [...document.querySelectorAll('.thist .throw')].map(r => r.querySelector('.thl b').textContent));

  await test('Historique : un jour à la fois, le plus récent par défaut', async p => {
    await histSetup(p, [['Initiative', 15, 8, 21, 0], ['Perception', 12, 8, 20, 30], ['Arcanes', 9, 8, 20, 0], ['Médecine', 14, 7, 22, 0], ['Discrétion', 7, 7, 21, 0]]);
    const chips = await p.evaluate(() => [...document.querySelectorAll('[data-act="histDay"]')].map(b => [b.dataset.v, b.getAttribute('aria-pressed'), b.textContent.replace(/\s+/g, ' ').trim()]));
    eq(chips.map(c => [c[0], c[1]]), [['2026-11-08', 'true'], ['2026-11-07', 'false']], 'pastilles des jours');
    ok(/\(3\)$/.test(chips[0][2]) && /\(2\)$/.test(chips[1][2]), 'nombre de jets par jour : ' + chips.map(c => c[2]).join(' | '));
    eq(await histRowsShown(p), ['Initiative', 'Perception', 'Arcanes'], 'jets du jour le plus récent');
    await p.click('[data-act="histDay"][data-v="2026-11-07"]');
    eq(await histRowsShown(p), ['Médecine', 'Discrétion'], 'jets du jour choisi');
    ok(await p.evaluate(() => !!document.querySelector('.thist .thbd')), 'détail des dés en ligne secondaire');
  });

  await test('Historique : attaque et dégâts regroupés sur une ligne, suppression des deux', async p => {
    await histSetup(p, [
      ['Canne-épée · dégâts', 8, 8, 20, 0, 10], ['Canne-épée — toucher', 14, 8, 20, 0, 0, { crit: false }],
      ['Décharge occulte · dégâts', 6, 8, 19, 50], ['Initiative', 12, 8, 19, 45],
      ['Lumière guérisseuse · soins', 7, 8, 19, 20], ['Canne-épée — toucher', 9, 8, 19, 0],
      ['Arc long · dégâts', 5, 8, 18, 30], ['Arc long — toucher', 20, 8, 18, 0, 0, { crit: true }]]);
    eq(await histRowsShown(p), ['Canne-épée', 'Décharge occulte · dégâts', 'Initiative', 'Lumière guérisseuse · soins', 'Canne-épée — toucher', 'Arc long · dégâts', 'Arc long — toucher'], 'une seule paire (même nom, moins de 10 minutes)');
    const pair = await p.evaluate(() => { const r = document.querySelector('.thpair'); return [...r.querySelectorAll('.thv2 b')].map(b => b.textContent).concat(r.querySelector('.thbd').textContent); });
    eq(pair, ['14', '8', 'toucher d20 14 · dégâts d20 8'], 'totaux et détail de la paire');
    await p.click('.thpair .thdel');
    eq(await p.evaluate(() => cur().rollLog.map(e => e.label)), ['Décharge occulte · dégâts', 'Initiative', 'Lumière guérisseuse · soins', 'Canne-épée — toucher', 'Arc long · dégâts', 'Arc long — toucher'], 'les deux jets de la paire supprimés');
    await p.click('.thist .throw:nth-child(2) .thdel');
    eq(await p.evaluate(() => cur().rollLog.map(e => e.label)), ['Décharge occulte · dégâts', 'Lumière guérisseuse · soins', 'Canne-épée — toucher', 'Arc long · dégâts', 'Arc long — toucher'], 'suppression d’une ligne simple');
  });

  await test('Historique : 30 lignes puis « Voir plus », remise à zéro en changeant de jour', async p => {
    const spec = []; for (let i = 0; i < 45; i++) spec.push(['Jet ' + (i + 1), 10, 8, 22, 59 - i, 0]); spec.push(['Veille', 3, 7, 20, 0]);
    await histSetup(p, spec);
    eq((await histRowsShown(p)).length, 30, '30 lignes d’abord');
    eq(await p.evaluate(() => document.querySelector('.thmore').textContent), 'Voir plus (15)', 'bouton');
    await p.click('.thmore');
    eq((await histRowsShown(p)).length, 45, 'toutes les lignes');
    ok(await p.evaluate(() => !document.querySelector('.thmore')), 'bouton retiré');
    await p.click('[data-act="histDay"][data-v="2026-11-07"]'); await p.click('[data-act="histDay"][data-v="2026-11-08"]');
    eq((await histRowsShown(p)).length, 30, 'retour à 30 lignes');
  });

  // Équipement : glisser-déposer. Sac fabriqué pour le test.
  async function eqDragSetup(p) {
    await p.setViewportSize({ width: 1200, height: 1500 });
    await open(p);
    await newWizardChar(p, { cls: 'guerrier', bg: 'srd:soldat', sp: 'srd:humain' });
    await p.evaluate(() => {
      const ch = cur(); ch.equip = {}; ch.shield = false; ch.armor = 'none'; ch.attuned = [];
      ch.bag = [['b1', 'Épée longue'], ['b2', 'Dague'], ['b3', 'Bouclier'], ['b4', 'Anneau de protection'], ['b5', 'Cotte de mailles'], ['b6', 'Potion de soins']].map(([id, name]) => ({ id, name, qty: 1 }));
      S.rv = null; renderModal(); S.tab = 'table'; render(); S.T.pop = 'equip'; S.T.eqSlot = null; render();
    });
  }
  const eqNow = p => p.evaluate(() => JSON.parse(JSON.stringify(cur().equip || {})));
  const center = async (p, sel) => { const b = await p.locator(sel).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  async function mouseDrag(p, from, to, during) {
    const [x0, y0] = await center(p, from), [x1, y1] = await center(p, to);
    // Trois mouvements suffisent (seuil de 6 px, survol, dépôt) ; sans carte graphique, chaque mouvement coûte une image.
    await p.mouse.move(x0, y0); await p.mouse.down(); await p.mouse.move(x0 + 12, y0 + 12); await p.mouse.move(x1, y1, { steps: 2 });
    if (during) await during();
    await p.mouse.up(); await p.waitForTimeout(30);
  }
  const slot = k => `.eqcard[data-v="${k}"]`, bagItem = id => `.eqbag[data-id="${id}"]`;

  await test('Équipement : glisser-déposer à la souris (sac, échange, refus, retrait)', async p => {
    await eqDragSetup(p);
    eq(await p.evaluate(() => [...document.querySelectorAll('.eqbag')].map(e => e.dataset.id)), ['b1', 'b2', 'b3', 'b4', 'b5'], 'sac : objets équipables seulement');
    await mouseDrag(p, bagItem('b1'), slot('mainP')); eq((await eqNow(p)).mainP, 'b1', 'épée du sac vers la main principale');
    await mouseDrag(p, bagItem('b2'), slot('mainS')); eq((await eqNow(p)).mainS, 'b2', 'dague du sac vers la main secondaire');
    await mouseDrag(p, slot('mainP'), slot('mainS')); const sw = await eqNow(p); eq([sw.mainP, sw.mainS], ['b2', 'b1'], 'échange des deux mains');
    await mouseDrag(p, bagItem('b3'), slot('mainP'), async () => {
      const c = await p.evaluate(() => ({ ghost: !!document.querySelector('.eqghost'), mainP: document.querySelector('.eqcard[data-v="mainP"]').className, mainS: document.querySelector('.eqcard[data-v="mainS"]').className, corps: document.querySelector('.eqcard[data-v="corps"]').className }));
      ok(c.ghost && /eqno/.test(c.mainP) && /eqok/.test(c.mainS) && /eqno/.test(c.corps), 'cibles valides allumées : ' + JSON.stringify(c));
    });
    eq((await eqNow(p)).mainP, 'b2', 'bouclier refusé en main principale');
    await mouseDrag(p, bagItem('b3'), slot('mainS'));
    eq(await p.evaluate(() => [cur().equip.mainS, cur().shield, !!document.querySelector('.eqbag[data-id="b1"]')]), ['b3', true, true], 'bouclier en main secondaire, l’épée retourne au sac');
    await mouseDrag(p, slot('mainP'), slot('mainS')); eq((await eqNow(p)).mainP, 'b2', 'échange refusé : le bouclier ne va pas en main principale');
    await mouseDrag(p, bagItem('b5'), slot('corps')); eq(await p.evaluate(() => [cur().equip.corps, cur().armor]), ['b5', 'srd:cotte-de-mailles'], 'armure');
    await mouseDrag(p, bagItem('b4'), slot('anneau1')); await mouseDrag(p, slot('anneau1'), slot('anneau2'));
    eq(await p.evaluate(() => [cur().equip.anneau1 || null, cur().equip.anneau2]), [null, 'b4'], 'anneau déplacé');
    await mouseDrag(p, slot('mainS'), '.eqsac');
    eq(await p.evaluate(() => [cur().equip.mainS || null, cur().shield]), [null, false], 'bouclier retiré en le glissant vers le sac');
    eq(await p.evaluate(() => [S.T.eqSlot || null, !!document.querySelector('.eqghost,.eqok,.eqno,.eqsrc')]), [null, false], 'aucune liste ouverte, aucun reste du glisser');
    await p.evaluate(() => { eqSet(cur(), 'mainP', 'b6'); eqSet(cur(), 'mainS', 'b1'); render(); });
    await mouseDrag(p, slot('mainS'), slot('mainP')); const tr = await eqNow(p); eq([tr.mainP, tr.mainS], ['b1', 'b6'], 'échange avec un objet quelconque tenu en main (comme la liste)');
    await p.click(slot('mainP')); eq(await p.evaluate(() => S.T.eqSlot), 'mainP', 'toucher un emplacement ouvre toujours la liste');
  });

  await test('Équipement : au doigt, appui long pour glisser, glisser rapide ignoré', async p => {
    await eqDragSetup(p);
    const touchDrag = (from, to, wait) => p.evaluate(async ([from, to, wait]) => {
      const c = el => { const r = el.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; };
      const fire = (type, x, y, t) => t.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, button: 0 }));
      const a = document.querySelector(from), [x0, y0] = c(a), [x1, y1] = c(document.querySelector(to));
      fire('pointerdown', x0, y0, a); await new Promise(r => setTimeout(r, wait));
      for (let i = 1; i <= 6; i++) fire('pointermove', x0 + (x1 - x0) * i / 6, y0 + (y1 - y0) * i / 6, document);
      fire('pointerup', x1, y1, document); await new Promise(r => setTimeout(r, 50));
    }, [from, to, wait]);
    await touchDrag(bagItem('b1'), slot('mainP'), 80);
    eq((await eqNow(p)).mainP || null, null, 'glisser rapide = défilement, aucun changement');
    await touchDrag(bagItem('b1'), slot('mainP'), 450);
    eq((await eqNow(p)).mainP, 'b1', 'appui long puis glisser : équipé');
    ok(await p.evaluate(() => !document.querySelector('.eqghost')), 'fantôme retiré');
  });

  // Typographie : toute taille de texte visible appartient à l'échelle (11, 13, 16, 18, 22, 28 px) ou est un grand chiffre décoratif (32 px et plus).
  const FS_SCALE = [11, 13, 16, 18, 22, 28];
  const fsOutside = p => p.evaluate(scale => {
    const bad = new Set();
    const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden') return false; } return true; };
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { if (!n.nodeValue.trim()) continue; const el = n.parentElement; if (!el || el.closest('script,style,.portrait-edit') || !vis(el)) continue;
      const f = Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10; if (!scale.includes(f) && f < 32) bad.add(f + 'px ' + el.tagName.toLowerCase() + '.' + [...el.classList].join('.')); }
    return [...bad];
  }, FS_SCALE);

  await test('Typographie : une seule échelle de tailles (fiche, À la table, popups, téléphone et ordinateur)', async p => {
    for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
      await p.setViewportSize(vp);
      await open(p);
      await newWizardChar(p, { cls: 'occultiste', bg: 'srd:sage', sp: 'srd:humain' });
      await p.evaluate(() => { S.rv = null; renderModal(); });
      const bad = new Set();
      for (const t of ['jeu', 'comp', 'sorts', 'apt', 'inv', 'notes', 'build', 'table']) { await p.evaluate(t => { S.tab = t; render(); }, t); (await fsOutside(p)).forEach(x => bad.add(t + ' : ' + x)); }
      for (const k of ['skills', 'saves', 'cond', 'inv', 'notes', 'hist', 'equip', 'hpmax', 'rest']) { await p.evaluate(k => { S.T.pop = k; S.T.eqSlot = null; render(); }, k); (await fsOutside(p)).forEach(x => bad.add(k + ' : ' + x)); }
      await p.evaluate(() => { S.T.pop = null; S.view = 'list'; render(); }); (await fsOutside(p)).forEach(x => bad.add('liste : ' + x));
      eq([...bad], [], 'tailles hors échelle en ' + vp.width + ' px');
    }
  });

  // Écran tactile : cibles de 44×44 minimum ; croix de fermeture identiques ; corbeilles pour supprimer. Ordinateur : densité conservée.
  const touchSmall = p => p.evaluate(() => {
    const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden') return false; } return true; };
    const root = document.querySelector('.tpop') || document.body, bad = new Set();
    root.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,summary,[data-act]:not([data-act=noop]):not(.tpopback),[role=button]').forEach(el => {
      if (!vis(el) || (el.closest('.tpopback') && !el.closest('.tpop'))) return;
      if (el.matches('input[type=checkbox],input[type=radio]')) { const l = el.closest('label'); if (l && l.getBoundingClientRect().height >= 43.5) return; }
      const r = el.getBoundingClientRect();
      if (el.matches('.tipl')) { if (r.height < 43.5) bad.add('terme ' + el.textContent.trim().slice(0, 15) + ' h' + Math.round(r.height)); return; } // mot d'aide dans le texte : hauteur seulement
      const inScroller = !!el.parentElement && (() => { for (let a = el.parentElement; a; a = a.parentElement) if (/(auto|scroll)/.test(getComputedStyle(a).overflowX) && a.scrollWidth > a.clientWidth) return true; return false; })(); // atteignable en faisant défiler sa zone (barre d'onglets)
      if (!inScroller && (r.right > innerWidth + 1 || r.left < -1)) bad.add('hors écran ' + el.tagName.toLowerCase() + '[' + (el.dataset.act || '') + '] ' + (el.getAttribute('aria-label') || el.textContent).trim().slice(0, 20));
      if (r.width < 43.5 || r.height < 43.5) bad.add(el.tagName.toLowerCase() + '.' + [...el.classList].join('.') + '[' + (el.dataset.act || '') + '] ' + Math.round(r.width) + '×' + Math.round(r.height));
    });
    return [...bad];
  });
  const closeSizes = p => p.evaluate(() => [...document.querySelectorAll('[aria-label^="Fermer"]')].filter(e => e.getBoundingClientRect().width > 0).map(e => { const r = e.getBoundingClientRect(); return Math.round(r.width) + '×' + Math.round(r.height) + ' ' + getComputedStyle(e).fontSize; }));

  await test('Écran tactile : cibles de 44×44, croix de fermeture identiques, corbeilles', async p => {
    const ctx = await p.context().browser().newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const t = await ctx.newPage(); const errs = []; t.on('pageerror', e => errs.push(e.message)); await t.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    try {
      await open(t);
      await newWizardChar(t, { cls: 'occultiste', bg: 'srd:sage', sp: 'srd:humain' });
      await t.evaluate(() => { S.rv = null; renderModal(); const ch = cur();
        ch.bag = [{ id: 'z1', name: 'Dague', qty: 2 }, { id: 'z2', name: 'Trousseau de clés de la mine de l’Œil-de-Pierre (à rendre à la guilde)', qty: 1 }, { id: 'z3', name: 'Trousse de soins', qty: 1, charges: { auto: false, max: 10, rec: '', used: 0, when: 'long' } }, ...(ch.bag || [])];
        ch.rollLog = [{ label: 'Initiative', total: 12, bd: 'd20 11 +1', t: Date.now() }]; ch.conditions = ['Empoisonné']; });
      const bad = new Set(), closes = new Set();
      for (const tab of ['jeu', 'comp', 'sorts', 'apt', 'inv', 'notes', 'build', 'table']) { await t.evaluate(tab => { S.T && (S.T.pop = null); S.tab = tab; render(); }, tab); (await touchSmall(t)).forEach(x => bad.add(tab + ' : ' + x)); }
      for (const k of ['skills', 'saves', 'cond', 'inv', 'notes', 'hist', 'equip', 'hpmax', 'rest']) { await t.evaluate(k => { S.T.pop = k; S.T.eqSlot = null; render(); }, k); (await touchSmall(t)).forEach(x => bad.add(k + ' : ' + x)); (await closeSizes(t)).forEach(x => closes.add(x)); }
      await t.evaluate(() => { S.T.pop = null; render(); tSelect(S.Titems.find(i => i.kind === 'init').key); }); await t.click('#t-d1');
      (await closeSizes(t)).forEach(x => closes.add(x));
      eq([...bad], [], 'cibles tactiles trop petites');
      eq([...closes], ['44×44 28px'], 'croix de fermeture (popups et pavé numérique)');
      await t.evaluate(() => { closeDicePad && closeDicePad(); S.T.pop = 'inv'; render(); });
      const del = await t.evaluate(() => [...document.querySelectorAll('.btndel')].map(b => [!!b.querySelector('svg.ico'), b.textContent.includes('×')]));
      ok(del.length > 0 && del.every(([svg, x]) => svg && !x), 'suppression par une corbeille : ' + JSON.stringify(del));
      await t.evaluate(() => { S.T.pop = null; S.tab = 'jeu'; render(); });
      ok(await t.evaluate(() => document.getElementById('freeExpr').getBoundingClientRect().width >= 120), 'champ « Jet libre » lisible');
      ok(!errs.length, 'erreurs JS : ' + errs.join(' | '));
    } finally { await ctx.close(); }
    // Ordinateur (souris) : les petits boutons gardent leur taille, la croix reste identique.
    await open(p);
    await newWizardChar(p, { cls: 'occultiste', bg: 'srd:sage', sp: 'srd:humain' });
    await p.evaluate(() => { S.rv = null; renderModal(); S.tab = 'table'; render(); S.T.pop = 'hist'; render(); });
    const desk = await p.evaluate(() => ({ small: document.querySelector('.btn.small').getBoundingClientRect().height }));
    ok(desk.small < 40, 'densité conservée sur ordinateur : ' + desk.small);
    eq([...new Set(await closeSizes(p))], ['44×44 28px'], 'croix sur ordinateur (popup et bannière)');
  });
 
  await test('Thème : sombre par défaut, bouton du Menu pour passer en clair et revenir', async p => {
    await open(p);
    eq(await p.evaluate(() => document.documentElement.dataset.theme), 'dark', 'thème par défaut');
    await p.evaluate(() => { S.view = 'list'; render(); });
    ok(await p.evaluate(() => document.querySelectorAll('[data-act="theme"]').length === 1 && !!document.querySelector('#hchar [data-act="theme"]') && !document.querySelector('.hchar')), 'bouton sous Menu, plus de nom du perso en haut');
    await p.click('[data-act="theme"]');
    eq(await p.evaluate(() => [document.documentElement.dataset.theme, S.docs.prefs.theme, localStorage.getItem('registre-theme')]), ['light', 'light', 'light'], 'mode clair');
    ok(await p.evaluate(() => { const m = getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number); return m[0] + m[1] + m[2] > 600; }), 'fond clair');
    ok(await p.evaluate(() => document.querySelector('[data-act="theme"]').textContent === 'Mode sombre'), 'libellé du bouton');
    await p.click('[data-act="theme"]'); eq(await p.evaluate(() => document.documentElement.dataset.theme), 'dark', 'retour au sombre');
  });
 
  await test('À la table : tuile Repos (court ou long), PV max « aucun », alignement', async p => {
    await open(p);
    await newWizardChar(p, { cls: 'occultiste', bg: 'srd:sage', sp: 'srd:humain' });
    await p.evaluate(() => { S.rv = null; renderModal(); S.tab = 'table'; const ch = cur(); ch.hp.cur = 3; ch.pactUsed = 1; ch.hdUsed = 1; render(); });
    ok(await p.evaluate(() => !document.querySelector('.trestop') && document.querySelector('.health-adjust b').innerText === '0'), 'plus de boutons de repos en haut, PV max à 0');
    const al = await p.evaluate(() => [document.querySelector('.table-overview').getBoundingClientRect().left, document.querySelector('.tgrid').getBoundingClientRect().left]);
    ok(Math.abs(al[0] - al[1]) < 2, 'bords gauches alignés : ' + al);
    await p.click('[data-act="restOpen"][data-v=""]');
    ok(await p.evaluate(() => S.T.pop === 'rest' && !document.querySelector('[data-act="restShort"]') && !document.querySelector('[data-act="restLong"]')), 'choix du repos');
    await p.click('[data-act="restKind"][data-v="court"]'); ok(await p.evaluate(() => !!document.querySelector('[data-act="restShort"]')), 'repos court');
    await p.click('[data-act="restShort"]'); eq(await p.evaluate(() => [cur().pactUsed, cur().hp.cur, S.T.pop]), [0, 3, null], 'repos court : pacte récupéré, PV inchangés');
    await p.click('[data-act="restOpen"][data-v=""]'); await p.click('[data-act="restKind"][data-v="long"]'); await p.click('[data-act="restLong"]');
    eq(await p.evaluate(() => [cur().hp.cur === derive(cur()).hpMax, cur().hdUsed, S.T.pop]), [true, 0, null], 'repos long : PV et dés de vie');
    await p.click('.health-dice'); ok(await p.evaluate(() => !S.T.pop), 'toucher les dés de vie n’ouvre rien');
    ok(await p.evaluate(() => !!document.querySelector('.health-footer [data-act="restOpen"]') && !document.querySelector('.tpanels [data-act="restOpen"]')), 'bouton Repos à côté d’Inspiration, plus de tuile');
    await p.click('.health-footer [data-act="restOpen"]'); ok(await p.evaluate(() => document.querySelectorAll('.restpick .restcard').length === 2), 'deux cartes séparées');
  });
 
  await test('Portrait : image réduite et enregistrée dans la fiche', async p => {
    await open(p);
    await newWizardChar(p, { cls: 'guerrier', bg: 'srd:soldat', sp: 'srd:humain' });
    await p.evaluate(() => { S.rv = null; renderModal(); render(); });
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR42mP8z8Dwn4EIwDiqkL4KAX9eCgEj+3wuAAAAAElFTkSuQmCC', 'base64');
    await p.evaluate(() => document.querySelector('.character-portrait').click());
    await p.evaluate(() => render()); // un rendu pendant le choix de l'image ne doit plus perdre le champ
    await p.setInputFiles('#portrait-file', { name: 'p.png', mimeType: 'image/png', buffer: png });
    await p.waitForFunction(() => !!cur().portrait);
    ok(await p.evaluate(() => /^data:image\/(webp|jpeg);base64,/.test(cur().portrait) && !!document.querySelector('.character-portrait img')), 'portrait affiché');
  });
 
  await test('Message « Mode local » : la croix le ferme et la fermeture est retenue', async p => {
    await open(p);
    ok(await p.evaluate(() => document.getElementById('banner').innerText.includes('Mode local')), 'message affiché');
    await p.click('#banner [data-act="bannerClose"]');
    ok(await p.evaluate(() => !document.getElementById('banner').innerText.trim()), 'message fermé');
    await p.reload(); await p.waitForFunction(() => typeof S !== 'undefined' && S.C);
    ok(await p.evaluate(() => !document.getElementById('banner').innerText.includes('Mode local')), 'reste fermé au rechargement');
  });

  await test('Sauvegarde : une nouvelle seed ne remplace jamais les personnages locaux', async p => {
    await open(p);
    const r = await p.evaluate(() => {
      const local = { perso_garde: { type: 'perso', name: 'À garder', level: 2 } };
      localStorage.setItem('registre-docs', JSON.stringify(local)); // ancien format, encore accepté
      document.getElementById('seed-docs').textContent = JSON.stringify({ at: Date.now() + 1, dataVersion: DATA_VERSION, docs: { perso_seed: { type: 'perso', name: 'Seed', level: 1 } } });
      S.docs = {}; loadLocal();
      return Object.keys(S.docs);
    });
    eq(r, ['perso_garde'], 'personnage local conservé');
  });

  await test('Sauvegarde : format versionné et ancien format migré', async p => {
    await open(p);
    const r = await p.evaluate(() => {
      localStorage.setItem('registre-docs', JSON.stringify({ perso_ancien: { type: 'perso', name: 'Ancien', level: 1 } }));
      S.docs = {}; loadLocal(); S.docs.perso_ancien.level = 2; touch('perso_ancien'); flushLocalNow();
      const saved = JSON.parse(localStorage.getItem('registre-docs'));
      let future = ''; try { importPack({ registre: 1, dataVersion: DATA_VERSION + 1, perso: { name: 'Futur' } }); } catch (e) { future = e.message; }
      return { registre: saved.registre, version: saved.dataVersion, level: saved.docs.perso_ancien.level, future };
    });
    eq(r, { registre: 1, version: 1, level: 2, future: 'version' }, 'enveloppe et contrôle de version');
  });

  await test('Sauvegarde : échec visible et données conservées comme sales', async p => {
    await open(p);
    const r = await p.evaluate(() => {
      S.docs.perso_test = { type: 'perso', name: 'Test', level: 1 }; touch('perso_test');
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function () { const e = new DOMException('plein', 'QuotaExceededError'); throw e; };
      const okSave = flushLocalNow(), banner = document.getElementById('banner').innerText;
      Storage.prototype.setItem = original;
      return { okSave, dirty: !!S.dirty.perso_test, banner };
    });
    ok(!r.okSave && r.dirty, 'échec retenu');
    ok(/Échec.*sauvegarde|stockage.*plein/i.test(r.banner), 'message visible : ' + r.banner);
  });

  await test('Sauvegarde : pagehide écrit immédiatement sans attendre 700 ms', async p => {
    await open(p);
    const r = await p.evaluate(() => {
      S.docs.perso_rapide = { type: 'perso', name: 'Rapide', level: 1 }; touch('perso_rapide');
      window.dispatchEvent(new PageTransitionEvent('pagehide'));
      const saved = JSON.parse(localStorage.getItem('registre-docs'));
      return { present: !!saved.docs.perso_rapide, version: saved.dataVersion, dirty: !!S.dirty.perso_rapide };
    });
    eq(r, { present: true, version: 1, dirty: false }, 'sauvegarde immédiate');
  });

  await test('Import : export valide accepté, fichiers dangereux ou incohérents refusés sans ajout partiel', async p => {
    await open(p);
    const r = await p.evaluate(() => {
      const perso = { type: 'perso', name: 'Importé', level: 3, abilities: { for: 8, dex: 12, con: 14, int: 10, sag: 13, cha: 17 }, attacks: [], bag: [], conditions: [], counters: [], feats: [], features: [], invocations: [], items: [], spells: [], hp: { cur: 20, temp: 0 } };
      const id = importPack({ registre: 1, dataVersion: 1, perso, hb: [{ _id: 'test-sort', type: 'hb', kind: 'sort', name: 'Sort test', text: '' }] });
      const count = Object.keys(S.docs).length, errors = [];
      for(const bad of [
        { registre: 1, perso: Object.assign({}, perso, { level: 99 }) },
        { registre: 1, perso: Object.assign({}, perso, { abilities: { for: 8 } }) },
        { registre: 1, perso, hb: [{ _id: 'x', type: 'hb', name: '' }] },
        JSON.parse('{"registre":1,"perso":{"type":"perso","name":"X","level":1,"abilities":{"for":8,"dex":8,"con":8,"int":8,"sag":8,"cha":8},"__proto__":{"polluted":true}}}')
      ]){ try { importPack(bad); errors.push('accepté'); } catch (e) { errors.push(e.message); } }
      return { name: S.docs[id].name, errors, unchanged: Object.keys(S.docs).length === count, polluted: ({}).polluted || false };
    });
    eq(r.name, 'Importé', 'export valide');
    eq(r.errors, ['import_invalid', 'import_invalid', 'import_invalid', 'import_invalid'], 'exports invalides');
    ok(r.unchanged && !r.polluted, 'aucun ajout partiel ni pollution');
  });

  await test('Application vierge et copie personnelle clairement distinguées', async p => {
    await open(p);
    const r = await p.evaluate(() => ({ seed: document.getElementById('seed-docs').textContent.trim(), text: document.getElementById('app').innerText }));
    eq(r.seed, 'null', 'application distribuée sans personnage intégré');
    ok(r.text.includes('Télécharger ma copie personnelle') && r.text.includes("L'application distribuée est vierge"), 'avertissement visible');
  });
 
  await test('Navigation : « À la table » et « Fiche » restent sur le perso affiché', async p => {
    await open(p);
    const ids = await p.evaluate(() => { const a = (S.W = wNew(), Object.assign(S.W, { cls: 'guerrier', bg: 'srd:soldat', sp: 'srd:humain', name: 'Premier', method: 'std', std: { for: 15, dex: 14, con: 13, int: 12, sag: 10, cha: 8 } }), wCreate(), S.cur);
      const b = (S.W = wNew(), Object.assign(S.W, { cls: 'occultiste', bg: 'srd:sage', sp: 'srd:humain', name: 'Second', method: 'std', std: { for: 8, dex: 12, con: 15, int: 10, sag: 13, cha: 17 } }), wCreate(), S.cur);
      S.rv = null; renderModal(); setMain(a); S.view = 'list'; S.cur = null; render(); return [a, b]; });
    await p.click(`[data-act="open"][data-id="${ids[1]}"]`);
    await p.click('#nav [data-v="table"]'); eq(await p.evaluate(() => [S.cur, S.tab]), [ids[1], 'table'], 'À la table');
    await p.click('#nav [data-v="main"]'); eq(await p.evaluate(() => [S.cur, S.tab]), [ids[1], 'jeu'], 'Fiche de personnage');
    await p.click('#nav [data-v="hb"]'); await p.click('#nav [data-v="table"]'); eq(await p.evaluate(() => S.cur), ids[1], 'retour depuis Contenu perso');
  });
 

  // Saisie physique terminée sans le pavé (clavier) : le jet est appliqué au changement de valeur.
  async function physType(p, sel, value) { await p.fill(sel, value); await p.dispatchEvent(sel, 'change'); }
  async function diceTable(p, cls = 'guerrier') {
    await open(p);
    await newWizardChar(p, { cls, bg: 'srd:soldat', sp: 'srd:humain' });
    await p.evaluate(() => { S.rv = null; renderModal(); S.tab = 'table'; render(); });
  }

  await test('Dés : verrou par défaut, global entre personnages, persistant dans le navigateur', async p => {
    await diceTable(p);
    eq(await p.getAttribute('[data-act="virtualDice"]', 'aria-checked'), 'false', 'désactivés par défaut');
    const first = await p.evaluate(() => S.cur);
    await p.click('[data-act="virtualDice"]');
    eq(await p.evaluate(() => [virtualDiceEnabled(), localStorage.getItem(VIRTUAL_DICE_KEY)]), [true, '1'], 'activation enregistrée');
    await newWizardChar(p, { cls: 'occultiste', bg: 'srd:sage', sp: 'srd:humain' });
    await p.evaluate(() => { S.rv = null; renderModal(); S.tab = 'table'; render(); });
    eq(await p.getAttribute('[data-act="virtualDice"]', 'aria-checked'), 'true', 'second personnage');
    await p.reload(); await p.waitForFunction(() => S.C && S.CAT);
    ok(await p.evaluate(() => virtualDiceEnabled()), 'activation après rechargement');
    await p.evaluate(id => { S.cur=id; S.view='sheet'; S.tab='table'; render(); }, first);
    await p.click('[data-act="virtualDice"]');
    await p.reload(); await p.waitForFunction(() => S.C && S.CAT);
    eq(await p.evaluate(() => [virtualDiceEnabled(), persos().some(c => 'virtualDice' in c)]), [false, false], 'désactivation persistante et aucune préférence dans un personnage');
  });

  await test('Dés : chaque événement aléatoire est bloqué sans tirage ni dépense', async p => {
    await diceTable(p);
    const r=await p.evaluate(() => {
      let calls=0; const original=crypto.getRandomValues.bind(crypto);
      crypto.getRandomValues=()=>{ calls++; throw new Error('tirage interdit'); };
      const before=JSON.stringify(cur()), log=S.log.length;
      for(const a of VIRTUAL_ACTIONS){
        const b=document.createElement('button'); b.dataset.act=a; document.body.appendChild(b); b.click(); b.remove();
      }
      rollD20('test',4); rollDmg('test','2d6+4',true);
      let refused=0; for(const fn of [()=>rnd(20),()=>rollExpr('2d6+4')]) try{ fn(); }catch(e){ refused++; }
      crypto.getRandomValues=original;
      return {calls,unchanged:before===JSON.stringify(cur()),sameLog:log===S.log.length,refused};
    });
    eq(r,{calls:0,unchanged:true,sameLog:true,refused:2},'verrou mécanique');
  });

  await test('Dés : boutons masqués dans toutes les cartes et réaffichés après activation', async p => {
    await diceTable(p,'occultiste');
    const r=await p.evaluate(() => {
      let count=0;
      for(const i of [...S.Titems]){
        tSelect(i.key);
        for(const b of document.querySelectorAll('[data-virtual]')){
          count++; if(getComputedStyle(b).display!=='none') throw new Error('Bouton visible : '+b.dataset.act);
        }
      }
      S.T.pop=null; setVirtualDice(true); render();
      let shown=0;
      for(const i of [...S.Titems]){
        tSelect(i.key);
        for(const b of document.querySelectorAll('[data-virtual]')) if(getComputedStyle(b).display!=='none') shown++;
      }
      return [count>0,shown>0];
    });
    eq(r,[true,true],'cartes');
    await p.evaluate(() => { setVirtualDice(false); S.view='wizard'; S.W=wNew(); S.W.cls='guerrier'; S.W.step=3; S.W.method='dice'; render(); });
    // All random-producing controls, including wizard and legacy sheet, carry the marker.
    const unmarked=await p.evaluate(() => [...document.querySelectorAll('[data-act]')].filter(b=>VIRTUAL_ACTIONS.has(b.dataset.act)&&!b.hasAttribute('data-virtual')).map(b=>b.dataset.act));
    eq(unmarked,[],'contrôles protégés');
    for(const action of ['r20','dmg','cast','sdmg','death','spendhd','pool','wroll','tvroll','tvdmg','hdvirt','ccroll','smiteRoll']){
      ok(HTML_SOURCE.includes('data-virtual data-act="'+action+'"'), 'marqueur '+action);
    }
    ok(!await p.isVisible('[data-act="wroll"]'),'création : lancer masqué');
    await p.fill('[data-w="dice.0"]','15'); await p.locator('[data-w="dice.0"]').blur();
    eq(await p.evaluate(() => S.W.dice[0]),'15','création : dé physique accepté');
    await p.evaluate(() => { S.W.dice[0]=''; setVirtualDice(true); render(); });
    await p.click('[data-act="wroll"]');
    ok(await p.evaluate(() => S.W.rolled && S.W.dice.every(v=>v>=3&&v<=18)),'création : six jets déverrouillés');

  });

  await test('Dés physiques : désavantage 13 et 7, bonus +4, total 11 ; avantage et état', async p => {
    await diceTable(p);
    await p.evaluate(() => { cur().abilities.dex=18; render(); tSelect(S.Titems.find(i=>i.kind==='init').key); });
    await p.click('[data-act="tmode"][data-v="d"]');
    await p.fill('#t-d1','13'); await p.fill('#t-d2','7'); await p.locator('#t-d2').blur();
    const text=await p.innerText('#t-tot');
    ok(text.includes('Désavantage : 13 et 7 → 7 retenu')&&text.includes('Bonus : +4')&&text.includes('Total : 11'),text);
    eq(await p.evaluate(() => cur().rollLog[0].total),11,'historique physique');
    await p.click('[data-act="tmode"][data-v="a"]');
    await p.fill('#t-d1','13'); await p.fill('#t-d2','7'); await p.locator('#t-d2').blur();
    ok((await p.innerText('#t-tot')).includes('Total : 17'),'avantage');
    await p.fill('#t-d1','20'); await p.locator('#t-d1').blur();
    eq(await p.evaluate(() => cur().rollLog[0].total),24,'modification du premier dé également enregistrée');
    await p.evaluate(() => { cur().conditions=['Invisible']; cur().exhaustion=1; render(); tSelect(S.Titems.find(i=>i.kind==='init').key); });
    eq(await p.evaluate(() => [S.T.mode,document.getElementById('t-tot').dataset.mod]),['a','2'],'avantage et épuisement conservés');
    await p.fill('#t-d1','13'); await p.fill('#t-d2','7');
    ok((await p.innerText('#t-tot')).includes('Total : 15'),'calcul avec épuisement');
    const before=await p.evaluate(() => cur().rollLog.length);
    await p.fill('#t-d2','21'); await p.locator('#t-d2').blur();
    eq(await p.evaluate(() => cur().rollLog.length),before,'dé invalide ignoré');
    ok((await p.innerText('#t-tot')).includes('entier de 1 à 20'),'validation visible');
  });

  await test('Dés : attaques, dégâts physiques, critique virtuel et reverrouillage immédiat', async p => {
    await diceTable(p);
    await p.evaluate(() => tSelect(S.Titems.find(i=>i.kind==='atk').key));
    await physType(p,'#t-dmg','9');
    const flat=await p.evaluate(() => +document.getElementById('t-dtot').dataset.flat);
    ok((await p.innerText('#t-dtot')).includes('Total : '+(9+flat)),'dés et bonus séparés');
    eq(await p.evaluate(() => cur().rollLog[0].total),9+flat,'dégâts physiques');
    ok(!await p.isVisible('[data-act="tvdmg"][data-crit="1"]'),'critique caché');
    await p.evaluate(() => { setVirtualDice(true); render(); });
    ok(!await p.isVisible('#t-dmg'),'saisie physique masquée en mode virtuel');
    await p.click('[data-act="tvdmg"][data-crit="1"]');
    ok(await p.evaluate(() => cur().rollLog[0].bd.includes('Critique')),'critique virtuel enregistré');
    await p.click('[data-act="tvroll"]');
    ok(await p.evaluate(() => validDie(S.T.d1,20)),'attaque virtuelle');
    await p.evaluate(() => { setVirtualDice(false); render(); });
    ok(!await p.isVisible('[data-act="tvroll"]')&&await p.isVisible('#t-d1'),'reverrouillage et saisie physique');
  });

  await test('Dés physiques : concentration et dés de vie restent utilisables', async p => {
    await diceTable(p);
    await p.evaluate(() => { cur().conc='Sort test'; S.T.cc={dmg:10,mode:'d',d1:'',d2:'',res:null}; S.T.pop='concchk'; render(); });
    ok(!await p.isVisible('[data-act="ccroll"]'),'concentration virtuelle cachée');
    await p.fill('#cc-d1','19'); await p.fill('#cc-d2','18');
    await p.click('[data-form="cc"] button[type="submit"]');
    eq(await p.evaluate(() => S.T.cc.res.total),await p.evaluate(() => 18+derive(cur()).saves.con.val),'concentration physique');
    await p.click('[data-act="ccclose"]');
    await p.evaluate(() => { cur().hp.cur=1; S.T.pop='rest'; S.T.restKind='court'; render(); });
    ok(!await p.isVisible('[data-act="hdvirt"]'),'dé de vie virtuel caché');
    await p.fill('#t-hd','6'); await p.click('[data-form="hdroll"] button[type="submit"]');
    eq(await p.evaluate(() => cur().hdUsed),1,'dé de vie dépensé');
    ok(await p.evaluate(() => cur().hp.cur>1),'soins appliqués');
  });

  await test('Dés : formules libres physiques et virtuelles, verrou du formulaire', async p => {
    await diceTable(p);
    await p.evaluate(() => { S.tab='jeu'; render(); renderDice(); });
    await p.fill('#freeExpr','2d6+4'); await p.fill('[data-form="free"] [name="physical"]','7');
    await p.click('[data-form="free"] button:not([data-virtual])');
    eq(await p.evaluate(() => S.log[0].total),11,'formule physique');
    ok(!await p.isVisible('[data-form="free"] [name="virtual"]'),'lancer libre caché');
    await p.evaluate(() => { setVirtualDice(true); render(); renderDice(); });
    await p.fill('#freeExpr','2d6+4'); await p.click('[data-form="free"] [name="virtual"]');
    ok(await p.evaluate(() => S.log[0].total>=6&&S.log[0].total<=16),'formule virtuelle');
  });

  await test('Dés : récupération aléatoire des charges au repos saisie physiquement et conservée', async p => {
    await diceTable(p);
    await p.evaluate(() => {
      cur().bag.push({id:'test-charges',name:'Baguette test',qty:1,charges:{max:10,used:8,when:'long',rec:'1d6+1',auto:false}});
      applyRest('long'); touch(S.cur); render();
    });
    ok(await p.isVisible('[data-form="chargeRecovery"]'),'saisie proposée après repos');
    eq(await p.evaluate(() => cur().bag.find(b=>b.id==='test-charges').charges.used),8,'aucun tirage implicite');
    await p.reload(); await p.waitForFunction(() => S.C && S.CAT);
    await p.evaluate(() => { S.cur=persos()[0]._id; S.view='sheet'; S.tab='table'; render(); });
    ok(await p.isVisible('[data-form="chargeRecovery"]'),'saisie conservée après rechargement');
    await p.fill('[data-form="chargeRecovery"] [name="total"]','3');
    await p.click('[data-form="chargeRecovery"] button[type="submit"]');
    eq(await p.evaluate(() => {const c=cur().bag.find(b=>b.id==='test-charges').charges;return [c.used,!!c.pendingRecovery];}),[4,false],'3 dés + 1 bonus = 4 charges récupérées');
  });

  await test('Dés : préférence de session utilisable si le stockage est plein', async p => {
    await diceTable(p);
    const r=await p.evaluate(() => {
      const original=Storage.prototype.setItem;
      Storage.prototype.setItem=()=>{throw new DOMException('plein','QuotaExceededError');};
      setVirtualDice(true); const enabled=virtualDiceEnabled(); setVirtualDice(false); const disabled=!virtualDiceEnabled();
      Storage.prototype.setItem=original; return [enabled,disabled];
    });
    eq(r,[true,true],'repli en mémoire');
  });


  await test('Dés physiques : Frappe occulte et champs numériques en largeur iPhone', async p => {
    await p.setViewportSize({width:390,height:844});
    await diceTable(p,'occultiste');
    await p.evaluate(() => {
      const ch=cur(); ch.level=5; ch.invocations=['frappe-occulte']; ch.turn={smite:true}; render();
      // Render the same smite section used by pact weapon cards.
      document.querySelector('.tmain').insertAdjacentHTML('beforeend',smiteBlock(ch,derive(ch),{pact:true}));
    });
    ok(await p.isVisible('[data-form="smitePhysical"]'),'saisie physique disponible');
    ok(!await p.isVisible('[data-act="smiteRoll"][data-crit="1"]'),'critique virtuel masqué');
    await p.fill('[data-form="smitePhysical"] [name="total"]','18');
    await p.click('[data-form="smitePhysical"] button[type="submit"]');
    eq(await p.evaluate(() => cur().rollLog[0].total),18,'Frappe occulte physique');
    await p.evaluate(() => { tSelect(S.Titems.find(i=>i.kind==='init').key); });
    await p.click('[data-act="tmode"][data-v="d"]');
    eq(await p.evaluate(() => [...document.querySelectorAll('#t-d1,#t-d2')].map(i=>[i.type,i.inputMode,parseFloat(getComputedStyle(i).fontSize)>=16])),[['number','numeric',true],['number','numeric',true]],'deux champs adaptés au clavier numérique');
    ok(await p.evaluate(() => { const el=document.querySelector('.tpop');return el.scrollWidth<=el.clientWidth+1; }),'aucun débordement horizontal de la carte');
  });

  await test('Dés virtuels : concentration et dés de vie déverrouillés', async p => {
    await diceTable(p);
    await p.evaluate(() => { setVirtualDice(true); cur().conc='Sort test'; S.T.cc={dmg:10,mode:'a',d1:'',d2:'',res:null}; S.T.pop='concchk'; render(); });
    await p.click('[data-act="ccroll"]');
    ok(await p.evaluate(() => !!S.T.cc.res),'concentration virtuelle');
    await p.click('[data-act="ccclose"]');
    await p.evaluate(() => { cur().hp.cur=1; S.T.pop='rest'; S.T.restKind='court'; render(); });
    ok(!await p.isVisible('#t-hd'),'saisie physique masquée en mode virtuel');
    await p.click('[data-act="hdvirt"]');
    eq(await p.evaluate(() => cur().hdUsed),1,'dé de vie virtuel');
  });


  async function padNumber(p, value) {
    for(const digit of String(value)) await p.click('[data-pad="'+digit+'"]');
    await p.click('[data-pad="ok"]');
  }

  await test('Pavé numérique : d20 physique, bornes et annulation sans journaliser', async p => {
    await diceTable(p);
    await p.evaluate(() => { cur().abilities.dex=18; render(); tSelect(S.Titems.find(i=>i.kind==='init').key); });
    const before=await p.evaluate(() => (cur().rollLog||[]).length);
    await p.click('#t-d1');
    ok(await p.isVisible('#dice-pad [role="dialog"]'),'pavé ouvert au clic');
    await padNumber(p,21);
    ok((await p.innerText('#dice-pad-error')).includes('1 à 20'),'borne contrôlée');
    eq(await p.evaluate(() => S.T.d1),'','pas de valeur invalide appliquée');
    await p.click('[data-pad="clear"]'); await padNumber(p,13);
    eq(await p.inputValue('#t-d1'),'13','résultat validé');
    ok((await p.innerText('#t-tot')).includes('Total : 17'),'bonus appliqué');
    eq(await p.evaluate(() => cur().rollLog.length),before+1,'une seule ligne de jet');
    await p.click('#t-d1'); await p.click('[data-pad="9"]'); await p.click('[data-pad="cancel"]');
    eq(await p.inputValue('#t-d1'),'13','annulation conserve la valeur');
    eq(await p.evaluate(() => cur().rollLog.length),before+1,'aucune ligne lors de l’annulation');
    ok(await p.isVisible('.tpop'),'carte toujours ouverte');
  });

  await test('Jet physique : une seule validation au pavé, une seule ligne par jet', async p => {
    await diceTable(p);
    await p.evaluate(() => tSelect('save:sag'));
    const n0=await p.evaluate(() => (cur().rollLog||[]).length);
    await p.click('#t-d1'); await padNumber(p,12);
    ok(!await p.locator('[data-act="tvalidate"]').count(),'plus de second bouton de validation');
    eq(await p.evaluate(() => (cur().rollLog||[]).length),n0+1,'jet enregistré dès le Valider du pavé, une seule ligne');
    await p.click('#t-d1'); await padNumber(p,12);
    eq(await p.evaluate(() => (cur().rollLog||[]).length),n0+2,'nouvelle saisie au pavé, même valeur : nouveau jet');
    await p.dispatchEvent('#t-d1','change');
    eq(await p.evaluate(() => (cur().rollLog||[]).length),n0+2,'pas de doublon pour la même saisie');
  });

  await test('Ligne d’« À la table » : toucher le nom ouvre la carte, seul le bouton i ouvre la règle', async p => {
    const ctx = await p.context().browser().newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const t = await ctx.newPage(); const errs = []; t.on('pageerror', e => errs.push(e.message)); await t.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    try {
      await diceTable(t);
      await t.fill('#tq','second souffle');
      ok(!await t.locator('#tres .trow [data-act="tip"]:not(.tinfo)').count(),'le nom n’est plus une cible de règle');
      await t.click('#tres .trow .tname b');
      eq(await t.evaluate(() => S.T.pop),'card','toucher le nom ouvre la carte');
      await t.keyboard.press('Escape');
      await t.fill('#tq','second souffle');
      const box=await t.locator('#tres .trow .tinfo').first().boundingBox();
      ok(box.width>=44&&box.height>=44,'bouton i de 44×44 au doigt');
      await t.click('#tres .trow .tinfo');
      ok(await t.isVisible('#tip'),'le bouton i ouvre la règle');
      ok(await t.evaluate(() => S.T.pop!=='card'),'la règle ne sélectionne pas l’élément');
      if (errs.length) throw new Error('Erreur JS : ' + errs.join(' | '));
    } finally { await ctx.close(); }
  });

  await test('Recherche : états et repos trouvés, règle d’un état sans le cocher', async p => {
    await diceTable(p);
    await p.fill('#tq','empois');
    ok((await p.innerText('#tres')).includes('Empoisonné'),'état trouvé par la recherche');
    await p.click('#tres .trow .tname b');
    ok((await p.innerText('.tcard')).includes('Désavantage aux jets d’attaque'),'règle de l’état dans la carte');
    ok(!await p.locator('.tcard [data-act="lockCost"]').count(),'pas de coût modifiable pour un état');
    await p.click('.tcard [data-act="cond"]');
    eq(await p.evaluate(() => cur().conditions),['Empoisonné'],'état activé depuis la carte');
    ok((await p.innerText('.tcard [data-act="cond"]')).includes('Retirer'),'bouton devenu Retirer');
    await p.keyboard.press('Escape');
    await p.click('[data-act="tsel"][data-k="rule:empoisonne"]');
    eq(await p.evaluate(() => [S.T.pop,S.T.sel]),['card','rule:empoisonne'],'la pastille d’un état actif ouvre sa règle');
    await p.keyboard.press('Escape');
    await p.fill('#tq','repos');
    ok((await p.innerText('#tres')).includes('Repos court'),'repos trouvé par la recherche');
    await p.click('#tres .trow:has-text("Repos court") .tname b');
    await p.click('.tcard [data-act="restOpen"]');
    eq(await p.evaluate(() => [S.T.pop,S.T.restKind]),['rest','court'],'la carte mène au repos court');
    await p.evaluate(() => { S.T.pop='cond'; render(); });
    await p.click('.condpick:has-text("Aveuglé") .tinfo');
    ok(await p.isVisible('#tip')&&(await p.innerText('#tip')).includes('Aveuglé'),'règle lue depuis la popup États');
    eq(await p.evaluate(() => cur().conditions),['Empoisonné'],'lire la règle ne coche pas l’état');
  });

  await test('Champs de dés : sans flèches, ni ↑/↓ ni molette ne créent de jet', async p => {
    await diceTable(p);
    await p.evaluate(() => tSelect('save:sag'));
    const st=await p.evaluate(() => { const i=document.getElementById('t-d1');
      const rule=[...document.styleSheets].flatMap(sh=>{ try{ return [...sh.cssRules]; }catch(e){ return []; } }).find(r=>r.selectorText&&r.selectorText.includes('input[data-tin]::-webkit-inner-spin-button'));
      return [getComputedStyle(i).appearance, rule?rule.style.getPropertyValue('appearance'):null]; });
    eq(st,['textfield','none'],'flèches haut/bas masquées');
    const n0=await p.evaluate(() => (cur().rollLog||[]).length);
    await p.focus('#t-d1'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp');
    const box=await p.locator('#t-d1').boundingBox(); await p.mouse.move(box.x+box.width/2,box.y+box.height/2); await p.mouse.wheel(0,-200); await p.waitForTimeout(100);
    await p.locator('#t-d1').evaluate(e => e.blur());
    eq(await p.inputValue('#t-d1'),'','valeur inchangée');
    eq(await p.evaluate(() => (cur().rollLog||[]).length),n0,'aucun jet enregistré');
  });

  // Paires d'éléments cliquables visibles qui se recouvrent (hors éléments imbriqués et champs avec bouton intégré).
  const overlaps = t => t.evaluate(() => {
    const els = [...document.querySelectorAll('button,[data-act],[role=tab],[role=button],a[href]')].filter(e => { const r = e.getBoundingClientRect(); const st = getComputedStyle(e); return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && e.offsetParent; });
    const clip = e => { let r = e.getBoundingClientRect(); for (let a = e.parentElement; a; a = a.parentElement) { if (/(auto|scroll|hidden)/.test(getComputedStyle(a).overflowX)) { const c = a.getBoundingClientRect(); r = { left: Math.max(r.left, c.left), right: Math.min(r.right, c.right), top: r.top, bottom: r.bottom }; } } return r; };
    const out = [];
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
      const a = els[i], b = els[j]; if (a.contains(b) || b.contains(a)) continue;
      const r1 = clip(a), r2 = clip(b), w = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left), h = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
      if (w > 4 && h > 4) out.push((a.innerText || a.getAttribute('aria-label') || a.dataset.act || '').trim().slice(0, 20) + ' / ' + (b.innerText || b.getAttribute('aria-label') || b.dataset.act || '').trim().slice(0, 20));
    }
    return out;
  });

  await test('iPhone : onglets de la fiche lisibles et défilants, aucun bouton qui en recouvre un autre', async p => {
    const ctx = await p.context().browser().newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const t = await ctx.newPage(); const errs = []; t.on('pageerror', e => errs.push(e.message)); await t.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    try {
      await open(t); await newWizardChar(t, { cls: 'paladin', bg: 'srd:soldat', sp: 'srd:humain' });
      await t.evaluate(() => { S.rv = null; renderModal(); S.tab = 'jeu'; render(); });
      const tabs = await t.evaluate(() => [...document.querySelectorAll('.sheettabs [role=tab]')].map(b => b.scrollWidth <= b.clientWidth + 1));
      ok(tabs.length >= 7 && tabs.every(Boolean), 'chaque onglet garde la largeur de son texte');
      ok(await t.evaluate(() => document.querySelector('.sheettabs').classList.contains('more-r')), 'fondu à droite : la barre continue');
      const bad = [];
      for (const tab of ['jeu', 'comp', 'sorts', 'apt', 'inv', 'notes', 'build', 'table']) {
        await t.evaluate(tab => { S.tab = tab; render(); }, tab);
        if (tab === 'build') ok(await t.evaluate(() => { const b = document.querySelector('.sheettabs'), a = b.querySelector('[aria-selected="true"]'); return a.offsetLeft >= b.scrollLeft && a.offsetLeft + a.offsetWidth <= b.scrollLeft + b.clientWidth + 1; }), 'onglet actif ramené dans la partie visible');
        (await overlaps(t)).forEach(x => bad.push(tab + ' : ' + x));
      }
      eq(bad, [], 'éléments cliquables superposés');
      if (errs.length) throw new Error('Erreur JS : ' + errs.join(' | '));
    } finally { await ctx.close(); }
  });

  await test('Pavé numérique : deux dés physiques puis passage au mode virtuel exclusif', async p => {
    await p.setViewportSize({width:390,height:844}); await diceTable(p);
    await p.evaluate(() => { cur().abilities.dex=18; render(); tSelect(S.Titems.find(i=>i.kind==='init').key); });
    await p.click('[data-act="tmode"][data-v="d"]');
    await p.click('#t-d1'); await padNumber(p,13);
    await p.click('#t-d2');
    ok(await p.evaluate(() => {const r=document.querySelector('.dice-pad').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}),'pavé contenu dans l’écran iPhone');
    await padNumber(p,7);
    ok((await p.innerText('#t-tot')).includes('Total : 11'),'bon dé retenu');
    await p.evaluate(() => { setVirtualDice(true); render(); });
    ok(await p.isVisible('[data-act="tvroll"]')&&!await p.isVisible('#t-d1')&&!await p.isVisible('#t-d2'),'mode virtuel exclusif');
    eq(await p.evaluate(() => cur().rollLog[0].total),11,'journal physique');
  });

  await test('Pavé numérique : dégâts, correction et raccourcis clavier', async p => {
    await diceTable(p);
    await p.evaluate(() => tSelect(S.Titems.find(i=>i.kind==='atk').key));
    await p.locator('#t-dmg').focus(); await p.keyboard.press('Enter');
    await p.keyboard.type('19'); await p.keyboard.press('Backspace'); await p.keyboard.type('2');
    eq(await p.innerText('#dice-pad-value'),'12','correction au clavier');
    await p.keyboard.press('Enter');
    const flat=await p.evaluate(() => +document.getElementById('t-dtot').dataset.flat);
    eq(await p.inputValue('#t-dmg'),'12','dégâts validés');
    eq(await p.evaluate(() => cur().rollLog[0].total),12+flat,'bonus aux dégâts');
    await p.click('#t-dmg'); await p.keyboard.press('Escape');
    ok(!await p.locator('#dice-pad').count()&&await p.isVisible('.tpop'),'Échap ferme uniquement le pavé');
  });

  await test('Pavé numérique : jet libre et jet contre la mort appliqués dès le Valider du pavé', async p => {
    await diceTable(p);
    await p.evaluate(() => { S.tab='jeu'; render(); renderDice(); });
    const n0=await p.evaluate(() => S.log.length);
    await p.fill('#freeExpr','2d6+4'); await p.click('[data-form="free"] [name="physical"]'); await padNumber(p,7);
    eq(await p.evaluate(() => S.log[0].total),11,'jet libre enregistré sans Appliquer');
    eq(await p.inputValue('[data-form="free"] [name="physical"]'),'','champ vidé après enregistrement');
    await p.click('[data-form="free"] button:not([data-virtual])');
    eq(await p.evaluate(() => S.log.length),n0+1,'Appliquer ensuite ne crée pas de doublon');
    await p.evaluate(() => { cur().hp.cur=0; cur().death={s:0,f:0}; S.tab='table'; render(); });
    await p.click('#t-death'); await padNumber(p,15);
    eq(await p.evaluate(() => cur().death),{s:1,f:0},'jet contre la mort appliqué sans Appliquer');
  });

  await test('Pavé numérique : concentration et dé de vie physiques', async p => {
    await diceTable(p);
    await p.evaluate(() => { cur().conc='Sort test'; S.T.cc={dmg:10,mode:'n',d1:'',d2:'',res:null}; S.T.pop='concchk'; render(); });
    await p.click('#cc-d1'); await padNumber(p,18);
    ok(await p.evaluate(() => !!S.T.cc.res),'concentration résolue dès le Valider du pavé');
    await p.click('[data-act="ccclose"]');
    await p.evaluate(() => { cur().hp.cur=1; S.T.pop='rest'; S.T.restKind='court'; render(); });
    await p.click('#t-hd'); await padNumber(p,6);
    eq(await p.evaluate(() => cur().hdUsed),1,'dé de vie dépensé dès le Valider du pavé');
    // Le formulaire peut avoir disparu (PV au maximum) : ne cliquer que s'il est encore là, sans attendre.
    if(await p.locator('[data-form="hdroll"] button[type="submit"]').isVisible()) await p.click('[data-form="hdroll"] button[type="submit"]');
    eq(await p.evaluate(() => cur().hdUsed),1,'Appliquer ensuite ne dépense pas un second dé');
  });


  await test('Modes exclusifs : aucune saisie physique ni pavé en mode virtuel, retour physique possible', async p => {
    await diceTable(p);
    await p.evaluate(() => { setVirtualDice(true); render(); });
    const result=await p.evaluate(() => {
      let fields=0;
      for(const item of [...S.Titems]){
        tSelect(item.key);
        for(const input of document.querySelectorAll(DICE_INPUTS)){
          fields++; if(!input.disabled||getComputedStyle(input.closest('label')||input).display!=='none') throw new Error('Saisie physique exposée');
          openDicePad(input); if(dicePad) throw new Error('Pavé ouvert en mode virtuel');
        }
      }
      tSelect(S.Titems.find(i=>i.kind==='init').key);
      const before=JSON.stringify(cur()); const input=document.getElementById('t-d1');
      input.value='17';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
      return [fields>0,S.T.d1==='',before===JSON.stringify(cur())];
    });
    eq(result,[true,true,true],'saisies interdites et aucun jet physique journalisé');
    await p.evaluate(() => { S.T.pop=null; cur().conc='Sort test'; S.T.cc={dmg:10,mode:'n',d1:'',d2:'',res:null}; S.T.pop='concchk'; render(); });
    ok(!await p.isVisible('#cc-d1')&&!await p.isVisible('[data-form="cc"] button[type="submit"]'),'concentration physique masquée');
    await p.evaluate(() => document.querySelector('[data-form="cc"]').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    ok(await p.evaluate(() => !S.T.cc.res),'soumission physique bloquée');
    await p.evaluate(() => { S.T.pop=null; setVirtualDice(false); render(); tSelect(S.Titems.find(i=>i.kind==='init').key); });
    ok(await p.isVisible('#t-d1')&&!await p.isVisible('[data-act="tvroll"]'),'retour en mode physique');
    await p.click('#t-d1'); ok(await p.isVisible('#dice-pad'),'pavé rétabli');
  });


  async function turnAttack(p, virtual, cost='action') {
    await diceTable(p);
    return p.evaluate(({virtual,cost}) => {
      setVirtualDice(virtual); const key=S.Titems.find(i=>i.kind==='atk').key;
      cur().costs=cur().costs||{}; cur().costs[key]=cost; render(); tSelect(key); return key;
    },{virtual,cost});
  }
  async function commitAttack(p,virtual,value='12') {
    if(virtual) await p.click('[data-act="tvroll"]');
    else { if(await p.locator('#t-d2').count()){ await p.fill('#t-d1',value); await physType(p,'#t-d2','5'); } else await physType(p,'#t-d1',value); }
  }
  async function commitDamage(p,virtual,crit=false) {
    if(virtual) await p.click('[data-act="tvdmg"]'+(crit?'[data-crit="1"]':':not([data-crit])'));
    else await physType(p,'#t-dmg','7');
  }

  for(const virtual of [false,true]) await test('Tour : attaque '+(virtual?'virtuelle':'physique')+', résultat conservé, relances, dégâts et annulation',async p=>{
    await turnAttack(p,virtual);
    eq(await p.evaluate(()=>cur().turn||{}),{},'ouvrir ne consomme rien');
    await p.click('[data-act="tmode"][data-v="d"]');
    eq(await p.evaluate(()=>cur().turn||{}),{},'changer le mode ne consomme rien');
    if(!virtual){
      await physType(p,'#t-d1','12');
      eq(await p.evaluate(()=>cur().turn||{}),{},'un seul des deux d20 saisi ne consomme rien');
    }
    await commitAttack(p,virtual);
    eq(await p.evaluate(()=>cur().turn),{action:true},'une Action uniquement');
    eq(await p.evaluate(()=>S.T.pop),'card','carte ouverte');
    ok(await p.isVisible('#t-tot .tot'),'résultat visible');
    ok((await p.innerText('#t-action-state')).includes('✓ Action consommée pour ce tour'),'confirmation dans la carte');
    ok((await p.innerText('.tturnbtn[data-v="eco:action"]')).includes('Action consommée'),'suivi général');
    await commitAttack(p,virtual);
    eq(await p.evaluate(()=>cur().turn),{action:true},'relance sans coût supplémentaire');
    await commitDamage(p,virtual);
    if(virtual) await commitDamage(p,virtual,true);
    eq(await p.evaluate(()=>cur().turn),{action:true},'dégâts et critiques sans autre coût');
    const result=await p.innerText('#t-tot'), damage=await p.innerText('#t-dtot'), logs=await p.evaluate(()=>cur().rollLog.length);
    await p.click('#t-action-state [data-act="tuse"][data-off="1"]');
    eq(await p.evaluate(()=>cur().turn),{action:false},'annulation limitée à l’Action');
    eq(await p.innerText('#t-tot'),result,'résultat d’attaque conservé'); eq(await p.innerText('#t-dtot'),damage,'dégâts conservés');
    eq(await p.evaluate(()=>cur().rollLog.length),logs,'historique conservé');
    await commitDamage(p,virtual);
    eq(await p.evaluate(()=>cur().turn),{action:false},'relance des dégâts ne reconsomme pas');
    eq(await p.evaluate(()=>S.T.pop),'card','carte toujours ouverte');
  });

  await test('Tour : le Valider du pavé valide le jet ; fermer sans saisir ne consomme rien',async p=>{
    const key=await turnAttack(p,false);
    await p.click('#t-d1'); await p.click('[data-pad="1"]'); await p.click('[data-pad="cancel"]');
    await p.click('.tpophead [data-act="tpopclose"]');
    eq(await p.evaluate(()=>cur().turn||{}),{},'pavé annulé puis carte fermée : rien de consommé');
    await p.evaluate(k=>tSelect(k),key);
    await p.click('#t-d1'); await padNumber(p,14);
    eq(await p.evaluate(()=>cur().turn),{action:true},'Valider du pavé : Action consommée');
    ok((await p.innerText('#t-action-state')).includes('✓ Action consommée'),'confirmation dans la carte');
  });

  await test('Tour : résultat physique incomplet ou invalide ne consomme rien',async p=>{
    await turnAttack(p,false);
    await p.click('[data-act="tmode"][data-v="a"]');
    await physType(p,'#t-d1','12');
    eq(await p.evaluate(()=>cur().turn||{}),{},'second dé absent');
    await physType(p,'#t-d2','21');
    eq(await p.evaluate(()=>cur().turn||{}),{},'second dé hors bornes');
  });

  await test('Tour : plusieurs attaques restent accessibles dans une seule Action',async p=>{
    await turnAttack(p,true);
    await p.evaluate(()=>{ const ch=cur(); ch.level=5; ch.attacks.push({...ch.attacks[0],id:'turn-second',name:'Seconde arme'}); render(); });
    await commitAttack(p,true);
    await p.evaluate(()=>tSelect('atk:turn-second'));
    ok(await p.isVisible('[data-act="tvroll"]'),'seconde attaque accessible');
    ok((await p.innerText('#t-action-state')).includes('Action consommée'),'Action déjà consommée affichée');
    await commitAttack(p,true);
    eq(await p.evaluate(()=>cur().turn),{action:true},'une seule Action pour les deux attaques');
  });

  for(const cost of ['bonus','reaction']) for(const virtual of [false,true]) await test('Tour : coût '+cost+' en mode '+(virtual?'virtuel':'physique'),async p=>{
    await turnAttack(p,virtual,cost); await commitAttack(p,virtual);
    eq(await p.evaluate(()=>cur().turn),{[cost]:true},'coût exact sans Action ni jalon automatique');
    const text=await p.innerText('#t-action-state');
    ok(text.includes(cost==='bonus'?'✓ Action bonus consommée pour ce tour':'✓ Réaction consommée'),'libellé exact');
    if(cost==='reaction') ok(!text.includes('pour ce tour'),'aucune règle temporelle ajoutée à la Réaction');
  });

  await test('Tour : action sans jet explicite, carte ouverte et annulation isolée',async p=>{
    await diceTable(p);
    await p.evaluate(()=>{cur().turn={bonus:true,move:true};tSelect(S.Titems.find(i=>i.kind==='basic'&&i.cost==='action'&&!['basic:attaque','basic:magie'].includes(i.key)).key);});
    eq(await p.innerText('#t-action-state button'),'Utiliser l’action','validation manuelle');
    await p.click('#t-action-state button');
    eq(await p.evaluate(()=>[cur().turn,S.T.pop]),[{bonus:true,move:true,action:true},'card'],'suivi et carte');
    await p.click('#t-action-state [data-off="1"]');
    eq(await p.evaluate(()=>cur().turn),{bonus:true,move:true,action:false},'autres états conservés');
  });

  await test('Tour : Mouvement et Autre manuels et annulables, Nouveau tour réinitialise tout',async p=>{
    await diceTable(p);
    ok((await p.innerText('.tturnbtn[data-v="eco:action"]')).includes('Actions ('),'nombre d’options entre parenthèses');
    await p.click('.tturnbtn[data-v="move"]');
    ok((await p.innerText('.tturnbtn[data-v="move"]')).includes('✓ Mouvement terminé'),'jalon Mouvement');
    await p.click('.tturnbtn[data-v="move"]');
    eq(await p.evaluate(()=>cur().turn.move),false,'Mouvement annulable');
    await p.click('.tturnbtn[data-v="eco:autre"]');
    eq(await p.evaluate(()=>!!cur().turn.autre),false,'consulter Autre ne termine pas le jalon');
    await p.click('.tpophead [data-act="tturn"][data-v="autre"]');
    ok((await p.innerText('.tturnbtn[data-v="eco:autre"]')).includes('✓ Autre terminé'),'jalon Autre');
    await p.click('.tpophead [data-act="tturn"][data-v="autre"]');
    eq(await p.evaluate(()=>cur().turn.autre),false,'Autre annulable');
    await p.evaluate(()=>{cur().turn={action:true,bonus:true,reaction:true,move:true,autre:true};S.T.pop=null;render();});
    await p.click('[data-act="tnewturn"]');
    eq(await p.evaluate(()=>cur().turn),{},'tous les états réinitialisés');
  });

  for(const virtual of [false,true]) await test('Tour : sort avec emplacement, relance sans redépense, annulation du seul suivi '+(virtual?'virtuel':'physique'),async p=>{
    await diceTable(p,'occultiste');
    await p.evaluate(virtual=>{setVirtualDice(virtual);cur().spells.push({ref:'srd:blessure',prepared:true});render();tSelect('spell:srd:blessure');},virtual);
    eq(await p.evaluate(()=>[cur().pactUsed||0,cur().turn||{}]),[0,{}],'consultation gratuite');
    await p.click('[data-act="tcast"]');
    eq(await p.evaluate(()=>[cur().pactUsed,cur().turn]),[1,{action:true}],'emplacement et Action dépensés');
    await commitDamage(p,virtual); await commitDamage(p,virtual);
    eq(await p.evaluate(()=>[cur().pactUsed,cur().turn,S.T.pop]),[1,{action:true},'card'],'relances sans dépense supplémentaire');
    const result=await p.innerText('#t-dtot');
    await p.click('#t-action-state [data-off="1"]');
    eq(await p.evaluate(()=>[cur().pactUsed,cur().turn.action]),[1,false],'emplacement conservé après annulation du suivi');
    eq(await p.innerText('#t-dtot'),result,'résultat conservé');
    await commitDamage(p,virtual);
    eq(await p.evaluate(()=>[cur().pactUsed,cur().turn.action]),[1,false],'relancer les dégâts ne réactive pas le suivi annulé');
    await p.evaluate(()=>tSelect('spell:srd:blessure'));
    eq(await p.evaluate(()=>[cur().pactUsed,cur().turn.action]),[1,false],'nouvelle consultation gratuite');
  });

  for(const [id,cost] of [['mot-de-guerison','bonus'],['bouclier','reaction']]) await test('Tour : sort '+id+' consomme le bon coût',async p=>{
    await diceTable(p,'occultiste');
    await p.evaluate(id=>{cur().spells.push({ref:'srd:'+id,prepared:true});render();tSelect('spell:srd:'+id);},id);
    await p.click('[data-act="tcast"]');
    eq(await p.evaluate(()=>cur().turn),{[cost]:true},'coût du sort');
    eq(await p.evaluate(()=>cur().pactUsed),1,'emplacement dépensé une seule fois');
    eq(await p.evaluate(()=>S.T.pop),'card','informations du sort visibles');
  });

  for(const virtual of [false,true]) await test('Tour : premier jet de sort mineur déclare le lancement '+(virtual?'virtuel':'physique'),async p=>{
    await diceTable(p,'occultiste');
    await p.evaluate(virtual=>{setVirtualDice(virtual);cur().spells.push({ref:'srd:decharge-occulte',prepared:true});render();tSelect('spell:srd:decharge-occulte');},virtual);
    await commitAttack(p,virtual);
    eq(await p.evaluate(()=>[cur().turn,cur().pactUsed||0,S.T.castDone]),[{action:true},0,'spell:srd:decharge-occulte'],'sort mineur lancé sans emplacement');
    await commitAttack(p,virtual); await commitDamage(p,virtual);
    eq(await p.evaluate(()=>[cur().turn,cur().pactUsed||0]),[{action:true},0],'rayons et dégâts sans autre coût');
  });

  await test('Tour : sort sans emplacement disponible ne consomme aucune Action',async p=>{
    await diceTable(p,'occultiste');
    await p.evaluate(()=>{const ch=cur();ch.pactUsed=derive(ch).cast.pactSlots;ch.spells.push({ref:'srd:blessure',prepared:true});render();tSelect('spell:srd:blessure');});
    await p.click('[data-act="tcast"]');
    eq(await p.evaluate(()=>cur().turn||{}),{},'échec de lancement sans coût de tour');
  });

  for(const virtual of [false,true]) await test('Tour : objet à charges, relance et annulation du suivi '+(virtual?'virtuel':'physique'),async p=>{
    await diceTable(p,'occultiste');
    await p.evaluate(virtual=>{
      setVirtualDice(virtual);
      cur().bag.push({id:'turn-wand',name:'Baguette de boules de feu',ref:'item:magique:baguette-de-boules-de-feu',qty:1,charges:{max:7,used:0,when:'long',rec:'full',cost:'action',auto:false}});
      render();tSelect('bag:turn-wand');
    },virtual);
    await commitDamage(p,virtual); await commitDamage(p,virtual);
    eq(await p.evaluate(()=>[cur().bag.find(b=>b.id==='turn-wand').charges.used,cur().turn,S.T.pop]),[1,{action:true},'card'],'une charge et une Action seulement');
    const result=await p.innerText('#t-dtot');
    await p.click('#t-action-state [data-off="1"]');
    eq(await p.evaluate(()=>[cur().bag.find(b=>b.id==='turn-wand').charges.used,cur().turn.action]),[1,false],'annulation sans remboursement de charge');
    eq(await p.innerText('#t-dtot'),result,'résultat de l’objet conservé');
  });

  await test('Tour : initiative et sauvegarde sans coût ne consomment aucune ressource de tour',async p=>{
    await diceTable(p);
    await p.evaluate(()=>{setVirtualDice(true);render();tSelect('init');});await p.click('[data-act="tvroll"]');
    await p.evaluate(()=>tSelect('save:con'));await p.click('[data-act="tvroll"]');
    eq(await p.evaluate(()=>cur().turn||{}),{},'jets sans coût et jalons préservés');
  });


  if (BROWSER) await BROWSER.close();
  const ko = results.filter(r => !r[1]).length;
  if (ONLY.length) {
    if (!results.length) { console.log('\nAucun test ne correspond à --only : rien n’a été vérifié.'); process.exit(1); }
    console.log(`\nSélection --only : ${results.length - ko}/${results.length} tests réussis (${SKIPPED} non lancés : ce n’est pas la suite complète).`);
  } else console.log(`\n${results.length - ko}/${results.length} tests réussis.`);
  process.exit(ko ? 1 : 0);
})();
