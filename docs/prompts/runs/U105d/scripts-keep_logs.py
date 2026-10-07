"""U105d's log keeper, not for app/: copies the run files from build/u105d/, the probe JSONs of the
hypotheses run and of the final CSS, the two pictures and the lane's scripts to the record, replaces this
machine's paths with <worktree> or <home> in every kept text file, and prints each kept file's size (none
may pass 300 KB). Run from the worktree root."""
import pathlib
import re
import shutil

ROOT = pathlib.Path.cwd()
SRC = ROOT / "build" / "u105d"
PROBES = SRC / "probe-out"
DEST = ROOT / "docs" / "prompts" / "runs" / "U105d"
PICTURES = ROOT / "docs" / "prompts" / "pictures" / "u105d"
HOME = pathlib.Path.home()

DEST.mkdir(parents=True, exist_ok=True)
PICTURES.mkdir(parents=True, exist_ok=True)
for path in sorted(SRC.iterdir()):
    if path.is_file() and path.suffix == ".txt":
        shutil.copyfile(path, DEST / path.name)
# The H1/H2 discrimination at 740 x 342 (label `probe`, on the committed CSS with each variant injected)
# and the shipped CSS (labels `final`, `final667`).
for path in sorted(PROBES.glob("*.json")):
    if path.name.startswith(("probe-", "final-", "final667-")):
        shutil.copyfile(path, DEST / f"probe-json-{path.name}")
pictures = {
    PROBES / "probe-paused-wider-face-base-hear.png": "paused-hear-740x342-wider-face-before.png",
    PROBES / "final-paused-wider-face-base-hear.png": "paused-hear-740x342-wider-face-after.png",
}
for source, target in pictures.items():
    shutil.copyfile(source, PICTURES / target)
scripts = {
    SRC / "mutants.py": "scripts-mutants.py",
    SRC / "summarise_probe.py": "scripts-summarise_probe.py",
    SRC / "keep_logs.py": "scripts-keep_logs.py",
    SRC / "crlf_check.py": "scripts-crlf_check.py",
    ROOT / "app" / "build" / "u105d" / "playwright.u105d-5303.config.ts": "scripts-playwright.u105d-5303.config.ts",
    ROOT / "app" / "build" / "u105d" / "probe" / "probe.spec.ts": "scripts-probe.spec.ts",
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
for folder in (DEST, PICTURES):
    for path in sorted(folder.iterdir()):
        size = path.stat().st_size
        flag = "  OVER 300 KB" if size > 300_000 else ""
        print(f"{size:>8}  {folder.name}/{path.name}{flag}")
