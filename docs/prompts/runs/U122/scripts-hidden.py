# U122: the cells where a control a refusal can name is behind ⋯ (U119a's ruling, `responses/759596b4.md`
# 3(b): "a visible recovery/refusal instruction must never direct the learner to a control that the same
# layout has just hidden"). A hand's refusal (*Sound did not start — tap R again*, after *Nothing for the
# … hand*) names R, L or Both; `Hear it`'s names `Hear it`. Today and with the model, at rest.
import json, pathlib, sys

out = pathlib.Path(sys.argv[1])
seen = {}
for f in sorted(out.glob('f-*.json')):
    d = json.loads(f.read_text(encoding='utf-8'))
    p = d.get('atRest')
    if not p or 'proto' not in p:
        continue
    t, c = p['today'], p['proto']['chosen']
    cell = f"{d['vw']}x{d['vh']} t{d['text']} {d['face']} {d['piece']}"
    seen[cell] = (t['handsOnBar'], t['hearOnBar'], c['hands'], c['hear'])
for what, k_today, k_model in (('Hands', 0, 2), ('Hear it', 1, 3)):
    today = sorted(c for c, v in seen.items() if not v[k_today])
    model = sorted(c for c, v in seen.items() if not v[k_model])
    print(f'{what} behind ⋯ — today {len(today)} cells, model {len(model)} cells, of {len(seen)}')
    print(f'  model only: {sorted(set(model) - set(today))}')
    print(f'  today only: {sorted(set(today) - set(model))}')
    print(f'  both: {sorted(set(model) & set(today))}')
