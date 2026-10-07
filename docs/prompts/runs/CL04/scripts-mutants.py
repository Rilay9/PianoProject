"""CL04 mutants: each applied alone, its discriminating test run, the file restored.

Run from app/. Writes ../build/cl04/mutants.txt (the summary) and one log per mutant.
"""
import re
import subprocess
import sys
from pathlib import Path

OUT = Path('../build/cl04')

MUTANTS = [
    {
        'id': 'G70',
        'what': 'carriedExposures back to concepts only',
        'file': 'src/evidence/rungState.ts',
        'old': 'for (const concept of [...lesson.concepts, ...(lesson.introduces ?? [])]) {',
        'new': 'for (const concept of lesson.concepts) {',
        'test': 'tests/unit/skillsReadTheLadder.test.ts',
        'name': '3.1 carried and 3.3 not',
    },
    {
        'id': 'L70',
        'what': 'the check back to === undefined',
        'file': 'src/evidence/measurement.ts',
        'old': "  if (!KNOWN_OBSERVATION_DEFINITIONS.has(version)) return unmeasured(channel, 'unknown-definitions', ['definitions']);\n",
        'new': '',
        'test': 'tests/unit/evidenceOnlyMeasured.test.ts',
        'name': 'never read as version 1',
    },
    {
        'id': 'L73',
        'what': "timing's slot left undefined in here at an unresolvable step",
        'file': 'src/evidence/evidence.ts',
        'old': "const here = (untimed ? measurements.filter((m) => m.channel !== 'timing') : measurements).map((m) => m.at.get(step));",
        'new': "const here = measurements.map((m) => (untimed && m.channel === 'timing' ? undefined : m.at.get(step)));",
        'test': 'tests/unit/evidenceAdversarial.test.ts',
        'name': 'a right-pitched eighth at the same tempo is counted right',
    },
    {
        'id': 'L79',
        'what': 'the twin counted under both ids',
        'file': 'src/evidence/rungState.ts',
        'edits': [
            ('if (twin === undefined || !pool.has(paper) || pool.has(twin) || out.has(twin)) continue;',
             'if (twin === undefined || !pool.has(paper) || out.has(twin)) continue;'),
            ('if (meetsStandard(row, criteria, requirement.accuracy)) counted.add(item);',
             'if (meetsStandard(row, criteria, requirement.accuracy)) { counted.add(item); const also = twins.get(row.itemId); if (also !== undefined) counted.add(also); }'),
        ],
        'test': 'tests/unit/rungStateFromEvidence.test.ts',
        'name': 'is one item',
    },
    {
        'id': 'L73-overlap',
        'what': 'extra (the deviation): rhythm demands at an untimed step dropped from the record, not kept in otherDemands',
        'file': 'src/evidence/evidence.ts',
        'old': '      if ((named !== null && !named.has(demand)) || (untimed && timed.rhythm.has(demand))) {',
        'new': '      if (untimed && timed.rhythm.has(demand)) continue;\n      if (named !== null && !named.has(demand)) {',
        'test': 'tests/unit/evidenceAdversarial.test.ts',
        'name': 'two reads alike',
    },
    {
        'id': 'L79-title',
        'what': "extra: the lesson page's titleOf back to the catalog alone",
        'file': 'src/ui/screens/LessonScreen.ts',
        'old': "items.get(id)?.title ?? shelf.find((entry) => entry.itemId === id)?.piece.title ?? id;",
        'new': 'items.get(id)?.title ?? id;',
        'test': 'tests/unit/lessonPageReadsTheEvidence.test.ts',
        'name': 'names the piece by its title',
    },
]


def first_failure(text: str) -> str:
    for line in text.splitlines():
        if re.search(r'(AssertionError|TypeError|Error):', line):
            return line.strip()
    return '(no assertion line)'


def main() -> int:
    summary = []
    for m in MUTANTS:
        path = Path(m['file'])
        original = path.read_bytes()
        text = original.decode('utf-8')
        crlf = '\r\n' in text
        edits = m.get('edits') or [(m['old'], m['new'])]
        mutated = text.replace('\r\n', '\n')
        for old, new in edits:
            count = mutated.count(old)
            if count != 1:
                print(f"{m['id']}: expected one match, found {count}", file=sys.stderr)
                return 2
            mutated = mutated.replace(old, new)
        if crlf:
            mutated = mutated.replace('\n', '\r\n')
        try:
            path.write_bytes(mutated.encode('utf-8'))
            run = subprocess.run(
                f'npx vitest run {m["test"]} -t "{m["name"]}"',
                shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace',
            )
            log = run.stdout + run.stderr
            (OUT / f"mutant-{m['id']}.txt").write_text(log[-20000:], encoding='utf-8')
            verdict = 'caught (red)' if run.returncode != 0 else 'SURVIVED (green)'
            summary.append(f"{m['id']}: {m['what']} -> {m['test']} -t \"{m['name']}\": exit {run.returncode}, {verdict}; {first_failure(log)}")
        finally:
            path.write_bytes(original)
    (OUT / 'mutants.txt').write_text('\n'.join(summary) + '\n', encoding='utf-8')
    print('\n'.join(summary))
    return 0


if __name__ == '__main__':
    sys.exit(main())
