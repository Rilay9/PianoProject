"""G30's fix-forward itemisation (operating-procedure §12): every content change, where / before / after / why.

usage: python docs/prompts/runs/G30/scripts-fixforward_items.py <catalog.json> <out.txt>
`catalog.json` is the catalogue the fix-forward build wrote. The "before" of each item is the same maker read
with the row as 09ec1337 committed it (printed), which is what that commit's build wrote; the "after" is the
plan as it builds now. Contract and lesson text before is read from 09ec1337 (`git show`, read only).
"""
from __future__ import annotations

import copy
import json
import subprocess
import sys
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))

import family_contracts as FC  # noqa: E402
import generate_exercises as G  # noqa: E402

BASE = "09ec1337"
FAMILY = "repeated_notes"


def at_base(path: str) -> str:
    return subprocess.run(["git", "show", f"{BASE}:{path}"], cwd=ROOT, capture_output=True, check=True).stdout.decode("utf-8")


def strikes(sc) -> int:
    return sum(h["fingered"] for h in FC.physical_facts(sc)["hands"].values())


def main() -> None:
    rows = {row["id"]: row for row in json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))}
    base_row = json.loads(at_base("tools/content/family_contracts.json"))["families"][FAMILY]
    now_row = FC.contract(FAMILY)
    lines = ["# G30 fix-forward content items (docs/review/responses/09ec1337.md §3, option (b))", "",
             "## Family row (`tools/content/family_contracts.json`, `repeated_notes`)", ""]
    lines.append(f"- `version`: {base_row['version']} -> {now_row['version']}. Why: the generated artifact changed "
                 "(its fingering withdrawn), so its exact identity moves; its music did not.")
    lines.append(f"- `physical.fingering.printed`: {base_row['physical']['fingering']['printed']!r} -> "
                 f"{now_row['physical']['fingering']['printed']!r}. Why: the row's own note calls the order the "
                 "generator's convention, not a published source (the ruling, questions-53670d2a.md §3).")
    lines.append(f"- `physical.fingering.note`: \"{base_row['physical']['fingering']['note']}\" -> "
                 f"\"{now_row['physical']['fingering']['note']}\". Why: the hold is resolved; the clause matches the other 42 rows.")
    lines.append(f"- `physical.repeatedNotes`: absent -> {json.dumps(now_row['physical']['repeatedNotes'], ensure_ascii=False)}. "
                 "Why: the reviewer's option (b): this drill's solution, declared in the field the gate already reads, "
                 "scoped to this drill.")
    base_lesson = at_base("content/lessons/technique.5.md").replace("\r\n", "\n")
    now_lesson = (ROOT / "content" / "lessons" / "technique.5.md").read_text(encoding="utf-8").replace("\r\n", "\n")
    old_par = next(p for p in base_lesson.split("\n\n") if p.startswith("**Repeated notes**"))
    new_par = next(p for p in now_lesson.split("\n\n") if p.startswith("**Repeated notes**"))
    line = now_lesson[:now_lesson.index(new_par)].count("\n") + 1
    lines += ["", "## Lesson (`content/lessons/technique.5.md`)", "",
              f"- `content/lessons/technique.5.md`:{line}: \"{' '.join(old_par.split())}\" -> \"{' '.join(new_par.split())}\". "
              "Why: the files no longer print 3-2-1 / 4-3-2-1, so the lesson no longer claims them; it keeps its framing "
              "(changing finger is one way to keep a fast repeat even) and says what these drills ask, with the order left "
              "to the learner, the same rule the row declares. Within the lesson's stated three minutes."]
    printed_row = copy.deepcopy(now_row)
    printed_row["physical"]["fingering"]["printed"] = "printed"
    real = FC.contract
    with mock.patch.object(G.family_contracts, "contract",
                           lambda family: printed_row if family == FAMILY else real(family)):
        before = {entry["id"]: (strikes(sc), FC.music_digest(sc, entry))
                  for sc, entry in G.default_plan(quick=False) if entry["drill"]["generator"]["family"] == FAMILY}
    after = {entry["id"]: (strikes(sc), FC.music_digest(sc, entry), FC.physical_faults(now_row, FC.recipe_of(entry), sc, entry))
             for sc, entry in G.default_plan(quick=False) if entry["drill"]["generator"]["family"] == FAMILY}
    lines += ["", "## Generated items (`scores/generated/<id>.mxl` and the catalogue row)", ""]
    for item_id in sorted(after):
        provenance = rows[item_id]["provenance"]
        formers = ", ".join(f"v{f['version']}" for f in provenance.get("formerGeneratorIdentities") or []) or "none"
        b, a = before[item_id], after[item_id]
        lines.append(f"- `{item_id}`: fingered strikes {b[0]} -> {a[0]}; notes unchanged (music digest "
                     f"{'equal' if a[1] == b[1] else 'MOVED'}); identity {FAMILY} v1 -> v{provenance['identity']['version']}; "
                     f"former identities carried: {formers}; physical faults now: {len(a[2])}")
    moved = [i for i in after if after[i][1] != before[i][1]]
    lines += ["", f"items: {len(after)}; music digest moved: {len(moved)}"]
    Path(sys.argv[2]).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(after)} items; digest moved: {len(moved)}")


if __name__ == "__main__":
    main()
