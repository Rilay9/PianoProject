"""Run one of the chunk-1 validators' scripts UNCHANGED, against the worktree's copy of the catalogue.

Usage: python run_unchanged.py <1A|1C> <script.py> [args...]
The validator's own folder is put on sys.path behind a shim folder that holds the only edited files
(1A: shim1a/walk.py; 1C: shim1c/common.py); the shim edits are limited to where the catalogue,
the scores and the cache live (lines marked SHIM)."""
import runpy, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
area, script, args = sys.argv[1], sys.argv[2], sys.argv[3:]
vdir = (HERE / ("../../1A/validation" if area == "1A" else "../../1C/validation")).resolve()
shim = HERE / ("shim1a" if area == "1A" else "shim1c")
sys.path[:0] = [str(shim), str(vdir)]
# a validator script may put its own folder first on sys.path before `from common import ...` (rawbar.py, tup.py, cue.py, cadenza.py do):
# load the shim's common (and walk) now so that `import common` finds the module already in sys.modules.
import common  # noqa: E402  (the shim's)
if area == "1A":
    import walk  # noqa: E402,F401
sys.argv = [script] + args
runpy.run_path(str(vdir / script), run_name="__main__")
