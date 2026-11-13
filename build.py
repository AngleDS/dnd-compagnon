#!/usr/bin/env python3
"""Assemble l'appli D&D Compagnon en deux fichiers HTML autonomes.
 
Sources :
  shell.html   gabarit de la page avec les repères (voir plus bas)
  styles.css   styles de base de l'appli
  theme.css    thème Dark Fantasy et mode clair (chargé après les styles de base)
  js/*.js      script principal, en modules concaténés dans l'ordre des noms (même portée globale)
 
Données embarquées :
  data/srd-data.json  catalogue SRD complet
  data/hb-cat.json    catalogue hors SRD
 
Repères du gabarit : /*@@STYLES@@*/, /*@@THEME@@*/, @@DATA:hb-cat@@, @@DATA:srd-data@@, /*@@SCRIPT@@*/.
 
Usage :
  python3 build.py [--srd fichier.json] [--catalogue fichier.json] [--out dist]
Produit dist/index.html (à publier), dist/dnd-compagnon.html (fichier autonome), dist/main.js (pour node --check).
"""
import argparse, glob, json, os, subprocess, sys, tempfile
 
HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, 'data')


def json_data(path, label, check):
    try:
        raw = open(path, encoding='utf8').read()
        value = json.loads(raw)
    except (OSError, json.JSONDecodeError) as exc:
        sys.exit(f'Impossible de charger {label} ({path}) : {exc}')
    if not check(value):
        sys.exit(f'{label.capitalize()} absent, vide ou incomplet ({path}).')
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def write_atomic(path, content):
    fd, tmp = tempfile.mkstemp(prefix='.build-', dir=os.path.dirname(path), text=True)
    try:
        with os.fdopen(fd, 'w', encoding='utf8') as stream:
            stream.write(content)
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
 
 
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--srd', default=os.path.join(DATA_DIR, 'srd-data.json'))
    ap.add_argument('--catalogue', default=os.path.join(DATA_DIR, 'hb-cat.json'))
    ap.add_argument('--src', default=HERE)
    ap.add_argument('--out', default=os.path.join(HERE, 'dist'))
    a = ap.parse_args()
 
    shell = open(os.path.join(a.src, 'shell.html'), encoding='utf8').read()
    css = open(os.path.join(a.src, 'styles.css'), encoding='utf8').read()
    theme = open(os.path.join(a.src, 'theme.css'), encoding='utf8').read()
    mods = sorted(glob.glob(os.path.join(a.src, 'js', '*.js')))
    if not mods:
        sys.exit('Aucun module dans js/.')
    studio_paths = ('studio/studio.html', 'vendor/three-0.180.0.mjs', 'vendor/cannon-es-0.20.0.mjs', 'vendor/license-three.txt', 'vendor/license-cannon-es.txt')
    try:
        studio_assets = [open(os.path.join(a.src, p), encoding='utf8').read() for p in studio_paths]
    except OSError as exc:
        sys.exit(f'Sources du studio de dés manquantes : {exc}')
    # En texte (plus de base64) ; chaque « < » est échappé pour ne jamais fermer ni ouvrir de balise dans la page.
    js = 'const STUDIO_ASSETS=' + json.dumps(studio_assets).replace('<', '\\u003c') + ';\n' + ''.join(open(m, encoding='utf8').read() for m in mods)
    if '</script' in js.lower():
        sys.exit('Un module contient « </script » : la page serait coupée.')
    srd = json_data(a.srd, 'catalogue SRD', lambda d: isinstance(d, dict) and len(d.get('spells', [])) > 300 and len(d.get('classes', [])) >= 12)
    cat = json_data(a.catalogue, 'catalogue hors SRD', lambda d: isinstance(d, list) and len(d) > 400)
 
    for mark in ('/*@@STYLES@@*/', '/*@@THEME@@*/', '@@DATA:hb-cat@@', '@@DATA:srd-data@@', '/*@@SCRIPT@@*/'):
        if shell.count(mark) != 1:
            sys.exit(f'Repère {mark} absent ou en double dans shell.html.')
    out = (shell.replace('/*@@STYLES@@*/', css)
                .replace('/*@@THEME@@*/', theme)
                .replace('@@DATA:hb-cat@@', cat)
                .replace('@@DATA:srd-data@@', srd)
                .replace('/*@@SCRIPT@@*/', js))
 
    os.makedirs(a.out, exist_ok=True)
    fd, check_path = tempfile.mkstemp(prefix='.main-', suffix='.js', dir=a.out, text=True)
    try:
        with os.fdopen(fd, 'w', encoding='utf8') as stream:
            stream.write(js)
        r = subprocess.run(['node', '--check', check_path], capture_output=True, text=True)
        if r.returncode:
            sys.exit('Erreur de syntaxe JS :\n' + r.stderr)
    finally:
        if os.path.exists(check_path):
            os.unlink(check_path)
    write_atomic(os.path.join(a.out, 'index.html'), out)
    write_atomic(os.path.join(a.out, 'dnd-compagnon.html'), out)
    write_atomic(os.path.join(a.out, 'main.js'), js)
    print(f'OK : {len(mods)} modules, {len(out):,} caractères → {a.out}/index.html et dnd-compagnon.html'.replace(',', ' '))
 
 
if __name__ == '__main__':
    main()
