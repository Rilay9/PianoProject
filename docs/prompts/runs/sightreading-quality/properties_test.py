"""
Property exploration of the sight-reading generator with Hypothesis (brief §5).

    py -3.11 properties_test.py edges        # writes <worktree>/build/sr-quality/hypothesis-edges.json
    py -3.11 properties_test.py curriculum   # the second pass: the rows' and the candidate's own space

Mechanism (the brief leaves it to the builder within its constraints): rolldown, from
app/node_modules, bundles `build/sr-quality/bundle/entry.ts` (re-exports of
app/src/engine/sightReading.ts and readingControls.ts) into `engine.mjs`; `sr_worker.mjs` runs
it in one long-lived Node process; each Hypothesis example is one JSON line to it. The bundle's
source sha (`git rev-parse HEAD` plus a hash of the two source files) is recorded. The checks
reuse check_corpus.py's partitura reading and detectors; nothing reads the generator's own
read-back or scorer.

Settings, fixed before the run: derandomize=True, database=None, deadline=None,
max_examples=300 per property.

The domain (each edge with its reason):

* `rows`: every shipped sight-reading row's params at every rung listing it (the values a
  shipped row writes), held to that rung's taught set as `readingOptions` holds them, with no
  move or with one READING_CONTROLS patch (`withDemand` / `withoutDemand`) on any vocabulary
  demand - every on/off patch the reader can ask for at a listing rung.
* `table`: the level table at and one step beyond its edges - level 1-7; hands R, L, both (L1
  both is a declared contradiction); bars 1-17 (1: a tie has no bar line to cross; 17: one beyond
  the BL stratum's 16); fifths from -(maxFifths+1) to maxFifths+1 (one beyond the clamp) or a
  shipped list; metres 2/4, 3/4, 4/4, 3/8, 6/8, 9/8, 12/8 or a shipped list (3/8, 9/8, 12/8
  were never asked by a row); any subset of the tri-state controls; a left-hand pattern or none.
* seeds: the whole 32-bit range, both signs, plus 0, -1, 2**31-1, -2**31, 2**32-1.

Properties:

* H1, never silent: a written phrase is in a key and metre as asked (or the clamp is named by
  `unrealisable()`), keeps every promise and every keep-out unless `unrealisable()` names it;
  a refusal carries reasons. Named in advance as known, from stratum O of run 1 (before this
  file ran): T37's waiver of syncopation and triplets for a compound phrase drawn from a mixed
  metre list, which `unrealisable()` names only for a compound-only list. It is counted, not
  asserted. The dotted quarter joined the waiver after the first curriculum pass (C4b: "in
  compound time it is the beat"), and the naming matcher (`check_corpus.names`) was widened
  twice after first passes whose counterexamples were the matcher's own misses; both first
  passes are kept beside the final ones (REPORT.md §6).
* Two passes, 300 examples per property each: `edges` (the domain below, one step beyond every
  edge) and `curriculum` (the shipped rows and the 1(d) candidate at their listing rungs, with
  one reader move, and the level tables at the rows' own hands, 4 or 8 bars, keys within the
  level, 4/4, 3/4 and, from L3, 6/8).
* H1-gap: options whose `unrealisable()` is empty and that still refuse (a contract gap:
  `generatorContract.test.ts` claims otherwise for the combinations the curriculum asks for).
* H2, determinism: the same options give identical bytes twice.
* H3: required properties 1-5 (key and spelling, metre and bar sums, bars, staves, range) on
  every written example, through partitura.
* H4, the hold: `heldToRung(options, taught(r))` at a drawn core rung r writes no vocabulary
  demand untaught at r. r is drawn from 1.1 to 4.7: before 1.1 nothing is taught, interval.step
  included, so every phrase fails (stratum BC's 0.1 items already show it). The 3/4 gap is
  expected and named in advance: no vocabulary demand holds 3/4 back, so metre.triple is
  counted, not asserted.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

HERE = Path(__file__).resolve().parent
WORKTREE = HERE.parents[3]
BUILD = WORKTREE / "build" / "sr-quality"
sys.path.insert(0, str(HERE))
import check_corpus as cc  # noqa: E402

SETTINGS = settings(derandomize=True, database=None, deadline=None, max_examples=300,
                    suppress_health_check=list(HealthCheck))

METRES = {"2/4": (2, 4), "3/4": (3, 4), "4/4": (4, 4), "3/8": (3, 8), "6/8": (6, 8), "9/8": (9, 8), "12/8": (12, 8)}
CONTROLS = ["skips", "eighths", "syncopation", "triplets", "accidentals", "ties", "dottedQuarters", "ledger",
            "leaps", "sixteenths", "position"]
SEED_EDGES = [0, -1, 2 ** 31 - 1, -(2 ** 31), 2 ** 32 - 1]


def build_bundle() -> dict:
    app = WORKTREE / "app"
    out = BUILD / "bundle" / "engine.mjs"
    subprocess.run(["npx.cmd" if sys.platform == "win32" else "npx", "rolldown", "../build/sr-quality/bundle/entry.ts",
                    "--file", "../build/sr-quality/bundle/engine.mjs", "--format", "esm", "--platform", "node"],
                   cwd=app, check=True, capture_output=True)
    head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=WORKTREE, capture_output=True, text=True).stdout.strip()
    h = hashlib.sha256()
    for rel in ("app/src/engine/sightReading.ts", "app/src/engine/readingControls.ts",
                "app/src/engine/musicXmlWriter.ts", "app/src/engine/sightReadingScore.ts"):
        h.update((WORKTREE / rel).read_bytes())
    return {"head": head, "sourcesSha256": h.hexdigest()[:16], "bundle": str(out.relative_to(WORKTREE))}


class Worker:
    def __init__(self) -> None:
        self.proc = subprocess.Popen(["node", str(HERE / "sr_worker.mjs"), str(BUILD / "bundle" / "engine.mjs")],
                                     stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True, encoding="utf-8")

    def ask(self, req: dict) -> dict:
        assert self.proc.stdin and self.proc.stdout
        self.proc.stdin.write(json.dumps(req) + "\n")
        self.proc.stdin.flush()
        return json.loads(self.proc.stdout.readline())


# ----------------------------------------------------------------------------- data

catalog = json.loads((WORKTREE / "content" / "catalog.static.json").read_text(encoding="utf-8"))
ROWS = [r for r in catalog if (r.get("drill") or {}).get("kind") == "sight-reading"]
curriculum = json.loads((WORKTREE / "app" / "public" / "content" / "curriculum.json").read_text(encoding="utf-8"))
LESSONS = {l["id"]: l for s in curriculum["stages"] for u in s["units"] for l in u["lessons"]}
taught_doc = json.loads((BUILD / "taught.json").read_text(encoding="utf-8"))
TAUGHT = taught_doc["taught"]
CORE_RUNGS = [r for r in taught_doc["order"] if r[0].isdigit() and TAUGHT[r]]
VOCAB = [d["id"] for d in json.loads((WORKTREE / "content" / "curriculum" / "vocabulary" / "demands.json")
                                     .read_text(encoding="utf-8"))["demands"]]
ROW_RUNGS = [(r, rung) for r in ROWS for rung, l in LESSONS.items() if r["id"] in l["exerciseOptions"] + l["songOptions"]]
cc.TAUGHT_ORDER.extend(taught_doc["order"])
cc.VOCAB.update(VOCAB)

seeds = st.one_of(st.sampled_from(SEED_EDGES), st.integers(-(2 ** 31), 2 ** 32 - 1))


@st.composite
def row_requests(draw):
    row, rung = draw(st.sampled_from(ROW_RUNGS))
    patch = draw(st.one_of(st.none(), st.builds(lambda d, on: {"demand": d, "on": on}, st.sampled_from(VOCAB), st.booleans())))
    req = {"params": row["drill"]["params"], "seed": draw(seeds), "hold": TAUGHT[rung]}
    if patch:
        req["patch"] = patch
    return req, {"row": row["id"], "rung": rung, "patch": patch}


@st.composite
def table_options(draw):
    level = draw(st.integers(1, 7))
    m = cc.LEVEL[level]["maxFifths"]
    opts: dict = {"level": level, "hands": draw(st.sampled_from(["R", "L", "both"])), "bars": draw(st.integers(1, 17)),
                  "seed": draw(seeds)}
    fifths = draw(st.one_of(st.integers(-(m + 1), m + 1), st.sampled_from([[-3, -2, -1, 0, 1, 2, 3],
                                                                           [-4, -3, -2, -1, 0, 1, 2, 3, 4], [-1, 0, 1]])))
    opts["fifths"] = fifths
    metre = draw(st.one_of(st.sampled_from(list(METRES)), st.sampled_from([["6/8", "4/4"], ["4/4", "3/4"],
                                                                           ["6/8", "4/4", "3/4"]])))
    as_obj = lambda s: {"beats": METRES[s][0], "beatType": METRES[s][1]}  # noqa: E731
    opts["timeSig"] = [as_obj(s) for s in metre] if isinstance(metre, list) else as_obj(metre)
    for name in draw(st.lists(st.sampled_from(CONTROLS), unique=True, max_size=3)):
        opts[name] = draw(st.booleans())
    lh = draw(st.one_of(st.none(), st.sampled_from(["whole", "chord", "alberti", "broken", "walking"])))
    if lh:
        opts["leftHand"] = lh
    return opts


# --- the curriculum domain (second pass): what the shipped rows and the 1(d) candidate can ask ---
# 1(d)'s target table (briefs/wave1d-sightreading-experiment.md:41-48), exercised before any build.
CANDIDATE = {
    "drill.reading.sight-reading-1": {"timeSig": ["4/4", "3/4"]},
    "drill.reading.sight-reading-2-right": {"timeSig": ["4/4", "3/4"]},
    "drill.reading.sight-reading-2": {"timeSig": ["4/4", "3/4"], "fifths": [-1, 0, 1]},
    "drill.reading.sight-reading-3": {"timeSig": ["6/8", "4/4", "3/4"], "fifths": [-1, 0, 1]},
    "drill.reading.sight-reading-4": {"timeSig": ["4/4", "3/4"], "fifths": [-1, 0, 1]},
}


@st.composite
def curriculum_row_requests(draw):
    row, rung = draw(st.sampled_from(ROW_RUNGS))
    params = dict(row["drill"]["params"])
    candidate = row["id"] in CANDIDATE and draw(st.booleans())
    if candidate:
        params.update(CANDIDATE[row["id"]])
    patch = draw(st.one_of(st.none(), st.builds(lambda d, on: {"demand": d, "on": on},
                                                st.sampled_from(TAUGHT[rung] or VOCAB), st.booleans())))
    req = {"params": params, "seed": draw(seeds), "hold": TAUGHT[rung]}
    if patch:
        req["patch"] = patch
    return req, {"row": row["id"], "rung": rung, "candidate": candidate, "patch": patch}


@st.composite
def curriculum_table_options(draw):
    """A level's table with the hands, lengths, keys and metres the rows and the candidate use."""
    level = draw(st.integers(1, 7))
    m = cc.LEVEL[level]["maxFifths"]
    hands = draw(st.sampled_from({1: ["R", "L"], 2: ["R", "both"]}.get(level, ["both"])))
    opts: dict = {"level": level, "hands": hands, "bars": draw(st.sampled_from([4, 8])), "seed": draw(seeds),
                  "fifths": draw(st.integers(-m, m))}
    metre = draw(st.sampled_from(["4/4", "3/4", "6/8"] if level >= 3 else ["4/4", "3/4"]))
    opts["timeSig"] = {"beats": METRES[metre][0], "beatType": METRES[metre][1]}
    return opts


DOMAIN = sys.argv[1] if len(sys.argv) > 1 else "edges"
if DOMAIN == "curriculum":
    requests = st.one_of(curriculum_row_requests(),
                         curriculum_table_options().map(lambda o: ({"options": o}, {"table": True})))
    # The rows and the 1(d) candidate (L1-L4 core rows and L5-L7 track rows), held at any core rung from 1.1.
    hold_options = st.sampled_from(ROWS).flatmap(lambda row: st.builds(
        lambda cand, seed: {"params": {**row["drill"]["params"], **(CANDIDATE.get(row["id"], {}) if cand else {})},
                            "seed": seed}, st.booleans(), seeds))
else:
    requests = st.one_of(row_requests(), table_options().map(lambda o: ({"options": o}, {"table": True})))
    hold_options = table_options()
H4_OPTIONS = hold_options

WORKER: Worker | None = None
STATE: dict = {}


def ask(req: dict) -> dict:
    assert WORKER
    return WORKER.ask(req)


def parse(xml: str) -> dict:
    with tempfile.NamedTemporaryFile("w", suffix=".musicxml", delete=False, dir=BUILD / "hyp", encoding="utf-8") as f:
        f.write(xml)
        name = f.name
    try:
        return cc.read_partitura(Path(name))
    finally:
        Path(name).unlink()


def as_written(ans: dict) -> tuple[dict, dict, tuple[int, int], int]:
    p = parse(ans["xml"])
    metre = p["times"][0] if p["times"] else (4, 4)
    fifths = p["keys"][0] if p["keys"] else 0
    o = ans["options"]
    found = cc.detect(p, metre, fifths, o.get("hands", "both") == "both" and int(o["level"]) >= 2)
    return p, found, metre, fifths


def record(name: str, req, meta, why) -> None:
    STATE.setdefault(name, {"calls": 0})
    STATE[name]["last"] = {"request": req, "meta": meta, "why": why}


def count(name: str, key: str = "calls") -> None:
    STATE.setdefault(name, {"calls": 0})
    STATE[name][key] = STATE[name].get(key, 0) + 1


@SETTINGS
@given(requests)
def h1_never_silent(rm):
    req, meta = rm
    count("H1")
    ans = ask(req)
    if ans["outcome"] == "NOPATCH":
        count("H1", "noPatch")
        return
    reasons = ans["unrealisable"]
    if ans["outcome"] == "ERROR":
        record("H1", req, meta, ans["error"][:300])
        raise AssertionError("generator error")
    if ans["outcome"] == "REFUSE":
        count("H1", "refused")
        if not ans.get("reasons"):
            record("H1", req, meta, "refused with no reasons")
            raise AssertionError("silent refusal")
        return
    o = ans["options"]
    level = int(o["level"])
    p, found, metre, fifths = as_written(ans)
    problems = []
    if fifths not in cc.expected_keys(o, level):
        problems.append(f"key {fifths} not in {sorted(cc.expected_keys(o, level))}")
    asked = o.get("fifths", 0)
    beyond = any(abs(k) > cc.LEVEL[level]["maxFifths"] for k in (asked if isinstance(asked, list) else [asked]))
    if beyond and not any("key" in r or "C major" in r for r in reasons):
        problems.append("clamped key unnamed")
    if metre not in cc.expected_metres(o):
        problems.append(f"metre {metre} not asked")
    compound = metre[1] == 8 and metre[0] % 3 == 0
    for opt, demand in cc.PROMISE_DEMAND.items():
        named = cc.names(opt, reasons)
        if o.get(opt) is True and demand not in found and not named:
            if compound and opt in cc.SIMPLE_TIME_ONLY:
                count("H1", "knownT37Waiver")
                continue
            problems.append(f"promise {opt} missing, unnamed")
        if o.get(opt) is False and demand in found and not named:
            problems.append(f"keep-out {opt} written, unnamed")
    if problems:
        record("H1", req, meta, problems)
        raise AssertionError("; ".join(problems))


@SETTINGS
@given(requests)
def h1_gap(rm):
    req, meta = rm
    count("H1-gap")
    ans = ask(req)
    if ans["outcome"] == "REFUSE" and not ans["unrealisable"]:
        record("H1-gap", req, meta, ans.get("reasons", [])[:3])
        raise AssertionError("refused with an empty unrealisable()")


@SETTINGS
@given(requests)
def h2_determinism(rm):
    req, meta = rm
    count("H2")
    ans = ask({**req, "twice": True})
    if ans["outcome"] == "NOPATCH":
        return
    if ans["same"] is not True:
        record("H2", req, meta, "two generations differ")
        raise AssertionError("not deterministic")


@SETTINGS
@given(requests)
def h3_required_1_to_5(rm):
    req, meta = rm
    count("H3")
    ans = ask(req)
    if ans["outcome"] != "WRITE":
        return
    count("H3", "written")
    o = ans["options"]
    level = int(o["level"])
    p, found, metre, fifths = as_written(ans)
    problems = []
    scale = {pp.name for pp in cc.m21key.KeySignature(fifths).asKey("major").getScale().getPitches()}
    if fifths not in cc.expected_keys(o, level):
        problems.append("P1 key")
    if o.get("accidentals") is not True and any(cc.m21name(n["step"], n["alter"]) not in scale for n in p["notes"]):
        problems.append("P1 spelling")
    if metre not in cc.expected_metres(o) or cc.bar_sums_partitura(p, cc.bar_length(p["divs"], *metre)):
        problems.append("P2 metre or bar sums")
    if len(p["measures"]) != max(1, min(32, o.get("bars", 4))):
        problems.append("P3 bars")
    hands = o.get("hands", "both")
    want = {"R": [1], "L": [2], "both": [1, 2] if level >= 2 else [1]}[hands]
    if sorted({n["staff"] for n in p["notes"]}) != want:
        problems.append("P4 staves")
    env = cc.envelope(o, level, fifths)
    for staff in (1, 2):
        ns = [n["midi"] for n in p["notes"] if n["staff"] == staff]
        lim = env.get(f"staff{staff}")
        if ns and (lim is None or min(ns) < lim[0] or max(ns) > lim[1] or min(ns) < 21 or max(ns) > 108):
            problems.append(f"P5 staff {staff} {min(ns)}-{max(ns)} vs {lim}")
    if problems:
        record("H3", req, meta, problems)
        raise AssertionError("; ".join(problems))


@SETTINGS
@given(st.deferred(lambda: H4_OPTIONS), st.sampled_from(CORE_RUNGS))
def h4_hold(options, rung):
    count("H4")
    req = {"options": options} if "level" in options else dict(options)
    ans = ask({**req, "hold": TAUGHT[rung]})
    if ans["outcome"] != "WRITE":
        return
    count("H4", "written")
    p, found, metre, fifths = as_written(ans)
    if "metre.triple" in found and taught_doc["order"].index(rung) < taught_doc["order"].index("1.4"):
        count("H4", "known34Gap")
    untaught = [d for d in found if d in cc.VOCAB and d not in TAUGHT[rung]]
    if untaught:
        record("H4", {"options": options, "hold": rung}, {"rung": rung}, untaught)
        raise AssertionError(f"untaught at {rung}: {untaught}")


def main() -> None:
    global WORKER
    (BUILD / "hyp").mkdir(parents=True, exist_ok=True)
    source = build_bundle()
    WORKER = Worker()
    out = {"source": source, "settings": {"derandomize": True, "database": None, "deadline": None, "max_examples": 300},
           "properties": {}}
    for name, fn in (("H1", h1_never_silent), ("H1-gap", h1_gap), ("H2", h2_determinism), ("H3", h3_required_1_to_5),
                     ("H4", h4_hold)):
        try:
            fn()
            result = "no counterexample"
        except AssertionError as error:
            result = f"counterexample: {error}"
        entry = dict(STATE.get(name, {}))
        entry["result"] = result
        out["properties"][name] = entry
        print(name, result, {k: v for k, v in entry.items() if k not in ("last", "result")})
        if "last" in entry:
            print("   minimal:", json.dumps(entry["last"])[:600])
    out["domain"] = DOMAIN
    (BUILD / f"hypothesis-{DOMAIN}.json").write_text(json.dumps(out, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
