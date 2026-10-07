#!/usr/bin/env python3
"""Every test of the browser collection ran in exactly one CI shard (T62, 2026-10-01).

CI runs the Playwright suite as N jobs, `npm run e2e -- --shard=i/N`. The configuration is
`fullyParallel: true`, so Playwright divides the collection by *test*, not by spec file: one file
may give tests to several shards, and a retry is the same test again, not a second assignment.
The unit of this check is therefore Playwright's own test id, never a file name or a title.

Two inputs, both written by Playwright itself:

* the unsharded collection, `npx playwright test --list --reporter=json`, run on the same tree and
  the same built content as the shards (the collection is partly made from the catalogue);
* every shard's blob report (`reporter: [..., ['blob']]` on CI), a zip holding `report.jsonl`:
  `onBlobReportMetadata` names the shard (`{current, total}`), `onProject` carries the tests the
  shard was given, `onTestEnd` each attempt's result.

It fails, naming every test and shard concerned, when: the listing has collection errors; no blob
report is found; reports disagree on N, or a shard number is missing, repeated or out of range; a
listed test was given to no shard or to more than one; a shard was given a test the listing does
not hold; a shard was given a test and reported no result for it. Standard library only.

Usage:
    python3 tools/ci/shard_coverage.py --list COLLECTION.json --reports DIR
"""
from __future__ import annotations

import argparse
import json
import sys
import zipfile
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path

#: How many names a failure prints per kind before it says how many more.
SHOWN = 40


@dataclass
class Shard:
    """One blob report: which shard it is, what it was given, what it reported."""

    source: str
    current: int | None
    total: int | None
    assigned: dict[str, str] = field(default_factory=dict)  # test id -> label
    results: Counter = field(default_factory=Counter)  # test id -> attempts reported
    statuses: Counter = field(default_factory=Counter)  # final status of each test -> count


@dataclass
class Verdict:
    problems: list[str]
    summary: list[str]

    @property
    def ok(self) -> bool:
        return not self.problems


def read_collection(path: Path) -> tuple[dict[str, str], list[str]]:
    """The unsharded listing's test ids, each with a readable label, and its collection errors."""
    data = json.loads(path.read_text(encoding="utf-8"))
    tests: dict[str, str] = {}

    def walk(suite: dict, titles: list[str]) -> None:
        title = suite.get("title") or ""
        here = titles if not title or title == suite.get("file") else titles + [title]
        for spec in suite.get("specs", []):
            label = f"{spec.get('file')}:{spec.get('line')} › " + " › ".join(here + [spec.get("title", "")])
            if spec["id"] in tests:
                raise ValueError(f"{path}: test id {spec['id']} listed twice ({tests[spec['id']]}; {label})")
            tests[spec["id"]] = label
        for child in suite.get("suites", []):
            walk(child, here)

    for top in data.get("suites", []):
        walk(top, [])
    errors = [str(error.get("message", error)).splitlines()[0] for error in data.get("errors", [])]
    return tests, errors


def _entries(entries: list[dict], file: str, titles: list[str], out: dict[str, str]) -> None:
    for entry in entries:
        if "testId" in entry:
            line = (entry.get("location") or {}).get("line")
            out[entry["testId"]] = f"{file}:{line} › " + " › ".join(titles + [entry.get("title", "")])
        else:
            here = titles + ([entry["title"]] if entry.get("title") else [])
            _entries(entry.get("entries", []), file, here, out)


def read_blob(path: Path) -> Shard | None:
    """A shard from one blob report, or None when the zip is not a blob report (a trace, say)."""
    with zipfile.ZipFile(path) as archive:
        names = [name for name in archive.namelist() if name.endswith(".jsonl")]
        if not names:
            return None
        lines = b"".join(archive.read(name) for name in sorted(names)).decode("utf-8").splitlines()
    shard = Shard(source=str(path), current=None, total=None)
    last_status: dict[str, str] = {}
    for line in lines:
        if not line.strip():
            continue
        event = json.loads(line)
        method, params = event.get("method"), event.get("params") or {}
        if method == "onBlobReportMetadata":
            meta = params.get("shard") or {}
            shard.current, shard.total = meta.get("current"), meta.get("total")
        elif method == "onProject":
            for suite in (params.get("project") or {}).get("suites", []):
                file = (suite.get("location") or {}).get("file") or suite.get("title", "")
                _entries(suite.get("entries", []), file, [], shard.assigned)
        elif method == "onTestEnd":
            test_id = (params.get("test") or {}).get("testId")
            if test_id:
                shard.results[test_id] += 1
                last_status[test_id] = (params.get("result") or {}).get("status", "unknown")
    shard.statuses = Counter(last_status.values())
    return shard


def find_blobs(root: Path) -> list[Shard]:
    shards = []
    for path in sorted(root.rglob("*.zip")):
        shard = read_blob(path)
        if shard is not None:
            shards.append(shard)
    return shards


def _named(kind: str, items: list[str]) -> str:
    shown = items[:SHOWN]
    more = f"\n    … and {len(items) - SHOWN} more" if len(items) > SHOWN else ""
    return f"{kind} ({len(items)}):\n    " + "\n    ".join(shown) + more


def judge(collection: dict[str, str], errors: list[str], shards: list[Shard]) -> Verdict:
    problems: list[str] = []
    summary: list[str] = []
    if errors:
        problems.append(_named("the unsharded listing has collection errors, so it is not the whole collection", errors))
    if not shards:
        problems.append("no blob report was found: no shard's tests can be checked")
        return Verdict(problems, summary)

    totals = Counter(shard.total for shard in shards)
    unnamed = [shard.source for shard in shards if shard.current is None or shard.total is None]
    if unnamed:
        problems.append(_named("blob reports that name no shard (was the run sharded?)", unnamed))
    if len(totals) > 1:
        problems.append(
            "the reports disagree on the shard count: "
            + "; ".join(f"{total} in {count} report(s)" for total, count in sorted(totals.items(), key=str))
        )
    total = max(totals, key=lambda t: (totals[t], t or 0))
    by_number: dict[int, list[Shard]] = defaultdict(list)
    for shard in shards:
        if shard.current is not None:
            by_number[shard.current].append(shard)
    if isinstance(total, int):
        missing_shards = [n for n in range(1, total + 1) if n not in by_number]
        if missing_shards:
            problems.append(f"no blob report for shard(s) {', '.join(map(str, missing_shards))} of {total}")
        outside = sorted(n for n in by_number if not 1 <= n <= total)
        if outside:
            problems.append(f"shard number(s) {', '.join(map(str, outside))} outside 1..{total}")
    repeated = {n: group for n, group in by_number.items() if len(group) > 1}
    for n, group in sorted(repeated.items()):
        problems.append(f"shard {n} has {len(group)} blob reports: " + ", ".join(s.source for s in group))

    owners: dict[str, list[int | None]] = defaultdict(list)
    labels: dict[str, str] = {}
    for shard in shards:
        for test_id, label in shard.assigned.items():
            owners[test_id].append(shard.current)
            labels.setdefault(test_id, label)
    duplicated = sorted(
        f"{test_id} {collection.get(test_id) or labels[test_id]} — in shards {', '.join(map(str, sorted(o, key=str)))}"
        for test_id, o in owners.items()
        if len(o) > 1
    )
    dropped = sorted(f"{test_id} {label}" for test_id, label in collection.items() if test_id not in owners)
    foreign = sorted(
        f"{test_id} {labels[test_id]} — in shard {', '.join(map(str, owners[test_id]))}"
        for test_id in owners
        if test_id not in collection
    )
    silent = sorted(
        f"{test_id} {shard.assigned[test_id]} — shard {shard.current}"
        for shard in shards
        for test_id in shard.assigned
        if shard.results[test_id] == 0
    )
    if dropped:
        problems.append(_named("tests in the collection that no shard was given", dropped))
    if duplicated:
        problems.append(_named("tests given to more than one shard", duplicated))
    if foreign:
        problems.append(_named("tests a shard was given that the unsharded listing does not hold", foreign))
    if silent:
        problems.append(_named("tests a shard was given but reported no result for", silent))

    for n in sorted(by_number):
        for shard in by_number[n]:
            retried = sum(1 for count in shard.results.values() if count > 1)
            statuses = ", ".join(f"{status} {count}" for status, count in sorted(shard.statuses.items()))
            summary.append(
                f"shard {n}/{shard.total}: given {len(shard.assigned)} tests; final results: {statuses or 'none'}; "
                f"retried {retried}"
            )
    given = sum(len(shard.assigned) for shard in shards)
    summary.append(
        f"collection {len(collection)} test ids; {len(shards)} blob report(s) for {total} shard(s); "
        f"{given} assignments, {len(owners)} distinct tests"
    )
    return Verdict(problems, summary)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--list", type=Path, required=True, help="the unsharded `--list --reporter=json` output")
    parser.add_argument("--reports", type=Path, required=True, help="a directory holding the shards' blob reports")
    args = parser.parse_args(argv)
    collection, errors = read_collection(args.list)
    verdict = judge(collection, errors, find_blobs(args.reports))
    for line in verdict.summary:
        print(line)
    if verdict.ok:
        print(f"OK: each of the {len(collection)} tests in the collection was given to exactly one shard and reported a result there")
        return 0
    print("FAIL: the shards did not run the collection exactly once", file=sys.stderr)
    for problem in verdict.problems:
        print(f"  - {problem}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
