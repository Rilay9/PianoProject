"""
E50b (Entry 181): the premise behind refusing a legacy run's tempo (a run of one of the seven ids that stored no
material): before E50 every file under those ids played at the converter's defaulted 96. Read from every commit that
touched `content/sources/pdmx.json` up to E50's parent (68e0479b^1), read only: each of the seven rows' `tempoBpm` and
`tempoDefaulted` in each version where the row exists. Output: runs/E50b/tempo-history.txt.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
LOG = W / "docs" / "prompts" / "runs" / "E50b" / "tempo-history.txt"
SEVEN = ["song.pop.margie.pdmx", "song.jazz.django-reinhardt-limehouse-blues.pdmx", "song.blues.singin-the-blues",
         "song.blues.weary-blues", "song.blues.storyville-blues", "song.blues.wabash-blues", "song.blues.tishomingo-blues"]


def git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(W), *args], capture_output=True, check=True).stdout.decode("utf-8")


def main() -> int:
    commits = git("log", "--format=%h %cs", "68e0479b^1", "--", "content/sources/pdmx.json").split("\n")
    seen: dict[str, set[tuple]] = {row: set() for row in SEVEN}
    lines = [f"{len([c for c in commits if c])} commits touching content/sources/pdmx.json before E50 (68e0479b^1)"]
    for line in filter(None, commits):
        sha, day = line.split()
        items = {row["id"]: row for row in json.loads(git("show", f"{sha}:content/sources/pdmx.json"))["items"]}
        present = [row for row in SEVEN if row in items]
        for row in present:
            seen[row].add((items[row].get("tempoBpm"), items[row].get("tempoDefaulted")))
        lines.append(f"   {sha} {day}: {len(present)} of the seven present")
    faults = []
    for row, values in seen.items():
        lines.append(f"{row}: (tempoBpm, tempoDefaulted) over every version it exists in: {sorted(values)}")
        if values != {(96.0, True)}:
            faults.append(row)
    lines.append(f"{len(faults)} row(s) ever not at the defaulted 96 before E50: {faults}")
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main())
