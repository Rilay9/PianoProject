# U122: does the model's arithmetic describe the bar Chromium lays out? For every measured state, today's
# row is rebuilt from today's own drawn widths with the model's gap accounting, and the left group's
# width it implies is compared with the group's measured width (sideways), or the row's sum with the
# bar's width (upright, where the row is centred). A difference beyond half a pixel is printed.
import json, pathlib, sys

out = pathlib.Path(sys.argv[1])
worst = 0.0
n = 0
prefix = sys.argv[2] if len(sys.argv) > 2 else ''
for f in sorted(out.glob(prefix + '*.json')):
    d = json.loads(f.read_text(encoding='utf-8'))
    for st, p in d.items():
        if not isinstance(p, dict) or 'today' not in p:
            continue
        t, i = p['today'], p['intrinsic']
        drawn = [c for c in t['controls'] if c.get('onBar') and c['id'] != 'score-back-side']
        # The hands group is one bar child: its three buttons are counted once, at the group's width.
        widths = [c['width'] for c in drawn if not c['id'].startswith('score-hands-')]
        if t['handsOnBar']:
            widths.append(i['handsNow'])
        gb = i['barGap']
        if 'group' in t:
            # Only where the group is squeezed (its content wider than its box) is the room it gets
            # exactly what the controls leave; elsewhere it keeps its content width and the rest is
            # the auto margin's.
            # (The group clips with `overflow-x: clip`, which is no scroll container, so its scrollWidth
            # says nothing: the name being cut is the sign, since only a squeezed group cuts it.)
            if t['title']['cut'] not in ('ellipsis', 'nothing drawn', 'flush'):
                continue
            implied = i['rowWidth'] - sum(widths) - len(widths) * gb
            diff = implied - t['group']['width']
        else:
            hands_left = min(c['left'] for c in drawn)
            hands_right = max(c['right'] for c in drawn)
            implied = sum(widths) + (len(widths) - 1) * gb
            diff = implied - (hands_right - hands_left)
        n += 1
        worst = max(worst, abs(diff))
        if abs(diff) > 0.5:
            print(f"{f.name} {st}: implied {implied:.2f} vs measured {t.get('group', {}).get('width', hands_right - hands_left if 'group' not in t else 0):.2f} (diff {diff:+.2f})")
print(f'{n} states checked; largest difference {worst:.2f} px')
