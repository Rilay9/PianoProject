"""U122a: the chrome candidates' measurements, tabulated per cell and summarised.

Reads the probe's JSON: build/u122a/out/r-*.json (the run flow: at rest, a run's freeze, the fold, paused,
▶ refused over the paused run) merged per cell and candidate with q-*.json (the refusal flow: ▶ and Hear
it refused at rest, a render while the refusal stands); and out/history/f-*.json (the first pass, which
ran the run after the at-rest refusals on one page) for the history finding. Writes, beside it:
  music.txt      per cell: the stage's height, the drawn stave (its five lines), the fit's deciding term, the
                 bars the window holds against the Bars option and whether the next music is in view, at rest
                 and at a run's freeze, per candidate, and each candidate's difference from c1
  chrome.txt     per cell and state: what each candidate's chrome draws over the notation (notes, text, ink)
  texts.txt      per cell, at rest and paused: what each text reads and which controls are on the screen
  refusal.txt    per cell and refusal state: the sentence, its lines, the window, the control it names
  stability.txt  per cell: the stave's size and top through the run (freeze, fold, pause), controls moved
  summary.txt    the counts the design's table is built from
Every number is this machine's Chromium.
"""
import glob
import json
import os
from collections import defaultdict

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
OUT = os.path.dirname(os.path.abspath(__file__))
FLOOR = 22  # WindowRenderer.MIN_STAFF_PX, the five lines
CANDS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']
REST_REFUSALS = ['rest-refused-play', 'rest-refused-hear', 'rest-refused-after-tempo', 'rest-refused-after-resize']
ALL_STATES = ['rest'] + REST_REFUSALS + ['run-frozen', 'run-folded', 'paused', 'paused-refused-play']


def keyof(d):
    return (d['mode'], d['vw'], d['vh'], d['text'], d['face'], d['piece'])


def load():
    cells = defaultdict(dict)
    for f in sorted(glob.glob(os.path.join(BASE, 'r-*.json'))):
        d = json.load(open(f, encoding='utf-8'))
        cells[keyof(d)][d['cand']] = d
    for f in sorted(glob.glob(os.path.join(BASE, 'q-*.json'))):
        q = json.load(open(f, encoding='utf-8'))
        d = cells[keyof(q)].setdefault(q['cand'], {k: q[k] for k in ('vw', 'vh', 'text', 'face', 'piece', 'cand', 'mode')})
        for s in REST_REFUSALS + ['rest-refusal-error']:
            if s in q:
                d[s] = q[s]
        d['rest-q'] = q.get('rest')
    return cells


def load_history():
    hist = defaultdict(dict)
    for f in sorted(glob.glob(os.path.join(BASE, 'history', 'f-*.json'))):
        d = json.load(open(f, encoding='utf-8'))
        hist[keyof(d)][d['cand']] = d
    return hist


def cell_name(k):
    mode, vw, vh, text, face, piece = k
    return f"{vw}x{vh} t{text} {face} {piece}"


def st(d, s):
    v = d.get(s)
    if not isinstance(v, dict) or 'error' in v:
        return None
    return v


def nxt(g):
    """The next music in view: an inked bar past the window's last bar, or a look-ahead row with notes."""
    bars = g.get('bars') or []
    shown = g.get('barsShown') or 1
    if not bars:
        return None
    first = min(bars)
    return (max(bars) > first + shown - 1) or (g.get('ahead') or 0) > 0


def fmt(x, n=1):
    if x is None:
        return '-'
    if isinstance(x, float):
        return f"{x:.{n}f}"
    return str(x)


def music_line(s):
    if s is None:
        return 'missing'
    g = s['glass']
    sh = g['stage']['height'] if g['stage'] else None
    return f"stage {fmt(sh, 0):>4} stave {fmt(g['stavePx']):>5} {g['fitBy'] or '-':10s} bars {g['barsShown']}/{g['barsAsked']} next {'y' if nxt(g) else 'n'}"


def covered(s, names=('bar', 'top', 'corner', 'chip')):
    if s is None:
        return None
    ch = s['glass']['chrome']
    out = {}
    for n in names:
        v = ch.get(n)
        if v and v['overStage'] and (v['notes'] or v['texts'] or v['paths']):
            out[n] = (v['notes'], v['texts'], v['paths'], v.get('textWords', []))
    return out


def main():
    cells = load()
    keys = sorted(cells, key=lambda k: (k[0] != 'sideways', k[1], k[2], k[3], k[4], k[5]))
    errors = []
    for k in keys:
        for c, d in cells[k].items():
            for s in ALL_STATES:
                v = d.get(s)
                if v is None or (isinstance(v, dict) and 'error' in v):
                    errors.append(f"{cell_name(k)} {k[0]} {c} {s}: {'missing' if v is None else v['error'][:120]}")
            for e in ('rest-refusal-error', 'run-error'):
                if e in d:
                    errors.append(f"{cell_name(k)} {k[0]} {c} {e}: {d[e][:160]}")

    # ---------------- music ----------------
    lines = ['# The music per cell: at rest and at a run\'s freeze (stage px, five-line stave px, the fit\'s term, bars shown/asked, next music in view)', '']
    agg = defaultdict(lambda: defaultdict(list))
    for k in keys:
        lines.append(f"## {k[0]} {cell_name(k)}")
        base = cells[k].get('c1')
        for c in CANDS:
            d = cells[k].get(c)
            if d is None:
                continue
            r, f = st(d, 'rest'), st(d, 'run-frozen')
            lines.append(f"  {c} rest: {music_line(r)} | run: {music_line(f)}")
            if base is not None and r is not None and f is not None and st(base, 'rest') and st(base, 'run-frozen'):
                br, bf = st(base, 'rest')['glass'], st(base, 'run-frozen')['glass']
                for state, mine, ref in (('rest', r['glass'], br), ('run', f['glass'], bf)):
                    ds = (mine['stage']['height'] - ref['stage']['height']) if mine['stage'] and ref['stage'] else None
                    dv = (mine['stavePx'] - ref['stavePx']) if mine['stavePx'] is not None and ref['stavePx'] is not None else None
                    agg[(k[0], c, state)]['dstage'].append(ds)
                    agg[(k[0], c, state)]['dstave'].append(dv)
                    agg[(k[0], c, state)]['ratio'].append(mine['stavePx'] / ref['stavePx'] if dv is not None and ref['stavePx'] else None)
                    agg[(k[0], c, state)]['cell'].append(cell_name(k))
                    agg[(k[0], c, state)]['shownDiff'].append((mine['barsShown'], ref['barsShown']))
                    agg[(k[0], c, state)]['nextDiff'].append((nxt(mine), nxt(ref)))
                    agg[(k[0], c, state)]['under'].append(mine['stavePx'] is not None and mine['stavePx'] < FLOOR)
                    agg[(k[0], c, state)]['fit'].append(mine['fitBy'])
        lines.append('')
    open(os.path.join(OUT, 'music.txt'), 'w', encoding='utf-8').write('\n'.join(lines))

    # ---------------- chrome over notation ----------------
    lines = ['# What each candidate\'s chrome draws over the notation: (notes, svg text, ink paths, the text\'s words) per piece of chrome; blank = nothing', '']
    over = defaultdict(lambda: defaultdict(int))
    for k in keys:
        for c in CANDS:
            d = cells[k].get(c)
            if d is None:
                continue
            row = []
            for s in ALL_STATES:
                cv = covered(st(d, s))
                if cv:
                    row.append(f"{s}: " + '; '.join(f"{n} {v[0]}n {v[1]}t {v[2]}p {v[3][:4]}" for n, v in cv.items()))
                    for n, v in cv.items():
                        if v[0] or v[1]:
                            over[(k[0], c, s, n)]['cells'] += 1
                            over[(k[0], c, s, n)]['notes'] += v[0]
                            over[(k[0], c, s, n)]['texts'] += v[1]
            if row:
                lines.append(f"{k[0]} {cell_name(k)} {c}: " + ' | '.join(row))
    open(os.path.join(OUT, 'chrome.txt'), 'w', encoding='utf-8').write('\n'.join(lines))

    # ---------------- texts and controls ----------------
    lines = ['# Texts and controls, at rest and paused: name (shown), bar n / m, widest, Back, mode, tempo, Hear it, Hands, ▶ and ⋯ (w×h), control rows', '']
    tx = defaultdict(lambda: defaultdict(int))
    for k in keys:
        for c in CANDS:
            d = cells[k].get(c)
            if d is None:
                continue
            for s in ('rest', 'paused'):
                v = st(d, s)
                if v is None:
                    continue
                t = v['texts']
                ctr = {x['id']: x for x in v['controls']}
                pw = ctr['score-play']['rect']
                mw = ctr['score-more']['rect']
                back_id = 'score-back-side' if k[0] == 'sideways' else 'score-back'
                b = ctr[back_id]
                title = t['title']
                back_ok = b['shown'] and b['rect'] and b['rect']['height'] >= 39.5 and not b['missed']
                back_said = 'ok' if back_ok else (f"{fmt(b['rect']['width'], 0)}x{fmt(b['rect']['height'], 0)}" if b['rect'] else 'not drawn')
                mode_said = 'whole' if t['mode']['whole'] else ('off' if not t['mode']['onScreen'] else 'CUT')
                tempo_said = 'whole' if t['tempo']['whole'] else ('off' if not t['tempo']['onScreen'] else 'CUT')
                lines.append(
                    f"{k[0][0]} {cell_name(k)} {c} {s}: name {title['shown'][:24]!r} {title['cut']} | where {t['where']['cut']}/{t['widest']['cut']} | back {back_said} | "
                    f"mode {t['mode']['label']!r} {mode_said} | tempo {tempo_said} | hear {'bar' if t['hearOnBar'] else '⋯'} hands {'bar' if t['handsOnBar'] else '⋯'} | "
                    f"▶ {fmt(pw['width'] if pw else None, 0)}x{fmt(pw['height'] if pw else None, 0)} ⋯ {fmt(mw['width'] if mw else None, 0)}x{fmt(mw['height'] if mw else None, 0)} | rows {v['controlRows']}"
                    + (f" | status {len(t['status']['shown'].rstrip('…'))} chars {t['status']['cut']}" if s == 'paused' else '')
                )
                key = (k[0], c, s)
                tx[key]['n'] += 1
                tx[key]['titleWhole'] += 1 if title['cut'] == 'whole' else 0
                tx[key]['titleNone'] += 1 if title['cut'] in ('not drawn', 'nothing drawn', 'empty') or title['shown'] == '' else 0
                tx[key]['whereWhole'] += 1 if t['where']['cut'] == 'whole' else 0
                tx[key]['widestWhole'] += 1 if t['widest']['cut'] == 'whole' else 0
                tx[key]['backOk'] += 1 if b['shown'] and b['rect'] and b['rect']['height'] >= 39.5 and b['rect']['width'] >= 39.5 and not b['missed'] else 0
                tx[key]['modeWhole'] += 1 if t['mode']['whole'] else 0
                tx[key]['modeOff'] += 1 if not t['mode']['onScreen'] else 0
                tx[key]['tempoWhole'] += 1 if t['tempo']['whole'] else 0
                tx[key]['tempoOff'] += 1 if not t['tempo']['onScreen'] else 0
                tx[key]['hearBar'] += 1 if t['hearOnBar'] else 0
                tx[key]['handsBar'] += 1 if t['handsOnBar'] else 0
                tx[key]['tap'] += 1 if pw and mw and min(pw['width'], pw['height'], mw['width'], mw['height']) >= 39.5 and not ctr['score-play']['missed'] and not ctr['score-more']['missed'] else 0
                tx[key]['oneRow'] += 1 if v['controlRows'] == 1 else 0
                miss = [x['id'] for x in v['controls'] if x['shown'] and x['missed']]
                tx[key]['missedCells'] += 1 if miss else 0
                if s == 'paused':
                    sh = t['status']['shown']
                    tx[key]['pausedWhole'] += 1 if t['status']['cut'] == 'whole' else 0
                    tx[key]['pausedChars'] += len(sh.rstrip('…'))
    open(os.path.join(OUT, 'texts.txt'), 'w', encoding='utf-8').write('\n'.join(lines))

    # ---------------- refusal ----------------
    lines = [
        '# The refusal, one line per cell and candidate, one field per state (play, hear, after the tempo sheet, after a resize, ▶ over a paused run):',
        '# ok = the sentence whole on one line inside the window and the control it names drawn, inside the window and hit;',
        '# otherwise what failed (w = not whole, Nl = N lines, out = outside the window, hidden = the named control not drawn, miss = not hit).',
        '# b = the bar\'s height, s = the stage\'s, v = the five-line stave (px, this machine\'s Chromium).',
        '',
    ]
    abbr = {'rest-refused-play': 'play', 'rest-refused-hear': 'hear', 'rest-refused-after-tempo': 'tempo', 'rest-refused-after-resize': 'resize', 'paused-refused-play': 'paused'}
    rf = defaultdict(lambda: defaultdict(int))
    for k in keys:
        for c in CANDS:
            d = cells[k].get(c)
            if d is None:
                continue
            fields = []
            for s in REST_REFUSALS + ['paused-refused-play']:
                v = st(d, s)
                if v is None:
                    fields.append(f"{abbr[s]}=missing")
                    continue
                r = v.get('refusal')
                if r is None:
                    fields.append(f"{abbr[s]}=none")
                    continue
                n = r['named'] or {}
                g = v['glass']
                okn = bool(n.get('shown')) and bool(n.get('inWindow')) and not n.get('missed')
                bad = []
                if not r['whole']:
                    bad.append('w')
                if r['lines'] != 1:
                    bad.append(f"{r['lines']}l")
                if not r['inWindow']:
                    bad.append('out')
                if not n.get('shown'):
                    bad.append('hidden')
                elif not n.get('inWindow') or n.get('missed'):
                    bad.append('miss')
                fields.append(f"{abbr[s]}={'ok' if not bad else '+'.join(bad)} b{fmt(v['geometry']['bar']['height'] if v['geometry']['bar'] else None, 0)} s{fmt(g['stage']['height'] if g['stage'] else None, 0)} v{fmt(g['stavePx'])}")
                key = (k[0], c, s)
                rf[key]['n'] += 1
                rf[key]['whole1'] += 1 if r['whole'] and r['lines'] == 1 else 0
                rf[key]['whole'] += 1 if r['whole'] else 0
                rf[key]['inWin'] += 1 if r['inWindow'] else 0
                rf[key]['namedOk'] += 1 if okn else 0
                rf[key]['maxBar'] = max(rf[key]['maxBar'], v['geometry']['bar']['height'] if v['geometry']['bar'] else 0)
            lines.append(f"{k[0][0]} {cell_name(k)} {c}: " + ' | '.join(fields))
    open(os.path.join(OUT, 'refusal.txt'), 'w', encoding='utf-8').write('\n'.join(lines))

    # ---------------- stability ----------------
    lines = ['# Through the run: the stave (px) and its top (y) at the freeze, after the fold, paused; controls that moved between the freeze and the pause, and under the paused refusal', '']
    stab = defaultdict(lambda: defaultdict(int))
    for k in keys:
        for c in CANDS:
            d = cells[k].get(c)
            if d is None:
                continue
            f, fo, p, pr = st(d, 'run-frozen'), st(d, 'run-folded'), st(d, 'paused'), st(d, 'paused-refused-play')
            if not (f and fo and p):
                lines.append(f"{k[0]} {cell_name(k)} {c}: incomplete")
                continue
            g1, g2, g3 = f['glass'], fo['glass'], p['glass']
            sizes = [g1['stavePx'], g2['stavePx'], g3['stavePx']]
            tops = [g1['staveTop'], g2['staveTop'], g3['staveTop']]
            fold_move = (tops[1] - tops[0]) if None not in tops[:2] else None
            unfold_move = (tops[2] - tops[1]) if None not in tops[1:] else None
            size_change = max(sizes) - min(sizes) if None not in sizes else None

            def ctrl_moves(a, b):
                ra = {x['id']: x['rect'] for x in a['controls'] if x['shown']}
                rb = {x['id']: x['rect'] for x in b['controls'] if x['shown']}
                out = []
                for i in set(ra) | set(rb):
                    if i not in ra or i not in rb:
                        out.append(f"{i}:{'gone' if i in ra else 'came'}")
                    elif abs(ra[i]['left'] - rb[i]['left']) > 0.5 or abs(ra[i]['top'] - rb[i]['top']) > 0.5:
                        out.append(f"{i}:{ra[i]['left']:.0f},{ra[i]['top']:.0f}->{rb[i]['left']:.0f},{rb[i]['top']:.0f}")
                return out

            m1 = ctrl_moves(f, p) if f['chrome'] == 'open' else ['(freeze measured folded)']
            m2 = ctrl_moves(p, pr) if pr else []
            lines.append(
                f"{k[0]} {cell_name(k)} {c}: stave {sizes} tops {tops} fold {fmt(fold_move)} unfold {fmt(unfold_move)} | frozen-measured {f['chrome']} | ctrl freeze->paused {m1} | paused->refused {m2}"
            )
            key = (k[0], c)
            stab[key]['n'] += 1
            stab[key]['sizeHeld'] += 1 if size_change is not None and size_change < 0.5 else 0
            stab[key]['foldMoves'] += 1 if fold_move is not None and abs(fold_move) > 0.5 else 0
            stab[key]['unfoldMoves'] += 1 if unfold_move is not None and abs(unfold_move) > 0.5 else 0
            stab[key]['foldMax'] = max(stab[key]['foldMax'], abs(fold_move or 0))
            stab[key]['ctrlMoveFP'] += 1 if m1 and m1 != ['(freeze measured folded)'] else 0
            stab[key]['frozenFolded'] += 1 if m1 == ['(freeze measured folded)'] else 0
            stab[key]['ctrlMovePR'] += 1 if m2 else 0
    open(os.path.join(OUT, 'stability.txt'), 'w', encoding='utf-8').write('\n'.join(lines))

    # ---------------- summary ----------------
    S = ['# U122a summary (this machine\'s Chromium)', '', f"errors: {len(errors)}"] + [f"  {e}" for e in errors[:60]] + ['']
    S.append('## Music against c1 (stage px and five-line stave px), per candidate; cells where the stave is smaller by more than half a pixel, and by how much')
    for mode in ('sideways', 'upright', 'tablet'):
        for c in CANDS:
            for state in ('rest', 'run'):
                a = agg.get((mode, c, state))
                if not a:
                    continue
                ds = [x for x in a['dstage'] if x is not None]
                dv = a['dstave']
                worse = [(cell, v, r) for cell, v, r in zip(a['cell'], dv, a['ratio']) if v is not None and v < -0.5]
                better = [(cell, v, r) for cell, v, r in zip(a['cell'], dv, a['ratio']) if v is not None and v > 0.5]
                shown_less = sum(1 for m, b in a['shownDiff'] if m is not None and b is not None and m < b)
                shown_more = sum(1 for m, b in a['shownDiff'] if m is not None and b is not None and m > b)
                next_lost = sum(1 for m, b in a['nextDiff'] if b and not m)
                next_gained = sum(1 for m, b in a['nextDiff'] if m and not b)
                under = sum(1 for u in a['under'] if u)
                fits = defaultdict(int)
                for fb in a['fit']:
                    fits[fb] += 1
                S.append(
                    f"  {mode} {c} {state}: n {len(a['cell'])} | stage diff {fmt(min(ds) if ds else None, 0)}..{fmt(max(ds) if ds else None, 0)} | stave smaller in {len(worse)} (worst {fmt(min((v for _, v, _ in worse), default=None))} px, ratio {fmt(min((r for _, _, r in worse), default=None), 3)}), larger in {len(better)} | bars shown fewer {shown_less} more {shown_more} | next lost {next_lost} gained {next_gained} | stave under {FLOOR} px: {under} | fit {dict(fits)}"
                )
                if worse:
                    S.append('      smaller: ' + '; '.join(f"{cell} {v:.1f} ({r:.3f})" for cell, v, r in worse))
    S.append('')
    S.append('## Stave under the floor, c1 itself, per state (so a candidate\'s count above can be read against it)')
    for mode in ('sideways', 'upright', 'tablet'):
        for s in ALL_STATES:
            for c in CANDS:
                n = 0
                tot = 0
                for k in keys:
                    if k[0] != mode or c not in cells[k]:
                        continue
                    v = st(cells[k][c], s)
                    if v is None or v['glass']['stavePx'] is None:
                        continue
                    tot += 1
                    n += 1 if v['glass']['stavePx'] < FLOOR else 0
                if tot and n:
                    S.append(f"  {mode} {s} {c}: {n} of {tot}")
    S.append('')
    S.append('## Chrome over the notation (cells with notes or text covered; totals)')
    for key in sorted(over):
        v = over[key]
        S.append(f"  {' '.join(key)}: cells {v['cells']} notes {v['notes']} texts {v['texts']}")
    S.append('')
    S.append('## Texts and controls (counts of states)')
    for key in sorted(tx):
        v = tx[key]
        S.append('  ' + ' '.join(key) + ': ' + ', '.join(f"{a} {b}" for a, b in v.items()))
    S.append('')
    S.append('## Refusal (counts of states)')
    for key in sorted(rf):
        v = rf[key]
        S.append('  ' + ' '.join(key) + ': ' + ', '.join(f"{a} {fmt(b, 0)}" for a, b in v.items()))
    S.append('')
    S.append('## Stability (counts of cells)')
    for key in sorted(stab):
        v = stab[key]
        S.append('  ' + ' '.join(key) + ': ' + ', '.join(f"{a} {fmt(b, 0)}" for a, b in v.items()))
    # ---------------- the acceptance cells ----------------
    S.append('')
    S.append('## The acceptance cells, per candidate')
    acc = [
        ('U120', ('sideways', 568, 320, '115', 'stack', 'hcb')),
        ('U120', ('sideways', 568, 320, '115', 'wider', 'moon')),
        ('U120', ('sideways', 568, 320, '100', 'wider', 'moon')),
        ('U120', ('sideways', 667, 375, '115', 'wider', 'moon')),
        ('U121', ('sideways', 568, 320, '115', 'wider', 'hcb')),
        ('owner', ('sideways', 780, 360, '100', 'stack', 'hcb')),
        ('owner', ('sideways', 780, 360, '100', 'stack', 'moon')),
    ]
    for tag, k in acc:
        if k not in cells:
            S.append(f"  {tag} {cell_name(k)}: not measured")
            continue
        S.append(f"  {tag} {cell_name(k)}")
        for c in CANDS:
            d = cells[k].get(c)
            if d is None:
                continue
            parts = []
            for s in ('rest', 'rest-refused-play', 'rest-refused-hear', 'run-frozen', 'paused', 'paused-refused-play'):
                v = st(d, s)
                if v is None:
                    parts.append(f"{s}: -")
                    continue
                g = v['glass']
                t = v['texts']
                r = v.get('refusal')
                p = f"{s}: stage {fmt(g['stage']['height'] if g['stage'] else None, 0)} stave {fmt(g['stavePx'])} bars {g['barsShown']}/{g['barsAsked']}"
                p += f" mode {t['mode']['label']!r}:{'whole' if t['mode']['whole'] else ('off' if not t['mode']['onScreen'] else 'CUT')} name {t['title']['shown']!r}"
                if r:
                    n = r['named'] or {}
                    p += f" | sentence whole {r['whole']} lines {r['lines']} inWin {r['inWindow']} named {'visible' if n.get('shown') and n.get('inWindow') and not n.get('missed') else 'NOT visible'} bar {fmt(v['geometry']['bar']['height'] if v['geometry']['bar'] else None, 0)}"
                cv = covered(v)
                if cv:
                    p += ' | over ' + '; '.join(f"{n} {x[0]}n {x[1]}t" for n, x in cv.items())
                parts.append(p)
            S.append(f"    {c}: " + '\n        '.join(parts))

    # ---------------- the history finding ----------------
    hist = load_history()
    S.append('')
    S.append('## History: the first pass ran each run after the at-rest refusals on the same page; its run against the clean run (same cell and candidate)')
    hn = 0
    hd = []
    for k in sorted(hist):
        for c, h in hist[k].items():
            hf = st(h, 'run-frozen')
            cf = st(cells.get(k, {}).get(c, {}), 'run-frozen') if k in cells and c in cells[k] else None
            if hf is None or cf is None:
                continue
            hn += 1
            a, b = hf['glass']['stavePx'], cf['glass']['stavePx']
            if a is not None and b is not None and abs(a - b) > 0.5:
                refused_shape = [st(h, s)['glass']['barsShown'] for s in REST_REFUSALS if st(h, s)]
                rest_shape = st(h, 'rest')['glass']['barsShown'] if st(h, 'rest') else None
                hd.append(f"    {cell_name(k)} {c}: after refusals {a} px, clean {b} px; bars shown at rest {rest_shape}, under the refusal {refused_shape}")
    S.append(f"  compared {hn} runs; differing by more than half a pixel: {len(hd)}")
    S.extend(hd)

    # ---------------- what decides the size ----------------
    S.append('')
    S.append('## The fit\'s deciding term under c1 (where height decides, chrome height costs size; where the width or the read-ahead decides, it costs none)')
    for mode in ('sideways', 'upright', 'tablet'):
        for s in ('rest', 'run-frozen'):
            fits = defaultdict(int)
            for k in keys:
                if k[0] != mode or 'c1' not in cells[k]:
                    continue
                v = st(cells[k]['c1'], s)
                if v:
                    fits[v['glass']['fitBy']] += 1
            S.append(f"  {mode} {s}: {dict(fits)}")
    open(os.path.join(OUT, 'summary.txt'), 'w', encoding='utf-8').write('\n'.join(S))
    print('\n'.join(S[:400]))


if __name__ == '__main__':
    main()
