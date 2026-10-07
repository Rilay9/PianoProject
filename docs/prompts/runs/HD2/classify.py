"""HD2's corpus diff, classified.

Reads the shards `corpusDiff.probe.ts` writes (`app/build/HD2/corpus-diff.shard-<n>.json`). Run from the
repository root after the probe:

    python docs/prompts/runs/HD2/classify.py corpus-diff.printed-staff.txt             # the held global rule
    python docs/prompts/runs/HD2/classify.py corpus-diff.verified-hands.txt --targets  # the landed overrides

`--targets` also checks every changed note against the `hand` rows of `content/sources/verified-facts.json`
(through `tools/content/verified_hand.py`): TARGET where a row names its item, bar, staff and voice and the
note now has the row's hand, not cross-staff; anything else is OUTSIDE, listed.

Each changed note is classified by its transition (before = the voice-home rule at e7cf920c, after = the
worktree's extractor) and by the shape of its voice's printed staves in that bar (the new model's notes of
the same voice in the same unrolled bar, by onset; `1+2` where the voice sounds on both staves at one
onset). The classes are mechanical; whether each is semantically right is a reading, not this script's.
"""
import collections
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[4]
SHARDS = sorted((ROOT / 'app' / 'build' / 'HD2').glob('corpus-diff.shard-*.json'))
HERE = ROOT / 'docs' / 'prompts' / 'runs' / 'HD2'

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


def targets_check(changed):
    """Each change against the hand rows: TARGET or OUTSIDE, with the lines that say which."""
    sys.path.insert(0, str(ROOT / 'tools' / 'content'))
    import verified_hand as VF

    rows = VF.read_hand_facts()
    hit_rows = collections.Counter()
    outside = []
    for change in changed:
        match = [i for i, r in enumerate(rows)
                 if r['item'] in change['ids'] and r['bars'][0] <= change['bar'] <= r['bars'][1]
                 and r['staff'] == change['staff'] and r['voice'] == change['voice'] and change['after'] == r['fact']]
        if match:
            hit_rows[match[0]] += 1
        else:
            outside.append(change)
    lines = ['', f'Against the hand rows of content/sources/verified-facts.json ({len(rows)} rows):']
    for i, r in enumerate(rows):
        lines.append(f"  row {i}: {r['item']} bars {r['bars'][0]}-{r['bars'][1]} staff {r['staff']} voice {r['voice']} -> "
                     f"{r['fact']}: {hit_rows[i]} notes changed")
    lines.append(f'  TARGET {sum(hit_rows.values())} notes; OUTSIDE {len(outside)} notes')
    for change in outside[:50]:
        lines.append(f"    OUTSIDE {change['ids'][0]} bar {change['bar']} st{change['staff']} v{change['voice']} "
                     f"{change['midi']}: {change['before']}>{change['after']}")
    return lines


def main():
    out_name = next((a for a in sys.argv[1:] if not a.startswith('--')), 'corpus-diff.txt')
    targets = '--targets' in sys.argv[1:]
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
        'HD2 corpus diff: hand or crossStaff changed between the extractor at e7cf920c (the voice-home rule) and '
        + ('the verified-hand overrides' if targets else 'the printed-staff rule'),
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
    if targets:
        lines += targets_check(changed)
    (HERE / out_name).write_text('\n'.join(lines) + '\n', encoding='utf8')
    print('\n'.join(lines[:12] + (lines[-10:] if targets else [])))


if __name__ == '__main__':
    main()
