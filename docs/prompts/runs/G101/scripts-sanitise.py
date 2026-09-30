"""The run folder made fit to keep (G85a's sanitiser, this worktree's paths): machine paths replaced by
`<worktree>`, `<main checkout>`, `<temp>` and `<home>`, in the captures and the pictures' facts. Scripts and
pictures are left as they are. Idempotent: a second run changes nothing.

Usage (from the worktree root): python docs/prompts/runs/G101/scripts-sanitise.py
"""
import pathlib
import re

RUNS = pathlib.Path(__file__).resolve().parent
PICTURES = RUNS.parents[1] / "pictures" / "g101"
PAIRS = [
    (r"C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a0523b6b95392a104", "<worktree>"),
    (r"C:\Users\yalir\repos\Piano Stuff\PianoProject", "<main checkout>"),
    (r"C:\Users\yalir\AppData\Local\Temp", "<temp>"),
    (r"C:\Users\yalir", "<home>"),
]

changed = 0
for path in sorted(list(RUNS.rglob("*")) + list(PICTURES.rglob("*.json"))):
    if not path.is_file() or path.suffix.lower() in {".png", ".py"} or path.name.startswith("scripts-"):
        continue
    raw = path.read_bytes()
    text = raw.decode("utf-8")
    new = text
    for machine, token in PAIRS:
        for spelling in (machine, machine.replace("\\", "/"), machine.replace("\\", "\\\\")):
            new = re.sub(re.escape(spelling), token, new, flags=re.IGNORECASE)
    if new != text:
        path.write_bytes(new.encode("utf-8"))
        changed += 1
        print(f"sanitised {path.relative_to(RUNS.parents[2])}")
print(f"{changed} file(s) changed")
