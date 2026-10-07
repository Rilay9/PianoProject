#!/usr/bin/env python3
"""
The gap-analysis table and the placement matrix (docs/classifier/README.md; the brief is
docs/prompts/inputs-2026-10-07/classifier-review.md).

Reads docs/classifier/{characteristics,concepts,places}.yaml and the curriculum, checks they
cover each other exactly, and writes docs/classifier/generated/:
  table.md      - the one table: CHARACTERISTIC | NEEDED FOR | GEN/PDMX/BOTH | CLASS | CURRENT CODE | STATUS | GAP
  judgment.md   - every JUDGMENT row with its split into measurable evidence and the residual question
  rungs.md      - one row per rung: the characteristics its concepts read, by class and status
  research.md   - what no code can decide yet: definitions, sources, residuals, ambiguous names
  summary.md    - the counts
  matrix.json   - everything above, for the classifier to read later

It decides no placement and designs nothing. It fails (exit 1) on any gap between the files and
the curriculum, on a row with a missing or illegal field, on EXISTS without code, and on a
JUDGMENT row without a split, so nothing is left out silently.

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
CLASSES = ["CODE-EXACT", "CODE-RULE", "CODE-INFERENCE", "EXTERNAL", "JUDGMENT"]
STATUSES = ["EXISTS", "PARTLY", "MISSING"]
NEEDS = {"cope", "exercises", "material"}
PIPES = {"generated", "pdmx", "both"}
AREAS = ["prereq", "notation", "rhythm", "reading", "harmony", "texture", "coordination", "technique", "form",
         "expression", "difficulty", "pedagogy", "generated", "integrity", "style", "quality", "meta"]


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


def worst(values: list[str], order: list[str]) -> str | None:
    return max(values, key=order.index) if values else None


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

    # --- every row is complete and legal
    for cid, v in chars.items():
        for field in ("area", "need", "dec", "pipe", "cls", "code", "status", "gap"):
            if field not in v:
                errors.append(f"characteristic {cid}: missing {field}")
        if v.get("area") not in AREAS:
            errors.append(f"characteristic {cid}: unknown area {v.get('area')}")
        if v.get("need") not in NEEDS:
            errors.append(f"characteristic {cid}: need must be one of {sorted(NEEDS)}")
        if v.get("pipe") not in PIPES:
            errors.append(f"characteristic {cid}: pipe must be one of {sorted(PIPES)}")
        if v.get("cls") not in CLASSES:
            errors.append(f"characteristic {cid}: cls must be one of {CLASSES}")
        if v.get("status") not in STATUSES:
            errors.append(f"characteristic {cid}: status must be one of {STATUSES}")
        if v.get("status") == "EXISTS" and str(v.get("code", "none")).lower() == "none":
            errors.append(f"characteristic {cid}: EXISTS needs code that has run (file:line)")
        if v.get("cls") == "JUDGMENT":
            split = v.get("split") or {}
            if not split.get("measurable") or not split.get("residual"):
                errors.append(f"characteristic {cid}: a JUDGMENT row needs split.measurable and split.residual")
            for m in split.get("measurable", []):
                if m not in chars:
                    errors.append(f"characteristic {cid}: split names unknown row {m}")
                elif chars[m].get("cls") == "JUDGMENT":
                    errors.append(f"characteristic {cid}: split.measurable {m} is itself JUDGMENT")
        elif "split" in v:
            errors.append(f"characteristic {cid}: only JUDGMENT rows carry a split")

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

    # --- where each characteristic is used
    uses = {cid: {"concepts": set(), "rungs": set(), "tracks": set(), "abilities": set()} for cid in chars}
    for c, v in concepts.items():
        for ch in v.get("ch", []):
            if ch in uses:
                uses[ch]["concepts"].add(c)
                uses[ch]["rungs"].update(rung_concepts.get(c, []))
    for pid, v in places["tracks"].items():
        for ch in v.get("ch", []):
            if ch in uses:
                uses[ch]["tracks"].add(pid)
    for pid, v in places["abilities"].items():
        for ch in v.get("material", []):
            if ch in uses:
                uses[ch]["abilities"].add(pid)
    for cid in chars:
        chars[cid]["uses"] = {k: sorted(s) for k, s in uses[cid].items()}

    # --- the rung matrix
    rung_rows = []
    for r in rungs:
        l = r["lesson"]
        by_kind = collections.defaultdict(list)
        rows = []
        for c in l.get("concepts", []):
            v = concepts.get(c, {})
            by_kind[v.get("k", "?")].append(c)
            if v.get("k") in KINDS_NEED_CH:
                for ch in v.get("ch", []):
                    if ch in chars:
                        rows.append({"concept": c, "characteristic": ch, "cls": chars[ch]["cls"], "status": chars[ch]["status"]})
        rung_rows.append({
            "id": l["id"], "stage": r["stage"], "track": r["track"], "title": l["title"],
            "levelBand": l.get("levelBand"), "prerequisites": l.get("prerequisites", []),
            "requirements": l.get("requirements", []), "finder_constraints": (l.get("finder") or {}).get("constraints", []),
            "options": len(l.get("exerciseOptions", [])) + len(l.get("songOptions", [])),
            "concepts_by_kind": dict(by_kind), "rows": rows,
            "hardest_class": worst([x["cls"] for x in rows], CLASSES),
            "missing": sorted({x["characteristic"] for x in rows if x["status"] == "MISSING"}),
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


def needed_for(cid: str, v: dict) -> str:
    u = v["uses"]
    parts = [f"{v['need']}: {v['dec']}"]
    if u["rungs"]:
        parts.append(f"{len(u['rungs'])} rungs ({', '.join(u['rungs'][:3])}{', …' if len(u['rungs']) > 3 else ''})")
    if u["tracks"]:
        parts.append("tracks " + ", ".join(u["tracks"]))
    if u["abilities"]:
        parts.append("abilities " + ", ".join(u["abilities"]))
    return "; ".join(parts)


def cell(x) -> str:
    return str(x if x is not None else "none").replace("|", "\\|")


def render(matrix: dict) -> dict[str, str]:
    chars, concepts = matrix["characteristics"], matrix["concepts"]
    out = {}

    # table.md
    lines = ["# The gap-analysis table", "",
             "Generated by `tools/classifier/build_matrix.py` from `characteristics.yaml`; do not edit. One row per",
             "characteristic placement needs. NEEDED FOR gives the placement question (cope / exercises / material),",
             "the decision, and the places that read it through `concepts.yaml` and `places.yaml`. STATUS is EXISTS",
             "only where the named code has run on real catalogue items. Nothing here is a rule or a design.", ""]
    for area in AREAS:
        rows = [(cid, v) for cid, v in chars.items() if v["area"] == area]
        if not rows:
            continue
        lines += [f"## {area}", "", "| CHARACTERISTIC | NEEDED FOR | GEN/PDMX/BOTH | CLASS | CURRENT CODE | STATUS | GAP |",
                  "| --- | --- | --- | --- | --- | --- | --- |"]
        for cid, v in rows:
            lines.append(f"| `{cid}` | {cell(needed_for(cid, v))} | {v['pipe']} | {v['cls']} | {cell(v['code'])} | {v['status']} | {cell(v['gap'])} |")
        lines.append("")
    out["table.md"] = "\n".join(lines)

    # judgment.md
    lines = ["# JUDGMENT rows, each split", "",
             "Generated; do not edit. Every row the table marks JUDGMENT, split into the evidence code establishes",
             "first and the smaller question left to an agent. The agent's packet is the measured rows and the",
             "residual question only, never the whole score with an open question.", ""]
    for cid, v in chars.items():
        if v["cls"] == "JUDGMENT":
            s = v["split"]
            lines += [f"## `{cid}`: {v['dec']}", "",
                      "- measurable first: " + ", ".join(f"`{m}` ({chars[m]['cls']}, {chars[m]['status']})" for m in s["measurable"]),
                      f"- residual: {s['residual']}", ""]
    out["judgment.md"] = "\n".join(lines)

    # rungs.md
    lines = ["# Rungs: the characteristics each one reads", "",
             "Generated; do not edit. For each rung: the concepts the rung names by kind, the hardest verifiability",
             "class among the characteristics its note and metadata concepts read, and the characteristics with no",
             "code at all. No rung is decidable today: no rule has a quoted source and no difficulty is calibrated.", ""]
    for st in sorted({r["stage"] for r in matrix["rungs"]}):
        lines += [f"## Stage {st}", "", "| Rung | Track | Band | Hardest class | Characteristics read (class, status) | Not by the notes | MISSING | Ambiguous |",
                  "| --- | --- | --- | --- | --- | --- | --- | --- |"]
        for r in [x for x in matrix["rungs"] if x["stage"] == st]:
            k = r["concepts_by_kind"]
            seen, read = set(), []
            for x in r["rows"]:
                if x["characteristic"] not in seen:
                    seen.add(x["characteristic"])
                    read.append(f"{x['characteristic']} ({x['cls'][5:] if x['cls'].startswith('CODE-') else x['cls']}, {x['status'][0]})")
            other = ", ".join(f"{c} ({concepts[c]['k']})" for kk in ("played", "activity", "app", "drill") for c in k.get(kk, []))
            band = "-".join(str(b) for b in (r["levelBand"] or []))
            lines.append(f"| {r['id']} | {r['track']} | {band} | {r['hardest_class'] or '-'} | {', '.join(read) or '-'} | {other or '-'} | {len(r['missing'])} | {', '.join(r['ambiguous']) or '-'} |")
        lines.append("")
    out["rungs.md"] = "\n".join(lines)

    # research.md
    lines = ["# Research list: what no code can decide yet", "",
             "Generated; do not edit. Each line is one task for a research agent. A task closes when its answer is",
             "written into the source yaml: a quoted definition, a method with its confidence, a source, a per-rung meaning.", ""]
    rule_needed = [c for c, v in chars.items() if v["cls"] == "CODE-RULE" and str(v.get("src")) == "NEEDED"]
    lines += [f"## 1. CODE-RULE rows whose definition is not yet quoted ({len(rule_needed)})", "",
              "Find the published definition the matcher will quote; sourced examples and near-misses become its fixtures.", ""]
    lines += [f"- `{c}`: {chars[c]['dec']} ({chars[c]['status']}; {chars[c]['gap']})" for c in rule_needed]
    verify = [c for c, v in chars.items() if str(v.get("src")) == "verify"]
    lines += ["", f"## 2. Existing rules whose source must be checked ({len(verify)})", ""]
    lines += [f"- `{c}`: read `{chars[c]['code']}` and its tests for the quoted definition and sourced near-misses." for c in verify]
    infer = [c for c, v in chars.items() if v["cls"] == "CODE-INFERENCE"]
    lines += ["", f"## 3. CODE-INFERENCE rows: the method and its confidence handling ({len(infer)})", "",
              "For each: the library or model, how a confidence is produced, what the ambiguous case does (UNKNOWN, never a guess).", ""]
    lines += [f"- `{c}`: {chars[c]['dec']} ({chars[c]['status']}; {chars[c]['gap']})" for c in infer]
    ext = [c for c, v in chars.items() if v["cls"] == "EXTERNAL"]
    lines += ["", f"## 4. EXTERNAL rows: the outside source to obtain ({len(ext)})", ""]
    lines += [f"- `{c}`: {chars[c]['dec']} ({chars[c]['status']}; {chars[c]['gap']})" for c in ext]
    jud = [c for c, v in chars.items() if v["cls"] == "JUDGMENT"]
    lines += ["", f"## 5. JUDGMENT residuals: challenge each again ({len(jud)}; the splits are in judgment.md)", ""]
    lines += [f"- `{c}`: {chars[c]['split']['residual']}" for c in jud]
    amb = [(c, v["amb"]) for c, v in concepts.items() if v.get("amb")]
    lines += ["", f"## 6. Ambiguous or duplicate concept names ({len(amb)})", "", "Each needs one meaning per rung, or a merge with its duplicate.", ""]
    lines += [f"- `{c}`: {a}" for c, a in amb]
    lines += ["", "## 7. Place rules with no source", ""]
    for group in ("tracks", "stages"):
        for pid, v in matrix[group].items():
            if str(v.get("src")) == "NEEDED":
                lines.append(f"- {group[:-1]} `{pid}`: {v.get('rule') or v.get('calibration')}")
    lines += ["", f"- every one of the {matrix['counts']['rungs']} rung rules: what each rung is trying to accomplish, before any density threshold is written", ""]
    by_ear = [c for c, v in concepts.items() if v.get("instead") == "by-ear"]
    lines += [f"## 8. Inputs that are recordings, not scores ({len(by_ear)} concepts, plus A3.1 and A7e.1)", "",
              f"- how to source recordings whose content is known: {', '.join(by_ear)}", ""]
    lines += ["## 9. Tools named but not installed or not checked", "",
              "- jSymbolic2 (needs Java; not installed), MusPy, pianoplayer, AugmentedNet: not installed; quality unchecked.",
              "- CIPI and PSyllabus graded datasets: not downloaded; existence and contents unchecked here.", ""]
    out["research.md"] = "\n".join(lines)

    # summary.md
    cnt = matrix["counts"]
    cs = collections.Counter((v["cls"], v["status"]) for v in chars.values())
    lines = ["# Summary", "", "Generated; every count below was checked against its source list by the script.", "",
             f"- Places: {cnt['rungs']} rungs, {cnt['tracks']} tracks, {cnt['stages']} stages, {cnt['abilities']} abilities; {cnt['concepts']} concept names (a name is not a detector: `concepts.yaml` maps them onto the rows below).",
             f"- Characteristics: {cnt['characteristics']}.", "", "| CLASS | EXISTS | PARTLY | MISSING | total |", "| --- | --- | --- | --- | --- |"]
    for c in CLASSES:
        lines.append(f"| {c} | {cs[(c, 'EXISTS')]} | {cs[(c, 'PARTLY')]} | {cs[(c, 'MISSING')]} | {sum(cs[(c, s)] for s in STATUSES)} |")
    lines.append(f"| total | {sum(v for (c, s), v in cs.items() if s == 'EXISTS')} | {sum(v for (c, s), v in cs.items() if s == 'PARTLY')} | {sum(v for (c, s), v in cs.items() if s == 'MISSING')} | {cnt['characteristics']} |")
    pipe = collections.Counter(v["pipe"] for v in chars.values())
    need = collections.Counter(v["need"] for v in chars.values())
    area = collections.Counter(v["area"] for v in chars.values())
    lines += ["", "- By pipeline: " + ", ".join(f"{k} {pipe[k]}" for k in ("both", "pdmx", "generated")) + ".",
              "- By placement question: " + ", ".join(f"{k} {need[k]}" for k in ("cope", "exercises", "material")) + ".",
              "- By area: " + ", ".join(f"{a} {area[a]}" for a in AREAS if area[a]) + ".",
              f"- Rungs whose hardest class is JUDGMENT: {sum(1 for r in matrix['rungs'] if r['hardest_class'] == 'JUDGMENT')}; rungs reading no characteristic at all: {sum(1 for r in matrix['rungs'] if not r['rows'])}.",
              "- Rules with a quoted source: 0. No rung is decidable today.", ""]
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
        print(f"{len(errors)} errors", file=sys.stderr)
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
