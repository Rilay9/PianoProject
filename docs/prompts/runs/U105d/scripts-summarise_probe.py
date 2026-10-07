"""U105d: one line per read from the probe's JSONs (build/u105d/probe-out/<label>-*.json)."""
import json
import pathlib
import sys

out = pathlib.Path(__file__).parent / 'probe-out'
label = sys.argv[1] if len(sys.argv) > 1 else 'probe'
for f in sorted(out.glob(f'{label}-*.json')):
    d = json.loads(f.read_text(encoding='utf-8'))
    print(f"== {d['where']} / {d['face']} / {d['variant']}")
    for key in ('ordinary', '#score-play', '#score-hear'):
        m = d.get(key)
        if m is None:
            continue
        s = m['status']
        bar = m['bar']
        over = [c['id'] for c in m['controls'] if c['overStatus']]
        not_self = [h for h in s['hits'] if h != 'self']
        stash = [c['id'] for c in m['inBar'] if not c['inBar']]
        print(
            f"  {key:12} bar h={bar['height']} scrollH={bar['scrollHeight']} rows={len(bar['rows'])} "
            f"| status {s['scrollWidth']}/{s['clientWidth']} inside={s['textInside']} ellipsis={s['ellipsis']} "
            f"lines={s['lineCount']} h={s['height']} w={s['width']} "
            f"| title w={m['title']['width']} (of {m['title']['scrollWidth']}) "
            f"| left {m['left']['left']}..{m['left']['right']} "
            f"| rightmost={m['rightmost']} of {m['innerWidth']} "
            f"| over={over} hitsNotSelf={not_self[:3]} stash={stash} hands={m['handsInBar']} "
            f"| vis={m['visible']} op={m['barOpacity']} running={m['running']} marks={m['refusedMarks']}"
        )
        if key != 'ordinary':
            print(f"               text={s['text']!r}")
        else:
            print(f"               text={s['text']!r}")
