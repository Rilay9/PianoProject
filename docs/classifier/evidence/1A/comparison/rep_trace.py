"""Diagnosis aid: the bar path the unroller (validation/r_repeat.py unroll) follows, as runs of printed bar numbers.
The unroller's source is executed with ONE substitution ("played += 1" also appends the bar index to a list); nothing else changes.
Usage: rep_trace.py ID [cp]"""
import sys, types
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from rcommon import *
walk, common, rr = load_validators()
src = (VAL1A / "r_repeat.py").read_text(encoding="utf-8")
assert src.count("        played += 1\n") == 1
src = src.replace("        played += 1\n", "        played += 1; _PATH.append(i)\n")
mod = types.ModuleType("r_repeat_traced")
mod.__dict__["_PATH"] = []
exec(compile(src, "r_repeat_traced", "exec"), mod.__dict__)


def runs(path):
    out = []
    for b in path:
        if out and out[-1][1] == b - 1:
            out[-1][1] = b
        else:
            out.append([b, b])
    return " ".join(f"{a+1}-{b+1}" if a != b else f"{a+1}" for a, b in out)


if __name__ == "__main__":
    i = sys.argv[1]
    mod._PATH.clear()
    r = mod.unroll(walk.cache(i), coda_pair=len(sys.argv) > 2)
    print(i, "played", r["played"])
    print(runs(mod._PATH))
