"""
L120b's mutants (item 5): each guard the tests pin, broken once in a copy of the source under the worktree's
build/ (never the source itself), then the tests run against the copy. A mutant the tests do not turn red is a
rule nothing pins. Run from the worktree root; writes docs/prompts/runs/L120b/mutants.txt.

- TypeScript: the copy of `eligibilityCore.ts` (or `candidates.ts`) is written to build/l120b-mutants/ts/<name>/
  with its relative imports made absolute, and a vitest config in the gitignored app/.probe/ aliases the module
  to it; `copingQuestion.test.ts` and `eligibility.test.ts` run against it.
- Python: the copy of `claims.py` is loaded as the `claims` module before the tests import it, and the two
  L120b classes of `test_taught_at.py` and the constructed classes of `test_untaught_options.py` run against it.
"""
from __future__ import annotations

import importlib.util
import io
import re
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
APP = ROOT / "app"
OUT = ROOT / "build" / "l120b-mutants"
REPORT = ROOT / "docs" / "prompts" / "runs" / "L120b" / "mutants.txt"
CORE = "app/src/curriculum/eligibilityCore.ts"
CANDIDATES = "app/src/curriculum/candidates.ts"

TS_MUTANTS: dict[str, tuple[str, str, str, str]] = {
    # name: (file, old, new, what the guard is)
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
    "ts-extended-to-leaps": (CORE,
        "const positions = vocabulary.demands.find((d) => d.id === demand)?.fixedPositions;",
        "const positions = vocabulary.demands.find((d) => d.id === (demand === 'interval.leap' ? 'interval.skip' : demand))?.fixedPositions;",
        "the predicate extended to leaps"),
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

PY_MUTANTS: dict[str, tuple[str, str, str]] = {
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
    "py-extended-to-leaps": (
        "and not in_taught_position(item, demands.get(demand), behind)]",
        'and not in_taught_position(item, demands.get("interval.skip" if demand == "interval.leap" else demand), behind)]',
        "the predicate extended to leaps"),
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

PY_TESTS = [
    "tests.test_taught_at.TestAKeySignatureAlteringNoSoundingNoteIsNotAsked",
    "tests.test_taught_at.TestASkipInsideATaughtFixedPosition",
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


def run_ts(name: str, rel: str, old: str, new: str) -> tuple[int, list[str]]:
    source = ROOT / rel
    text = lf(source)
    assert text.count(old) == 1, f"{name}: the pattern occurs {text.count(old)} times"
    mutant_dir = OUT / "ts" / name
    mutant_dir.mkdir(parents=True, exist_ok=True)
    mutant = mutant_dir / source.name
    mutant.write_text(absolute_imports(text.replace(old, new), source), encoding="utf-8")
    module = source.stem
    config = APP / ".probe" / f"mutant-{name}.config.ts"
    config.write_text(
        "import { defineConfig } from 'vitest/config';\n"
        "export default defineConfig({\n"
        f"  root: '{APP.as_posix()}',\n"
        f"  resolve: {{ alias: [{{ find: /^\\.\\/{module}$/, replacement: '{mutant.as_posix()}' }}] }},\n"
        "  test: { include: ['tests/unit/copingQuestion.test.ts', 'tests/unit/eligibility.test.ts'], environment: 'node' },\n"
        "});\n", encoding="utf-8")
    result = subprocess.run(f'npx vitest run --config .probe/mutant-{name}.config.ts --reporter=verbose',
                            cwd=APP, capture_output=True, text=True, encoding="utf-8", errors="replace", shell=True)
    red = sorted({re.sub(r"\s+\d+ms$", "", line.strip().lstrip("×").strip())
                  for line in result.stdout.splitlines() if line.strip().startswith("×")})
    return result.returncode, red


def run_py(name: str, old: str, new: str) -> tuple[int, list[str]]:
    source = ROOT / "tools" / "content" / "claims.py"
    text = lf(source)
    assert text.count(old) == 1, f"{name}: the pattern occurs {text.count(old)} times"
    mutant_dir = OUT / "py" / name
    mutant_dir.mkdir(parents=True, exist_ok=True)
    mutant = mutant_dir / "claims.py"
    # The copy keeps the source's paths: HERE and REPO point at the tree, not at build/.
    body = text.replace(old, new).replace("HERE = Path(__file__).resolve().parent",
                                          f"HERE = Path({str(source.parent)!r})")
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
    red = sorted(line[4:].split(".")[-1] for line in result.stdout.splitlines() if line.startswith("RED "))
    return result.returncode, red


def short(test: str) -> str:
    """A vitest line's test name, without the file, the describe block and the time."""
    return re.sub(r"\s+\d+ms$", "", test.split(" > ")[-1])


def main() -> int:
    lines = ["python docs/prompts/runs/L120b/scripts-mutants.py", ""]
    survivors = 0
    # The controls: the same harness over unmutated copies. Anything red here is the harness's, not a mutant's.
    ts_code, ts_control = run_ts("ts-control", CORE, "const KEY_SIGNATURE = 'key.signature';", "const KEY_SIGNATURE = 'key.signature';")
    py_code, py_control = run_py("py-control", 'KEY_SIGNATURE = "key.signature"', 'KEY_SIGNATURE = "key.signature"')
    lines.append(f"ts-control (unmutated copy through the same alias): exit {ts_code}, {len(ts_control)} red" + "".join(f"; {short(t)}" for t in ts_control))
    lines.append(f"py-control (unmutated copy loaded as claims): exit {py_code}, {len(py_control)} red" + "".join(f"; {t}" for t in py_control))
    lines.append("")
    for name, (rel, old, new, what) in TS_MUTANTS.items():
        code, red = run_ts(name, rel, old, new)
        red = [t for t in red if t not in ts_control]
        survivors += not red
        lines.append(f"{name} ({what}): exit {code}, {len(red)} red beyond the control" + (" — " + "; ".join(short(t) for t in red) if red else " — SURVIVED"))
    for name, (old, new, what) in PY_MUTANTS.items():
        code, red = run_py(name, old, new)
        red = [t for t in red if t not in py_control]
        survivors += not red
        lines.append(f"{name} ({what}): exit {code}, {len(red)} red beyond the control" + (" — " + "; ".join(red) if red else " — SURVIVED"))
    lines.append("")
    lines.append(f"{len(TS_MUTANTS) + len(PY_MUTANTS)} mutants, {survivors} survived")
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 1 if survivors else 0


if __name__ == "__main__":
    sys.exit(main())
