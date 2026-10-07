"""Replaces this machine's paths in G96a's run logs with placeholders: the worktree's root with `<worktree>`, the
main checkout's with `<checkout>`, the user's home with `<home>`, in both slash forms. Text files only;
idempotent.

Usage (from the worktree root): python docs/prompts/runs/G96a/scripts-sanitise.py
"""
import pathlib

RUNS = pathlib.Path(__file__).resolve().parent
WORKTREE = RUNS.parents[3]
CHECKOUT = WORKTREE.parents[2]
HOME = pathlib.Path.home()
pairs = []
for path, name in ((WORKTREE, "<worktree>"), (CHECKOUT, "<checkout>"), (HOME, "<home>")):
    text = str(path)
    forward = text.replace("\\", "/")
    msys = f"/{forward[0].lower()}{forward[2:]}" if forward[1:2] == ":" else forward
    for form in {text, forward, text.replace("\\", "\\\\"), msys}:
        pairs.append((form, name))
        if form[:2].upper() == "C:":
            pairs.append((form[0].lower() + form[1:], name))
changed = []
for file in sorted(RUNS.iterdir()):
    if file.suffix not in {".txt", ".json", ".md"}:
        continue
    text = file.read_text(encoding="utf-8", errors="surrogateescape")
    new = text
    for form, name in pairs:
        new = new.replace(form, name)
    if new != text:
        file.write_text(new, encoding="utf-8", errors="surrogateescape")
        changed.append(file.name)
print(f"sanitised {len(changed)} file(s): {', '.join(changed)}")
