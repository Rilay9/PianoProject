"""HD2's corpus diff, classified.

Reads the shards `corpusDiff.probe.ts` writes (`app/build/HD2/corpus-diff.shard-<n>.json`) and writes
`docs/prompts/runs/HD2/corpus-diff.txt`. Run from the repository root after the probe:

    python docs/prompts/runs/HD2/classify.py

Each changed note is classified by its transition (before = the voice-home rule at e7cf920c, after = the
printed-staff rule) and by the shape of its voice's printed staves in that bar (the new model's notes of
the same voice in the same unrolled bar, by onset; `1+2` where the voice sounds on both staves at one
onset). The classes are mechanical; whether each is semantically right is a reading, not this script's.
"""
import collections
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[4]
SHARDS = sorted((ROOT / 'app' / 'build' / 'HD2').glob('corpus-diff.shard-*.json'))
OUT = ROOT / 'docs' / 'prompts' / 'runs' / 'HD2' / 'corpus-diff.txt'

CLASSES = {
    'A': 'reused or moved voice, whole bar on one staff: the old crossing dropped, the printed staff stands (rule 3)',
    'B': 'two lines under one voice number (both staves at one onset in the bar): the printed staff stands',
    'C': 'voice on both staves in the bar, one after the other, no crossing established locally: the printed staff stands (rule 2)',
    'D': 'a crossing established in the bar (an excursion that returns, or a spanning beam or chord) where the old rule saw none',
    'E': 'crossed under both rules, by the other hand',
    'OUTSIDE': 'anything else: a hand change with neither rule crossing, a one-staff score, or a declared hand applied',
}


def shape(change):
    parts = change['barLine'].split()
    if change['simultaneous']:
        return 'simultaneous'
    return 'one-staff' if len(set(parts)) == 1 else 'both-staves'


def classify(change):
    was_x = change['before'].endswith('/x')
    now_x = change['after'].endswith('/x')
    if change['staves'] == 1:
        return 'OUTSIDE'
    if was_x and not now_x:
        return {'one-staff': 'A', 'simultaneous': 'B', 'both-staves': 'C'}[shape(change)]
    if now_x and not was_x:
        return 'D'
    if was_x and now_x:
        return 'E'
    return 'OUTSIDE'


def main():
    files = notes = 0
    failures = []
    changed = []
    for path in SHARDS:
        shard = json.loads(path.read_text(encoding='utf8'))
        files += shard['files']
        notes += shard['notes']
        failures += shard['failures']
        changed += shard['changed']
    for change in changed:
        change['class'] = classify(change)

    lines = [
        'HD2 corpus diff: hand or crossStaff changed between the voice-home rule (e7cf920c) and the printed-staff rule',
        f'shards read: {len(SHARDS)}; score files compared: {files}; model notes compared (repeats unrolled): {notes}; '
        f'files that failed to compare: {len(failures)}',
        f'notes changed: {len(changed)} in {len({c["file"] for c in changed})} files '
        f'({len({(c["file"], c["sourceMeasureIndex"]) for c in changed})} printed bars)',
        '',
        'By class (notes; files; printed bars), then by transition:',
    ]
    by_class = collections.defaultdict(list)
    for change in changed:
        by_class[change['class']].append(change)
    for key, text in CLASSES.items():
        group = by_class.get(key, [])
        transitions = collections.Counter(f'{c["before"]}>{c["after"]} st{c["staff"]}' for c in group)
        lines.append(
            f'  {key} {len(group):>6} notes; {len({c["file"] for c in group}):>4} files; '
            f'{len({(c["file"], c["sourceMeasureIndex"]) for c in group}):>5} bars  {text}'
        )
        for transition, count in transitions.most_common():
            lines.append(f'      {count:>6}  {transition}')
    more = [c for c in changed if c['staves'] > 2]
    lines += [
        '',
        f'On sheets of more than two staves (folded onto staff 2 by `staffOf`, unchanged): {len(more)} notes in '
        f'{sorted({c["ids"][0] for c in more})}',
        f'Declarations on the changed files: {dict(collections.Counter(c["declared"] for c in changed))}',
        '',
        'Failures:' if failures else 'Failures: none',
        *[f'  {f}' for f in failures],
        '',
        'Per file (first catalogue id; notes by class):',
    ]
    per_file = collections.defaultdict(collections.Counter)
    first_id = {}
    for change in changed:
        per_file[change['file']][change['class']] += 1
        first_id[change['file']] = change['ids'][0]
    for file, counts in sorted(per_file.items(), key=lambda item: -sum(item[1].values())):
        lines.append(f'  {sum(counts.values()):>5}  {first_id[file]}  ' + ' '.join(f'{k}:{v}' for k, v in sorted(counts.items())))
    lines += ['', 'Bars per class (catalogue id, printed bar, voice: the voice\'s staves in the bar | changed notes as midi/staff before>after), first 25 of each:']
    for key in CLASSES:
        bars = collections.OrderedDict()
        for change in by_class.get(key, []):
            bars.setdefault((change['ids'][0], change['bar'], change['measureIndex'], change['voice']), []).append(change)
        lines.append(f'  {key}: {len(bars)} bar-voices')
        for (item, bar, _, voice), group in list(bars.items())[:25]:
            notes_text = ' '.join(f'{c["midi"]}/st{c["staff"]}:{c["before"]}>{c["after"]}' for c in group[:8])
            lines.append(f'    {item} bar {bar} v{voice}: {group[0]["barLine"][:60]} | {notes_text}{" …" if len(group) > 8 else ""}')
    OUT.write_text('\n'.join(lines) + '\n', encoding='utf8')
    print('\n'.join(lines[:30]))


if __name__ == '__main__':
    main()
