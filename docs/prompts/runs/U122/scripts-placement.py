# U122: where the refusal sentence lives, measured both ways on the refusal grid (the model's row in both).
#   A (in the bar's status slot, as U105d allowed): the sentence takes the room the row leaves the
#     status line and the name, the name giving all of it first, wrapped at word boundaries; the row is
#     unchanged, so nothing moves for it (U119a, `responses/759596b4.md` 3(c)).
#   B (its own line across the top of the bar, the recommended place): applied in the page and measured.
# A is computed from the sentence's measured line widths (the narrowest width for each count of lines);
# B is read from the prototype. Today's bar is read from the page as it is.
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from model import allocate, in_group_option

out = pathlib.Path(sys.argv[1])
rows = []
for f in sorted(out.glob('f-refusal-refusal-*.json')):
    d = json.loads(f.read_text(encoding='utf-8'))
    for st in ('refused-play', 'refused-hear'):
        p = d[st]; i, t, m = p['intrinsic'], p['today'], p['proto']
        a = allocate(i, t['innerWidth'], True)
        g = in_group_option(i, a)
        rows.append({
            'cell': f"{d['vw']}x{d['vh']} t{d['text']} {d['face']:5} {d['piece']:4}", 'state': st, 'room': i['barBottom'],
            'today': (t['bar']['height'], t['bar']['top'] >= -0.5, t['status']['cut'] == 'whole (wraps)', t['status']['lines']),
            'A': g, 'B': (m['bar']['height'], m['barInWindow'] and m['refusal']['inWindow'], m['refusal']['whole'], m['refusal']['lines']),
        })
print('cell                       state         | room | today: bar  in-window whole lines | A: bar  in-window lines (or the room against the longest word) | B: bar in-window whole lines')
for r in rows:
    g = r['A']
    a_txt = f"{g['barHeight']:4.0f} {'yes' if g['inWindow'] else 'NO ':3} {g['lines']:2}" if g['feasible'] else f"room {g['room']:.0f} < word {g['longestWord']:.0f}"
    t, b = r['today'], r['B']
    print(f"{r['cell']:26} {r['state']:13} | {r['room']:4.0f} | {t[0]:4.0f} {'yes' if t[1] else 'NO ':3} {'yes' if t[2] else 'NO ':3} {t[3]:3} | {a_txt:30} | {b[0]:4.0f} {'yes' if b[1] else 'NO ':3} {'yes' if b[2] else 'NO ':3} {b[3]}")
n = len(rows)
print()
print(f'{n} refusal states (two per cell, 64 cells).')
print(f"today: bar outside the window in {sum(1 for r in rows if not r['today'][1])}; sentence not whole in {sum(1 for r in rows if not r['today'][2])}; tallest bar {max(r['today'][0] for r in rows):.0f} px; most lines {max(r['today'][3] for r in rows)}")
feas = [r for r in rows if r['A']['feasible']]
print(f"A: the room is narrower than the sentence's longest word in {n - len(feas)} (the sentence would break inside a word or overflow); where it fits, tallest bar {max(r['A']['barHeight'] for r in feas):.0f} px, most lines {max(r['A']['lines'] for r in feas)}, outside the window in {sum(1 for r in feas if not r['A']['inWindow'])}")
print(f"B: outside the window in {sum(1 for r in rows if not r['B'][1])}; not whole in {sum(1 for r in rows if not r['B'][2])}; bar {min(r['B'][0] for r in rows):.0f}–{max(r['B'][0] for r in rows):.0f} px; lines {sorted(set(r['B'][3] for r in rows))}")
grow_today = [r['today'][0] for r in rows]
