"""
G1e: copy the pictures spec's output (build/g1e-pictures-before, build/g1e-pictures-after: the committed
code's build and this tree's) to docs/prompts/pictures/g1e/ with before-/after- prefixes. Run from the
worktree root.
"""
import shutil
from pathlib import Path

DEST = Path("docs/prompts/pictures/g1e")
DEST.mkdir(parents=True, exist_ok=True)
for label in ("before", "after"):
    for path in sorted(Path(f"build/g1e-pictures-{label}").rglob("*")):
        if path.suffix not in (".png", ".json") or path.name.startswith("."):
            continue
        name = f"{label}-{path.name}"
        shutil.copyfile(path, DEST / name)
        print(f"copied {name}")
print("exit=0")
