"""
E50b (Entry 181): records, in `tools/content/repaired_identities.json`, the one derived repair relationship the build
produced (the approved Wabash cut, re-cut from its repaired parent) and, on every relation, that the repair changed the
tempo a run of the old file was measured against (`tempoChanged`). The reviewer's required change on E50,
`docs/review/responses/68e0479b.md` §2 and §3. Never edited by hand; idempotent: a second run writes the same bytes.

    python scripts-repaired-cut.py [<served content dir> ...]

1. The table as E50's generator wrote it is read, and its re-serialisation compared with the raw bytes first (the
   round-trip rule); the seven entries keep their bytes but for the one key this adds, at their end.
2. Each of the seven re-proves on the committed score as the build re-proves it (`convert.former_identities`).
3. The cut, from the approved row of `content/sources/excerpts.json` (its definition) and the committed repaired parent:
   a. the old parent is rebuilt from the repaired one through its repair (the restore lines, the date, the creating
      system) and must be the repair's `from`, and the committed file at E50's base (`git show df275e8f:...`, read only);
   b. the cutter over the old parent with the approved definition, zipped under the laptop's creating system (0), must
      be the old cut the laptop served: the full sha256 the E-tail run recorded for the main checkout's cut
      (`runs/E-tail/cuts-sha256-before.txt`), the cut E50a's after build made (`runs/E50a/item6-rows.tsv`) whose
      identity the laptop's catalogue read in place held (`runs/E50a/item6-compare.txt`: "excerpt cut: the after row's
      identity: 5"), and E50's before build (`runs/E50/classify.txt`);
   c. the cutter over the repaired parent with the same definition, zipped the same way, is the new cut (`to`); where a
      served content dir is given (the laptop's catalogue now, read in place), its cut must be those bytes;
   d. the new cut with the parent repair's own restore lines put back is the old cut, byte for byte under that system,
      exactly as the build re-proves it (`excerpts.former_cut_identities`), and the two cuts are the same bars, staves,
      notes and time, the tempo 96 against 120.
4. `tempoChanged: true` on the seven and on the cut.
A step that fails stops the run and nothing is written. Output: runs/E50b/repaired-cut.txt.
"""
from __future__ import annotations

import difflib
import hashlib
import json
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
import convert  # noqa: E402
import excerpts  # noqa: E402

OUT = convert.REPAIRED_IDENTITIES_FILE
LOG = W / "docs" / "prompts" / "runs" / "E50b" / "repaired-cut.txt"
TMP = W / "build" / "e50b" / "repaired-cut"
PARENT = "song.blues.wabash-blues"
E50_BASE = "df275e8f"
LAPTOP_SYSTEM = 0
MARK = "E50b (Entry 181; the reviewer's required change"
COMMENT_E50B = (
    " E50b (Entry 181; the reviewer's required change, docs/review/responses/68e0479b.md): every relation says "
    "tempoChanged, the repair changed the tempo a run of the old file was measured against, so the build also records the "
    "old identity as provenance.tempoRepairedFrom and no tempo-dependent standard reads such a run's percentage against "
    "the repaired tempo; and cuts holds the one derived repair relationship the build produced, the approved Wabash cut "
    "re-cut from its repaired parent (never a rule for other descendants), re-proved on every build by "
    "excerpts.former_cut_identities: the new cut with the parent repair's restore lines put back, zipped under the old "
    "machine's creating system, is the old cut's bytes. Learner continuity only, as above: the approval stays stale and "
    "its parentSha256 unchanged. Written by docs/prompts/runs/E50b/scripts-repaired-cut.py after E50's generator, which "
    "rewrites the file whole: a rerun of that generator is followed by this one."
)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def serialise(comment: str, repairs: list[dict], cuts: list[dict]) -> str:
    """E50's writer (`runs/E50/scripts-repaired-identities.py`), with the cuts section after the repairs."""
    text = json.dumps({"_comment": comment}, indent=2, ensure_ascii=False)[:-2] + ',\n  "repairs": [\n'
    text += ",\n".join("    " + json.dumps(r, ensure_ascii=False) for r in repairs)
    text += "\n  ]"
    if cuts:
        text += ',\n  "cuts": [\n' + ",\n".join("    " + json.dumps(c, ensure_ascii=False) for c in cuts) + "\n  ]"
    return text + "\n}\n"


def entries_of(path: Path) -> list[tuple[str, bytes]]:
    with zipfile.ZipFile(path) as archive:
        return [(info.filename, archive.read(info.filename)) for info in archive.infolist()]


def score_text(entries: list[tuple[str, bytes]]) -> str:
    return next(data for name, data in entries if not name.startswith("META-INF")).decode("utf-8")


def recorded_old_cut(eid: str) -> str:
    """The old cut the laptop served, as the run records name it; they must agree."""
    etail = (W / "docs/prompts/runs/E-tail/cuts-sha256-before.txt").read_text(encoding="utf-8")
    full = {line.split()[1].lstrip("*").rsplit("/", 1)[-1]: line.split()[0] for line in etail.splitlines() if line.strip()}[f"{eid}.mxl"]
    rows = (W / "docs/prompts/runs/E50a/item6-rows.tsv").read_text(encoding="utf-8").splitlines()
    e50a = next(line.split("\t") for line in rows if line.startswith(eid + "\t"))
    compare = (W / "docs/prompts/runs/E50a/item6-compare.txt").read_text(encoding="utf-8")
    classify = (W / "docs/prompts/runs/E50/classify.txt").read_text(encoding="utf-8")
    if e50a[2] != "unchanged" or e50a[4] != full[:12]:
        raise SystemExit(f"STOP: E50a's after cut {e50a} is not the E-tail record {full[:12]}")
    if "excerpt cut: the after row's identity: 5" not in compare:
        raise SystemExit("STOP: E50a's laptop read does not say every cut held the after identity")
    if f"identity {full[:12]} -> " not in classify:
        raise SystemExit("STOP: E50's before build did not cut the recorded old cut")
    return full


def main(argv: list[str]) -> int:
    served = [Path(one) for one in argv]
    raw_table = OUT.read_text(encoding="utf-8")
    data = json.loads(raw_table)
    repairs, cuts = data["repairs"], data.get("cuts", [])
    comment = data["_comment"]
    if serialise(comment, repairs, cuts) != raw_table:
        raise SystemExit("STOP: the table does not re-serialise to its own bytes: splice by hand is not allowed")
    lines = [f"table {OUT.relative_to(W).as_posix()}: {len(repairs)} repairs, {len(cuts)} cut relation(s) on entry; "
             f"re-serialised to its own bytes: True"]
    table = json.loads(convert.FORMER_IDENTITIES_FILE.read_text(encoding="utf-8"))["identities"]
    items = {row["id"]: row for row in json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]}

    # 2. The seven re-prove as the build re-proves them.
    for repair in repairs:
        named = convert.former_identities(W / "content" / repair["file"], table, repairs)
        if named != [repair["from"]]:
            raise SystemExit(f"STOP {repair['id']}: does not re-prove on the committed score ({named})")
        repair.setdefault("tempoChanged", True)
        lines.append(f"{repair['id']}: re-proved on the committed score, named [{repair['from'][:12]}]; tempoChanged {repair['tempoChanged']}")

    # 3. The cut.
    approvals = [row for row in excerpts.read_definitions()["excerpts"] if row["of"] == PARENT]
    if len(approvals) != 1:
        raise SystemExit(f"STOP: {len(approvals)} approved rows of {PARENT}")
    row = approvals[0]
    selection = row.get("selection") or "both"
    eid = excerpts.excerpt_id(PARENT, int(row["fromBar"]), int(row["toBar"]), selection)
    repair = next(one for one in repairs if one["id"] == PARENT)
    parent_path = W / "content" / repair["file"]
    parent_raw = parent_path.read_bytes()
    if sha(parent_raw) != repair["to"] or repair["to"] != items[PARENT]["convertedSha256"]:
        raise SystemExit("STOP: the committed parent is not the repair's file")
    shutil.rmtree(TMP, ignore_errors=True)
    (TMP / "old").mkdir(parents=True)
    (TMP / "new").mkdir(parents=True)
    # a. the old parent
    entries = convert._entries(parent_raw)
    at = convert._score_at(entries, undated=True)
    old_parent = convert._redated(convert._restored(entries, at, repair["restore"]), at, repair["date"], repair["system"])
    at_base = subprocess.run(["git", "-C", str(W), "show", f"{E50_BASE}:content/{repair['file']}"], capture_output=True, check=True).stdout
    if old_parent is None or sha(old_parent) != repair["from"] or old_parent != at_base:
        raise SystemExit("STOP: the old parent does not rebuild through its repair to the committed file at E50's base")
    old_parent_path = TMP / "old-parent.mxl"
    old_parent_path.write_bytes(old_parent)
    lines.append(f"old parent rebuilt through its repair: {sha(old_parent)[:12]} = the repair's from, = git show {E50_BASE}:content/{repair['file']}")
    # b. the old cut
    old_made = excerpts.cut(old_parent_path, int(row["fromBar"]), int(row["toBar"]), selection, eid, TMP / "old" / f"{eid}.mxl")
    old_entries = entries_of(old_made.path)
    old_sha = sha(convert.pinned_archive(old_entries, LAPTOP_SYSTEM))
    served_old = recorded_old_cut(eid)
    if old_sha != served_old:
        raise SystemExit(f"STOP: the cutter over the old parent gives {old_sha}, the laptop served {served_old}")
    lines.append(f"old cut: the cutter over the old parent, zipped under system {LAPTOP_SYSTEM}: {old_sha} = the laptop's served cut "
                 f"(E-tail's record; E50a's after build and laptop read; E50's before build)")
    # c. the new cut
    new_made = excerpts.cut(parent_path, int(row["fromBar"]), int(row["toBar"]), selection, eid, TMP / "new" / f"{eid}.mxl")
    new_entries = entries_of(new_made.path)
    new_sha = sha(convert.pinned_archive(new_entries, LAPTOP_SYSTEM))
    for folder in served:
        laptop = (folder / excerpts.SCORES_SUBDIR / f"{eid}.mxl").read_bytes()
        if sha(convert.pinned_archive(entries_of(folder / excerpts.SCORES_SUBDIR / f"{eid}.mxl"), LAPTOP_SYSTEM)) != new_sha:
            raise SystemExit(f"STOP: the served cut in {folder} is not the new cut")
        lines.append(f"served {folder}: its cut {sha(laptop)[:12]} is the new cut")
    lines.append(f"new cut: the cutter over the repaired parent, zipped under system {LAPTOP_SYSTEM}: {new_sha}")
    # d. the relation, re-proved as the build re-proves it
    relation = {
        "id": eid,
        "file": (excerpts.SCORES_SUBDIR / f"{eid}.mxl").as_posix(),
        "change": (f"E50b (Entry 181): the approved cut of {PARENT}, printed bars {row['fromBar']}-{row['toBar']}, "
                   f"{selection} hands, re-cut from the repaired parent: the same bars and staves, differing from the old cut only "
                   "by the parent's tempo repair (the old cut printed the words \"= 120\" beside the converter's quarter = 96)"),
        "of": PARENT,
        "fromBar": int(row["fromBar"]),
        "toBar": int(row["toBar"]),
        "selection": selection,
        "cutVersion": excerpts.CUT_VERSION,
        "parentFrom": repair["from"],
        "parentTo": repair["to"],
        "from": old_sha,
        "system": LAPTOP_SYSTEM,
        "to": new_sha,
        "tempoChanged": True,
    }
    block = {"of": PARENT, "fromBar": relation["fromBar"], "toBar": relation["toBar"], "selection": selection,
             "cutVersion": excerpts.CUT_VERSION, "parentSha256": repair["to"]}
    named = excerpts.former_cut_identities(new_made.path, eid, block, parent_path, [relation], repairs, table)
    if named != [old_sha]:
        raise SystemExit(f"STOP: the relation does not re-prove as the build re-proves it ({named})")
    same = [(m.bars, m.staves, m.notes, m.time) for m in (old_made, new_made)]
    if same[0] != same[1] or (old_made.tempo_bpm, new_made.tempo_bpm) != (96.0, 120.0):
        raise SystemExit(f"STOP: the two cuts are not the same bars and staves at 96 and 120 ({same}, {old_made.tempo_bpm}, {new_made.tempo_bpm})")
    lines.append(f"re-proved as the build does (excerpts.former_cut_identities): named [{old_sha[:12]}]; the same bars, staves, notes "
                 f"and time {same[0]}; tempo {old_made.tempo_bpm} -> {new_made.tempo_bpm}; levels {old_made.level} -> {new_made.level}")
    diff = list(difflib.unified_diff(score_text(new_entries).splitlines(True), score_text(old_entries).splitlines(True), "new cut", "old cut", n=1))
    lines.append("the score text, new cut -> old cut (the whole difference):")
    lines.extend("   " + line.rstrip("\n") for line in diff)
    cuts = [one for one in cuts if one["id"] != eid] + [relation]

    # 4. Written once, idempotent.
    if MARK not in comment:
        comment += COMMENT_E50B
    text = serialise(comment, repairs, cuts)
    OUT.write_text(text, encoding="utf-8", newline="\n")
    lines.append(f"{OUT.relative_to(W).as_posix()}: {len(repairs)} repairs and {len(cuts)} cut relation, {len(text.encode('utf-8'))} bytes; "
                 f"unchanged from the file on entry: {text == raw_table}")
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    shutil.rmtree(TMP, ignore_errors=True)
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
