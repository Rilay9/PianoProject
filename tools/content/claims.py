#!/usr/bin/env python3
"""
What the rungs claim of their options, against what the notes establish; and what the
corpus holds, in experiences rather than rows (E0 items 5 and 6; R38, R39, Part 12).

Two reports over the built catalogue and curriculum, read by `build.py` (which writes
them to `docs/prompts/rung-claims.md` and `docs/prompts/inventory.md`) and by
`validate.py` (which warns with the first one's count, never fails, until the reviewer
says otherwise):

**The rung-claims report.** A rung makes claims about its options: the skills its
requirements name, the vocabulary skills and notated facts its concepts name, and the
demands the vocabulary says it teaches (`demands.json`'s `taughtAt`: since E0b every rung
that teaches a demand, one per path, `teaching_rungs` the derivation from the lessons'
concepts). Each option either
establishes each claim from its measured demands at a useful density
(`measurement.established`, written by `build.attach_demands`), carries it only
incidentally (present, below the density), lacks it, or was not measured. A concept the
vocabulary has no detector for — rootless voicings, a montuno, four independent voices,
healthy wrist rotation — cannot be established by the notes at all: it is listed as a
claim that needs a person's judgement, with the review bit the provenance holds (none,
today). The generated items' untaught-on-rung combinations (D0's rung check,
`tests/fixtures/untaught_on_rung.json`, L101) are carried in the same report, and so are
every other option's, so placement reads from one place. "Taught by a rung" is the rung's
ancestry (`rung_ancestry`, E0a), the app's `session.rungAncestry` reading: never the file's
order, in which `blues.5` is stored before `jazz.5`. Three detector readings are
known misreadings (E22) and are marked where they bear on a claim, never counted as
teaching truth.

**Nothing is removed from a rung.** The authored lists stay authoritative (the reviewer's
decision); this is what F and G rewrite from. No owner review or placement is required (D3a).

**The inventory.** Adequacy in usable experiences (R39): distinct works and arrangements,
measured and unmeasured, demand coverage by rung, texture, key, range and coordination,
whole pieces against excerpts, human-reviewed against not. Never N pieces per stage.

Nothing here decides a demand or a density: those are `detect.ts`'s and
`content/sources/opportunity-density.json`'s, already on the rows.
"""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
VOCABULARY = REPO / "content" / "curriculum" / "vocabulary"
UNTAUGHT_RECORD = HERE / "tests" / "fixtures" / "untaught_on_rung.json"

#: The rungs Part 12 §1 names first: prose claims about PDMX pieces the import never
#: established (rootless voicings over Jingle Bells, "avoid repertoire pieces" over three
#: Lemoine études, and the rest).
PRIORITY = ("jazz.7", "jazz.8", "jazz.9", "latin", "hymns", "technique.4", "technique.5", "technique.6", "technique.7")

#: Lesson concepts that name a fact a detector finds, by the demand it finds. A concept that
#: is a vocabulary skill id is read as that skill; these are the rest the vocabulary can
#: measure. Everything else a lesson names is a claim the notes cannot establish.
CONCEPT_DEMANDS = {
    "grand-staff": "clef.bass",
    "steps": "interval.step",
    "skips": "interval.skip",
    "leaps": "interval.leap",
    "eighth-notes": "rhythm.eighths",
    "tied-across-bar": "rhythm.ties",
    "key-signatures": "key.signature",
    "chromatic": "pitch.chromatic",
    "alberti": "texture.left-hand-pattern",
    "alberti-bass": "texture.left-hand-pattern",
    "broken-chord-accompaniment": "texture.left-hand-pattern",
    "waltz-bass": "texture.left-hand-pattern",
    "oom-pah-bass": "texture.left-hand-pattern",
    "boogie-bass": "texture.left-hand-pattern",
    "stride-bass": "texture.left-hand-pattern",
    "walking-bass": "texture.walking-bass",
}

#: E22: the three detector readings D0 pinned as what the detectors say, not as facts.
E22_FAMILY = {
    ("stride", "texture.walking-bass"): "E22: walkingBass reads the stride left hand as a walk",
    ("clave", "texture.walking-bass"): "E22: walkingBass reads the clave's quarter-note pulse as a walk",
    ("clave", "clef.bass"): "E22: a one-line second staff is read as the bass staff",
    ("clave", "pitch.ledger"): "E22: a one-line second staff is read as the bass staff",
}
E22_SYNCOPATION_FAMILIES = ("comping", "secondary_rag", "syncopation")
E22_SYNCOPATION = ("E22: T37's syncopation does not count a tie across the barline that starts on "
                   "the beat, or a short off-beat note")
E22_WALKING = "E22: 12 of the 16 two-hand walking-bass items are not walks by walkingBass's rule"
E22_NOTATED_WALK = "E22 caution: walkingBass is known to misread a stride left hand and a one-line pulse"
E22_NOTATED_SYNC = "E22 caution: syncopation's blind spots (a tie across the barline on the beat, a short off-beat note)"
#: detect.ts's own clef assumption (its module note): an upper staff in the bass clef is read
#: as treble. The build marks the file (`measurement.misread`); the reading is never teaching truth.
CLEF_NOTE = "clef assumption: an upper staff in the bass clef is read as treble (detect.ts)"


def misreading_of(item: dict | None, demand: str) -> str | None:
    """The recorded misreading of this demand's reading on this item, if one applies."""
    if item is None:
        return None
    family = (((item.get("drill") or {}).get("generator")) or {}).get("family")
    if family and (family, demand) in E22_FAMILY:
        return E22_FAMILY[(family, demand)]
    if demand in (((item.get("measurement") or {}).get("misread")) or {}).get("demands", []):
        return CLEF_NOTE
    return None


def load_vocabulary() -> tuple[dict[str, dict], dict[str, dict]]:
    skills = json.loads((VOCABULARY / "skills.json").read_text(encoding="utf-8"))["skills"]
    demands = json.loads((VOCABULARY / "demands.json").read_text(encoding="utf-8"))["demands"]
    return {s["id"]: s for s in skills}, {d["id"]: d for d in demands}


def taught_at(demand: dict | None) -> list[str]:
    """
    The rungs a demand is taught at (E0b): `taughtAt` is every rung that teaches it, one per path,
    `[]` where none does. It was one rung or `null`, the first rung in the file whose concepts
    named the demand.
    """
    return list((demand or {}).get("taughtAt") or [])


def concepts_naming(skills: dict[str, dict], demands: dict[str, dict]) -> dict[str, set[str]]:
    """
    The lesson concepts that name each demand (E0b): `CONCEPT_DEMANDS`, and a vocabulary skill whose
    opportunity is that demand alone (`syncopation` names `rhythm.syncopation`, `key-signature`
    names `key.signature`). A skill whose opportunity is several demands (`interval-reading`,
    `subdivision`, `hand-independence`) names none of them: which one the lesson means is not in the
    concept.
    """
    out: dict[str, set[str]] = defaultdict(set)
    for concept, demand in CONCEPT_DEMANDS.items():
        out[demand].add(concept)
    for skill in skills.values():
        opportunity = skill.get("opportunity")
        if isinstance(opportunity, list) and len(opportunity) == 1 and opportunity[0] in demands:
            out[opportunity[0]].add(skill["id"])
    return dict(out)


def teaching_rungs(curriculum: dict, skills: dict[str, dict], demands: dict[str, dict],
                   ancestry: dict[str, set[str]] | None = None) -> dict[str, list[str]]:
    """
    `{demand id: the rungs whose concepts name it and whose path holds no other such rung}`, in the
    curriculum's order (E0b): one teaching rung per path, read from the lessons' own concepts under
    the ancestry — what `taughtAt` is derived from. `blues.6` names walking-bass and stands on
    `blues.5`, so it is not a second teaching rung; `jazz.6` names it and its path never reaches
    `blues.5`, so it is. `validate.py` holds the vocabulary to this and warns where a list differs
    (a lesson naming a concept in passing, or a hand reading its note writes down).
    """
    ancestry = ancestry if ancestry is not None else rung_ancestry(curriculum)
    naming = concepts_naming(skills, demands)
    lessons = [lesson for _stage, _unit, lesson in lessons_in_order(curriculum)]
    out: dict[str, list[str]] = {}
    for demand_id in demands:
        concepts = naming.get(demand_id, set())
        rungs = [lesson["id"] for lesson in lessons if concepts & set(lesson.get("concepts") or [])]
        out[demand_id] = [rung for rung in rungs
                          if not any(other != rung and other in ancestry.get(rung, set()) for other in rungs)]
    return out


def lessons_in_order(curriculum: dict) -> list[tuple[dict, dict, dict]]:
    """(stage, unit, lesson) in the curriculum's order."""
    return [(stage, unit, lesson)
            for stage in curriculum.get("stages", [])
            for unit in stage.get("units", [])
            for lesson in unit.get("lessons", [])]


def rung_ancestry(curriculum: dict) -> dict[str, set[str]]:
    """
    Every rung's ancestry (E0a): the rungs every learner at it has been through, itself
    included, as the app's `session.rungAncestry` reads it. On the core path, every core rung
    before it in stage-and-unit order: the spine is walked in that order, and its
    `prerequisites` do not say all of it (4.6's, followed back, never reach 3.4; 4.7 names
    none). On a track, its `prerequisites`, each with its own ancestry, and the core path up to
    the rung's stage, which is where a track opens (`docs/04` §2). A prerequisite the
    curriculum lacks is passed over. Never the file's order across tracks: `blues.5` is stored
    before `jazz.5`, and the walking bass it teaches is not taught at `jazz.5`.
    """
    stages = sorted(curriculum.get("stages", []), key=lambda stage: stage.get("number", 0))
    known = {lesson["id"] for stage in stages for unit in stage.get("units", []) for lesson in unit.get("lessons", [])}
    parents: dict[str, list[str]] = {}
    core: list[tuple[int, str]] = []
    previous: str | None = None
    for stage in stages:
        number = stage.get("number", 0)
        spine = next((rung for at, rung in reversed(core) if at < number), None)
        for unit in stage.get("units", []):
            for lesson in unit.get("lessons", []):
                own = [p for p in lesson.get("prerequisites") or [] if p in known and p != lesson["id"]]
                if unit.get("track") == "core":
                    parents[lesson["id"]] = ([previous] if previous else []) + own
                    previous = lesson["id"]
                    core.append((number, lesson["id"]))
                else:
                    parents[lesson["id"]] = own + ([spine] if spine else [])
    out: dict[str, set[str]] = {}
    visiting: set[str] = set()

    def of(rung: str) -> set[str]:
        if rung in out:
            return out[rung]
        found = {rung}
        if rung in visiting:  # a cycle in the prerequisites: stop rather than loop
            return found
        visiting.add(rung)
        for parent in parents.get(rung, []):
            found |= of(parent)
        visiting.discard(rung)
        out[rung] = found
        return found

    for rung in parents:
        of(rung)
    return out


def first_listings(curriculum: dict, ancestry: dict[str, set[str]]) -> dict[str, set[str]]:
    """
    `{item id: the rungs listing it that no other rung listing it comes before on their own
    path}`: where a learner first meets the item, on each path the curriculum has. On one line
    of rungs that is the earliest listing, as before E0a; an item on two tracks is met first on
    each, and read at both.
    """
    listed: dict[str, list[str]] = defaultdict(list)
    for _stage, _unit, lesson in lessons_in_order(curriculum):
        for item_id in dict.fromkeys(lesson.get("exerciseOptions", []) + lesson.get("songOptions", [])):
            listed[item_id].append(lesson["id"])
    return {item_id: {rung for rung in rungs
                      if not any(other != rung and other in ancestry.get(rung, set()) for other in rungs)}
            for item_id, rungs in listed.items()}


def rung_claims_of(lesson: dict, skills: dict[str, dict], demands: dict[str, dict]) -> tuple[list[dict], list[str]]:
    """
    A rung's measurable claims, each `{kind, id, from}`, and the concepts it names that no
    detector can establish.
    """
    claims: list[dict] = []
    seen: set[tuple[str, str]] = set()

    def add(kind: str, ident: str, source: str) -> None:
        if (kind, ident) in seen:
            return
        seen.add((kind, ident))
        claims.append({"kind": kind, "id": ident, "from": source})

    for requirement in lesson.get("requirements", []):
        if requirement.get("kind") == "skill":
            add("skill", requirement["skill"], "requirement")
    unmeasurable: list[str] = []
    for concept in lesson.get("concepts", []):
        if concept in skills:
            if skills[concept]["opportunity"] != "every-step":
                add("skill", concept, "concept")
        elif concept in CONCEPT_DEMANDS:
            add("demand", CONCEPT_DEMANDS[concept], f"concept {concept}")
        else:
            unmeasurable.append(concept)
    for demand in demands.values():
        if lesson["id"] in taught_at(demand):
            add("demand", demand["id"], "taughtAt")
    return claims, unmeasurable


def status_of(claim: dict, item: dict | None, skills: dict[str, dict]) -> str:
    """established, incidental (present below the density), absent, unmeasured, runtime or missing."""
    if item is None:
        return "missing"
    measurement = item.get("measurement") or {}
    status = measurement.get("status")
    if status == "runtime":
        if claim["kind"] == "skill" and claim["id"] in (item.get("targetSkills") or []):
            return "the reader's" if (item.get("drill") or {}).get("kind") == "sight-reading" else "runtime"
        return "runtime"
    if status != "measured":
        return "unmeasured"
    established = set(measurement.get("established") or [])
    present = set(item.get("demands") or [])
    wanted = set(skills[claim["id"]]["opportunity"]) if claim["kind"] == "skill" else {claim["id"]}
    if wanted & established:
        return "established"
    if wanted & present:
        return "incidental"
    return "absent"


def e22_notes(claim: dict, item: dict | None, verdict: str, skills: dict[str, dict]) -> list[str]:
    """The known misreadings that bear on this claim's verdict for this item."""
    if item is None:
        return []
    family = (((item.get("drill") or {}).get("generator")) or {}).get("family")
    wanted = set(skills[claim["id"]]["opportunity"]) if claim["kind"] == "skill" else {claim["id"]}
    notes: list[str] = []
    present = set(item.get("demands") or []) if isinstance(item.get("demands"), list) else set()
    for demand in sorted(wanted):
        if family and (family, demand) in E22_FAMILY and demand in present:
            notes.append(E22_FAMILY[(family, demand)])
        if misreading_of(item, demand) == CLEF_NOTE:
            notes.append(CLEF_NOTE)
        if family == "walking_bass" and demand == "texture.walking-bass" and verdict != "established":
            notes.append(E22_WALKING)
        if family in E22_SYNCOPATION_FAMILIES and demand == "rhythm.syncopation" and verdict != "established":
            notes.append(E22_SYNCOPATION)
        if not family and demand == "texture.walking-bass" and demand in present:
            notes.append(E22_NOTATED_WALK)
        if not family and demand == "rhythm.syncopation" and verdict in ("absent", "incidental"):
            notes.append(E22_NOTATED_SYNC)
    return sorted(set(notes))


def untaught_on(item: dict, rung: str, ancestry: dict[str, set[str]], demands: dict[str, dict]) -> list[str]:
    """
    The item's measured demands `rung` has not taught (D0's rung check): taught nowhere
    (`taughtAt: []`), or at no rung in its ancestry (E0a; before, a rung stored after it in the
    file). Since E0b a demand is taught where any rung its `taughtAt` lists is on the rung's path.
    """
    if not isinstance(item.get("demands"), list) or rung not in ancestry:
        return []
    taught_by = ancestry[rung]
    return [demand for demand in item["demands"]
            if not any(at in taught_by for at in taught_at(demands.get(demand)))]


def rung_claims(catalog: list[dict], curriculum: dict) -> dict:
    """The report's rows and its summary, as data."""
    skills, demands = load_vocabulary()
    by_id = {item["id"]: item for item in catalog}
    ancestry = rung_ancestry(curriculum)
    firsts = first_listings(curriculum, ancestry)

    rungs: list[dict] = []
    options: list[dict] = []
    for stage, unit, lesson in lessons_in_order(curriculum):
        claims, unmeasurable = rung_claims_of(lesson, skills, demands)
        ids = list(dict.fromkeys(lesson.get("exerciseOptions", []) + lesson.get("songOptions", [])))
        claim_rows = []
        for claim in claims:
            verdicts = {item_id: status_of(claim, by_id.get(item_id), skills) for item_id in ids}
            claim_rows.append({**claim, "established": sum(1 for v in verdicts.values() if v == "established"),
                               "measurable": sum(1 for v in verdicts.values() if v in ("established", "incidental", "absent", "unmeasured"))})
        for item_id in ids:
            item = by_id.get(item_id)
            per = []
            for claim in claims:
                verdict = status_of(claim, item, skills)
                per.append({**claim, "status": verdict, "e22": e22_notes(claim, item, verdict, skills)})
            provenance = (item or {}).get("provenance") or {}
            options.append({
                "rung": lesson["id"],
                "stage": stage.get("number"),
                "track": unit.get("track"),
                "item": item_id,
                "title": (item or {}).get("title"),
                "source": provenance.get("source"),
                "claims": per,
                "unmeasurable": unmeasurable,
                "review": provenance.get("review") or {"score": None, "teaching": None},
                # The teaching-use decision and its basis (D2 item 4): the record's current one.
                "teachingReview": teaching_review(provenance),
                "untaught": untaught_on(item, lesson["id"], ancestry, demands) if item and lesson["id"] in firsts.get(item_id, set()) else [],
                "earliest": lesson["id"] in firsts.get(item_id, set()),
                "established": ((item or {}).get("measurement") or {}).get("established") or [],
                # The same, each reading a recorded misreading bears on marked: never teaching truth.
                "establishedMarked": [
                    f"{d} (E22)" if misreading_of(item, d) or (d == "texture.walking-bass" and not (((item or {}).get("drill") or {}).get("generator"))) else d
                    for d in (((item or {}).get("measurement") or {}).get("established") or [])
                ],
                "measured": ((item or {}).get("measurement") or {}).get("status"),
            })
        rungs.append({"rung": lesson["id"], "stage": stage.get("number"), "track": unit.get("track"),
                      "title": lesson.get("title"), "claims": claim_rows, "unmeasurable": unmeasurable,
                      "options": len(ids)})

    pairs = [(o, c) for o in options for c in o["claims"]]
    measurable = [p for p in pairs if p[1]["status"] in ("established", "incidental", "absent", "unmeasured")]
    unestablished = [p for p in measurable if p[1]["status"] != "established"]
    kept_by_none = [(r, c) for r in rungs for c in r["claims"] if c["measurable"] > 0 and c["established"] == 0]
    serves_none = [o for o in options
                   if o["claims"] and o["measured"] == "measured"
                   and not any(c["status"] == "established" for c in o["claims"])]
    generated_untaught: Counter = Counter()
    for option in options:
        item = by_id.get(option["item"]) or {}
        family = (((item.get("drill") or {}).get("generator")) or {}).get("family")
        if family and option["earliest"]:
            for demand in option["untaught"]:
                generated_untaught[(family, option["rung"], demand)] += 1
    recorded = []
    if UNTAUGHT_RECORD.exists():
        recorded = json.loads(UNTAUGHT_RECORD.read_text(encoding="utf-8")).get("found", [])
    recorded_counter = Counter({(r["family"], r["rung"], r["demand"]): r["items"] for r in recorded})
    return {
        "summary": {
            "rungs": len(rungs),
            "options": len(options),
            "claims": len(pairs),
            "measurable": len(measurable),
            "established": len(measurable) - len(unestablished),
            "unestablished": len(unestablished),
            "byStatus": dict(Counter(p[1]["status"] for p in pairs)),
            "unmeasurableConcepts": sum(len(r["unmeasurable"]) for r in rungs),
            "rungClaimsKeptByNoOption": len(kept_by_none),
            "optionsServingNoneOfTheirRungsClaims": len(serves_none),
            "generatedUntaught": sum(1 for _ in generated_untaught),
            "generatedUntaughtMatchesRecord": generated_untaught == recorded_counter,
            "humanReviewed": sum(1 for o in options if o["teachingReview"] is not None),
            "clefMisread": sum(1 for item in catalog if ((item.get("measurement") or {}).get("misread"))),
        },
        "rungs": rungs,
        "options": options,
        "keptByNone": [{"rung": r["rung"], "title": r["title"], **c} for r, c in kept_by_none],
        "servesNone": [o["item"] + " on " + o["rung"] for o in serves_none],
        "generatedUntaught": [{"family": k[0], "rung": k[1], "demand": k[2], "items": n,
                               "taughtAt": taught_at(demands.get(k[2]))}
                              for k, n in sorted(generated_untaught.items())],
        "recordedUntaught": len(recorded),
        # Every rung's ancestry as the build read it: `taughtByAncestry.test.ts` holds the app's
        # `rungAncestry` equal to it, so the report's "untaught here" and the gate read one thing.
        "ancestry": {rung: sorted(members) for rung, members in ancestry.items()},
    }


def teaching_review(provenance: dict) -> dict | None:
    """The item's current teaching-use decision and its basis, from the provenance (D2), or None."""
    fact = (provenance.get("facts") or {}).get("reviewedTeaching")
    return {"value": fact["value"], "basis": fact["basis"]} if fact else None


def review_words(option: dict) -> str:
    """The report's review column: the teaching-use decision and its basis, or a dash."""
    decided = option.get("teachingReview")
    return f"{decided['value']} ({decided['basis']})" if decided else "—"


def _claim_words(claim: dict, skills: dict[str, dict], demands: dict[str, dict]) -> str:
    if claim["kind"] == "skill":
        return f"skill {claim['id']}"
    return f"{demands.get(claim['id'], {}).get('display', claim['id']).lower()} ({claim['id']})"


def render_rung_claims(report: dict) -> str:
    """The markdown report: summary, the priority rungs in full, then every rung's claims."""
    skills, demands = load_vocabulary()
    s = report["summary"]
    by_status = s["byStatus"]
    READER = "the reader's"
    lines = [
        "# The rung-claims report",
        "",
        "Generated by `tools/content/build.py` from the built catalogue and curriculum (E0 item 5; R38, Part 12 §1). "
        "Do not edit by hand: rebuild. Nothing here removes an option from a rung; the authored lists stay "
        "authoritative, and this is what F and G rewrite from. `validate.py` warns with its count.",
        "",
        "**How to read it.** A rung claims the skills its requirements name, the vocabulary skills and notated facts its "
        "concepts name, and the demands the vocabulary says it teaches (`taughtAt`). Each option **establishes** a claim "
        "when its measured demands provide it at a useful density (`content/sources/opportunity-density.json`, or a "
        "generated family's own contract density), carries it **incidentally** (present, below that density), lacks it "
        "(**absent**), or was **unmeasured**. A concept the vocabulary has no detector for cannot be established by the "
        "notes at all: it needs a person's judgement, and the review bit is shown. Detector readings E22 records as "
        "misreadings are marked and never counted as teaching truth: `(E22)` after a demand an option establishes, "
        "and the reason beside a claim it bears on. The detectors' clef assumption (an upper staff written in the bass "
        "clef is read as treble, `detect.ts`'s own note) is marked the same way; those readings never establish "
        "anything.",
        "",
        "## Summary",
        "",
        f"- {s['rungs']} rungs, {s['options']} rung options, {s['claims']} option-claim pairs, of which "
        f"{s['measurable']} can be checked against notation.",
        f"- **{s['established']} established, {s['unestablished']} not established** "
        f"(incidental {by_status.get('incidental', 0)}, absent {by_status.get('absent', 0)}, unmeasured "
        f"{by_status.get('unmeasured', 0)}); the reading rows' own claims {by_status.get(READER, 0)}, "
        f"other runtime drills {by_status.get('runtime', 0)}.",
        f"- **{s['rungClaimsKeptByNoOption']} rung claims that no option of the rung establishes** (listed below: the "
        "promises the notes do not keep).",
        f"- {s['optionsServingNoneOfTheirRungsClaims']} measured options establish none of their rung's measurable claims.",
        f"- {s['unmeasurableConcepts']} concept claims across the rungs name something no detector measures; "
        f"{s['humanReviewed']} options carry a human teaching-use review.",
        f"- {s['clefMisread']} catalogue scores write their upper staff in the bass clef somewhere; their bass-staff "
        "and ledger-line readings are the clef assumption's and are marked, never established.",
        f"- The generated items' untaught-on-rung combinations: {s['generatedUntaught']} (D0's record holds "
        f"{report['recordedUntaught']}; {'the same' if s['generatedUntaughtMatchesRecord'] else 'they differ — see below'}).",
        "",
        "## The rungs Part 12 names first",
        "",
    ]
    options_by_rung: dict[str, list[dict]] = defaultdict(list)
    for option in report["options"]:
        options_by_rung[option["rung"]].append(option)
    rungs = {r["rung"]: r for r in report["rungs"]}
    for rung_id in PRIORITY:
        rung = rungs.get(rung_id)
        if rung is None:
            continue
        lines.append(f"### {rung_id} — {rung['title']}")
        lines.append("")
        claims = ", ".join(_claim_words(c, skills, demands) for c in rung["claims"]) or "none the vocabulary can measure"
        lines.append(f"Measurable claims: {claims}.")
        lines.append("")
        reviewed = sum(1 for option in options_by_rung[rung_id] if option.get("teachingReview"))
        review_bit = (f"a teaching-use review on {reviewed} of {len(options_by_rung[rung_id])} options"
                      if reviewed else "none on any option")
        lines.append(f"Claims no detector can establish (a person's judgement; review bit: {review_bit}): "
                     f"{', '.join(rung['unmeasurable']) or 'none'}.")
        lines.append("")
        lines.append("| Option | Source | Establishes | Claims | Untaught here | Teaching review |")
        lines.append("| --- | --- | --- | --- | --- | --- |")
        for option in options_by_rung[rung_id]:
            verdicts = "; ".join(
                f"{_claim_words(c, skills, demands)}: {c['status']}" + (f" ({'; '.join(c['e22'])})" if c["e22"] else "")
                for c in option["claims"]) or "—"
            lines.append(
                f"| {option['title'] or option['item']} (`{option['item']}`) | {option['source'] or '?'} | "
                f"{', '.join(option['establishedMarked']) or ('— (' + str(option['measured']) + ')')} | {verdicts} | "
                f"{', '.join(option['untaught']) or '—'} | {review_words(option)} |")
        lines.append("")

    lines += ["## Rung claims no option establishes", "",
              "| Rung | Claim | From | Options checked |", "| --- | --- | --- | --- |"]
    for row in report["keptByNone"]:
        lines.append(f"| {row['rung']} — {row['title']} | {_claim_words(row, skills, demands)} | {row['from']} | {row['measurable']} |")
    lines += ["", "## Every rung, claim by claim", "",
              "How many of the rung's options establish each measurable claim, and the concepts no detector measures.", "",
              "| Rung | Options | Claims (established / checked) | Not measurable |", "| --- | --- | --- | --- |"]
    for rung in report["rungs"]:
        claims = "; ".join(f"{_claim_words(c, skills, demands)} {c['established']}/{c['measurable']}" for c in rung["claims"]) or "—"
        lines.append(f"| {rung['rung']} | {rung['options']} | {claims} | {', '.join(rung['unmeasurable']) or '—'} |")
    lines += ["", "## Options that establish none of their rung's measurable claims", ""]
    lines += [f"- {entry}" for entry in report["servesNone"]] or ["- none"]
    lines += ["", "## Untaught on the earliest rung listing them", "",
              "Every measured demand of an option that the curriculum has not taught by the earliest rung listing it "
              "on that rung's path: no rung its `taughtAt` lists (every rung that teaches it, one per path, E0b) in the "
              "rung's ancestry (the rung, what it builds on, and on a track the core path to its stage; never the file's "
              "order, E0a), or `[]`, taught nowhere. An option listed on "
              "two paths is read where each first meets it. For the generated items this is D0's rung check (L101): "
              "inputs to placement, never permission to activate a family.", "",
              "### Generated items, family by rung by demand", "",
              "| Family | Rung | Demand | Taught at | Items |", "| --- | --- | --- | --- | --- |"]
    for row in report["generatedUntaught"]:
        lines.append(f"| {row['family']} | {row['rung']} | {row['demand']} | {', '.join(row['taughtAt']) or 'nowhere'} | {row['items']} |")
    lines += ["", "### Notated items", "", "| Item | Rung | Untaught demands |", "| --- | --- | --- |"]
    for option in report["options"]:
        if option["untaught"] and option["source"] not in ("generated",):
            lines.append(f"| {option['title'] or option['item']} (`{option['item']}`) | {option['rung']} | {', '.join(option['untaught'])} |")
    lines.append("")
    return "\n".join(lines)


def inventory(catalog: list[dict], curriculum: dict) -> dict:
    """Adequacy in usable experiences (R39), as data."""
    skills, demands = load_vocabulary()
    notated = [item for item in catalog if (item.get("measurement") or {}).get("status") in ("measured", "unmeasured")]
    songs = [item for item in catalog if item.get("type") == "song"]
    by_id = {item["id"]: item for item in catalog}
    by_source: dict[str, dict] = {}
    for item in catalog:
        provenance = item.get("provenance") or {}
        kind = provenance.get("source", "?")
        row = by_source.setdefault(kind, {"items": 0, "measured": 0, "unmeasured": 0, "runtime": 0,
                                          "works": set(), "arrangements": set(), "tempoInferred": 0})
        row["items"] += 1
        status = (item.get("measurement") or {}).get("status")
        row[status if status in ("measured", "unmeasured", "runtime") else "unmeasured"] += 1
        if provenance.get("composition"):
            row["works"].add(provenance["composition"])
        if provenance.get("arrangement"):
            row["arrangements"].add(provenance["arrangement"])
        if ((provenance.get("facts") or {}).get("tempo") or {}).get("kind") == "inferred":
            row["tempoInferred"] += 1
    works = {(item.get("provenance") or {}).get("composition") for item in catalog} - {None}
    arrangements = {(item.get("provenance") or {}).get("arrangement") for item in catalog} - {None}
    measured_songs = [s for s in songs if (s.get("measurement") or {}).get("status") == "measured"]

    def established(item: dict, demand: str) -> bool:
        return demand in ((item.get("measurement") or {}).get("established") or [])

    texture = {
        "one hand only (right)": sum(1 for s in measured_songs if s.get("hands") == "right"),
        "one hand only (left)": sum(1 for s in measured_songs if s.get("hands") == "left"),
        "both hands": sum(1 for s in measured_songs if s.get("hands") == "both"),
        "hands together (established)": sum(1 for s in measured_songs if established(s, "texture.hands-together")),
        "a left-hand pattern in every bar": sum(1 for s in measured_songs if established(s, "texture.left-hand-pattern")),
        "a walking bass (E22: readings unverified)": sum(1 for s in measured_songs if established(s, "texture.walking-bass")),
        "single staff (notation.staves 1)": sum(1 for s in measured_songs if (s.get("notation") or {}).get("staves") == 1),
    }
    keys = Counter()
    for song in measured_songs:
        found = (song.get("notation") or {}).get("keys") or []
        if found:
            fifths = int(found[0].get("fifths") or 0)
            keys["no sharps or flats" if fifths == 0 else f"{abs(fifths)} {'sharp' if fifths > 0 else 'flat'}{'s' if abs(fifths) > 1 else ''}"] += 1
    range_rows = {
        "ledger lines beyond middle C (established)": sum(1 for s in measured_songs if established(s, "pitch.ledger")),
        "a hand beyond a five-finger position (established)": sum(1 for s in measured_songs if established(s, "range.beyond-position")),
        "leaps (established)": sum(1 for s in measured_songs if established(s, "interval.leap")),
    }
    rhythm_rows = {demand: sum(1 for s in measured_songs if established(s, demand))
                   for demand in ("rhythm.eighths", "rhythm.sixteenths", "rhythm.dotted-quarter", "rhythm.ties",
                                  "rhythm.syncopation", "rhythm.triplets", "metre.compound")}
    coverage = []
    for stage, unit, lesson in lessons_in_order(curriculum):
        ids = lesson.get("exerciseOptions", []) + lesson.get("songOptions", [])
        items = [by_id[i] for i in ids if i in by_id]
        provided = Counter(d for item in items for d in ((item.get("measurement") or {}).get("established") or []))
        taught = [d["id"] for d in demands.values() if lesson["id"] in taught_at(d)]
        coverage.append({"rung": lesson["id"], "options": len(ids), "taught": taught,
                         "taughtEstablishedOn": {d: provided.get(d, 0) for d in taught},
                         "provided": dict(provided)})
    # By level band: where the songs are, and whether a band is one texture (Part 12 §15's cliffs).
    bands: dict[int, dict] = {}
    for song in measured_songs:
        band = bands.setdefault(int(song.get("level") or 0), {"songs": 0, "works": set(), "oneHand": 0,
                                                             "handsTogether": 0, "leftHandPattern": 0, "estimated": 0})
        band["songs"] += 1
        band["works"].add((song.get("provenance") or {}).get("composition"))
        band["oneHand"] += 1 if song.get("hands") in ("right", "left") else 0
        band["handsTogether"] += 1 if established(song, "texture.hands-together") else 0
        band["leftHandPattern"] += 1 if established(song, "texture.left-hand-pattern") else 0
        band["estimated"] += 1 if song.get("levelSource") == "estimated" else 0
    sections = sum(1 for item in catalog if ((item.get("teaching") or {}).get("sections")))
    quarry_keeps = sum(1 for item in catalog if (item.get("provenance") or {}).get("quarryKeep"))
    return {
        "headline": {
            "items": len(catalog),
            "notated": len(notated),
            "measured": sum(1 for i in catalog if (i.get("measurement") or {}).get("status") == "measured"),
            "unmeasured": sum(1 for i in catalog if (i.get("measurement") or {}).get("status") == "unmeasured"),
            "runtime": sum(1 for i in catalog if (i.get("measurement") or {}).get("status") == "runtime"),
            "works": len(works),
            "arrangements": len(arrangements),
            "excerpts": 0,
            "withSections": sections,
            # A decision either way is a review: `no` and `fix` count as much as `yes` (D2).
            "scoreReviewed": sum(1 for i in catalog if ((i.get("provenance") or {}).get("review") or {}).get("score") is not None),
            "teachingReviewed": sum(1 for i in catalog if ((i.get("provenance") or {}).get("review") or {}).get("teaching") is not None),
            "quarryKeeps": quarry_keeps,
            "tempoInferred": sum(r["tempoInferred"] for r in by_source.values()),
        },
        "bySource": {k: {**v, "works": len(v["works"]), "arrangements": len(v["arrangements"])} for k, v in sorted(by_source.items())},
        "texture": texture,
        "keys": dict(keys.most_common()),
        "range": range_rows,
        "rhythm": rhythm_rows,
        "coverage": coverage,
        "bands": {b: {**v, "works": len(v["works"] - {None})} for b, v in sorted(bands.items())},
        "unmeasured": sorted(f"{i['id']}: {(i.get('measurement') or {}).get('reason')}" for i in catalog
                             if (i.get("measurement") or {}).get("status") == "unmeasured"),
    }


def render_inventory(inv: dict) -> str:
    h = inv["headline"]
    lines = [
        "# The inventory",
        "",
        "Generated by `tools/content/build.py` from the built catalogue (E0 item 6; R39, Part 12 §3). Do not edit by "
        "hand: rebuild. Adequacy in usable experiences, not rows: distinct works and arrangements, what was measured, "
        "which demands each rung's options provide at a useful density, texture, key, range and coordination, whole "
        "pieces against excerpts, and what a person has reviewed.",
        "",
        "## Headline",
        "",
        f"- **{h['items']} catalogue items**: {h['measured']} measured by the app's detectors, {h['unmeasured']} unmeasured "
        f"(each with its reason, below), {h['runtime']} made by the app when they open (no score to measure).",
        f"- **{h['works']} distinct works and {h['arrangements']} distinct arrangements** (a work is `work_key` of title and "
        "composer, or an authored `variantOf` tune; a PDMX duplicate edition shares its arrangement). Generated exercises "
        "and runtime drills are not works.",
        f"- **Excerpts as their own objects: {h['excerpts']}** (E1); {h['withSections']} items carry named practice sections, "
        "which are loops over a whole piece, not excerpts.",
        f"- **Human review: {h['scoreReviewed']} items with a score review, {h['teachingReviewed']} with a teaching-use "
        f"review.** The {h['quarryKeeps']} PDMX quarry keeps are a source-level decision and are neither.",
        f"- {h['tempoInferred']} items play at a tempo the converter supplied; their tempo-sensitive demands are marked "
        "untrusted in the provenance.",
        "",
        "## By source",
        "",
        "| Source | Items | Measured | Unmeasured | Runtime | Works | Arrangements | Tempo inferred |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    for kind, row in inv["bySource"].items():
        lines.append(f"| {kind} | {row['items']} | {row['measured']} | {row['unmeasured']} | {row['runtime']} | "
                     f"{row['works']} | {row['arrangements']} | {row['tempoInferred']} |")
    lines += ["", "## Songs by level band (measured songs)", "",
              "Where the songs are, and whether a band is all one texture (Part 12 §15: look for cliffs, not empty stages). "
              "A level is a sort signal, never a learner's ability; many here are estimates.", "",
              "| Level | Songs | Works | One hand only | Hands together | A left-hand pattern | Level estimated |",
              "| --- | --- | --- | --- | --- | --- | --- |"]
    for band, row in inv["bands"].items():
        lines.append(f"| {band} | {row['songs']} | {row['works']} | {row['oneHand']} | {row['handsTogether']} | "
                     f"{row['leftHandPattern']} | {row['estimated']} |")
    lines += ["", "## Texture and coordination (measured songs)", "", "| | Songs |", "| --- | --- |"]
    lines += [f"| {k} | {v} |" for k, v in inv["texture"].items()]
    lines += ["", "## Keys (measured songs, by the file's first signature)", "", "| Signature | Songs |", "| --- | --- |"]
    lines += [f"| {k} | {v} |" for k, v in inv["keys"].items()]
    lines += ["", "## Range and rhythm (measured songs establishing each)", "", "| | Songs |", "| --- | --- |"]
    lines += [f"| {k} | {v} |" for k, v in inv["range"].items()]
    lines += [f"| {k} | {v} |" for k, v in inv["rhythm"].items()]
    lines += ["", "## Demand coverage by rung", "",
              "Which demands each rung's options establish, and for the demands the rung teaches, on how many options.", "",
              "| Rung | Options | Teaches (established on n options) | Establishes across its options |", "| --- | --- | --- | --- |"]
    for row in inv["coverage"]:
        taught = ", ".join(f"{d} {n}" for d, n in row["taughtEstablishedOn"].items()) or "—"
        provided = ", ".join(f"{d} {n}" for d, n in sorted(row["provided"].items(), key=lambda kv: -kv[1])) or "—"
        lines.append(f"| {row['rung']} | {row['options']} | {taught} | {provided} |")
    lines += ["", "## Unmeasured, with the reason", ""]
    lines += [f"- {entry}" for entry in inv["unmeasured"]] or ["- none"]
    lines.append("")
    return "\n".join(lines)
