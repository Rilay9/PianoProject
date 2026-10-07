# U122: the one priority the model had to choose — the controls' long words against the ordinary status
# line's room — compared as applied and measured in the page. Two runs of the same paused grid:
#   p-paused: the long words before the status line (no band);
#   f-paused: the status line keeps its 28vw band before any long word (the recommended order).
# Per cell: the characters of the paused line a learner reads today, under each order, and the forms.
import json, pathlib, sys

out = pathlib.Path(sys.argv[1])
chars = lambda s: len((s or '').replace('…', ''))
rows = []
for f in sorted(out.glob('f-paused-paused-*.json')):
    g = out / f.name.replace('f-paused', 'p-paused')
    if not g.exists():
        continue
    a, b = json.loads(g.read_text(encoding='utf-8'))['paused'], json.loads(f.read_text(encoding='utf-8'))['paused']
    d = json.loads(f.read_text(encoding='utf-8'))
    t = b['today']
    rows.append((f"{d['vw']}x{d['vh']} t{d['text']} {d['face']:5} {d['piece']:4}", chars(t['status']['shown']),
                 chars(a['proto']['status']['shown']), a['proto']['chosen'], chars(b['proto']['status']['shown']), b['proto']['chosen']))
fmt = lambda c: f"{'H' if c['hands'] else '-'}{'E' if c['hear'] else '-'} {c['mode'][0]}{c['tempo'][0]}"
print('cell                       | today | words first: chars cfg | status band: chars cfg   (cfg: H Hands on, E Hear it on; mode,tempo l/s)')
for r in rows:
    print(f'{r[0]:26} | {r[1]:5} | {r[2]:18} {fmt(r[3]):6} | {r[4]:18} {fmt(r[5])}')
for name, k in (('today', 1), ('words first', 2), ('status band', 4)):
    print(f'{name:12}: paused line at 2 characters or fewer in {sum(1 for r in rows if r[k] <= 2):2} of {len(rows)} cells; 6 or fewer in {sum(1 for r in rows if r[k] <= 6):2}; median {sorted(r[k] for r in rows)[len(rows) // 2]}')
