"""
L120d's mutants (item 4): L120b's harness (`docs/prompts/runs/L120b/scripts-mutants.py`), each guard broken once in
a copy under the worktree's build/ (never the source itself), then the tests run against the copy. A mutant the
tests do not turn red is a rule nothing pins. Run from the worktree root; writes docs/prompts/runs/L120d/mutants.txt.

- TypeScript, code: the copy of `eligibilityCore.ts` (or `candidates.ts`) is written to build/l120d-mutants/ts/<name>/
  with its relative imports made absolute, and a vitest config in the gitignored app/.probe/ aliases the module to
  it; `copingQuestion.test.ts` and `eligibility.test.ts` run against it.
- TypeScript, data: a copy of `demands.json` with one change, aliased in place of the vocabulary the app imports
  (`evidence/vocabulary.ts`), the same two test files run against it.
- Python, code: the copy of `claims.py` is loaded as the `claims` module before the tests import it.
- Python, data: the same copy with its `VOCABULARY` folder pointed at build/l120d-mutants/py/<name>/vocabulary, which
  holds `skills.json` unchanged and `demands.json` with the one change.
- The Python tests: L120b's two classes of `test_taught_at.py` and the constructed classes of
  `test_untaught_options.py`, with L120d's `TestALeapInsideATaughtFixedPosition`.

L120b's `ts-extended-to-leaps` and `py-extended-to-leaps` (the predicate reading the skip's positions for the leap)
are retired: with the leap's positions equal to the skip's (item 3 (6)) they change nothing, equivalent mutants. They
are run once here to show it (0 red expected) and are not counted among the survivors.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
APP = ROOT / "app"
OUT = ROOT / "build" / "l120d-mutants"
REPORT = ROOT / "docs" / "prompts" / "runs" / "L120d" / "mutants.txt"
CORE = "app/src/curriculum/eligibilityCore.ts"
CANDIDATES = "app/src/curriculum/candidates.ts"
DEMANDS = ROOT / "content" / "curriculum" / "vocabulary" / "demands.json"
SKILLS = ROOT / "content" / "curriculum" / "vocabulary" / "skills.json"

# --- L120b's thirteen, unchanged, and the two retired ------------------------------------------

L120B_TS: dict[str, tuple[str, str, str, str]] = {
    "ts-right-hand-alone": (CORE,
        "const hands = (['R', 'L'] as const).filter((hand) => measurement.span?.[hand] !== undefined);",
        "const hands = (['R'] as const).filter((hand) => measurement.span?.[hand] !== undefined);",
        "no hand check: the right hand's range read alone, any other sounding hand ignored"),
    "ts-no-hand-equality": (CORE,
        "position.hand === hand && position.low <= low",
        "position.low <= low",
        "no hand check: a hand's range read against any hand's position"),
    "ts-left-from-1.1": (CORE,
        "learner.positionTaught?.(position.concept) === true",
        "learner.positionTaught?.(position.hand === 'L' ? 'C-position' : position.concept) === true",
        "the left position read as taught where the right one is (1.1)"),
    "ts-as-supported-state": (CORE,
        "    return state !== undefined && LADDER_STATES.indexOf(state) >= floor;\n  };\n  const taught = (demand: string): boolean => learner.taught?.(demand) === true;\n  const measurement = measurementOf(item);\n  return demandsAsked(item, measurement, vocabulary).filter(\n    (demand) => !supported(demand) && !taught(demand) && !inTaughtPosition(demand, measurement, learner, vocabulary),\n  );",
        "    return (state !== undefined && LADDER_STATES.indexOf(state) >= floor) || (skill === 'interval-reading' && learner.positionTaught?.('C-position') === true);\n  };\n  const taught = (demand: string): boolean => learner.taught?.(demand) === true;\n  const measurement = measurementOf(item);\n  return demandsAsked(item, measurement, vocabulary).filter(\n    (demand) => !supported(demand) && !taught(demand),\n  );",
        "the position implemented as a supported interval-reading state"),
    "ts-only-route": (CORE,
        "(demand) => !supported(demand) && !taught(demand) && !inTaughtPosition(demand, measurement, learner, vocabulary),",
        "(demand) => (demand === 'interval.skip' ? !inTaughtPosition(demand, measurement, learner, vocabulary) : !supported(demand) && !taught(demand)),",
        "the position a skip's only route: a taught skip outside every position refused"),
    "ts-key-rule-every-demand": (CORE,
        "demand !== KEY_SIGNATURE || (measurement.located[demand] ?? 0) > 0",
        "(measurement.located[demand] ?? 0) > 0",
        "the key signature's rule applied to every demand located nowhere"),
    "ts-unprepared-located-empty": (CANDIDATES,
        "located: Object.fromEntries(vocabulary.demands.map((demand) => [demand.id, 1]))",
        "located: {}",
        "the unknown item asked of the whole vocabulary locates nothing (the key signature drops out of unknown-forbidden)"),
}

L120B_PY: dict[str, tuple[str, str, str]] = {
    "py-right-hand-alone": (
        'hands = [hand for hand in ("R", "L") if span.get(hand)]',
        'hands = [hand for hand in ("R",) if span.get(hand)]',
        "no hand check: the right hand's range read alone"),
    "py-no-hand-equality": (
        'any(p["hand"] == hand and p["low"] <= span[hand][0]',
        'any(p["low"] <= span[hand][0]',
        "no hand check: a hand's range read against any hand's position"),
    "py-left-from-1.1": (
        'and p["concept"] in concepts_behind',
        'and ("C-position" if p["hand"] == "L" else p["concept"]) in concepts_behind',
        "the left position read as taught where the right one is (1.1)"),
    "py-as-interval-reading": (
        "and not in_taught_position(item, demands.get(demand), behind)]",
        'and not ((demands.get(demand) or {}).get("copedWithBy") == "interval-reading" and "C-position" in behind)]',
        "the position read as interval reading (every interval-reading demand coped with once C position is taught)"),
    "py-only-route": (
        "            if not any(at in taught_by for at in taught_at(demands.get(demand)))\n            and not in_taught_position(item, demands.get(demand), behind)]",
        '            if (not in_taught_position(item, demands.get(demand), behind) if demand == "interval.skip"\n                else not any(at in taught_by for at in taught_at(demands.get(demand))))]',
        "the position a skip's only route"),
    "py-key-rule-every-demand": (
        "demand != KEY_SIGNATURE or int(located.get(demand, 0)) > 0",
        "int(located.get(demand, 0)) > 0",
        "the key signature's rule applied to every demand located nowhere"),
}

RETIRED_TS: dict[str, tuple[str, str, str, str]] = {
    "ts-extended-to-leaps": (CORE,
        "const positions = vocabulary.demands.find((d) => d.id === demand)?.fixedPositions;",
        "const positions = vocabulary.demands.find((d) => d.id === (demand === 'interval.leap' ? 'interval.skip' : demand))?.fixedPositions;",
        "L120b's: the predicate reading the skip's positions for the leap"),
}

RETIRED_PY: dict[str, tuple[str, str, str]] = {
    "py-extended-to-leaps": (
        "and not in_taught_position(item, demands.get(demand), behind)]",
        'and not in_taught_position(item, demands.get("interval.skip" if demand == "interval.leap" else demand), behind)]',
        "L120b's: the predicate reading the skip's positions for the leap"),
}

# --- L120d's six replacements -------------------------------------------------------------------

L120D_TS_CODE: dict[str, tuple[str, str, str, str]] = {
    "ts-iii-leap-no-bounds": (CORE,
        "position.hand === hand && position.low <= low && high <= position.high &&",
        "position.hand === hand && (demand === 'interval.leap' || (position.low <= low && high <= position.high)) &&",
        "(iii) the bound check skipped for the leap alone"),
    "ts-iv-leap-as-supported": (CORE,
        "    return state !== undefined && LADDER_STATES.indexOf(state) >= floor;\n  };",
        "    return (state !== undefined && LADDER_STATES.indexOf(state) >= floor) || (demand === 'interval.leap' && learner.positionTaught?.('C-position') === true);\n  };",
        "(iv) the leap coped with as a supported interval-reading state once C position is taught"),
    "ts-vi-leap-left-from-1.1": (CORE,
        "learner.positionTaught?.(position.concept) === true",
        "learner.positionTaught?.(position.hand === 'L' && demand === 'interval.leap' ? 'C-position' : position.concept) === true",
        "(vi) the leap's left position read as taught from 1.1"),
}

L120D_PY_CODE: dict[str, tuple[str, str, str]] = {
    "py-iii-leap-no-bounds": (
        'p["hand"] == hand and p["low"] <= span[hand][0] and span[hand][1] <= p["high"] and',
        'p["hand"] == hand and ((demand or {}).get("id") == "interval.leap" or (p["low"] <= span[hand][0] and span[hand][1] <= p["high"])) and',
        "(iii) the bound check skipped for the leap alone"),
    "py-iv-leap-as-supported": (
        "and not in_taught_position(item, demands.get(demand), behind)]",
        'and not in_taught_position(item, demands.get(demand), behind)\n            and not (demand == "interval.leap" and "C-position" in behind)]',
        "(iv) the leap coped with once C position is taught, as a supported state would be (the build reads no evidence: (4) is the guard here)"),
    "py-vi-leap-left-from-1.1": (
        'and p["concept"] in concepts_behind',
        'and ("C-position" if p["hand"] == "L" and (demand or {}).get("id") == "interval.leap" else p["concept"]) in concepts_behind',
        "(vi) the leap's left position read as taught from 1.1"),
}


def drop_leap_positions(demands: dict) -> None:
    leap = next(d for d in demands["demands"] if d["id"] == "interval.leap")
    leap.pop("fixedPositions", None)


def widen_leap_right(demands: dict) -> None:
    leap = next(d for d in demands["demands"] if d["id"] == "interval.leap")
    for position in leap["fixedPositions"]:
        if position["hand"] == "R":
            position["high"] = 69


def leap_taught_at_1_5(demands: dict) -> None:
    leap = next(d for d in demands["demands"] if d["id"] == "interval.leap")
    leap["taughtAt"] = ["1.5"]


#: name: (the change to the vocabulary, what the guard is). Applied to the parsed file and written as JSON: the
#: readers parse it, so formatting is not read.
L120D_DATA = {
    "i-leap-positions-removed": (drop_leap_positions, "(i) the leap's fixedPositions removed"),
    "ii-leap-right-high-69": (widen_leap_right, "(ii) the leap's right-hand high bound widened to 69"),
    "v-leap-taught-at-1.5": (leap_taught_at_1_5, "(v) interval.leap's taughtAt moved to 1.5"),
}

PY_TESTS = [
    "tests.test_taught_at.TestAKeySignatureAlteringNoSoundingNoteIsNotAsked",
    "tests.test_taught_at.TestASkipInsideATaughtFixedPosition",
    "tests.test_taught_at.TestALeapInsideATaughtFixedPosition",
    "tests.test_untaught_options.OneCaseOfEachClass",
    "tests.test_untaught_options.TheSubclasses",
    "tests.test_untaught_options.TheGatesOrder",
]


def lf(path: Path) -> str:
    return path.read_bytes().decode("utf-8").replace("\r\n", "\n")


def absolute_imports(text: str, source: Path) -> str:
    def fix(match: re.Match) -> str:
        target = (source.parent / match.group(2)).resolve().as_posix()
        return f"{match.group(1)}'{target}'"
    return re.sub(r"(from )'(\.{1,2}/[^']+)'", fix, text)


def vitest(name: str, alias: str) -> tuple[int, list[str]]:
    config = APP / ".probe" / f"mutant-{name}.config.ts"
    config.write_text(
        "import { defineConfig } from 'vitest/config';\n"
        "export default defineConfig({\n"
        f"  root: '{APP.as_posix()}',\n"
        f"  resolve: {{ alias: [{alias}] }},\n"
        "  test: { include: ['tests/unit/copingQuestion.test.ts', 'tests/unit/eligibility.test.ts'], environment: 'node' },\n"
        "});\n", encoding="utf-8")
    result = subprocess.run(f'npx vitest run --config .probe/mutant-{name}.config.ts --reporter=verbose',
                            cwd=APP, capture_output=True, text=True, encoding="utf-8", errors="replace", shell=True)
    red = sorted({re.sub(r"\s+\d+ms$", "", line.strip().lstrip("×").strip())
                  for line in result.stdout.splitlines() if line.strip().startswith("×")})
    if result.returncode != 0 and not red:
        (OUT / f"{name}.log").write_text(result.stdout[-4000:] + result.stderr[-4000:], encoding="utf-8")
    return result.returncode, red


def run_ts(name: str, rel: str, old: str, new: str) -> tuple[int, list[str]]:
    source = ROOT / rel
    text = lf(source)
    assert text.count(old) == 1, f"{name}: the pattern occurs {text.count(old)} times"
    mutant_dir = OUT / "ts" / name
    mutant_dir.mkdir(parents=True, exist_ok=True)
    mutant = mutant_dir / source.name
    mutant.write_text(absolute_imports(text.replace(old, new), source), encoding="utf-8")
    return vitest(name, f"{{ find: /^\\.\\/{source.stem}$/, replacement: '{mutant.as_posix()}' }}")


def mutated_vocabulary(name: str, change) -> Path:
    folder = OUT / "data" / name
    folder.mkdir(parents=True, exist_ok=True)
    demands = json.loads(DEMANDS.read_text(encoding="utf-8"))
    change(demands)
    (folder / "demands.json").write_text(json.dumps(demands, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    shutil.copyfile(SKILLS, folder / "skills.json")
    return folder


def run_ts_data(name: str, folder: Path) -> tuple[int, list[str]]:
    return vitest(f"ts-{name}", f"{{ find: /^.*\\/vocabulary\\/demands\\.json$/, replacement: '{(folder / 'demands.json').as_posix()}' }}")


def run_py(name: str, old: str, new: str, vocabulary: Path | None = None) -> tuple[int, list[str]]:
    source = ROOT / "tools" / "content" / "claims.py"
    text = lf(source)
    assert text.count(old) == 1, f"{name}: the pattern occurs {text.count(old)} times"
    mutant_dir = OUT / "py" / name
    mutant_dir.mkdir(parents=True, exist_ok=True)
    mutant = mutant_dir / "claims.py"
    # The copy keeps the source's paths: HERE and REPO point at the tree, not at build/.
    body = text.replace(old, new).replace("HERE = Path(__file__).resolve().parent", f"HERE = Path({str(source.parent)!r})")
    if vocabulary is not None:
        anchor = 'VOCABULARY = REPO / "content" / "curriculum" / "vocabulary"'
        assert body.count(anchor) == 1, f"{name}: the vocabulary anchor"
        body = body.replace(anchor, f"VOCABULARY = Path({str(vocabulary)!r})")
    mutant.write_text(body, encoding="utf-8")
    code = (
        "import importlib.util, sys, unittest\n"
        f"sys.path.insert(0, {str(source.parent)!r})\n"
        f"spec = importlib.util.spec_from_file_location('claims', {str(mutant)!r})\n"
        "module = importlib.util.module_from_spec(spec); sys.modules['claims'] = module; spec.loader.exec_module(module)\n"
        f"suite = unittest.defaultTestLoader.loadTestsFromNames({PY_TESTS!r})\n"
        "result = unittest.TextTestRunner(stream=sys.stdout, verbosity=0).run(suite)\n"
        "for test, _ in result.failures + result.errors: print('RED', test.id())\n"
        "sys.exit(0 if result.wasSuccessful() else 1)\n"
    )
    result = subprocess.run([sys.executable, "-c", code], cwd=source.parent, capture_output=True, text=True)
    red = sorted(line[4:].split(".")[-2] + "." + line[4:].split(".")[-1] for line in result.stdout.splitlines() if line.startswith("RED "))
    return result.returncode, red


def short(test: str) -> str:
    """A vitest line's test name, without the file, the describe block and the time."""
    return re.sub(r"\s+\d+ms$", "", test.split(" > ")[-1])


def main() -> int:
    lines = ["python docs/prompts/runs/L120d/scripts-mutants.py", ""]
    survivors = 0
    total = 0
    NOOP_TS = ("const KEY_SIGNATURE = 'key.signature';", "const KEY_SIGNATURE = 'key.signature';")
    NOOP_PY = ('KEY_SIGNATURE = "key.signature"', 'KEY_SIGNATURE = "key.signature"')
    # The controls: the same harness over unmutated copies. Anything red here is the harness's, not a mutant's.
    ts_code, ts_control = run_ts("ts-control", CORE, *NOOP_TS)
    ts_dcode, ts_dcontrol = run_ts_data("control", mutated_vocabulary("control", lambda d: None))
    py_code, py_control = run_py("py-control", *NOOP_PY)
    py_dcode, py_dcontrol = run_py("py-data-control", *NOOP_PY, vocabulary=mutated_vocabulary("control", lambda d: None))
    for label, code, red in (("ts-control (unmutated copy through the same alias)", ts_code, ts_control),
                             ("ts-data-control (demands.json re-serialised unchanged, through the same alias)", ts_dcode, ts_dcontrol),
                             ("py-control (unmutated copy loaded as claims)", py_code, py_control),
                             ("py-data-control (the copy reading demands.json re-serialised unchanged)", py_dcode, py_dcontrol)):
        lines.append(f"{label}: exit {code}, {len(red)} red" + "".join(f"; {short(t)}" for t in red))
    lines.append("")

    def record(name: str, what: str, code: int, red: list[str], control: list[str], shorten) -> None:
        nonlocal survivors, total
        red = [t for t in red if t not in control]
        total += 1
        survivors += not red
        lines.append(f"{name} ({what}): exit {code}, {len(red)} red beyond the control"
                     + (" — " + "; ".join(shorten(t) for t in red) if red else " — SURVIVED"))

    lines.append("## L120d's six replacements, in each language")
    lines.append("")
    for name, (change, what) in L120D_DATA.items():
        folder = mutated_vocabulary(name, change)
        code, red = run_ts_data(name, folder)
        record(f"ts-{name}", what, code, red, ts_dcontrol, short)
        code, red = run_py(f"py-{name}", *NOOP_PY, vocabulary=folder)
        record(f"py-{name}", what, code, red, py_dcontrol, str)
    for name, (rel, old, new, what) in L120D_TS_CODE.items():
        code, red = run_ts(name, rel, old, new)
        record(name, what, code, red, ts_control, short)
    for name, (old, new, what) in L120D_PY_CODE.items():
        code, red = run_py(name, old, new)
        record(name, what, code, red, py_control, str)
    lines.append("")
    lines.append("## L120b's other thirteen, re-run unchanged")
    lines.append("")
    for name, (rel, old, new, what) in L120B_TS.items():
        code, red = run_ts(name, rel, old, new)
        record(name, what, code, red, ts_control, short)
    for name, (old, new, what) in L120B_PY.items():
        code, red = run_py(name, old, new)
        record(name, what, code, red, py_control, str)
    lines.append("")
    lines.append("## L120b's two retired as equivalent (not counted): with the leap's positions equal to the skip's they change nothing")
    lines.append("")
    for name, (rel, old, new, what) in RETIRED_TS.items():
        code, red = run_ts(name, rel, old, new)
        red = [t for t in red if t not in ts_control]
        lines.append(f"{name} ({what}): exit {code}, {len(red)} red beyond the control" + (" — " + "; ".join(short(t) for t in red) if red else " — equivalent, as expected"))
    for name, (old, new, what) in RETIRED_PY.items():
        code, red = run_py(name, old, new)
        red = [t for t in red if t not in py_control]
        lines.append(f"{name} ({what}): exit {code}, {len(red)} red beyond the control" + (" — " + "; ".join(red) if red else " — equivalent, as expected"))
    lines.append("")
    lines.append(f"{total} mutants, {survivors} survived")
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 1 if survivors else 0


if __name__ == "__main__":
    sys.exit(main())
