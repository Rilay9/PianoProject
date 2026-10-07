"""
G1e ruling mutants (G1e's harness, on the code after the reviewer's required change): the one rule now lives in
usable(), so each mutant either takes it out of usable() or makes one chooser call a pause-blind check in place
of usable() — the rung's ask and every ladder step among them — or bends the held-ask handling or the rule
itself. session.ts is restored by its bytes (sha256 checked) after each. Run from the worktree root; writes
docs/prompts/runs/G1e/ruling/mutants.txt.
"""
import hashlib
import subprocess
from pathlib import Path

SESSION = "app/src/curriculum/session.ts"
TESTS = ["tests/unit/repertoireRetention.test.ts", "tests/unit/transferOffer.test.ts", "tests/unit/projectLifecycle.test.ts"]

MUTANTS = [
    # The rule taken out of the one door.
    ("the-rule-gone-from-usable",
     "  return item !== undefined && !ctx.used.has(item.id) && candidate(item, songs) && !ctx.pausedOrPutAway(item);\n",
     "  return item !== undefined && !ctx.used.has(item.id) && candidate(item, songs);\n"),
    # One chooser at a time blind to the pause: the new readers first.
    ("rung-ask-blind (wantsOf's offer: runs, done, measure, this lesson's and the next's)",
     "    const offer = pool.filter((item) => usable(ctx, item, songs) && fromList(ctx, item, rung));\n",
     "    const offer = pool.filter((item) => !ctx.used.has(item.id) && candidate(item, songs) && fromList(ctx, item, rung));\n"),
    ("ladder-blind (every step, the rung step among them)",
     "    const offer = order(items.filter((item) => usable(ctx, item, songs) && (listedOn === undefined || fromList(ctx, item, listedOn))));\n",
     "    const offer = order(items.filter((item) => !ctx.used.has(item.id) && candidate(item, songs) && (listedOn === undefined || fromList(ctx, item, listedOn))));\n"),
    ("exposure-families-blind",
     "    .filter((entry) => entry.items.some((one) => usable(ctx, one.item, 'any')))\n",
     "    .filter((entry) => entry.items.some((one) => !ctx.used.has(one.item.id) && candidate(one.item, 'any')))\n"),
    ("exposure-pieces-blind",
     "  const chosen = entry.items\n    .filter((one) => usable(ctx, one.item, 'any'))\n",
     "  const chosen = entry.items\n    .filter((one) => !ctx.used.has(one.item.id) && candidate(one.item, 'any'))\n"),
    ("transfer-blind",
     "      if (!usable(ctx, item, 'any')) continue;\n",
     "      if (ctx.used.has(item.id) || !candidate(item, 'any')) continue;\n"),
    ("retention-blind",
     "    if (!usable(ctx, item, 'only')) continue;\n",
     "    if (!item || ctx.used.has(item.id) || !candidate(item, 'only')) continue;\n"),
    ("ready-blind",
     "      if (!usable(ctx, item, 'only') || ready.some((one) => one.item.id === item.id)) continue;\n",
     "      if (ctx.used.has(item.id) || !candidate(item, 'only') || ready.some((one) => one.item.id === item.id)) continue;\n"),
    ("jam-blind",
     ".filter((item): item is CatalogItem => usable(ctx, item, 'any') && fromList(ctx, item, lesson))",
     ".filter((item): item is CatalogItem => item !== undefined && !ctx.used.has(item.id) && candidate(item, 'any') && fromList(ctx, item, lesson))"),
    # The held ask bent.
    ("held-never-said",
     "    const held = waiting.length > 0 && waiting.every((item) => ctx.pausedOrPutAway(item));\n",
     "    const held = false && waiting.length > 0;\n"),
    ("held-ask-taken-as-met (its paused pieces dropped from the pool)",
     "    if (pool.length === 0) continue;\n",
     "    pool = pool.filter((item) => !ctx.pausedOrPutAway(item));\n    if (pool.length === 0) continue;\n"),
    ("a-served-ask-retakes-the-new-slot",
     "    for (const want of held ? wants.filter((want) => !served(want)) : [...wants.filter((want) => !served(want)), ...wants.filter(served)]) {\n",
     "    for (const want of [...wants.filter((want) => !served(want)), ...wants.filter(served)]) {\n"),
    ("said-on-every-row",
     "      const held = strand !== undefined && !ctx.saidHeld.has(strand.track) && heldAt(ctx, strand);\n",
     "      const held = strand !== undefined && heldAt(ctx, strand);\n"),
    # The code before the third edit: the warm-up kept silent (the first run's survivor, inverted).
    ("the-warm-up-kept-silent",
     "      const held = strand !== undefined && !ctx.saidHeld.has(strand.track) && heldAt(ctx, strand);\n",
     "      const held = songs !== 'none' && strand !== undefined && !ctx.saidHeld.has(strand.track) && heldAt(ctx, strand);\n"),
    # The rule bent.
    ("paused-only", "      answer = state === 'paused' || state === 'retired';\n", "      answer = state === 'paused';\n"),
    ("retired-only", "      answer = state === 'paused' || state === 'retired';\n", "      answer = state === 'retired';\n"),
    ("maintaining-withdrawn-too", "      answer = state === 'paused' || state === 'retired';\n", "      answer = state === 'paused' || state === 'retired' || state === 'maintaining';\n"),
    ("identity-by-id-only",
     "      const state = projectIn(projects, { itemId: item.id, material: materialOfItem(item) })?.state;\n",
     "      const state = projectIn(projects, { itemId: item.id, material: undefined })?.state;\n"),
    # A scattered read: a second lookup in a chooser.
    ("second-lookup-in-a-chooser",
     "    if (!usable(ctx, item, 'only')) continue;\n",
     "    if (!usable(ctx, item, 'only')) continue;\n    if (projectIn(ctx.input.projects ?? [], { itemId: item.id, material: undefined })?.state === 'refreshing') continue;\n"),
]

lines = []
p = Path(SESSION)
original = p.read_bytes()
digest = hashlib.sha256(original).hexdigest()
text = original.decode("utf-8")
crlf = "\r\n" in text
body = text.replace("\r\n", "\n")

for name, old, new in MUTANTS:
    if body.count(old) != 1:
        lines.append(f"{name}: SKIPPED (anchor found {body.count(old)} times)")
        continue
    mutated = body.replace(old, new)
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

out = Path("docs/prompts/runs/G1e/ruling/mutants.txt")
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
