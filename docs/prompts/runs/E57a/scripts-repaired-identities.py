"""
E57a (Entry 195): E57's scripts-repaired-identities.py, copied and limited to the three PDMX rows E57 held (the
reviewer's required change, docs/review/responses/ca8508ed.md §1: "The three added identities receive the same
reviewed-repair learner-continuity treatment as the other E57 PDMX rows"). Its changes, and nothing else: the rows are
those build/e57a/pdmx/reconvert.json holds (E57a's three, none held) and only the "committed PDMX file" branch runs
(each of the three is that case, an E50a entry dated 2026-09-06, system 0); the kern branch is not run, since the three
kern rows' six relations are already in the file and none of E57a's rows is one, so no content build is read; the
relation is E57's own (`CHANGE` unchanged: the converter fix that moves these identities is E57's); the log is
runs/E57a/repaired-identities.txt; and the file's comment gains one sentence naming this script and the rerun order
(`E57A_COMMENT_ADDITION`), since a rerun of E50's, E50b's and E57's generators alone would leave these three out.

    python scripts-repaired-identities.py --record <base sha>

E57's docstring, unchanged below (its usage line is E57's).

E57 (Entry 183) item 4: every identity E57 moves related to the file that replaces it in
`tools/content/repaired_identities.json`, under E50's reviewed-repair relation, for learner continuity only. Never
edited by hand; spliced into the file as text, never rewriting it (E50's and E50b's relations and `cuts` stay byte for
byte; E58 records the generators' order hazard).

    python scripts-repaired-identities.py --record <base sha> <before content dir> <after content dir>

- **A committed PDMX file** (every row runs/E57/pdmx-reconvert.txt checks and copies; not a row it holds as committed): the old file is the committed file at
  <base sha> (`git show`, read only), which every catalogue since D4 served; it must re-prove as E50a's entry for the
  file (`convert.dated_form` equal to the recorded date, system, sha256 and undated form). The new file is the
  committed file now, whose sha256 is the row's `convertedSha256`. One relation: `from` the old file, its date and
  creating system, `to` the new file.
- **A file the build converts** (every row runs/E57/build-diff-first.txt lists as changed): the old file is the
  before build's (`<before content dir>`), undated since E50a, whose sha256 must be the before catalogue's identity for
  the row and the `undated` form E50a's table recorded for an entry of the file; the new file is the after build's.
  Two relations, each with the same restore lines: the dated file E50a recorded (`from`, date, system, as above) and
  the undated old file (`from`, marked `undated`, no date or system; `convert.former_identities`' E57 clause).
Each relation: `restore` the line hunks that turn the new score's text into the old undated text, each widened by
context until it occurs once (E50's `hunks`); `tempoChanged` true (a run of the old file measured its percentage
against a tempo map the repair changed: E50b's guard reads it); `change` naming E57. Each is re-proved exactly as the
build re-proves it (`convert.former_identities` with the committed table and these relations alone): it must name the
old identities and nothing else. A row that fails any step stops the run and nothing is written. Idempotent: a
relation already in the file (same `id`, `from` and `to`) is not added twice, and a rerun that adds nothing leaves the
file's bytes as they are. Output: runs/E57/repaired-identities.txt.
"""
from __future__ import annotations

import difflib
import hashlib
import json
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
import convert  # noqa: E402

OUT = convert.REPAIRED_IDENTITIES_FILE
LOG = W / "docs" / "prompts" / "runs" / "E57a" / "repaired-identities.txt"
CHANGE = ("E57 (Entry 183): a later tempo mark kept; the converter removed every metronome mark after the first it found, "
          "wherever it stood, and now removes only a copy of one statement at one position, so the old file played its "
          "first tempo where the source states another")
COMMENT_ADDITION = (
    " E57 (Entry 183): the repairs whose change names E57 are spliced in by docs/prompts/runs/E57/scripts-repaired-identities.py, "
    "which never rewrites the file; E50's generator rewrites it whole and would drop them with E50b's cuts, so a rerun of "
    "E50's is followed by E50b's and then E57's. A repair of a file the build converts carries a second relation, marked "
    "undated and holding no date or system: its from is the undated form E50a's table recorded for the file, the "
    "identity every catalogue since E50a served, re-proved by the restore lines alone (convert.former_identities)."
)
E57A_COMMENT_ADDITION = (
    " E57a (Entry 195; the reviewer's required change, docs/review/responses/ca8508ed.md): three more repairs whose change "
    "names E57, the PDMX rows E57 held for their lessons (Grieg's In the Hall of the Mountain King, Apex of the World, "
    "Piano Man), are spliced in by docs/prompts/runs/E57a/scripts-repaired-identities.py, which never rewrites the file; "
    "a rerun of E50's generator is followed by E50b's, E57's and then E57a's."
)


def score_entry(raw: bytes, undated: bool) -> tuple[list[tuple[str, bytes]], int]:
    entries = convert._entries(raw)
    at = None if entries is None else convert._score_at(entries, undated=undated)
    if entries is None or at is None:
        raise SystemExit("not a music21 score in the converter's layout")
    return entries, at


def hunks(now: str, was: str) -> list[dict]:
    """
    Line hunks turning `now` into `was`, applied in order (`convert._restored`), each widened by context lines until its
    `now` occurs once in the text as it stands when it is applied: the earlier hunks already put back, so its left context
    is the old text's and its right context the new text's. E50's `hunks` measured uniqueness in `now` alone, which holds
    only where no two hunks' contexts meet; E57's marks stand close together (a ritardando written as a mark a beat).
    """
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


def main(argv: list[str]) -> int:
    if len(argv) != 2 or argv[0] != "--record":
        print(__doc__)
        return 2
    base = argv[1]
    table = json.loads(convert.FORMER_IDENTITIES_FILE.read_text(encoding="utf-8"))["identities"]
    items = {row["id"]: row for row in json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]}
    reconvert = json.loads((W / "build/e57a/pdmx/reconvert.json").read_text(encoding="utf-8"))
    pdmx_ids = [item_id for item_id, entry in reconvert.items() if not entry.get("held")]
    # E57a: no build-converted file is E57a's (the three kern rows' relations are E57's, already in the file).
    built_ids: list[str] = []
    before_dir = after_dir = Path()
    before: dict[str, dict] = {}
    after: dict[str, dict] = {}
    lines = [f"base {base}; {len(pdmx_ids)} committed PDMX file(s) (runs/E57a/pdmx-reconvert.txt), "
             f"{len(built_ids)} build-converted file(s) (none is E57a's)"]
    relations: list[dict] = []

    for item_id in pdmx_ids:
        row = items[item_id]
        rel = f"scores/pdmx/{row['cid']}.mxl"
        old = subprocess.run(["git", "-C", str(W), "show", f"{base}:content/{rel}"], capture_output=True, check=True).stdout
        old_sha = hashlib.sha256(old).hexdigest()
        proved = convert.dated_form(old)
        recorded = [e for e in table if e["file"] == rel and e["sha256"] == old_sha]
        if proved is None or len(recorded) != 1 or {k: recorded[0][k] for k in ("date", "system", "sha256", "undated")} != proved:
            raise SystemExit(f"STOP {item_id}: the old file does not re-prove as E50a's entry ({proved} against {recorded})")
        new_path = W / "content" / rel
        new = new_path.read_bytes()
        new_sha = hashlib.sha256(new).hexdigest()
        if new_sha != row["convertedSha256"]:
            raise SystemExit(f"STOP {item_id}: the committed file is not the row's convertedSha256")
        old_entries, old_at = score_entry(old, undated=False)
        new_entries, new_at = score_entry(new, undated=True)
        if not same_outside_score(old_entries, old_at, new_entries, new_at):
            raise SystemExit(f"STOP {item_id}: the archives differ outside the score")
        was = convert.without_encoding_date(old_entries[old_at][1].decode("utf-8"))
        now = new_entries[new_at][1].decode("utf-8")
        repair = {"id": item_id, "file": rel, "change": CHANGE, "from": old_sha, "date": proved["date"], "system": proved["system"],
                  "to": new_sha, "restore": hunks(now, was), "tempoChanged": True}
        named = convert.former_identities(new_path, table, [repair])
        if named != [old_sha]:
            raise SystemExit(f"STOP {item_id}: the relation does not re-prove as the build re-proves it ({named})")
        relations.append(repair)
        lines.append(f"{item_id}: from {old_sha} ({proved['date']}, system {proved['system']}; E50a's entry re-proved) to {new_sha}; "
                     f"{len(repair['restore'])} restore hunk(s), {sum(len(h['was']) for h in repair['restore'])} bytes; named [{old_sha[:12]}]")

    for item_id in built_ids:
        rel = before[item_id]["file"]
        if after[item_id]["file"] != rel:
            raise SystemExit(f"STOP {item_id}: the row's file moved")
        old = (before_dir / rel).read_bytes()
        old_sha = hashlib.sha256(old).hexdigest()
        if before[item_id]["provenance"]["identity"] != {"kind": "file", "sha256": old_sha}:
            raise SystemExit(f"STOP {item_id}: the before build's file is not the before catalogue's identity")
        recorded = [e for e in table if e["file"] == rel and e["undated"] == old_sha]
        if not recorded:
            raise SystemExit(f"STOP {item_id}: E50a's table records no entry whose undated form is the old file")
        new_path = after_dir / rel
        new = new_path.read_bytes()
        new_sha = hashlib.sha256(new).hexdigest()
        if after[item_id]["provenance"]["identity"] != {"kind": "file", "sha256": new_sha}:
            raise SystemExit(f"STOP {item_id}: the after build's file is not the after catalogue's identity")
        old_entries, old_at = score_entry(old, undated=True)
        new_entries, new_at = score_entry(new, undated=True)
        if not same_outside_score(old_entries, old_at, new_entries, new_at):
            raise SystemExit(f"STOP {item_id}: the archives differ outside the score")
        restore = hunks(new_entries[new_at][1].decode("utf-8"), old_entries[old_at][1].decode("utf-8"))
        pair = [{"id": item_id, "file": rel, "change": CHANGE, "from": entry["sha256"], "date": entry["date"], "system": entry["system"],
                 "to": new_sha, "restore": restore, "tempoChanged": True} for entry in recorded]
        pair.append({"id": item_id, "file": rel, "change": CHANGE, "from": old_sha, "undated": True, "to": new_sha, "restore": restore,
                     "tempoChanged": True})
        expected = [entry["sha256"] for entry in recorded] + [old_sha]
        named = convert.former_identities(new_path, table, pair)
        if named != expected:
            raise SystemExit(f"STOP {item_id}: the relations do not re-prove as the build re-proves them ({named} against {expected})")
        relations += pair
        lines.append(f"{item_id}: to {new_sha}; from the undated {old_sha} (the before catalogue's identity, E50a's recorded undated form) and "
                     f"from the dated {', '.join(e['sha256'] + ' (' + e['date'] + ', system ' + str(e['system']) + ')' for e in recorded)}; "
                     f"{len(restore)} restore hunk(s), {sum(len(h['was']) for h in restore)} bytes; named {[s[:12] for s in named]}")

    text = OUT.read_text(encoding="utf-8")
    present = {(one["id"], one["from"], one["to"]) for one in json.loads(text)["repairs"]}
    fresh = [one for one in relations if (one["id"], one["from"], one["to"]) not in present]
    if json.dumps(COMMENT_ADDITION, ensure_ascii=False)[1:-1].strip() not in text:
        raise SystemExit("STOP: E57's comment sentence is not in the file; E57's generator runs before E57a's")
    if fresh or E57A_COMMENT_ADDITION.strip() not in text:
        head, sep, rest = text.partition('",\n  "repairs": [\n')
        if not sep:
            raise SystemExit("STOP: the file's layout is not the generators' (no _comment then repairs)")
        if E57A_COMMENT_ADDITION.strip() not in head:
            head += json.dumps(E57A_COMMENT_ADDITION, ensure_ascii=False)[1:-1]
        body, sep2, tail = rest.partition("\n  ],\n")
        if not sep2:
            raise SystemExit("STOP: the file's layout is not the generators' (no end of repairs)")
        body += "".join(",\n    " + json.dumps(one, ensure_ascii=False) for one in fresh)
        text = head + sep + body + sep2 + tail
        json.loads(text)
        OUT.write_text(text, encoding="utf-8", newline="\n")
    parsed = json.loads(OUT.read_text(encoding="utf-8"))
    lines.append(f"{OUT.relative_to(W).as_posix()}: {len(fresh)} relation(s) added this run, {len(relations) - len(fresh)} already present; "
                 f"{len(parsed['repairs'])} repairs and {len(parsed.get('cuts', []))} cut(s) in the file, {len(OUT.read_bytes())} bytes")
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[:1] + lines[-1:]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
