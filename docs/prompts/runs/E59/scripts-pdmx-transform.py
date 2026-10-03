"""
E59 items 3 and 4: the PDMX rows tagged `tempoDefaulted` move from their own committed bytes, by one mechanical text
transform, not by hand and not by re-running the quarry. The converter's default wrote a printed quarter = 96 beside its
`<sound tempo="96">`; the fixed converter writes the sound alone (music21's `numberSounding`, an empty `<words />` where
the `<metronome>` stood). The transform replaces exactly the four metronome lines of the inserted direction with that
`<words />` line, keeps the optional `<staff>N</staff>` and the `<sound tempo="96" />` as they are, removes the date
music21 wrote (E50a: the converter writes no date since), and zips the archive as the converter zips now
(`convert.pinned_archive`). Everything else in the file stays byte for byte.

    python scripts-pdmx-transform.py --check [<base sha>]    read only: the shapes, the counts, the overlaps
    python scripts-pdmx-transform.py --apply <base sha>      write the moved files and splice pdmx.json

`--check` reads every committed row: the `tempoDefaulted` count, each defaulted file's one `<metronome>` and the shape of
its inserted direction (one of the two the brief names, or the row stops), that the file is a dated music21 file in the
converter's layout re-proving as E50a's recorded entry (the relation's `from`), and that no defaulted row is one E57
moved or E57a holds. `--apply` reads each row's old file at <base sha> (`git show`, read only), writes its new bytes where
the committed file is still the old one (a file already moved is said, a file that is neither stops the run), then splices
the rows' `convertedSha256` in `content/sources/pdmx.json` as text (the round trip compared first; nothing but that field
on those rows moves). Idempotent. Output: runs/E59/pdmx-shapes.txt (--check), runs/E59/pdmx-transform.txt (--apply).
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
import convert  # noqa: E402

TABLE = W / "content" / "sources" / "pdmx.json"
RUNS = W / "docs" / "prompts" / "runs" / "E59"
#: E57a's three held rows (`tasks/E57a-…`), landing concurrently: E59 never touches them.
E57A_HELD = {"song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx",
             "song.pop.takeru-kanazaki-fire-emblem-three-houses-apex-of-the-world.pdmx",
             "song.pop.billy-joel-rousseau-billy-joel-piano-man.pdmx"}

#: The direction the default inserted (`insert_tempo(staves[0], float(DEFAULT_TEMPO_BPM))`, as music21 10.5 writes it):
#: the brief's two shapes, the optional `<staff>` music21 adds on a grand staff.
OLD_SHAPE = re.compile(
    r'(?P<i>[ ]*)<direction>\n(?P=i)  <direction-type>\n(?P=i)    <metronome parentheses="no">\n'
    r'(?P=i)      <beat-unit>quarter</beat-unit>\n(?P=i)      <per-minute>96</per-minute>\n(?P=i)    </metronome>\n'
    r'(?P=i)  </direction-type>\n(?:(?P=i)  <staff>(?P<staff>\d+)</staff>\n)?(?P=i)  <sound tempo="96" />\n(?P=i)</direction>\n'
)


def new_block(indent: str, staff: str | None) -> str:
    """The same direction as the fixed converter writes it (`MetronomeMark(numberSounding=96)`)."""
    return (f"{indent}<direction>\n{indent}  <direction-type>\n{indent}    <words />\n{indent}  </direction-type>\n"
            + (f"{indent}  <staff>{staff}</staff>\n" if staff else "") + f'{indent}  <sound tempo="96" />\n{indent}</direction>\n')


def transform_text(text: str) -> tuple[str, str]:
    """The score text with the inserted metronome lines replaced, and the shape found ("one staff" or "staff N")."""
    if text.count("<metronome") != 1:
        raise ValueError(f"{text.count('<metronome')} <metronome> elements, not one")
    found = list(OLD_SHAPE.finditer(text))
    if len(found) != 1:
        raise ValueError(f"{len(found)} directions of the inserted shape, not one")
    match = found[0]
    if not match.start() < text.index("<metronome") < match.end():
        raise ValueError("the one <metronome> is not the inserted direction's")
    staff = match.group("staff")
    return (text[:match.start()] + new_block(match.group("i"), staff) + text[match.end():],
            f"staff {staff}" if staff else "one staff")


def transform_file(old: bytes) -> tuple[bytes, str]:
    """A committed dated defaulted file's new bytes: the transform, the date removed, zipped as the converter zips."""
    entries = convert._entries(old)
    at = None if entries is None else convert._score_at(entries, undated=False)
    if entries is None or at is None:
        raise ValueError("not a dated music21 score in the converter's layout")
    undated = convert.without_encoding_date(entries[at][1].decode("utf-8"))
    text, shape = transform_text(undated)
    if convert.normalised_text(text) != text:
        raise ValueError("the converter's text pass would change more than the transform")
    moved = list(entries)
    moved[at] = (entries[at][0], text.encode("utf-8"))
    return convert.pinned_archive(moved), shape


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def rows() -> list[dict]:
    return json.loads(TABLE.read_text(encoding="utf-8"))["items"]


def check(base: str | None) -> int:
    items = rows()
    table = json.loads(convert.FORMER_IDENTITIES_FILE.read_text(encoding="utf-8"))["identities"]
    repairs = json.loads(convert.REPAIRED_IDENTITIES_FILE.read_text(encoding="utf-8"))["repairs"]
    repaired = {one["id"] for one in repairs}
    defaulted = [row for row in items if row.get("tempoDefaulted") is True]
    lines = [f"content/sources/pdmx.json: {len(items)} rows, {len(defaulted)} tagged tempoDefaulted: true"
             + (f" (files read at the worktree, base {base})" if base else "")]
    shapes: dict[str, int] = {}
    faults: list[str] = []
    for row in defaulted:
        rel = f"scores/pdmx/{row['cid']}.mxl"
        raw = (W / "content" / rel).read_bytes()
        try:
            if sha(raw) != row["convertedSha256"]:
                raise ValueError("the committed file is not the row's convertedSha256")
            new, shape = transform_file(raw)
            proved = convert.dated_form(raw)
            recorded = [e for e in table if e["file"] == rel and e["sha256"] == sha(raw)]
            if proved is None or len(recorded) != 1 or {k: recorded[0][k] for k in ("date", "system", "sha256", "undated")} != proved:
                raise ValueError(f"the committed file does not re-prove as E50a's entry ({proved} against {recorded})")
            if row["id"] in repaired:
                raise ValueError("a reviewed repair already names this row")
            if row["id"] in E57A_HELD:
                raise ValueError("one of E57a's three held rows")
        except ValueError as error:
            faults.append(f"{row['id']}: {error}")
            continue
        shapes[shape] = shapes.get(shape, 0) + 1
        lines.append(f"{row['id']} ({row['cid']}): {shape}; dated {proved['date']}, system {proved['system']}, E50a's entry "
                     f"re-proved; {sha(raw)[:12]} -> {sha(new)[:12]}")
    others = [row for row in items if row.get("tempoDefaulted") is not True]
    printed96 = []
    for row in others:
        raw = (W / "content" / f"scores/pdmx/{row['cid']}.mxl").read_bytes()
        entries = convert._entries(raw) or []
        text = "".join(data.decode("utf-8") for name, data in entries if convert.is_text_entry(name) and not name.startswith("META-INF"))
        if OLD_SHAPE.search(text):
            printed96.append(row["id"])
    lines += ["", f"shapes across the {len(defaulted)}: " + ", ".join(f"{k} {v}" for k, v in sorted(shapes.items())),
              f"the {len(others)} rows not tagged: {len(printed96)} carry a direction of the inserted shape"
              + (f" ({', '.join(printed96)}: the upload's own printed quarter = 96, by the raw conversion's added_tempo; "
                 "pdmx-count.txt)" if printed96 else ""),
              f"tagged rows a reviewed repair already names (E50, E57): {len([r for r in defaulted if r['id'] in repaired])}; "
              f"tagged rows among E57a's three held: {len([r for r in defaulted if r['id'] in E57A_HELD])}",
              f"{len(faults)} fault(s)"] + [f"   FAULT {fault}" for fault in faults]
    (RUNS / "pdmx-shapes.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[:1] + lines[-5 - len(faults):]))
    return 1 if faults else 0


def apply(base: str) -> int:
    items = rows()
    defaulted = [row for row in items if row.get("tempoDefaulted") is True]
    raw_table = TABLE.read_bytes()
    text = raw_table.decode("utf-8")
    original = json.loads(text)
    round_trip = json.dumps(original, indent=2, ensure_ascii=False) + "\n"
    lines = [f"base {base}; {len(defaulted)} rows tagged tempoDefaulted; round trip of pdmx.json byte-identical: "
             f"{round_trip.encode('utf-8') == raw_table}: spliced as text either way"]
    moved: dict[str, tuple[str, str]] = {}
    written = already = 0
    for row in defaulted:
        rel = f"scores/pdmx/{row['cid']}.mxl"
        old = subprocess.run(["git", "-C", str(W), "show", f"{base}:content/{rel}"], capture_output=True, check=True).stdout
        new, shape = transform_file(old)
        path = W / "content" / rel
        current = path.read_bytes()
        if current == new:
            already += 1
        elif current == old:
            path.write_bytes(new)
            written += 1
        else:
            raise SystemExit(f"STOP {row['id']}: the committed file is neither the old file at {base} nor its transform")
        moved[row["id"]] = (sha(old), sha(new))
        lines.append(f"{row['id']}: {rel}; {shape}; {sha(old)[:12]} -> {sha(new)[:12]}")
    done = spliced_already = 0
    for item_id, (old_sha, new_sha) in moved.items():
        start = text.find(f'"id": "{item_id}"')
        end = text.find('"id": "', start + 1)
        end = len(text) if end < 0 else end
        block = text[start:end]
        old_field, new_field = f'"convertedSha256": "{old_sha}"', f'"convertedSha256": "{new_sha}"'
        if start >= 0 and block.count(new_field) == 1:
            spliced_already += 1
            continue
        if start < 0 or block.count(old_field) != 1:
            raise SystemExit(f"STOP {item_id}: the row's convertedSha256 is not once in its block")
        text = text[:start] + block.replace(old_field, new_field, 1) + text[end:]
        done += 1
    after = json.loads(text)
    before_rows = {row["id"]: row for row in original["items"]}
    after_rows = {row["id"]: row for row in after["items"]}
    changed = {item_id: sorted(k for k in set(a) | set(after_rows[item_id]) if a.get(k) != after_rows[item_id].get(k))
               for item_id, a in before_rows.items()}
    changed = {k: v for k, v in changed.items() if v}
    if {k for v in changed.values() for k in v} - {"convertedSha256"} or set(changed) - set(moved) or \
            {k: v for k, v in original.items() if k != "items"} != {k: v for k, v in after.items() if k != "items"}:
        raise SystemExit("STOP: a field other than convertedSha256 on the moved rows would move")
    for item_id, (_, new_sha) in moved.items():
        if after_rows[item_id]["convertedSha256"] != new_sha:
            raise SystemExit(f"STOP {item_id}: convertedSha256 is not the new file's sha256 after the splice")
    TABLE.write_bytes(text.encode("utf-8"))
    lines += ["", f"files: {written} written, {already} already moved; pdmx.json: {done} row(s) spliced, {spliced_already} already "
              f"carrying the new sha256; rows whose parsed fields differ from the file on entry: {len(changed)}, every one convertedSha256 alone"]
    # The run that moves the files keeps its log; a rerun (nothing to write) logs beside it, proving it idempotent.
    log = "pdmx-transform.txt" if written or done else "pdmx-transform-rerun.txt"
    (RUNS / log).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[:1] + lines[-1:]))
    return 0


def main(argv: list[str]) -> int:
    if argv[:1] == ["--check"]:
        return check(argv[1] if len(argv) > 1 else None)
    if argv[:1] == ["--apply"] and len(argv) == 2:
        return apply(argv[1])
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
