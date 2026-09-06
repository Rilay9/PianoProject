"""
Where the archive is, and what to say when it is not there.

Every program in this package needs the same three answers — where the CSV is,
where the scores are, and which of the two accepted layouts is on disk — and
every one of them can be run by someone who has not read the README. So the
refusal is a paragraph naming the file and the layouts, not a traceback: a
`FileNotFoundError` from inside a CSV reader tells the reader nothing they can
act on.
"""
from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from pathlib import Path

#: The environment variable the README tells the owner to set.
PDMX_DIR_ENV = "PIANOPATH_PDMX_DIR"

CSV_NAME = "PDMX.csv"
TARBALL_NAME = "mxl.tar.gz"
UNPACKED_NAME = "mxl"

REPO_ROOT = Path(__file__).resolve().parents[3]
BUILD_DIR = REPO_ROOT / "build" / "pdmx"


class ArchiveMissing(Exception):
    """Raised with a message meant to be printed, not a stack trace."""


@dataclass(frozen=True)
class Archive:
    """The two files the quarry reads, and which layout the scores are in."""

    root: Path
    csv: Path
    #: Exactly one of these is set.
    tarball: Path | None
    unpacked: Path | None

    @property
    def layout(self) -> str:
        return "mxl.tar.gz" if self.tarball else "mxl/"


def find_archive(pdmx_dir: str | os.PathLike[str] | None, *, require_scores: bool = True) -> Archive:
    """
    Locates the archive, or raises `ArchiveMissing` with something readable.

    `require_scores` is false for `select.py`, which only reads the CSV: asking
    a 20-second CSV pass to wait for a 1.9 GB tarball to exist would be a rule
    that helps nobody.
    """
    root = Path(pdmx_dir or os.environ.get(PDMX_DIR_ENV, "")).expanduser()
    if not str(root):
        raise ArchiveMissing(
            "No PDMX directory. Pass --pdmx-dir, or set the environment variable "
            f"{PDMX_DIR_ENV} to the folder holding {CSV_NAME} and {TARBALL_NAME}. "
            "The archive is never in this repository and never in CI: it lives on the "
            "owner's machine, and the quarry runs there once (replan §2.1)."
        )
    csv = root / CSV_NAME
    if not csv.is_file():
        raise ArchiveMissing(
            f"{csv} does not exist. The PDMX quarry needs {CSV_NAME} — the 209,574,867-byte "
            f"metadata table from the Zenodo record — in {root}. Nothing here downloads it; "
            "it is put in place by hand and the fingerprint is recorded when the run commits."
        )
    tarball = root / TARBALL_NAME
    unpacked = root / UNPACKED_NAME
    if tarball.is_file():
        return Archive(root=root, csv=csv, tarball=tarball, unpacked=None)
    if unpacked.is_dir():
        return Archive(root=root, csv=csv, tarball=None, unpacked=unpacked)
    if not require_scores:
        return Archive(root=root, csv=csv, tarball=None, unpacked=None)
    raise ArchiveMissing(
        f"No scores in {root}. Two layouts are accepted and neither is present:\n"
        f"  - {tarball} (the 1,894,335,797-byte tarball, left packed — this is the normal case,\n"
        "    and extract.py streams it once rather than unpacking 250,000 files)\n"
        f"  - {unpacked}/ (the same tarball unpacked, if you have already done that)"
    )


def fail(message: str) -> None:
    """Prints a refusal to stderr and exits 2. Never a traceback."""
    print(message, file=sys.stderr)
    raise SystemExit(2)
