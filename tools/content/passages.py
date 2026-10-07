#!/usr/bin/env python3
"""
Verified passage facts: the `demand` rows of the verified facts store (`content/sources/verified-facts.json`, read by
`verified_facts.py`). CD1, the brief's §3a; `docs/review/responses/33497357.md` §2. They are the second of the two
proofs that establish a curated-only demand (`opportunity-density.json`'s `curatedOnly`: the habanera and the tresillo).

**What a fact is.** A named passage of one catalogue item (exact printed bars, the MusicXML measure numbers, so Por Una
Cabeza's 1-14 are the bars after its pickup numbered 0), the staff it is read on, the demand and the hand it was
established on (`fact`), and the rungs it proves that demand for (`rungs`). The source that names the passage is the
proof's `evidence` pointer.

**When it counts.** Only when it is current: the store's identity check (the row's `identity` is the catalogue row's
file identity), and this module's demand checker. The checker needs:
- the proof was written by `verify` for the same bars, staff, demand and hand as the row says now;
- under the same definition version (`definition_version`, CD1a): the build's own measurement fingerprint
  (`demands.definition_fingerprint()`: the app's detectors, the model they read with its hand rule, the vocabulary, the
  bridge and the lockfile that pins the engraver; the one list, so whatever re-measures the catalogue stales a proof
  too), with the witness (`cells.py`) and its partitura pin, which only a passage proof reads;
- with the model measured as it is now: a one-staff file under the same declared hand (HD1, `build.declared_hand`,
  recorded as `declaredHand`; null for a file of two staves, which the extractor gives no declaration), and a two-staff
  file with the same verified hands (HD2, recorded as `hands`), so a catalogue or provenance change that moves the hand
  goes stale with the score bytes unchanged;
- with the app's detector and the independent witness agreeing on every bar of the passage.

Any change makes it stale, and it counts for nothing until `verify` runs again. `claims.status_of` counts a current fact
only for its exact item, rung and demand (`current_facts`): never a target, never an incidental occurrence, never
another bar of the piece. The claim is "this teaching passage contains the onset cell", never that the piece is in the
style, nor anything heard.

**Who writes it.** Only `verify`, which measures the passage through the bridge (`demands.measure_opportunities`, with
the row's declared hand for a one-staff file, HD1), reads it with the witness (`cells.py`), and writes the identity and
the proof only where the two agree on every bar.

    python tools/content/passages.py                    # each demand fact: current, or why stale
    python tools/content/passages.py --verify [ITEM]    # measure and witness, write the proofs that agree
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import demands  # noqa: E402
import verified_facts as VF  # noqa: E402

REPO = HERE.parents[1]
BUILT = REPO / "app" / "public" / "content"

#: What a passage proof reads beyond the build's measurement fingerprint (`demands.definition_fingerprint()`, never
#: copied here): the witness, and the line of the requirements file that pins its library. The pin's line, not the
#: whole file: another library's pin changes nothing the witness reads.
WITNESS = "tools/content/cells.py"
WITNESS_PIN = ("tools/content/requirements.txt", "partitura")

#: The fields of a passage a proof copies: a change to any of them makes the fact stale.
PINNED = ("bars", "staff", "demand", "hand")

METHOD = "the app's detector through the bridge and the partitura witness (cells.py), agreeing on every bar"


def witness_version() -> str:
    """Twelve hex digits over the witness's bytes (line endings normalised) and its library's pin line."""
    digest = hashlib.sha256()
    path = REPO / WITNESS
    digest.update(WITNESS.encode("utf-8"))
    digest.update(path.read_bytes().replace(b"\r\n", b"\n") if path.exists() else b"(missing)")
    rel, library = WITNESS_PIN
    pins = REPO / rel
    lines = pins.read_text(encoding="utf-8").splitlines() if pins.exists() else []
    pin = [line.strip() for line in lines if re.match(rf"\s*{library}\s*([=<>!~;\[]|$)", line, re.IGNORECASE)]
    digest.update(rel.encode("utf-8"))
    digest.update("\n".join(pin).encode("utf-8") if pin else b"(missing)")
    return digest.hexdigest()[:12]


def definition_version() -> str:
    """
    `<measurement fingerprint>+<witness version>`: the build's own fingerprint (`demands.definition_fingerprint()`, the
    one its measurement cache is keyed on) and the witness's (`witness_version`). Two parts, so a stale reason says which
    side moved.
    """
    return f"{demands.definition_fingerprint()}+{witness_version()}"


def version_reasons(was: str | None, now: str) -> list[str]:
    """Why a proof's definition version is not the current one, by side; empty when it is."""
    if was == now:
        return []
    old, new = (was or "").split("+"), now.split("+")
    if len(old) != 2 or len(new) != 2:
        return [f"proved under another definition version, not the build's measurement fingerprint with the witness's "
                f"({was} -> {now})"]
    out = []
    if old[0] != new[0]:
        out.append(f"the build's measurement fingerprint changed (the detectors, the model and its hand rule, the "
                   f"vocabulary, the bridge or the engraver's pin: {old[0]} -> {new[0]})")
    if old[1] != new[1]:
        out.append(f"the witness or its partitura pin changed ({old[1]} -> {new[1]})")
    return out


def declared_hand_of(item: dict) -> str | None:
    """
    The declared hand a proof of `item`'s file records (HD1): `build.declared_hand(item)`, the hand the bridge gives
    every note of a one-staff file; None for a file of two or more staves, which the extractor gives no declaration
    (`extractScoreModel`'s `handDeclarationFor`), so a declaration moving there changes nothing measured.
    """
    import build

    staves = (item.get("notation") or {}).get("staves")
    return None if isinstance(staves, int) and staves > 1 else build.declared_hand(item)


def view(row: dict) -> dict:
    """A demand row as a passage: its item, bars, staff, demand, hand and rungs."""
    fact = row.get("fact") or {}
    return {"item": row.get("item"), "bars": row.get("bars"), "staff": row.get("staff"), "demand": fact.get("demand"),
            "hand": fact.get("hand"), "rungs": row.get("rungs") or [], "name": VF.name_of(row)}


def demand_reasons(row: dict, item: dict | None, version: str | None = None) -> list[str]:
    """The demand checker: what makes a proved demand row stale beyond its file identity."""
    version = definition_version() if version is None else version
    passage = view(row)
    verified = (row.get("proof") or {}).get("verified") or {}
    out = []
    for field in PINNED:
        if verified.get(field) != passage.get(field):
            out.append(f"the {field} changed since it was proved ({verified.get(field)!r} -> {passage.get(field)!r})")
    out.extend(version_reasons(verified.get("version"), version))
    if verified.get("app") != verified.get("witness") or verified.get("disagree"):
        out.append("the app and the witness did not agree when it was proved")
    numbers = list(range(passage["bars"][0], passage["bars"][1] + 1))
    if sorted(verified.get("numbers") or []) != numbers:
        out.append("the proof does not cover every bar of the passage")
    if item is not None:
        # The file's verified hands (HD2) are part of the model the proof measured: the hand path's own reader says
        # which are current now, and a change to them is a change to what was proved.
        import verified_hand

        if (verified.get("hands") or []) != verified_hand.verified_hands(item["id"], VF.identity_of(item)):
            out.append("the file's verified hands changed since it was proved")
        # So is a one-staff file's declared hand (HD1), which the catalogue and its provenance hold, not the score's
        # bytes: the identity check cannot see it move.
        declared = declared_hand_of(item)
        if verified.get("declaredHand") != declared:
            out.append(f"the declared hand changed since it was proved ({verified.get('declaredHand')!r} -> {declared!r})")
    return out


VF.register("demand", demand_reasons)


def stale_reasons(row: dict, item: dict | None, version: str | None = None) -> list[str]:
    """Why a demand row does not count on this catalogue and these definitions; empty when it is current."""
    out = VF.identity_reasons(row, item)
    return out if out == ["never proved"] else out + demand_reasons(row, item, version)


def demand_rows(rows: list[dict] | None = None) -> list[dict]:
    return [row for row in (VF.load() if rows is None else rows) if row.get("kind") == "demand"]


def current_facts(catalog: list[dict], version: str | None = None, rows: list[dict] | None = None
                  ) -> dict[tuple[str, str, str], dict]:
    """`{(item, rung, demand): row}` for every current demand fact: what `claims.status_of` may count, and nothing else."""
    by_id = {entry["id"]: entry for entry in catalog}
    out: dict[tuple[str, str, str], dict] = {}
    for row in demand_rows(rows):
        if VF.shape_errors(row) or stale_reasons(row, by_id.get(row.get("item")), version):
            continue
        for rung in row.get("rungs") or []:
            out[(row["item"], rung, row["fact"]["demand"])] = row
    return out


def findings(catalog: list[dict], curriculum: dict, rows: list[dict] | None = None,
             version: str | None = None) -> tuple[list[str], list[str]]:
    """
    `(errors, warnings)` for the build (`validate.py`), over the `demand` rows only (the hand rows are the hand path's,
    `verified_hand.py`). Errors: a demand row its kind's rules refuse, and a demand fact whose item is not in the catalogue, whose rung is not a rung or does not list the item, or whose demand is not a
    curated-only cell: a fact that could never prove what it names. Warnings: every stale row, with why (it counts for
    nothing until it is proved again).
    """
    import cells

    by_id = {entry["id"]: entry for entry in catalog}
    options: dict[str, set[str]] = {}
    for stage in curriculum.get("stages", []):
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                options[lesson["id"]] = set(lesson.get("exerciseOptions", [])) | set(lesson.get("songOptions", []))
    errors: list[str] = []
    warnings: list[str] = []
    for row in demand_rows(rows):
        name = VF.name_of(row)
        shape = VF.shape_errors(row)
        if shape:
            errors.append(f"verified-facts.json {name}: {'; '.join(shape)}")
            continue
        if row["item"] not in by_id:
            errors.append(f"verified-facts.json {name}: {row['item']} is not in the catalogue")
            continue
        if row["fact"]["demand"] not in cells.CELL_OF:
            errors.append(f"verified-facts.json {name}: {row['fact']['demand']} is not a curated-only cell")
        for rung in row["rungs"]:
            if rung not in options:
                errors.append(f"verified-facts.json {name}: {rung} is not a rung")
            elif row["item"] not in options[rung]:
                errors.append(f"verified-facts.json {name}: {rung} does not list {row['item']}")
        reasons = stale_reasons(row, by_id.get(row["item"]), version)
        if reasons:
            warnings.append(f"WARNING (verified facts, CD1): {name} counts for nothing: {'; '.join(reasons)}")
    return errors, warnings


def verification_of(row: dict, item: dict, path: Path, positions: dict, version: str) -> dict:
    """
    The `proof.verified` block `verify` writes for one demand row, from the bridge's positions and the witness: the
    passage's pinned fields, the version, the printed-bar indexes each side found the cell at within the passage, and the
    bars where they disagree. A pure function of its inputs, so a test can hold it to the witness.
    """
    import cells

    passage = view(row)
    numbers = list(range(passage["bars"][0], passage["bars"][1] + 1))
    bars = cells.bar_cells(path, passage["staff"])
    index_of: dict[str, int] = {}
    for bar in bars:
        index_of.setdefault(str(bar["number"]), bar["index"])
    missing = [n for n in numbers if str(n) not in index_of]
    indexes = [index_of[str(n)] for n in numbers if str(n) in index_of]
    cell = cells.CELL_OF[passage["demand"]]
    side = 0 if passage["staff"] == 1 else 1
    app_rows = {int(bar): counts for bar, counts in (positions.get(passage["demand"]) or {}).items()}
    app = [i for i in indexes if app_rows.get(i, [0, 0])[side] == cells.PLACES[cell] and app_rows.get(i, [0, 0])[1 - side] == 0]
    witness = [b["index"] for b in bars if b["index"] in indexes and b["cell"] == cell]
    disagree = cells.disagreements(path, positions, passage["demand"], passage["staff"], indexes)
    every = [i for i in indexes if i in app and i in witness]
    return {
        **{field: passage[field] for field in PINNED},
        "version": version,
        "numbers": [n for n in numbers if n not in missing and index_of[str(n)] in every],
        "app": app,
        "witness": witness,
        "disagree": disagree,
    }


def proved(row: dict, item: dict, verified: dict, today: str) -> dict:
    """The row with its identity and proof written, the evidence pointer kept."""
    evidence = (row.get("proof") or {}).get("evidence")
    identity = ((item.get("provenance") or {}).get("identity") or {})
    return {**row, "identity": {"kind": "file", "sha256": identity.get("sha256")},
            "proof": {"method": METHOD, "date": today, "evidence": evidence, "verified": verified}}


def _dump(row: dict) -> str:
    """One demand row in the store's layout: scalar fields inline, `proof` expanded, the proof's lists inline."""
    fields = [f'      "{key}": {json.dumps(row[key], ensure_ascii=False, separators=(", ", ": "))}'
              for key in ("item", "identity", "bars", "staff", "voice", "kind", "fact", "rungs")]
    inner = []
    for key, value in (row.get("proof") or {}).items():
        if key == "verified" and isinstance(value, dict):
            parts = [f'          "{k}": {json.dumps(v, ensure_ascii=False, separators=(", ", ": "))}' for k, v in value.items()]
            inner.append('        "verified": {\n' + ",\n".join(parts) + "\n        }")
        else:
            inner.append(f'        "{key}": {json.dumps(value, ensure_ascii=False)}')
    fields.append('      "proof": {\n' + ",\n".join(inner) + "\n      }")
    return "{\n" + ",\n".join(fields) + "\n    }"


def rewrite_demand_rows(text: str, rows: list[dict]) -> str:
    """
    The store's text with each `demand` row replaced by `rows`' row at the same index, every other byte kept: the
    `about`, the hand rows and the layout are the hand path's and are never re-serialised here.
    """
    decoder = json.JSONDecoder()
    start = text.index("[", text.index('"facts"')) + 1
    spans = []
    at = start
    while True:
        while text[at] in " \t\r\n,":
            at += 1
        if text[at] == "]":
            break
        obj, end = decoder.raw_decode(text, at)
        spans.append((at, end, obj))
        at = end
    assert len(spans) == len(rows), "the number of rows changed"
    out, last = [], 0
    for (begin, end, old), new in zip(spans, rows):
        if old.get("kind") != "demand":
            assert old == new, "a non-demand row changed"
            continue
        out.append(text[last:begin])
        out.append(_dump(new))
        last = end
    out.append(text[last:])
    merged = "".join(out)
    assert json.loads(merged)["facts"] == rows
    return merged


def verify(only: str | None = None) -> int:
    """Measure and witness every demand row (or one item's), and write the proofs where the two agree on every bar."""
    raw = VF.FACTS_FILE.read_bytes().decode("utf-8")
    data = json.loads(raw)
    catalog = {entry["id"]: entry for entry in json.loads((BUILT / "catalog.json").read_text(encoding="utf-8"))}
    version = definition_version()
    today = datetime.date.today().isoformat()
    failed = 0
    for index, row in enumerate(data["facts"]):
        if row.get("kind") != "demand" or (only and row["item"] != only):
            continue
        name = VF.name_of(row)
        item = catalog.get(row["item"])
        if item is None:
            print(f"{name}: {row['item']} is not in the built catalogue")
            failed += 1
            continue
        path = BUILT / item["file"]
        # Measured as the build measures it (`build.attach_demands`): the row's declared hand (HD1) and the file's
        # current verified hands (HD2), each read by its own path (`build.declared_hand`, `verified_hand`), and each
        # recorded in the proof (`declaredHand` as the extractor applies it: a one-staff file's only).
        import build
        import verified_hand

        hands = verified_hand.verified_hands(item["id"], VF.identity_of(item))
        measured = demands.measure_each([path], declared_hand=build.declared_hand(item),
                                        verified_hands={str(path): hands} if hands else None)[str(path)]
        if "error" in measured:
            print(f"{name}: the app could not measure the file: {measured['error']}")
            failed += 1
            continue
        verified = {**verification_of(row, item, path, measured.get("positions") or {}, version), "hands": hands,
                    "declaredHand": declared_hand_of(item)}
        if verified["disagree"] or verified["app"] != verified["witness"] or \
                len(verified["numbers"]) != row["bars"][1] - row["bars"][0] + 1:
            print(f"{name}: NOT proved: app {verified['app']}, witness {verified['witness']}, disagree at {verified['disagree']}")
            failed += 1
            continue
        data["facts"][index] = proved(row, item, verified, today)
        print(f"{name}: proved on every bar ({row['bars'][0]}-{row['bars'][1]}), bridge indexes {verified['app']}")
    plain = raw.replace("\r\n", "\n")
    text = rewrite_demand_rows(plain, data["facts"])
    VF.FACTS_FILE.write_bytes((text.replace("\n", "\r\n") if "\r\n" in raw else text).encode("utf-8"))
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--verify", nargs="?", const="", default=None, metavar="ITEM")
    args = parser.parse_args()
    if args.verify is not None:
        return verify(args.verify or None)
    catalog = {entry["id"]: entry for entry in json.loads((BUILT / "catalog.json").read_text(encoding="utf-8"))}
    for row in demand_rows():
        reasons = stale_reasons(row, catalog.get(row["item"]))
        print(f"{VF.name_of(row)}: {'current' if not reasons else 'stale: ' + '; '.join(reasons)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
