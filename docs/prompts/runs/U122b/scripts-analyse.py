"""U122b: the per-state, per-cell checks from the probe's JSON (build/u122b/out/<label>-*.json).

Writes, into the folder given as the second argument (default build/u122b/tables):
  states.txt    every cell, every state: the four checks under B (c6 applied per state), and A where measured
  summary.txt   per state, how many cells pass each check under B; A's results beside them
  refusal.txt   per cell: the refusal sentences against the room the top line leaves beside `bar n / m`
  music.txt     per cell: the music's top edge and the five-line stave through the walk, and every move
  pause.txt     per cell: where a lone ⏸ (and the count's numerals at the app's size) would cover ink
  finished.txt  per finishing cell: the result and the next action in view, A against B
  notes.txt     per cell: the notes a state might say, against the top line's room

The checks (the brief's four, per state; the table is the brief's):
  1 shown      the state's necessary action and context are drawn, and the control it names is directly
               reachable: drawn, in the window, hit at five points, and Back / ▶ / ⋯ at 40 px both ways
  2 hidden     what the state's row says to hide is not drawn
  3 music      the stave's top edge and five-line size, and whether they changed since the previous state
  4 ink        no drawn chrome or message box over the notation on the stage (deeper than a 2 px touch)
Usage: python analyse.py <label> [outdir]
"""
import glob
import json
import os
import sys

LABEL = sys.argv[1] if len(sys.argv) > 1 else 'g'
OUTDIR = sys.argv[2] if len(sys.argv) > 2 else 'build/u122b/tables'
SRC = sys.argv[3] if len(sys.argv) > 3 else 'build/u122b/out'
os.makedirs(OUTDIR, exist_ok=True)
FLOOR = 40 - 0.5
TOUCH = 2.0

WALK = ['rest', 'rest-refused-play', 'rest-refused-hear', 'rest-cleared', 'rest-tempo', 'count', 'count2', 'armed',
        'playing', 'paused', 'paused-refused', 'paused-cleared', 'finished']
KIND = {'rest': 'rest', 'rest-refused-play': 'refused', 'rest-refused-hear': 'refused', 'rest-cleared': 'rest',
        'rest-tempo': 'rest', 'count': 'count', 'count2': 'count', 'armed': 'armed', 'playing': 'playing', 'paused': 'paused',
        'paused-refused': 'refused', 'paused-cleared': 'paused', 'finished': 'finished'}
NAMED = {'rest-refused-play': 'score-play', 'rest-refused-hear': 'score-hear', 'paused-refused': 'score-play'}
FLOORED = {'score-back-side', 'score-play', 'score-more'}


def cells():
    for f in sorted(glob.glob(f'{SRC}/{LABEL}-*.json')):
        d = json.load(open(f, encoding='utf-8'))
        d['_name'] = f"{d['vw']}x{d['vh']} t{d['text']} {d['face']} {d['piece']}"
        yield d


def variant(d, key, var):
    v = d.get(key)
    if v is None:
        return None
    if 'A' in v or 'B' in v:
        return v.get(var)
    return v if var == 'B' else None


def ctrl(m, cid):
    for c in m['controls']:
        if c['id'] == cid:
            return c
    return None


def reach(m, cid, floored=False):
    c = ctrl(m, cid)
    if not c or not c['shown']:
        return 'not drawn'
    if not c['inWindow']:
        return 'off window'
    if c['missed']:
        return f"missed {len(c['missed'])}/5"
    w, h = c['rect']['width'], c['rect']['height']
    if (cid in FLOORED or floored) and (w < FLOOR or h < FLOOR):
        return f'under floor {w:.0f}x{h:.0f}'
    return 'ok'


def drawn(t):
    return t['cut'] not in ('not drawn', 'empty', 'nothing drawn')


def hands_reach(m):
    rs = [reach(m, f'score-hands-{h}') for h in ('R', 'L', 'both')]
    return 'ok' if all(r == 'ok' for r in rs) else ','.join(rs)


def ink(m, skip=('summary', 'dot')):
    """The drawn chrome over the stage's ink: (verdict, detail)."""
    worst = 'clean'
    detail = []
    for name, c in m['glass']['chrome'].items():
        if name in skip or name.startswith('ctl:'):
            continue
        n = c['notes'] + c['texts'] + c['lines'] + c['otherPaths']
        if n == 0:
            continue
        if c['depth'] <= TOUCH:
            v = 'touch'
        else:
            v = 'covers'
        if v == 'covers' or worst == 'clean':
            worst = v
        detail.append(f"{name} {c['notes']}n {c['texts']}t {c['lines']}l {c['otherPaths']}p d{c['depth']:.1f}" + (f" {c['textWords']}" if c['textWords'] else ''))
    return worst, '; '.join(detail)


def check(d, key, m):
    """The four checks for one state under one variant. Returns (shown, hidden, ink) strings and failures."""
    kind = KIND[key]
    x = m['x']
    t = m['texts']
    fails_shown, fails_hidden = [], []
    where_ok = t['where']['cut'].startswith('whole')
    chip_pos = 'chip' in m['glass']['chrome'] and (x['chipText'] or '').startswith('bar ')
    title_drawn = drawn(t['title'])
    status_drawn = x['status']['drawn'] and (x['status']['content'] or '') != ''
    msg = x['msg']
    if kind == 'rest':
        if not title_drawn:
            fails_shown.append('name not drawn')
        if not where_ok:
            fails_shown.append('bar n/m not whole')
        for cid in ('score-back-side', 'score-play', 'score-hear', 'score-mode', 'score-tempo-label', 'score-more'):
            r = reach(m, cid)
            if r != 'ok':
                fails_shown.append(f"{cid.replace('score-', '')} {r}")
        if hands_reach(m) != 'ok':
            fails_shown.append(f'hands {hands_reach(m)}')
        if (msg['content'] or '') != '':
            fails_hidden.append('stale message')
        if status_drawn:
            fails_hidden.append(f"status drawn: {x['status']['content'][:40]!r}")
    elif kind in ('count', 'armed'):
        numerals = 'digits' in m['glass']['chrome']
        if key == 'count' and not (msg['content'] and msg['fits']):
            fails_shown.append('count not drawn whole')
        if key == 'count2' and not numerals:
            fails_shown.append('numerals not drawn (the count was over)')
        elif key == 'count2':
            r = m['glass']['chrome']['digits']['rect']
            if r['left'] < -0.5 or r['right'] > d['vw'] + 0.5:
                fails_shown.append(f"numerals past the window ({r['left']:.0f} to {r['right']:.0f} of {d['vw']})")
        cue = x['status']['content'] or ''
        cue_in_chip = cue != '' and cue in (x['chipText'] or '') and chip_pos
        if kind == 'armed' and not msg['vis']['cut'].startswith('whole') and not cue_in_chip:
            fails_shown.append(f"cue {msg['vis']['cut']}")
        r = reach(m, 'score-play')
        if r != 'ok':
            fails_shown.append(f'direct pause {r}')
        if not (where_ok or chip_pos):
            fails_shown.append('position not drawn')
        if title_drawn:
            fails_hidden.append('name drawn')
        for cid in ('score-mode', 'score-tempo-label', 'score-hear', 'score-more', 'score-back-side'):
            c = ctrl(m, cid)
            if c and c['shown']:
                fails_hidden.append(f"{cid.replace('score-', '')} drawn")
        if ctrl(m, 'score-hands-R')['shown']:
            fails_hidden.append('hands drawn')
        if x['countIn']['shown'] and key != 'count2':
            fails_hidden.append('count-in over the stage')
    elif kind == 'playing':
        r = reach(m, 'score-play')
        if r != 'ok':
            fails_shown.append(f'direct pause {r}')
        if not (where_ok or chip_pos):
            fails_shown.append('position not drawn')
        if title_drawn:
            fails_hidden.append('name drawn')
        for cid in ('score-mode', 'score-tempo-label'):
            c = ctrl(m, cid)
            if c and c['shown']:
                fails_hidden.append(f"{cid.replace('score-', '')} drawn")
        if ctrl(m, 'score-hands-R')['shown']:
            fails_hidden.append('hands drawn')
        if status_drawn:
            fails_hidden.append('status drawn')
    elif kind == 'paused':
        if not title_drawn:
            fails_shown.append('name not drawn')
        if not where_ok and not chip_pos:
            fails_shown.append('bar n/m not drawn')
        elif not where_ok:
            fails_shown.append('bar n/m only in the chip')
        for cid in ('score-play', 'score-mode', 'score-tempo-label', 'score-more'):
            r = reach(m, cid)
            if r != 'ok':
                fails_shown.append(f"{'direct ▶' if cid == 'score-play' else cid.replace('score-', '')} {r}")
        if hands_reach(m) != 'ok':
            fails_shown.append(f'hands {hands_reach(m)}')
        if status_drawn and (x['status']['content'] or '').startswith('Paused'):
            fails_hidden.append('the paused sentence drawn')
        if (msg['content'] or '') != '':
            fails_hidden.append('stale message')
        chip = m['glass']['chrome'].get('chip')
        if chip and 'Paused' in (x['chipText'] or ''):
            fails_hidden.append('the paused sentence in the chip')
    elif kind == 'refused':
        named = NAMED[key]
        sentence = x['status']['content'] or ''
        if not msg['vis']['cut'].startswith('whole') or msg['content'] != sentence:
            # A: the sentence where the app puts it (the row's slot, or the chip when folded)
            where_said = 'chip' if sentence and sentence in (x['chipText'] or '') and 'chip' in m['glass']['chrome'] else ('row' if status_drawn else 'nowhere')
            fails_shown.append(f"sentence {msg['vis']['cut'] if msg['content'] else 'in the ' + where_said}")
        r = reach(m, named, floored=True)  # the control a sentence names, at the tap floor (the brief's check 1)
        if r != 'ok':
            fails_shown.append(f"named {named.replace('score-', '')} {r}")
        if not (where_ok or chip_pos):
            fails_shown.append('bar n/m not drawn (position)')
        if title_drawn:
            fails_hidden.append('name drawn')
        if status_drawn:
            fails_hidden.append('sentence also in the row')
    elif kind == 'finished':
        s = x.get('summary')
        if not s:
            fails_shown.append('no summary')
        else:
            if not (s['heading'] and s['heading']['inView']):
                fails_shown.append('result heading not in view')
            whole = [b for b in s['buttons'] if b['share'] >= 0.99 and b['hitVisible']]
            part = [b for b in s['buttons'] if 0 < b['share'] < 0.99 and b['hitVisible']]
            if not whole:
                fails_shown.append('next action ' + (f"partly in view ({max(b['share'] for b in part):.0%})" if part else 'below the fold'))
        if 'chip' in m['glass']['chrome']:
            fails_hidden.append(f"chip {x['chipText']!r}")
        if x['countIn']['shown']:
            fails_hidden.append('count-in')
        if status_drawn:
            fails_hidden.append('status drawn')
    iv, idetail = ink(m)
    return fails_shown, fails_hidden, iv, idetail


def music(m):
    g = m['glass']
    return g['staveTop'], g['stavePx'], g['stage']['top'], g['stage']['height'], g['fitBy']


rows_states = []
summary = {}
music_lines = []
refusal_lines = []
pause_lines = []
finished_lines = []
notes_lines = []
cellcount = 0
for d in cells():
    cellcount += 1
    name = d['_name']
    if d.get('error'):
        rows_states.append(f"{name}: ERROR {d['error'][:300]}")
    prev = None
    mrow = []
    for key in WALK:
        for var in ('B', 'A'):
            m = variant(d, key, var)
            if m is None:
                continue
            if 'error' in m:
                rows_states.append(f"{name} {key} {var}: measure error {m['error'][:200]}")
                continue
            fs, fh, iv, idetail = check(d, key, m)
            v1 = 'pass' if not fs else 'FAIL ' + '; '.join(fs)
            v2 = 'pass' if not fh else 'FAIL ' + '; '.join(fh)
            top, stave, stop, sh, fit = music(m)
            moved = ''
            if var == 'B' and prev is not None and top is not None and prev[0] is not None:
                dt = top - prev[0]
                ds = (stave or 0) - (prev[1] or 0)
                if abs(dt) > 0.5 or abs(ds) > 0.05:
                    moved = f' MOVED top {dt:+.2f} stave {ds:+.2f} since {prev[2]}'
            v3 = f"top {top} stave {stave}{moved}"
            v4 = iv if iv == 'clean' else f'{iv}: {idetail}'
            ctl = [f"{n[4:]} {c['notes']}n {c['texts']}t {c['lines']}l {c['otherPaths']}p d{c['depth']:.1f}" for n, c in m['glass']['chrome'].items()
                   if n.startswith('ctl:') and (c['notes'] + c['texts'] + c['lines'] + c['otherPaths']) > 0]
            if iv != 'clean':
                v4 += ' | controls over ink: ' + ('; '.join(ctl) if ctl else 'none')
            rows_states.append(f"{name} | {key:17} {var} | 1 {v1} | 2 {v2} | 3 {v3} | 4 {v4}")
            kind = KIND[key]
            summary.setdefault((key, var), {'n': 0, '1': 0, '2': 0, '3': 0, '4': 0, 'fails1': {}, 'fails2': {}, 'fails4': {}})
            S = summary[(key, var)]
            S['n'] += 1
            S['1'] += not fs
            S['2'] += not fh
            S['3'] += not moved
            S['4'] += iv != 'covers'
            for f in fs:
                k = f.split(' ')[0] + ' ' + ' '.join(f.split(' ')[1:3])
                S['fails1'][f] = S['fails1'].get(f, 0) + 1
            for f in fh:
                S['fails2'][f] = S['fails2'].get(f, 0) + 1
            if iv != 'clean':
                S['fails4'][iv] = S['fails4'].get(iv, 0) + 1
            if var == 'B' and key == 'count2':
                pass
            elif var == 'B':
                mrow.append(f"{key}:{top}/{stave}")
                if prev is not None and moved:
                    music_lines.append(f"  {name}: {moved.strip()} -> {key} (stage top {stop}, height {sh}, fit {fit})")
                prev = (top, stave, key)
            if var == 'B' and kind == 'refused':
                pr = m['x']['pricedRefusals']
                widest = max(pr['widths'], key=lambda w: w['w'])
                this = next((w for w in pr['widths'] if w['t'] == m['x']['status']['content']), None)
                refusal_lines.append(
                    f"{name} | {key:17} | room {pr['room']:.0f}, beside bar n/m {pr['besideWhere']:.0f} | this sentence {this['w'] if this else '?'} px, {m['x']['msg']['vis']['cut']} | widest {widest['w']:.0f} px ({widest['t'][22:]!r}), slack {pr['besideWhere'] - widest['w']:.0f} | msg {m['x']['msg']['fontSize']} w{m['x']['msg']['fontWeight']} | top line h {m['x']['top']['rect']['height'] if m['x']['top']['rect'] else None}")
            if var == 'B' and key in ('count', 'armed', 'playing'):
                pr = m['glass']['priced']
                pause_lines.append(f"{name} | {key:8} | " + ' | '.join(f"{k} {v['notes']}n {v['texts']}t {v['lines']}l {v['otherPaths']}p d{v['depth']:.1f}" for k, v in pr.items()))
            if var == 'A' and key == 'count':
                c = m['glass']['chrome']
                pause_lines.append(f"{name} | count A (the app's count-in) | wash: " + (f"{c['countin']['notes']}n {c['countin']['texts']}t {c['countin']['lines']}l {c['countin']['otherPaths']}p" if 'countin' in c else 'none') + ' | numerals: ' + (f"{c['digits']['notes']}n {c['digits']['texts']}t {c['digits']['lines']}l {c['digits']['otherPaths']}p d{c['digits']['depth']:.1f} at {m['x']['countIn']['digitPx']}" if 'digits' in c else 'none') + f" | count shown {m['x']['countIn']['shown']}")
            if key == 'finished':
                s = m['x'].get('summary') or {}
                finished_lines.append(
                    f"{name} | {var} | heading {s.get('heading', {}).get('text')!r} in view {s.get('heading', {}).get('inView')} | first figure {s.get('firstStat')} | actions " +
                    ', '.join(f"{b['id'].replace('summary-', '')} {b['share']:.0%}{'' if b['hitVisible'] else ' (no hit)'}" for b in s.get('buttons', [])) +
                    f" | sheet {s.get('clientHeight')}/{s.get('scrollHeight')} px | chip {'drawn' if 'chip' in m['glass']['chrome'] else 'hidden'}")
            if var == 'B' and key == 'rest':
                pr = m['x']['pricedRefusals']
                notes_lines.append(f"{name} | beside bar n/m at rest {pr['besideWhere']:.0f} px | " + ' | '.join(f"{w['t'][:34]!r} {w['w']:.0f}" for w in pr['noteWidths']))
    music_lines.insert(len(music_lines), f"{name}: " + ' '.join(mrow))

with open(os.path.join(OUTDIR, 'states.txt'), 'w', encoding='utf-8') as f:
    f.write('# U122b: every cell, every state, the four checks. B = c6 applied per state (the emulation); A = the app\'s own\n')
    f.write('# state machine under c6. 1 shown and directly reachable | 2 hidden | 3 the stave\'s top edge and size, moves since the\n')
    f.write('# previous state | 4 drawn chrome over the stage\'s ink (touch: no deeper than 2 px). This machine\'s Chromium.\n\n')
    f.write('\n'.join(rows_states) + '\n')
with open(os.path.join(OUTDIR, 'summary.txt'), 'w', encoding='utf-8') as f:
    f.write(f'# U122b: per state, the cells that pass each check ({cellcount} cells; finished on the cells whose piece finishes).\n')
    f.write('# B = c6 applied per state; A = the app\'s own state machine under c6. 3 counts the cells where nothing moved since the previous state.\n')
    f.write('# 4 counts the cells with nothing covered deeper than a 2 px touch.\n\n')
    for key in WALK:
        for var in ('B', 'A'):
            S = summary.get((key, var))
            if not S:
                continue
            f.write(f"{key:17} {var}: n {S['n']:2} | 1 shown {S['1']:2} | 2 hidden {S['2']:2} | 3 unmoved {S['3']:2} | 4 no cover {S['4']:2}")
            if S['fails1']:
                f.write(f" | 1 fails: {dict(sorted(S['fails1'].items(), key=lambda kv: -kv[1]))}")
            if S['fails2']:
                f.write(f" | 2 fails: {dict(sorted(S['fails2'].items(), key=lambda kv: -kv[1]))}")
            if S['fails4']:
                f.write(f" | 4: {S['fails4']}")
            f.write('\n')
for fname, head, lines in [
    ('music.txt', '# The stave\'s top edge / five-line size (px) through the walk under B, and every move between consecutive states.\n', music_lines),
    ('refusal.txt', '# The refusal in the top line (B): the room beside `bar n / m`, this sentence, and the widest of every refusal sentence the\n# Score glass can carry (`STATE_TEXT.soundOff`\'s formula), priced in the message\'s refused style. Slack = room beside - widest.\n', refusal_lines),
    ('pause.txt', '# Where a lone ⏸ (40 px or the control\'s size) would cover ink, priced on the stage under B: at ▶\'s own place, at the row\'s\n# left and right ends, and straddling the top band; and the count\'s numerals at the app\'s own size where the row was.\n# Then the app\'s count-in (A): its wash and its numerals over the ink.\n', pause_lines),
    ('finished.txt', '# The finished state: the result and the next action in view (share of each action\'s box inside the sheet\'s visible part),\n# A (the app\'s summary) against B (the chip hidden, the actions directly under the heading).\n', finished_lines),
    ('notes.txt', '# Notes a state might say, priced at the top line\'s regular weight at rest, against the room beside `bar n / m`.\n', notes_lines),
]:
    with open(os.path.join(OUTDIR, fname), 'w', encoding='utf-8') as f:
        f.write(head + '\n' + '\n'.join(lines) + '\n')
print(f'{cellcount} cells')
print(open(os.path.join(OUTDIR, 'summary.txt'), encoding='utf-8').read())
