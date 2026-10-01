# U119a: the same probe cell before and after, side by side, for what the change may and may not move.
# python compare.py <probe-out dir> <before label> <after label> <mode> [state]
import json, sys, pathlib

out, before, after, mode = sys.argv[1:5]
state = sys.argv[5] if len(sys.argv) > 5 else ('paused' if mode == 'paused' else 'refused-play')
moved_title, moved_controls, status_changes, sheet, cut_after, flush_after = [], [], [], [], [], []
n = 0
for fb in sorted(pathlib.Path(out).glob(f'{before}-{mode}-*.json')):
    fa = pathlib.Path(out) / fb.name.replace(f'{before}-', f'{after}-', 1)
    if not fa.exists():
        continue
    b = json.loads(fb.read_text(encoding='utf-8'))[state]
    a = json.loads(fa.read_text(encoding='utf-8'))[state]
    n += 1
    cell = fb.stem.replace(f'{before}-{mode}-', '')
    if abs(b['title']['width'] - a['title']['width']) > 0.05 or b['title']['shown'] != a['title']['shown']:
        moved_title.append(f"{cell}: title '{b['title']['shown']}' ({b['title']['width']}) -> '{a['title']['shown']}' ({a['title']['width']})")
    left = lambda p: {c['sel']: (c['left'], c['right']) for c in p['controls'] if c.get('onBar')}
    if (a['handsOnBar'], a['hearOnBar']) != (b['handsOnBar'], b['hearOnBar']):
        sent = [s for s, k in (('Hands', 'handsOnBar'), ('Hear it', 'hearOnBar')) if not a[k]]
        sheet.append(f"{cell}: behind ⋯ after: {', '.join(sent)}")
    elif left(a) != left(b):
        moved_controls.append(f"{cell}: a control moved with the same controls on the bar")
    if b['status']['shown'] != a['status']['shown']:
        status_changes.append(f"{cell}: [{b['status']['cut']}] '{b['status']['shown']}' -> [{a['status']['cut']}] '{a['status']['shown']}'")
    if not (a['back']['whole'] and a['where']['whole'] and a['widest']['whole']):
        cut_after.append(f"{cell}: back {a['back']['whole']} where {a['where']['whole']} widest {a['widest']['whole']}")
    if a['status']['cut'] == 'flush':
        flush_after.append(f"{cell}: '{a['status']['shown']}'")
print(f'cells compared: {n}')
for head, rows in (
    ('Title moved (width or visible text)', moved_title),
    ('Controls sent behind the more button by the change', sheet),
    ('Controls moved with the same set on the bar', moved_controls),
    ('Back, bar n / m or the widest bar m / m cut after', cut_after),
    ('Status cut flush after', flush_after),
    ('Status visible text changed', status_changes),
):
    print(f'\n{head}: {len(rows)}')
    for r in rows:
        print('  ' + r)
