#!/usr/bin/env python3
"""
R23's read-only report (the brief's item 1; `responses/71730e65.md`, R23): for every rung whose
requirements ask for a run of one of its songs (`validate.thin_lesson_errors`' `required_songs`), the
four facts the reviewer's required change names, read from the built catalogue and curriculum:

1. the target claim the song application is meant to reinforce — whether anything in the repository
   names one; where nothing does, how determinate the rung's own measurable claims leave it;
2. each song option's measured opportunity against each of the rung's measurable claims
   (`claims.status_of`, unchanged; E22's marks from `claims.e22_notes`);
3. each option's teaching-use admission and the list gate's learner-free answer, from the app's own
   functions (`admittedForTeaching`, `automaticFromList` with no learner), written by the probe
   `scripts-admission.probe.test.ts` to `app/build/r23/admission.json` — asked of the canonical
   TypeScript, never re-derived here;
4. how a runtime, creative or ear option is represented (`status_of`'s `runtime` / `the reader's`).

Reads; writes only `docs/prompts/runs/R23/application-report.md`. Decides nothing, changes no rung.

Run from the repository root after `python tools/content/build.py --offline` and the probe
(`npx vitest run --config build/r23/vitest.r23.config.ts` in `app/`, the config a copy of
`vitest.config.ts` whose `include` is `build/r23/**/*.probe.test.ts`).
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))

import claims  # noqa: E402

CONTENT = REPO / "app" / "public" / "content"
ADMISSION = REPO / "app" / "build" / "r23" / "admission.json"
OUT = Path(__file__).resolve().parent / "application-report.md"


def required_songs(lesson: dict) -> bool:
    """`validate.thin_lesson_errors`' own test, read the same way."""
    return any(r.get("kind") == "runs" and r.get("from") == "songs" for r in lesson.get("requirements") or [])


def determinacy(measurable: list[dict], unmeasurable: list[str]) -> str:
    if not measurable:
        return "none"
    if len(measurable) == 1:
        return "sole" if not unmeasurable else "sole+unmeasurable"
    return "several"


DETERMINACY_WORDS = {
    "none": "no measurable claim",
    "sole": "one measurable claim, nothing else named",
    "sole+unmeasurable": "one measurable claim beside concepts no detector measures",
    "several": "several measurable claims",
}


def main() -> None:
    catalog = json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))
    curriculum = json.loads((CONTENT / "curriculum.json").read_text(encoding="utf-8"))
    admission = json.loads(ADMISSION.read_text(encoding="utf-8"))
    skills, demands = claims.load_vocabulary()
    by_id = {item["id"]: item for item in catalog}

    rows = []
    for stage, unit, lesson in claims.lessons_in_order(curriculum):
        if lesson.get("optionsExempt") or not required_songs(lesson):
            continue
        measurable, unmeasurable = claims.rung_claims_of(lesson, skills, demands)
        options = []
        for item_id in lesson.get("songOptions", []):
            item = by_id.get(item_id)
            gate = admission.get(item_id) or {"missing": True}
            verdicts = []
            for claim in measurable:
                status = claims.status_of(claim, item, skills)
                notes = claims.e22_notes(claim, item, status, skills)
                verdicts.append({"claim": claim, "status": status, "marked": bool(notes), "notes": notes})
            options.append({
                "id": item_id,
                "type": (item or {}).get("type"),
                "source": ((item or {}).get("provenance") or {}).get("source"),
                "measured": ((item or {}).get("measurement") or {}).get("status"),
                "admitted": gate.get("admitted") is True,
                "offered": gate.get("listOffered") is True,
                "listVerdict": gate.get("listVerdict"),
                "verdicts": verdicts,
            })
        usable = [o for o in options if o["admitted"] and o["offered"]]

        def clean(o: dict, claim: dict) -> bool:
            return any(v["claim"] is claim and v["status"] == "established" and not v["marked"] for v in o["verdicts"])

        def marked(o: dict, claim: dict) -> bool:
            return any(v["claim"] is claim and v["status"] == "established" and v["marked"] for v in o["verdicts"])

        per_claim = [{"claim": c, "clean": sum(1 for o in usable if clean(o, c)),
                      "marked": sum(1 for o in usable if marked(o, c)),
                      "incidental": sum(1 for o in usable if any(v["claim"] is c and v["status"] == "incidental" for v in o["verdicts"])),
                      # Not established, with a recorded misreading or an E22 caution bearing on the verdict:
                      # the notes do not say the option lacks the claim, only that the detector cannot tell.
                      "noted": sum(1 for o in usable if any(v["claim"] is c and v["status"] != "established" and v["marked"] for v in o["verdicts"])),
                      "notes": sorted({n for o in usable for v in o["verdicts"] if v["claim"] is c and v["status"] != "established" for n in v["notes"]}),
                      "checked": sum(1 for o in usable if any(v["claim"] is c and v["status"] in claims.CHECKED for v in o["verdicts"]))}
                     for c in measurable]
        lower = bool(measurable) and any(all(clean(o, c) for c in measurable) for o in usable)
        upper = any(any(clean(o, c) for c in measurable) for o in usable)
        rows.append({
            "rung": lesson["id"], "title": lesson.get("title"), "stage": stage.get("number"), "track": unit.get("track"),
            "measurable": measurable, "unmeasurable": unmeasurable, "determinacy": determinacy(measurable, unmeasurable),
            "options": options, "usable": len(usable), "perClaim": per_claim, "lower": lower, "upper": upper,
            "runtime": [o["id"] for o in options if o["measured"] == "runtime"],
        })

    write(rows)


def claim_words(claim: dict, demands: dict) -> str:
    if claim["kind"] == "skill":
        return f"skill `{claim['id']}`"
    return f"`{claim['id']}`"


def write(rows: list[dict]) -> None:
    _skills, demands = claims.load_vocabulary()
    total = len(rows)
    det = Counter(r["determinacy"] for r in rows)
    options = [o for r in rows for o in r["options"]]
    sources = Counter(o["source"] for o in options)
    types = Counter(o["type"] for o in options)
    measured = Counter(o["measured"] for o in options)
    not_admitted = [f"{o['id']} on {r['rung']}" for r in rows for o in r["options"] if not o["admitted"]]
    not_offered = [f"{o['id']} on {r['rung']} ({o['listVerdict']})" for r in rows for o in r["options"] if not o["offered"]]
    runtime = [f"{x} on {r['rung']}" for r in rows for x in r["runtime"]]
    from_counts = Counter(c["from"].split(" ")[0] for r in rows for c in r["measurable"])
    lower = sum(1 for r in rows if r["lower"])
    upper = sum(1 for r in rows if r["upper"])
    neither = [r for r in rows if r["measurable"] and not r["upper"]]
    sole = [r for r in rows if r["determinacy"] == "sole"]
    sole_met = sum(1 for r in sole if r["upper"])
    sole_unm = [r for r in rows if r["determinacy"] == "sole+unmeasurable"]
    sole_unm_met = sum(1 for r in sole_unm if r["upper"])
    several = [r for r in rows if r["determinacy"] == "several"]
    several_lower = sum(1 for r in several if r["lower"])
    several_upper = sum(1 for r in several if r["upper"])
    marked_only = [r for r in rows if r["measurable"] and not r["upper"]
                   and all(pc["noted"] == pc["checked"] > 0 for pc in r["perClaim"])]
    strict = sum(1 for r in rows if r["lower"] and not r["unmeasurable"])
    named_unmeasurable = sum(1 for r in rows if r["unmeasurable"])
    exercises = [f"{o['id']} on {r['rung']}" for r in rows for o in r["options"] if o["type"] != "song"]

    L = [
        "# R23 — the read-only application report",
        "",
        "Generated by `docs/prompts/runs/R23/scripts-application-report.py` from the built catalogue and curriculum "
        "(`python tools/content/build.py --offline` at `7d9de990`, the owner's default personal build) and the probe "
        "`scripts-admission.probe.test.ts`. Read-only: nothing on a rung changes. Every number below is a count over "
        "this build's curriculum, not an estimate.",
        "",
        "**Scope.** The rungs whose requirements ask for a run of one of their songs — `validate.thin_lesson_errors`' "
        "`required_songs`, `selectors.asksForSongs` — and, on each, its `songOptions` (the list such a run is drawn "
        "from: `session.wantsOf`, `r.from === 'songs'`). Exempt rungs are left out, as every reader leaves them out.",
        "",
        "## The four facts, and where the repository holds each",
        "",
        "1. **The target claim.** No field, function or report in the repository names the claim a rung's song run "
        "is meant to reinforce. The `runs` requirement carries `from`, `items`, `count`, `performance` and `accuracy` "
        "(`app/src/curriculum/types.ts` `RunsRequirement`) and no target. `claims.rung_claims_of` returns every "
        "measurable claim of the rung (its `skill` requirements, its concepts, `taughtAt`), with no one of them marked "
        "as the application's. The session asks the gate of a song-run option as `{ for: 'equivalent' }` — \"an "
        "automatic experience claiming no opportunity\" (`eligibility.automaticFromList`, asked by `session.fromList` "
        "from `session.wantsOf`), then offers the first such option in the rung's authored order that has no qualifying "
        "run yet (`session.pick`, `seed % offer.length`, the seed 0 until the learner shuffles) — so the runtime does "
        "not name one either, and the list's order stands in for fit. `candidates.MaterialRequirements.target` "
        "has the shape for a target and no caller states a rung's. `finder.skill` is prose for a search, not a claim "
        "the measurement reads. Below, the rungs are therefore sorted by how determinate their own measurable claims "
        "leave the target, which is this report's reading, not a repository fact.",
        "2. **Measured opportunity against a target.** Held twice, reading the same fields by the same rule: "
        "`claims.status_of` at build time and `eligibilityCore.opportunity` at runtime (both: a wanted demand in "
        "`measurement.established` is established, in `demands` incidental, else absent; a skill's wanted demands from "
        "the same `skills.json`). Read by comparing the code. No test holds the two equal over the catalogue "
        "(`app/tests/unit` and `tools/content/tests` searched for `status_of`, `eligibilityCore` and `rung-claims`); "
        "one paired case exists, the unsounded key signature read as incidental "
        "(`tools/content/tests/test_taught_at.py`:540–567, its twin in `copingQuestion.test.ts`). Whether the two stay "
        "one computation is CL11's question, not this lane's.",
        "3. **Teaching-use admission.** Held once, in the app: `eligibilityCore.unapprovedMusic` / "
        "`admittedForTeaching` (a generated item whose family promises music, or an excerpt, without an affirmative "
        "`review.teaching` on its current identity). The build carries the inputs (`provenance.facts.promise`, "
        "`provenance.review.teaching`) and `claims.py` prints the review fact, but no Python reader composes them into "
        "an admission. The excerpt and study candidate-rung reports (`excerpts.candidate_rungs`, "
        "`study.candidate_rungs`) state the teaching-use half as a placement rule in prose and test only \"establishes "
        "at least one of the rung's claims\" — the proxy the required change refuses.",
        "4. **Runtime, creative or ear options.** `claims.status_of` returns `runtime` (or `the reader's` for a "
        "reading row's own skill) and `rung-claims.md` prints `— (runtime)`; neither counts as established or as "
        "refuted. A rule a run cannot show is an `unjudged` requirement, printed and never counted.",
        "",
        "No function joins (1) to (2) and (3) for a rung's application, at build time or at runtime.",
        "",
        "## Numbers",
        "",
        f"- **{total} rungs ask for a song run.** Their song options: {len(options)} listings "
        f"({', '.join(f'{k} {v}' for k, v in sorted(types.items(), key=lambda kv: str(kv[0])))} by catalogue type; "
        f"{', '.join(f'{k} {v}' for k, v in sorted(sources.items(), key=lambda kv: str(kv[0])))} by source; "
        f"measurement {', '.join(f'{k} {v}' for k, v in sorted(measured.items(), key=lambda kv: str(kv[0])))}). "
        f"Listed as songs and catalogued as something else: {'; '.join(exercises) or 'none'}.",
        f"- **Teaching-use admission applies to none of them on this build**: not admitted {len(not_admitted)}"
        + (f" ({'; '.join(not_admitted)})" if not_admitted else "")
        + ". No song option is generated music or an excerpt, the only two kinds the admission refuses. "
        f"Refused by the list gate with no learner: {len(not_offered)}"
        + (f" ({'; '.join(not_offered)})" if not_offered else "") + ".",
        f"- **Runtime, creative or ear options among them: {len(runtime)}**"
        + (f" ({'; '.join(runtime)})" if runtime else "")
        + ". The decision's creative, harmony, accompaniment and ear applications live today on the "
        "`songOptional` rungs, whose requirements ask for exercises and no song, so no song-count gate reads them.",
        f"- **Where the rungs' measurable claims come from:** "
        + ", ".join(f"{k} {v}" for k, v in sorted(from_counts.items())) + ".",
        f"- **Target determinacy:** " + "; ".join(f"{DETERMINACY_WORDS[k]} {det.get(k, 0)}" for k in DETERMINACY_WORDS) + ".",
        f"- **Rungs with no measurable claim at all: {det.get('none', 0)}** (Hypothesis 2's refuting case: any "
        "claim-based rule would fail every option there, a perfect one included)"
        + (": " + ", ".join(r["rung"] for r in rows if r["determinacy"] == "none") if det.get("none") else "") + ".",
        f"- **The bracket** (an admitted, list-offered option establishing the claim, with no E22 mark bearing on it):",
        f"  - **lower bound — {lower} of {total}**: some option establishes *every* measurable claim of the rung, so "
        "it would serve whichever of those claims were named the target. Conditional even so: "
        f"{named_unmeasurable} of the {total} rungs also name a concept no detector measures, and the target may be "
        f"one of those. Where the rung names nothing unmeasurable, the strict count is **{strict}**;",
        f"  - **upper bound — {upper} of {total}**: some option establishes *at least one* claim — the proxy "
        "`responses/71730e65.md` refuses, given only as the bound;",
        f"  - between them, **{upper - lower} rungs** depend on which claim is named the target, which nothing names;",
        f"  - **{len(neither)} rungs** have a measurable claim and no option establishing any of them"
        + (": " + ", ".join(r["rung"] for r in neither) if neither else "") + ". Beside each, what the notes "
        "say of the verdicts that did not establish:",
        *[f"    - {r['rung']}: " + "; ".join(
            f"{claim_words(pc['claim'], demands)} — {pc['noted']} of {pc['checked']} with a note"
            + (f" ({' / '.join(pc['notes'])})" if pc["notes"] else "")
            for pc in r["perClaim"]) for r in neither],
        f"- By determinacy: of the {len(sole)} rungs whose sole measurable claim is all they name, {sole_met} have an "
        f"option establishing it; of the {len(sole_unm)} whose one measurable claim stands beside concepts no detector "
        f"measures, {sole_unm_met} (the target may be one of those concepts, which no detector can establish); of the "
        f"{len(several)} with several, {several_lower} at the lower bound and {several_upper} at the upper.",
        f"- Rungs at neither bound where every verdict that did not establish carries a recorded misreading or an "
        f"E22 caution, so a claim-based gate would fail them on readings the record itself does not trust: "
        f"{len(marked_only)}" + (": " + ", ".join(r["rung"] for r in marked_only) if marked_only else "") + ".",
        "",
        "Nothing here is a teaching-quality judgement. `established` is a notation-and-detector fact; whether a song "
        "counted here reads as a strong application to a teacher is unverified as music and pedagogy.",
        "",
        "## Every rung that asks for a song run",
        "",
        "Song options: listed / admitted and list-offered. Per claim: options establishing it clean, `+n` with an E22 "
        "mark, then incidental, of the checked. Lower and upper: the bracket above.",
        "",
        "| Rung | Songs | Measurable claims: established clean (+E22) / incidental / checked | Not measurable | Determinacy | Lower | Upper |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for r in rows:
        claims_cell = "; ".join(
            f"{claim_words(pc['claim'], demands)} ({pc['claim']['from']}): {pc['clean']}"
            + (f" (+{pc['marked']})" if pc["marked"] else "") + f" / {pc['incidental']} / {pc['checked']}"
            + (f", {pc['noted']} not established under a note" if pc["noted"] else "")
            for pc in r["perClaim"]) or "—"
        L.append(f"| {r['rung']} — {r['title']} | {len(r['options'])} / {r['usable']} | {claims_cell} | "
                 f"{', '.join(r['unmeasurable']) or '—'} | {DETERMINACY_WORDS[r['determinacy']]} | "
                 f"{'yes' if r['lower'] else 'no'} | {'yes' if r['upper'] else 'no'} |")
    L.append("")
    OUT.write_text("\n".join(L), encoding="utf-8")
    print(f"{total} rungs; lower {lower}; upper {upper}; none {det.get('none', 0)}; neither {len(neither)}; "
          f"not admitted {len(not_admitted)}; not offered {len(not_offered)}; runtime {len(runtime)} -> {OUT.name}")


if __name__ == "__main__":
    main()
