"""Régénère data/hb-cat.json à partir des sources du catalogue.
Usage : python3 outils/build_cat.py [srd-data.json] [sortie.json]
Les chemins par défaut sont data/srd-data.json et data/hb-cat.json."""
import json,re,sys,os,unicodedata
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from cat_src import *
HERE=os.path.dirname(os.path.abspath(__file__))
ROOT=os.path.dirname(HERE)
srd_path=sys.argv[1] if len(sys.argv)>1 else os.path.join(ROOT,'data','srd-data.json')
D=json.load(open(srd_path,encoding='utf8'))
def norm(x): return unicodedata.normalize('NFD',str(x).lower()).encode('ascii','ignore').decode().replace('’',"'").strip()
srdsub={norm(sc['name']) for c in D['classes'] for sc in c.get('subclasses',[])}
srdbg={norm(b['name']) for b in D['backgrounds']}; srdsp={norm(b['name']) for b in D['species']}
srdfeat={norm(f['name']) for f in D['feats']}; srdspell={norm(x['name']) for x in D['spells']}
SK={'Acrobatics':'acrobaties','Animal Handling':'dressage','Arcana':'arcanes','Athletics':'athletisme','Deception':'tromperie','History':'histoire','Insight':'intuition','Intimidation':'intimidation','Investigation':'investigation','Medicine':'medecine','Nature':'nature','Perception':'perception','Performance':'representation','Persuasion':'persuasion','Religion':'religion','Sleight of Hand':'escamotage','Stealth':'discretion','Survival':'survie'}
EC={'Abjuration':'Abjuration','Conjuration':'Invocation','Divination':'Divination','Enchantment':'Enchantement','Evocation':'Évocation','Illusion':'Illusion','Necromancy':'Nécromancie','Transmutation':'Transmutation'}
FEN={'Skilled':'Doué','Healer':'Guérisseur','Tough':'Robuste','Alert':'Vigilant','Lucky':'Chanceux','Crafter':'Façonneur','Savage Attacker':'Sauvagerie martiale','Magic Initiate (Wizard)':'Initié à la magie (magicien)','Magic Initiate (Druid)':'Initié à la magie (druide)'}
out=[]; seen=set()
def add(e):
    assert e['id'] not in seen,e['id']; seen.add(e['id']); out.append(e)
def first(n): return n.split('|')[0]
# sous-classes PHB
for c,subs in PHB_SUB.items():
    for anc,n in subs:
        if norm(n) in srdsub: continue
        add({'id':'sc-'+c+'-'+norm(anc).replace(' ','-'),'k':'sous-classe','n':n,'b':PHB,'c':c,'u':f'{AIDE}/regles-24/classes/{c}/#{anc}'})
for b,c,n,anc,page in SUP_SUB:
    add({'id':'sc-'+norm(n).replace(' ','-'),'k':'sous-classe','n':n,'b':BOOKS[b][0],'c':c,'u':f'{DDB}/sources/dnd/{page or BOOKS[b][1]}#{anc}'})
for b,n,vo,page in CLASSES:
    add({'id':'cl-'+norm(n),'k':'classe','n':n,'vo':vo,'b':BOOKS[b][0],'u':f'{DDB}/sources/dnd/{page}'})
for anc,n,ab,feat,sk,tool in PHB_BG:
    assert norm(n) not in srdbg
    add({'id':'bg-'+anc,'k':'historique','n':n,'b':PHB,'ab':ab.split(),'sk':sk.split(),'tools':tool,'feat':feat,'u':f'{AIDE}/regles-24/origines-des-personnages/description-des-historiques/#{anc}'})
for b,slug,n,feat,sk in SUP_BG:
    add({'id':'bg-'+slug.split('-',1)[1],'k':'historique','n':n,'b':BOOKS[b][0],'sk':[SK[x.strip()] for x in sk.split(',')],'feat':FEN.get(feat,feat),'u':f'{DDB}/backgrounds/{slug}'})
for b,slug,n in SPECIES:
    if norm(n) in srdsp: continue
    add({'id':'sp-'+slug.split('-',1)[1],'k':'espece','n':n,'b':PHB if b=='PHB' else BOOKS[b][0],'u':f'{DDB}/species/{slug}'})
CAT={"Don d'origines":'origines','Don général':'généraux','Don de Style de combat':'Style combat','Don de faveur épique':'faveur épique'}
LV={'origines':1,'généraux':4,'Style combat':1,'faveur épique':19,'don sombre':1}
for f in json.load(open(os.path.join(HERE,'cat_phb.json'),encoding='utf8'))['feats']:
    if f['br']: continue
    n=first(f['n']); 
    if norm(n) in srdfeat: continue
    cat=CAT[f['cat']]; e={'id':'don-'+f['s'],'k':'don','n':n,'vo':f['vo'],'b':PHB,'cat':cat,'pre':'' if f['pre']=='-' else f['pre'],'lv':LV[cat],'u':f"{AIDE}/feat/fr/{f['s']}"}
    if '|' in f['n']: e['alt']=f['n'].split('|')[1]
    if f['rep']: e['rep']=1
    add(e)
CS={'Origin':'origines','General':'généraux','Epic Boon':'faveur épique','Fighting Style':'Style combat','Dark Gift':'don sombre'}
for b,slug,n,cat in SUP_FEATS:
    c=CS[cat]; e={'id':'don-'+slug.split('-',1)[1],'k':'don','n':n,'b':BOOKS[b][0],'cat':c,'lv':LV[c],'u':f'{DDB}/feats/{slug}'}
    if c=='généraux': e['pre']='Niveau 4 ou supérieur'
    if c=='faveur épique': e['pre']='Niveau 19 ou supérieur'
    if c=='Style combat': e['pre']='Capacité Style de combat'
    add(e)
for x in json.load(open(os.path.join(HERE,'cat_phb.json'),encoding='utf8'))['spells']:
    n=first(x['n'])
    if norm(n) in srdspell: continue
    e={'id':'sort-'+x['s'],'k':'sort','n':n,'vo':x['vo'],'b':PHB,'lv':x['lv'],'ec':x['ec'],'cl':[c.strip() for c in x['cl'].split(',')],'ct':x['ct'],'u':f"{AIDE}/spell/fr/{x['s']}"}
    if '|' in x['n']: e['alt']=x['n'].split('|')[1]
    if x['c']: e['conc']=1
    if x['ri']: e['rit']=1
    add(e)
for b,slug,n,lv,ec,c,ri,ct in SUP_SPELLS:
    e={'id':'sort-'+slug.split('-',1)[1],'k':'sort','n':n,'b':BOOKS[b][0],'lv':int(re.match(r'\d+',lv).group()),'ec':EC[ec],'cl':['Artificier'] if b=='EFotA' else [],'ct':ct.replace('1 Bonus Action','Action bonus').replace('1 Action','Action').replace('1 Reaction','Réaction').replace('1 Hour','1 heure').replace('10 Minutes','10 minutes'),'u':f'{DDB}/spells/{slug}'}
    if c: e['conc']=1
    if ri: e['rit']=1
    add(e)
# don lié à l'historique : référence catalogue ou SRD
fn={norm(e['n']):e['id'] for e in out if e['k']=='don'}
srdf={norm(f['name']):f['id'] for f in D['feats']}
for e in out:
    if e['k']=='historique':
        k=norm(re.sub(r'\s*\(.*\)','',e['feat'])) if not e['feat'].startswith('Initié') else None
        if e['feat'].startswith('Initié'): e['featRef']='srd:'+srdf[norm('Initié à la magie')]
        elif k in srdf: e['featRef']='srd:'+srdf[k]
        elif k in fn: e['featRef']='cat:'+fn[k]
from collections import Counter
print(Counter(e['k'] for e in out), Counter(e['b'] for e in out))
print([e['n'] for e in out if e['k']=='historique' and 'featRef' not in e])
js=json.dumps(out,ensure_ascii=False,separators=(',',':'))
out_path=sys.argv[2] if len(sys.argv)>2 else os.path.join(ROOT,'data','hb-cat.json')
open(out_path,'w',encoding='utf8').write(js); print(len(js.encode()),'octets →',out_path)
