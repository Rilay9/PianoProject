"""
E59: `app/tests/e2e/fixtures/excerpt-candidates.json` (the excerpt view's spec input) is the proposer's run for Anh. 113 on
the built catalogue, and records its parent's built sha256, which E59 moves (the Minuet is one of the 169). The fixture is
brought into line with a fresh run (`test_excerpt_proposer.TheViewsFixtureIsTheProposersOwnOutput`: "the parent's built file
changed: rewrite the fixture") by splicing the moved sha256 as text, and only after a fresh run on the final build is shown to
differ from the fixture in nothing else but run-local fields (its id and time).

    python scripts-fixture.py [--write]

Without --write: the comparison only. Output: runs/E59/fixture.txt.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
import excerpt_proposer as P  # noqa: E402

FIXTURE = W / "app" / "tests" / "e2e" / "fixtures" / "excerpt-candidates.json"
PARENT = "song.classical.bach-menuet-bwv-anh-113.pdmx"


def walk(a, b, path: str, out: list[str]) -> None:
    if isinstance(a, dict) and isinstance(b, dict):
        for key in sorted(set(a) | set(b)):
            walk(a.get(key), b.get(key), f"{path}.{key}", out)
    elif isinstance(a, list) and isinstance(b, list) and len(a) == len(b):
        for i, (x, y) in enumerate(zip(a, b)):
            walk(x, y, f"{path}[{i}]", out)
    elif a != b:
        out.append(f"{path}: {json.dumps(a)[:80]} -> {json.dumps(b)[:80]}")


def main(argv: list[str]) -> int:
    built = W / "app" / "public" / "content"
    catalog = json.loads((built / "catalog.json").read_text(encoding="utf-8"))
    curriculum = json.loads((built / "curriculum.json").read_text(encoding="utf-8"))
    fixture_text = FIXTURE.read_text(encoding="utf-8")
    fixture = json.loads(fixture_text)
    want = fixture["runs"][0]
    run = P.propose(catalog, curriculum, built, want["for"], want["rung"], want["of"], tuple(want["bars"]))
    # The fixture predates fields the proposer writes since (`refused`, `seeded`, `scanned.skipped`) and holds the run's
    # first candidates only; the spec reads its first candidate, so that is what is compared, whole, as the test does in part.
    differences: list[str] = []
    walk(want["candidates"][0], json.loads(json.dumps(run["candidates"][0])), "runs[0].candidates[0]", differences)
    old = want["candidates"][0]["parent"]["sha256"]
    new = run["candidates"][0]["parent"]["sha256"]
    identity = next(item for item in catalog if item["id"] == PARENT)["provenance"]["identity"]["sha256"]
    sha_paths = [d for d in differences if old[:12] in d or new[:12] in d]
    others = [d for d in differences if d not in sha_paths]
    local = [d for d in others if d.split(":", 1)[0].rsplit(".", 1)[-1] in ("runId", "at", "generatedAt", "when", "id")]
    lines = [f"the fixture's parent sha256 {old[:12]}…, a fresh run's {new[:12]}…, the built catalogue's identity for {PARENT} "
             f"{identity[:12]}…; the first candidate's differences: {len(differences)} ({len(sha_paths)} the parent's sha256, "
             f"{len(local)} run-local, {len(others) - len(local)} other)"]
    lines += [f"   {d}" for d in differences]
    ok = new == identity and len(others) == len(local)
    if "--write" in argv:
        if not ok:
            raise SystemExit("STOP: the fresh run differs in more than the parent's sha256 and run-local fields")
        if fixture_text.count(old) < len(sha_paths):
            raise SystemExit("STOP: the old sha256 is not in the fixture once per difference")
        FIXTURE.write_text(fixture_text.replace(old, new), encoding="utf-8", newline="\n")
        lines.append(f"wrote {FIXTURE.relative_to(W).as_posix()}: {len(sha_paths)} occurrence(s) of the parent's sha256 spliced, nothing else")
    elif old == new:
        lines.append("the fixture already carries the parent's current sha256")
    (W / "docs/prompts/runs/E59/fixture.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
