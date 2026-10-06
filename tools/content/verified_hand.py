"""
Verified hand facts: the build's reader of the `hand` rows of `content/sources/verified-facts.json`
(HD2; the reviewer's ruling, `docs/review/responses/hd2-corpus-diff.md` §2). The app reads the same rows
through `app/src/curriculum/verifiedFacts.ts`, by the same rules.

**Where it goes.** The shared loader (`tools/content/verified_facts.py`: identity staleness, the `demand`
rows' validation and a hook for `hand` validation) is the cells lane's (CD1), not yet in this tree when HD2
was built. This module is the `hand` half on its own, with the same row shape: `check_hand_fact` is the
hook's body, and `read_hand_facts`, `hand_facts_for` and `verified_hands` are what the build's bridge reads.
At landing they merge into the shared reader and `build.attach_demands` imports them from there.

**The boundary.** The store is one file shared by two kinds of row, and that is all they share: plumbing,
not a generic fact system. Each `kind` has its own validation, its own authority and its own reader, and no
consumer reads across kinds. `hand` rows are read here, only for the score model's override path (the
bridge's `verifiedHands`, so the build measures a file with the hands the Score screen plays); `demand` rows
(the cells seam's verified passages) are read only by the build's claim path, which defines their
validation. This module never reads, checks or returns a row of another kind and offers no generic "facts"
reader. A one-staff item's declared hand is not here: it stays in the catalogue row's provenance
(HD1, `build.declared_hand`).

**A hand row** says the notes printed in its bars (printed bar numbers, inclusive) on one staff in one voice
of one catalogue item's score are played by `fact`'s hand (`L` or `R`), where the model's compatibility
reading is established wrong, with the method, date and evidence (`proof`). It holds only for the file it
was established on: `identity` is that file's identity as the catalogue records it (`provenance.identity`,
the sha256 of the built bytes). A row whose identity is not the file's current one is **stale** and refused.
`stale` is derived, never authored; `rungs` is null on a hand row.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

STORE = Path(__file__).resolve().parents[2] / "content" / "sources" / "verified-facts.json"

_SHA256 = re.compile(r"^[0-9a-f]{64}$")


class VerifiedFactsError(ValueError):
    """A hand row the hand rules refuse, named by its index."""


def _whole(value: object) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and value >= 0


def check_hand_fact(row: dict, index: int) -> dict:
    """One `hand` row checked by the hand rules; raises naming the row."""
    def fail(why: str) -> None:
        raise VerifiedFactsError(f"verified-facts.json row {index} (hand): {why}")

    if "stale" in row:
        fail("`stale` is derived, never authored")
    if not isinstance(row.get("item"), str) or not row["item"]:
        fail("`item` must be a catalogue id")
    identity = row.get("identity")
    if not (isinstance(identity, dict) and identity.get("kind") == "file" and isinstance(identity.get("sha256"), str)
            and _SHA256.match(identity["sha256"])):
        fail("`identity` must be a file identity, as the catalogue records it")
    bars = row.get("bars")
    if not (isinstance(bars, list) and len(bars) == 2 and all(_whole(b) for b in bars) and bars[0] <= bars[1]):
        fail("`bars` must be [first, last] printed bar numbers, inclusive")
    if row.get("staff") not in (1, 2) or isinstance(row.get("staff"), bool):
        fail("`staff` must be 1 or 2")
    if not _whole(row.get("voice")):
        fail("`voice` must be a voice number")
    if row.get("fact") not in ("L", "R"):
        fail("`fact` must be `L` or `R`")
    if row.get("rungs", "missing") is not None:
        fail("`rungs` must be null on a hand fact")
    proof = row.get("proof")
    if not (isinstance(proof, dict) and all(isinstance(proof.get(k), str) for k in ("method", "date", "evidence"))):
        fail("`proof` must give the method, the date and the evidence")
    return row


def read_hand_facts(store: dict | None = None) -> list[dict]:
    """The store's `hand` rows, each checked; rows of other kinds are not read."""
    data = json.loads(STORE.read_text(encoding="utf-8")) if store is None else store
    facts = data.get("facts") if isinstance(data, dict) else None
    if not isinstance(facts, list):
        raise VerifiedFactsError("verified-facts.json: no `facts` list")
    return [check_hand_fact(row, i) for i, row in enumerate(facts) if isinstance(row, dict) and row.get("kind") == "hand"]


def hand_facts_for(item_id: str, sha256: str | None, facts: list[dict] | None = None) -> list[dict]:
    """
    The item's hand rows, each with a derived `stale`: true where the row's identity is not `sha256`,
    the item's current file identity (the build's sha256 of the built file).
    """
    rows = read_hand_facts() if facts is None else facts
    return [{**row, "stale": row["identity"]["sha256"] != sha256} for row in rows if row["item"] == item_id]


def verified_hands(item_id: str, sha256: str | None, facts: list[dict] | None = None) -> list[dict]:
    """The item's current verified hands, as the bridge hands them to the model; stale rows refused."""
    return [
        {"bars": list(row["bars"]), "staff": row["staff"], "voice": row["voice"], "hand": row["fact"]}
        for row in hand_facts_for(item_id, sha256, facts)
        if not row["stale"]
    ]
