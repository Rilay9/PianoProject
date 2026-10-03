"""
E59 (Entry 184) items 3 and 7: every identity E59 moves related to the file that replaces it in
`tools/content/repaired_identities.json`, under the reviewed-repair relation, for learner continuity only. E57's
generator (`runs/E57/scripts-repaired-identities.py`) for the repairs and E50b's (`runs/E50b/scripts-repaired-cut.py`)
for the cuts, with E59's change. Never edited by hand; spliced into the file as text, never rewriting it (E50's, E50b's
and E57's relations stay byte for byte).

    python scripts-repaired-identities.py --record <base sha> <before content dir> <after content dir> <build-diff json>
    python scripts-repaired-identities.py --replay <another copy of repaired_identities.json>   (after a merge; see `replay`)

- **A committed PDMX file** (every row `content/sources/pdmx.json` tags `tempoDefaulted`; scripts-pdmx-transform.py moved
  them): the old file is the committed file at <base sha> (`git show`, read only), which every catalogue since D4 served;
  it must re-prove as E50a's entry for the file. The new file is the committed file now, the row's `convertedSha256`. One
  relation: `from` the old file, its date and creating system, `to` the new file.
- **A file the build converts** (every non-PDMX, non-cut row the build diff lists as changed): the old file is the before
  build's, undated since E50a, the before catalogue's identity for the row and the `undated` form E50a's table recorded for
  an entry of the file; the new file is the after build's. Two relations with the same restore lines: the dated file E50a
  recorded (`from`, date, system) and the undated old file (`from`, marked `undated`; E57's clause).
- **A cut** (every excerpt the build diff lists as changed; E50b's relation, `excerpts.former_cut_identities`): the old
  parent is rebuilt from the new one through its E59 repair and must be the committed file at <base sha>; the cutter over
  it with the approved definition, zipped under the laptop's creating system (0, E50b's), must be the before build's cut;
  the cutter over the new parent, zipped the same way, must be the after build's cut. `from` the old cut, `to` the new.
Each repair: `restore` the line hunks that turn the new score's text into the old undated text (E57's `hunks`), `change`
naming E59, and `tempoChanged` **false**: the repair removed a printed quarter = 96 the edition never states and kept the
sound, so the tempo a run of the old file was measured against is the tempo the new file plays (the build diff proves
every changed row's tempo events, read through the app's reader, identical), and the build records no
`provenance.tempoRepairedFrom` for it. Each relation is re-proved exactly as the build re-proves it, with the committed
table and these relations alone: it must name the old identities and nothing else. A row that fails any step stops the
run and nothing is written. Idempotent: a relation already in the file (same `id`, `from` and `to`) is not added twice,
and a rerun that adds nothing leaves the file's bytes as they are. Output: runs/E59/repaired-identities.txt.
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
LOG = W / "docs" / "prompts" / "runs" / "E59" / "repaired-identities.txt"
#: Short: Windows refuses long paths, and a cut keeps its own long file name, which its archive records.
TMP = W / "build" / "e59" / "rc"
LAPTOP_SYSTEM = 0
CHANGE = ("E59 (Entry 184): a defaulted tempo is playback only; the source states no tempo, and the converter's default "
          "96 was written as a printed metronome mark (quarter = 96) beside its sound; now as the sound alone, so the old file "
          "printed a number the edition never states and played the same tempo")
COMMENT_ADDITION = (
    " E59 (Entry 184): the repairs and cuts whose change names E59 are spliced in by "
    "docs/prompts/runs/E59/scripts-repaired-identities.py, which never rewrites the file (after E50's, E50b's and E57's "
    "generators, in that order). Each says tempoChanged false: the repair removed a printed quarter = 96 the edition never "
    "states and kept its sound, so a run of the old file was measured against the tempo the new file plays, and the build "
    "records no provenance.tempoRepairedFrom for it."
)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def score_entry(raw: bytes, undated: bool) -> tuple[list[tuple[str, bytes]], int]:
    entries = convert._entries(raw)
    at = None if entries is None else convert._score_at(entries, undated=undated)
    if entries is None or at is None:
        raise SystemExit("not a music21 score in the converter's layout")
    return entries, at


def hunks(now: str, was: str) -> list[dict]:
    """E57's `hunks`: line hunks turning `now` into `was`, applied in order, each widened by context until unique in the
    text as it stands when it is applied."""
    a, b = now.splitlines(keepends=True), was.splitlines(keepends=True)
    out: list[dict] = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal":
            continue
        current = "".join(b[:j1] + a[i1:])
        for context in range(1, 200):
            left, right = min(context, j1), min(context, len(a) - i2)
            snippet_now = "".join(b[j1 - left:j1] + a[i1:i2] + a[i2:i2 + right])
            snippet_was = "".join(b[j1 - left:j1] + b[j1:j2] + a[i2:i2 + right])
            if left + right > 0 and current.count(snippet_now) == 1:
                out.append({"now": snippet_now, "was": snippet_was})
                break
        else:
            raise SystemExit("a hunk that no context makes unique")
    return out


def same_outside_score(old: list, old_at: int, new: list, new_at: int) -> bool:
    return [n for n, _ in old] == [n for n, _ in new] and \
        [d for i, (_, d) in enumerate(old) if i != old_at] == [d for i, (_, d) in enumerate(new) if i != new_at]


def catalogue(content: Path) -> dict[str, dict]:
    raw = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
    return {item["id"]: item for item in (raw["items"] if isinstance(raw, dict) else raw)}


def entries_of(path: Path) -> list[tuple[str, bytes]]:
    with zipfile.ZipFile(path) as archive:
        return [(info.filename, archive.read(info.filename)) for info in archive.infolist()]


def splice(relations: list[dict], cuts: list[dict]) -> tuple[int, int]:
    text = OUT.read_text(encoding="utf-8")
    parsed = json.loads(text)
    present = {(one["id"], one["from"], one["to"]) for one in parsed["repairs"]}
    present_cuts = {(one["id"], one["from"], one["to"]) for one in parsed.get("cuts", [])}
    fresh = [one for one in relations if (one["id"], one["from"], one["to"]) not in present]
    fresh_cuts = [one for one in cuts if (one["id"], one["from"], one["to"]) not in present_cuts]
    if fresh or fresh_cuts or COMMENT_ADDITION.strip() not in text:
        head, sep, rest = text.partition('",\n  "repairs": [\n')
        if not sep:
            raise SystemExit("STOP: the file's layout is not the generators' (no _comment then repairs)")
        if COMMENT_ADDITION.strip() not in head:
            head += json.dumps(COMMENT_ADDITION, ensure_ascii=False)[1:-1]
        body, sep2, tail = rest.partition("\n  ],\n")
        if not sep2:
            raise SystemExit("STOP: the file's layout is not the generators' (no end of repairs)")
        body += "".join(",\n    " + json.dumps(one, ensure_ascii=False) for one in fresh)
        cuts_head, sep3, cuts_tail = tail.partition("\n  ]\n}")
        if not sep3 or not cuts_head.startswith('  "cuts": [\n'):
            raise SystemExit("STOP: the file's layout is not the generators' (no cuts at the end)")
        cuts_head += "".join(",\n    " + json.dumps(one, ensure_ascii=False) for one in fresh_cuts)
        text = head + sep + body + sep2 + cuts_head + sep3 + cuts_tail
        json.loads(text)
        OUT.write_text(text, encoding="utf-8", newline="\n")
    return len(fresh), len(fresh_cuts)


def replay(source: Path) -> int:
    """
    `--replay <json>`: E59's relations (the repairs and cuts whose change names E59) taken from another copy of the file
    — this lane's, `git show <its head>:tools/content/repaired_identities.json` — and spliced into the file as it stands
    (a merge with a lane that spliced its own relations at the same place, E57a's), with the comment sentence, by the same
    idempotent splice. Each PDMX relation is re-proved on the committed score before anything is written; the others
    re-prove on the next build (`test_measured_truth`, `scripts-verify-moved.py`). Output: runs/E59/repaired-identities-replay.txt.
    """
    data = json.loads(source.read_text(encoding="utf-8"))
    relations = [one for one in data["repairs"] if one["change"].startswith("E59 ")]
    cuts = [one for one in data.get("cuts", []) if one["change"].startswith("E59 ")]
    table = json.loads(convert.FORMER_IDENTITIES_FILE.read_text(encoding="utf-8"))["identities"]
    for one in relations:
        if one["file"].startswith("scores/pdmx/"):
            named = convert.former_identities(W / "content" / one["file"], table, [one])
            if named != [one["from"]]:
                raise SystemExit(f"STOP {one['id']}: does not re-prove on the committed score ({named})")
    added, added_cuts = splice(relations, cuts)
    parsed = json.loads(OUT.read_text(encoding="utf-8"))
    text = (f"replayed from {source.name}: {len(relations)} E59 repair relation(s) and {len(cuts)} cut relation(s); {added} and "
            f"{added_cuts} added; {len(parsed['repairs'])} repairs and {len(parsed.get('cuts', []))} cut(s) in the file")
    LOG.with_name("repaired-identities-replay.txt").write_text(text + "\n", encoding="utf-8")
    print(text)
    return 0


def main(argv: list[str]) -> int:
    if len(argv) == 2 and argv[0] == "--replay":
        return replay(Path(argv[1]))
    if len(argv) != 5 or argv[0] != "--record":
        print(__doc__)
        return 2
    base, before_dir, after_dir, diff_json = argv[1], Path(argv[2]), Path(argv[3]), Path(argv[4])
    table = json.loads(convert.FORMER_IDENTITIES_FILE.read_text(encoding="utf-8"))["identities"]
    items = {row["id"]: row for row in json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]}
    pdmx_ids = [item_id for item_id, row in items.items() if row.get("tempoDefaulted") is True]
    changed = json.loads(diff_json.read_text(encoding="utf-8"))
    if sorted(changed.get("pdmx", [])) != sorted(pdmx_ids):
        raise SystemExit(f"STOP: the build diff's changed PDMX rows are not the {len(pdmx_ids)} tagged tempoDefaulted")
    built_ids = [item_id for fam, ids in sorted(changed.items()) if fam not in ("pdmx", "excerpt") for item_id in ids]
    cut_ids = list(changed.get("excerpt", []))
    before, after = catalogue(before_dir), catalogue(after_dir)
    lines = [f"base {base}; {len(pdmx_ids)} committed PDMX file(s) (tempoDefaulted), {len(built_ids)} build-converted file(s) "
             f"({', '.join(f'{fam} {len(ids)}' for fam, ids in sorted(changed.items()) if fam not in ('pdmx', 'excerpt'))}), "
             f"{len(cut_ids)} cut(s) (the build diff)"]
    relations: list[dict] = []
    by_parent: dict[str, dict] = {}

    for item_id in pdmx_ids:
        row = items[item_id]
        rel = f"scores/pdmx/{row['cid']}.mxl"
        old = subprocess.run(["git", "-C", str(W), "show", f"{base}:content/{rel}"], capture_output=True, check=True).stdout
        old_sha = sha(old)
        proved = convert.dated_form(old)
        recorded = [e for e in table if e["file"] == rel and e["sha256"] == old_sha]
        if proved is None or len(recorded) != 1 or {k: recorded[0][k] for k in ("date", "system", "sha256", "undated")} != proved:
            raise SystemExit(f"STOP {item_id}: the old file does not re-prove as E50a's entry ({proved} against {recorded})")
        new_path = W / "content" / rel
        new = new_path.read_bytes()
        new_sha = sha(new)
        if new_sha != row["convertedSha256"] or new_sha == old_sha:
            raise SystemExit(f"STOP {item_id}: the committed file is not the row's moved convertedSha256")
        if after[item_id]["provenance"]["identity"] != {"kind": "file", "sha256": new_sha}:
            raise SystemExit(f"STOP {item_id}: the after build's identity is not the committed file")
        old_entries, old_at = score_entry(old, undated=False)
        new_entries, new_at = score_entry(new, undated=True)
        if not same_outside_score(old_entries, old_at, new_entries, new_at):
            raise SystemExit(f"STOP {item_id}: the archives differ outside the score")
        was = convert.without_encoding_date(old_entries[old_at][1].decode("utf-8"))
        now = new_entries[new_at][1].decode("utf-8")
        repair = {"id": item_id, "file": rel, "change": CHANGE, "from": old_sha, "date": proved["date"], "system": proved["system"],
                  "to": new_sha, "restore": hunks(now, was), "tempoChanged": False}
        named = convert.former_identities(new_path, table, [repair])
        if named != [old_sha]:
            raise SystemExit(f"STOP {item_id}: the relation does not re-prove as the build re-proves it ({named})")
        relations.append(repair)
        by_parent[item_id] = repair
        lines.append(f"[pdmx] {item_id}: from {old_sha} ({proved['date']}, system {proved['system']}; E50a's entry re-proved) to {new_sha}; "
                     f"{len(repair['restore'])} restore hunk(s), {sum(len(h['was']) for h in repair['restore'])} bytes; named [{old_sha[:12]}]")

    for item_id in built_ids:
        rel = before[item_id]["file"]
        if after[item_id]["file"] != rel:
            raise SystemExit(f"STOP {item_id}: the row's file moved")
        old = (before_dir / rel).read_bytes()
        old_sha = sha(old)
        if before[item_id]["provenance"]["identity"] != {"kind": "file", "sha256": old_sha}:
            raise SystemExit(f"STOP {item_id}: the before build's file is not the before catalogue's identity")
        recorded = [e for e in table if e["file"] == rel and e["undated"] == old_sha]
        if not recorded:
            raise SystemExit(f"STOP {item_id}: E50a's table records no entry whose undated form is the old file")
        new_path = after_dir / rel
        new = new_path.read_bytes()
        new_sha = sha(new)
        if after[item_id]["provenance"]["identity"] != {"kind": "file", "sha256": new_sha}:
            raise SystemExit(f"STOP {item_id}: the after build's file is not the after catalogue's identity")
        old_entries, old_at = score_entry(old, undated=True)
        new_entries, new_at = score_entry(new, undated=True)
        if not same_outside_score(old_entries, old_at, new_entries, new_at):
            raise SystemExit(f"STOP {item_id}: the archives differ outside the score")
        restore = hunks(new_entries[new_at][1].decode("utf-8"), old_entries[old_at][1].decode("utf-8"))
        pair = [{"id": item_id, "file": rel, "change": CHANGE, "from": entry["sha256"], "date": entry["date"], "system": entry["system"],
                 "to": new_sha, "restore": restore, "tempoChanged": False} for entry in recorded]
        pair.append({"id": item_id, "file": rel, "change": CHANGE, "from": old_sha, "undated": True, "to": new_sha, "restore": restore,
                     "tempoChanged": False})
        expected = [entry["sha256"] for entry in recorded] + [old_sha]
        named = convert.former_identities(new_path, table, pair)
        if named != expected:
            raise SystemExit(f"STOP {item_id}: the relations do not re-prove as the build re-proves them ({named} against {expected})")
        relations += pair
        lines.append(f"[{after[item_id]['provenance'].get('source')}] {item_id}: to {new_sha}; from the undated {old_sha} (the before "
                     f"catalogue's identity, E50a's recorded undated form) and from the dated "
                     f"{', '.join(e['sha256'] + ' (' + e['date'] + ', system ' + str(e['system']) + ')' for e in recorded)}; "
                     f"{len(restore)} restore hunk(s), {sum(len(h['was']) for h in restore)} bytes; named {[s[:12] for s in named]}")

    cut_relations: list[dict] = []
    approvals = excerpts.read_definitions()["excerpts"]
    shutil.rmtree(TMP, ignore_errors=True)
    for eid in cut_ids:
        block = after[eid]["provenance"]["excerpt"]
        parent_id = block["of"]
        if parent_id not in by_parent:
            raise SystemExit(f"STOP {eid}: its parent {parent_id} is not one of E59's moved PDMX rows")
        repair = by_parent[parent_id]
        rows = [row for row in approvals if row["of"] == parent_id and int(row["fromBar"]) == block["fromBar"]
                and int(row["toBar"]) == block["toBar"] and (row.get("selection") or "both") == block["selection"]]
        if len(rows) != 1 or excerpts.excerpt_id(parent_id, block["fromBar"], block["toBar"], block["selection"]) != eid:
            raise SystemExit(f"STOP {eid}: not one approved row of excerpts.json")
        parent_path = W / "content" / repair["file"]
        if sha(parent_path.read_bytes()) != repair["to"] or block["parentSha256"] != repair["to"]:
            raise SystemExit(f"STOP {eid}: the cut's parent is not the repaired file")
        entries = convert._entries(parent_path.read_bytes())
        at = convert._score_at(entries, undated=True)
        old_parent = convert._redated(convert._restored(entries, at, repair["restore"]), at, repair["date"], repair["system"])
        at_base = subprocess.run(["git", "-C", str(W), "show", f"{base}:content/{repair['file']}"], capture_output=True, check=True).stdout
        if old_parent is None or sha(old_parent) != repair["from"] or old_parent != at_base:
            raise SystemExit(f"STOP {eid}: the old parent does not rebuild through its repair to the committed file at {base}")
        here = TMP / str(len(cut_relations))
        (here / "o").mkdir(parents=True)
        (here / "n").mkdir(parents=True)
        old_parent_path = here / "old-parent.mxl"
        old_parent_path.write_bytes(old_parent)
        old_made = excerpts.cut(old_parent_path, block["fromBar"], block["toBar"], block["selection"], eid, here / "o" / f"{eid}.mxl")
        new_made = excerpts.cut(parent_path, block["fromBar"], block["toBar"], block["selection"], eid, here / "n" / f"{eid}.mxl")
        old_cut = sha(convert.pinned_archive(entries_of(old_made.path), LAPTOP_SYSTEM))
        new_cut = sha(convert.pinned_archive(entries_of(new_made.path), LAPTOP_SYSTEM))
        before_cut = sha(convert.pinned_archive(entries_of(before_dir / before[eid]["file"]), LAPTOP_SYSTEM))
        after_cut_path = after_dir / after[eid]["file"]
        after_cut = sha(convert.pinned_archive(entries_of(after_cut_path), LAPTOP_SYSTEM))
        if old_cut != before_cut or before[eid]["provenance"]["identity"]["sha256"] != sha((before_dir / before[eid]["file"]).read_bytes()):
            raise SystemExit(f"STOP {eid}: the cutter over the old parent is not the before build's cut ({old_cut[:12]} against {before_cut[:12]})")
        if new_cut != after_cut:
            raise SystemExit(f"STOP {eid}: the cutter over the new parent is not the after build's cut")
        relation = {
            "id": eid,
            "file": (excerpts.SCORES_SUBDIR / f"{eid}.mxl").as_posix(),
            "change": (f"E59 (Entry 184): the approved cut of {parent_id}, printed bars {block['fromBar']}-{block['toBar']}, "
                       f"{block['selection']} hands, re-cut from the moved parent: the same bars and staves, differing from the old cut "
                       "only by the parent's change (the old cut printed the converter's quarter = 96 beside its sound)"),
            "of": parent_id,
            "fromBar": block["fromBar"],
            "toBar": block["toBar"],
            "selection": block["selection"],
            "cutVersion": excerpts.CUT_VERSION,
            "parentFrom": repair["from"],
            "parentTo": repair["to"],
            "from": old_cut,
            "system": LAPTOP_SYSTEM,
            "to": new_cut,
            "tempoChanged": False,
        }
        named = excerpts.former_cut_identities(after_cut_path, eid, block, parent_path, [relation], relations, table)
        if named != [old_cut]:
            raise SystemExit(f"STOP {eid}: the relation does not re-prove as the build re-proves it ({named})")
        same = [(m.bars, m.staves, m.notes, m.time, m.tempo_bpm) for m in (old_made, new_made)]
        if same[0] != same[1]:
            raise SystemExit(f"STOP {eid}: the two cuts are not the same bars, staves, notes, time and tempo ({same})")
        cut_relations.append(relation)
        lines.append(f"[excerpt] {eid}: from the old cut {old_cut} (the cutter over the old parent = the before build's cut, zipped "
                     f"under system {LAPTOP_SYSTEM}) to {new_cut} (= the after build's); parent {repair['from'][:12]} -> {repair['to'][:12]}; "
                     f"the same bars, staves, notes, time and tempo {same[0]}; named [{old_cut[:12]}]")
    shutil.rmtree(TMP, ignore_errors=True)

    added, added_cuts = splice(relations, cut_relations)
    parsed = json.loads(OUT.read_text(encoding="utf-8"))
    e59 = [one for one in parsed["repairs"] if one["change"].startswith("E59 ")]
    lines.append(f"{OUT.relative_to(W).as_posix()}: {added} repair relation(s) and {added_cuts} cut relation(s) added this run, "
                 f"{len(relations) - added} and {len(cut_relations) - added_cuts} already present; {len(parsed['repairs'])} repairs "
                 f"({len(e59)} E59's) and {len(parsed.get('cuts', []))} cut(s) in the file, {len(OUT.read_bytes())} bytes")
    # The run that adds the relations keeps its log; a rerun that adds nothing logs beside it, proving it idempotent.
    (LOG if added or added_cuts else LOG.with_name("repaired-identities-rerun.txt")).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[:1] + lines[-1:]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
