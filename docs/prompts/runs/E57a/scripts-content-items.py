"""
E57a (Entry 195): E57's scripts-content-items.py, copied; only its folders changed (it reads build/e57a/pdmx/reconvert.json
and E57a's copy of the reconvert, and writes runs/E57a/content-items.txt and runs/E57a/content-section.md), so E57's
evidence under runs/E57 is never written. Run on E57a's before and after builds, its moved files are E57a's. One more
change: its output says "printed" where E57's said "drawn" (no learner surface draws a metronome mark: every learner
notation host passes `drawMetronomeMarks: false`, the second read's item 1, docs/review/second-reads/d04fc073.md), and
"sound-only" where E57's said "heard only".

E57's docstring, unchanged below. E57's content itemisation (operating-procedure §12), generated: one item per moved file — where, what, before, after,
why — from the files and the app's reading of them, never by hand.

    python scripts-content-items.py <before content dir> <after content dir> <before reader dump> <after reader dump>

Per row whose built file changed between the two builds (the committed PDMX files E57 re-converted or transplanted, and
the files the build converts): the tempo events the app's reader plays before and after (scripts-reader.table.ts's
dumps: bar ordinal:offset in quarters, quarter notes a minute); the tempo directions the file writes before and after,
by kind — a printed mark (`<metronome>`, drawn on the page), a sound only (`<sound tempo>` beside empty words: heard,
not drawn), a mark with no readable tempo (empty words: neither), counted as the new file's directions of each kind less
the old file's (so a sound-only copy that gave way to its printed mark shows as one drawn and minus one heard only); the identity relation (runs/E57/repaired-identities.txt);
and what else moved (a PDMX row's `convertedSha256`; a kern row's catalogue `provenance.edition` and `source.checksum`,
which carry the file's checksum). Outputs: runs/E57/content-items.txt (every event of every row) and
runs/E57/content-section.md (the entry's `## Content` list: one line per file, long event lists cut with a count).
"""
from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import re
import sys
import zipfile
from pathlib import Path

W = Path(__file__).resolve().parents[4]
RUNS = W / "docs" / "prompts" / "runs" / "E57a"
spec = importlib.util.spec_from_file_location("reconvert", RUNS / "scripts-pdmx-reconvert.py")
reconvert = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
spec.loader.exec_module(reconvert)  # type: ignore[union-attr]


def rows(content: Path) -> dict[str, dict]:
    raw = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
    return {item["id"]: item for item in (raw["items"] if isinstance(raw, dict) else raw)}


def text_of(path: Path) -> str:
    with zipfile.ZipFile(io.BytesIO(path.read_bytes())) as archive:
        names = [n for n in archive.namelist() if n.lower().endswith((".xml", ".musicxml")) and not n.upper().startswith("META-INF/")]
        return archive.read(names[0]).decode("utf-8")


def kinds(directions: list[str]) -> dict[str, int]:
    out = {"printed": 0, "sound": 0, "none": 0}
    for one in directions:
        body = one.split(":", 1)[1]
        out["printed" if "=" in body.split("/", 1)[0] else "sound" if "sound" in body else "none"] += 1
    return out


def events_text(events: list[dict], limit: int | None = None) -> str:
    shown = events if limit is None else events[:limit]
    body = ", ".join(f"{e['at']} {e['bpm']:g}" for e in shown)
    return body + (f", … {len(events) - len(shown)} more" if limit is not None and len(events) > limit else "")


def main(argv: list[str]) -> int:
    before_dir, after_dir = Path(argv[0]), Path(argv[1])
    dumps = {}
    for which, path in (("before", Path(argv[2])), ("after", Path(argv[3]))):
        dumps[which] = {json.loads(l)["id"]: json.loads(l)["events"] for l in path.read_text(encoding="utf-8").splitlines() if l.strip()}
    before, after = rows(before_dir), rows(after_dir)
    pdmx = {r["id"]: r for r in json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]}
    data = json.loads((W / "build/e57a/pdmx/reconvert.json").read_text(encoding="utf-8"))
    relations = json.loads((W / "tools/content/repaired_identities.json").read_text(encoding="utf-8"))["repairs"]
    moved = []
    for item_id in sorted(set(before) & set(after)):
        a, b = before[item_id], after[item_id]
        if not a.get("file") or not b.get("file"):
            continue
        old_bytes, new_bytes = (before_dir / a["file"]).read_bytes(), (after_dir / b["file"]).read_bytes()
        if old_bytes != new_bytes:
            moved.append(item_id)
    detail: list[str] = [f"E57a content items: {len(moved)} moved file(s), read from the two builds and the app's reader", ""]
    section: list[str] = []
    totals = {"printed": 0, "sound": 0, "none": 0}
    for item_id in moved:
        a, b = before[item_id], after[item_id]
        source = (a.get("provenance") or {}).get("source")
        old_text, new_text = text_of(before_dir / a["file"]), text_of(after_dir / b["file"])
        was, now = reconvert.tempo_directions(old_text), reconvert.tempo_directions(new_text)
        k_was, k_now = kinds(was), kinds(now)
        added = {key: k_now[key] - k_was[key] for key in k_now}
        for key in totals:
            totals[key] += added[key]
        ev_was, ev_now = dumps["before"].get(item_id, []), dumps["after"].get(item_id, [])
        mine = [r for r in relations if r["id"] == item_id and r["change"].startswith("E57 ")]
        froms = ", ".join(f"{r['from'][:12]}…{' (undated)' if r.get('undated') else ' (' + r['date'] + ', system ' + str(r['system']) + ')'}" for r in mine)
        to = mine[0]["to"][:12] + "…" if mine else "none"
        if source == "pdmx":
            row = pdmx[item_id]
            where = f"`content/scores/pdmx/{row['cid']}.mxl` and `content/sources/pdmx.json` row `{item_id}` (`convertedSha256`)"
            entry = data.get(item_id, {})
            how = ("re-converted from the raw upload" if entry.get("mode") == "re-converted" else
                   f"the committed file with E57's change put in (its {entry.get('driftLines')} lines of older conversion or reviewed repair kept)")
            extra = (" The writer also splits a hidden whole-bar rest into hidden eighths at the kept marks' offsets (no sound, no ink)."
                     if entry.get("e57OutsideTempo") else "")
        else:
            where = f"the built `app/public/content/{a['file']}` (the build converts it; catalogue row `{item_id}`: `provenance.edition` and `source.checksum` carry its checksum)"
            how = "converted by the build from its kern source"
            extra = ""
        what = (f"{len(now) - len(was)} tempo direction(s) the source states after its first now kept: {added['printed']} printed "
                f"metronome mark(s) (in the file, read by the tempo reader; drawn by no learner surface), {added['sound']} sound-only "
                f"(heard), {added['none']} with no readable tempo (empty words)")
        why = (f"normalise removed every metronome mark after the first it found, wherever it stood; now only a copy of one "
               f"statement at one position goes. Identity {froms} → {to}, reviewed repair, tempoChanged")
        title = a.get("title") or item_id
        if source == "pdmx":
            short_where = f"`scores/pdmx/{pdmx[item_id]['cid']}.mxl` + its `pdmx.json` `convertedSha256`"
            short_how = "re-converted" if data.get(item_id, {}).get("mode") == "re-converted" else f"transplanted ({data.get(item_id, {}).get('driftLines')} drift lines kept as committed)"
        else:
            short_where = f"built `{a['file']}` + its catalogue `edition`/`source.checksum`"
            short_how = "built from kern"
        rest = " Also a hidden whole-bar rest written as hidden eighths (no sound, no ink)." if extra else ""
        section.append(f"- **{title}** (`{item_id}`) — {short_where}; {short_how}. Added: {added['printed']} printed, {added['sound']} sound-only."
                       f"{rest} Before: [{events_text(ev_was, 4)}]. After ({len(ev_now)}): [{events_text(ev_now, 6)}]. "
                       f"Identity {froms} → {to}.")
        detail += [f"== {item_id} ({title}) [{source}]", f"   where: {where}; {how}", f"   what: {what}.{extra}",
                   f"   tempo directions before ({len(was)}): {was}", f"   tempo directions after ({len(now)}): {now}",
                   f"   the app's reader before ({len(ev_was)}): {events_text(ev_was)}", f"   the app's reader after ({len(ev_now)}): {events_text(ev_now)}",
                   f"   why: {why}", ""]
    summary = (f"{len(moved)} files; tempo directions added: {totals['printed']} printed metronome marks (drawn by no learner surface), "
               f"{totals['sound']} sound-only (heard), {totals['none']} with no readable tempo")
    detail.insert(1, summary)
    (RUNS / "content-items.txt").write_text("\n".join(detail) + "\n", encoding="utf-8")
    (RUNS / "content-section.md").write_text("\n".join(section) + "\n", encoding="utf-8")
    print(summary)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
