"""
E50a item 5: the representative reconversion (the first ruling's item 2).

Wabash Blues (`song.blues.wabash-blues`), one of E50's six whose committed file differed from a fresh
conversion only on `<encoding-date>`: chosen because it is also the parent of an approved excerpt
(`content/sources/excerpts.json`, `parentSha256`), so the one file shows both sides of the reviewer's
boundary — its learner identity among the reconverted file's former identities, and the approval's
exact-byte binding naming the committed file, which E50a does not touch.

Streams the raw upload read-only out of `mxl.tar.gz` (never extracting the archive whole), checks it
against the row's `rawSha256`, converts it twice with the changed converter under two patched dates
(`convert_file(raw, dest)` as `pdmx/quarry.py` does), and compares against a copy of the committed file.
Everything written goes under the worktree's gitignored `build/e50a/item5/`. Output: item5-representative.txt.
"""
from __future__ import annotations

import hashlib
import io
import json
import re
import shutil
import sys
import tarfile
import types
import zipfile
from datetime import date
from pathlib import Path
from unittest import mock

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
import convert  # noqa: E402

TARBALL = Path(r"C:\Users\yalir\repos\Piano Stuff\mxl.tar.gz")
ROW_ID = "song.blues.wabash-blues"
WORK = W / "build" / "e50a" / "item5"
OUT = W / "docs" / "prompts" / "runs" / "E50a" / "item5-representative.txt"
lines: list[str] = []


def say(text: str) -> None:
    lines.append(text)
    print(text, flush=True)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def inner(data: bytes) -> tuple[str, str]:
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = [n for n in archive.namelist() if not n.upper().startswith("META-INF/")]
        return names[0], archive.read(names[0]).decode("utf-8")


def converting_on(day: date):
    from music21.musicxml import m21ToXml

    return mock.patch.object(m21ToXml, "datetime", types.SimpleNamespace(date=types.SimpleNamespace(today=lambda: day)))


def main() -> int:
    rows = json.loads((W / "content" / "sources" / "pdmx.json").read_text(encoding="utf-8"))["items"]
    row = next(r for r in rows if r["id"] == ROW_ID)
    cid = row["cid"]
    say(f"row {ROW_ID}: cid {cid}, rawSha256 {row['rawSha256']}, convertedSha256 {row['convertedSha256']}")
    if WORK.exists():
        shutil.rmtree(WORK)
    (WORK / "raw").mkdir(parents=True)
    raw = WORK / "raw" / f"{cid}.mxl"
    suffix = f"/{cid}.mxl"
    found = None
    with tarfile.open(TARBALL, mode="r|gz") as tar:
        for member in tar:
            if member.isfile() and member.name.endswith(suffix):
                stream = tar.extractfile(member)
                assert stream is not None
                raw.write_bytes(stream.read())
                found = member.name
                break
    if found is None:
        say(f"STOP: no member ending {suffix} in {TARBALL}")
        return 2
    say(f"streamed member {found} read-only out of {TARBALL.name} (the archive was not extracted)")
    raw_sha = sha(raw.read_bytes())
    say(f"raw sha256 {raw_sha}: {'equals' if raw_sha == row['rawSha256'] else 'DIFFERS FROM'} the row's rawSha256")
    if raw_sha != row["rawSha256"]:
        return 2

    days = (date(2026, 9, 16), date(2026, 10, 1))
    written = []
    for folder, day in zip(("one", "two"), days):
        dest = WORK / folder / f"{cid}.mxl"
        with converting_on(day):
            convert.convert_file(raw, dest)
        written.append(dest.read_bytes())
        say(f"converted under the patched date {day.isoformat()}: sha256 {sha(written[-1])}")
    say(f"two conversions on two dates byte-identical: {written[0] == written[1]}")
    new = written[0]
    new_name, new_text = inner(new)
    say(f"new file carries <encoding-date>: {'<encoding-date>' in new_text}")

    committed_path = W / "content" / "scores" / "pdmx" / f"{cid}.mxl"
    copy = WORK / "committed" / f"{cid}.mxl"
    copy.parent.mkdir(parents=True)
    shutil.copyfile(committed_path, copy)
    committed = copy.read_bytes()
    committed_sha = sha(committed)
    say(f"committed file (a copy under build/e50a/item5/committed) sha256 {committed_sha}: "
        f"{'equals' if committed_sha == row['convertedSha256'] else 'DIFFERS FROM'} the row's convertedSha256")
    committed_name, committed_text = inner(committed)
    committed_day = re.search(r"<encoding-date>([^<]*)</encoding-date>", committed_text).group(1)
    say(f"committed file's encoding date {committed_day}; inner entry {committed_name} (new: {new_name})")

    normalised_committed = convert.without_encoding_date(committed_text)
    same_xml = new_text == normalised_committed
    say(f"(1) new inner XML equals the committed inner XML with the element removed by the same function: {same_xml}")
    if not same_xml:
        import difflib
        diff = [l for l in difflib.unified_diff(normalised_committed.splitlines(), new_text.splitlines(), lineterm="", n=0)
                if l[:1] in "+-" and not l.startswith(("+++", "---"))]
        say(f"    STOP: {len(diff)} differing lines; the first 20:")
        for l in diff[:20]:
            say(f"    {l}")
    renormalised = WORK / "renormalised" / f"{cid}.mxl"
    renormalised.parent.mkdir(parents=True)
    shutil.copyfile(committed_path, renormalised)
    convert.normalise_archive(renormalised)
    same_zip = renormalised.read_bytes() == new
    say(f"(2) new .mxl equals the normalised committed XML re-zipped through normalise_archive: {same_zip}")

    # (3), on the reviewer's historical rule (questions-71bd6cee.md): the committed identity is a recorded
    # historical identity (the laptop's catalogue serves the committed copy), and the new file names it.
    table = json.loads(convert.FORMER_IDENTITIES_FILE.read_text(encoding="utf-8"))["identities"]
    recorded = [e for e in table if e["sha256"] == committed_sha]
    inside = len(recorded) == 1 and recorded[0]["date"] == committed_day and recorded[0]["undated"] == sha(new)
    say(f"(3) the committed identity is recorded in tools/content/former_identities.json, dated {committed_day}, "
        f"its undated form the new file: {inside}")
    former = convert.former_identities(WORK / "one" / f"{cid}.mxl")
    among = former == [committed_sha]
    say(f"    the new file's former identities (the committed table, re-proved) are exactly the committed file's sha256: {among}"
        f" ({len(former)} former identities)")
    ok = written[0] == written[1] and same_xml and same_zip and among and raw_sha == row["rawSha256"]
    say(f"RESULT: {'equal but for the element; the committed identity is among the former identities' if ok else 'STOP: see above'}")
    return 0 if ok else 1


if __name__ == "__main__":
    code = main()
    OUT.write_text("\n".join(lines) + f"\nexit {code}\n", encoding="utf-8")
    sys.exit(code)
