"""Exploration: python-ly's writer on a .ly with one literal text substitution applied, then the voice-duration report."""
import subprocess
import sys
from pathlib import Path

src, old, new, out = Path(sys.argv[1]), sys.argv[2], sys.argv[3], Path(sys.argv[4])
text = src.read_text(encoding="utf-8")
count = text.count(old)
out.write_text(text.replace(old, new), encoding="utf-8")
print(f"replaced {count} occurrence(s)")
here = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(here / "scripts-voice-durations.py"), str(out), sys.argv[5] if len(sys.argv) > 5 else "12"])
