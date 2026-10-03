"""X1's mutants: each a one-place change that breaks one rule, run against the tests that should catch it.

For each mutant: the file backed up with its sha256, the change applied (the old text must occur once), the
named unit files run, the file restored and its sha256 checked. A mutant is caught when the run fails.
Run from the worktree root; writes docs/prompts/runs/X1/mutants.txt (and one log per mutant).

    python docs/prompts/runs/X1/scripts-mutants.py [name ...]
"""
import hashlib
import pathlib
import subprocess
import sys

RUNS = pathlib.Path('docs/prompts/runs/X1')
SR = 'app/src/data/sessionRun.ts'
RUNNER = 'app/src/ui/sessionRunner.ts'
SESSION = 'app/src/curriculum/session.ts'

NEVER_EVIDENCE = """  if (result.ok) notify(result.run);
  return result;
}

/**
 * Closes the stored run"""
NEVER_EVIDENCE_MUTANT = """  if (result.ok) notify(result.run);
  // MUTANT session-is-evidence: a completed activity written into the runs.
  if (result.ok && event.kind === 'completed') {
    const done = result.run.activities.find((one) => one.token === expected.token);
    if (done) {
      const { recordRun } = await import('./progressStore');
      await recordRun({ itemId: done.slot.itemId, mode: 'tempo', tempoPct: 100, accuracy: 1, accuracyEstimated: false, wrongNotes: 0, missed: 0, durationMs: 1, passed: true, masterEligible: true, tempoMeasured: true } as never);
    }
  }
  return result;
}

/**
 * Closes the stored run"""

MUTANTS = {
    'no-token-check': (SR, "  if (!current || current.token !== expected.token) return { ok: false, why: 'stale-token', run: stored };", "  if (!current) return { ok: false, why: 'stale-token', run: stored };", ['tests/unit/sessionRun.test.ts']),
    'any-demand-step-is-redundant': (SR, "return demand !== undefined && next.slot.claim?.kind === 'demand' && next.slot.claim.demand === demand;", "return demand !== undefined && next.slot.claim?.kind === 'demand';", ['tests/unit/sessionAdaptation.test.ts']),
    'failure-completes': (SR, "      if (event.outcome === 'failed') {", "      if (event.outcome === ('never' as Outcome)) {", ['tests/unit/sessionAdaptation.test.ts']),
    'second-attempt-skips-too': (SR, "if (event.outcome === 'passed-full' && attempts === 1 && following && redundantAfter(current, following)) {", "if (event.outcome === 'passed-full' && following && redundantAfter(current, following)) {", ['tests/unit/sessionAdaptation.test.ts']),
    'unknown-skips-too': (SR, "if (event.outcome === 'passed-full' && attempts === 1 && following && redundantAfter(current, following)) {", "if (attempts === 1 && following && redundantAfter(current, following)) {", ['tests/unit/sessionAdaptation.test.ts']),
    'no-accrual-cap': (SR, "const ms = Math.min(MAX_ACCRUAL_MS, Math.max(0, Math.round(event.ms)));", "const ms = Math.max(0, Math.round(event.ms));", ['tests/unit/sessionRun.test.ts', 'tests/unit/sessionTransition.test.ts']),
    'left-activity-never-returns': (SR, "  return activity.state === 'pending' || ((activity.state === 'active' || activity.state === 'attempted') && activity.movedOn !== true);", "  return activity.state === 'pending';", ['tests/unit/sessionRun.test.ts']),
    'session-is-evidence': (SR, NEVER_EVIDENCE, NEVER_EVIDENCE_MUTANT, ['tests/unit/sessionRunNeverEvidence.test.ts']),
    'recheck-counts-its-own-visit': (RUNNER, "const before = facts.visit === undefined ? encounters : encounters.filter((row) => row.visit !== facts.visit);", "const before = encounters;", ['tests/unit/sessionRecheck.test.ts']),
    'recheck-invalidates-by-id': (RUNNER, "const met = contact.contact === 'met';", "const met = contact.contact !== 'unmet';", ['tests/unit/sessionRecheck.test.ts']),
    'hidden-time-counts': (RUNNER, "        take();\n        visibleSince = null;\n        void flush();", "        take();\n        void flush();", ['tests/unit/sessionClock.test.ts']),
    'offer-opened-unkept': (RUNNER, "    } catch {\n      return { ok: false, why: 'offer-not-kept' };\n    }", "    } catch {\n      // MUTANT offer-opened-unkept\n    }", ['tests/unit/todaySessionRun.test.ts']),
    'drill-opened-without-token': (RUNNER, "    router.navigateDrill(route.itemId, { ...(route.rung === undefined ? {} : { rung: route.rung }), session });", "    router.navigateDrill(route.itemId, { ...(route.rung === undefined ? {} : { rung: route.rung }) });", ['tests/unit/todaySessionRun.test.ts', 'tests/unit/sessionTransition.test.ts']),
    'repurposing-unsaid': (RUNNER, "  const repurposed = mine.adaptations.filter((one) => one.kind === 'repurposed').map((one) => one.why);", "  const repurposed: string[] = [];", ['tests/unit/sessionTransition.test.ts']),
    'rung-list-ungated': (SESSION, "  const offered = automaticFromList(item, learner, ctx.input.vocabulary ?? VOCABULARY_V0).offered;", "  const offered = automaticFromList(item, learner, ctx.input.vocabulary ?? VOCABULARY_V0) !== null;", ['tests/unit/oneGateBoundary.test.ts']),
    'practice-row-first': (SESSION, "const METHOD_TRACKS: ReadonlySet<string> = new Set(['practice']);", "const METHOD_TRACKS: ReadonlySet<string> = new Set([]);", ['tests/unit/taughtByAncestry.test.ts']),
    'jam-list-order': (SESSION, "  return (item.notation?.chordCount ?? 0) > 0 || item.drill?.kind === 'backing-track';", "  return item.id === '';", ['tests/unit/sessionProtocol.test.ts']),
    'quick-check-any-drill': ('app/src/ui/screens/DrillScreen.ts', "  const kind = item.drill?.kind;\n  return kind !== undefined && !UNJUDGED_DRILL_KINDS.has(kind);", "  return item.drill !== undefined;", ['tests/unit/lessonPagePicksPassTheAdmission.test.ts']),
    'no-contact-assumption': (SESSION, "      ...(one.item ? { contact: contactAssumption(input, slot.kind, one.item, one.claim) } : {}),", "", ['tests/unit/sessionRecheck.test.ts', 'tests/unit/todaySessionRun.test.ts', 'tests/unit/sessionProtocol.test.ts']),
}


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(name: str) -> str:
    rel, old, new, tests = MUTANTS[name]
    path = pathlib.Path(rel)
    raw = path.read_bytes()
    digest = sha(path)
    crlf = b'\r\n' in raw
    text = raw.decode('utf-8').replace('\r\n', '\n')
    if text.count(old) != 1:
        return f'{name}: NOT APPLIED (the old text occurs {text.count(old)} times in {rel})'
    mutated = text.replace(old, new)
    path.write_bytes((mutated.replace('\n', '\r\n') if crlf else mutated).encode('utf-8'))
    try:
        proc = subprocess.run(['npx', 'vitest', 'run', *tests], cwd='app', capture_output=True, text=True, shell=True, encoding='utf-8', errors='replace')
        (RUNS / f'mutant-{name}.txt').write_text(f'mutant {name} in {rel}; npx vitest run {" ".join(tests)}\n{proc.stdout}\n{proc.stderr}\nexit={proc.returncode}\n', encoding='utf-8')
        caught = proc.returncode != 0
    finally:
        path.write_bytes(raw)
    back = sha(path) == digest
    return f'{name}: {"caught" if caught else "SURVIVED"} ({", ".join(tests)}); {rel} restored {"sha256 equal" if back else "SHA256 DIFFERS"}'


if __name__ == '__main__':
    names = sys.argv[1:] or list(MUTANTS)
    lines = [run(name) for name in names]
    out = RUNS / ('mutants.txt' if not sys.argv[1:] else f'mutants-{"-".join(sys.argv[1:])}.txt')
    survived = sum(1 for line in lines if 'SURVIVED' in line or 'NOT APPLIED' in line)
    out.write_text('\n'.join(['python docs/prompts/runs/X1/scripts-mutants.py ' + ' '.join(sys.argv[1:]), *lines, f'exit={1 if survived else 0}']) + '\n', encoding='utf-8')
    print('\n'.join(lines))
