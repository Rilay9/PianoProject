"""
E50 item 5 (ii)–(v): the seven raw uploads (build/e50/raw, from scripts-raw.py) converted twice, compared with the
committed files, gated as the quarry gates, and written to build/e50/new/ for item 5's copy.

    python scripts-reconvert.py <base sha>

(ii) The baseline: each raw file converted by the committed converter at <base sha> (its `convert.py`,
     `abc_tools.py` and `common.py` taken with `git show` into build/e50/base-tools/ and run in a subprocess with
     that folder first on the path; `convert_file(raw, dest)`, as quarry.py does). Its inner XML must equal the
     committed file's inner XML with the date removed by E50a's own function (`convert.without_encoding_date`):
     on six byte for byte, on *Weary Blues* but for Entry 34's hunk (ba9adb6f, runs/E50/weary-repair.txt).
(iii) The changed conversion, by the worktree's converter. *Weary Blues* gets Entry 34's repair re-applied (the
     one line ba9adb6f removed, matched with its context, exactly once), then is re-zipped through
     `convert.normalise_archive`, the path that applies E50a's text normalisers and pins the archive.
(iv) The proof: each new inner XML against the committed one with the date removed differs only in lines of the
     tempo direction(s) (`<direction>`, `<direction-type>`, `<words>`, `<metronome>`, `<beat-unit>`,
     `<per-minute>`, `<sound tempo>` and their closings); `bars` and `notes` equal the row's; `hands` and
     `singleLine` equal the row's by the structure gate's flag.
(v) The gates, as quarry.py runs them: `round_trip_ok` against the raw file, `structure_failure`, the truncation
     scan. Each must pass.
Output: runs/E50/reconvert.txt (with every differing line), build/e50/new/<cid>.mxl. Stops at nothing: every
fault is listed and the exit is 1 when there is any.
"""
from __future__ import annotations

import difflib
import hashlib
import io
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path

W = Path(__file__).resolve().parents[4]
E50 = W / "build" / "e50"
RAW, BASELINE, NEW, BASE_TOOLS = E50 / "raw", E50 / "baseline", E50 / "new", E50 / "base-tools"
LOG = W / "docs" / "prompts" / "runs" / "E50" / "reconvert.txt"
SEVEN = ["song.pop.margie.pdmx", "song.jazz.django-reinhardt-limehouse-blues.pdmx", "song.blues.singin-the-blues",
         "song.blues.weary-blues", "song.blues.storyville-blues", "song.blues.wabash-blues", "song.blues.tishomingo-blues"]
WEARY = "song.blues.weary-blues"
#: Entry 34's hunk (ba9adb6f): the backward repeat removed from ending 2's closing barline in bar 25.
WEARY_BEFORE = ('      <barline location="right">\n        <ending number="2" type="stop" />\n'
                '        <repeat direction="backward" />\n      </barline>\n    </measure>\n'
                '    <!--========================= Measure 26 =========================-->\n')
WEARY_AFTER = WEARY_BEFORE.replace('        <repeat direction="backward" />\n', "")
TEMPO_LINE = re.compile(r"^\s*(</?direction\b[^>]*>|</?direction-type>|<words\b.*</words>|</?metronome\b[^>]*>|"
                        r"<beat-unit>[^<]*</beat-unit>|<beat-unit-dot\s*/>|<per-minute>[^<]*</per-minute>|<sound tempo=\"[^\"]*\"\s*/>)\s*$")

BASELINE_CHILD = """
import sys, json
from pathlib import Path
sys.path.insert(0, sys.argv[1])
import convert
out = {}
for raw, dest in json.loads(sys.argv[2]):
    result = convert.convert_file(Path(raw), Path(dest))
    out[raw] = {"tempo_bpm": result.tempo_bpm, "added_tempo": result.added_tempo, "warnings": result.warnings}
print(json.dumps(out))
"""


def inner(raw: bytes) -> str:
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        names = [n for n in archive.namelist() if n.lower().endswith((".xml", ".musicxml")) and not n.upper().startswith("META-INF/")]
        return archive.read(names[0]).decode("utf-8")


def changed_lines(a: str, b: str) -> list[str]:
    return [line for line in difflib.unified_diff(a.splitlines(), b.splitlines(), lineterm="", n=0)
            if line[:1] in "+-" and not line.startswith(("+++", "---"))]


def main(argv: list[str]) -> int:
    base = argv[0]
    sys.path.insert(0, str(W / "tools" / "content"))
    import convert  # the worktree's
    from convert import parse_source
    from pdmx.quarry import round_trip_ok, structure_failure
    from truncation_scan import scan_file

    items = {row["id"]: row for row in json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]}
    for folder in (BASELINE, NEW, BASE_TOOLS):
        folder.mkdir(parents=True, exist_ok=True)
    for name in ("convert.py", "abc_tools.py", "common.py"):
        (BASE_TOOLS / name).write_bytes(subprocess.run(["git", "-C", str(W), "show", f"{base}:tools/content/{name}"],
                                                       capture_output=True, check=True).stdout)
    pairs = [[str(RAW / f"{items[i]['cid']}.mxl"), str(BASELINE / f"{items[i]['cid']}.mxl")] for i in SEVEN]
    child = subprocess.run([sys.executable, "-c", BASELINE_CHILD, str(BASE_TOOLS), json.dumps(pairs)], capture_output=True, text=True)
    if child.returncode != 0:
        print(child.stderr)
        return 1
    baseline_results = json.loads(child.stdout.strip().splitlines()[-1])

    lines = [f"base {base}; music21 converts each raw upload twice: the committed converter (baseline) and the worktree's", ""]
    faults: list[str] = []
    for item_id in SEVEN:
        row = items[item_id]
        cid = row["cid"]
        raw = RAW / f"{cid}.mxl"
        committed = (W / "content/scores/pdmx" / f"{cid}.mxl").read_bytes()
        committed_undated = convert.without_encoding_date(inner(committed))
        lines.append(f"== {item_id} ({cid})")
        lines.append(f"   committed file sha256 {hashlib.sha256(committed).hexdigest()} (row convertedSha256 {row['convertedSha256'][:12]}…), "
                     f"its date {re.search(r'<encoding-date>([^<]*)</encoding-date>', inner(committed)).group(1)}")
        # (ii) the baseline
        base_xml = inner((BASELINE / f"{cid}.mxl").read_bytes())
        base_diff = changed_lines(committed_undated, base_xml)
        expected = ['+        <repeat direction="backward" />'] if item_id == WEARY else []
        lines.append(f"   (ii) baseline (committed converter): tempo {baseline_results[str(raw)]['tempo_bpm']}, added {baseline_results[str(raw)]['added_tempo']}; "
                     f"against the committed XML with its date removed: {len(base_diff)} differing line(s) {base_diff}")
        if base_diff != expected:
            faults.append(f"{item_id}: the baseline differs from the committed file otherwise than expected: {base_diff}")
        # (iii) the changed conversion
        dest = NEW / f"{cid}.mxl"
        result = convert.convert_file(raw, dest)
        if item_id == WEARY:
            with zipfile.ZipFile(dest) as archive:
                entries = [(info.filename, archive.read(info.filename)) for info in archive.infolist()]
            at = next(i for i, (name, _) in enumerate(entries) if convert.is_text_entry(name))
            text = entries[at][1].decode("utf-8")
            if text.count(WEARY_BEFORE) != 1:
                faults.append(f"{item_id}: Entry 34's hunk is held {text.count(WEARY_BEFORE)} times in the new conversion")
            else:
                entries[at] = (entries[at][0], text.replace(WEARY_BEFORE, WEARY_AFTER, 1).encode("utf-8"))
                with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as archive:
                    for name, data in entries:
                        archive.writestr(name, data)
                convert.normalise_archive(dest)
                lines.append("   (iii) Entry 34's repair re-applied (the backward repeat on ending 2's closing barline, bar 25, removed), "
                             "re-zipped through normalise_archive")
        new_bytes = dest.read_bytes()
        new_xml = inner(new_bytes)
        lines.append(f"   (iii) changed conversion: tempo {result.tempo_bpm:g}, added {result.added_tempo}; warnings {result.warnings}")
        lines.append(f"         new file sha256 {hashlib.sha256(new_bytes).hexdigest()}, creating system {convert.archive_system(new_bytes)}, "
                     f"in the converter's layout {convert.pinned_archive(convert._entries(new_bytes)) == new_bytes}, date in it {'<encoding-date>' in new_xml}")
        # (iv) the proof
        diff = changed_lines(committed_undated, new_xml)
        outside = [line for line in diff if not TEMPO_LINE.match(line[1:])]
        lines.append(f"   (iv) against the committed XML with its date removed: {len(diff)} differing line(s), {len(outside)} outside the tempo direction(s)")
        lines += [f"         {line}" for line in diff]
        if outside:
            faults.append(f"{item_id}: {len(outside)} differing line(s) outside the tempo direction(s): {outside[:5]}")
        if (result.measures, result.notes) != (row["bars"], row["notes"]):
            faults.append(f"{item_id}: bars/notes {result.measures}/{result.notes} against the row's {row['bars']}/{row['notes']}")
        # (v) the gates
        raw_score, new_score = parse_source(raw), parse_source(dest)
        ok, why = round_trip_ok(raw_score, new_score)
        failure, flags = structure_failure(new_score, result)
        scan = scan_file(dest)
        hands = "right" if flags["single_line"] else "both"
        lines.append(f"   (iv) bars {result.measures} (row {row['bars']}), notes {result.notes} (row {row['notes']}), singleLine {flags['single_line']} "
                     f"(row {row['singleLine']}), hands {hands} (row {row['hands']}), tempo_defaulted {flags['tempo_defaulted']}")
        lines.append(f"   (v) round trip {'ok' if ok else 'FAILED: ' + why}; structure {'ok' if failure is None else 'FAILED: ' + failure}; "
                     f"truncation scan {len(scan.findings)} finding(s)")
        if not ok or failure is not None or scan.findings:
            faults.append(f"{item_id}: a quarry gate failed")
        if flags["single_line"] != row["singleLine"] or hands != row["hands"]:
            faults.append(f"{item_id}: singleLine/hands moved")
        if result.added_tempo or flags["tempo_defaulted"]:
            faults.append(f"{item_id}: still defaulted")
        lines.append("")
    lines.append(f"{len(faults)} fault(s)")
    lines += [f"   {fault}" for fault in faults]
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[-12:]))
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
