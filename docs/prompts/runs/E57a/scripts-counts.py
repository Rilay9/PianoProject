"""
E57a (Entry 195): E57's counts regenerated from the landed set (the reviewer's required change: "the E57 counts must be
regenerated from the actual landed set"), read from the files, never carried over by arithmetic alone.

    python scripts-counts.py <E57's base sha>

- **PDMX rows re-committed by E57 and E57a:** the rows of `content/sources/pdmx.json` whose `convertedSha256` differs
  between <E57's base sha> (`git show`) and the worktree, and the files under `content/scores/pdmx/` whose bytes differ
  between the two; each moved row's file's sha256 is its new `convertedSha256`. Their modes: E57's pdmx-reconvert.txt for
  its 93, E57a's for its three.
- **Relations:** `tools/content/repaired_identities.json`'s repairs by the word their `change` begins with, E57's split into
  committed PDMX files and files the build converts, undated ones counted; the rows they move (identities).
- **The catalogue** (app/public/content, the final build): the rows whose `provenance.formerIdentities` and
  `tempoRepairedFrom` carry an E57 relation's `from`.
Output: runs/E57a/counts.txt. Exit 1 when the PDMX rows that moved are not exactly the rows E57's relations name.
"""
from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
RUNS = W / "docs" / "prompts" / "runs"


def main(argv: list[str]) -> int:
    base = argv[0]
    show = lambda rel: subprocess.run(["git", "-C", str(W), "show", f"{base}:{rel}"], capture_output=True, check=True).stdout  # noqa: E731
    was = {r["id"]: r for r in json.loads(show("content/sources/pdmx.json").decode("utf-8"))["items"]}
    now = {r["id"]: r for r in json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]}
    moved = sorted(i for i in now if i in was and now[i]["convertedSha256"] != was[i]["convertedSha256"])
    files = subprocess.run(["git", "-C", str(W), "diff", "--name-only", base, "--", "content/scores/pdmx"], capture_output=True, text=True, check=True).stdout.split()
    by_cid = {now[i]["cid"]: i for i in now}
    file_rows = sorted(by_cid[Path(f).stem] for f in files)
    shas_ok = all(hashlib.sha256((W / "content/scores/pdmx" / f"{now[i]['cid']}.mxl").read_bytes()).hexdigest() == now[i]["convertedSha256"] for i in moved)
    modes: dict[str, str] = {}
    for run in ("E57", "E57a"):
        for line in (RUNS / run / "pdmx-reconvert.txt").read_text(encoding="utf-8").splitlines():
            found = re.match(r"^(song\.\S+|[a-z]\S*\.pdmx): \(ii\) (re-converted|transplanted)", line)
            if found and not line.startswith("HELD"):
                if run == "E57" and found.group(1) in {"song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx",
                                                        "song.pop.takeru-kanazaki-fire-emblem-three-houses-apex-of-the-world.pdmx",
                                                        "song.pop.billy-joel-rousseau-billy-joel-piano-man.pdmx"}:
                    continue  # E57 checked and held these three; E57a landed them
                modes[found.group(1)] = found.group(2)
    repairs = json.loads((W / "tools/content/repaired_identities.json").read_text(encoding="utf-8"))
    rel = repairs["repairs"]
    words: dict[str, int] = {}
    for one in rel:
        words[one["change"].split(" ", 1)[0]] = words.get(one["change"].split(" ", 1)[0], 0) + 1
    e57 = [r for r in rel if r["change"].startswith("E57 ")]
    e57_pdmx = [r for r in e57 if r["file"].startswith("scores/pdmx/")]
    e57_built = [r for r in e57 if not r["file"].startswith("scores/pdmx/")]
    catalog = {i["id"]: i for i in json.loads((W / "app/public/content/catalog.json").read_text(encoding="utf-8"))}
    carried = sorted({r["id"] for r in e57 if {"kind": "file", "sha256": r["from"]} in (catalog[r["id"]]["provenance"].get("formerIdentities") or [])
                      and {"kind": "file", "sha256": r["from"]} in (catalog[r["id"]]["provenance"].get("tempoRepairedFrom") or [])})
    lines = [
        f"PDMX rows whose convertedSha256 moved since {base}: {len(moved)}; files under content/scores/pdmx/ that moved: {len(files)}; "
        f"the same rows: {moved == file_rows}; each moved file's sha256 its row's new convertedSha256: {shas_ok}",
        f"   modes: re-converted {sum(1 for i in moved if modes.get(i) == 're-converted')}, transplanted "
        f"{sum(1 for i in moved if modes.get(i) == 'transplanted')}, unknown {sum(1 for i in moved if i not in modes)}",
        f"repaired_identities.json: {len(rel)} repairs ({', '.join(f'{k} {v}' for k, v in sorted(words.items()))}) and "
        f"{len(repairs.get('cuts', []))} cut(s); undated {sum(1 for r in rel if r.get('undated'))}",
        f"   E57's relations: {len(e57)} — committed PDMX files {len(e57_pdmx)} over {len({r['id'] for r in e57_pdmx})} rows, files the build "
        f"converts {len(e57_built)} over {len({r['id'] for r in e57_built})} rows; identities moved: {len({r['id'] for r in e57})}",
        f"   the PDMX rows E57's relations name are exactly the rows whose convertedSha256 moved: {sorted({r['id'] for r in e57_pdmx}) == moved}",
        f"the final catalogue: rows whose formerIdentities and tempoRepairedFrom carry an E57 relation's from: {len(carried)} "
        f"(of {len({r['id'] for r in e57})} rows E57's relations name)",
    ]
    ok = moved == file_rows and shas_ok and sorted({r["id"] for r in e57_pdmx}) == moved and len(carried) == len({r["id"] for r in e57})
    lines.append(f"consistent: {ok}")
    (RUNS / "E57a" / "counts.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
