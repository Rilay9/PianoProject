"""G1e ruling: writes docs/prompts/runs/G1e/ruling/probe.txt from the probes' JSON under build/ (before: the committed
G1e, after: this tree). Run from the worktree root."""
import io
import json
from collections import Counter


def load(name):
    return json.load(open(f"build/{name}", encoding="utf-8"))


rb, ra = load("g1e-ruling-probe-before.json"), load("g1e-ruling-probe-after.json")
pb, pa = load("g1e-probe-ruling-before.json"), load("g1e-probe-ruling-after.json")
out = io.open("docs/prompts/runs/G1e/ruling/probe.txt", "w", encoding="utf-8", newline="\n")


def w(s=""):
    out.write(s + "\n")


w("G1e ruling probes on the shipped built content (app/public/content, copied from the main checkout). Before = the committed G1e")
w("(8e640ee6: session.ts and help.ts at HEAD, scripts-on-committed-g1e.py, probe-runs-committed-g1e.txt); after = this tree")
w("(probe-runs-this-tree.txt). Constructed learners (placements, id rows for the paused songs), not real histories.")
w()
w("## 1. The rung case (scripts-zz-g1e-ruling-probe.test.ts): every rung listing a song, the learner placed on it (its track on beside")
w("## the core), every song option of the rung paused, the 30-minute card at seeds 0 and 1")
w("counts: " + json.dumps(ra["counts"], ensure_ascii=False))
for label, r in (("before", rb), ("after", ra)):
    c = r["cards"]
    s = c["seed0"]
    w(f"{label}: cards {c['built']}; a paused song on some row: {c['withARevivedSong']}; a next-lesson row: {len(c['withANextLessonRow'])}; "
      f"seed 0, of {s['songAskRungs']} rungs with an ask only songs meet, the card says the rung waits on {s['songAskRungsSayingItWaits']}")
s = ra["cards"]["seed0"]
w("after, the words said: " + " | ".join(s["heldWords"]))
w("after, the slot that says it: " + ", ".join(s["heldSlotKinds"]))
w("after, the rungs with an ask only songs meet whose card does not say it (seed 0), and the new row there:")
for line in s["songAskRungsNotSayingIt"]:
    head, rows = line.split(": ", 1)
    new = [r for r in rows.split(" ;; ") if r.startswith("new ")]
    w("  " + head + " || " + (new[0] if new else "no new row"))
w("after, rungs without such an ask whose card says it: " + str(len(s["otherRungsSayingItWaits"])))
w("sample, after (seed 0): 1.1, 2.2 and 0.3 with every song option paused:")
for one in ra["sample"]:
    w(f"  {one['rung']}:")
    for row in one["rows"]:
        w("    " + row)
w()
w("## 2. The earlier-song adversary with no claim exempt (scripts-zz-g1e-probe-no-exemption.test.ts: the G1e probe with its rung-own")
w("## exemption removed): placed at each core rung, one earlier core song passed twenty days ago and paused; 30 and 120 min, seeds 0 and 1")
for label, p in (("before", pb), ("after", pa)):
    a = p["adversary"]
    tail = ""
    if a["found"]:
        tail = f"; of the first {len(a['firstFew'])}: " + ", ".join(f"{k[0]} ({k[1]}) {v}" for k, v in Counter((f["slot"], f["claim"]) for f in a["firstFew"]).items())
    w(f"{label}: cards {a['builds']}, rows naming the paused song {a['found']}{tail}")
w()
w("exit=0 (each run; the probes report by writing, not by failing)")
out.close()
print("exit=0")
