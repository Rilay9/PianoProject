#!/usr/bin/env python3
"""
Fetches the external score sources listed in docs/03-content-pipeline.md §2.

Two things this must get right, both of them about *not* being trusted with the
network:

  * The build environment may only reach GitHub. Every source is probed before
    it is cloned, and a source that cannot be reached is skipped with a warning
    rather than failing the build — a content build with fewer sources is still
    a content build.
  * Everything fetched is recorded in `content/scores/imported/SOURCES.md` with
    its URL, licence and the exact revision, because docs/03 §1 rule 6 makes
    that ledger the thing that answers "where did this come from?".

Usage:
    python3 tools/content/fetch.py [--offline] [--only musetrainer,kern] [--force]
"""
from __future__ import annotations

import argparse
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import IMPORTED_DIR, LedgerRow, run, update_ledger, utc_now  # noqa: E402


@dataclass(frozen=True)
class GitSource:
    """A git repository we shallow-clone."""

    id: str
    group: str
    url: str
    #: Directory under content/scores/imported/
    dest: str
    #: Licence as *stated by the source*. Never a guess: where a repository
    #: makes only a blanket claim, that is what is recorded, and convert/import
    #: steps decide per file whether it is good enough (docs/03 §1).
    license: str
    pd_region: str
    #: Glob of the files we actually want, for the ledger's file count.
    pattern: str
    notes: str = ""


#: The sources from docs/03 §2. `craigsapp/bach-wtc` and a Bach *inventions*
#: repository are named there as "verify names" — probed below and reported as
#: missing, which is what the probe is for.
SOURCES: tuple[GitSource, ...] = (
    GitSource(
        id="musetrainer",
        group="MT",
        url="https://github.com/musetrainer/library.git",
        dest="musetrainer",
        license="Public Domain (blanket claim by musetrainer/library; no LICENSE file, no per-file terms)",
        pd_region="US",
        pattern="scores/*.mxl",
        notes="Per-file licence is decided in tools/content/import_musetrainer.py, not here.",
    ),
    *(
        GitSource(
            id=f"kern-{name}",
            group="KERN",
            url=f"https://github.com/craigsapp/{name}.git",
            dest=f"kern/{name}",
            license="see repository LICENSE/README (Humdrum editions by Craig Sapp)",
            pd_region="worldwide",
            pattern="**/*.krn",
        )
        for name in (
            "mozart-piano-sonatas",
            "beethoven-piano-sonatas",
            "chopin-preludes",
            "chopin-mazurkas",
            "scarlatti-keyboard-sonatas",
            "joplin",
            "bach-370-chorales",
            "haydn-piano-sonatas",
            # docs/03 §2 says to verify these two names. They do not exist under
            # craigsapp/; the probe reports them as missing and the build goes on.
            "bach-wtc",
            "bach-inventions",
        )
    ),
    GitSource(
        id="mutopia",
        group="MUTO",
        url="https://github.com/MutopiaProject/MutopiaProject.git",
        dest="mutopia",
        license="per-piece: PD / CC BY / CC BY-SA (stated in each .ly header)",
        pd_region="worldwide",
        pattern="ftp/**/*.ly",
        notes="Large; only cloned when asked for by name (--only mutopia).",
    ),
)

#: Sources that are not cloned unless named explicitly, because they are big.
OPT_IN = {"mutopia"}


def reachable(url: str, timeout: int = 30) -> bool:
    """`git ls-remote` rather than an API call: it is the operation we need."""
    result = run(["git", "ls-remote", "--exit-code", url, "HEAD"], timeout=timeout)
    return result.returncode == 0


def head_revision(repo: Path) -> str:
    result = run(["git", "-C", str(repo), "rev-parse", "--short", "HEAD"])
    return result.stdout.strip() or "unknown"


def clone(source: GitSource, dest: Path, force: bool) -> tuple[bool, str]:
    if dest.exists() and not force:
        if (dest / ".git").exists():
            pull = run(["git", "-C", str(dest), "pull", "--ff-only", "--depth", "1"], timeout=600)
            if pull.returncode != 0:
                return True, f"kept existing clone ({head_revision(dest)}); pull failed"
            return True, f"updated to {head_revision(dest)}"
        return True, "kept existing directory (not a git clone)"
    if dest.exists():
        shutil.rmtree(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    result = run(["git", "clone", "--depth", "1", source.url, str(dest)], timeout=900)
    if result.returncode != 0:
        return False, (result.stderr.strip().splitlines() or ["clone failed"])[-1]
    return True, f"cloned {head_revision(dest)}"


def fetch(selected: set[str] | None, offline: bool, force: bool) -> int:
    rows: list[LedgerRow] = []
    skipped: list[str] = []
    fetched = 0

    for source in SOURCES:
        wanted = selected is None or source.id in selected or source.group.lower() in selected
        if not wanted:
            continue
        if selected is None and source.id in OPT_IN:
            skipped.append(f"{source.id}: opt-in only (pass --only {source.id})")
            continue

        dest = IMPORTED_DIR / source.dest
        if offline:
            if dest.exists():
                print(f"  offline: using existing {dest.relative_to(IMPORTED_DIR.parent.parent)}")
                fetched += 1
                rows.append(ledger_row(source, dest))
            else:
                skipped.append(f"{source.id}: offline and not present")
            continue

        if not reachable(source.url):
            skipped.append(f"{source.id}: unreachable ({source.url})")
            continue

        ok, detail = clone(source, dest, force)
        if not ok:
            skipped.append(f"{source.id}: {detail}")
            continue
        print(f"  {source.id}: {detail}")
        fetched += 1
        rows.append(ledger_row(source, dest))

    if rows:
        update_ledger(rows)
        print(f"provenance: {len(rows)} row(s) written to content/scores/imported/SOURCES.md")

    if skipped:
        print(f"\nskipped {len(skipped)} source(s):", file=sys.stderr)
        for line in skipped:
            print(f"  - {line}", file=sys.stderr)

    print(f"\nfetched {fetched} source(s), skipped {len(skipped)}")
    # Skipping is not failure: docs/03 §2 requires the build to continue.
    return 0


def ledger_row(source: GitSource, dest: Path) -> LedgerRow:
    files = len([p for p in dest.glob(source.pattern) if p.is_file()])
    return LedgerRow(
        source=source.id,
        path=str(dest.relative_to(IMPORTED_DIR)),
        url=source.url,
        license=source.license,
        pd_region=source.pd_region,
        fetched=utc_now(),
        revision=head_revision(dest) if (dest / ".git").exists() else "n/a",
        files=files,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="never touch the network")
    parser.add_argument("--only", help="comma-separated source ids or groups (mt, kern, muto)")
    parser.add_argument("--force", action="store_true", help="re-clone even if present")
    parser.add_argument("--list", action="store_true", help="print the source table and exit")
    args = parser.parse_args()

    if args.list:
        for source in SOURCES:
            print(f"{source.id:32} {source.group:5} {source.url}")
        return

    selected = {s.strip().lower() for s in args.only.split(",")} if args.only else None
    IMPORTED_DIR.mkdir(parents=True, exist_ok=True)
    sys.exit(fetch(selected, args.offline, args.force))


if __name__ == "__main__":
    main()
