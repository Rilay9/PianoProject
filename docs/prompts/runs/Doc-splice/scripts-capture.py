"""Runs one command and writes its capture: the first line the exact command, then its output, then `exit=<code>`.

    python docs/prompts/runs/Doc-splice/scripts/capture.py <name> [--cwd DIR] -- <command...>

writes `docs/prompts/runs/Doc-splice/<name>.txt`. The command is run without a shell, unpiped; stdout and
stderr are captured together in the order they arrive. Paths under the worktree print as `<worktree>`.
"""
from __future__ import annotations

import os
import shlex
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
RUNS = HERE.parent
ROOT = HERE.parents[4]


def main(argv: list[str]) -> int:
    name, rest = argv[0], argv[1:]
    cwd = ROOT
    if rest[:1] == ["--cwd"]:
        cwd = (ROOT / rest[1]).resolve()
        rest = rest[2:]
    if rest[:1] == ["--"]:
        rest = rest[1:]
    shown = " ".join(shlex.quote(part) for part in rest)
    where = "" if cwd == ROOT else f"(cd {cwd.relative_to(ROOT).as_posix()}) "
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    use_shell = os.name == "nt" and rest[0] in ("npx", "npm")
    proc = subprocess.run(rest, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=env, shell=use_shell)
    out = proc.stdout.decode("utf-8", errors="replace").replace("\r\n", "\n")
    out = out.replace(str(ROOT), "<worktree>").replace(ROOT.as_posix(), "<worktree>")
    text = f"$ {where}{shown}\n{out}"
    if not text.endswith("\n"):
        text += "\n"
    text += f"exit={proc.returncode}\n"
    (RUNS / f"{name}.txt").write_bytes(text.encode("utf-8"))
    print(f"{name}: exit={proc.returncode}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
