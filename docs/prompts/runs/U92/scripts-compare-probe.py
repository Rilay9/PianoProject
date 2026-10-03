"""Compare U92's probe readings before and after, per face (docs/prompts/runs/U92/probe-<label>-<face>.json):
what the concept rows' detail lines said that was false or missing before, what they say after, and
how the rows' heights moved. Usage: python scripts-compare-probe.py [before-label] [after-label]"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.stdout.reconfigure(encoding="utf-8")
BEFORE = sys.argv[1] if len(sys.argv) > 1 else "before"
AFTER = sys.argv[2] if len(sys.argv) > 2 else "after"


def load(label: str, face: str) -> list[dict]:
    return json.loads((HERE / f"probe-{label}-{face}.json").read_text(encoding="utf-8"))["rows"]


def count_of(meta: str) -> str | None:
    m = re.search(r"(\d+) to practise", meta)
    return m.group(1) if m else None


def false_number(r: dict) -> str | None:
    """Before: the visible text ends in digits that are a strict prefix of the count (\"… · 1\" for 15)."""
    count = count_of(r["meta"])
    if count is None:
        return None
    shown = r["reads"].rstrip("…").rstrip()
    m = re.search(r"(\d+)$", shown)
    if m and shown.endswith(m.group(1)) and len(m.group(1)) < len(count) and count.startswith(m.group(1)):
        # The digits are the count's own, cut: "Stage 2 · core · 1" (the stage number is a different token).
        tail = shown[: len(shown) - len(m.group(1))]
        if tail.endswith("· ") or tail == "":
            return f'{r["id"]}: reads "{r["reads"]}" for {count}'
    return None


for face in ("stack", "wide"):
    before = [r for r in load(BEFORE, face) if r["kind"] == "concept"]
    after = {r["id"]: r for r in load(AFTER, face) if r["kind"] == "concept"}
    print(f"== {face} face, 342 x 740, {len(before)} concept rows over every stage ({BEFORE} -> {AFTER})")
    wrong = [x for x in (false_number(r) for r in before) if x]
    print(f"{BEFORE}: a count cut to another number ({len(wrong)}):")
    for line in wrong:
        print("  " + line)
    hidden = [r for r in before if count_of(r["meta"]) is None]
    print(f"{BEFORE}: no count on the line at all, fitDetail having dropped it ({len(hidden)})")
    clipped = [r for r in before if count_of(r["meta"]) is not None and false_number(r) is None and count_of(r["reads"]) is None]
    print(f"{BEFORE}: a count on the line but out of view, clipped whole ({len(clipped)})")
    def stage_list_cut(r: dict) -> bool:
        full = re.search(r"Stage (\d+(?:, \d+)*)", r["meta"])
        shown = re.search(r"Stage ([\d, ]*)$", r["reads"].rstrip("…").rstrip())
        if not full or not shown:
            return False
        want = full.group(1).split(", ")
        got = re.findall(r"\d+", shown.group(1))
        return 0 < len(got) and len(got) < len(want) + 1 and got != want

    stage_cut = [r for r in before if r["cut"] and stage_list_cut(r)]
    print(f"{BEFORE}: a stage list cut part-way, reading as fewer stages ({len(stage_cut)}):")
    for r in stage_cut:
        print(f'  {r["id"]}: "{r["meta"]}" reads "{r["reads"]}"')
    whole_after = [r for r in after.values() if not r["firstTokenWhole"]]
    cut_after = [r for r in after.values() if r["cut"]]
    print(f"{AFTER}: count not read whole: {len(whole_after)}; any cut: {len(cut_after)}")
    lines = {}
    grew = 0
    for r in before:
        a = after.get(r["id"])
        if not a:
            continue
        lines[a["metaLines"]] = lines.get(a["metaLines"], 0) + 1
        if a["rowHeight"] > r["rowHeight"]:
            grew += 1
    print(f"{AFTER}: rows by the lines their detail takes: {dict(sorted(lines.items()))}")
    print(f"{AFTER}: rows taller than {BEFORE}: {grew} of {len(before)}")
    tb = sum(r["rowHeight"] for r in before)
    ta = sum(r["rowHeight"] for r in after.values())
    print(f"the concept rows' heights summed, {AFTER} over {BEFORE}: {ta / tb:.2f}")
    drills_b = [r for r in load(BEFORE, face) if r["kind"] == "drill"]
    drills_a = [r for r in load(AFTER, face) if r["kind"] == "drill"]
    changed = sum(1 for x, y in zip(drills_b, drills_a) if x["rowHeight"] != y["rowHeight"] or x["meta"] != y["meta"])
    print(f"exercise rows: {len(drills_b)} {BEFORE}, {len(drills_a)} {AFTER}; changed in height or words: {changed}; cut {AFTER}: {sum(1 for r in drills_a if r['cut'])}")
    print()
