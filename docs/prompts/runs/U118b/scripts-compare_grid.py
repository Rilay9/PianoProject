"""U118b: the folded/turned grid with the sentinel at a day (before) against the sixteen-digit bound
(after), from U118's own probe, both trees measured the same way in this worktree. Not for the commit.

Per cell (viewport, piece, bars, text size) and arm:
- `as-is`, the ordinary path (an unfolded start, frozen, paused, folded): the frozen shape
  (slots/systems/bars) and drawn size, the band once folded, the chip's lines, the score's ink under
  the chip, the highest ink against the chip's bottom, the lowest ink against the stage's bottom, the
  slots' first-bar order, and the held scale through the fold.
- `turned`, a size taken while folded (turned and turned back mid-run): the same reads after the turn.
- `turned-off` (before tree only; the chip hidden, so the band is 0 on either tree): for the two
  cells the reviewer already accepted.

Usage: python compare_grid.py <before dir> <after dir> <out .md> [label of the after tree]

Also the reviewer's conditions (`responses/questions-1cadc4dc.md`) as far as the grid reads them:
(1) ordinary starts unchanged; (2) no chip over score ink that was clean before, no ink off the stage;
(3) a turned run never fits worse than the ordinary start at the same geometry (smaller, fewer bars
shown, fewer systems on the stage); (4) every moved turned cell has a taller band. (5) is a unit mutant.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

before_dir, after_dir, out_md = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
label = sys.argv[4] if len(sys.argv) > 4 else 'sixteen of the widest digit'
ACCEPTED = {('360x780', 'twinkle', 4, 100), ('390x844', 'twinkle', 8, 100)}


def load(folder: Path) -> dict[tuple, dict[str, dict]]:
    cells: dict[tuple, dict[str, dict]] = {}
    for f in sorted(folder.glob('*.json')):
        d = json.loads(f.read_text(encoding='utf-8'))
        key = (d['viewport'], d['piece'], d['bars'], d['text'])
        cells.setdefault(key, {})[d['arm']] = d
    return cells


def shape(s: dict | None) -> str:
    return '?' if not s else f"{s['slots']}/{s['systems']}/{s['shown']}"


def ordered(fold: dict | None) -> bool:
    if not fold:
        return False
    froms = [p['from'] if p['from'] is not None else 10**9 for p in fold.get('placed', [])]
    return froms == sorted(froms)


def reads(d: dict, arm: str) -> dict | None:
    if arm == 'as-is':
        run, fold, after = d['run'], d['fold'], d['after']
        held = run['frozenScale'] == after['frozenScale']
    else:
        run, fold, after = d.get('turnedRun'), d.get('turnedFold'), d.get('turnedRun')
        if run is None or fold is None:
            return None
        held = True
    band = round((after or {}).get('band') or 0, 2)
    return {
        'shape': shape(run),
        'drawn': run['drawn'],
        'band': band,
        'lines': fold['chipLines'],
        'under': len(fold['under']),
        'ink_clear': fold['inkTop'] is not None and fold['chipBottom'] is not None and fold['inkTop'] >= fold['chipBottom'],
        'on_stage': fold['inkBottom'] is not None and fold['inkBottom'] <= fold['stageH'] + 1,
        'inkBottom': fold['inkBottom'],
        'stageH': fold['stageH'],
        'firstTop': (fold['placed'][0]['top'] if fold.get('placed') else None),
        'ordered': ordered(fold),
        'held': held,
    }


before, after = load(before_dir), load(after_dir)
keys = sorted(set(before) | set(after), key=lambda k: (k[3], k[0], k[1], k[2]))
lines: list[str] = []
counts = {
    'cells': 0, 'band_moved': 0, 'outcome_moved': 0, 'outcome_moved_not_accepted': 0,
    'under_after': 0, 'off_stage_after': 0, 'order_after': 0, 'held_after': 0, 'missing': 0,
}
moved_rows: list[str] = []
for arm in ('as-is', 'turned'):
    lines.append(f'\n### {arm}\n')
    lines.append('| cell | shape before / after | drawn before / after | band before / after | chip lines b/a | under b/a | ink below the chip b/a | lowest ink vs stage, after | order, held b/a |')
    lines.append('| --- | --- | --- | --- | --- | --- | --- | --- | --- |')
    for key in keys:
        b = before.get(key, {}).get(arm)
        a = after.get(key, {}).get(arm)
        rb = reads(b, arm) if b else None
        ra = reads(a, arm) if a else None
        name = f'{key[0]} {key[1]} {key[2]} bars, {key[3]} %'
        if rb is None or ra is None:
            counts['missing'] += 1
            lines.append(f'| {name} | missing | | | | | | | |')
            continue
        counts['cells'] += 1
        band_moved = rb['band'] != ra['band']
        outcome_moved = rb['shape'] != ra['shape'] or abs((rb['drawn'] or 0) - (ra['drawn'] or 0)) >= 0.0005
        counts['band_moved'] += band_moved
        counts['outcome_moved'] += outcome_moved
        if outcome_moved and key not in ACCEPTED:
            counts['outcome_moved_not_accepted'] += 1
        counts['under_after'] += ra['under'] > 0
        counts['off_stage_after'] += not ra['on_stage']
        counts['order_after'] += not ra['ordered']
        counts['held_after'] += not ra['held']
        mark = ' **moved**' if outcome_moved else (' (band)' if band_moved else '')
        row = (
            f"| {name}{mark} | {rb['shape']} / {ra['shape']} | {rb['drawn']} / {ra['drawn']} | {rb['band']} / {ra['band']} | "
            f"{rb['lines']} / {ra['lines']} | {rb['under']} / {ra['under']} | {'yes' if rb['ink_clear'] else 'NO'} / {'yes' if ra['ink_clear'] else 'NO'} | "
            f"{ra['inkBottom']} vs {ra['stageH']} | {'yes' if rb['ordered'] and rb['held'] else 'NO'} / {'yes' if ra['ordered'] and ra['held'] else 'NO'} |"
        )
        lines.append(row)
        if outcome_moved:
            moved_rows.append(f'{arm}: {row}')

# The stop table: every cell whose outcome moved, with the ordinary start beside it and the rows drawn.
def rows_of(fold: dict | None) -> str:
    if not fold:
        return '?'
    placed = fold.get('placed', [])
    window = sum(1 for p in placed if not p['ahead'])
    ahead = sum(1 for p in placed if p['ahead'])
    return f"{window} systems" + (f" + {ahead} greyed next" if ahead else '')


stop: list[str] = [
    '\n### Stop table: every cell whose shape, slot count or size moved\n',
    '| arm | cell | ordinary start (after) | before: shape @ size, rows | after: shape @ size, rows | size after / before | lowest ink after vs stage |',
    '| --- | --- | --- | --- | --- | --- | --- |',
]
for arm in ('as-is', 'turned'):
    for key in keys:
        b = before.get(key, {}).get(arm)
        a = after.get(key, {}).get(arm)
        if not b or not a:
            continue
        rb, ra = reads(b, arm), reads(a, arm)
        if rb is None or ra is None:
            continue
        if rb['shape'] == ra['shape'] and abs((rb['drawn'] or 0) - (ra['drawn'] or 0)) < 0.0005:
            continue
        fold_b = b['fold'] if arm == 'as-is' else b.get('turnedFold')
        fold_a = a['fold'] if arm == 'as-is' else a.get('turnedFold')
        o = a['run']
        ratio = (ra['drawn'] or 0) / (rb['drawn'] or 1)
        accepted = ' (accepted cell)' if key in ACCEPTED else ''
        stop.append(
            f"| {arm} | {key[0]} {key[1]} {key[2]} bars, {key[3]} %{accepted} | {shape(o)} @ {o['drawn']} | "
            f"{rb['shape']} @ {rb['drawn']}, {rows_of(fold_b)} | {ra['shape']} @ {ra['drawn']}, {rows_of(fold_a)} | {ratio:.4f} | "
            f"{ra['inkBottom']} vs {ra['stageH']} |"
        )

# The two accepted cells, after: the turned run against the ordinary start and against band 0.
acc: list[str] = ['\n### The two accepted cells, after\n', '| cell | ordinary start | turned, band 0 (before tree) | turned, with the band (after) |', '| --- | --- | --- | --- |']
for key in sorted(ACCEPTED):
    o = (after.get(key) or {}).get('as-is')
    t = (after.get(key) or {}).get('turned')
    off = (before.get(key) or {}).get('turned-off')
    fmt = lambda s: '?' if not s else f"{shape(s)} @ {s['drawn']}"  # noqa: E731
    acc.append(f"| {key[0]} {key[1]} {key[2]} bars | {fmt(o['run'] if o else None)} | {fmt(off.get('turnedRun') if off else None)} | {fmt(t.get('turnedRun') if t else None)} |")

summary = [
    f'# U118b: the folded/turned grid, the sentinel at a day (before) against {label} (after)',
    '',
    'Generated by `compare_grid.py` from U118\'s probe (`runs/U118/iii-scripts-stop.spec.ts`), both trees built and measured',
    'the same way in this worktree, one Playwright run at a time. Numbers are this machine\'s (Chromium, its face); the',
    'relationships are the finding. **moved** marks a cell whose shape or drawn size differs; (band) one whose band alone differs.',
    '',
    '| count | value |',
    '| --- | --- |',
] + [f'| {k} | {v} |' for k, v in counts.items()]
if moved_rows:
    summary += ['', '**Cells whose outcome moved:**', ''] + [f'- {r}' for r in moved_rows]
# The reviewer's conditions, as the grid reads them.
def ahead_rows(fold: dict | None) -> int:
    return sum(1 for p in (fold or {}).get('placed', []) if p['ahead'])


cond: dict[str, list[str]] = {
    '1 an ordinary start moved': [],
    '2 chip over score ink where it was clean before': [],
    '2 score ink off the stage': [],
    '3 a turned run worse than the ordinary start': [],
    '3 (informational) a turned run with fewer greyed rows than the ordinary start': [],
    '4 a moved turned cell without a taller band': [],
}
for key in keys:
    name = f'{key[0]} {key[1]} {key[2]} bars, {key[3]} %'
    for arm in ('as-is', 'turned'):
        b, a = before.get(key, {}).get(arm), after.get(key, {}).get(arm)
        rb, ra = (reads(b, arm) if b else None), (reads(a, arm) if a else None)
        if rb is None or ra is None:
            continue
        moved = rb['shape'] != ra['shape'] or abs((rb['drawn'] or 0) - (ra['drawn'] or 0)) >= 0.0005
        if arm == 'as-is' and moved:
            cond['1 an ordinary start moved'].append(name)
        if ra['under'] > 0 and rb['under'] == 0:
            cond['2 chip over score ink where it was clean before'].append(f'{arm} {name}')
        if not ra['on_stage']:
            cond['2 score ink off the stage'].append(f'{arm} {name}')
        if arm == 'turned' and moved and not ra['band'] > rb['band']:
            cond['4 a moved turned cell without a taller band'].append(name)
    o, t = after.get(key, {}).get('as-is'), after.get(key, {}).get('turned')
    if o and t and t.get('turnedRun'):
        orun, trun = o['run'], t['turnedRun']
        worse = []
        if (trun['drawn'] or 0) < (orun['drawn'] or 0) - 0.0005:
            worse.append(f"size {trun['drawn']} < {orun['drawn']}")
        if (trun['shown'] or 0) < (orun['shown'] or 0):
            worse.append(f"bars {trun['shown']} < {orun['shown']}")
        if (trun['slots'] or 0) < (orun['slots'] or 0):
            worse.append(f"systems on the stage {trun['slots']} < {orun['slots']}")
        if worse:
            cond['3 a turned run worse than the ordinary start'].append(f"{name}: {'; '.join(worse)}")
        if ahead_rows(t.get('turnedFold')) < ahead_rows(o.get('fold')):
            cond['3 (informational) a turned run with fewer greyed rows than the ordinary start'].append(
                f"{name}: {ahead_rows(t.get('turnedFold'))} < {ahead_rows(o.get('fold'))} "
                f"({shape(trun)} @ {trun['drawn']} against {shape(orun)} @ {orun['drawn']})"
            )
conditions = ["\n### The reviewer's conditions, as the grid reads them\n", '| condition | cells | which |', '| --- | --- | --- |']
for k, v in cond.items():
    conditions.append(f"| {k} | {len(v)} | {'; '.join(v) or 'none'} |")

out_md.write_text('\n'.join(summary + stop + conditions + acc + lines) + '\n', encoding='utf-8')
print(json.dumps(counts))
print('\n'.join(stop + conditions + acc))
