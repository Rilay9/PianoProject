"""HD2a: hand rows from the established bar-voices, with the worklist and the evidence dumps.

Run from the repository root after `signature.py` (reads `app/build/HD2a/bars.json` and the model dumps):

    python docs/prompts/runs/HD2a/build_rows.py

Writes
* `app/build/HD2a/rows.json`: the hand rows, for splicing into `content/sources/verified-facts.json`;
* `docs/prompts/runs/HD2a/worklist.md`: every class-A file of HD2's printed-staff diff, classified;
* `docs/prompts/runs/HD2a/evidence/<id>.txt`: per file with rows, the model dump of every row's bars (the
  crave-40.txt shape, first pass of each printed bar) and each bar-voice's per-onset reading.

**A row** covers one staff and voice of one item over a run of consecutive printed bars, each printed once
in the file (a row reads printed numbers, and some files print a number twice: such a bar gets no row) and
each an ESTABLISHED bar-voice for that staff and voice. The row's hand is the staff's own. (The store's
test asks the same of every row: each printed bar in its range one source measure, with that voice's notes
on that staff.)
"""
import collections
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[4]
BUILD = ROOT / 'app' / 'build' / 'HD2a'
HERE = ROOT / 'docs' / 'prompts' / 'runs' / 'HD2a'
EVIDENCE = HERE / 'evidence'
CLASS_A = ROOT / 'docs' / 'prompts' / 'runs' / 'HD2' / 'corpus-diff.txt'
DATE = '2026-10-06'
METHOD = ("physical, on the app's model (docs/prompts/runs/HD2a/signature.py, ESTABLISHED): the voice-home hand "
          "cannot strike these notes with its own as written, this staff's hand can. Nothing heard.")


def tag(n):
    return f"{n['midi']}/st{n['st']}/v{n['v']}/{n['h']}{'/x' if n['x'] else ''}{'/g' if n['g'] else ''}"


def first_pass(notes):
    first = {}
    for n in notes:
        first[n['smi']] = min(first.get(n['smi'], n['mi']), n['mi'])
    return [n for n in notes if n['mi'] == first[n['smi']]]


def class_a_files():
    """The per-file list of HD2's printed-staff diff: catalogue id and its class counts, for files with class A."""
    out = []
    section = False
    for line in CLASS_A.read_text(encoding='utf-8').splitlines():
        if line.startswith('Per file'):
            section = True
            continue
        if line.startswith('Bars per class'):
            break
        parts = line.split()
        if section and len(parts) >= 3 and parts[1].startswith('song.') and any(p.startswith('A:') for p in parts[2:]):
            out.append((parts[1], ' '.join(parts[2:])))
    return out


def bar_dump(notes, smi):
    rows = collections.defaultdict(list)
    for n in notes:
        if n['smi'] == smi:
            rows[n['son']].append(n)
    lines = []
    for son in sorted(rows):
        here = sorted(rows[son], key=lambda n: (n['st'], -n['midi']))
        lines.append(f"  bar {here[0]['bar']} onset {son:g} " + ' '.join(f"{tag(n)}:{n['dur']:g}" for n in here))
    return lines


def main():
    bars = json.loads((BUILD / 'bars.json').read_text(encoding='utf-8'))
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    all_rows = []
    table = []
    for item, counts in class_a_files():
        entry = bars.get(item)
        model_path = BUILD / 'models' / f'{item}.json'
        if entry is None or not model_path.exists():
            table.append((item, counts, 'NOT READ', '', '', '', 'no model dump'))
            continue
        if 'skipped' in entry:
            table.append((item, counts, 'LEFT ALONE', '', '', '', f"{entry['skipped']}: hand rows apply to two-staff scores only"))
            continue
        model = json.loads(model_path.read_text(encoding='utf-8'))
        notes = first_pass(model['notes'])
        numbers = model['numbers']
        smis_of = collections.defaultdict(list)
        for smi, number in enumerate(numbers):
            smis_of[number].append(smi)
        has = collections.defaultdict(set)  # (staff, voice) -> smis with a note of that voice on that staff
        for n in notes:
            has[(n['st'], n['v'])].add(n['smi'])
        outcome_of = {(b['smi'], b['staff'], b['voice']): b for b in entry['bars']}
        established = [b for b in entry['bars'] if b['outcome'] == 'ESTABLISHED']
        tally = collections.Counter(b['outcome'] for b in entry['bars'])
        rows = []
        for (staff, voice) in sorted({(b['staff'], b['voice']) for b in established}):
            def ok(number):
                """One source measure printed with this number, and its bar-voice for (staff, voice) established."""
                smis = smis_of[number]
                if len(smis) != 1:
                    return False
                b = outcome_of.get((smis[0], staff, voice))
                return b is not None and b['outcome'] == 'ESTABLISHED'

            runs = []
            for number in sorted({b['bar'] for b in established if b['staff'] == staff and b['voice'] == voice}):
                if not ok(number):
                    continue
                if runs and runs[-1][1] == number - 1:
                    runs[-1][1] = number
                else:
                    runs.append([number, number])
            for first, last in runs:
                rows.append({'staff': staff, 'voice': voice, 'bars': [first, last],
                             'fact': {1: 'R', 2: 'L'}[staff]})
        refused = [b for b in established if not any(r['staff'] == b['staff'] and r['voice'] == b['voice'] and r['bars'][0] <= b['bar'] <= r['bars'][1] for r in rows)]
        if rows:
            evidence = f'docs/prompts/runs/HD2a/evidence/{item}.txt'
            for r in rows:
                all_rows.append({
                    'item': item,
                    'identity': model['identity'],
                    'bars': r['bars'],
                    'staff': r['staff'],
                    'voice': r['voice'],
                    'kind': 'hand',
                    'fact': r['fact'],
                    'rungs': None,
                    'proof': {'method': METHOD, 'date': DATE, 'evidence': evidence},
                })
            lines = [f"HD2a evidence: {item} ({model['file']}), identity sha256 {model['identity']['sha256']}",
                     'The app\'s current model (dump.probe.ts), first pass of each printed bar: midi/staff/voice/hand[/x cross-staff][/g grace]:duration.',
                     'Per bar-voice, the per-onset reading of signature.py: conflict = the model\'s hand would strike these notes with its own beyond one hand.',
                     '']
            for r in rows:
                lines.append(f"ROW staff {r['staff']} voice {r['voice']} bars {r['bars'][0]}-{r['bars'][1]} -> {r['fact']}")
                for b in established:
                    if b['staff'] == r['staff'] and b['voice'] == r['voice'] and r['bars'][0] <= b['bar'] <= r['bars'][1]:
                        lines.append(f"  bar {b['bar']} (source measure {b['smi']}) st{b['staff']} v{b['voice']}: {b['hand']}/x -> {b['target']}; "
                                     f"onsets {b['onsets']} {b['counts']}; second voice(s) {b['second']}; e.g. {'; '.join(b['examples'])}")
                        lines.extend(bar_dump(notes, b['smi']))
                lines.append('')
            (EVIDENCE / f'{item}.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
        if rows:
            outcome = 'ROWS'
        elif not entry['bars'] and model['verified']:
            outcome = 'HD2 ROWS'  # every class-A bar-voice already carries HD2's row (The Crave bar 40)
        elif tally['UNKNOWN']:
            outcome = 'UNKNOWN'
        else:
            outcome = 'LEFT ALONE'
        bars_text = '; '.join(f"st{r['staff']} v{r['voice']} {r['bars'][0]}" + (f"-{r['bars'][1]}" if r['bars'][1] != r['bars'][0] else '') for r in rows)
        why = (f"{tally['ESTABLISHED']} bar-voices established, {tally['UNKNOWN']} UNKNOWN, {tally['FREE']} FREE"
               + (f"; {len(refused)} established bar-voices not rowed (a printed number used twice)" if refused else ''))
        table.append((item, counts, outcome, bars_text, str(len(rows)), f'evidence/{item}.txt' if rows else '', why))
    (BUILD / 'rows.json').write_text(json.dumps(all_rows, indent=2) + '\n', encoding='utf-8')
    out = ['# HD2a worklist: the class-A files of HD2\'s printed-staff diff, classified', '',
           'Every file with class-A notes in `docs/prompts/runs/HD2/corpus-diff.txt` (its per-file list; the',
           'first catalogue id of each file), read bar by bar off the app\'s current model by `signature.py`;',
           'rows written by `build_rows.py` (method in both docstrings). ROWS: hand rows written for the',
           'established bar-voices; the file\'s other candidate bar-voices stay as the model reads them.',
           'UNKNOWN: candidates, none established. LEFT ALONE: every candidate FREE (a single consistent',
           "crossing line, the Moonlight shape), or no row possible. HD2 ROWS: no candidate left, HD2's rows",
           "cover the file's class-A bars. A file's class counts are HD2's (all passes); the bar-voices are",
           "this reading's (first pass of each printed bar). Nothing heard.", '',
           '| file | HD2 classes (notes) | outcome | rows (staff, voice, printed bars) | row count | evidence | bar-voices |',
           '| --- | --- | --- | --- | --- | --- | --- |']
    for item, counts, outcome, bars_text, n, ev, why in table:
        out.append(f'| {item} | {counts} | {outcome} | {bars_text} | {n} | {ev} | {why} |')
    tot = collections.Counter(t[2] for t in table)
    out += ['', f"Files: {len(table)}; " + ', '.join(f'{k} {v}' for k, v in sorted(tot.items())) + f"; rows {len(all_rows)}."]
    (HERE / 'worklist.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
    print(f"files {len(table)}", dict(tot), 'rows', len(all_rows))


if __name__ == '__main__':
    main()
