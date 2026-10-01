# U122: the bar's one allocation model, computed from the probe's measured widths, beside what the bar
# does today. One line per cell and state; the summary counts every cell where the model changes an
# outcome. Reads the probe's JSONs; writes nothing but stdout.
#
#   python model.py <probe-out dir> <label> <mode> [--state S] [--csv]
#
# The model (docs/design/score-bar-layout.md §3):
#   items, each priced at its widest legitimate content for the piece and the geometry:
#     fixed:     ▶ (≥ the tap minimum), ⋯ (≥ the tap minimum), the mode select (long or short form, each
#                at the widest of the four labels), the tempo label (long or short, at its widest digits);
#                sideways also Back and the piece's widest `bar m / m` (the left group's minimum).
#     optional:  Hands, then Hear it (they leave in that order, `OVERFLOW_ORDER`).
#     yielding:  the ordinary status line (up to its 28vw cap), then the piece's name, in the room left.
#   the first configuration that fits, in this preference order:
#     (Hear it, Hands) on the bar before (Hear it) before (neither); within each, the label forms
#     (mode, tempo) long+long, long+short, short+long, short+short; a form with a long word fits only
#     where the ordinary status line still keeps its band (its 28vw cap) beside it (sideways).
#   It is the reference the prototype in the probe (`U122_PROTO=1`) applies in the page; the in-group
#   refusal (option A) is computed here for comparison only.
#   the refusal sentence is not an item of the row: it is drawn whole on a line of its own across the top
#   of the bar (option B), so the row is the same with or without it.
import json, sys, pathlib

TAP_MIN = 40.0
EPS = 0.01

def cfgs():
    for hear, hands in ((True, True), (True, False), (False, False)):
        for mode_long, tempo_long in ((True, True), (True, False), (False, True), (False, False)):
            yield hear, hands, mode_long, tempo_long

def allocate(i, inner_width, sideways):
    """The model: from measured widths to which controls stay, which label forms, and the yielding room."""
    W = i['rowWidth']
    gb = i['barGap']
    play = max(i['play'], i['playMin'], TAP_MIN)
    more = max(i['more'], i['moreMin'], TAP_MIN)
    mode = {True: max(i['modeLong'].values()), False: max(i['modeShort'].values())}
    tempo = {True: i['tempoLongWidest']['width'], False: i['tempoShortWidest']['width']}
    group_min = 0.0
    if sideways:
        gg = i['groupGap']
        group_min = i['back'] + i['whereWidest']['width'] + 3 * gg
    # The ordinary status line's band (its 28vw cap): a long word is kept only while the line keeps it.
    band = 0.28 * inner_width if sideways else 0.0
    for hear, hands, ml, tl in cfgs():
        widths = [play, mode[ml], tempo[tl], more] + ([max(i['hear'], i.get('hearStop', 0))] if hear else []) + ([i['hands']] if hands else [])
        children = len(widths) + (1 if sideways else 0)
        need = group_min + sum(widths) + (children - 1) * gb
        if need + (band if (ml or tl) else 0.0) <= W + EPS:
            return {'fits': True, 'hear': hear, 'hands': hands, 'modeLong': ml, 'tempoLong': tl,
                    'need': round(need, 2), 'slot': round(W - need, 2) if sideways else None,
                    'modeW': mode[ml], 'tempoW': tempo[tl]}
    return {'fits': False, 'need': round(group_min + play + mode[False] + tempo[False] + more + (4 if sideways else 3) * gb, 2)}

def yielding(i, a, inner_width):
    """The room left, given to the ordinary status line first (to its 28vw cap), then to the name."""
    slot = a['slot']
    status = i.get('status') or {}
    one = status.get('one') or 0.0
    cap = 0.28 * inner_width
    st = min(one, cap, slot)
    title = min(i['title']['width'], slot - st)
    return round(st, 2), round(max(0.0, title), 2)

def bar_height(i, refusal_line):
    """Sideways: the row, plus the refusal's own line where one stands (option B)."""
    h = i['barPadTop'] + i['rowHeight'] + i['barPadBottom'] + i['barBorderTop']
    if refusal_line is not None:
        h += refusal_line['height'] + i['barGap']
    return round(h, 2)

def in_group_option(i, a):
    """Option A for comparison: the sentence in the room the row leaves, word-wrapped, the row unchanged."""
    s = i.get('status') or {}
    if not s.get('fit'):
        return None
    room = a['slot']
    if room + EPS < s['longestWord']:
        return {'feasible': False, 'room': room, 'longestWord': s['longestWord']}
    k = next(f for f in s['fit'] if f['width'] <= room + EPS)
    h = i['barPadTop'] + max(i['rowHeight'], k['height']) + i['barPadBottom'] + i['barBorderTop']
    return {'feasible': True, 'room': room, 'lines': k['lines'], 'barHeight': round(h, 2), 'inWindow': h <= i['barBottom'] + EPS}

def main():
    out, label, mode = sys.argv[1], sys.argv[2], sys.argv[3]
    states = None
    if '--state' in sys.argv:
        states = [sys.argv[sys.argv.index('--state') + 1]]
    rows = []
    for f in sorted(pathlib.Path(out).glob(f'{label}-{mode}-*.json')):
        d = json.loads(f.read_text(encoding='utf-8'))
        for st in states or [k for k in d if k not in ('vw', 'vh', 'text', 'face', 'piece', 'mode')]:
            p = d.get(st)
            if not p or 'error' in p:
                rows.append({'cell': f"{d['vw']}x{d['vh']} t{d['text']} {d['face']} {d['piece']}", 'state': st, 'error': (p or {}).get('error', 'missing')})
                continue
            i, t = p['intrinsic'], p['today']
            sideways = 'back' in i
            a = allocate(i, t['innerWidth'], sideways)
            row = {'cell': f"{d['vw']}x{d['vh']} t{d['text']} {d['face']} {d['piece']}", 'state': st, 'model': a, 'today': {
                'hands': t['handsOnBar'], 'hear': t['hearOnBar'], 'modeLabel': t['mode']['label'], 'modeCut': t['mode']['cut'],
                'modeW': t['mode']['width'], 'tempo': t['tempo']['text'], 'tempoCut': t['tempo']['cut'],
                'barH': t['bar']['height'], 'barTop': t['bar']['top'], 'playTop': next(c['top'] for c in t['controls'] if c['id'] == 'score-play'),
            }}
            if sideways and a['fits']:
                row['model']['status'], row['model']['title'] = yielding(i, a, t['innerWidth'])
                refused = t.get('refused') is not None
                row['model']['barH'] = bar_height(i, i.get('ownLine') if refused else None)
                row['model']['barTop'] = round(i['barBottom'] - row['model']['barH'], 2)
                row['today'].update({'title': t['title']['shown'], 'titleW': t['title']['width'], 'status': t['status']['shown'],
                                     'statusW': t['status']['width'], 'statusCut': t['status']['cut'], 'whereWhole': t['where']['whole'],
                                     'widestWhole': t['widest']['whole'], 'refused': t.get('refused')})
                if refused:
                    row['model']['inGroup'] = in_group_option(i, a)
            rows.append(row)
    if '--json' in sys.argv:
        print(json.dumps(rows, ensure_ascii=False, indent=1))
        return
    for r in rows:
        if 'error' in r:
            print(f"{r['cell']:28} {r['state']:20} ERROR {r['error']}")
            continue
        m, t = r['model'], r['today']
        if not m['fits']:
            print(f"{r['cell']:28} {r['state']:20} NO CONFIGURATION FITS (need {m['need']})")
            continue
        sent = lambda hear, hands: ','.join(x for x, on in (('Hands', hands), ('Hear it', hear)) if not on) or '-'
        line = (f"{r['cell']:28} {r['state']:20} | today: ⋯ {sent(t['hear'], t['hands']):13} mode '{t['modeLabel']}'{' CUT' if t['modeCut'] else ''} ({t['modeW']:.0f}) "
                f"tempo '{t['tempo']}' | model: ⋯ {sent(m['hear'], m['hands']):13} mode {'long' if m['modeLong'] else 'short'} ({m['modeW']:.0f}) tempo {'long' if m['tempoLong'] else 'short'} ({m['tempoW']:.0f})")
        if m.get('slot') is not None:
            line += f" slot {m['slot']:.1f} status {m['status']:.1f} title {m['title']:.1f} | today status {t['statusW']:.1f} '{t['status']}' title {t['titleW']:.1f}"
            line += f" | barH today {t['barH']:.0f} top {t['barTop']:.0f} ▶top {t['playTop']:.0f}; model {m['barH']:.0f} top {m['barTop']:.0f}"
            if 'inGroup' in m and m['inGroup'] is not None:
                g = m['inGroup']
                line += f" | option A: {'room ' + format(g['room'], '.1f') + ' < longest word ' + format(g['longestWord'], '.1f') if not g['feasible'] else str(g['lines']) + ' lines, bar ' + format(g['barHeight'], '.0f') + (' in window' if g['inWindow'] else ' OUT OF WINDOW')}"
        print(line)

if __name__ == '__main__':
    main()
