"""Quick look at probe outputs: one line per state, for checking the probe before the full grid."""
import glob
import json
import sys

pattern = sys.argv[1] if len(sys.argv) > 1 else 't1-*.json'
base = '<worktree>/build/u122a/out/'
STATES = ['rest', 'rest-refused-play', 'rest-refused-hear', 'rest-refused-after-tempo', 'rest-refused-after-resize', 'run-frozen', 'run-folded', 'paused', 'paused-refused-play']
for f in sorted(glob.glob(base + pattern)):
    d = json.load(open(f, encoding='utf-8'))
    print('==', f.split('/')[-1], {k: v for k, v in d.items() if 'error' in k})
    for st in STATES:
        s = d.get(st)
        if not s:
            print('  ', st, 'MISSING')
            continue
        if 'error' in s:
            print('  ', st, 'ERR', s['error'][:200])
            continue
        g = s['glass']
        geo = s['geometry']
        t = s['texts']
        ch = {k: (v['notes'], v['texts'], v['paths']) for k, v in g['chrome'].items() if v['overStage']}
        ref = s.get('refusal')
        print(f"  {st:26s} ch={s['chrome']} stageH={g['stage']['height'] if g['stage'] else None} stave={g['stavePx']} sTop={g['staveTop']} fit={g['fitBy']} sc={g['scale']} fz={g['frozen']} bars={g['bars']} shown={g['barsShown']}/{g['barsAsked']} slots={g['slotCount']} barH={geo['bar']['height'] if geo['bar'] else None} topH={geo['top']['height'] if geo['top'] else None} over={ch}")
        line = f"     title={t['title']['shown']!r} where={t['where']['cut']} widest={t['widest']['cut']} status={t['status']['shown'][:40]!r}/{t['status']['cut']} mode={t['mode']['label']!r}/{t['mode']['whole']} tempo={t['tempo']['text']!r} hear={t['hearOnBar']} hands={t['handsOnBar']} rows={s['controlRows']}"
        if ref:
            n = ref['named']
            line += f" REF whole={ref['whole']} lines={ref['lines']} inWin={ref['inWindow']} named={n['shown'] if n else None}/{n['missed'] if n else None}"
        print(line)
