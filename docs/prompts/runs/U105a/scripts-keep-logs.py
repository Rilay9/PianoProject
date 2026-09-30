"""U105a's log keeper, not for app/: summarises the whole unit run, copies the run files to
docs/prompts/runs/U105a/, and replaces this machine's paths with <worktree> or <home> in every kept
text file. Run from the worktree root."""
import pathlib
import re
import shutil

ROOT = pathlib.Path.cwd()
SRC = ROOT / "build" / "u105a"
DEST = ROOT / "docs" / "prompts" / "runs" / "U105a"
HOME = pathlib.Path.home()

full = SRC / "unit-all-full.txt"
if full.exists():
    lines = full.read_text(encoding="utf-8", errors="replace").splitlines()
    kept = ["# npx vitest run (the whole unit suite): its summary kept; the full log (about 900 KB) deleted"]
    for line in lines:
        if line.startswith(" FAIL ") or re.match(r"^(AssertionError|Error): ", line):
            text = line[:400]
            if not kept or kept[-1] != text:
                kept.append(text)
    kept += [line for line in lines if re.match(r"^\s*(Test Files|Tests |Start at|Duration)", line) or line.startswith("exit ")]
    (SRC / "unit-all-summary.txt").write_text("\n".join(kept) + "\n", encoding="utf-8")
    full.unlink()

DEST.mkdir(parents=True, exist_ok=True)
copies = {
    "scripts-mutants.py": "scripts-mutants.py",
    "scripts-keep-logs.py": "scripts-keep-logs.py",
    "scripts-lf-claims.py": "scripts-lf-claims.py",
}
for path in sorted(SRC.iterdir()):
    if path.suffix in {".txt", ".json"}:
        copies[path.name] = path.name
extra = {
    ROOT / "app" / "build" / "u105a" / "playwright.u105a-4793.config.ts": "scripts-playwright.u105a-4793.config.ts",
    ROOT / "app" / "build" / "u105a" / "probe" / "pictures.spec.ts": "scripts-pictures.spec.ts",
}
for name, target in copies.items():
    shutil.copyfile(SRC / name, DEST / target)
for source, target in extra.items():
    shutil.copyfile(source, DEST / target)

worktree = str(ROOT)
patterns = [
    worktree,
    worktree.replace("\\", "/"),
    worktree.replace("\\", "\\\\"),
    str(HOME),
    str(HOME).replace("\\", "/"),
    str(HOME).replace("\\", "\\\\"),
]
for path in DEST.iterdir():
    if path.suffix not in {".txt", ".json", ".py", ".ts", ".md"}:
        continue
    text = path.read_text(encoding="utf-8", errors="replace")
    before = text
    for index, pattern in enumerate(patterns):
        text = text.replace(pattern, "<worktree>" if index < 3 else "<home>")
    # Case-insensitive drive letters, as some tools print them.
    text = re.sub(re.escape(worktree), "<worktree>", text, flags=re.IGNORECASE)
    text = re.sub(re.escape(str(HOME)), "<home>", text, flags=re.IGNORECASE)
    if text != before:
        path.write_text(text, encoding="utf-8")
    size = path.stat().st_size
    assert size <= 300_000, f"{path.name} is {size} bytes"
    print(f"{size:>8}  {path.name}")
