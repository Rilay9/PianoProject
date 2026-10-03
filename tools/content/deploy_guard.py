#!/usr/bin/env python3
"""
The Pages deploy's guard: a public build that could not fetch what a healthy public build bundles is not published.

Q88, from the reviewer's Q86 ruling (`docs/review/responses/2d9e7e2c.md`). Since Q80 a build that could not fetch a
public piece validates, with a warning naming it: right for the build, which should not fail on someone else's
uptime, and wrong for the phone, because the Pages job would then replace the last complete deployment with one
where *Pine Apple Rag* is "import your own copy" and ragtime.8's stride bass is kept by no bundled option, until a
later deploy fetches. So the validator stays as built and the *deployment* is guarded: `.github/workflows/pages.yml`
runs this between the build and the artifact upload, and a refusal fails the build job, so nothing is uploaded,
`deploy-pages` does not run, and the previous deployment stays live.

The input is the built catalogue's structured fact, never the build's warning text: each placeholder whose
`importHint` carries a reason that is this build's own fetch, as `validate.unfetched_placeholders` reads it (Q80's
`UNFETCHED_REASONS`, imported here rather than copied, so there is one definition of *this build's own placeholder*,
and a reason another import step adds there is refused here the day it lands). Everything else passes: the licence
placeholders of a strict build, the import-only rows, the runtime drills. A deliberate removal is not this guard's
business; the catalogue and the ladder report judge that.

Usage:
    python3 tools/content/deploy_guard.py [--dir app/dist/content]

Exit 0: the catalogue holds no fetch placeholder. Exit 1: it does, and each is named with its reason. Exit 2: the
catalogue cannot be read, which is a refusal too, since a guard that cannot read its input and passes is open.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import DEFAULT_OUT  # noqa: E402
from validate import unfetched_placeholders  # noqa: E402


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0].strip())
    parser.add_argument("--dir", type=Path, default=DEFAULT_OUT, help="the built content directory (catalog.json)")
    args = parser.parse_args(argv)
    path = args.dir / "catalog.json"
    try:
        catalog = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        print(f"deploy guard: not publishing — the catalogue cannot be read ({path}: {error})")
        return 2
    if not isinstance(catalog, list):
        print(f"deploy guard: not publishing — {path} is not a list of catalogue items")
        return 2
    unfetched = unfetched_placeholders(catalog)
    if unfetched:
        print(f"deploy guard: not publishing — {len(unfetched)} item(s) this build could not fetch:")
        for item_id, reason in unfetched:
            print(f"  {item_id} ({reason})")
        return 1
    print(f"deploy guard: publishing — {path} holds no fetch placeholder ({len(catalog)} catalogue items)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
