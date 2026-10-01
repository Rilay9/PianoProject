"""U119: on every grid cell whose left group did not overflow on the committed CSS, are the clip's numbers the same?"""
import glob
import json
import os

here = os.path.dirname(os.path.abspath(__file__))
same, differ, overflowed = 0, [], 0
for f in sorted(glob.glob(os.path.join(here, 'probe-out', 'grid-*-base.json'))):
    base = json.load(open(f, encoding='utf-8'))['paused']
    h1 = json.load(open(f.replace('-base.json', '-h1.json'), encoding='utf-8'))['paused']
    if base['group']['scrollWidth'] > base['group']['width'] + 1:
        overflowed += 1
        continue
    keys = lambda p: [p['group']['width'], p['back']['box'], p['title']['box'], p['where']['box'], p['status']['box'], p['status']['shown'], [c.get('box') for c in p['controls']]]
    if keys(base) == keys(h1):
        same += 1
    else:
        differ.append(os.path.basename(f))
moved = []
for f in sorted(glob.glob(os.path.join(here, 'probe-out', 'grid-*-base.json'))):
    base = json.load(open(f, encoding='utf-8'))['paused']
    h1 = json.load(open(f.replace('-base.json', '-h1.json'), encoding='utf-8'))['paused']
    lay = lambda p: [p['group']['width'], p['back']['box'], p['where']['box'], p['status']['box'], [c.get('box') for c in p['controls']], p['bar']]
    if lay(base) != lay(h1):
        moved.append(os.path.basename(f))
print(f'cells (of 32) where the clip moved any box or changed the bar: {moved}')
print(f'cells whose group fitted on the committed CSS: {same + len(differ)}; same under the clip: {same}; different: {differ}; cells that overflowed: {overflowed}')
