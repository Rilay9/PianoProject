"""
E51 item 5's dry run: `excerpts.py --merge` against a scratch copy of the definitions, never the committed file.

Hand-made lines signed "E51 dry run": a renewal naming the parent's current bytes, a renewal naming no bytes, one
naming bytes that are not the parent's, the old export of a stored row, a second approval of the renewed range, and
a rejection of a stale approval. The merge is run twice through the command a person runs; then the validator's
excerpt check over the committed file and over the scratch copy, against the same built catalogue.
"""
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = next(p for p in Path(__file__).resolve().parents if (p / "tools" / "content" / "excerpts.py").is_file())
sys.path.insert(0, str(ROOT / "tools" / "content"))

import excerpts as X  # noqa: E402
from validate import excerpt_findings  # noqa: E402

CONTENT = ROOT / "app" / "public" / "content"
COMMITTED = ROOT / "content" / "sources" / "excerpts.json"
SCRATCH = ROOT / "build" / "e51" / "excerpts.json"
LINES = ROOT / "build" / "e51" / "dry-decisions.jsonl"
BY = "E51 dry run"
NOTE = "E51 dry run: the merge's path observed end to end on a scratch copy; no boundary compared or judged"


def event(number: int, row: dict, decision: str = "approve", **over) -> dict:
    made = {"v": 1, "event": f"e51-dry-run-{number:04d}", "decision": decision, "of": row["of"], "fromBar": row["fromBar"],
            "toBar": row["toBar"], "selection": row["selection"], "targets": list(row["targets"]), "label": "", "note": NOTE,
            "by": BY, "at": f"2026-09-29T12:00:{number:02d}.000Z"}
    made.update(over)
    return {k: v for k, v in made.items() if v is not None}


def merge() -> tuple[int, str]:
    done = subprocess.run([sys.executable, "tools/content/excerpts.py", "--merge", str(LINES.relative_to(ROOT)), "--definitions",
                           str(SCRATCH.relative_to(ROOT)), "--content", str(CONTENT.relative_to(ROOT))],
                          cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    return done.returncode, done.stdout + done.stderr


def main() -> int:
    committed_before = hashlib.sha256(COMMITTED.read_bytes()).hexdigest()
    catalog = json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))
    files = {item["id"]: item.get("file") for item in catalog}
    rows = X.read_definitions(COMMITTED)["excerpts"]
    print("## The five approved rows, as the merge judges them against this build\n")
    current = {}
    for number, row in enumerate(rows, start=1):
        current[row["of"]] = X.sha256_of(CONTENT / files[row["of"]])
        why = X.approval_staleness(row, current[row["of"]])
        eid = X.excerpt_id(row["of"], row["fromBar"], row["toBar"], row["selection"])
        print(f"- row {number} `{eid}` (event {row['event']}): " + ("; ".join(why) if why else "current"))
    by_provenance = [r for r in rows if any(w.startswith("stale by provenance") for w in X.approval_staleness(r, current[r["of"]]))]
    anh, hark, ode, rhythm, wabash = rows
    other_bytes = by_provenance[0]["parentSha256"] if by_provenance else "0" * 64
    wrong_row = by_provenance[0] if by_provenance else hark
    lines = [
        event(1, ode, parentSha256=current[ode["of"]]),                    # a renewal on the current bytes
        event(4, anh, parentSha256=None),                                  # a renewal naming no bytes
        event(5, wrong_row, parentSha256=other_bytes),                     # a renewal naming bytes not the parent's
        {"v": 1, "event": wabash["event"], "decision": "approve", "of": wabash["of"], "fromBar": wabash["fromBar"],
         "toBar": wabash["toBar"], "selection": wabash["selection"], "targets": wabash["targets"], "label": wabash["label"],
         "note": wabash["note"], "parentSha256": wabash["parentSha256"], "by": wabash["by"], "at": wabash["at"]},  # the old export
        event(2, ode, parentSha256=current[ode["of"]]),                    # the renewed range approved again
        event(3, rhythm, decision="reject", targets=None, label=None, note=None,
              reason="E51 dry run: the withdrawal path observed on a scratch copy; no boundary compared or judged"),
    ]
    LINES.write_text("".join(json.dumps(line, ensure_ascii=False) + "\n" for line in lines), encoding="utf-8")
    shutil.copyfile(COMMITTED, SCRATCH)
    print(f"\nThe line naming other bytes is on `{X.excerpt_id(wrong_row['of'], wrong_row['fromBar'], wrong_row['toBar'], wrong_row['selection'])}`"
          f" and names {'its approval-time bytes (stale by provenance)' if by_provenance else 'bytes no parent has (0…0): no row is stale by provenance on this build'}.")
    for attempt in ("first", "second (the same file again)"):
        code, printed = merge()
        print(f"\n## The merge, {attempt}: exit {code}\n\n```\n{printed.replace(str(ROOT) + chr(92), '').rstrip()}\n```")
    data = X.read_definitions(SCRATCH)
    print("\n## The scratch copy after\n")
    print(f"- excerpts: {[r['event'] for r in data['excerpts']]}")
    print(f"- rejected: {len(data['rejected'])} (the last {data['rejected'][-1]['event']})")
    print(f"- superseded: {[(e['event'], e['supersededBy']) for e in data['superseded']]}")
    for entry in data["superseded"]:
        old = next(r for r in rows if r["event"] == entry["event"])
        whole = json.dumps({k: v for k, v in entry.items() if k != "supersededBy"}) == json.dumps(old)
        print(f"  - {entry['event']} kept whole (every field and its order as in the committed row): {whole}; cutVersion present: {'cutVersion' in entry}")
    renewed = data["excerpts"][2]
    print(f"- the renewal: event {renewed['event']}, cutVersion {renewed.get('cutVersion')}, parentSha256 {renewed['parentSha256'][:12]}… "
          f"(the parent now {current[renewed['of']][:12]}…)")
    print("\n## The validator's excerpt check over the same build\n")
    for label, path in (("committed file", COMMITTED), ("scratch copy", SCRATCH)):
        errors, warnings = excerpt_findings(catalog, CONTENT, path)
        stale = [w for w in warnings if "stale by" in w]
        print(f"- {label}: {len(errors)} error(s), {len(stale)} stale warning(s)")
        for line in errors + stale:
            print(f"  - {line}")
    committed_after = hashlib.sha256(COMMITTED.read_bytes()).hexdigest()
    print(f"\nThe committed file unchanged by the dry run: {committed_before == committed_after}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
