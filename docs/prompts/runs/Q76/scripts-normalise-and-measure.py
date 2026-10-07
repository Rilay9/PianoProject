"""Exploration: given MusicXML files, convert.py's normalisation (no cache) to .mxl beside each, then the measurement script."""
import subprocess
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")
HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parents[4] / "tools" / "content"))
import convert  # noqa: E402

outs = []
for src in map(Path, sys.argv[1:]):
    dest = src.with_suffix(".mxl")
    r = convert.convert_file(src, dest)
    print(f"{src.name}: {r.measures} bars, {r.note_events} note events, {r.staves} staves, tempo {r.tempo_bpm} (added {r.added_tempo}); warnings {r.warnings[:4]}")
    outs.append(str(dest))
subprocess.run([sys.executable, str(HERE.parent / "scripts-measure-files.py"), *outs])
