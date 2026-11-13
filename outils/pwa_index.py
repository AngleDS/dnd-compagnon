#!/usr/bin/env python3
"""Prépare la PWA (GitHub Pages) depuis la version construite.

index.html = dist/index.html + balises PWA (manifeste, icône, couleurs iPhone) + pwa.js ;
sw.js : nom du cache renouvelé (empreinte de la nouvelle page), sinon les téléphones gardent l'ancienne version.
Usage, depuis la racine du dépôt, après python3 build.py : python3 outils/pwa_index.py
"""
import hashlib, re, sys

TAGS = '''<link rel="manifest" href="./manifest.webmanifest">
<meta name="theme-color" content="#141113">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Compagnon">
<link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">
'''

src = open('dist/index.html', encoding='utf-8').read()
vp = re.search(r'<meta name="viewport"[^>]*>\n', src)
if not vp or not src.rstrip().endswith('</body></html>') or 'manifest.webmanifest' in src:
    sys.exit('dist/index.html inattendu : construire avec python3 build.py')
out = src[:vp.end()] + TAGS + src[vp.end():]
i = out.rindex('</body>')  # le dernier : un script du studio contient aussi ce texte
out = out[:i] + '<script src="./pwa.js"></script>\n' + out[i:]
open('index.html', 'w', encoding='utf-8').write(out)

h = hashlib.sha256(out.encode('utf-8')).hexdigest()[:12]
sw = open('sw.js', encoding='utf-8').read()
sw2, n = re.subn(r'const CACHE=PREFIX\+"[0-9a-f]+";', 'const CACHE=PREFIX+"%s";' % h, sw)
if n != 1:
    sys.exit('sw.js : ligne CACHE introuvable')
open('sw.js', 'w', encoding='utf-8').write(sw2)
print('index.html régénéré ; cache', h)
