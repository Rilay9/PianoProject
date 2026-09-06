"""
candidates.json -> build/pdmx/raw/<cid>.mxl (replan §2.1).

One pass over the tarball, in streaming mode, writing only the members the
selector asked for. `tarfile.open(mode='r|gz')` cannot seek, so members arrive
in whatever order they were written and each one is offered exactly once — the
loop stops as soon as every wanted member has been seen, which on a 1.9 GB
archive is the difference between a minute and twenty.

Unpacking the whole thing would be 250,000 files and about 8 GB, and would be
done once and then done again next time somebody forgot. So it is not done: an
already-unpacked `mxl/` directory is accepted as an equivalent layout and read
directly.

The member name is the thing that goes wrong. The CSV writes
`./mxl/1/11/<cid>.mxl`; the tarball's members are `mxl/1/11/<cid>.mxl` with no
leading `./`. A mismatch extracts nothing at all and reads like a corrupt
archive, so `select.member_name` normalises it in one place, both this and the
tests use that, and the summary below says how many members were wanted and how
many were found.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import tarfile
import time
from dataclasses import dataclass
from pathlib import Path

# `tools/content` on the path and this directory *off* it, before anything
# else is imported. `select.py` next door has a standard library module's
# name, and Python puts a script's own directory first on `sys.path` — from
# which `socketserver` -> `selectors` -> `import select` finds the selector
# and fails somewhere with nothing to do with PDMX. Removing the directory
# fixes it for the whole process; importing as `pdmx.select` keeps working.
_HERE = Path(__file__).resolve().parent
sys.path[:] = [entry for entry in sys.path if entry and Path(entry).resolve() != _HERE]
if str(_HERE.parent) not in sys.path:
    sys.path.insert(0, str(_HERE.parent))

from pdmx.paths import BUILD_DIR, ArchiveMissing, fail, find_archive  # noqa: E402

#: How often the progress line is rewritten while streaming. The tarball has
#: 254,077 members and a silent twenty minutes looks like a hang.
PROGRESS_EVERY = 20_000


@dataclass
class ExtractResult:
    wanted: int
    written: int
    missing: list[str]
    scanned: int
    seconds: float

    @property
    def ok(self) -> bool:
        return not self.missing

    def summary(self) -> str:
        return (
            f"extracted {self.written}/{self.wanted} member(s) in {self.seconds:.1f}s "
            f"after scanning {self.scanned} tar entries"
            + (f"; {len(self.missing)} not found in the archive" if self.missing else "")
        )


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def extract_from_tar(
    tarball: Path, wanted: dict[str, Path], *, progress: bool = True
) -> ExtractResult:
    """
    Streams `tarball` once, writing the members named in `wanted`.

    `wanted` maps a tar member name to the file to write it to. Members not in
    it are skipped without being read, which is what makes one pass affordable.
    """
    started = time.monotonic()
    remaining = dict(wanted)
    written = 0
    scanned = 0
    with tarfile.open(tarball, mode="r|gz") as tar:
        for member in tar:
            scanned += 1
            if progress and scanned % PROGRESS_EVERY == 0:
                print(
                    f"  …{scanned} entries, {written}/{len(wanted)} found",
                    file=sys.stderr,
                    flush=True,
                )
            if not member.isfile():
                continue
            target = remaining.pop(member.name, None)
            if target is None:
                continue
            stream = tar.extractfile(member)
            if stream is None:
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(stream.read())
            written += 1
            if not remaining:
                break
    return ExtractResult(
        wanted=len(wanted),
        written=written,
        missing=sorted(remaining),
        scanned=scanned,
        seconds=time.monotonic() - started,
    )


def extract_from_dir(root: Path, wanted: dict[str, Path]) -> ExtractResult:
    """The same job when the archive is already unpacked."""
    started = time.monotonic()
    written = 0
    missing: list[str] = []
    for member, target in wanted.items():
        # The member names are relative to the directory *containing* `mxl/`.
        source = root.parent / member
        if not source.is_file():
            missing.append(member)
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(source.read_bytes())
        written += 1
    return ExtractResult(
        wanted=len(wanted),
        written=written,
        missing=missing,
        scanned=len(wanted),
        seconds=time.monotonic() - started,
    )


def shard_of(cid: str) -> str:
    """
    Two characters of the CID, as a directory.

    37,000 files in one folder is legal everywhere and pleasant nowhere: it
    makes `ls` slow, Explorer slower, and every tool that globs the directory
    read the whole thing. The archive shards for the same reason.
    """
    body = cid[2:] if cid.startswith("Qm") else cid
    return (body[:2] or "00").lower()


def target_for(out: Path, cid: str, shard: bool) -> Path:
    return (out / shard_of(cid) / f"{cid}.mxl") if shard else (out / f"{cid}.mxl")


def index_songs(index: Path) -> list[dict]:
    """
    Every indexed row that is a piece of music.

    The rows flagged `notASong` are left in the archive: the generator already
    writes scales and metronome tracks, and half a gigabyte is cheap but not so
    cheap that it is worth spending on files nobody will ever open.
    """
    if not index.is_file():
        return []
    data = json.loads(index.read_text(encoding="utf-8"))
    return [row for row in data.get("rows", []) if not row.get("notASong")]


def named_candidates(cids: list[str], candidates: Path, index: Path) -> list[dict]:
    """
    Rows for a hand-picked set of CIDs.

    Looked up in `candidates.json` first and the index second, because a CID
    picked off the index page is usually one the quotas did *not* choose —
    which is the whole point of browsing the archive rather than the shortlist.
    Both files carry the `member` name, which is all the extractor needs.
    """
    known: dict[str, dict] = {}
    for path, key in ((candidates, "candidates"), (index, "rows")):
        if not path.is_file():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        for row in data.get(key, []):
            known.setdefault(row["cid"], row)
    seen: set[str] = set()
    out: list[dict] = []
    for cid in cids:
        cid = cid.strip()
        row = known.get(cid)
        if row and cid not in seen:
            seen.add(cid)
            out.append(row)
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdmx-dir", default=None)
    parser.add_argument("--candidates", type=Path, default=BUILD_DIR / "candidates.json")
    parser.add_argument("--out", type=Path, default=BUILD_DIR / "raw")
    parser.add_argument("--band", action="append", default=[], help="only this band; repeatable")
    parser.add_argument(
        "--include-over-quota",
        action="store_true",
        help="also extract the ranked remainder, for a second pass without re-selecting",
    )
    parser.add_argument(
        "--cid",
        nargs="+",
        default=[],
        help="extract these CIDs instead of the shortlist — what the index page's "
             "‘copy picked CIDs’ button gives you",
    )
    parser.add_argument(
        "--cids-file",
        type=Path,
        default=None,
        help="a file of CIDs, one per line or whitespace-separated",
    )
    parser.add_argument(
        "--index",
        type=Path,
        default=BUILD_DIR / "index" / "index.json",
        help="where to look CIDs up when they are not in candidates.json",
    )
    parser.add_argument(
        "--from-index",
        action="store_true",
        help="extract every song in the index — the whole local library, about "
             "37,000 files and half a gigabyte. Rows flagged as exercises are skipped",
    )
    parser.add_argument(
        "--shard",
        action="store_true",
        help="write into <out>/<aa>/<cid>.mxl rather than one flat directory; "
             "sensible above a few thousand files",
    )
    args = parser.parse_args(argv)

    wanted_cids = list(args.cid)
    if args.cids_file:
        if not args.cids_file.is_file():
            fail(f"{args.cids_file} does not exist.")
            return 2
        wanted_cids += args.cids_file.read_text(encoding="utf-8").split()

    try:
        archive = find_archive(args.pdmx_dir)
    except ArchiveMissing as missing:
        fail(str(missing))
        return 2

    if args.from_index:
        candidates = index_songs(args.index)
        if not candidates:
            fail(f"{args.index} has no songs in it. Run index.py first.")
            return 2
    elif wanted_cids:
        candidates = named_candidates(wanted_cids, args.candidates, args.index)
        if not candidates:
            fail(
                f"none of the {len(wanted_cids)} CID(s) are in {args.candidates.name} or "
                f"{args.index.name}. Build the index first, or check what you pasted."
            )
            return 2
        skipped = len(set(wanted_cids)) - len(candidates)
        if skipped:
            print(f"note: {skipped} CID(s) were not found and are skipped", file=sys.stderr)
    else:
        if not args.candidates.is_file():
            fail(f"{args.candidates} does not exist. Run select.py first.")
            return 2
        data = json.loads(args.candidates.read_text(encoding="utf-8"))
        candidates = [
            c
            for c in data["candidates"]
            if (args.include_over_quota or not c.get("over_quota"))
            and (not args.band or c["band"] in args.band)
        ]
    args.out.mkdir(parents=True, exist_ok=True)
    wanted = {c["member"]: target_for(args.out, c["cid"], args.shard) for c in candidates}
    # Already extracted is already extracted: a re-run after a crash should
    # cost the members it still needs and nothing else.
    wanted = {member: path for member, path in wanted.items() if not path.is_file()}
    already = len(candidates) - len(wanted)

    if not wanted:
        print(f"nothing to do: all {already} candidate file(s) are already in {args.out}")
        return 0

    print(f"{len(wanted)} member(s) to extract ({already} already present), layout {archive.layout}")
    if archive.tarball:
        result = extract_from_tar(archive.tarball, wanted)
    elif archive.unpacked:
        result = extract_from_dir(archive.unpacked, wanted)
    else:  # pragma: no cover - find_archive refuses this
        fail("no scores found")
        return 2

    print(result.summary())
    for member in result.missing[:20]:
        print(f"  missing: {member}")
    return 0 if result.ok else 1


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
