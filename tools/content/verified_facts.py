#!/usr/bin/env python3
"""
The shared loader of the verified facts store (`content/sources/verified-facts.json`). The store has one record type: a
fact about printed bars of one catalogue score, established by a named method. A row is kept only while the score's
file is the one it was established on. Its `about` says the rest.

**Two kinds, one file, no reads across kinds.** This module is plumbing:
- it loads the rows;
- it derives the staleness every kind shares (the row's `identity` against the catalogue's current file identity);
- it hands each row to its own kind's validation and checker.

The kinds:
- `hand` (HD2): `tools/content/verified_hand.py` stays the hand-kind module. Its `check_hand_fact` is the hand
  validation this loader delegates to, and its readers (`hand_facts_for`, `verified_hands`) are what the build's bridge
  calls for the model's override path. It is kept as its own module rather than folded in because it is the build twin
  of the app's hand reader (`app/src/curriculum/verifiedFacts.ts`), landed and reviewed with it, and folding it would put
  both kinds' rules in one file where a reader could reach across.
- `demand` (CD1): validated here (`demand_shape`); its claim checker is `passages.py`'s, registered through `register`.
  It is read only by the build's claim path (`claims.status_of` through `passages.current_facts`).

**A row** (the shared shape):
- `item`;
- `identity`: the file identity as the catalogue records it, `{"kind": "file", "sha256": ...}`, null on a `demand` row
  not yet proved;
- `bars`: printed bar numbers, inclusive;
- `staff` and `voice` (null where not per voice);
- `kind`;
- `fact`: for `hand`, `L` or `R`; for `demand`, `{"demand": id, "hand": "L" | "R"}`, the demand and the hand it was
  established on;
- `rungs`: for `demand`, the rungs it proves the demand for; null on `hand`;
- `proof`: method, date, evidence, plus what a kind's checker needs.

`stale` is derived, never authored.

    python tools/content/verified_facts.py    # each row: current, refused or stale, and why
"""
from __future__ import annotations

import json
import re
import sys
from collections.abc import Callable
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

REPO = HERE.parents[1]
FACTS_FILE = REPO / "content" / "sources" / "verified-facts.json"
BUILT = REPO / "app" / "public" / "content"

KINDS = ("hand", "demand")
FIELDS = ("item", "identity", "bars", "staff", "voice", "kind", "fact", "rungs", "proof")
_SHA256 = re.compile(r"^[0-9a-f]{64}$")

#: `kind -> checker(row, item) -> [reasons]`: what a kind adds to the shared identity check (`register`).
KIND_CHECKS: dict[str, Callable[[dict, dict | None], list[str]]] = {
    # A hand row is current exactly while its file is (HD2's rule): nothing beyond the identity check.
    "hand": lambda _row, _item: [],
}


def register(kind: str, checker: Callable[[dict, dict | None], list[str]]) -> None:
    """A kind's own staleness checker (`passages.py` registers `demand`)."""
    KIND_CHECKS[kind] = checker


def load(path: Path = FACTS_FILE) -> list[dict]:
    return list(json.loads(path.read_text(encoding="utf-8"))["facts"])


def identity_of(item: dict | None) -> str | None:
    """The catalogue row's file identity (`provenance.identity.sha256`), or None."""
    identity = (((item or {}).get("provenance") or {}).get("identity") or {})
    return identity.get("sha256") if identity.get("kind") == "file" else None


def row_identity(row: dict) -> str | None:
    identity = row.get("identity")
    return identity.get("sha256") if isinstance(identity, dict) and identity.get("kind") == "file" else None


def name_of(row: dict) -> str:
    """A row's name in a message: the item, the bars, and what it says."""
    fact = row.get("fact")
    what = (fact or {}).get("demand") if row.get("kind") == "demand" and isinstance(fact, dict) else f"hand {fact}"
    first, last = (list(row.get("bars") or []) + [None, None])[:2]
    return f"{row.get('item')}@bars={first}-{last} {what}"


def demand_shape(row: dict) -> list[str]:
    """The `demand` kind's validation (CD1)."""
    out = []
    missing = [field for field in FIELDS if field not in row]
    if missing:
        out.append(f"missing {missing}")
    extra = [field for field in row if field not in FIELDS and field != "stale"]
    if extra:
        out.append(f"fields the record type does not have: {extra}")
    identity = row.get("identity")
    if identity is not None and not (row_identity(row) and _SHA256.match(row_identity(row) or "")):
        out.append("`identity` is null (not yet proved) or a file identity, as the catalogue records it")
    bars = row.get("bars")
    if not (isinstance(bars, list) and len(bars) == 2 and all(isinstance(b, int) and not isinstance(b, bool) for b in bars)
            and bars[0] <= bars[1]):
        out.append(f"bars {bars!r} are not [first, last] printed numbers in order")
    if row.get("staff") not in (1, 2) or isinstance(row.get("staff"), bool):
        out.append(f"staff {row.get('staff')!r} is not 1 or 2")
    fact = row.get("fact")
    if not (isinstance(fact, dict) and isinstance(fact.get("demand"), str) and fact.get("hand") in ("L", "R")):
        out.append("a demand row's fact is {demand, hand}")
    if not isinstance(row.get("rungs"), list):
        out.append("a demand row's rungs is a list (empty where it proves the demand for no rung yet)")
    proof = row.get("proof")
    if not (isinstance(proof, dict) and isinstance(proof.get("evidence"), str)):
        out.append("a demand row's proof names its evidence (its method and date are written when it is proved)")
    return out


def shape_errors(row: dict) -> list[str]:
    """Why the row could never be read by its kind: an authored `stale`, an unknown kind, or the kind's own rules."""
    if "stale" in row:
        return ["`stale` is derived, never authored"]
    kind = row.get("kind")
    if kind == "demand":
        return demand_shape(row)
    if kind == "hand":
        import verified_hand

        try:
            verified_hand.check_hand_fact(row, 0)
        except verified_hand.VerifiedFactsError as error:
            return [str(error).split(": ", 1)[-1]]
        return []
    return [f"kind {kind!r} is not one of {list(KINDS)}"]


def hand_conflicts(rows: list[dict], identity: dict[str, str | None] | None = None) -> list[str]:
    """
    The `hand` kind's set rule (the reviewer, `docs/review/responses/bf57baca.md` §5): two current hand rows for the same
    item, staff and voice whose printed bars overlap and whose hands disagree are refused, both named, never resolved by
    file order. Current means each row's identity is the item's file identity in `identity` (`{item: sha256}`); without
    `identity`, every row is taken as current. Two overlapping rows that agree are tolerated: they say the same thing,
    and either one going stale leaves the other's statement standing on its own proof.
    """
    live = [
        (index, row) for index, row in enumerate(rows)
        if row.get("kind") == "hand" and (identity is None or row_identity(row) == identity.get(row.get("item")))
    ]
    out = []
    for at, (i, a) in enumerate(live):
        for j, b in live[at + 1:]:
            if (a["item"], a["staff"], a["voice"]) != (b["item"], b["staff"], b["voice"]):
                continue
            if a["bars"][1] < b["bars"][0] or b["bars"][1] < a["bars"][0] or a["fact"] == b["fact"]:
                continue
            first, last = max(a["bars"][0], b["bars"][0]), min(a["bars"][1], b["bars"][1])
            out.append(f"verified-facts.json rows {i} and {j} (hand): {a['item']} staff {a['staff']} voice {a['voice']} "
                       f"bars {first}-{last} are {a['fact']} in one and {b['fact']} in the other; refused, never resolved "
                       f"by file order")
    return out


def identity_reasons(row: dict, item: dict | None) -> list[str]:
    """The check every kind shares: proved at all, and on the file the catalogue holds now."""
    if row_identity(row) is None or not (row.get("proof") or {}).get("date"):
        return ["never proved"]
    if item is None:
        return [f"{row.get('item')} is not in the catalogue"]
    if row_identity(row) != identity_of(item):
        return ["the file identity changed since it was proved"]
    return []


def stale_reasons(row: dict, item: dict | None) -> list[str]:
    """Why the row does not count on this catalogue; empty when it is current. The `stale` field, derived."""
    out = identity_reasons(row, item)
    if out == ["never proved"]:
        return out
    checker = KIND_CHECKS.get(row.get("kind"))
    if checker is None:
        out.append(f"no checker for kind {row.get('kind')!r}")
    else:
        out.extend(checker(row, item))
    return out


def current(catalog: list[dict], kind: str, rows: list[dict] | None = None) -> list[dict]:
    """The current rows of one kind on this catalogue, each with its derived `stale: false`. One kind per call."""
    by_id = {entry["id"]: entry for entry in catalog}
    out = []
    for row in load() if rows is None else rows:
        if row.get("kind") != kind:
            continue
        if not shape_errors(row) and not stale_reasons(row, by_id.get(row.get("item"))):
            out.append({**row, "stale": False})
    return out


def main() -> int:
    # Run as a script this file is `__main__`: read through the module `passages.py` imports, where it registers the
    # demand checker.
    import passages

    shared = passages.VF
    catalog = {entry["id"]: entry for entry in json.loads((BUILT / "catalog.json").read_text(encoding="utf-8"))}
    for row in shared.load():
        errors = shared.shape_errors(row)
        reasons = errors or shared.stale_reasons(row, catalog.get(row.get("item")))
        print(f"{name_of(row)}: {'current' if not reasons else ('refused: ' if errors else 'stale: ') + '; '.join(reasons)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
