# U122: the predicted-outcome tables, from the prototype runs (U122_PROTO=1), where each state carries
# today's bar, every item's own width, and the model applied in the page and measured.
#
#   python outcomes.py <probe-out dir> <label> <mode> [--md]
#
# Per cell and state: today (which controls are behind ⋯, the mode select's label whole or cut, the
# tempo label, the status and the name, the bar's height and top) beside the model as Chromium laid it
# out (the configuration, every invariant checked on the page). Then the cells where the model changes
# an outcome, by kind, and the invariant failures on either side.
import json, pathlib, sys
from collections import defaultdict

out, label, mode = pathlib.Path(sys.argv[1]), sys.argv[2], sys.argv[3]
md = '--md' in sys.argv
STATES = {'paused': ['atRest', 'paused'], 'refusal': ['atRest', 'refused-play', 'refused-hear', 'refused-after-tempo', 'refused-after-resize', 'paused-refused-play'],
          'upright': ['atRest']}[mode]

def gone(hear, hands):
    return ', '.join(x for x, on in (('Hands', hands), ('Hear it', hear)) if not on) or '—'

rows, changes, fails_today, fails_model, configs = [], defaultdict(list), defaultdict(list), defaultdict(list), defaultdict(set)
for f in sorted(out.glob(f'{label}-{mode}-*.json')):
    d = json.loads(f.read_text(encoding='utf-8'))
    cell = f"{d['vw']}×{d['vh']} {d['text']}% {d['face']} {d['piece']}"
    for st in STATES:
        p = d.get(st)
        if not p or 'error' in p or 'proto' not in p:
            rows.append((cell, st, 'ERROR', (p or {}).get('error', 'missing')))
            continue
        t, i, m = p['today'], p['intrinsic'], p['proto']
        sideways = 'back' in i
        if not m.get('fits'):
            fails_model['no configuration fits'].append(f'{cell} {st}')
            rows.append((cell, st, 'NO FIT', ''))
            continue
        c = m['chosen']
        configs[cell].add((c['hear'], c['hands'], c['mode'], c['tempo']))
        refused = t.get('refused') is not None
        # Today's invariants, as the page measured them.
        if t['mode']['cut']:
            fails_today['mode label cut'].append(f'{cell} {st}')
        if t['bar']['top'] < -0.5:
            fails_today['bar above the window'].append(f'{cell} {st}')
        play = next(x for x in t['controls'] if x['id'] == 'score-play')
        if play['top'] < -0.5:
            fails_today['▶ above the window'].append(f'{cell} {st}')
        if sideways and refused and t['status']['top'] < -0.5:
            fails_today['refusal sentence above the window'].append(f'{cell} {st}')
        if sideways and refused and t['status']['cut'] != 'whole (wraps)':
            fails_today['refusal sentence not whole'].append(f'{cell} {st}')
        if sideways and not t['where']['whole']:
            fails_today['bar n / m cut'].append(f'{cell} {st}')
        # A yielding text drawn narrower than its first letter and a whole ellipsis: a bare letter, or
        # part of one, with no mark that it was cut.
        under = lambda w, floor: floor and 0.5 < w < floor - 0.5
        if sideways and under(t['title']['width'], i.get('titleFloor', 0)):
            fails_today['name drawn under its floor (no whole mark)'].append(f"{cell} {st} ({t['title']['width']:.1f} < {i['titleFloor']:.1f})")
        if sideways and not refused and under(t['status']['width'], i.get('statusFloor', 0)):
            fails_today['status drawn under its floor (no whole mark)'].append(f"{cell} {st} ({t['status']['width']:.1f} < {i['statusFloor']:.1f})")
        # The model's invariants, as Chromium laid it out.
        checks = {
            'control rows ≠ 1': m['controlRows'] != 1,
            'bar outside the window': not m['barInWindow'],
            'a control outside the window': not m['controlsInWindow'],
            'a tap point misses its control': bool(m['missed']),
            'mode label cut': not m['modeWhole'],
            'tempo label cut': not m['tempoWhole'],
            '▶ or ⋯ under the tap minimum': m['playW'] < 39.5 or m['moreW'] < 39.5,
        }
        if sideways:
            checks.update({'Back cut': not m['backWhole'], 'bar n / m cut': not m['whereWhole'], 'widest bar m / m cut': not m['widestWhole']})
            if refused:
                r = m['refusal']
                checks.update({'refusal not whole': not r['whole'], 'refusal outside the window': not r['inWindow'], 'refusal not above the controls': not r['aboveControls']})
            elif m['status']['cut'] == 'flush':
                checks['status cut flush'] = True
            if m['title']['cut'] == 'flush':
                checks['name cut flush'] = True
            if under(m.get('titleW', 0), i.get('titleFloor', 0)):
                checks['name drawn under its floor'] = True
            if not refused and under(m.get('statusW', 0), i.get('statusFloor', 0)):
                checks['status drawn under its floor'] = True
        for k, bad in checks.items():
            if bad:
                fails_model[k].append(f'{cell} {st}')
        # What changes for a learner.
        if t['handsOnBar'] != c['hands']:
            changes['Hands ' + ('back on the bar' if c['hands'] else 'behind ⋯')].append(f'{cell} {st}')
        if t['hearOnBar'] != c['hear']:
            changes['Hear it ' + ('back on the bar' if c['hear'] else 'behind ⋯')].append(f'{cell} {st}')
        long_today = t['mode']['label'] in ('Wait for me', 'Keep tempo', 'Play it to me', 'Free play')
        mode_change = f"mode: today '{t['mode']['label']}'{' cut' if t['mode']['cut'] else ''} → {c['mode']} words, whole"
        if t['mode']['cut'] or long_today != (c['mode'] == 'long'):
            changes[f"mode label {'cut' if t['mode']['cut'] else 'whole'} today ({'long' if long_today else 'short'}) → {c['mode']}, whole"].append(f'{cell} {st}')
        tempo_long_today = '%' in (t['tempo']['text'] or '')
        if tempo_long_today != (c['tempo'] == 'long'):
            changes[f"tempo label {'with' if tempo_long_today else 'without'} % today → {'with' if c['tempo'] == 'long' else 'without'} %"].append(f'{cell} {st}')
        line = {
            'cell': cell, 'state': st,
            'today': f"⋯ {gone(t['hearOnBar'], t['handsOnBar'])}; mode '{t['mode']['label']}' {'CUT ' + format(t['mode']['width'], '.0f') + '/' + format(t['mode']['needs'], '.0f') if t['mode']['cut'] else 'whole'}; tempo '{t['tempo']['text']}'",
            'model': f"⋯ {gone(c['hear'], c['hands'])}; mode {c['mode']} '{m['modeLabel']}'; tempo '{m['tempoText']}'",
        }
        if sideways:
            line['today'] += f"; name '{t['title']['shown']}'; status '{t['status']['shown'] if not refused else ('whole' if t['status']['cut'] == 'whole (wraps)' else 'CUT')} ' ({t['status']['width']:.0f} px{', ' + str(t['status']['lines']) + ' lines' if refused else ''}); bar {t['bar']['height']:.0f} px, top {t['bar']['top']:.0f}"
            line['model'] += f"; name '{m['title']['shown']}'; " + (f"refusal line {m['refusal']['lines']} line(s)" if refused else f"status '{m['status']['shown']}'") + f"; bar {m['bar']['height']:.0f} px, top {m['bar']['top']:.0f}"
            # How many characters of the yielding text a learner reads, today and with the model.
            shown = lambda s: len((s or '').replace('…', '').replace('?', ''))
            if not refused:
                for what, a, b in (('status', t['status']['shown'], m['status']['shown']), ('name', t['title']['shown'], m['title']['shown'])):
                    if (t['status']['text'] if what == 'status' else 'x') == '':
                        continue
                    da, db = shown(a), shown(b)
                    if db < da:
                        changes[f'{what}: fewer characters shown'].append(f'{cell} {st} ({da} → {db})')
                    elif db > da:
                        changes[f'{what}: more characters shown'].append(f'{cell} {st} ({da} → {db})')
            if refused and abs(m['bar']['height'] - t['bar']['height']) > 1:
                changes['refusal: bar ' + ('taller' if m['bar']['height'] > t['bar']['height'] else 'shorter') + ' than today'].append(f"{cell} {st} ({t['bar']['height']:.0f} → {m['bar']['height']:.0f})")
        rows.append(line)

state_dependent = [cell for cell, s in configs.items() if len(s) > 1]
if md:
    print('| cell | state | today | model (applied, measured) |')
    print('| --- | --- | --- | --- |')
    for r in rows:
        if isinstance(r, tuple):
            print(f'| {r[0]} | {r[1]} | {r[2]} | {r[3]} |')
        else:
            print(f"| {r['cell']} | {r['state']} | {r['today']} | {r['model']} |")
    print()
else:
    for r in rows:
        if isinstance(r, tuple):
            print(*r)
        else:
            print(f"{r['cell']:30} {r['state']:21} TODAY {r['today']}\n{'':52} MODEL {r['model']}")
print(f'\n{len(rows)} states, {len(configs)} cells.')
print(f'Configuration differs between states of one cell: {len(state_dependent)}' + (f' ({", ".join(state_dependent)})' if state_dependent else ''))
print('\nToday, invariant failures (measured):')
for k, v in sorted(fails_today.items()):
    print(f'  {k}: {len(v)}' + (f" — {'; '.join(v[:80])}" if len(v) <= 80 else ''))
print('\nModel, invariant failures (applied, measured):')
if not fails_model:
    print('  none')
for k, v in sorted(fails_model.items()):
    print(f'  {k}: {len(v)} — {"; ".join(v)}')
print('\nWhere the model changes an outcome:')
for k, v in sorted(changes.items()):
    print(f'  {k}: {len(v)} — {"; ".join(v)}')
