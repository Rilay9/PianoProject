"""The at-rest window under the row as the app pads it (f) and with the row flush to its controls (ff): stage height, stave,
the fit's term, bars shown / asked, and whether the next bar is in view, per cell. Prints only the cells that differ, then a count."""
import glob
import json
import sys

A, B = sys.argv[1], sys.argv[2]  # e.g. f ff
diff = same = 0
for fa in sorted(glob.glob(f'build/u122b/out-{A}/{A}-*.json')):
    fb = fa.replace(f'out-{A}', f'out-{B}').replace(f'\\{A}-', f'\\{B}-').replace(f'/{A}-', f'/{B}-')
    da, db = json.load(open(fa, encoding='utf-8')), json.load(open(fb, encoding='utf-8'))
    row = []
    for d in (da, db):
        g = d['rest']['glass']
        row.append((round(g['stage']['height']), g['stavePx'], g['fitBy'], g['barsShown'], g['barsAsked'], g['ahead'], len(g['bars'])))
    name = f"{da['vw']}x{da['vh']} t{da['text']} {da['face']} {da['piece']}"
    if row[0][1:] != row[1][1:]:
        diff += 1
        print(f'{name}: {A} stage {row[0][0]} stave {row[0][1]} {row[0][2]} bars {row[0][3]}/{row[0][4]} inked {row[0][6]} | {B} stage {row[1][0]} stave {row[1][1]} {row[1][2]} bars {row[1][3]}/{row[1][4]} inked {row[1][6]}')
    else:
        same += 1
print(f'{same} cells with the same at-rest window, {diff} differ')
