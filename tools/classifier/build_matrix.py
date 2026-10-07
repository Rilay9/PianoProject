#!/usr/bin/env python3
"""
The placement matrix: every place in the curriculum, the rule that would decide what goes
there, and how each part of that rule is measured (docs/classifier/README.md).

Reads docs/classifier/{characteristics,concepts,places}.yaml and the curriculum, checks they
cover each other exactly, and writes docs/classifier/generated/:
  matrix.json   - every rung, track, stage and ability with its rule clauses and methods
  rungs.md      - one row per rung: concepts by kind, what decides it, what is missing
  research.md   - everything no code can decide yet: methods, sources, ambiguous concepts
  summary.md    - the counts, each checked against its source list

It decides no placement. It fails (exit 1) on any gap between the files and the
curriculum, so a rung, concept, track, stage or ability cannot be silently left out.

    python tools/classifier/build_matrix.py          # write generated/
    python tools/classifier/build_matrix.py --check  # fail if generated/ is stale
"""
from __future__ import annotations

import argparse
import collections
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs" / "classifier"
OUT = DOCS / "generated"
ABILITY_MAP = ROOT / "docs/prompts/runs/curriculum-review-2026-10-05/ABILITY-MAP.md"
KINDS_NEED_CH = {"notes", "meta"}
KINDS_NEED_INSTEAD = {"played", "activity", "app", "drill"}
METHOD_ORDER = ["existing", "library", "metadata", "matcher", "research"]


def load_yaml(name: str) -> dict:
    return yaml.safe_load((DOCS / name).read_text(encoding="utf-8"))


def load_curriculum() -> tuple[list[dict], dict[int, dict]]:
    rungs, stages = [], {}
    for f in sorted((ROOT / "content/curriculum").glob("stage-*.json")):
        for st in json.loads(f.read_text(encoding="utf-8"))["stages"]:
            stages[st["number"]] = st
            for u in st["units"]:
                for l in u["lessons"]:
                    rungs.append({"stage": st["number"], "track": u.get("track"), "unit": u["id"], "lesson": l})
    return rungs, stages


def ability_ids() -> list[str]:
    return [m.group(1) for m in re.finditer(r"^#### (A[0-9]+[a-z]?\.[0-9]+) ", ABILITY_MAP.read_text(encoding="utf-8"), re.M)]


def worst(methods: list[str]) -> str | None:
    return max(methods, key=METHOD_ORDER.index) if methods else None


def build() -> tuple[dict, list[str]]:
    errors: list[str] = []
    chars = load_yaml("characteristics.yaml")
    cdoc = load_yaml("concepts.yaml")
    concepts, instead_rules = cdoc["concepts"], cdoc["instead_rules"]
    places = load_yaml("places.yaml")
    rungs, stages = load_curriculum()
    tracks_src = [t["id"] for t in json.loads((ROOT / "content/curriculum/00-tracks.json").read_text(encoding="utf-8"))["tracks"]]
    abilities_src = ability_ids()

    # --- coverage: each list against its source, both ways
    def same(label: str, have, want) -> None:
        have, want = set(map(str, have)), set(map(str, want))
        for x in sorted(want - have):
            errors.append(f"{label}: missing {x}")
        for x in sorted(have - want):
            errors.append(f"{label}: extra {x} (not in the source list)")

    rung_concepts = collections.defaultdict(list)
    for r in rungs:
        for c in r["lesson"].get("concepts", []):
            rung_concepts[c].append(r["lesson"]["id"])
    same("concepts.yaml vs rung concepts", concepts, rung_concepts)
    same("places.yaml tracks vs 00-tracks.json", places["tracks"], tracks_src)
    same("places.yaml stages vs stage files", places["stages"], stages)
    same("places.yaml abilities vs ABILITY-MAP.md", places["abilities"], abilities_src)
    if len(abilities_src) != len(set(abilities_src)):
        errors.append("ABILITY-MAP.md: duplicate ability heading")

    # --- every reference resolves
    for c, v in concepts.items():
        k = v.get("k")
        if k not in KINDS_NEED_CH | KINDS_NEED_INSTEAD:
            errors.append(f"concept {c}: unknown kind {k}")
        if k in KINDS_NEED_CH and not v.get("ch"):
            errors.append(f"concept {c}: kind {k} needs characteristics")
        if k in KINDS_NEED_INSTEAD and v.get("instead") not in instead_rules:
            errors.append(f"concept {c}: kind {k} needs an instead rule from instead_rules")
        for ch in v.get("ch", []):
            if ch not in chars:
                errors.append(f"concept {c}: unknown characteristic {ch}")
    for group in ("tracks", "abilities"):
        for pid, v in places[group].items():
            for ch in v.get("ch", []) + v.get("material", []):
                if ch not in chars:
                    errors.append(f"{group} {pid}: unknown characteristic {ch}")
    for cid, v in chars.items():
        if v.get("method") not in METHOD_ORDER:
            errors.append(f"characteristic {cid}: unknown method {v.get('method')}")

    # --- the rung matrix
    def clause(ch: str) -> dict:
        v = chars.get(ch, {})
        return {"characteristic": ch, "method": v.get("method"), "impl": v.get("impl"), "w2": v.get("w2"), "src": v.get("src")}

    rung_rows = []
    for r in rungs:
        l = r["lesson"]
        by_kind = collections.defaultdict(list)
        clauses, methods = [], []
        for c in l.get("concepts", []):
            v = concepts.get(c, {})
            by_kind[v.get("k", "?")].append(c)
            if v.get("k") in KINDS_NEED_CH:
                for ch in v.get("ch", []):
                    clauses.append({"concept": c, **clause(ch)})
                    methods.append(chars.get(ch, {}).get("method"))
        decidable = [m for m in methods if m]
        status = ("not by notes" if not decidable else
                  {"existing": "measurable now", "library": "library call needed", "metadata": "library call needed",
                   "matcher": "matchers needed", "research": "research needed"}[worst(decidable)])
        rung_rows.append({
            "id": l["id"], "stage": r["stage"], "track": r["track"], "title": l["title"],
            "levelBand": l.get("levelBand"), "prerequisites": l.get("prerequisites", []),
            "requirements": l.get("requirements", []), "finder_constraints": (l.get("finder") or {}).get("constraints", []),
            "options": len(l.get("exerciseOptions", [])) + len(l.get("songOptions", [])),
            "concepts_by_kind": dict(by_kind), "clauses": clauses, "status": status,
            "standing_clauses": [
                {"rule": "difficulty inside levelBand", "characteristic": "difficulty.level", "src": "NEEDED (calibration)"},
                {"rule": "no demand the rung's ancestry has not taught", "characteristic": "the 22 demands", "impl": "tools/content/claims.py untaught_on", "src": "the curriculum's own order"},
            ],
            "ambiguous": [c for c in l.get("concepts", []) if concepts.get(c, {}).get("amb")],
        })

    matrix = {
        "characteristics": chars, "concepts": concepts, "instead_rules": instead_rules,
        "rungs": rung_rows, "tracks": places["tracks"],
        "stages": {k: {**v, "rungs": [x["id"] for x in rung_rows if str(x["stage"]) == str(k)]} for k, v in places["stages"].items()},
        "abilities": places["abilities"],
        "counts": {"rungs": len(rung_rows), "concepts": len(concepts), "characteristics": len(chars),
                   "tracks": len(places["tracks"]), "stages": len(places["stages"]), "abilities": len(places["abilities"])},
    }
    return matrix, errors


def render(matrix: dict) -> dict[str, str]:
    chars, concepts = matrix["characteristics"], matrix["concepts"]
    out = {}

    # rungs.md
    lines = ["# Rungs: what would decide each one", "",
             "Generated by `tools/classifier/build_matrix.py`; do not edit. Status is the hardest method among the",
             "characteristics the rung's note and metadata concepts need. Every rung also has the two standing clauses",
             "(difficulty inside its band, nothing untaught) and every rule's source is still NEEDED.", ""]
    for st in sorted({r["stage"] for r in matrix["rungs"]}):
        lines += [f"## Stage {st}", "", "| Rung | Track | Band | Status | Decided from the notes | Not by the notes | Ambiguous |", "| --- | --- | --- | --- | --- | --- | --- |"]
        for r in [x for x in matrix["rungs"] if x["stage"] == st]:
            k = r["concepts_by_kind"]
            notes = ", ".join(f"{c} ({worst([chars[ch]['method'] for ch in concepts[c]['ch']])})" for c in k.get("notes", []) + k.get("meta", []))
            other = ", ".join(f"{c} ({concepts[c]['k']})" for kk in ("played", "activity", "app", "drill") for c in k.get(kk, []))
            band = "-".join(str(b) for b in (r["levelBand"] or []))
            lines.append(f"| {r['id']} | {r['track']} | {band} | {r['status']} | {notes or '-'} | {other or '-'} | {', '.join(r['ambiguous']) or '-'} |")
        lines.append("")
    out["rungs.md"] = "\n".join(lines)

    # research.md
    used_by = collections.defaultdict(set)
    for c, v in concepts.items():
        for ch in v.get("ch", []):
            used_by[ch].add(c)
    lines = ["# Research list: what no code can decide yet", "",
             "Generated by `tools/classifier/build_matrix.py`; do not edit. Each line is one research task. A task",
             "closes when its answer is written into the source yaml (a quoted source, a method, a per-rung meaning).", ""]
    res = [c for c, v in chars.items() if v["method"] == "research"]
    lines += [f"## 1. No reliable method known ({len(res)})", ""]
    lines += [f"- `{c}`: {chars[c]['impl']}. Used by: {', '.join(sorted(used_by[c])) or 'place rules only'}." for c in res]
    need = [c for c, v in chars.items() if str(v.get("src")) == "NEEDED"]
    lines += ["", f"## 2. Characteristics with no published definition yet ({len(need)})", "",
              "Find the definition the matcher or threshold will quote (a syllabus, a reference text, a dataset's annotation guide).", ""]
    lines += [f"- `{c}` ({chars[c]['method']}): {chars[c]['impl']}" for c in need]
    ver = [c for c, v in chars.items() if str(v.get("src")) == "verify"]
    lines += ["", f"## 3. Existing detectors whose source must be checked ({len(ver)})", ""]
    lines += [f"- `{c}`: read `app/src/demands/detect.ts` and its tests for a quoted definition and sourced near-misses." for c in ver]
    amb = [(c, v["amb"]) for c, v in concepts.items() if v.get("amb")]
    lines += ["", f"## 4. Ambiguous or duplicate concept names ({len(amb)})", "",
              "Each needs one meaning per rung, or a merge with its duplicate.", ""]
    lines += [f"- `{c}`: {a}" for c, a in amb]
    lines += ["", "## 5. Place rules with no source", ""]
    for group in ("tracks", "stages"):
        for pid, v in matrix[group].items():
            if str(v.get("src")) == "NEEDED":
                lines.append(f"- {group[:-1]} `{pid}`: {v.get('rule') or v.get('calibration')}")
    lines += ["", f"- every one of the {matrix['counts']['rungs']} rung rules: the required density of each concept, and the band, quoted from a syllabus", ""]
    by_ear = [c for c, v in concepts.items() if v.get("instead") == "by-ear"]
    lines += [f"## 6. Inputs that are recordings, not scores ({len(by_ear)} concepts, plus A3.1 and A7e.1)", "",
              f"- how to source recordings whose content is known: {', '.join(by_ear)}", ""]
    lines += ["## 7. Tools named but not installed or not checked", "",
              "- jSymbolic2 (needs Java; not installed), MusPy, pianoplayer, AugmentedNet: not installed; quality unchecked.",
              "- CIPI and PSyllabus graded datasets: not downloaded; existence and contents unchecked here.", ""]
    out["research.md"] = "\n".join(lines)

    # summary.md
    cnt = matrix["counts"]
    mcount = collections.Counter(v["method"] for v in chars.values())
    kcount = collections.Counter(v["k"] for v in concepts.values())
    scount = collections.Counter(r["status"] for r in matrix["rungs"])
    tcount = collections.Counter(v["decided_by"] for v in matrix["tracks"].values())
    acount = collections.Counter(v["decided_by"] for v in matrix["abilities"].values())
    lines = ["# Summary", "", "Generated by `tools/classifier/build_matrix.py`; every count below was checked against its source list by the script.", "",
             f"- Places: {cnt['rungs']} rungs, {cnt['tracks']} tracks, {cnt['stages']} stages, {cnt['abilities']} abilities.",
             f"- Concepts named by rungs: {cnt['concepts']}, by kind: " + ", ".join(f"{k} {n}" for k, n in kcount.most_common()) + ".",
             f"- Characteristics: {cnt['characteristics']}, by method: " + ", ".join(f"{k} {mcount[k]}" for k in METHOD_ORDER) + ".",
             "- Rungs by status: " + ", ".join(f"{k} {n}" for k, n in scount.most_common()) + ".",
             "- Tracks by what decides them: " + ", ".join(f"{k} {n}" for k, n in tcount.most_common()) + ".",
             "- Abilities by what decides their material: " + ", ".join(f"{k} {n}" for k, n in acount.most_common()) + ".",
             "- Rules with a quoted source: 0. Every rule is a current claim until research.md section 5 closes.", ""]
    out["summary.md"] = "\n".join(lines)
    out["matrix.json"] = json.dumps(matrix, indent=1, ensure_ascii=False, default=str)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    matrix, errors = build()
    if errors:
        print("\n".join(errors), file=sys.stderr)
        print(f"{len(errors)} coverage errors", file=sys.stderr)
        return 1
    files = render(matrix)
    if args.check:
        stale = [n for n, t in files.items() if not (OUT / n).exists() or (OUT / n).read_text(encoding="utf-8") != t + "\n"]
        if stale:
            print("stale: " + ", ".join(stale), file=sys.stderr)
            return 1
        return 0
    OUT.mkdir(parents=True, exist_ok=True)
    for n, t in files.items():
        (OUT / n).write_text(t + "\n", encoding="utf-8", newline="\n")
    print(json.dumps(matrix["counts"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
