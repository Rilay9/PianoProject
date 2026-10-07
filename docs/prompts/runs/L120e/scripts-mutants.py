"""
L120e's mutants: copies of `tools/content/study.py`, `excerpts.py` and `claims.py` under the worktree's
`build/l120e/mutants/`, never the source. A study or excerpts mutant is set as the module its tests read (`S` in
`tests.test_study`, `X` in `tests.test_excerpts`); a claims mutant replaces `claims` in `sys.modules`, which both
reports import when they run (the tests' own oracles keep the real module they bound at import, and read only
`untaught_on`, which no mutant touches). One process, so the bridge measures the plan studies once. The classes run:
the study report's (`TestTheCandidateRungsReport`, `TestACopingOnlyAdmissionIsNamed`) and the excerpt report's
(`TheCandidateRungsNameACopingOnlyAdmission`). The control is the three unmutated copies through the same harness.
Run from the worktree root:

    python docs/prompts/runs/L120e/scripts-mutants.py docs/prompts/runs/L120e/mutants.txt
"""
from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
CONTENT = ROOT / "tools" / "content"
OUT_DIR = ROOT / "build" / "l120e" / "mutants"
STUDY_CLASSES = ("TestTheCandidateRungsReport", "TestACopingOnlyAdmissionIsNamed")
EXCERPT_CLASSES = ("TheCandidateRungsNameACopingOnlyAdmission",)

# Each copy reads the curriculum and the vocabulary where its source does, not beside the copy.
HERE = {"study": "HERE = Path(__file__).resolve().parent\n", "claims": "HERE = Path(__file__).resolve().parent\n"}

S_CALL = "                             **claims.coping_admission(item, rung, ancestry, demands, curriculum, targets),\n"
EMPTY = "                             \"positionCoped\": [], \"notEvidenceFor\": [], \"targetsNotEvidenced\": [],\n"
C_COPED = "    coped = [d for d in untaught_on(item, rung, ancestry, demands) if d not in kept]\n"
C_NAMED = ("    named = [t for t in targets if t in not_evidence or (demands.get(t) or {}).get(\"copedWithBy\") in not_evidence]\n")

MUTANTS: dict[str, dict[str, list[tuple[str, str]]]] = {
    "control": {"study": [], "excerpts": [], "claims": []},
    # the study report
    "study: the flag removed (the reviewer's)": {"study": [(S_CALL, EMPTY)]},
    "study: the flag turned into a refusal": {"study": [(
        "            if established:\n                rows.append({\"rung\": rung, \"title\": lesson.get(\"title\"),\n" + S_CALL,
        "            if established and not claims.coping_admission(item, rung, ancestry, demands, curriculum, targets)[\"positionCoped\"]:\n"
        "                rows.append({\"rung\": rung, \"title\": lesson.get(\"title\"),\n" + S_CALL)]},
    "study: the flag not rendered": {"study": [("{claims.admitted_by(c, 'study')}", "taught")]},
    # the excerpt report
    "excerpts: the flag removed": {"excerpts": [(S_CALL, EMPTY)]},
    "excerpts: the flag turned into a refusal": {"excerpts": [(
        "            if established:\n                rows.append({\"rung\": rung, \"title\": lesson.get(\"title\"),\n" + S_CALL,
        "            if established and not claims.coping_admission(item, rung, ancestry, demands, curriculum, targets)[\"positionCoped\"]:\n"
        "                rows.append({\"rung\": rung, \"title\": lesson.get(\"title\"),\n" + S_CALL)]},
    "excerpts: the flag not rendered": {"excerpts": [("{claims.admitted_by(c, 'excerpt')}", "taught")]},
    "excerpts: the approved targets not read": {"excerpts": [(
        "        targets = list(((item.get(\"provenance\") or {}).get(\"excerpt\") or {}).get(\"targets\") or [])\n",
        "        targets = []\n")]},
    # the shared reading (claims.py), both reports
    "claims: the flag read with the curriculum (empty on every admitted rung)": {"claims": [(
        C_COPED, "    coped = [d for d in untaught_on(item, rung, ancestry, demands, curriculum) if d not in kept]\n")]},
    "claims: the flag on every rung whose item carries a skip or leap": {"claims": [(
        C_COPED, "    coped = [d for d in asked_of(item) if (demands.get(d) or {}).get(\"fixedPositions\")]\n")]},
    "claims: no skill named": {"claims": [(
        "    not_evidence = sorted({demands[d][\"copedWithBy\"] for d in coped})\n", "    not_evidence = []\n")]},
    "claims: the target clause dropped": {"claims": [(C_NAMED, "    named = []\n")]},
    "claims: a target demand read by interval not named": {"claims": [(
        C_NAMED, "    named = [t for t in targets if t in not_evidence]\n")]},
    "claims: the words without the skill": {"claims": [(
        "             + \" or \".join(f\"{s} evidence\" for s in candidate.get(\"notEvidenceFor\") or []))\n",
        "             + \"evidence\")\n")]},
}


def copy_of(module: str, name: str, edits: list[tuple[str, str]]) -> Path:
    text = (CONTENT / f"{module}.py").read_text(encoding="utf-8").replace("\r\n", "\n")
    fixes = [(HERE[module], f"HERE = Path({str(CONTENT)!r})\n")] if module in HERE else []
    for old, new in fixes + edits:
        if text.count(old) != 1:
            raise SystemExit(f"{name} ({module}): the edit's anchor occurs {text.count(old)} times")
        text = text.replace(old, new)
    slug = "".join(ch if ch.isalnum() else "-" for ch in name)[:60]
    path = OUT_DIR / slug / f"{module}.py"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")
    return path


def load(module: str, path: Path, tag: str):
    spec = importlib.util.spec_from_file_location(f"{module}_mutant_{tag}", path)
    loaded = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = loaded  # a module's dataclasses look themselves up there
    spec.loader.exec_module(loaded)
    return loaded


def main(out_path: str) -> int:
    sys.path.insert(0, str(CONTENT))
    import claims as real_claims  # noqa: PLC0415
    import excerpts as real_excerpts  # noqa: PLC0415
    import study as real_study  # noqa: PLC0415
    import tests.test_excerpts as TE  # noqa: PLC0415
    import tests.test_study as TS  # noqa: PLC0415

    loader = unittest.defaultTestLoader
    lines = [f"python docs/prompts/runs/L120e/scripts-mutants.py {out_path}", "",
             "Copies under build/l120e/mutants/<mutant>/; the study and excerpt report classes run against each.",
             "Red = failures and errors (each failing subtest counts once).", ""]
    survived = []
    for index, (name, edits) in enumerate(MUTANTS.items()):
        tag = str(index)
        TS.S, TE.X, sys.modules["claims"] = real_study, real_excerpts, real_claims
        if "claims" in edits:
            sys.modules["claims"] = load("claims", copy_of("claims", name, edits["claims"]), tag)
        if "study" in edits:
            TS.S = load("study", copy_of("study", name, edits["study"]), tag)
        if "excerpts" in edits:
            TE.X = load("excerpts", copy_of("excerpts", name, edits["excerpts"]), tag)
        suite = unittest.TestSuite([loader.loadTestsFromTestCase(getattr(TS, c)) for c in STUDY_CLASSES]
                                   + [loader.loadTestsFromTestCase(getattr(TE, c)) for c in EXCERPT_CLASSES])
        result = unittest.TestResult()
        suite.run(result)
        bad = result.failures + result.errors
        tests = sorted({(t.test_case if hasattr(t, "test_case") else t).__class__.__name__ + "."
                        + (t.test_case if hasattr(t, "test_case") else t)._testMethodName for t, _ in bad})
        lines.append(f"## {name}: {len(bad)} red of {result.testsRun} tests run")
        lines += [f"- {t}" for t in tests]
        if bad:
            lines.append(f"- first: {bad[0][1].strip().splitlines()[-1][:300]}")
        lines.append("")
        if name != "control" and not bad:
            survived.append(name)
        if name == "control" and bad:
            survived.append("control (red: the harness is wrong)")
    sys.modules["claims"] = real_claims
    lines.append(f"survived: {survived or 'none'}")
    Path(ROOT / out_path).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 1 if survived else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
