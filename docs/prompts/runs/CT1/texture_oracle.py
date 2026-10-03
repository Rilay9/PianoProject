"""Bar-level comparison (run from the repository root after fetching the ALGOMUS archive into build/ct1/algomus and stripping <harmony> into build/ct1/algomus/clean, as measurements-2026-10-03.md says) of figures.py with the ALGOMUS expert texture labels (O3)."""
import json,re,sys,collections
from fractions import Fraction
from pathlib import Path
sys.path.insert(0,'tools/content')
import figures
from music21 import converter
A=Path('build/ct1/algomus/mozart-piano-sonatas')
def label_bars(dez, bars):
    d=json.load(open(dez)); out={}
    starts=[b.start for b in bars]
    for l in d['labels']:
        if l.get('type')!='Texture': continue
        s=Fraction(l.get('start',0)).limit_denominator(64)
        idx=max(i for i,st in enumerate(starts) if st<=s+Fraction(1,64))
        out.setdefault(idx,[]).append(l['tag'])
    return out
def parts(tag):
    # a label may split the bar with commas; each part may carry a density prefix like 2h[...]
    return [re.sub(r'^\d+\w*\[|\]$','',p.strip()) for p in tag.split(',')]
def layers(part):
    return [x for x in re.split(r'/(?![^(]*\))',part)]
def acc_part(part):
    L=layers(part)
    # a melodic layer above, and below it a layer whose function includes H or S and is not purely melodic
    return len(L)>=2 and L[0].startswith('M') and any(re.match(r'(MH|MHS|HS|H|S)',x) and re.search(r'[HS]',x.split('(')[0]) for x in L[1:])
def gold_acc(tags):
    return any(acc_part(p) for t in tags for p in parts(t))
def single_voice_acc(tags):
    return any(re.search(r'/HS1|/H1|/S1',t) for t in tags[:1])
tot=collections.Counter(); rows=[]
for mv in ['k279.1','k279.2','k279.3','k280.1','k280.2','k280.3','k283.1','k283.2','k283.3']:
    sc=figures.from_music21(Path('build/ct1/algomus/clean')/f'{mv}.xml')
    dez=A/'analysis'/f"K{mv[1:4]}-{mv[-1]}_texture.dez"
    lb=label_bars(dez, sc.bars)
    res=figures.match(sc)
    for b in range(len(sc.bars)):
        tags=lb.get(b,[])
        if not tags: continue
        g=gold_acc(tags); g1=single_voice_acc(tags)
        tot['labelled bars']+=1; tot['gold accompaniment bars']+=g; tot['gold single-voice acc (…/HS1,/H1,/S1)']+=g1
        flagged=[n for n,v in res.items() if (b+1) in v['underTune']]
        for n in flagged:
            tot[f'{n}: flagged']+=1; tot[f'{n}: in gold accompaniment']+=g
            if not g: rows.append((mv,b+1,n,tags[0]))
        if flagged: tot['any figure flagged']+=1; tot['any figure flagged, in gold acc']+=g
        elif g: tot['gold acc, no figure flagged']+=1
for k,v in tot.items(): print(f'{k}: {v}')
print('--- figure bars outside gold accompaniment (first 25):')
for r in rows[:25]: print('  ',r)
json.dump({'counts':tot,'outside':rows},open('docs/prompts/runs/CT1/texture-oracle.json','w'),indent=1,default=str)
