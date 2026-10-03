"""T62 scratch analysis: shard partition of the real collection, and shard loads under CI's
own per-test durations (the baseline run's list-reporter lines). Not kept in the repo."""
from __future__ import annotations

import json
import re
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent


def specs(path: Path) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    out: list[dict] = []

    def walk(suite: dict, titles: list[str]) -> None:
        here = titles + ([suite["title"]] if suite.get("title") and not suite["title"].endswith(".ts") else [])
        for spec in suite.get("specs", []):
            out.append({"id": spec["id"], "file": spec["file"], "titles": here + [spec["title"]]})
        for child in suite.get("suites", []):
            walk(child, here)

    for top in data["suites"]:
        walk(top, [])
    return out


LINE = re.compile(r"\s(✓|✘|-)\s+\d+\s+(?:\[[^\]]*\]\s+›\s+)?tests/e2e/([^:]+):\d+:\d+\s+›\s+(.*?)(?:\s+\((\d+(?:\.\d+)?)(ms|s|m)\))?\s*$")


def ci_durations(log: Path) -> dict[str, float]:
    seen: dict[str, float] = {}
    started = False
    for raw in log.read_text(encoding="utf-8", errors="replace").splitlines():
        if "Running " in raw and " tests using " in raw:
            started = True
            continue
        if not started:
            continue
        if re.search(r"\d+ passed \(", raw):
            break
        m = LINE.search(raw)
        if not m:
            continue
        mark, file, titles, num, unit = m.groups()
        key = file + " › " + titles.strip()
        sec = 0.0
        if num:
            sec = float(num) * {"ms": 0.001, "s": 1.0, "m": 60.0}[unit]
        seen[key] = seen.get(key, 0.0) + sec  # a retry adds its time to the same test
    return seen


def main() -> None:
    full = specs(HERE / "list-full.json")
    ids = [s["id"] for s in full]
    print(f"unsharded collection: {len(ids)} tests, {len(set(ids))} distinct ids, {len({s['file'] for s in full})} files")
    durations = ci_durations(HERE / "baseline-job.log")
    by_key = {s["file"] + " › " + " › ".join(s["titles"]): s["id"] for s in full}
    matched = {by_key[k]: v for k, v in durations.items() if k in by_key}
    median = statistics.median(v for v in matched.values() if v > 0)
    print(f"CI baseline lines parsed: {len(durations)}; matched to current ids: {len(matched)}; unmatched current ids get the median")
    weight = {i: matched.get(i, median) for i in ids}
    total = sum(weight.values())
    for n in (2, 3, 4, 5, 6, 8):
        sets = [[s["id"] for s in specs(HERE / f"list-{i}-of-{n}.json")] for i in range(1, n + 1)]
        union = Counter(x for s in sets for x in s)
        dup = [x for x, c in union.items() if c > 1]
        missing = set(ids) - set(union)
        extra = set(union) - set(ids)
        files_split = defaultdict(set)
        for i, s in enumerate(sets):
            for x in s:
                files_split[next(f["file"] for f in full if f["id"] == x)].add(i)
        split = sum(1 for v in files_split.values() if len(v) > 1)
        loads = [sum(weight[x] for x in s) / total for s in sets]
        print(
            f"N={n}: sizes {[len(s) for s in sets]}; duplicated {len(dup)}, missing {len(missing)}, extra {len(extra)}; "
            f"files contributing to >1 shard: {split}; share of CI test-time per shard {[round(x, 3) for x in loads]}; "
            f"largest share {max(loads):.3f} (ideal {1 / n:.3f})"
        )


if __name__ == "__main__":
    sys.exit(main())
