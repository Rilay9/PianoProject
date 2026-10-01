"""
E57a (Entry 195), step 3: E57's scripts-pdmx-reconvert.py, copied. Its changes, and nothing else: it reads E57a's count
(runs/E57a/pdmx-count.txt: the three rows E57 held, each CHANGED) and writes under build/e57a and runs/E57a, never E57's;
`HELD` is empty, since the reviewer's required change (docs/review/responses/ca8508ed.md §1) lands the three with their
lessons corrected; and `--copy` also refuses unless each new file's sha256 begins with the prefix E57 recorded for it
(`RECORDED`, runs/E57/pdmx-reconvert.txt), so a file that moved since E57's landing is never copied.

E57's docstring, unchanged below: every PDMX row whose conversion E57 changes (runs/E57/pdmx-count.txt), checked as E50
checked its seven before its copy (E50's scripts-reconvert.py, steps (ii)-(v)), from the two conversions
scripts-pdmx-count.py already wrote (build/e57/pdmx/base: the committed converter; build/e57/pdmx/new: E57's).

    python scripts-pdmx-reconvert.py --base <sha> [--copy] [--workers N]

(ii)  The baseline: is the committed converter's output today the committed file's score text with its date removed
      (E50a's `convert.without_encoding_date`), byte for byte? Where it is, the committed file is what the committed
      converter makes of the raw upload today, and the new file is E57's conversion (**re-converted**). Where it is
      not (the committed file carries an older converter's output or a reviewed hand repair made since), a
      re-conversion would carry changes that are not E57's, so the new file is the committed file's score text, date
      removed, with exactly E57's change put in (**transplanted**): each hunk between the committed converter's output
      and E57's (tempo directions only, (iv)), found by its context lines once in the committed text.
(iii) The new file is in the converter's layout (`pinned_archive` of the committed archive's entries or E57's), undated.
(iv)  The proof: with every tempo direction removed from both texts (a `<direction>` holding a `<metronome>`, a
      `<sound tempo>` or nothing but an empty `<words/>`, the form music21 writes for a mark with no readable tempo),
      the lines the new score text changes against the committed one are exactly the lines E57's conversion changes
      against the committed converter's (none, on every row but where music21's writer splits a hidden rest at a
      kept mark's offset, listed); and the tempo directions the new file adds to the committed one are, as a
      multiset of blocks, exactly those E57's conversion adds to the committed converter's.
(v)   The gates, as quarry.py runs them: `round_trip_ok` (against the raw upload for a re-converted file; against the
      committed file for a transplanted one, whose notes must be the committed file's), `structure_failure`, the
      truncation scan; `singleLine` and `hands` equal the row's. The features (`difficulty.features`, the committed
      code) of the committed file and of the new file are compared: what E57 moves; the committed file's against the
      row's stored features is recorded (a stored feature older code computed), not a fault of E57's.
With --copy and no fault, each new file is copied over `content/scores/pdmx/<cid>.mxl`, but for a row in `HELD`: a row
whose new file would make a lesson sentence false (runs/E57/lesson-scan.txt; E57 changes no lesson, by the ruling), kept
as committed, its new file checked like the rest and left in build/e57/pdmx/final for the landing that corrects the lesson.
The committed files and `pdmx.json` are read at <sha> (`git show`), so a rerun after the copy reads the same.
Output: runs/E57/pdmx-reconvert.txt, build/e57/pdmx/{committed,final}/<cid>.mxl, build/e57/pdmx/reconvert.json (the per-row
data the splice, the relation generator and the content itemiser read).
"""
from __future__ import annotations

import argparse
import difflib
import hashlib
import io
import json
import re
import shutil
import sys
import zipfile
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

W = Path(__file__).resolve().parents[4]
# E57a: the folder names below are E57a's (E57's were build/e57/pdmx and runs/E57); the name `E57` is kept for the diff.
E57 = W / "build" / "e57a" / "pdmx"
LOG = W / "docs" / "prompts" / "runs" / "E57a" / "pdmx-reconvert.txt"
COUNT = W / "docs" / "prompts" / "runs" / "E57a" / "pdmx-count.txt"
DATA = E57 / "reconvert.json"
TEMPO_DIRECTION = re.compile(r"[ \t]*<direction\b[^>]*>(?:(?!</direction>).)*?</direction>\n", re.S)
#: Rows kept as committed. E57 held three here (the lesson sentence each new file would make false); E57a empties it,
#: since the reviewer's required change lands the three and corrects rock.7 and chords-pop.9 instead
#: (docs/review/responses/ca8508ed.md §1).
HELD: dict[str, str] = {}
#: The new files' sha256 prefixes E57 recorded for the three (runs/E57/pdmx-reconvert.txt, its HELD lines): `--copy`
#: refuses unless each new file reproduces its prefix.
RECORDED = {"song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx": "f5d8fed0bb86",
            "song.pop.takeru-kanazaki-fire-emblem-three-houses-apex-of-the-world.pdmx": "d069d41ce874",
            "song.pop.billy-joel-rousseau-billy-joel-piano-man.pdmx": "e72561d66d7e"}


def is_tempo_direction(block: str) -> bool:
    if "<metronome" in block or "<sound tempo=" in block:
        return True
    inside = re.sub(r"\s+", "", re.sub(r"<direction\b[^>]*>|</direction>", "", block))
    return inside == "<direction-type><words/></direction-type>"


def without_tempo_directions(text: str) -> str:
    return TEMPO_DIRECTION.sub(lambda found: "" if is_tempo_direction(found.group(0)) else found.group(0), text)


def tempo_blocks(text: str) -> Counter:
    return Counter(re.sub(r"\s+", " ", found.group(0)).strip() for found in TEMPO_DIRECTION.finditer(text) if is_tempo_direction(found.group(0)))


def tempo_directions(text: str) -> list[str]:
    """Each tempo direction as `bar:unit=per-minute/sound N`, in the file's order."""
    out = []
    for number, body in re.findall(r'<measure\b[^>]*\bnumber="([^"]+)"[^>]*>(.*?)</measure>', text, re.S):
        for found in TEMPO_DIRECTION.finditer(body + "\n"):
            block = found.group(0)
            if not is_tempo_direction(block):
                continue
            unit = re.search(r"<beat-unit>([^<]*)</beat-unit>", block)
            dots = len(re.findall(r"<beat-unit-dot\s*/>", block))
            minute = re.search(r"<per-minute>([^<]*)</per-minute>", block)
            sound = re.search(r'<sound tempo="([^"]*)"', block)
            printed = f"{unit.group(1)}{'.' * dots}={minute.group(1)}" if unit and minute else ("words" if "<words" in block else "")
            out.append(f"{number}:{printed}{'/' if printed and sound else ''}{('sound ' + sound.group(1)) if sound else ''}")
    return out


def changed_lines(a: str, b: str) -> list[str]:
    return [line for line in difflib.unified_diff(a.splitlines(), b.splitlines(), lineterm="", n=0)
            if line[:1] in "+-" and not line.startswith(("+++", "---"))]


def inner_entries(raw: bytes) -> tuple[list[tuple[str, bytes]], int]:
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        entries = [(info.filename, archive.read(info.filename)) for info in archive.infolist()]
    at = next(i for i, (name, _) in enumerate(entries) if name.lower().endswith((".xml", ".musicxml")) and not name.upper().startswith("META-INF/"))
    return entries, at


def transplant(committed: str, base: str, new: str) -> tuple[str | None, str]:
    """`committed` with each hunk that turns `base` into `new` put in, found by its base context once in `committed`."""
    a, b = base.splitlines(keepends=True), new.splitlines(keepends=True)
    text = committed
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal":
            continue
        placed = False
        for context in range(1, 41):
            for left, right in ((context, context), (context, 0), (0, context)):
                lo, hi = max(0, i1 - left), min(len(a), i2 + right)
                if lo == i1 and hi == i2:
                    continue
                old = "".join(a[lo:hi])
                if text.count(old) == 1:
                    text = text.replace(old, "".join(a[lo:i1] + b[j1:j2] + a[i2:hi]), 1)
                    placed = True
                    break
            if placed:
                break
        if not placed:
            return None, f"a hunk at base line {i1 + 1} whose context is not once in the committed text"
    return text, ""


def gates(job: dict) -> dict:
    sys.path.insert(0, str(W / "tools" / "content"))
    import difficulty
    from convert import parse_source
    from pdmx.quarry import round_trip_ok, structure_failure
    from truncation_scan import scan_file

    row = job["row"]

    class Result:  # structure_failure reads these two
        added_tempo = bool(row["tempoDefaulted"])
        tempo_bpm = row["tempoBpm"]

    final = parse_source(Path(job["final"]))
    committed = parse_source(Path(job["committed"]))
    against = parse_source(Path(job["raw"])) if job["mode"] == "re-converted" else committed
    ok, why = round_trip_ok(against, final)
    failure, flags = structure_failure(final, Result())
    return {"id": row["id"], "roundTrip": "ok" if ok else why, "structure": failure, "singleLine": flags["single_line"],
            "truncation": len(scan_file(Path(job["final"])).findings),
            "featuresCommitted": difficulty.features(committed), "featuresNew": difficulty.features(final),
            "openingCommitted": difficulty.opening_quarter_bpm(committed), "openingNew": difficulty.opening_quarter_bpm(final)}


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True, help="the base sha: the committed files and pdmx.json are read there")
    parser.add_argument("--copy", action="store_true")
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args(argv)
    sys.path.insert(0, str(W / "tools" / "content"))
    import subprocess

    import convert

    def at_base(rel: str) -> bytes:
        return subprocess.run(["git", "-C", str(W), "show", f"{args.base}:{rel}"], capture_output=True, check=True).stdout

    items = {row["id"]: row for row in json.loads(at_base("content/sources/pdmx.json").decode("utf-8"))["items"]}
    (E57 / "committed").mkdir(parents=True, exist_ok=True)
    count = COUNT.read_text(encoding="utf-8")
    changed = [line.split(" ", 2)[1] for line in count.splitlines() if line.startswith("CHANGED ")]
    (E57 / "final").mkdir(parents=True, exist_ok=True)
    lines = [f"{len(changed)} changed rows (pdmx-count.txt), each checked (ii)-(v)", ""]
    faults: list[str] = []
    data: dict[str, dict] = {}
    jobs = []
    for item_id in changed:
        row = items[item_id]
        cid = row["cid"]
        committed_path = E57 / "committed" / f"{cid}.mxl"
        committed_path.write_bytes(at_base(f"content/scores/pdmx/{cid}.mxl"))
        committed = committed_path.read_bytes()
        entries, at = inner_entries(committed)
        committed_text = entries[at][1].decode("utf-8")
        undated = convert.without_encoding_date(committed_text)
        base_text = inner_entries((E57 / "base" / f"{cid}.mxl").read_bytes())
        base_text = base_text[0][base_text[1]][1].decode("utf-8")
        new_bytes = (E57 / "new" / f"{cid}.mxl").read_bytes()
        new_entries, new_at = inner_entries(new_bytes)
        new_text = new_entries[new_at][1].decode("utf-8")
        entry = {"id": item_id, "cid": cid, "committedSha256": hashlib.sha256(committed).hexdigest(), "convertedSha256": row["convertedSha256"],
                 "date": (re.search(r"<encoding-date>([^<]*)</encoding-date>", committed_text) or [None, None])[1],
                 "held": HELD.get(item_id)}
        if base_text == undated:
            entry["mode"] = "re-converted"
            final_bytes, final_text = new_bytes, new_text
        else:
            entry["mode"] = "transplanted"
            entry["driftLines"] = sum(1 for line in difflib.unified_diff(undated.splitlines(), base_text.splitlines(), lineterm="", n=0)
                                      if line[:1] in "+-" and not line.startswith(("+++", "---")))
            final_text, why = transplant(undated, base_text, new_text)
            if final_text is None:
                faults.append(f"{item_id}: (ii) transplant failed: {why}")
                data[item_id] = entry
                continue
            placed = list(entries)
            placed[at] = (entries[at][0], final_text.encode("utf-8"))
            final_bytes = convert.pinned_archive(placed)
        (E57 / "final" / f"{cid}.mxl").write_bytes(final_bytes)
        e57_outside = changed_lines(without_tempo_directions(base_text), without_tempo_directions(new_text))
        entry.update({"newSha256": hashlib.sha256(final_bytes).hexdigest(), "tempoBefore": tempo_directions(undated), "tempoAfter": tempo_directions(final_text),
                      "e57OutsideTempo": e57_outside,
                      "outsideTempo": changed_lines(without_tempo_directions(undated), without_tempo_directions(final_text)) != e57_outside,
                      "sameAdded": (tempo_blocks(final_text) - tempo_blocks(undated)) == (tempo_blocks(new_text) - tempo_blocks(base_text))
                      and (tempo_blocks(undated) - tempo_blocks(final_text)) == (tempo_blocks(base_text) - tempo_blocks(new_text)),
                      "layout": convert.pinned_archive(convert._entries(final_bytes)) == final_bytes and "<encoding-date>" not in final_text})
        if entry["committedSha256"] != row["convertedSha256"]:
            faults.append(f"{item_id}: the committed file is not the row's convertedSha256")
        if entry["outsideTempo"]:
            faults.append(f"{item_id}: (iv) outside the tempo directions the new file changes other lines than E57's conversion changes")
        if not entry["sameAdded"]:
            faults.append(f"{item_id}: (iv) the tempo directions added are not exactly E57's")
        if not entry["layout"]:
            faults.append(f"{item_id}: (iii) the new file is not in the converter's undated layout")
        data[item_id] = entry
        jobs.append({"row": row, "mode": entry["mode"], "raw": str(E57 / "raw" / f"{cid}.mxl"), "committed": str(committed_path),
                     "final": str(E57 / "final" / f"{cid}.mxl")})
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        for result in pool.map(gates, jobs):
            row = items[result["id"]]
            entry = data[result["id"]]
            entry.update(result)
            hands = "right" if result["singleLine"] else "both"
            if result["roundTrip"] != "ok" or result["structure"] is not None or result["truncation"]:
                faults.append(f"{row['id']}: (v) a quarry gate failed: {result['roundTrip']}, {result['structure']}, truncation {result['truncation']}")
            if result["singleLine"] != row["singleLine"] or hands != row["hands"]:
                faults.append(f"{row['id']}: (v) singleLine/hands moved")
            stored = row.get("features") or {}
            entry["featuresStoredDrift"] = sorted(k for k in set(result["featuresCommitted"]) | set(stored) if result["featuresCommitted"].get(k) != stored.get(k))
            entry["featuresMovedByE57"] = sorted(k for k in set(result["featuresNew"]) | set(result["featuresCommitted"])
                                                 if result["featuresNew"].get(k) != result["featuresCommitted"].get(k))
    modes = Counter(entry.get("mode") for entry in data.values())
    for item_id in changed:
        entry = data[item_id]
        lines.append(f"{item_id}: (ii) {entry.get('mode')}{' (' + str(entry.get('driftLines')) + ' lines of drift left as committed)' if entry.get('mode') == 'transplanted' else ''}; "
                     f"(iii) new {str(entry.get('newSha256'))[:12]}, undated layout {entry.get('layout')}; (iv) outside the tempo directions "
                     f"{'NOT only E57' if entry.get('outsideTempo') else 'only E57'}'s changes ({len(entry.get('e57OutsideTempo', []))} line(s) "
                     f"E57's conversion changes there), added exactly E57's {entry.get('sameAdded')}; tempo directions "
                     f"{len(entry.get('tempoBefore', []))} -> {len(entry.get('tempoAfter', []))}; (v) round trip {entry.get('roundTrip')}, "
                     f"structure {entry.get('structure') or 'ok'}, truncation {entry.get('truncation')}; opening tempo {entry.get('openingCommitted')} -> "
                     f"{entry.get('openingNew')}; features moved by E57 {entry.get('featuresMovedByE57')}; stored features older than the committed "
                     f"code {entry.get('featuresStoredDrift')}")
    for item_id in changed:  # E57a: the recorded prefixes are a gate before any copy
        if item_id not in RECORDED or not str(data[item_id].get("newSha256")).startswith(RECORDED[item_id]):
            faults.append(f"{item_id}: E57a: the new file {str(data[item_id].get('newSha256'))[:12]} is not the one E57 recorded "
                          f"({RECORDED.get(item_id)})")
    copied = kept = 0
    if args.copy and not faults:
        for item_id in changed:
            cid = data[item_id]["cid"]
            source = E57 / ("committed" if data[item_id].get("held") else "final") / f"{cid}.mxl"
            shutil.copyfile(source, W / "content/scores/pdmx" / f"{cid}.mxl")
            copied += not data[item_id].get("held")
            kept += bool(data[item_id].get("held"))
    lines += [f"HELD {item_id}: kept as committed, its new file {str(data[item_id].get('newSha256'))[:12]} checked and not copied: "
              f"{data[item_id]['held']}" for item_id in changed if data[item_id].get("held")]
    moved = [i for i, e in data.items() if e.get("featuresMovedByE57")]
    drift = [i for i, e in data.items() if e.get("featuresStoredDrift")]
    lines += [f"E57a: {item_id} new {str(data[item_id].get('newSha256'))[:12]} against E57's recorded {RECORDED.get(item_id)}: "
              f"{'reproduced' if str(data[item_id].get('newSha256')).startswith(str(RECORDED.get(item_id))) else 'NOT REPRODUCED'}"
              for item_id in changed]
    lines += ["", f"modes: {dict(modes)}; features moved by E57 on {len(moved)} row(s) {moved}; "
              f"stored features differing from the committed code on the committed file (not E57's) on {len(drift)} row(s)",
              f"{len(faults)} fault(s)"] + [f"   FAULT {fault}" for fault in faults]
    lines.append(f"copied over content/scores/pdmx/: {copied}; held rows written back as committed at the base: {kept}")
    DATA.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[-6:]))
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
