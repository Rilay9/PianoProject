"""
E50 item 8 (the amended acceptance classes) and item 9's build-side consumers: the before build (the base, df275e8f,
build/e50/before) against the after build (the change, build/e50/after).

1. Every built score file, byte for byte: *music changed* or *byte-identical*; expected: *music changed* for the
   seven parents and the Wabash cut alone.
2. Per catalogue row, E50a's three outcomes — unchanged (B == A), resolved (B != A, B among the after row's former
   identities), unresolved — counted twice: by E50a's date proof alone (the after row's former identities less those
   a reviewed repair names) and with the repair relation. Expected by the amendment: 8 unresolved by the date proof,
   0 resolved, the rest unchanged; with the relation the seven parents resolve and the cut does not.
3. Every row outside the eight: identity and formerIdentities unchanged, and nothing else in the row moved but
   `provenance.converter.version` and the Mutopia row's `converter.normaliser.version` (the fingerprint moved with convert.py). The eight: which fields moved.
4. The consumers the build writes: the tag, the tempo fact and the untrusted demands on the eight; the Wabash approval's
   staleness; D2's decisions against the after identities; the repair relation's rows.
5. The words each of the eight prints over its first bar, and its `<metronome>` and `<sound tempo>`, before and after.
Output: runs/E50/classify.txt.
"""
from __future__ import annotations

import io
import json
import re
import sys
import zipfile
from collections import Counter
from pathlib import Path

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
import review  # noqa: E402

BEFORE = Path(sys.argv[1]) if len(sys.argv) > 1 else W / "build" / "e50" / "before"
AFTER = Path(sys.argv[2]) if len(sys.argv) > 2 else W / "build" / "e50" / "after"
LOG = W / "docs" / "prompts" / "runs" / "E50" / "classify.txt"
SEVEN = ["song.pop.margie.pdmx", "song.jazz.django-reinhardt-limehouse-blues.pdmx", "song.blues.singin-the-blues",
         "song.blues.weary-blues", "song.blues.storyville-blues", "song.blues.wabash-blues", "song.blues.tishomingo-blues"]
CUT = "excerpt.blues.wabash-blues.b1-4"
EIGHT = SEVEN + [CUT]
lines: list[str] = []


def say(text: str = "") -> None:
    lines.append(text)


def load(folder: Path) -> dict[str, dict]:
    return {row["id"]: row for row in json.loads((folder / "catalog.json").read_text(encoding="utf-8"))}


def score_text(path: Path) -> str:
    with zipfile.ZipFile(io.BytesIO(path.read_bytes())) as archive:
        names = [n for n in archive.namelist() if n.lower().endswith((".xml", ".musicxml")) and not n.upper().startswith("META-INF/")]
        return archive.read(names[0]).decode("utf-8")


def first_bar(path: Path) -> str:
    text = score_text(path)
    bar = re.search(r"<measure\b.*?</measure>", text, re.S)
    body = bar.group(0) if bar else ""
    words = [w.strip() for w in re.findall(r"<words\b[^>]*>([^<]*)</words>", body)]
    metronome = [re.sub(r"\s+", "", m) for m in re.findall(r"<metronome\b.*?</metronome>", body, re.S)]
    sounds = re.findall(r'<sound[^>]*\btempo="([^"]*)"', body)
    return f"words {words}; metronome {metronome}; sound tempo {sounds}"


def without_version(row: dict) -> dict:
    copy = json.loads(json.dumps(row))
    converter = copy["provenance"].get("converter") or {}
    converter.pop("version", None)
    # The Mutopia row's MIDI converter names the normaliser it ran through, by the same fingerprint.
    (converter.get("normaliser") or {}).pop("version", None)
    return copy


def main() -> int:
    before, after = load(BEFORE), load(AFTER)
    say(f"before {BEFORE} ({len(before)} rows); after {AFTER} ({len(after)} rows); the same ids: {sorted(before) == sorted(after)}")
    repairs = json.loads((W / "tools/content/repaired_identities.json").read_text(encoding="utf-8"))["repairs"]
    repaired_from = {r["from"] for r in repairs}

    # 1. every built score file
    files_b = {p.relative_to(BEFORE).as_posix() for p in (BEFORE / "scores").rglob("*") if p.is_file()}
    files_a = {p.relative_to(AFTER).as_posix() for p in (AFTER / "scores").rglob("*") if p.is_file()}
    changed = sorted(f for f in files_b & files_a if (BEFORE / f).read_bytes() != (AFTER / f).read_bytes())
    expected = sorted(after[i]["file"] for i in EIGHT)
    say()
    say("## 1. every built score file")
    say(f"   files: before {len(files_b)}, after {len(files_a)}; only before {sorted(files_b - files_a)[:5]}; only after {sorted(files_a - files_b)[:5]}")
    say(f"   music changed: {len(changed)}; byte-identical: {len(files_b & files_a) - len(changed)}")
    say(f"   the changed files are the seven parents and the Wabash cut, exactly: {changed == expected}")
    for f in changed:
        say(f"      {f}")
    faults = [] if changed == expected and files_b == files_a else ["the changed files are not the eight"]

    # 2. E50a's three outcomes, twice
    by_date, by_relation = Counter(), Counter()
    unresolved_date, unresolved_rel = [], []
    for row_id in sorted(before):
        b_id = before[row_id]["provenance"].get("identity") or {}
        a_id = after[row_id]["provenance"].get("identity") or {}
        former = [one["sha256"] for one in after[row_id]["provenance"].get("formerIdentities") or []]
        date_former = [sha for sha in former if sha not in repaired_from]
        for counter, names, pool in ((by_date, unresolved_date, date_former), (by_relation, unresolved_rel, former)):
            if json.dumps(b_id, sort_keys=True) == json.dumps(a_id, sort_keys=True):
                counter["unchanged"] += 1
            elif b_id.get("kind") == "file" and b_id.get("sha256") in pool:
                counter["resolved"] += 1
            else:
                counter["unresolved"] += 1
                names.append(row_id)
    say()
    say("## 2. E50a's three outcomes")
    say(f"   by E50a's date proof alone: {dict(sorted(by_date.items()))}; unresolved: {unresolved_date}")
    say(f"   with the repair relation:   {dict(sorted(by_relation.items()))}; unresolved: {unresolved_rel}")
    if sorted(unresolved_date) != sorted(EIGHT) or by_date["resolved"] != 0:
        faults.append("the date-proof outcome is not 8 unresolved, 0 resolved")
    if unresolved_rel != [CUT] or by_relation["resolved"] != 7:
        faults.append("the relation outcome is not 7 resolved, the cut unresolved")

    # 3. rows outside the eight, and the eight's moved fields
    version_moved = sum(1 for i in before if (before[i]["provenance"].get("converter") or {}).get("version")
                        != (after[i]["provenance"].get("converter") or {}).get("version"))
    other_moved = [i for i in before if i not in EIGHT and without_version(before[i]) != without_version(after[i])]
    former_moved = [i for i in before if i not in SEVEN and before[i]["provenance"].get("formerIdentities") != after[i]["provenance"].get("formerIdentities")]
    say()
    say("## 3. the rows")
    normaliser_moved = [i for i in before if ((before[i]["provenance"].get("converter") or {}).get("normaliser") or {}).get("version")
                        != ((after[i]["provenance"].get("converter") or {}).get("normaliser") or {}).get("version")]
    say(f"   provenance.converter.version moved on {version_moved} rows; provenance.converter.normaliser.version on {len(normaliser_moved)} {normaliser_moved}"
        " (both `convert.tool_fingerprint()[:12]`, which moved with convert.py)")
    say(f"   rows outside the eight with anything else moved: {len(other_moved)} {other_moved[:10]}")
    say(f"   rows outside the seven whose formerIdentities moved: {len(former_moved)} {former_moved[:10]}")
    if other_moved or former_moved:
        faults.append("rows outside the eight moved")

    def moved_fields(a: dict, b: dict, prefix: str = "") -> list[str]:
        out = []
        for key in sorted(set(a) | set(b)):
            if a.get(key) == b.get(key):
                continue
            if isinstance(a.get(key), dict) and isinstance(b.get(key), dict):
                out += moved_fields(a[key], b[key], f"{prefix}{key}.")
            else:
                out.append(f"{prefix}{key}")
        return out

    for i in EIGHT:
        say(f"   {i}: moved {moved_fields(before[i], after[i])}")

    # 4. the consumers the build writes
    say()
    say("## 4. the consumers")
    for i in EIGHT:
        b, a = before[i], after[i]
        say(f"   {i}: tags tempo-defaulted {'tempo-defaulted' in (b.get('tags') or [])} -> {'tempo-defaulted' in (a.get('tags') or [])}; "
            f"tempoBpm {b.get('tempoBpm')} -> {a.get('tempoBpm')}; level {b.get('level')} -> {a.get('level')}")
        say(f"      facts.tempo {b['provenance']['facts'].get('tempo')} -> {a['provenance']['facts'].get('tempo')}")
        say(f"      untrusted demands {(b['provenance']['facts'].get('demands') or {}).get('untrusted')} -> {(a['provenance']['facts'].get('demands') or {}).get('untrusted')}")
        say(f"      identity {b['provenance']['identity'].get('sha256', '')[:12]} -> {a['provenance']['identity'].get('sha256', '')[:12]}; "
            f"formerIdentities {[x['sha256'][:12] for x in b['provenance'].get('formerIdentities') or []]} -> "
            f"{[x['sha256'][:12] for x in a['provenance'].get('formerIdentities') or []]}")
    block_b = before[CUT]["provenance"].get("excerpt") or {}
    block_a = after[CUT]["provenance"].get("excerpt") or {}
    say(f"   the Wabash approval: before stale {block_b.get('stale')}, parentSha256 {str(block_b.get('parentSha256'))[:12]}; "
        f"after stale {block_a.get('stale')}, parentSha256 {str(block_a.get('parentSha256'))[:12]}; approvedCutVersion {block_a.get('approvedCutVersion')}, cutVersion {block_a.get('cutVersion')}")
    decisions = [json.loads(line) for line in (W / "content/review/decisions.jsonl").read_text(encoding="utf-8").splitlines() if line.strip()]
    for event in decisions:
        a_id = after.get(event["item"], {}).get("provenance", {}).get("identity")
        say(f"   D2 decision on {event['item']} ({event['identity']['kind']}): bound to the after identity {review.same_identity(event['identity'], a_id)}")
    for repair in repairs:
        a_row = after[repair["id"]]
        say(f"   repair {repair['id']}: the after row's identity is `to` {a_row['provenance']['identity'].get('sha256') == repair['to']}; "
            f"its formerIdentities {[x['sha256'][:12] for x in a_row['provenance'].get('formerIdentities') or []]} (the relation names {repair['from'][:12]}); "
            f"the old identity a current identity anywhere: {any((r['provenance'].get('identity') or {}).get('sha256') == repair['from'] for r in after.values())}")

    # 5. the first bar
    say()
    say("## 5. the first bar of each, before -> after")
    for i in EIGHT:
        say(f"   {i}:\n      before: {first_bar(BEFORE / before[i]['file'])}\n      after:  {first_bar(AFTER / after[i]['file'])}")
    say()
    say(f"{len(faults)} fault(s) {faults}")
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main())
