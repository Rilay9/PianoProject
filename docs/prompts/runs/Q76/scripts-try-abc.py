"""Exploration: one ABC through convert.py (no cache) into a scratch .mxl; its dynamics and ties as written; then the measurement script on it."""
import subprocess
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parents[4] / "tools" / "content"))
import convert  # noqa: E402
from music21 import converter, dynamics  # noqa: E402

src, dest = Path(sys.argv[1]), Path(sys.argv[2])
result = convert.convert_file(src, dest)
print("converted", result.measures, "bars", result.note_events, "note events", result.staves, "staves; warnings", result.warnings)
score = converter.parse(str(dest))
print("dynamics", [d.value for d in score.recurse().getElementsByClass(dynamics.Dynamic)])
print("tie starts", sum(1 for n in score.recurse().notes if n.tie is not None and n.tie.type == "start"))
subprocess.run([sys.executable, str(HERE.parent / "scripts-measure-files.py"), str(dest)])
subprocess.run([sys.executable, str(HERE.parent / "scripts-dump-ties.py"), str(dest), "32"])
