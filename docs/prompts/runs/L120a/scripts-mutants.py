"""
L120a's mutants: each rule the tests written after the tool pin, broken once in a copy of the tool under the
worktree's build/ (never the tool itself), then the test file run against the copy. A mutant the tests do not
turn red is a rule nothing pins. Run from the worktree root; writes docs/prompts/runs/L120a/mutants.txt.
"""
from __future__ import annotations

import importlib.util
import io
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
TOOL = ROOT / "tools" / "content" / "untaught_options.py"
TESTS = ROOT / "tools" / "content" / "tests"
OUT = ROOT / "build" / "l120a-mutants"

MUTANTS = {
    # The reviewer's first answer: an incidental demand is asked. The mutant asks established demands only.
    "incidental-exempt": (
        "untaught = claims.untaught_on(item, rung, ancestry, demands) if status == \"measured\" else []",
        "untaught = [d for d in (claims.untaught_on(item, rung, ancestry, demands) if status == \"measured\" else []) "
        "if d in ((item.get('measurement') or {}).get('established') or [])]",
    ),
    # E22's blind-spot notes are cautions, not doubts about presence. The mutant makes every note a doubt.
    "caution-is-doubt": (
        "doubt = sorted(note for note in notes if note in PRESENCE_DOUBTS or note in claims.E22_FAMILY.values())",
        "doubt = sorted(notes)",
    ),
    # A demand taught off this path is C-elsewhere, not C-nowhere. The mutant drops the distinction.
    "no-elsewhere": (
        "elif taught_at(demands.get(demand_id)):\n                    kind = \"C-elsewhere\"",
        "elif False:\n                    kind = \"C-elsewhere\"",
    ),
    # A mention read as not teaching does not count. The mutant counts every mention.
    "readings-ignored": (
        "counted = [m for m in said if \"read\" not in m]",
        "counted = list(said)",
    ),
    # A demand located nowhere is the reading's question. The mutant drops that doubt.
    "nowhere-not-doubted": (
        "    if located == 0:\n        out.append(NOWHERE)\n",
        "",
    ),
    # A written sixteenth in 3/8 is half an eighth-note beat: the reading's question. The mutant drops it.
    "three-eight-sixteenths-not-doubted": (
        "    if item.get(\"timeSig\") == \"3/8\" and demand_id == \"rhythm.sixteenths\":\n        out.append(SIXTEENTHS_IN_THREE_EIGHT)\n",
        "",
    ),
    # The gate's order: the teaching-use admission refuses first. The mutant asks the coping question first.
    "teaching-use-after-coping": (
        "            if before is not None:\n                shadowed.append(",
        "            if before is not None and False:\n                shadowed.append(",
    ),
    # Front matter is metadata, not the lesson's words. The mutant reads it.
    "front-matter-read": (
        "text = FRONT_MATTER.sub(\"\", text_of(lesson) or \"\", count=1)",
        "text = text_of(lesson) or \"\"",
    ),
    # Ancestry, not the file: the mutant reads a demand as taught wherever any rung teaches it.
    "taught-anywhere": (
        "untaught = claims.untaught_on(item, rung, ancestry, demands) if status == \"measured\" else []",
        "untaught = [d for d in (item.get('demands') if status == \"measured\" and isinstance(item.get('demands'), list) else []) "
        "if not taught_at(demands.get(d))]",
    ),
}


def run(name: str, old: str, new: str) -> tuple[int, int, str]:
    source = TOOL.read_text(encoding="utf-8")
    assert source.count(old) == 1, f"{name}: the text to mutate is not in the tool exactly once"
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.py"
    path.write_text(source.replace(old, new), encoding="utf-8")
    sys.path.insert(0, str(TOOL.parent))
    spec = importlib.util.spec_from_file_location("untaught_options", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules["untaught_options"] = module
    spec.loader.exec_module(module)
    sys.modules.pop("test_untaught_options", None)
    sys.path.insert(0, str(TESTS))
    suite = unittest.defaultTestLoader.loadTestsFromName("test_untaught_options")
    stream = io.StringIO()
    result = unittest.TextTestRunner(stream=stream, verbosity=0).run(suite)
    failed = [str(t[0]).split(" ")[0] for t in result.failures + result.errors]
    return result.testsRun, len(failed), ", ".join(failed)


lines = []
for name, (old, new) in MUTANTS.items():
    ran, failed, which = run(name, old, new)
    lines.append(f"{name}: {failed} of {ran} red{' — ' + which if which else ' — SURVIVED'}")
sys.modules.pop("untaught_options", None)
text = "\n".join(lines) + "\n"
(ROOT / "docs" / "prompts" / "runs" / "L120a" / "mutants.txt").write_text(
    "python docs/prompts/runs/L120a/scripts-mutants.py\n" + text, encoding="utf-8")
print(text)
