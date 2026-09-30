"""U105b's log keeper, not for app/: copies the run files from build/u105b/ and the lane's scripts
to docs/prompts/runs/U105b/, replaces this machine's paths with <worktree> or <home> in every kept
text file, and prints each kept file's size (none may pass 300 KB). Run from the worktree root."""
import pathlib
import re
import shutil

ROOT = pathlib.Path.cwd()
SRC = ROOT / "build" / "u105b"
DEST = ROOT / "docs" / "prompts" / "runs" / "U105b"
HOME = pathlib.Path.home()

DEST.mkdir(parents=True, exist_ok=True)
for path in sorted(SRC.iterdir()):
    if path.is_file() and path.suffix in {".txt", ".json"}:
        shutil.copyfile(path, DEST / path.name)
scripts = {
    SRC / "mutants.py": "scripts-mutants.py",
    SRC / "summarise_probe.py": "scripts-summarise_probe.py",
    SRC / "keep_logs.py": "scripts-keep_logs.py",
    ROOT / "app" / "build" / "u105b" / "playwright.u105b-5283.config.ts": "scripts-playwright.u105b-5283.config.ts",
    ROOT / "app" / "build" / "u105b" / "probe" / "probe.spec.ts": "scripts-probe.spec.ts",
}
for source, target in scripts.items():
    shutil.copyfile(source, DEST / target)

worktree = str(ROOT)
home = str(HOME)
forms = []
for base, token in ((worktree, "<worktree>"), (home, "<home>")):
    for form in (base, base.replace("\\", "/"), base.replace("\\", "\\\\"), "/" + base.replace("\\", "/").replace(":", "", 1)):
        forms.append((form, token))
for path in sorted(DEST.iterdir()):
    if path.suffix not in {".txt", ".json", ".py", ".ts", ".md"}:
        continue
    text = path.read_text(encoding="utf-8", errors="replace")
    before = text
    for form, token in forms:
        text = re.sub(re.escape(form), token, text, flags=re.IGNORECASE)
    if text != before:
        path.write_text(text, encoding="utf-8")
for path in sorted(DEST.iterdir()):
    size = path.stat().st_size
    flag = "  OVER 300 KB" if size > 300_000 else ""
    print(f"{size:>8}  {path.name}{flag}")
