#!/usr/bin/env python3
"""
Every absolute word in every lesson, with its sentence, for a person to judge.

The reviewer's content audit of 2026-09-26 (backlog T49; Part 10 of the outside
audit) found one pattern under most of the lessons' faults: certainty the
material has not earned. Useful heuristics had been upgraded into laws — "there
are exactly two ways", "the only way", "every", "never", "the main reason" —
and a technique habit, a style's one texture or a guess about injuries read as a
fact because nothing in the sentence said otherwise. Acceptance gate 5 of Wave F
says these words get an explicit review.

This lists them. It does **not** decide anything and it **never fails**: an
"always" can be exactly right ("a dot always adds half"), and "most" is often
the honest hedge that replaced an "every". Which is which is a musical and
pedagogical judgement, made by a reader of the sentence, not by a regular
expression — the same reason `rung_audit.py` prints and exits 0. The words are
the ones gate 5 names and the four the F0 brief adds to them:

    gate 5:   always, never, only, every, exactly, the reason, the fix
    F0 adds:  the main reason, all, none, most

Usage:
    python3 tools/content/lint_absolutes.py                  # a summary on stdout
    python3 tools/content/lint_absolutes.py --out FILE.md    # the whole list, as Markdown
    python3 tools/content/lint_absolutes.py --lesson 1.2     # one lesson

Reads the lesson sources in `content/lessons/`, front matter excluded. The line
number is where the word is, so a reader can open the file at it.
"""
from __future__ import annotations

import argparse
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LESSONS = ROOT / "content" / "lessons"

# Longest first, so "the main reason" is reported as itself and not also as
# "the reason" (it does not contain that phrase, but the order keeps the table
# readable if the list ever grows one that does).
WORDS = [
    "the main reason",
    "the reason",
    "the fix",
    "always",
    "never",
    "only",
    "every",
    "exactly",
    "all",
    "none",
    "most",
]
# A phrase may be wrapped across a line in the source, so its spaces match any whitespace.
PATTERN = re.compile(
    r"\b(" + "|".join(r"\s+".join(re.escape(part) for part in w.split()) for w in WORDS) + r")\b",
    re.IGNORECASE,
)

FRONT_MATTER = re.compile(r"\A---\r?\n.*?\r?\n---\r?\n", re.DOTALL)


def body_of(path: Path) -> tuple[str, int]:
    """The lesson text after its front matter, and the line number it starts on."""
    raw = path.read_text(encoding="utf-8")
    match = FRONT_MATTER.match(raw)
    if not match:
        return raw, 1
    return raw[match.end():], raw[: match.end()].count("\n") + 1


def sentences(block: str) -> list[tuple[int, str]]:
    """A paragraph or list item cut into sentences, each with its offset in the block."""
    out: list[tuple[int, str]] = []
    start = 0
    for found in re.finditer(r"(?<=[.!?])[\"”')\]*]*\s+", block):
        out.append((start, block[start:found.start() + len(found.group(0).rstrip())]))
        start = found.end()
    if start < len(block):
        out.append((start, block[start:]))
    return out


def findings(path: Path) -> list[dict]:
    body, first_line = body_of(path)
    out: list[dict] = []
    # Paragraphs and list items are the units a sentence lives in; a blank line
    # or a list marker ends one.
    for block in re.finditer(r"(?:^(?!\s*$).*(?:\n|$))+", body, re.MULTILINE):
        text = block.group(0)
        for offset, sentence in sentences(text):
            for word in PATTERN.finditer(sentence):
                at = block.start() + offset + word.start()
                out.append({
                    "line": first_line + body.count("\n", 0, at),
                    "word": " ".join(word.group(1).lower().split()),
                    "sentence": re.sub(r"\s+", " ", sentence.replace("*", "")).strip(),
                })
    return out


def lesson_paths(only: str | None) -> list[Path]:
    paths = sorted(LESSONS.glob("*.md"), key=lambda p: [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", p.stem)])
    return [p for p in paths if only is None or p.stem == only]


def markdown(results: dict[str, list[dict]]) -> str:
    total = Counter(f["word"] for items in results.values() for f in items)
    lines = [
        f"# Absolute words in the lessons ({date.today().isoformat()})",
        "",
        "Written by `tools/content/lint_absolutes.py` for Wave F's human review (backlog T49,",
        "acceptance gate 5). **Diagnostic, not a verdict:** a listed word may be exactly right,",
        "and the list fails nothing. Each row is one occurrence: the line in",
        "`content/lessons/<lesson>.md`, the word, and the sentence it is in (emphasis marks",
        "removed). A sentence with two of the words appears twice.",
        "",
        f"Lessons read: {len(results)}. Occurrences: {sum(total.values())}.",
        "",
        "| word | occurrences |",
        "| --- | --- |",
    ]
    for word in WORDS:
        lines.append(f"| {word} | {total.get(word, 0)} |")
    for lesson, items in results.items():
        lines += ["", f"## {lesson}", ""]
        if not items:
            lines.append("None.")
            continue
        lines += ["| line | word | sentence |", "| --- | --- | --- |"]
        for f in items:
            sentence = f["sentence"].replace("|", "\\|")
            lines.append(f"| {f['line']} | {f['word']} | {sentence} |")
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--out", type=Path, help="write the whole list as Markdown to this file")
    parser.add_argument("--lesson", help="one lesson id, e.g. 1.2")
    args = parser.parse_args(argv)

    results = {p.stem: findings(p) for p in lesson_paths(args.lesson)}
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(markdown(results), encoding="utf-8", newline="\n")
        print(f"wrote {args.out} ({sum(len(v) for v in results.values())} occurrences in {len(results)} lessons)")
    else:
        total = Counter(f["word"] for items in results.values() for f in items)
        for word in WORDS:
            print(f"{word:16s} {total.get(word, 0)}")
        busiest = sorted(results.items(), key=lambda kv: -len(kv[1]))[:10]
        print("most occurrences:", ", ".join(f"{k} {len(v)}" for k, v in busiest))
    # Diagnostic: never fails a build.
    return 0


if __name__ == "__main__":
    sys.exit(main())
