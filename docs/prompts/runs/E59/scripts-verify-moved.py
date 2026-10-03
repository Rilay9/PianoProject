"""
E59's data layer: every moved file read, per family, against the inventory established independently of the build that
moved it, and every moved identity re-proved as the build re-proves it.

    python scripts-verify-moved.py <before content dir> <after content dir> [--pdmx <dir>] [--relations <json>] [--name <out>]

- **The inventory, per family**: the rows whose built file changed between the two builds, against PDMX's rows tagged
  `tempoDefaulted` (which runs/E59/pdmx-count.txt proved to be exactly the rows the raw uploads send through the no-tempo
  branch), X40's table of kern and MuseTrainer rows playing the converter's default (`runs/X40/defaulted.txt`), and the
  approved cuts whose parent is a moved PDMX row (`content/sources/excerpts.json`); every other family must show none
  moved. A family short or over is a fault, by name.
- **Every moved file**: no `<metronome>` of the default's shape left, exactly one sound-only default (an empty `<words />`
  and `<sound tempo="96" />`, the optional `<staff>` music21 writes on a grand staff), and, for a committed PDMX file, its
  sha256 the row's `convertedSha256` (read from `--pdmx`, default the committed `content/scores/pdmx`).
- **Every moved identity**: the new file names its old identities, re-proved the way the build re-proves them
  (`convert.former_identities` with `repaired_identities.json`, or `--relations` in a mutant; a cut by
  `excerpts.former_cut_identities`): a PDMX file its committed file at the base (the before build's), a file the build
  converts the before build's file and every dated file E50a recorded for it, a cut the before build's cut zipped under
  the relation's system; and none of them `tempoChanged`.
Output: runs/E59/<out>.txt (default verify-moved). Exit 1 on any fault.
"""
from __future__ import annotations

import argparse
import ast
import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path
from unittest import mock

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
import convert  # noqa: E402
import excerpts  # noqa: E402

RUNS = W / "docs" / "prompts" / "runs" / "E59"
PRINTED_DEFAULT = re.compile(r'<metronome parentheses="no">\s*<beat-unit>quarter</beat-unit>\s*<per-minute>96</per-minute>\s*</metronome>')
SOUND_ONLY = re.compile(r'<direction>\s*<direction-type>\s*<words />\s*</direction-type>\s*(?:<staff>\d+</staff>\s*)?<sound tempo="96" />\s*</direction>')


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def rows(content: Path) -> dict[str, dict]:
    raw = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
    return {item["id"]: item for item in (raw["items"] if isinstance(raw, dict) else raw)}


def score_text(raw: bytes) -> str:
    entries = convert._entries(raw) or []
    return next(data.decode("utf-8") for name, data in entries if convert.is_text_entry(name) and not name.startswith("META-INF/"))


def entries_of(path: Path) -> list[tuple[str, bytes]]:
    with zipfile.ZipFile(path) as archive:
        return [(info.filename, archive.read(info.filename)) for info in archive.infolist()]


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("before")
    parser.add_argument("after")
    parser.add_argument("--pdmx", default=str(W / "content" / "scores" / "pdmx"))
    parser.add_argument("--relations")
    parser.add_argument("--name", default="verify-moved")
    args = parser.parse_args(argv)
    before_dir, after_dir, pdmx_dir = Path(args.before), Path(args.after), Path(args.pdmx)
    patch = mock.patch.object(convert, "REPAIRED_IDENTITIES_FILE", Path(args.relations)) if args.relations else None
    if patch:
        patch.start()
    convert.historical_identities.cache_clear()
    convert.repaired_identities.cache_clear()
    table = json.loads(convert.FORMER_IDENTITIES_FILE.read_text(encoding="utf-8"))["identities"]
    relations = json.loads(convert.REPAIRED_IDENTITIES_FILE.read_text(encoding="utf-8"))
    before, after = rows(before_dir), rows(after_dir)
    items = {r["id"]: r for r in json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]}
    # Its rows, one tuple a line; its last line is a count ("66 defaulted rows").
    x40 = [ast.literal_eval(line) for line in (W / "docs/prompts/runs/X40/defaulted.txt").read_text(encoding="utf-8").splitlines() if line.startswith("(")]
    expected = {
        "pdmx": sorted(i for i, r in items.items() if r.get("tempoDefaulted") is True),
        "kern": sorted(row[1] for row in x40 if row[0] == "kern"),
        "musetrainer": sorted(row[1] for row in x40 if row[0] == "MT"),
    }
    # The build's other callers: Mutopia's one row (its MIDI carries a tempo), the authored scores (each `.abc` a `Q:`, each
    # `.py` a `tempoBpm`) and the generator (no `normalise`) take the branch zero times; any move there is a fault.
    expected.update({"mutopia": [], "authored": [], "generated": []})
    approvals = excerpts.read_definitions()["excerpts"]
    expected["excerpt"] = sorted(excerpts.excerpt_id(r["of"], int(r["fromBar"]), int(r["toBar"]), r.get("selection") or "both")
                                 for r in approvals if r["of"] in set(expected["pdmx"]))
    moved: dict[str, list[str]] = {}
    for item_id in sorted(set(before) & set(after)):
        a, b = before[item_id], after[item_id]
        if not a.get("file") or not b.get("file"):
            continue
        new_path = (pdmx_dir / Path(b["file"]).name) if (a.get("provenance") or {}).get("source") == "pdmx" else after_dir / b["file"]
        if (before_dir / a["file"]).read_bytes() != new_path.read_bytes():
            moved.setdefault((a.get("provenance") or {}).get("source") or "?", []).append(item_id)
    lines: list[str] = []
    faults: list[str] = []
    families = sorted(set(moved) | set(expected))
    for fam in families:
        got, want = sorted(moved.get(fam, [])), expected.get(fam, [])
        lines.append(f"{fam}: moved {len(got)}, the inventory {len(want)}" + ("" if got == want else
                     f" — MISMATCH: moved, not in the inventory {sorted(set(got) - set(want))[:5]}; in the inventory, not moved "
                     f"{len(set(want) - set(got))} {sorted(set(want) - set(got))[:5]}"))
        if got != want:
            faults.append(f"{fam}: moved {len(got)} where the inventory has {len(want)}")
    cuts = {one["id"]: one for one in relations.get("cuts", []) if one["change"].startswith("E59 ")}
    proved = {fam: 0 for fam in families}
    for fam in families:
        for item_id in sorted(set(moved.get(fam, [])) | set(expected.get(fam, []))):
            a, b = before[item_id], after[item_id]
            new_path = (pdmx_dir / Path(b["file"]).name) if fam == "pdmx" else after_dir / b["file"]
            new = new_path.read_bytes()
            text = score_text(new)
            if PRINTED_DEFAULT.search(text) or len(SOUND_ONLY.findall(text)) != 1:
                faults.append(f"{item_id}: the default is not the sound alone in the moved file "
                              f"({len(PRINTED_DEFAULT.findall(text))} printed, {len(SOUND_ONLY.findall(text))} sound-only)")
                continue
            if fam == "pdmx" and sha(new) != items[item_id]["convertedSha256"]:
                faults.append(f"{item_id}: the file is not its row's convertedSha256")
                continue
            old = (before_dir / a["file"]).read_bytes()
            if fam == "excerpt":
                relation = cuts.get(item_id)
                block = b["provenance"]["excerpt"]
                parent = after[block["of"]]
                named = [] if relation is None else excerpts.former_cut_identities(
                    new_path, item_id, block, pdmx_dir / Path(parent["file"]).name, [relation])
                want = [sha(convert.pinned_archive(entries_of(before_dir / a["file"]), relation["system"]))] if relation else ["a relation"]
                tempo_changed = relation is not None and relation.get("tempoChanged") is not False
            else:
                named = convert.former_identities(new_path)
                want = [sha(old)] if fam == "pdmx" else sorted([e["sha256"] for e in table if e["file"] == a["file"] and e["undated"] == sha(old)] + [sha(old)])
                named = named if fam == "pdmx" else sorted(named)
                mine = [one for one in relations["repairs"] if one["id"] == item_id and one["to"] == sha(new)]
                tempo_changed = any(one.get("tempoChanged") is not False for one in mine)
            if named != want:
                faults.append(f"{item_id}: the old identities do not re-prove ({[s[:12] for s in named]} against {[s[:12] for s in want]})")
                continue
            if tempo_changed:
                faults.append(f"{item_id}: a relation says the tempo changed")
                continue
            proved[fam] += 1
    lines.append("re-proved, every moved file the sound alone and its old identities named: "
                 + ", ".join(f"{fam} {proved[fam]}" for fam in families))
    lines += [f"{len(faults)} fault(s)"] + [f"   FAULT {fault}" for fault in faults[:60]] + \
             ([f"   … {len(faults) - 60} more"] if len(faults) > 60 else [])
    (RUNS / f"{args.name}.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[:len(families) + 2]))
    if patch:
        patch.stop()
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
