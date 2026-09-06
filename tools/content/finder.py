"""
Turns a lesson's `finder` block into words a search engine and a chatbot understand
(replan §4.1).

The owner is going to find music himself — that is the premise of the whole
phase. What the app can do is tell him *what this rung needs* in terms someone
else's search index will match, and hand him something to paste.

Two forms, because they are read by different things:

  `searchQuery`  one line for a search box. Keywords only, no grammar, the
                 format word included because "musicxml" is the difference
                 between a file the app can score and a picture of a score.
  `chatPrompt`   a paragraph for an assistant. States the skill, the level in
                 plain words, what the piece must have, what makes it wrong,
                 the licensing position, where to look, and what shape the
                 answer should take.

**Generated, not hand-written.** 87 rungs and 254 concepts is far too much
prose to keep consistent by hand, and the moment one wording turns out to work
better than another it has to change in one place. It also makes the output
checkable: `validate.py` can assert the length, that every constraint the
author wrote actually survived into the prompt, and that the `00` D18 sentence
is present — the rule about copyrighted music is *stated* by the prompt rather
than quietly broken by it.
"""
from __future__ import annotations

import json
from pathlib import Path

#: Hard ceiling on a generated chat prompt. Long enough for six constraints and
#: five things to avoid; short enough to paste into anything.
MAX_CHAT_PROMPT = 900

#: Also the sentence `validate.py` looks for. The app never downloads anything
#: on the owner's behalf and never bundles a copyrighted transcription (`00`
#: D10, D18); he is finding music for his own use, and the prompt says so
#: rather than pretending the question does not arise.
COPYRIGHT_SENTENCE = (
    "Music still in copyright is fine — I am finding it for myself and will "
    "buy it or use a licensed source."
)

#: The part of `COPYRIGHT_SENTENCE` `validate.py` looks for. Kept separate so
#: the wording can be tuned without silently turning the check off.
COPYRIGHT_MARKER = "still in copyright"

#: Where to look. Named because a chatbot asked for "sheet music" returns
#: image scans, and an image cannot be followed, scored or transposed.
SOURCES_SENTENCE = "Prefer sources with MusicXML: MuseScore, IMSLP, or a retailer that exports it."

ASK_SENTENCE = "List ten, with composer and where to get each."

#: Format words worth putting in a search box verbatim.
SEARCH_FORMAT_WORDS = "musicxml"


def _join(items: list[str], last: str = "and") -> str:
    items = [i for i in items if i]
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    return f"{', '.join(items[:-1])} {last} {items[-1]}"


def search_query(finder: dict) -> str:
    """
    One line of keywords.

    Deliberately not a sentence: a search box does better with
    `easy piano C major hands together musicxml` than with a request. The
    level words come first because that is what narrows a music search most,
    and the constraints follow in the author's order.
    """
    parts = [
        "piano sheet music",
        *[phrase.strip() for phrase in finder["levelWords"].split(",")],
        *finder["constraints"],
        SEARCH_FORMAT_WORDS,
    ]
    # Deduplicated by *phrase*, not by word. Dropping the second "C" out of
    # "C position, C major" leaves "C position major", which is not a key and
    # not anything else either. A repeated whole phrase is the only repetition
    # worth removing.
    seen: set[str] = set()
    kept: list[str] = []
    for part in parts:
        phrase = " ".join(part.split())
        key = phrase.lower()
        if phrase and key not in seen:
            seen.add(key)
            kept.append(phrase)
    return " ".join(kept)


def chat_prompt(finder: dict, *, what: str) -> str:
    """
    A paragraph for an assistant.

    `what` names the thing being practised — "a lesson on X" or "the skill X" —
    so the same generator serves rungs and concepts.
    """
    lines = [
        f"I am learning piano, working on {what}. "
        f"I need piano music that trains {finder['skill']}.",
        f"Level: {finder['levelWords']}.",
        f"It must have: {_join(finder['constraints'])}.",
        f"Avoid: {_join(finder['avoid'], last='or')}.",
    ]
    examples = finder.get("examples") or []
    if examples:
        named = [
            f"{e['title']}" + (f" ({e['composer']})" if e.get("composer") else "")
            for e in examples
        ]
        lines.append(f"Roughly the right kind: {_join(named)}.")
    lines.append(finder["formats"])
    lines.append(COPYRIGHT_SENTENCE)
    lines.append(SOURCES_SENTENCE)
    lines.append(ASK_SENTENCE)
    return " ".join(lines)


def generate(finder: dict, *, what: str) -> dict:
    """The finder block as the app receives it: the author's fields plus both prompts."""
    out = dict(finder)
    out["searchQuery"] = search_query(finder)
    out["chatPrompt"] = chat_prompt(finder, what=what)
    return out


def lesson_what(stage: int, title: str) -> str:
    return f'Stage {stage}, "{title}"'


def concept_what(display: str) -> str:
    return f"the skill of {display}"


def load_concepts(path: Path) -> dict:
    """`content/curriculum/concepts.json`, keyed by concept id."""
    if not path.is_file():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    return {c["id"]: c for c in data.get("concepts", [])}
