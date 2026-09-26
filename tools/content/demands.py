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

Nothing in the build calls this yet: the catalog carries `demands` from E on,
with a cache keyed on the file, as `attach_notation` has. What it costs is in
the C2 entry, measured on the built catalog.

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
    with tempfile.TemporaryDirectory() as scratch:
        listing = Path(scratch) / "in.json"
        report = Path(scratch) / "out.json"
        listing.write_text(json.dumps([str(p) for p in paths]), encoding="utf-8")
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
    return {path: row["demands"] for path, row in answered.items()}


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
