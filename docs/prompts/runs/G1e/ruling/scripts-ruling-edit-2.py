"""G1e ruling, the second edit (run after scripts-ruling-edit.py): the new slot's claim-phase held row taken out.
It was redundant — with a held rung, an ask the card already serves no longer takes the new slot, so the slot
falls to the ladder, whose rung step brings the rung's other material and says the rung waits — and it took a
rung option in the claim pass, ahead of the later claims. Run from the worktree root."""
from pathlib import Path

p = Path("app/src/curriculum/session.ts")
raw = p.read_bytes()
crlf = b"\r\n" in raw
t = raw.decode("utf-8").replace("\r\n", "\n")
old = """    // A rung whose piece ask the learner holds (G1e, the reviewer's ruling): an ask the card already serves
    // does not take the new slot again, and the new slot says the rung waits, with the rung's other material,
    // rather than revive a paused piece or pass the rung over.
    const held = wants.some((want) => want.held);
    for (const want of held ? wants.filter((want) => !served(want)) : [...wants.filter((want) => !served(want)), ...wants.filter(served)]) {
      const item = pick(want.offer, ctx.seed);
      if (item) return { item, claim: askedClaim(want, false, strand), lessonId: strand.rung.id, strand: strand.track };
    }
    if (held) {
      const waits = fallbackStep(ctx, 'any', undefined, (items) => uncountedFirst(ctx, items), strand, 'rung');
      if (waits) return waits;
    }
  }"""
new = """    // A rung whose piece ask the learner holds (G1e, the reviewer's ruling): an ask the card already serves
    // does not take the new slot again, so the slot falls to the ladder, whose rung step brings the rung's
    // other material and says the rung waits — never a paused piece revived, never the rung passed over.
    const held = wants.some((want) => want.held);
    for (const want of held ? wants.filter((want) => !served(want)) : [...wants.filter((want) => !served(want)), ...wants.filter(served)]) {
      const item = pick(want.offer, ctx.seed);
      if (item) return { item, claim: askedClaim(want, false, strand), lessonId: strand.rung.id, strand: strand.track };
    }
  }"""
assert t.count(old) == 1
t = t.replace(old, new)
p.write_bytes((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
print("ok")
