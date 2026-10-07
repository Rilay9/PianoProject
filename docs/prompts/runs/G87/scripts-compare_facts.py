"""G87: the before and after facts compared (docs/prompts/pictures/g87/{before,after}-facts.json).

- Stage 1's Start block: byte-equal before and after (every other stage's line unchanged).
- Stage 9's Start line: before it carries "the first thing on this rung", after it is `Opens “X”.` for the same X.
- The date box's look against the goal box's, light and dark: before unequal, after equal (the box's
  place aside, which is not a look).
Writes compare-facts.txt beside this script; exits 1 on any failed check.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
PICTURES = W / "docs" / "prompts" / "pictures" / "g87"
OUT = Path(__file__).resolve().parent / "compare-facts.txt"


def look(entry: dict) -> dict:
    return {key: value for key, value in entry.items() if key != "box"}


def main() -> int:
    before = json.loads((PICTURES / "before-facts.json").read_text(encoding="utf-8"))
    after = json.loads((PICTURES / "after-facts.json").read_text(encoding="utf-8"))
    checks: list[tuple[str, bool, str]] = []
    checks.append(("Stage 1's Start block byte-equal", before["stage1"]["startBlockHtml"] == after["stage1"]["startBlockHtml"], after["stage1"]["startLine"]))
    named = re.fullmatch(r"Opens “([^”]+)”, the first thing on this rung\.", before["stage9"]["startLine"] or "")
    checks.append(("Stage 9 before: the long line", named is not None, before["stage9"]["startLine"]))
    checks.append(("Stage 9 after: Opens “X”. for the same X", named is not None and after["stage9"]["startLine"] == f"Opens “{named.group(1)}”.", after["stage9"]["startLine"]))
    checks.append(("Stage 9's project sentence unchanged", before["stage9"]["projectLine"] == after["stage9"]["projectLine"], after["stage9"]["projectLine"]))
    for theme, date, goal in (("light", "date", "goal"), ("dark", "dateDark", "goalDark")):
        checks.append((f"{theme}: before, the date box unlike the goal box", look(before[date]) != look(before[goal]), json.dumps(look(before[date]), ensure_ascii=False)))
        checks.append((f"{theme}: after, the date box like the goal box", look(after[date]) == look(after[goal]), json.dumps(look(after[date]), ensure_ascii=False)))
        checks.append((f"{theme}: the goal box itself unchanged", look(before[goal]) == look(after[goal]), json.dumps(look(after[goal]), ensure_ascii=False)))
    # Item 3: a paused project's badge on the Stage 9 page.
    checks.append(("item 3 before: the paused badge in the pass style with its tick", before["paused"]["kind"] == "passed" and "✓" in (before["paused"]["mark"] or ""), json.dumps(before["paused"], ensure_ascii=False)))
    checks.append(("item 3 after: the paused badge says Paused, neutral, no tick", after["paused"]["text"] == "Paused" and after["paused"]["kind"] == "neutral" and "✓" not in (after["paused"]["mark"] or ""), json.dumps(after["paused"], ensure_ascii=False)))
    checks.append(("item 3 after: the paused badge drawn as not started is (colour and mark)", {k: after["paused"][k] for k in ("kind", "mark", "color")} == {k: after["notStarted"][k] for k in ("kind", "mark", "color")}, json.dumps(after["notStarted"], ensure_ascii=False)))
    checks.append(("item 3: not started unchanged", before["notStarted"] == after["notStarted"], json.dumps(before["notStarted"], ensure_ascii=False)))
    checks.append(("after: the date box inside the 342 px screen", after["date"]["box"]["x"] + after["date"]["box"]["width"] <= 342, json.dumps(after["date"]["box"])))
    checks.append(("the actions row: taller after (a relationship, not a number)", after["actionsHeight"] > before["actionsHeight"], "before < after"))
    lines = [f"{'ok  ' if ok else 'FAIL'} {name} — {said}" for name, ok, said in checks]
    failed = sum(1 for _, ok, _ in checks if not ok)
    lines.append(f"exit={1 if failed else 0} ({len(checks) - failed} of {len(checks)} ok)")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(lines[-1])
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
