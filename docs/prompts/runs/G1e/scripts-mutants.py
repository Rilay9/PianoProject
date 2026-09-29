"""
G1e mutants (G1d's harness): each takes the one rule away from one chooser, or bends the rule, and runs the
unit files that should catch it; session.ts is restored by its bytes (sha256 checked) after each. The last,
`committed-session`, is the committed session.ts whole (HEAD's bytes), so the final tests' red on the
committed code is recorded too. Run from the worktree root; writes docs/prompts/runs/G1e/mutants.txt.
"""
import hashlib
import subprocess
from pathlib import Path

SESSION = "app/src/curriculum/session.ts"
TESTS = ["tests/unit/repertoireRetention.test.ts", "tests/unit/transferOffer.test.ts", "tests/unit/projectLifecycle.test.ts"]

REVIEW = "    if (ctx.pausedOrPutAway(item)) continue;\n"
READY = "      if (!usable(ctx, item, 'only') || ctx.pausedOrPutAway(item) || ready.some((one) => one.item.id === item.id)) continue;\n"
READY_OFF = "      if (!usable(ctx, item, 'only') || ready.some((one) => one.item.id === item.id)) continue;\n"
AUTOMATIC = "  const automatic = step !== 'rung';\n"
RANKED = "    .filter((entry) => entry.items.some((one) => offerable(one.item)))\n"
CHOSEN = "    .filter((one) => offerable(one.item))\n"
OFFERABLE = "  const offerable = (item: CatalogItem): boolean => usable(ctx, item, 'any') && !ctx.pausedOrPutAway(item);\n"
TRANSFER = "      if (!usable(ctx, item, 'any') || ctx.pausedOrPutAway(item)) continue;\n"
JAM = "usable(ctx, item, 'any') && !ctx.pausedOrPutAway(item) && fromList(ctx, item, lesson))"
USABLE = "  if (!item || !playable(item) || ctx.used.has(item.id) || isReadingRow(item) || !admittedForTeaching(item)) return false;\n"
STATES = "      answer = state === 'paused' || state === 'retired';\n"
LOOKUP = "      const state = projectIn(projects, { itemId: item.id, material: materialOfItem(item) })?.state;\n"

MUTANTS = [
    # One chooser at a time loses the rule.
    ("retention-without-the-rule", REVIEW, ""),
    ("ready-without-the-rule", READY, READY_OFF),
    ("ladder-automatic-steps-without-the-rule", AUTOMATIC, "  const automatic = false;\n"),
    ("ladder-skill-step-without-the-rule", AUTOMATIC, "  const automatic = step !== 'rung' && step !== 'skill';\n"),
    ("ladder-demand-step-without-the-rule", AUTOMATIC, "  const automatic = step !== 'rung' && step !== 'demand';\n"),
    ("ladder-prerequisite-step-without-the-rule", AUTOMATIC, "  const automatic = step !== 'rung' && step !== 'prerequisite';\n"),
    ("exposure-without-the-rule", OFFERABLE, "  const offerable = (item: CatalogItem): boolean => usable(ctx, item, 'any');\n"),
    ("exposure-families-without-the-rule", RANKED, "    .filter((entry) => entry.items.some((one) => usable(ctx, one.item, 'any')))\n"),
    ("exposure-pieces-without-the-rule", CHOSEN, "    .filter((one) => usable(ctx, one.item, 'any'))\n"),
    ("transfer-without-the-rule", TRANSFER, "      if (!usable(ctx, item, 'any')) continue;\n"),
    ("jam-without-the-rule", JAM, "usable(ctx, item, 'any') && fromList(ctx, item, lesson))"),
    # The boundary of item 3 crossed: a rung's own list reads the rule.
    ("rung-step-reads-the-rule", AUTOMATIC, "  const automatic = true;\n"),
    ("usable-reads-the-rule", USABLE, USABLE + "  if (ctx.pausedOrPutAway(item)) return false;\n"),
    # The rule bent.
    ("paused-only", STATES, "      answer = state === 'paused';\n"),
    ("retired-only", STATES, "      answer = state === 'retired';\n"),
    ("maintaining-withdrawn-too", STATES, "      answer = state === 'paused' || state === 'retired' || state === 'maintaining';\n"),
    ("identity-by-id-only", LOOKUP, "      const state = projectIn(projects, { itemId: item.id, material: undefined })?.state;\n"),
    # A scattered read: a second lookup in a chooser.
    ("second-lookup-in-a-chooser", REVIEW, "    if (projectIn(ctx.input.projects ?? [], { itemId: item.id, material: undefined })?.state === 'paused') continue;\n"),
]

lines = []
p = Path(SESSION)
original = p.read_bytes()
digest = hashlib.sha256(original).hexdigest()
text = original.decode("utf-8")
crlf = "\r\n" in text
body = text.replace("\r\n", "\n")


def run(name: str, mutated: str) -> None:
    p.write_bytes((mutated.replace("\n", "\r\n") if crlf else mutated).encode("utf-8"))
    try:
        result = subprocess.run(["npx", "vitest", "run", *TESTS], cwd="app", capture_output=True, text=True, encoding="utf-8", errors="replace", shell=True)
        failed = [line.strip() for line in result.stdout.splitlines() if line.strip().startswith("×")]
        verdict = "CAUGHT" if result.returncode != 0 else "SURVIVED"
        lines.append(f"{name}: {verdict} (vitest exit {result.returncode}); red: {' | '.join(failed) if failed else '-'}")
    finally:
        p.write_bytes(original)
        assert hashlib.sha256(p.read_bytes()).hexdigest() == digest, f"{SESSION} not restored"
    lines.append(f"  {SESSION} restored, sha256 {digest}")


for name, old, new in MUTANTS:
    if body.count(old) != 1:
        lines.append(f"{name}: SKIPPED (anchor found {body.count(old)} times)")
        continue
    run(name, body.replace(old, new))

committed = subprocess.run(["git", "show", f"HEAD:{SESSION}"], capture_output=True, text=True, encoding="utf-8").stdout
run("committed-session (HEAD's session.ts whole: the final tests on the committed code)", committed.replace("\r\n", "\n"))

out = Path("docs/prompts/runs/G1e/mutants.txt")
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
