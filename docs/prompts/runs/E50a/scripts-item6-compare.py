"""
E50a item 6: every identity the change touches, counted by whether it still resolves.

The before build (the base, 2da6b8ef, with the main checkout's cache: build/e50a/before/content) against the
after build (the change: app/public/content), per catalogue row: its before identity B, its after identity A
and its after `provenance.formerIdentities` F — unchanged (B == A), resolved (B != A, B in F) or unresolved.
For every build-converted file, the file-by-file check: the before file is the after file with the before
file's own date put back, byte for byte. Then the laptop's own identities (the main checkout's
app/public/content/catalog.json, read in place), the collisions, the cost, the exact-byte systems (the
approvals' parentSha256, D2's decisions) and the checksum identities that move with the bytes.
Output: item6-compare.txt, item6-rows.tsv.
"""
from __future__ import annotations

import hashlib
import io
import json
import re
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
import convert  # noqa: E402
import review  # noqa: E402

# The second implementation HEAD passes the laptop's catalogue as the before side and a suffix for its outputs.
BEFORE = Path(sys.argv[1]) if len(sys.argv) > 1 else W / "build" / "e50a" / "before" / "content"
SUFFIX = sys.argv[2] if len(sys.argv) > 2 else ""
AFTER = W / "app" / "public" / "content"
LAPTOP = Path(r"C:\Users\yalir\repos\Piano Stuff\PianoProject\app\public\content")
RUNS = W / "docs" / "prompts" / "runs" / "E50a"
lines: list[str] = []


def say(text: str = "") -> None:
    lines.append(text)
    print(text, flush=True)


def load(folder: Path) -> dict[str, dict]:
    return {row["id"]: row for row in json.loads((folder / "catalog.json").read_text(encoding="utf-8"))}


def encoding(raw: bytes) -> tuple[str | None, str | None]:
    try:
        with zipfile.ZipFile(io.BytesIO(raw)) as archive:
            names = [n for n in archive.namelist() if convert.is_text_entry(n) and not n.upper().startswith("META-INF/")]
            text = archive.read(names[0]).decode("utf-8") if names else ""
    except zipfile.BadZipFile:
        return None, None
    block = re.search(r"<encoding>(.*?)</encoding>", text, re.DOTALL)
    if not block:
        return None, None
    software = re.search(r"<software>([^<]*)</software>", block.group(1))
    day = re.search(r"<encoding-date>([^<]*)</encoding-date>", block.group(1))
    return (software.group(1) if software else None), (day.group(1) if day else None)


def klass(row: dict, raw_before: bytes | None) -> str:
    identity = row["provenance"].get("identity") or {}
    source = row["provenance"]["source"]
    if identity.get("kind") == "generator":
        return "generated exercise"
    if identity.get("kind") != "file":
        return "no file (none)"
    if source == "excerpt":
        return "excerpt cut"
    if source == "pdmx":
        return "committed PDMX copy"
    software, _day = encoding(raw_before or b"")
    if software and software.startswith("music21 v."):
        return f"build-converted ({source})"
    return f"copied as it is ({source})"


def main() -> int:
    before, after = load(BEFORE), load(AFTER)
    laptop = load(LAPTOP)
    say(f"before: {BEFORE} ({len(before)} rows, catalog.json {(BEFORE / 'catalog.json').stat().st_size} bytes)")
    say(f"after:  {AFTER} ({len(after)} rows, catalog.json {(AFTER / 'catalog.json').stat().st_size} bytes)")
    say(f"the same row ids: {sorted(before) == sorted(after)}")
    current = {row["provenance"]["identity"]["sha256"] for row in after.values() if (row["provenance"].get("identity") or {}).get("kind") == "file"}
    outcomes: dict[str, Counter] = defaultdict(Counter)
    file_check = Counter()
    mismatches: list[str] = []
    unresolved: list[str] = []
    tsv = ["id\tclass\toutcome\tbefore (sha256, 12)\tafter (sha256, 12)\tformer identities"]
    converter_moved = edition_moved = generated_bytes_moved = 0
    carrying = 0
    collisions: list[str] = []
    for row_id in sorted(before):
        b_row, a_row = before[row_id], after[row_id]
        b_id, a_id = b_row["provenance"].get("identity") or {}, a_row["provenance"].get("identity") or {}
        former = [one["sha256"] for one in a_row["provenance"].get("formerIdentities") or []]
        carrying += bool(former)
        collisions += [f"{row_id}: {sha[:12]}" for sha in former if sha in current]
        raw_b = (BEFORE / b_row["file"]).read_bytes() if b_row.get("file") and (BEFORE / b_row["file"]).is_file() else None
        raw_a = (AFTER / a_row["file"]).read_bytes() if a_row.get("file") and (AFTER / a_row["file"]).is_file() else None
        cls = klass(b_row, raw_b)
        same = json.dumps(b_id, sort_keys=True) == json.dumps(a_id, sort_keys=True)
        if same:
            outcome = "unchanged"
        elif b_id.get("kind") == "file" and b_id.get("sha256") in former:
            outcome = "resolved"
        else:
            outcome = "unresolved"
            unresolved.append(f"{row_id} ({cls}): {b_id} -> {a_id}")
        outcomes[cls][outcome] += 1
        if cls != "generated exercise":  # 1200 generator identities, all unchanged: counted above, not listed
            tsv.append(f"{row_id}\t{cls}\t{outcome}\t{b_id.get('sha256', b_id.get('kind'))[:12]}\t{a_id.get('sha256', a_id.get('kind'))[:12]}\t{len(former)}")
        if cls.startswith("build-converted") and raw_b is not None and raw_a is not None:
            entry = convert.dated_form(raw_b)
            entries = convert._entries(raw_a)
            at = convert._score_at(entries, undated=True) if entries else None
            rebuilt = convert._redated(entries, at, entry["date"], entry["system"]) if entry and at is not None else None
            ok = entry is not None and entry["undated"] == hashlib.sha256(raw_a).hexdigest() and rebuilt == raw_b
            file_check["the before file is the after file re-dated, byte for byte" if ok else "MISMATCH"] += 1
            if not ok:
                mismatches.append(row_id)
        if cls == "generated exercise" and raw_b != raw_a:
            generated_bytes_moved += 1
        if (b_row["provenance"].get("converter") or {}).get("version") != (a_row["provenance"].get("converter") or {}).get("version"):
            converter_moved += 1
        if b_row["provenance"].get("edition") != a_row["provenance"].get("edition"):
            edition_moved += 1

    say()
    say("## by class and outcome (unchanged: B == A; resolved: B != A and B in F; unresolved: B != A and B not in F)")
    for cls in sorted(outcomes):
        say(f"   {cls}: " + ", ".join(f"{k} {v}" for k, v in sorted(outcomes[cls].items())))
    total = Counter()
    for counts in outcomes.values():
        total.update(counts)
    say("   all rows: " + ", ".join(f"{k} {v}" for k, v in sorted(total.items())))
    say()
    say("## the headline pair")
    say(f"   rows whose identity no longer resolves (a learner-facing move): {total['unresolved']}")
    say(f"   rows whose provenance.identity bytes changed and resolve through a former identity: {total['resolved']}")
    for line in unresolved[:20]:
        say(f"   UNRESOLVED: {line}")
    say()
    say("## the file-by-file check on the build-converted files")
    for k, v in file_check.items():
        say(f"   {k}: {v}")
    for row_id in mismatches[:20]:
        say(f"   MISMATCH: {row_id}")
    say()
    say("## the laptop's identities (the main checkout's app/public/content/catalog.json, read in place)")
    laptop_counts = Counter()
    for row_id, l_row in laptop.items():
        a_row = after.get(row_id)
        l_id = l_row["provenance"].get("identity") or {}
        if a_row is None:
            laptop_counts["a row the after build does not have"] += 1
            continue
        a_id = a_row["provenance"].get("identity") or {}
        former = {one["sha256"] for one in a_row["provenance"].get("formerIdentities") or []}
        cls = klass(l_row, (LAPTOP / l_row["file"]).read_bytes() if l_row.get("file") and (LAPTOP / l_row["file"]).is_file() else None)
        if json.dumps(l_id, sort_keys=True) == json.dumps(a_id, sort_keys=True):
            laptop_counts[f"{cls}: the after row's identity"] += 1
        elif l_id.get("sha256") in former:
            laptop_counts[f"{cls}: in the after row's former identities"] += 1
        else:
            laptop_counts[f"{cls}: NEITHER"] += 1
    for k, v in sorted(laptop_counts.items()):
        say(f"   {k}: {v}")
    say()
    say("## collisions and cost")
    say(f"   rows carrying formerIdentities: {carrying}")
    say(f"   former identities that are some row's current identity: {len(collisions)}")
    for line in collisions[:10]:
        say(f"   COLLISION: {line}")
    say(f"   catalog.json bytes: before {(BEFORE / 'catalog.json').stat().st_size}, after {(AFTER / 'catalog.json').stat().st_size}")
    say(f"   tools/content/former_identities.json bytes: {convert.FORMER_IDENTITIES_FILE.stat().st_size}")
    say()
    say("## what moves with the bytes, and the exact-byte systems")
    say(f"   provenance.converter.version moved on {converter_moved} rows (the fingerprint moved with convert.py)")
    say(f"   provenance.edition moved on {edition_moved} rows (a checksum of the built file where the importer keys it so)")
    say(f"   generated exercises whose file bytes moved (identity is the generator triple): {generated_bytes_moved}")
    excerpts = json.loads((W / "content" / "sources" / "excerpts.json").read_text(encoding="utf-8"))["excerpts"]
    for approval in excerpts:
        parent = approval["of"]
        b_sha = (before[parent]["provenance"].get("identity") or {}).get("sha256")
        a_sha = (after[parent]["provenance"].get("identity") or {}).get("sha256")
        say(f"   approval of {parent} bars {approval['fromBar']}-{approval['toBar']}: parentSha256 {'equals' if approval['parentSha256'] == a_sha else 'DIFFERS FROM'}"
            f" the after parent's identity; the parent's identity {'unchanged' if b_sha == a_sha else 'MOVED'}")
    decisions = [json.loads(line) for line in (W / "content" / "review" / "decisions.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
    for event in decisions:
        a_id = (after.get(event["item"], {}).get("provenance") or {}).get("identity")
        say(f"   D2 decision {event['event'][:11]} on {event['item']} ({event['identity']['kind']}): "
            f"{'bound to the after identity (review.same_identity)' if review.same_identity(event['identity'], a_id) else 'NOT the after identity'}")
    table = json.loads(convert.FORMER_IDENTITIES_FILE.read_text(encoding="utf-8"))["identities"]
    named = {one["sha256"] for row in after.values() for one in row["provenance"].get("formerIdentities") or []}
    built = [e for e in table if not e["file"].startswith("scores/pdmx/")]
    say()
    say("## the committed table re-proved against this build's files")
    say(f"   build-converted entries named by a row's formerIdentities: {sum(1 for e in built if e['sha256'] in named)} of {len(built)}")
    say(f"   committed PDMX entries named (none expected while the copies keep their dates): {sum(1 for e in table if e['file'].startswith('scores/pdmx/') and e['sha256'] in named)}")
    systems: Counter = Counter()
    for row in after.values():
        path = AFTER / row["file"] if row.get("file") else None
        if path is None or not path.is_file():
            continue
        software, _day = encoding(path.read_bytes())
        if row["provenance"]["source"] != "pdmx" and software and software.startswith("music21 v."):
            systems[convert.archive_system(path.read_bytes())] += 1
    say(f"   creating systems of this build's converter-written files (generated included): {dict(systems)}")
    (RUNS / f"item6-rows{SUFFIX}.tsv").write_text("\n".join(tsv) + "\n", encoding="utf-8")
    (RUNS / f"item6-compare{SUFFIX}.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return 1 if unresolved or mismatches or collisions else 0


if __name__ == "__main__":
    sys.exit(main())
