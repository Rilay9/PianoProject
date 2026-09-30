"""Summarise G101's facts files for one phase: the Twinkle rows line by line, and the whole list."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parents[2] / 'docs' / 'prompts' / 'pictures' / 'g101'
phase = sys.argv[1]
print(f'phase {phase}: docs/prompts/pictures/g101/{phase}-facts-<size>-<face>.json, 342 x 740')
for face in ('stack', 'wide'):
    for size in (100, 115):
        f = HERE / f'{phase}-facts-{size}-{face}.json'
        d = json.loads(f.read_text(encoding='utf-8'))
        a = d['all']
        print(f'== {phase} {size}% {face}: {a["count"]}; rows {a["rows"]}; lines needed {a["byLines"]}; title widths {a["titleWidths"]}; titles cut {a["cut"]}; needing more than three lines {len(a["beyondThree"])}')
        print(f'  cut sideways (a word wider than the column): {a.get("sideways")}')
        s = a.get('siblings')
        if s:
            print(f'  sibling titles {s["count"]} (drawn {s["drawn"]}), lines needed {s["byLines"]}; the most: {s["beyondThree"][:3]}')
        for line in a.get('longest', [])[:6]:
            print(f'  longest: {line}')
        for line in a.get('tallest', [])[:3]:
            print(f'  tallest: {line}')
        for t in d['twinkle']:
            print(f'  {t["id"]}: needs {t["linesNeeded"]}, shows {t["linesShown"]}, clamp {t["clamp"]}, clipped {t["clipped"]}, client {t["client"]}, scroll {t["scroll"]}, row {t["row"]}, column {t["titleColumn"]}, actions {t["actions"]}, root {t["rootFont"]}')
            for line in t['lines']:
                print(f'      | {line}')
