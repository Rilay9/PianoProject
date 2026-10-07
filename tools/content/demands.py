#!/usr/bin/env python3
"""
A score file's material demands, measured by the app's own detectors (C2).

Reviewer decision 4 asks for one authoritative definition of each musical fact.
The definitions are `app/src/demands/detect.ts`, reading the score model OSMD
makes of a file, which is what the engine plays and what a run is judged
against. So this module keeps no definitions of its own: it hands the files to
`app/tests/unit/demandsOfFiles.test.ts` through Vitest, the way
`render_check.py` hands them to a Playwright spec, and reads the demand ids
back. A second implementation here would be the level model's two ports again
(docs/pending-review.md Entry 53), and the C2 differential showed how quickly
two readers of the same phrases part company.

**The build calls it (E0).** `build.py`'s `attach_demands` sends every bundled
score through `measure_each` and writes the ids, the located counts and the
established opportunities onto the catalogue entry, cached on the file's bytes
and on `definition_fingerprint()` — the bytes of the files that decide a
measurement — so a detector change re-measures and nothing else does. A file the
app could not load comes back with its reason, and the entry carries `demands:
"unmeasured"` with that reason; it is never an empty list.

**Counts (D0).** `measure_opportunities` returns the same run's full rows: the
ids, how many places each detector located, and the bars, steps and sounded
notes of the model. The family contracts' density checks read those counts
(`tools/content/tests/test_measured_demands.py`); they are the detectors' own
`at` lists, counted in TypeScript, so this module still decides nothing.

**Positions (E1).** Each row also carries where: per demand, per printed bar
(1-based, the pickup as bar 1), how many located places, each printed note once
however many passes the repeats make (`positions`); the printed bars where each
every-bar detector's condition holds, the detector asked of that bar alone
(`everyBar`: the left-hand pattern and the walking bass locate nothing unless
every bar of the piece qualifies); each hand's lowest and highest pitch per
printed bar (`hands`); and the printed bar count (`printedBars`). The build keeps
them in `build/positions-cache.json`, beside the counts under the same
fingerprint and never on a catalogue row, for the excerpt proposer
(`excerpt_proposer.py`), which scores a window from them without cutting it.

**The declared hand (HD1).** `measure_opportunities` and `measure_each` take `declared_hand`, one
catalogue row's `hands` for every file of the call: a one-staff file's notes take that hand in the
model the detectors read (`extractScoreModel`'s `declaredHand`), as the Score screen gives them. The
build calls once per declaration (`build.attach_demands`), so a file is never listed twice in one run.

    python3 tools/content/demands.py content/scores/pdmx/<file>.mxl [...]
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import REPO_ROOT, run  # noqa: E402

APP_DIR = REPO_ROOT / "app"
SPEC = "tests/unit/demandsOfFiles.test.ts"


class DemandsError(RuntimeError):
    """A file the app could not measure, or a run that did not answer."""


def _npx() -> str:
    # `npx.cmd` on Windows, which CreateProcess will not find by the bare name
    # (render_check.npx has the story).
    import shutil

    return shutil.which("npx") or "npx"


def measure(paths: list[Path], timeout: int = 3600) -> dict[str, list[str]]:
    """
    `{path: [demand id, ...]}` for each file, in vocabulary order.

    Raises `DemandsError` naming every file the app could not load, rather than
    returning a shorter dict a caller might read as "no demands".
    """
    return {path: row["demands"] for path, row in measure_opportunities(paths, timeout).items()}


def measure_opportunities(paths: list[Path], timeout: int = 3600, declared_hand: str | None = None) -> dict[str, dict]:
    """
    `{path: {"demands": [...], "opportunities": {id: n}, "measures": n, "steps": n,
    "notes": n}}` for each file: the ids in vocabulary order, and per vocabulary
    demand the number of places its detector located (0 where none).

    One Vitest run for all the files. Raises `DemandsError` as `measure` does. `declared_hand`: the
    hand the files' catalogue rows declare (HD1), for every file of the call, or none.
    """
    with tempfile.TemporaryDirectory() as scratch:
        listing = Path(scratch) / "in.json"
        report = Path(scratch) / "out.json"
        listing.write_text(json.dumps(_listing(paths, declared_hand)), encoding="utf-8")
        environment = dict(os.environ)
        environment.update({"PIANOPATH_DEMANDS_IN": str(listing), "PIANOPATH_DEMANDS_OUT": str(report)})
        result = run([_npx(), "vitest", "run", SPEC, "--reporter=dot"], cwd=APP_DIR, timeout=timeout, env=environment)
        if not report.exists():
            raise DemandsError(
                f"the detector run wrote no report (exit {result.returncode}):\n{result.stdout[-2000:]}{result.stderr[-2000:]}"
            )
        answered = json.loads(report.read_text(encoding="utf-8"))
    failed = {path: row["error"] for path, row in answered.items() if "error" in row}
    if failed:
        raise DemandsError("could not measure: " + "; ".join(f"{path}: {why}" for path, why in failed.items()))
    missing = [str(p) for p in paths if str(p) not in answered]
    if missing:
        raise DemandsError("the detector run did not answer for: " + "; ".join(missing))
    return answered


def _listing(paths: list[Path], declared_hand: str | None, verified_hands: dict[str, list] | None = None) -> list:
    """
    The bridge's input: bare paths, or each path with the declared hand (HD1) and its file's verified
    hands (HD2: `verified_hand.hand_facts_for`'s rows, as `extractScoreModel`'s `verifiedHands`).
    """
    out: list = []
    for p in paths:
        hands = (verified_hands or {}).get(str(p)) or []
        if declared_hand is None and not hands:
            out.append(str(p))
            continue
        entry: dict = {"path": str(p)}
        if declared_hand is not None:
            entry["declaredHand"] = declared_hand
        if hands:
            entry["verifiedHands"] = hands
        out.append(entry)
    return out


def measure_each(
    paths: list[Path],
    timeout: int = 3600,
    chunk: int = 400,
    declared_hand: str | None = None,
    verified_hands: dict[str, list] | None = None,
) -> dict[str, dict]:
    """
    `measure_opportunities`' rows for each file, except that a file the app could not
    measure comes back as `{"error": why}` instead of failing the whole run: the build
    marks that one entry unmeasured, with the reason, and measures the rest (E0).

    In runs of `chunk` files, so one Vitest process never holds every score's model.
    A run that writes no report at all still raises `DemandsError`: that is a broken
    bridge, not a library of unreadable files, and the build must stop on it.
    `declared_hand` as in `measure_opportunities` (HD1); `verified_hands`, by path, each file's
    current verified hands (HD2).
    """
    out: dict[str, dict] = {}
    for start in range(0, len(paths), chunk):
        part = paths[start:start + chunk]
        with tempfile.TemporaryDirectory() as scratch:
            listing = Path(scratch) / "in.json"
            report = Path(scratch) / "out.json"
            listing.write_text(json.dumps(_listing(part, declared_hand, verified_hands)), encoding="utf-8")
            environment = dict(os.environ)
            environment.update({"PIANOPATH_DEMANDS_IN": str(listing), "PIANOPATH_DEMANDS_OUT": str(report)})
            result = run([_npx(), "vitest", "run", SPEC, "--reporter=dot"], cwd=APP_DIR, timeout=timeout, env=environment)
            if not report.exists():
                raise DemandsError(
                    f"the detector run wrote no report (exit {result.returncode}):\n"
                    f"{result.stdout[-2000:]}{result.stderr[-2000:]}"
                )
            answered = json.loads(report.read_text(encoding="utf-8"))
        for path in part:
            out[str(path)] = answered.get(str(path), {"error": "the detector run did not answer for this file"})
    return out


#: The files whose bytes decide what a file measures as: the detectors, the model
#: they read and how it is made, the vocabulary that names the ids, the bridge's
#: own spec, and the lockfile that pins OpenSheetMusicDisplay. A change to any of
#: them changes `definition_fingerprint()` and every cached measurement is taken
#: again; a change anywhere else re-measures nothing.
DEFINITION_FILES = (
    "app/src/demands/detect.ts",
    "app/src/score/metre.ts",  # the metre rule detect.ts reads (moved there by MT1)
    "app/src/score/extractScoreModel.ts",
    "app/src/score/tempoFromXml.ts",  # extractScoreModel reads tempoEvents from it
    "app/src/score/measureWalk.ts",  # tempoFromXml walks measures with it (PH1)
    "app/src/score/types.ts",
    "app/src/score/mxl.ts",
    "app/tests/unit/demandsOfFiles.test.ts",
    "content/curriculum/vocabulary/demands.json",
    "app/package-lock.json",
)


def definition_fingerprint() -> str:
    """Twelve hex digits over `DEFINITION_FILES`' bytes, line endings normalised."""
    import hashlib

    digest = hashlib.sha256()
    for rel in DEFINITION_FILES:
        path = REPO_ROOT / rel
        digest.update(rel.encode("utf-8"))
        digest.update(path.read_bytes().replace(b"\r\n", b"\n") if path.exists() else b"(missing)")
    return digest.hexdigest()[:12]


def evidence_definitions() -> int:
    """
    `EVIDENCE_DEFINITIONS` from `app/src/evidence/evidence.ts`: the app's named version
    of its evidence rules, which moves when a detector's located reading changes (C4d
    moved it for the hands-together detector). Read from the source, never restated.
    """
    import re

    text = (REPO_ROOT / "app" / "src" / "evidence" / "evidence.ts").read_text(encoding="utf-8")
    match = re.search(r"export const EVIDENCE_DEFINITIONS = (\d+);", text)
    if match is None:
        raise DemandsError("EVIDENCE_DEFINITIONS not found in app/src/evidence/evidence.ts")
    return int(match.group(1))


def main() -> int:
    paths = [Path(arg).resolve() for arg in sys.argv[1:]]
    if not paths:
        print(__doc__)
        return 2
    try:
        found = measure(paths)
    except DemandsError as error:
        print(error, file=sys.stderr)
        return 1
    print(json.dumps(found, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
