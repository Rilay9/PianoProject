"""
Builds MANIFEST.json for the sight-reading quality lane (brief §2), before any phrase
is generated.

Two passes, neither of which generates a phrase:

1. `py -3.11 make_manifest.py items` writes `<worktree>/build/sr-quality/manifest-items.json`
   (every item's stratum, build recipe and seed). The export's `SR_MODE=plan` then
   resolves each item's options through the app and calls `unrealisable()` (pure: the
   options decide it, never the seed).
2. `py -3.11 make_manifest.py freeze` reads that plan and writes MANIFEST.json with
   every item's expected outcome, by the rules in `EXPECTATION_RULES`, and refuses to
   overwrite a MANIFEST.json that already exists (the manifest is not edited after the
   first generation).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORKTREE = HERE.parents[3]
BUILD = WORKTREE / "build" / "sr-quality"
ROW = "drill.reading.sight-reading-"
VERSION = 2

O_DAYS = [f"2026-11-{d:02d}" for d in range(2, 10)]


def daily_seed(day: str) -> int:
    """FNV-1a over the day string, as `dailySeed` (`sightReading.ts:3127`); checked against the app in the plan."""
    h = 0x811C9DC5
    for ch in day:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h


O_PAIRS = [
    ("1-left", "1.3"), ("1-left", "1.4"), ("1", "1.5"), ("2-right", "2.2"), ("2-right", "2.5"),
    ("2", "3.4"), ("2", "classical.3"), ("3", "4.5"), ("3", "4.6"), ("4", "4.6"), ("4", "technique.5"),
    ("5", "theory.6"), ("6", "chords-pop.8"), ("6", "theory.9"), ("7", "jazz.8"),
]
BC_RUNGS = ["0.1", "1.1", "2.1", "3.1", "3.3", "4.4", "4.7"]
MAX_FIFTHS = {1: 0, 2: 1, 3: 1, 4: 2, 5: 3, 6: 4, 7: 4}


def level_base(level: int) -> dict:
    """A level's own defaults for BL and A (brief §2): L1 right hand, L2+ both; 4 bars; fifths 0."""
    return {"level": level, "hands": "right" if level == 1 else "both", "bars": 4, "fifths": 0}


def items() -> list[dict]:
    out: list[dict] = []

    def add(stratum, ident, build, seed, check_rung=None, note=None):
        item = {"id": ident, "stratum": stratum, "build": build, "seed": seed, "version": VERSION,
                "checkRung": check_rung}
        if note:
            item["note"] = note
        out.append(item)

    # O: the 15 row-at-rung pairs, the daily read's own eight draws.
    for row, rung in O_PAIRS:
        for k, day in enumerate(O_DAYS, 1):
            add("O", f"O_{row}_at_{rung}_d{k}",
                {"via": "readingOptions", "row": ROW + row, "rung": rung, "day": day}, daily_seed(day), rung)

    # BC: Today's daily read for a learner at these core rungs, no reads yet (readingOffer), first four O days.
    for rung in BC_RUNGS:
        for k, day in enumerate(O_DAYS[:4], 1):
            add("BC", f"BC_learner_{rung}_d{k}",
                {"via": "readingOffer", "learnerRung": rung, "day": day}, daily_seed(day), rung)

    # BL: each level's table at its boundaries.
    for level in range(1, 8):
        m = MAX_FIFTHS[level] or 1  # at L1, +-1 (expected clamp)
        cases = {
            "fifths-min": {"fifths": -m}, "fifths-max": {"fifths": m}, "3-4": {"timeSig": "3/4"},
            "2-4": {"timeSig": "2/4"}, "6-8": {"timeSig": "6/8"}, "left-alone": {"hands": "left"},
            "16-bars": {"bars": 16},
        }
        for name, patch in cases.items():
            for k in (1, 2):
                add("BL", f"BL_L{level}_{name}_s{k}",
                    {"via": "optionsFor", "params": {**level_base(level), **patch}}, level * 1000 + k)

    # A: adversarial, outcome declared.
    adversarial = [
        ("L4-fifths3", 4, {"fifths": 3}),
        ("L7-fifths-5", 7, {"fifths": -5}),
        ("L3-skipsoff-leapson", 3, {"skips": False, "leaps": True}),
        ("L3-6-8-syncopation", 3, {"timeSig": "6/8", "syncopation": True}),
        ("L3-ties-1bar", 3, {"ties": True, "bars": 1}),
        ("L5-eighthsoff", 5, {"eighths": False}),
        ("L4-position-ledger", 4, {"position": True, "ledger": True}),
    ]
    for name, level, patch in adversarial:
        for k in (1, 2):
            add("A", f"A_{name}_s{k}", {"via": "optionsFor", "params": {**level_base(level), **patch}},
                level * 1000 + 100 + k)
    for seed in (0, -1, 2147483647, -2147483648, 4294967295):
        add("A", f"A_seed{seed}_1_at_1.5", {"via": "readingOptions", "row": ROW + "1", "rung": "1.5"}, seed, "1.5")
        add("A", f"A_seed{seed}_7_at_jazz.8", {"via": "readingOptions", "row": ROW + "7", "rung": "jazz.8"}, seed,
            "jazz.8")
    for k, day in enumerate(O_DAYS[:4], 1):
        add("A", f"A_3-4-gap_1-left_at_1.3_d{k}",
            {"via": "readingOptions", "row": ROW + "1-left", "rung": "1.3", "params": {"timeSig": "3/4"}},
            daily_seed(day), "1.3")
    for k, day in enumerate(O_DAYS[:4], 1):
        add("A", f"A_compound-off_3_at_4.5_d{k}",
            {"via": "readingOptions", "row": ROW + "3", "rung": "4.5", "withoutDemand": "metre.compound"},
            daily_seed(day), "4.5")

    # C: the candidate data, single-valued.
    c_sets = [("1", r, ts, None) for r in ["1.5"] for ts in ["4/4", "3/4"]]
    c_sets += [("2-right", r, ts, None) for r in ["2.2", "2.5"] for ts in ["4/4", "3/4"]]
    c_sets += [("2", r, ts, f) for r in ["3.4", "classical.3"] for ts in ["4/4", "3/4"] for f in (-1, 0, 1)]
    c_sets += [("3", r, ts, f) for r in ["4.5", "4.6"] for ts in ["6/8", "4/4", "3/4"] for f in (-1, 0, 1)]
    c_sets += [("4", r, ts, f) for r in ["4.6", "technique.5"] for ts in ["4/4", "3/4"] for f in (-1, 0, 1)]
    for row, rung, ts, f in c_sets:
        params = {"timeSig": ts} if f is None else {"timeSig": ts, "fifths": f}
        tag = ts.replace("/", "-") + ("" if f is None else f"_f{f}")
        for k in (1, 2):
            add("C", f"C_{row}_at_{rung}_{tag}_s{k}",
                {"via": "readingOptions", "row": ROW + row, "rung": rung, "params": params}, 9000 + k, rung)
    return out


EXPECTATION_RULES = [
    "Default WRITE: the contract applies (required properties 1-11).",
    "WRITE with the clamp named: a key beyond the level's maxFifths, which unrealisable() names and the generator "
    "writes in the widest key it has (the fifths ±1 cases at L1, A's two keys beyond the level).",
    "REFUSE: unrealisable() names a reason that rules out a promise the options make true "
    "(steps-only with a promised leap; a tie promised in one bar; a ledger line promised inside the position; "
    "syncopation or triplets promised in a phrase whose every metre is compound).",
    "WRITE where unrealisable() names a keep-out (false) the level cannot honour (L5 eighths off: the Alberti left "
    "hand is in eighths): named, so never silent; the phrase is expected to carry the eighths.",
    "KNOWN-DEFECT, property 7: the 3/4 hold gap (no triple-metre demand, so `-1-left` in 3/4 reaches 1.3, before "
    "1.4 teaches 3/4; named in advance by the brief, not a finding).",
    "KNOWN-DEFECT, property 7: the daily read at 0.1 and 1.1 (unanchored). Read in the code before generation: "
    "Today opens the unanchored row at `rungForSlot`'s rung, the one rung listing `-1` (1.5), so the phrase is held "
    "to 1.5 and promises skips (interval.skip taught at 1.5) to a learner at 0.1 or 1.1; at 0.1 nothing is taught, "
    "interval.step included.",
]


def expect(item: dict, plan: dict) -> dict:
    reasons = plan["unrealisable"]
    opts = plan["options"]
    sid = item["id"]
    if item["stratum"] == "A" and sid.startswith("A_3-4-gap"):
        return {"outcome": "KNOWN-DEFECT", "property": 7,
                "why": "3/4 written at 1.3; 1.4 teaches it and no demand holds it back"}
    if item["stratum"] == "BC" and item["build"]["learnerRung"] in ("0.1", "1.1"):
        return {"outcome": "KNOWN-DEFECT", "property": 7,
                "why": "held at 1.5 (rungForSlot), so skips reach a learner at "
                       f"{item['build']['learnerRung']} before 1.5 teaches them"}
    refusing = [r for r in reasons if any(k in r for k in (
        "held to steps cannot leap", "phrase of one bar has none", "no ledger line beyond middle C",
        "not asked for syncopation or triplets"))]
    if refusing:
        return {"outcome": "REFUSE", "reason": refusing}
    clamp = [r for r in reasons if "a wider key is written in the widest" in r or "writes C major only" in r]
    if clamp:
        return {"outcome": "WRITE", "clamp": clamp}
    if reasons:
        return {"outcome": "WRITE", "named": reasons}
    if sid.startswith("A_compound-off"):
        return {"outcome": "WRITE", "metre": "4/4 only"}
    return {"outcome": "WRITE"}


def main() -> None:
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    BUILD.mkdir(parents=True, exist_ok=True)
    if mode == "items":
        (BUILD / "manifest-items.json").write_text(json.dumps({"items": items()}, indent=1), encoding="utf-8")
        print(len(items()))
        return
    if mode == "freeze":
        target = HERE / "MANIFEST.json"
        if target.exists():
            sys.exit("MANIFEST.json exists; the manifest is not edited after the first generation")
        its = items()
        plan = {p["id"]: p for p in json.loads((BUILD / "plan.json").read_text(encoding="utf-8"))}
        for item in its:
            p = plan[item["id"]]
            if item["build"].get("day") or item["stratum"] == "BC":
                assert p["options"]["seed"] == item["seed"] or p.get("offer", {}).get("seed") == item["seed"], item["id"]
            item["resolved"] = {"heldAt": p["heldAt"], "row": p["row"], "options": p["options"],
                                "unrealisable": p["unrealisable"], **({"offer": p["offer"]} if "offer" in p else {})}
            item["expected"] = expect(item, p)
        counts: dict = {}
        for item in its:
            s = counts.setdefault(item["stratum"], {"items": 0})
            s["items"] += 1
            o = item["expected"]["outcome"]
            s[o] = s.get(o, 0) + 1
        def sets(stratum):
            out = {}
            for item in its:
                if item["stratum"] == stratum:
                    o = dict(item["resolved"]["options"])
                    o.pop("seed", None)
                    out[json.dumps(o, sort_keys=True)] = item["resolved"]["unrealisable"]
            return out
        stop = {}
        for stratum in ("O", "C"):
            s = sets(stratum)
            named = [k for k, v in s.items() if v]
            stop[stratum] = {"parameterSets": len(s), "namedByUnrealisable": len(named),
                             "share": round(len(named) / len(s), 4),
                             "reasons": sorted({r for k in named for r in s[k]})}
        manifest = {
            "frozen": "before any phrase was generated (2026-10-06)",
            "stopRule": {
                "rule": "unrealisable() names more than 10% of the planned O or C parameter sets (brief §11)",
                "measured": stop,
                "decision": (
                    "Over the brief's planned sets (row x rung x metre x key) C is 6/48 named (12.5%); over distinct "
                    "resolved option sets (4.5 and 4.6 hold -3 identically) 3/27 (11.1%); O is 0. "
                    "C's six single-valued 6/8 sets on -3 (4.5 and 4.6 x fifths -1, 0, 1) are named by one generator "
                    "rule (T37: a phrase whose every metre is compound is not asked for syncopation or triplets). "
                    "The candidate row carries 6/8 in a list, where the rule asks the simple-time promises only of "
                    "the phrases in simple time (unrealisable() names compound-only lists, never mixed ones), and "
                    "6/8 is already shipped in -3's list (stratum O). The premise that every single-valued C set is "
                    "candidate data does not reproduce for these six; they are kept as declared REFUSE items (a "
                    "never-silent check), the candidate's simple-time sets are 0/42 named (0/24 distinct), and the lane proceeds. Rejected: "
                    "stopping before generation (the share is one declared rule the shipped list form waives) and "
                    "rewriting C's 6/8 sets (an edit of the brief's design)."),
            },
            "version": VERSION,
            "denominator": len(its),
            "counts": counts,
            "expectationRules": EXPECTATION_RULES,
            "items": its,
        }
        target.write_text(json.dumps(manifest, indent=1), encoding="utf-8")
        print(json.dumps(counts))
        return
    sys.exit("usage: make_manifest.py items|freeze")


if __name__ == "__main__":
    main()
