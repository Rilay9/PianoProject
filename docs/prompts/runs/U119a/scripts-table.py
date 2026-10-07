# U119a: one line per probe cell, from the probe's JSONs.
# python table.py <probe-out dir> <label> <mode> [state]
import json, sys, pathlib

out, label, mode = sys.argv[1], sys.argv[2], sys.argv[3]
state = sys.argv[4] if len(sys.argv) > 4 else ('paused' if mode == 'paused' else 'refused-play')
rows = []
for f in sorted(pathlib.Path(out).glob(f'{label}-{mode}-*.json')):
    d = json.loads(f.read_text(encoding='utf-8'))
    p = d.get(state) or {}
    if 'error' in p or not p:
        rows.append(f"{d['vw']}x{d['vh']} t{d['text']} {d['face']:5} {d['piece']:4} | ERROR {p.get('error', 'no state')}")
        continue
    sent = [s for s, k in (('Hands', 'handsOnBar'), ('Hear it', 'hearOnBar')) if not p[k]]
    trial = d.get('trial', {})
    bad = {k: v for k, v in trial.items() if v not in ('ok', 'not visible')}
    rows.append(
        f"{d['vw']}x{d['vh']} t{d['text']} {d['face']:5} {d['piece']:4} | "
        f"sheet: {','.join(sent) or '-':13} | rows {p['bar']['rows']}/{p['bar']['controlRows']} h{p['bar']['height']:.0f} grp {p['group']['width']:6.1f}x{p['group']['height']:.0f} | "
        f"back {'ok' if p['back']['whole'] else 'CUT'} | where '{p['where']['shown']}' {'ok' if p['where']['whole'] else 'CUT'} | "
        f"widest '{p['widest']['text']}' {'ok' if p['widest']['whole'] else 'CUT'} | "
        f"title '{p['title']['shown']}' ({p['title']['width']:.1f}) | status [{p['status']['cut']}] '{p['status']['shown']}' ({p['status']['width']:.1f}) | "
        f"trial-bad {bad or '-'} | real ▶ {d.get('realPlay', '-')}"
    )
print('\n'.join(rows))
