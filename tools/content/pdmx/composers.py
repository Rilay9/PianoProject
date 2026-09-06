"""
Turning a free-text composer string into a licence label (replan §2.2).

PDMX's `composer_name` is whatever the uploader typed. Real examples from the
archive: `J.S. Bach (1685-1750)`, `F. Chopin`, `Frédéric Chopin`,
`Composed by Scott Joplin`, `arr. John Smith`, `Traditional`, `NA`. The job here
is to fold all of that onto `content/sources/composers.json`, and then to say
one of three words about the composition:

  pd            the composer is in the table and died in 1930 or earlier
  in-copyright  the composer is in the table and did not
  unknown       no match

**None of those rejects anything.** `docs/00` D23: the owner's build may carry
anything the dataset marks public domain, so this is a *label* carried on the
item and refused later by `--strict-license`, which is what the public deploy
runs. Rejecting here would quietly discard two thirds of the archive on the
strength of a text field nobody validated.
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path

# `tools/content` on the path and this directory *off* it, before anything
# else is imported. Python puts a script's own directory first on `sys.path`,
# so every module sitting beside this one silently outranks the standard
# library for the rest of the process. That is how `select.py` — since
# renamed to `shortlist.py` for the same reason — came to answer
# `socketserver`'s `import select` and kill a server on its first connection.
# The name is gone; the hazard is structural, so the guard stays.
_HERE = Path(__file__).resolve().parent
sys.path[:] = [entry for entry in sys.path if entry and Path(entry).resolve() != _HERE]
if str(_HERE.parent) not in sys.path:
    sys.path.insert(0, str(_HERE.parent))

from licensing import PD_CUTOFF_YEAR, composition_verdict  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[3]
COMPOSERS_FILE = REPO_ROOT / "content" / "sources" / "composers.json"

#: Words an uploader puts round a name that are not part of it.
CREDIT_NOISE = re.compile(
    r"\b(composed\s+by|composer|written\s+by|music\s+by|arranged\s+by|arrangement\s+by|"
    r"arr\.?|transcribed\s+by|transcription\s+by|edited\s+by|ed\.?|op\.?)\b",
    re.IGNORECASE,
)

#: `(1685-1750)`, `[1810 - 1849]`, `1685-1750` at the end of a string.
YEARS = re.compile(r"[\(\[]?\s*(1\d{3})\s*[-–—]\s*(1\d{3}|\d{2})\s*[\)\]]?")

#: A single year in brackets: `(1849)`.
SINGLE_YEAR = re.compile(r"[\(\[]\s*(1\d{3}|20\d{2})\s*[\)\]]")

#: How long a traditional alias must be before a bare prefix match counts.
TRADITIONAL_PREFIX_MIN = 12

#: Values PDMX uses for "there isn't one".
EMPTY = {"", "na", "n/a", "none", "null", "-", "unknown"}


@dataclass(frozen=True)
class ComposerMatch:
    """What the table knows about one composer string."""

    raw: str
    #: The canonical name, or None when nothing matched.
    canonical: str | None
    died: int | None
    born: int | None
    traditional: bool
    #: `pd` | `in-copyright` | `unknown`
    status: str
    reason: str
    #: Years the uploader typed that disagree with the table, if any.
    year_conflict: str | None = None

    @property
    def matched(self) -> bool:
        return self.canonical is not None or self.traditional


def fold(text: str) -> str:
    """
    The one normalisation, used for every comparison in this package.

    NFKD so `Dvořák` and `Dvorak` are the same string; lower-cased; credit
    words and bracketed years removed; every run of non-alphanumerics collapsed
    to a single space. `J.S. Bach (1685-1750)` and `js bach` both fold to
    `js bach`, which is why the table lists one alias and not eight.
    """
    decomposed = unicodedata.normalize("NFKD", text or "")
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    lowered = stripped.lower()
    lowered = YEARS.sub(" ", lowered)
    lowered = SINGLE_YEAR.sub(" ", lowered)
    lowered = CREDIT_NOISE.sub(" ", lowered)
    words = re.sub(r"[^a-z0-9]+", " ", lowered).split()
    # Initials rejoin: `J.S. Bach` becomes three words once the dots go, and
    # `js bach` is one alias rather than two. Runs of single letters are joined
    # back up, which is also what makes `W.A. Mozart` and `WA Mozart` the same
    # string.
    out: list[str] = []
    for word in words:
        if len(word) == 1 and out and len(out[-1]) <= 2 and out[-1].isalpha():
            out[-1] += word
        else:
            out.append(word)
    return " ".join(out)


def years_in(text: str) -> tuple[int, int] | None:
    """The birth-death pair an uploader typed, if there is one."""
    match = YEARS.search(text or "")
    if not match:
        return None
    born = int(match.group(1))
    second = match.group(2)
    if len(second) == 4:
        return born, int(second)
    # `1685-50` is written too. The century comes from the first year, and if
    # that lands *before* it — 1685-50 read as 1650 — the person meant the next
    # one, which is how anybody reads it.
    died = int(str(born)[:2] + second)
    if died < born:
        died += 100
    return born, died


class ComposerTable:
    """`content/sources/composers.json`, indexed for lookup."""

    def __init__(self, data: dict) -> None:
        self.traditional = {fold(alias) for alias in data.get("traditionalAliases", [])}
        self.by_alias: dict[str, dict] = {}
        self.entries: list[dict] = list(data.get("composers", []))
        for entry in self.entries:
            for alias in [entry["canonical"], *entry.get("aliases", [])]:
                self.by_alias.setdefault(fold(alias), entry)

    @classmethod
    def load(cls, path: Path = COMPOSERS_FILE) -> "ComposerTable":
        return cls(json.loads(path.read_text(encoding="utf-8")))

    def __len__(self) -> int:
        return len(self.entries)

    @property
    def decoys(self) -> list[dict]:
        """The entries that exist to prove the strict build refuses them."""
        return [entry for entry in self.entries if entry.get("decoy")]

    def match(self, raw: str) -> ComposerMatch:
        text = (raw or "").strip()
        folded = fold(text)

        if folded in EMPTY or not folded:
            return ComposerMatch(
                raw=text, canonical=None, died=None, born=None, traditional=False,
                status="unknown", reason="no composer named",
            )

        # Traditional first: `Traditional (English, 16th century)` folds to a
        # string starting with the alias, and a folk tune has no composer to
        # look up by design.
        #
        # A long alias also matches as a bare prefix, because the CSV runs
        # fields together: `after Chief F. O'Neillwith spirit` is the collector
        # and a tempo marking with the space lost between them, and there are
        # hundreds of those. Long, because "folk" as a bare prefix would claim
        # Folkert Smit and "anon" would claim anyone called Anona.
        for alias in self.traditional:
            long_enough = len(alias) >= TRADITIONAL_PREFIX_MIN
            if (
                folded == alias
                or folded.startswith(f"{alias} ")
                or f" {alias} " in f" {folded} "
                or (long_enough and folded.startswith(alias))
            ):
                return ComposerMatch(
                    raw=text, canonical=None, died=None, born=None, traditional=True,
                    status="pd", reason="traditional or anonymous",
                )

        entry = self.by_alias.get(folded)
        if entry is None:
            # A trailing forename initial or a stray word is common: try the
            # longest alias that the folded string contains as a whole phrase.
            candidates = [
                (len(alias), alias, value)
                for alias, value in self.by_alias.items()
                if alias and (folded.startswith(f"{alias} ") or folded.endswith(f" {alias}")
                              or f" {alias} " in f" {folded} ")
            ]
            if candidates:
                entry = max(candidates)[2]

        if entry is None:
            return ComposerMatch(
                raw=text, canonical=None, died=None, born=None, traditional=False,
                status="unknown", reason="composer not in composers.json",
            )

        died = entry.get("died")
        born = entry.get("born")
        conflict = None
        typed = years_in(text)
        if typed is not None:
            # The uploader's years are checked, never believed: someone who
            # types the wrong dates is telling you the attribution is shaky.
            if born is not None and typed[0] != born:
                conflict = f"typed {typed[0]}-{typed[1]}, table says {born}-{died}"
            elif died is not None and died != 9999 and typed[1] != died:
                conflict = f"typed {typed[0]}-{typed[1]}, table says {born}-{died}"

        verdict = composition_verdict(
            composer=entry["canonical"],
            composer_died=None if died == 9999 else died,
        )
        if died == 9999:
            status, reason = "in-copyright", f"{entry['canonical']} is living"
        else:
            status = "pd" if verdict.bundlable else "in-copyright"
            reason = verdict.reason
        return ComposerMatch(
            raw=text, canonical=entry["canonical"], died=None if died == 9999 else died,
            born=born, traditional=False, status=status, reason=reason,
            year_conflict=conflict,
        )


__all__ = [
    "ComposerMatch",
    "ComposerTable",
    "COMPOSERS_FILE",
    "PD_CUTOFF_YEAR",
    "fold",
    "years_in",
]
