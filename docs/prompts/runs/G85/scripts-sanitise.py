"""The run folder made fit to keep (U74's rule, as Entry 142 kept it): machine paths replaced by
`<worktree>`, `<main checkout>`, `<temp>` and `<home>`; the three captures PowerShell wrote as UTF-16
(with a UTF-8 exit line appended) re-read and written as UTF-8. Idempotent: a second run changes nothing.

Usage (from the worktree root): python docs/prompts/runs/G85/scripts-sanitise.py
"""
import pathlib
import re

RUNS = pathlib.Path(__file__).resolve().parent
PICTURES = RUNS.parents[1] / "pictures" / "g85"
PAIRS = [
    (r"C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-af48d71ff71bb2248", "<worktree>"),
    (r"C:\Users\yalir\repos\Piano Stuff\PianoProject", "<main checkout>"),
    (r"C:\Users\yalir\AppData\Local\Temp", "<temp>"),
    (r"C:\Users\yalir", "<home>"),
]


def utf16_with_tail(raw: bytes) -> str:
    """PowerShell 5.1's `*>` wrote UTF-16; the `exit N` line after it was appended as UTF-8."""
    body = raw[2:] if raw.startswith(b"\xff\xfe") else raw
    if len(body) % 2:
        body = body[:-1]
    text = body.decode("utf-16-le", errors="replace")
    lines = text.split("\n")
    tail = lines[-1] if lines[-1].strip() else (lines[-2] if len(lines) > 1 else "")
    try:
        decoded = tail.encode("utf-16-le").decode("utf-8").strip()
    except UnicodeDecodeError:
        decoded = ""
    if decoded.startswith("exit"):
        text = text[: text.rfind(tail)] + decoded + "\n"
    return text


changed = 0
for path in sorted(list(RUNS.rglob("*")) + list(PICTURES.rglob("*.json"))):
    if not path.is_file() or path.suffix.lower() in {".png", ".py"} or path.name.startswith("scripts-"):
        continue
    raw = path.read_bytes()
    if raw.startswith(b"\xff\xfe"):
        text = utf16_with_tail(raw)
    else:
        text = raw.decode("utf-8", errors="replace")
    new = text
    for machine, token in PAIRS:
        for spelling in {machine, machine.replace("\\", "/"), machine.replace("\\", "\\\\")}:
            new = new.replace(spelling, token)
        # Paths printed lower-cased or with forward slashes after the drive.
        new = re.sub(re.escape(machine.replace("\\", "/")), token, new, flags=re.IGNORECASE)
    if new.encode("utf-8") != raw:
        path.write_text(new, encoding="utf-8", newline="")
        changed += 1
print(f"sanitised {changed} file(s)")
