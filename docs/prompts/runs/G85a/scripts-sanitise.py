"""The run folder made fit to keep (G85's sanitiser, this worktree's paths): machine paths replaced by
`<worktree>`, `<main checkout>`, `<temp>` and `<home>`, in the captures and the pictures' facts. Scripts and
pictures are left as they are. Idempotent: a second run changes nothing.

Usage (from the worktree root): python docs/prompts/runs/G85a/scripts-sanitise.py
"""
import pathlib
import re

RUNS = pathlib.Path(__file__).resolve().parent
PICTURES = RUNS.parents[1] / "pictures" / "g85a"
PAIRS = [
    (r"C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a006ea5e3b88fa4ac", "<worktree>"),
    (r"C:\Users\yalir\repos\Piano Stuff\PianoProject", "<main checkout>"),
    (r"C:\Users\yalir\AppData\Local\Temp", "<temp>"),
    (r"C:\Users\yalir", "<home>"),
]

changed = 0
for path in sorted(list(RUNS.rglob("*")) + list(PICTURES.rglob("*.json"))):
    if not path.is_file() or path.suffix.lower() in {".png", ".py"} or path.name.startswith("scripts-"):
        continue
    raw = path.read_bytes()
    text = raw.decode("utf-8", errors="replace")
    new = text
    for machine, token in PAIRS:
        for spelling in {machine, machine.replace("\\", "/"), machine.replace("\\", "\\\\")}:
            new = new.replace(spelling, token)
        new = re.sub(re.escape(machine.replace("\\", "/")), token, new, flags=re.IGNORECASE)
        new = re.sub(re.escape(machine), token, new, flags=re.IGNORECASE)
    if new.encode("utf-8") != raw:
        path.write_text(new, encoding="utf-8", newline="")
        changed += 1
print(f"sanitised {changed} file(s)")
