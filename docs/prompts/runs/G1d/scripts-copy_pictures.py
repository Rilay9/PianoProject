"""
G1d: copy the pictures spec's output (the committed code's build, then this tree's) from the scratchpad
into docs/prompts/pictures/g1d/, as before-* and after-*. Usage: scripts-copy_pictures.py <before dir> <after dir>.
Run from the repository root.
"""
import shutil
import sys
from pathlib import Path

OUT = Path("docs/prompts/pictures/g1d")
OUT.mkdir(parents=True, exist_ok=True)
for prefix, root in (("before", Path(sys.argv[1])), ("after", Path(sys.argv[2]))):
    for path in sorted(root.rglob("*")):
        if path.suffix not in (".png", ".json") or path.name == ".last-run.json":
            continue
        target = OUT / f"{prefix}-{path.name}"
        shutil.copyfile(path, target)
        print(f"{path.parent.name}/{path.name} -> {target.as_posix()}")
