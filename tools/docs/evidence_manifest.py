"""The evidence manifest: a seam's captures and git state, written as data by one script (Q64).

Every landing used to rewrite the same evidence by hand (paths, commits, commands, exit codes,
captures, CI) in the entry, the note and the handoff. This script reads a seam's capture folder,
`docs/prompts/runs/<seam>/`, and the repository's git state, and writes `MANIFEST.md` beside the
captures. The manifest is data: no judgement and no summary. An entry states its judgements and
exceptions and points here for the evidence. The builder runs it last on the worktree; the
orchestrator's record step runs it again on the merged tree with `--commit` and commits it.

What it reads from each file in the folder (recursively; `MANIFEST.md` itself is left out):

* a **capture** (`.txt`, `.log`): its command, the first non-blank line when it begins `$ `
  (D4's convention, the one to follow); its exit code, from the last non-blank line when that is
  `exit N` or `<label> exit N` (every builder's), else from a `<stem>.done` file beside it (D4),
  else from the first non-blank line when that is `<label> exit N` (F2); how many lines of it
  are exit lines (more than one means several runs in one file); its size and sha256;
* a **sidecar** (`.done`): the exit code it holds;
* the **chain** (`orchestrator-exit.txt`): each `<step> exit=N` line, each `== <step>` header
  with no exit line after it, and whether `CHAIN DONE` was reached;
* anything else, or a text file with neither a command line nor an exit line, is an
  **artefact**: size and sha256 only.

Sizes and hashes are of the file as git stores it: this repository commits with
`core.autocrlf=true`, so a capture PowerShell wrote with CRLF is hashed with LF, and a checkout
on any platform reproduces the figure. A file holding a NUL byte is hashed as it is.

Refusals. A capture that names a command and records no exit is refused, and so is a folder with
no captures: the manifest is not written and the script exits 2 naming the files, because a run
whose result is missing is the one thing an entry must never report as done. A capture with an
exit and no command line is written, and named in its own list.

The seam's changed files: without `--commit`, the working tree against HEAD (tracked changes and
untracked files that are not ignored), each with the blob id git would give it; with
`--commit REV`, that commit against its first parent, with the commit's blob ids. The seam's own
capture folder is left out of that list (its files are in the captures table).

CI: with `--commit`, the first CI run whose head carries the commit and finished other than
cancelled, read with `gh run list`; a run still going is said so; no carrying run is "not yet
run"; `gh` not answering is "not read" with the reason, never "not yet run". Without `--commit`
the changes are uncommitted, so no run can carry them.

Run from the repository root:

    python tools/docs/evidence_manifest.py F2 --commit b41e19e
    python tools/docs/evidence_manifest.py Q-tooling          # a builder, on its worktree
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable

ROOT = Path(__file__).resolve().parents[2]
RUNS = Path("docs") / "prompts" / "runs"
MANIFEST = "MANIFEST.md"
CHAIN = "orchestrator-exit.txt"
CAPTURE_SUFFIXES = {".txt", ".log"}
SIDECAR_SUFFIX = ".done"
WORKFLOW = "ci.yml"

EXIT_ALONE = re.compile(r"^exit[ =:]\s*(-?\d+)\s*$")
EXIT_LABELLED = re.compile(r"^(?P<label>.*\S)\s+exit[ =:]\s*(?P<code>-?\d+)\s*$")
CHAIN_HEAD = re.compile(r"^== (?P<step>\S+)")
CHAIN_EXIT = re.compile(r"^(?P<step>\S+) exit=(?P<code>-?\d+)\s*$")
RED = re.compile(r"^red-(?!mutant)")
MUTANT = re.compile(r"^(red-)?mutants?[-_.]")


@dataclass(frozen=True)
class Capture:
    name: str  # the path inside the folder, with forward slashes
    kind: str  # capture, sidecar, chain or artefact
    size: int
    sha256: str
    command: str | None = None
    label: str | None = None
    exit: int | None = None
    exit_from: str | None = None
    exit_lines: int = 0


@dataclass(frozen=True)
class Changed:
    path: str
    status: str
    blob: str


@dataclass(frozen=True)
class Chain:
    exits: tuple[tuple[str, int], ...]
    no_exit: tuple[str, ...]
    done: bool


def git_calls_binary(raw: bytes) -> bool:
    """Git's own rule for skipping the line-ending conversion (convert.c, `convert_is_binary`).

    A NUL, a lone CR (a CR not followed by LF: D4's `build-baseline.txt` holds CR CR LF), or more
    than one unprintable byte per 128 printable ones. BS, HT, ESC and FF count as printable, so
    the colour codes in a Vite log do not make it binary; a final ^Z is not counted.
    """
    if b"\x00" in raw or re.search(rb"\r(?!\n)", raw):
        return True
    unprintable = sum(1 for byte in raw if byte == 127 or (byte < 32 and byte not in b"\b\t\x1b\x0c\r\n"))
    printable = len(raw) - unprintable - raw.count(b"\r") - raw.count(b"\n")
    if raw.endswith(b"\x1a"):
        unprintable -= 1
    return (printable >> 7) < unprintable


def committed_bytes(raw: bytes) -> bytes:
    """The bytes git stores for a file under core.autocrlf=true: CRLF read as LF unless binary."""
    if git_calls_binary(raw):
        return raw
    return raw.replace(b"\r\n", b"\n")


def decode(raw: bytes) -> str:
    if raw.startswith((b"\xff\xfe", b"\xfe\xff")):
        return raw.decode("utf-16", errors="replace")
    return raw.decode("utf-8-sig", errors="replace")


def lines_of(raw: bytes) -> list[str]:
    return [line.strip("\ufeff \t") for line in decode(raw).splitlines()]


def exit_of(line: str) -> tuple[int, str | None] | None:
    """The exit code a line records and its label, or None when it is not an exit line."""
    alone = EXIT_ALONE.match(line)
    if alone:
        return int(alone.group(1)), None
    labelled = EXIT_LABELLED.match(line)
    if labelled:
        return int(labelled.group("code")), labelled.group("label")
    return None


def read_sidecar(path: Path) -> int | None:
    text = decode(path.read_bytes()).strip()
    return int(text) if re.fullmatch(r"-?\d+", text) else None


def read_capture(path: Path, folder: Path) -> Capture:
    raw = path.read_bytes()
    stored = committed_bytes(raw)
    name = path.relative_to(folder).as_posix()
    base = dict(name=name, size=len(stored), sha256=hashlib.sha256(stored).hexdigest())
    if path.name == CHAIN:
        return Capture(kind="chain", **base)
    if path.suffix == SIDECAR_SUFFIX:
        return Capture(kind="sidecar", exit=read_sidecar(path), exit_from="the file", **base)
    if path.suffix not in CAPTURE_SUFFIXES:
        return Capture(kind="artefact", **base)
    lines = [line for line in lines_of(raw) if line]
    command = lines[0][2:].strip() if lines and lines[0].startswith("$ ") else None
    exit_lines = sum(1 for line in lines if exit_of(line) is not None)
    code: int | None = None
    source: str | None = None
    label: str | None = None
    last = exit_of(lines[-1]) if lines else None
    sidecar = path.with_suffix(SIDECAR_SUFFIX)
    if last is not None:
        code, source, label = last[0], "last line", last[1]
    elif sidecar.exists() and read_sidecar(sidecar) is not None:
        code, source = read_sidecar(sidecar), sidecar.name
    elif lines and command is None and EXIT_LABELLED.match(lines[0]):
        first = exit_of(lines[0])
        assert first is not None
        code, source, label = first[0], "first line", first[1]
    if command is None and code is None:
        return Capture(kind="artefact", **base)
    return Capture(kind="capture", command=command, label=label, exit=code, exit_from=source,
                   exit_lines=exit_lines, **base)


def read_folder(folder: Path) -> list[Capture]:
    files = sorted(
        (p for p in folder.rglob("*") if p.is_file() and p.relative_to(folder).as_posix() != MANIFEST),
        key=lambda p: p.relative_to(folder).as_posix(),
    )
    return [read_capture(p, folder) for p in files]


def parse_chain(text: str) -> Chain:
    exits: list[tuple[str, int]] = []
    heads: list[str] = []
    done = False
    for line in text.splitlines():
        line = line.strip("\ufeff \t")
        head = CHAIN_HEAD.match(line)
        if head:
            heads.append(head.group("step"))
            continue
        step = CHAIN_EXIT.match(line)
        if step:
            exits.append((step.group("step"), int(step.group("code"))))
        elif line.startswith("CHAIN DONE"):
            done = True
    named = {step for step, _ in exits}
    return Chain(tuple(exits), tuple(h for h in heads if h not in named), done)


def run_git(root: Path, *args: str) -> str:
    return subprocess.run(["git", *args], cwd=root, check=True, capture_output=True, text=True,
                          encoding="utf-8").stdout


def changed_files(root: Path, commit: str | None, exclude: str) -> list[Changed]:
    """The seam's changed paths, statuses and blob ids, the capture folder left out."""
    out: list[Changed] = []
    if commit:
        raw = run_git(root, "diff", "--raw", "--no-abbrev", "--no-renames", "-z", f"{commit}^1", commit)
        fields = raw.split("\0")
        i = 0
        while i + 1 < len(fields) and fields[i].startswith(":"):
            meta, path = fields[i].split(), fields[i + 1]
            status, new_blob = meta[4], meta[3]
            out.append(Changed(path, status, "(deleted)" if status == "D" else new_blob))
            i += 2
    else:
        raw = run_git(root, "status", "--porcelain=v1", "-z", "--untracked-files=all", "--no-renames")
        for entry in raw.split("\0"):
            if not entry:
                continue
            code, path = entry[:2], entry[3:]
            status = "A" if code == "??" or "A" in code else "D" if "D" in code else "M"
            blob = "(deleted)" if status == "D" else run_git(root, "hash-object", "--", path).strip()
            out.append(Changed(path, status, blob))
    return sorted((c for c in out if not c.path.startswith(exclude)), key=lambda c: c.path)


def ci_line(runs: Iterable[dict], carries: Callable[[str], bool]) -> str:
    """The first run carrying the commit that finished other than cancelled, or the one going."""
    carrying = [r for r in sorted(runs, key=lambda r: r.get("createdAt", "")) if carries(r["headSha"])]
    if not carrying:
        return "not yet run: no CI run's head carries the commit"
    cancelled = 0
    for run in carrying:
        tail = f" ({cancelled} earlier carrying run(s) cancelled)" if cancelled else ""
        if run.get("status") != "completed":
            return f"run {run['databaseId']}: {run.get('status')} on `{run['headSha'][:7]}`{tail}"
        if run.get("conclusion") == "cancelled":
            cancelled += 1
            continue
        return f"run {run['databaseId']}: {run.get('conclusion')} on `{run['headSha'][:7]}`{tail}"
    return f"cancelled: {cancelled} carrying run(s), none finished"


def ci_from_gh(root: Path, commit: str) -> str:
    try:
        listed = subprocess.run(
            ["gh", "run", "list", "--workflow", WORKFLOW, "--limit", "200",
             "--json", "databaseId,headSha,status,conclusion,createdAt"],
            cwd=root, capture_output=True, text=True, encoding="utf-8", timeout=60,
        )
    except (OSError, subprocess.TimeoutExpired) as error:
        return f"not read: gh: {error}"
    if listed.returncode != 0:
        return f"not read: gh: {(listed.stderr or listed.stdout).strip().splitlines()[-1:] or ['no output']}"
    runs = json.loads(listed.stdout or "[]")

    def carries(head: str) -> bool:
        probe = subprocess.run(["git", "merge-base", "--is-ancestor", commit, head], cwd=root,
                               capture_output=True, text=True)
        return probe.returncode == 0

    return ci_line(runs, carries)


def cell(value: object) -> str:
    return str(value).replace("|", "\\|").replace("\n", " ")


def code(value: object) -> str:
    return f"`{cell(value)}`"


def render(seam: str, root: Path, folder: Path, captures: list[Capture], changed: list[Changed],
           head: str, commit: str | None, merged_in: str | None, ci: str) -> str:
    chain_file = folder / CHAIN
    if chain_file.exists():
        chain = parse_chain(decode(chain_file.read_bytes()))
        nonzero = [f"{step}={c}" for step, c in chain.exits if c != 0]
        chain_cell = (f"{code(CHAIN)}: {len(chain.exits)} exit line(s), "
                      f"non-zero: {', '.join(nonzero) if nonzero else 'none'}; "
                      f"{len(chain.no_exit)} step(s) with no exit line; "
                      f"{'CHAIN DONE' if chain.done else 'no CHAIN DONE line'}")
    else:
        chain = None
        chain_cell = f"not yet run: no {code(CHAIN)}"
    runs = [c for c in captures if c.kind == "capture"]
    lines = [
        f"# Evidence manifest: {seam}",
        "",
        "Written by `tools/docs/evidence_manifest.py`; data only, regenerated, never edited.",
        "",
        "| field | value |",
        "| --- | --- |",
        f"| folder | {code(folder.relative_to(root).as_posix())} |",
        f"| HEAD | {code(head)} |",
        f"| commit | {code(commit) if commit else 'none: the working tree against HEAD'} |",
    ]
    if commit:
        lines.append(f"| merged into HEAD's line at | {code(merged_in) if merged_in else 'HEAD does not carry it'} |")
    lines += [
        f"| chain | {chain_cell} |",
        f"| CI | {cell(ci)} |",
        f"| captures | {len(runs)} run capture(s), "
        f"{sum(1 for c in runs if c.exit not in (None, 0))} with a non-zero exit; "
        f"{sum(1 for c in captures if c.kind == 'sidecar')} sidecar(s); "
        f"{sum(1 for c in captures if c.kind == 'artefact')} artefact(s) |",
        f"| changed files | {len(changed)} (the capture folder left out) |",
        "",
        "## Changed files",
        "",
        "| path | status | blob |",
        "| --- | --- | --- |",
    ]
    lines += [f"| {code(c.path)} | {c.status} | {code(c.blob)} |" for c in changed] or ["| none | | |"]
    lines += [
        "",
        "## Captures",
        "",
        "Sizes and sha256 of the file as git stores it (CRLF read as LF for text).",
        "",
        "| file | kind | command | exit | exit read from | exit lines | bytes | sha256 |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    for c in captures:
        if c.command is not None:
            command = code(c.command)
        elif c.label is not None:
            command = f"none (label: {code(c.label)})"
        else:
            command = "none" if c.kind == "capture" else ""
        exit_cell = "" if c.kind in ("artefact", "chain") else ("none" if c.exit is None else str(c.exit))
        lines.append(
            f"| {code(c.name)} | {c.kind} | {command} | {exit_cell} | {c.exit_from or ''} | "
            f"{c.exit_lines if c.kind == 'capture' else ''} | {c.size} | {code(c.sha256)} |"
        )
    reds = [c for c in captures if RED.match(Path(c.name).name) and not MUTANT.match(Path(c.name).name)]
    mutants = [c for c in captures if MUTANT.match(Path(c.name).name)]
    for title, rows in (("Red lines", reds), ("Mutants", mutants)):
        lines += ["", f"## {title}", "", "| file | exit |", "| --- | --- |"]
        lines += [f"| {code(c.name)} | {'none' if c.exit is None else c.exit} |" for c in rows] or ["| none | |"]
    lines += ["", "## Chain", "", "| step | exit |", "| --- | --- |"]
    if chain is None:
        lines.append("| not yet run | |")
    else:
        lines += [f"| {cell(step)} | {c} |" for step, c in chain.exits]
        lines += [f"| {cell(step)} | no exit line |" for step in chain.no_exit]
    lines += ["", "## Captures without a command line", ""]
    unnamed = [c for c in runs if c.command is None]
    lines += [f"- {code(c.name)}" for c in unnamed] or ["- none"]
    return "\n".join(lines) + "\n"


def refusals(captures: list[Capture]) -> list[str]:
    problems = [f"{c.name}: names a command and records no exit line" for c in captures
                if c.kind == "capture" and c.command is not None and c.exit is None]
    if not any(c.kind == "capture" for c in captures):
        problems.append("no captures: no file in the folder records a command or an exit")
    return problems


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("seam", help="the capture folder's name under docs/prompts/runs/")
    parser.add_argument("--commit", help="the seam's commit: its diff against its first parent, and CI")
    parser.add_argument("--root", type=Path, default=ROOT, help=argparse.SUPPRESS)
    parser.add_argument("--no-ci", action="store_true", help="do not ask gh (tests; offline)")
    args = parser.parse_args(argv)
    root = args.root.resolve()
    folder = root / RUNS / args.seam
    if not folder.is_dir():
        print(f"refused: {folder} is not a folder", file=sys.stderr)
        return 2
    captures = read_folder(folder)
    problems = refusals(captures)
    if problems:
        print(f"refused: {MANIFEST} not written for {args.seam}:", file=sys.stderr)
        for problem in problems:
            print(f"  - {problem}", file=sys.stderr)
        return 2
    head = run_git(root, "rev-parse", "HEAD").strip()
    commit = run_git(root, "rev-parse", "--verify", f"{args.commit}^{{commit}}").strip() if args.commit else None
    merged_in = None
    if commit and subprocess.run(["git", "merge-base", "--is-ancestor", commit, "HEAD"], cwd=root,
                                 capture_output=True).returncode == 0:
        # The commit itself when it is on HEAD's first-parent line; else the oldest commit of that
        # line that descends from it, which is the merge that brought it in.
        first_parent = run_git(root, "rev-list", "--first-parent", "HEAD").split()
        if commit in first_parent:
            merged_in = commit
        else:
            after = run_git(root, "rev-list", "--first-parent", "--ancestry-path", f"{commit}..HEAD").split()
            merged_in = after[-1] if after else None
    exclude = (RUNS / args.seam).as_posix() + "/"
    changed = changed_files(root, commit, exclude)
    if not commit:
        ci = "not yet run: the seam's changes are uncommitted"
    elif args.no_ci:
        ci = "not read: --no-ci"
    else:
        ci = ci_from_gh(root, commit)
    text = render(args.seam, root, folder, captures, changed, head, commit, merged_in, ci)
    (folder / MANIFEST).write_bytes(text.encode("utf-8"))
    print(f"wrote {(folder / MANIFEST).relative_to(root).as_posix()}: {len(captures)} file(s), "
          f"{len(changed)} changed path(s); CI: {ci}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
