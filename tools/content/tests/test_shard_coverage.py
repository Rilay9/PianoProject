"""The shard coverage check: each test of the browser collection ran in exactly one CI shard (T62).

`tools/ci/shard_coverage.py` compares the unsharded `--list --reporter=json` collection with the
shards' blob reports. The unit is Playwright's test id: under `fullyParallel: true` a spec file
gives tests to several shards, and a retry is the same test again. These cases build both inputs
in the shapes Playwright 1.63 writes (`onBlobReportMetadata`, `onProject`'s suites and entries,
`onTestEnd`), partition a small collection correctly, then drop, duplicate or orphan one *test*,
and expect it named.
"""
from __future__ import annotations

import io
import json
import sys
import tempfile
import unittest
import zipfile
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tools" / "ci"))

import shard_coverage as sc  # noqa: E402

#: The collection: two files, one with a describe block. Ids are opaque, as Playwright's are.
TESTS = [
    ("id-a1", "a.spec.ts", [], "a one", 3),
    ("id-a2", "a.spec.ts", [], "a two", 7),
    ("id-a3", "a.spec.ts", [], "a three", 11),
    ("id-b1", "b.spec.ts", ["b group"], "b one", 4),
    ("id-b2", "b.spec.ts", ["b group"], "b two", 7),
    ("id-b3", "b.spec.ts", [], "b four", 15),
]
BY_ID = {test[0]: test for test in TESTS}


def collection(ids: list[str], errors: list[dict] | None = None) -> dict:
    files: dict[str, dict] = {}
    for test_id in ids:
        _, file, titles, title, line = BY_ID[test_id]
        top = files.setdefault(file, {"title": file, "file": file, "specs": [], "suites": []})
        holder = top
        for name in titles:
            found = next((s for s in holder["suites"] if s["title"] == name), None)
            if found is None:
                found = {"title": name, "file": file, "specs": [], "suites": []}
                holder["suites"].append(found)
            holder = found
        holder["specs"].append({"title": title, "id": test_id, "file": file, "line": line, "column": 1, "tests": []})
    return {"config": {}, "suites": list(files.values()), "errors": errors or [], "stats": {}}


def blob(current: int | None, total: int | None, ids: list[str], results: list[tuple[str, str]] | None = None) -> bytes:
    """A blob report's `report.jsonl`: given `ids`, each reported passed unless `results` says otherwise."""
    suites: dict[str, dict] = {}
    for test_id in ids:
        _, file, titles, title, line = BY_ID[test_id]
        top = suites.setdefault(file, {"title": file, "location": {"file": file, "line": 0, "column": 0}, "entries": []})
        holder = top
        for name in titles:
            found = next((e for e in holder["entries"] if e.get("title") == name and "testId" not in e), None)
            if found is None:
                found = {"title": name, "location": {"file": file, "line": 3, "column": 6}, "entries": []}
                holder["entries"].append(found)
            holder = found
        holder["entries"].append({
            "testId": test_id, "title": title, "location": {"file": file, "line": line, "column": 1},
            "retries": 1, "tags": [], "repeatEachIndex": 0, "annotations": [],
        })
    meta = {"version": 2, "userAgent": "Playwright/1.63.0", "pathSeparator": "/"}
    if current is not None:
        meta["shard"] = {"current": current, "total": total}
    events = [
        {"method": "onBlobReportMetadata", "params": meta},
        {"method": "onConfigure", "params": {"config": {"shard": meta.get("shard")}}},
        {"method": "onProject", "params": {"project": {"name": "", "retries": 1, "suites": list(suites.values())}}},
        {"method": "onBegin"},
    ]
    for test_id, status in results if results is not None else [(i, "passed") for i in ids]:
        events.append({"method": "onTestBegin", "params": {"testId": test_id, "result": {"id": "r", "retry": 0}}})
        events.append({"method": "onTestEnd", "params": {
            "test": {"testId": test_id, "expectedStatus": "passed", "timeout": 30000, "annotations": []},
            "result": {"id": "r", "duration": 1, "status": status, "errors": []},
        }})
    events.append({"method": "onEnd", "params": {"result": {"status": "passed"}}})
    out = io.BytesIO()
    with zipfile.ZipFile(out, "w") as archive:
        archive.writestr("report.jsonl", "".join(json.dumps(e) + "\n" for e in events))
    return out.getvalue()


class TheShardCoverage(unittest.TestCase):
    def run_check(self, listed: dict, blobs: dict[str, bytes], extra: dict[str, bytes] | None = None) -> tuple[int, str, str]:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "collection.json").write_text(json.dumps(listed), encoding="utf-8")
            for name, data in {**blobs, **(extra or {})}.items():
                path = root / "reports" / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(data)
            (root / "reports").mkdir(exist_ok=True)
            out, err = io.StringIO(), io.StringIO()
            with redirect_stdout(out), redirect_stderr(err):
                code = sc.main(["--list", str(root / "collection.json"), "--reports", str(root / "reports")])
            return code, out.getvalue(), err.getvalue()

    ALL = [t[0] for t in TESTS]

    def good(self) -> dict[str, bytes]:
        # a.spec.ts gives tests to shards 1 and 2, b.spec.ts to shards 2 and 3: files are not the unit.
        return {
            "e2e-blob-report-1-of-3/report-1.zip": blob(1, 3, ["id-a1", "id-a2"], [("id-a1", "failed"), ("id-a1", "passed"), ("id-a2", "skipped")]),
            "e2e-blob-report-2-of-3/report-2.zip": blob(2, 3, ["id-a3", "id-b1"]),
            "e2e-blob-report-3-of-3/report-3.zip": blob(3, 3, ["id-b2", "id-b3"]),
        }

    def test_a_partition_by_test_with_a_retry_and_a_skip_passes(self) -> None:
        code, out, err = self.run_check(collection(self.ALL), self.good())
        self.assertEqual((code, err), (0, ""))
        self.assertIn("OK: each of the 6 tests in the collection was given to exactly one shard", out)
        # The retry is the same test reported twice in its own shard, not a second assignment.
        self.assertIn("shard 1/3: given 2 tests; final results: passed 1, skipped 1; retried 1", out)

    def test_a_test_no_shard_was_given_fails_naming_it(self) -> None:
        blobs = self.good()
        blobs["e2e-blob-report-3-of-3/report-3.zip"] = blob(3, 3, ["id-b2"])
        code, _, err = self.run_check(collection(self.ALL), blobs)
        self.assertEqual(code, 1)
        self.assertIn("tests in the collection that no shard was given (1)", err)
        self.assertIn("id-b3 b.spec.ts:15 › b four", err)

    def test_a_test_given_to_two_shards_fails_naming_it_and_both_shards(self) -> None:
        blobs = self.good()
        blobs["e2e-blob-report-3-of-3/report-3.zip"] = blob(3, 3, ["id-b1", "id-b2", "id-b3"])
        code, _, err = self.run_check(collection(self.ALL), blobs)
        self.assertEqual(code, 1)
        self.assertIn("tests given to more than one shard (1)", err)
        self.assertIn("id-b1 b.spec.ts:4 › b group › b one — in shards 2, 3", err)

    def test_a_missing_shard_report_fails_naming_the_shard_and_its_tests(self) -> None:
        blobs = self.good()
        del blobs["e2e-blob-report-2-of-3/report-2.zip"]
        code, _, err = self.run_check(collection(self.ALL), blobs)
        self.assertEqual(code, 1)
        self.assertIn("no blob report for shard(s) 2 of 3", err)
        self.assertIn("id-a3 a.spec.ts:11 › a three", err)
        self.assertIn("id-b1 b.spec.ts:4 › b group › b one", err)

    def test_a_given_test_with_no_result_fails(self) -> None:
        # A shard interrupted after it was given its tests: assigned is not the same as ran.
        blobs = self.good()
        blobs["e2e-blob-report-3-of-3/report-3.zip"] = blob(3, 3, ["id-b2", "id-b3"], [("id-b2", "passed")])
        code, _, err = self.run_check(collection(self.ALL), blobs)
        self.assertEqual(code, 1)
        self.assertIn("tests a shard was given but reported no result for (1)", err)
        self.assertIn("id-b3 b.spec.ts:15 › b four — shard 3", err)

    def test_a_shard_listing_a_different_collection_fails(self) -> None:
        # The shards built their collection from other content than the listing did.
        listed = collection([i for i in self.ALL if i != "id-a2"])
        code, _, err = self.run_check(listed, self.good())
        self.assertEqual(code, 1)
        self.assertIn("tests a shard was given that the unsharded listing does not hold (1)", err)
        self.assertIn("id-a2 a.spec.ts:7 › a two — in shard 1", err)

    def test_reports_that_disagree_on_the_count_or_repeat_a_shard_fail(self) -> None:
        blobs = self.good()
        blobs["e2e-blob-report-3-of-3/report-3.zip"] = blob(3, 4, ["id-b2", "id-b3"])
        blobs["again/report-1.zip"] = blob(1, 3, [], [])
        code, _, err = self.run_check(collection(self.ALL), blobs)
        self.assertEqual(code, 1)
        self.assertIn("the reports disagree on the shard count: 3 in 3 report(s); 4 in 1 report(s)", err)
        self.assertIn("shard 1 has 2 blob reports", err)

    def test_an_unsharded_report_fails(self) -> None:
        code, _, err = self.run_check(collection(self.ALL), {"report.zip": blob(None, None, self.ALL)})
        self.assertEqual(code, 1)
        self.assertIn("blob reports that name no shard", err)

    def test_no_reports_fail(self) -> None:
        code, _, err = self.run_check(collection(self.ALL), {})
        self.assertEqual(code, 1)
        self.assertIn("no blob report was found", err)

    def test_a_listing_with_collection_errors_fails(self) -> None:
        listed = collection(self.ALL, errors=[{"message": "Error: ENOENT: no such file, open 'public/content/catalog.json'"}])
        code, _, err = self.run_check(listed, self.good())
        self.assertEqual(code, 1)
        self.assertIn("the unsharded listing has collection errors", err)
        self.assertIn("ENOENT", err)

    def test_a_trace_beside_the_reports_is_not_read_as_one(self) -> None:
        trace = io.BytesIO()
        with zipfile.ZipFile(trace, "w") as archive:
            archive.writestr("trace.trace", "{}")
        code, _, err = self.run_check(collection(self.ALL), self.good(), {"e2e-blob-report-1-of-3/trace.zip": trace.getvalue()})
        self.assertEqual((code, err), (0, ""))


if __name__ == "__main__":
    unittest.main()
