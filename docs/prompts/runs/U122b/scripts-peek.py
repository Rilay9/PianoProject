"""Prints one line per state for each JSON in build/u122b/out (a trial peek, not the analysis)."""
import glob
import json
import sys

ORDER = ['rest', 'rest-refused-play', 'rest-refused-hear', 'rest-cleared', 'rest-tempo', 'count', 'armed',
         'playing', 'pausedEarly', 'paused', 'paused-refused', 'paused-cleared', 'finished']
pat = sys.argv[1] if len(sys.argv) > 1 else '*'
for f in sorted(glob.glob(f'build/u122b/out/{pat}.json')):
    d = json.load(open(f, encoding='utf-8'))
    print('==', f.split('\\')[-1].split('/')[-1], 'error:', d.get('error'), 'steps:', d['steps'])
    for k in ORDER:
        v = d.get(k)
        if v is None:
            continue
        for var in (['A', 'B'] if 'A' in v else ['-']):
            m = v[var] if var != '-' else v
            if 'error' in m:
                print(f'  {k:16} {var} ERR {m["error"][:200]}')
                continue
            x, g = m['x'], m['glass']
            ch = {n: (c['notes'], c['texts'], c['lines'], c['otherPaths']) for n, c in g['chrome'].items() if (c['notes'] or c['texts'] or c['lines'] or c['otherPaths'])}
            pr = {n: (c['notes'], c['texts'], c['lines'], c['otherPaths']) for n, c in g['priced'].items()}
            ctrls = {c['id'].replace('score-', ''): (c['rect']['width'], c['rect']['height'], len(c['missed'] or [])) for c in m['controls'] if c['shown']}
            run = x['run']
            print(f"  {k:16} {var} chrome={x['chromeAttr']} barVis={x['barVisible']} stave={g['stavePx']} top={g['staveTop']} stage={g['stage']['top']}/{g['stage']['height']} "
                  f"msg={x['msg']['content']!r} {x['msg']['vis']['cut']} fits={x['msg']['fits']} status={x['status']['content']!r} drawn={x['status']['drawn']} chip={x['chipText']!r} "
                  f"cnt={x['countIn']['shown']} run={(run or {}).get('step')},{(run or {}).get('paused')},{(run or {}).get('armed')}")
            print(f"      title={m['texts']['title']['cut']} where={m['texts']['where']['cut']} ctrls={ctrls}")
            print(f"      over-ink={ch}")
            if k in ('count', 'armed', 'playing'):
                print(f"      priced={pr}")
            if x.get('summary'):
                s = x['summary']
                print(f"      summary h={s['heading']} buttons={[(b['id'], b['share'], b['hitVisible']) for b in s['buttons']]} first={s.get('firstStat')} scroll={s['scrollTop']}/{s['scrollHeight']}/{s['clientHeight']}")
            if k.endswith('refused') or k == 'paused-refused':
                pr2 = x['pricedRefusals']
                print(f"      refusal room={pr2['room']} besideWhere={pr2['besideWhere']} widest={max(w['w'] for w in pr2['widths'])}")
