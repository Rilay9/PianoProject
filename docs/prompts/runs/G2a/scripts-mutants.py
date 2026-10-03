# G2a's mutants: each alters app/src/evidence/transferPolicy.ts in one way a builder could have got
# the composition gate wrong, runs the policy and ladder tests, keeps the output as
# docs/prompts/runs/G2a/red-mutant-<name>.txt, and puts the file back to its exact bytes (checked by
# sha256 before the next mutant and at the end). Run from the worktree root.
import hashlib
import subprocess
import sys

POLICY = "app/src/evidence/transferPolicy.ts"
OUT = "docs/prompts/runs/G2a"
TESTS = ["tests/unit/transferPolicy.test.ts", "tests/unit/masteryLadder.test.ts"]

GATE = "  const composition = alreadyPlayed(relationship);\n  if (composition !== undefined) return none('unknown', composition, newDemands);\n"
DEMONSTRATED = "  return { verdict: 'demonstrated', on: differs,"

MUTANTS = {
    # The composition field alone, whether or not anything of it was played: the first cut of a new tune fails closed too.
    "composition-field-alone": [
        ("  if (composition === undefined || composition.playedAs.length === 0) return undefined;\n", "  if (composition === undefined) return undefined;\n"),
    ],
    # Only `demonstrated` capped, the dimension loop left to run: protection still spares on the measured dimensions.
    "cap-demonstrated-only": [
        (GATE, "  const composition = alreadyPlayed(relationship);\n"),
        (DEMONSTRATED, "  if (composition !== undefined) return { verdict: 'unknown', on: [], why: composition, differs, ...(newDemands === undefined ? {} : { newDemands }) };\n" + DEMONSTRATED),
    ],
    # The gate read before contact: a composition already played turns "not first contact" into unknown.
    "composition-before-contact": [
        (GATE, ""),
        ("  // 1. Contact.\n", "  // 1. Contact.\n  const early = context.relationship === undefined ? undefined : alreadyPlayed(context.relationship);\n  if (early !== undefined) return none('unknown', early, newDemands);\n"),
    ],
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


with open(POLICY, "rb") as handle:
    original = handle.read()
print("policy sha256 before:", sha(original))
text = original.decode("utf-8")
newline = "\r\n" if "\r\n" in text else "\n"
results = []
for name, edits in MUTANTS.items():
    mutated = text.replace("\r\n", "\n")
    for old, new in edits:
        if mutated.count(old) != 1:
            print(name, ": snippet not found exactly once:", repr(old[:60]))
            sys.exit(2)
        mutated = mutated.replace(old, new)
    with open(POLICY, "wb") as handle:
        handle.write(mutated.replace("\n", newline).encode("utf-8"))
    try:
        run = subprocess.run(["npx", "vitest", "run", *TESTS], cwd="app", capture_output=True, text=True, encoding="utf-8", errors="replace", shell=True)
        with open(f"{OUT}/red-mutant-{name}.txt", "w", encoding="utf-8") as handle:
            handle.write(f"npx vitest run {' '.join(TESTS)} (in app), with transferPolicy.ts mutated: {name}\n")
            handle.write(run.stdout + run.stderr)
            handle.write(f"exit={run.returncode}\n")
        results.append((name, run.returncode))
    finally:
        with open(POLICY, "wb") as handle:
            handle.write(original)
        with open(POLICY, "rb") as handle:
            assert sha(handle.read()) == sha(original), "policy not restored"
for name, code in results:
    print(f"{name}: exit={code} ({'caught' if code != 0 else 'SURVIVED'})")
with open(POLICY, "rb") as handle:
    print("policy sha256 after:", sha(handle.read()))
