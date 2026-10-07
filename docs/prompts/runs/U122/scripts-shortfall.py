# U122: where the model sends a control behind ⋯ that the bar keeps today, how many pixels short the
# row is of keeping it with every word in its short form, and how far today's mode select is squeezed
# below its own label there. Read from the model runs' JSONs (U122_PROTO=1, label m-*).
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from model import TAP_MIN

def need(i, hear, hands, sideways):
    gb = i['barGap']
    play = max(i['play'], i['playMin'], TAP_MIN); more = max(i['more'], i['moreMin'], TAP_MIN)
    ws = [play, max(i['modeShort'].values()), i['tempoShortWidest']['width'], more]
    ws += [max(i['hear'], i.get('hearStop', 0))] if hear else []
    ws += [i['hands']] if hands else []
    gmin = (i['back'] + i['whereWidest']['width'] + 3 * i['groupGap']) if sideways else 0
    return gmin + sum(ws) + (len(ws) - (0 if sideways else 1)) * gb

out = pathlib.Path(sys.argv[1])
for f in sorted(out.glob('f-*.json')):
    d = json.loads(f.read_text(encoding='utf-8'))
    p = d.get('atRest')
    if not p or 'proto' not in p:
        continue
    i, t, m = p['intrinsic'], p['today'], p['proto']
    c = m['chosen']
    sideways = 'back' in i
    for name, today_on, model_on, keep in (('Hands', t['handsOnBar'], c['hands'], (True, True)), ('Hear it', t['hearOnBar'], c['hear'], (True, False))):
        if today_on and not model_on:
            short = need(i, keep[0], keep[1], sideways) - i['rowWidth']
            print(f"{f.stem:44} {name:8} leaves: the row is {short:5.1f} px short of keeping it with short words; "
                  f"today the select is drawn {t['mode']['width']:.0f} px of the {t['mode']['needs']:.0f} its label '{t['mode']['label']}' needs ({t['mode']['needs'] - t['mode']['width']:.0f} px under)")
