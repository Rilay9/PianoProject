#!/usr/bin/env python3
"""
Seven checks that catch a wrong score file, run over every file in the catalog.

**Why this exists.** Seven score files are recorded as wrong in
`docs/lesson-audit/README.md` ("Score files that are wrong"). Every one of them
was found by a person who happened to open a file because a lesson mentioned
it. 110 of the 292 songs that sit on a rung are named in no lesson and the
Library-only songs were never opened at all, so "a reader found it" does not
scale to the corpus. The owner (2026-09-21, `docs/pending-review.md` standing
context 5): *"I don't want to have to do anything manually. Figure out ways to
make sure things are correct."* `docs/prompts/working-rules.md` §2.8 — make the
correction mechanical — is the rule this implements, for the seven shapes that
have actually been seen.

**What it is not.** It is a *report*, not a gate. Nothing here is wired into
`validate.py`; see `main()`'s note. Six of the seven checks read the MusicXML
directly, the way `truncation_scan.py` and `notation.py` do, because that is
cheap enough to run over every file; only the key analysis needs music21.

**Every threshold in this file is measured, not guessed.** `--stats` prints the
corpus distribution each one came from, and the measurement is written beside
the constant with the date it was taken. Re-run `--stats` after a content build
that changes the corpus and move the number if the distribution moved.

**Nothing here has been heard.** Every judgement is about what the file says.

Usage:

    python tools/content/score_checks.py                 # the full report
    python tools/content/score_checks.py --stats         # the distributions
    python tools/content/score_checks.py --only bar-duration repeat-structure
    python tools/content/score_checks.py --item song.folk.so-danco-samba.pdmx
    python tools/content/score_checks.py --no-analysis   # skip music21
"""
from __future__ import annotations

import argparse
import json
import re
import statistics
import sys
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from fractions import Fraction
from pathlib import Path
from xml.etree import ElementTree as ET

sys.path.insert(0, str(Path(__file__).resolve().parent))

from notation import STEP_SEMITONES, read_musicxml  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "app" / "public" / "content"
BUILD = ROOT / "build"
CATALOG = CONTENT / "catalog.json"
LIBRARY_DIR = BUILD / "pdmx" / "library"
LIBRARY_INDEX = LIBRARY_DIR / "library.json"
REPORT_JSON = BUILD / "score-checks.json"
REPORT_MD = BUILD / "score-checks.md"
ANALYSIS_CACHE = BUILD / "score-checks.cache.json"
#: The proposed fix per flagged row, written by the reader who worked through
#: the list — `"<item id>|<check>": "<fix>"`. Kept beside the report rather than
#: inside it so that re-running the checks does not throw the judgements away.
FIXES = BUILD / "score-checks.fixes.json"

SEVERITIES = ("high", "medium", "low")

CHECKS = (
    "key-consistency",
    "grace-density",
    "truncation",
    "bar-duration",
    "containment",
    "title-structure",
    "repeat-structure",
)


# --------------------------------------------------------------------------
# What a file says. One pass, no inference.
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class Note:
    voice: str
    staff: str
    duration: int
    grace: bool
    chord: bool
    rest: bool
    whole_measure_rest: bool
    pitch_class: int | None
    midi: int | None
    printed_type: str | None


@dataclass
class Bar:
    number: str
    index: int  # 1-based position in the part, which `number` is not
    implicit: bool
    divisions: int
    beats: int
    beat_type: int
    time_changed: bool
    key: tuple[int, str | None] | None
    tempo: float | None
    notes: list[Note] = field(default_factory=list)
    #: `"<staff>/<voice>"` → how far into the bar that voice's last note
    #: reached, in divisions. Not a sum of durations: see `read_score`.
    voice_lengths: dict[str, int] = field(default_factory=dict)
    repeats: list[tuple[str, str]] = field(default_factory=list)  # (location, direction)
    endings: list[tuple[str, str]] = field(default_factory=list)  # (number, type)
    styles: list[tuple[str, str]] = field(default_factory=list)  # (location, bar-style)

    @property
    def expected(self) -> Fraction:
        """The bar's full length in divisions, per its time signature."""
        if self.divisions <= 0 or self.beats <= 0 or self.beat_type <= 0:
            return Fraction(0)
        return Fraction(self.divisions * 4 * self.beats, self.beat_type)


@dataclass
class Part:
    id: str
    bars: list[Bar] = field(default_factory=list)


@dataclass
class Score:
    parts: list[Part] = field(default_factory=list)
    words: list[str] = field(default_factory=list)
    parse_error: str | None = None

    @property
    def bar_count(self) -> int:
        """Bars in **one** part, which is what `notation.describe` counts too.

        Counting `<measure>` across the document multiplies by the number of
        parts, and the archive's own indexes (`library.json`, `candidates.json`)
        store that raw count — which is why an archive bar count is never
        compared against this one without being recomputed the same way.
        """
        return max((len(p.bars) for p in self.parts), default=0)

    @property
    def notes(self) -> list[Note]:
        return [n for p in self.parts for b in p.bars for n in b.notes]

    def first_time(self) -> str | None:
        for part in self.parts:
            for bar in part.bars:
                if bar.beats and bar.beat_type:
                    return f"{bar.beats}/{bar.beat_type}"
        return None

    def keys(self) -> list[tuple[int, str | None]]:
        out: list[tuple[int, str | None]] = []
        for part in self.parts:
            for bar in part.bars:
                if bar.key is not None and (not out or out[-1] != bar.key):
                    out.append(bar.key)
            if out:
                break
        return out

    def tempos(self) -> list[float]:
        out: list[float] = []
        for part in self.parts:
            for bar in part.bars:
                if bar.tempo:
                    out.append(bar.tempo)
            if out:
                break
        return out


#: `<type>` to quarter-lengths, for turning a metronome mark into quarter BPM.
BEAT_UNIT_QUARTERS = {
    "whole": 4.0,
    "half": 2.0,
    "quarter": 1.0,
    "eighth": 0.5,
    "16th": 0.25,
    "32nd": 0.125,
}


def _int(text: str | None, default: int = 0) -> int:
    if text is None or not text.strip():
        return default
    try:
        return int(float(text.strip()))
    except ValueError:
        return default


def read_score(text: str) -> Score:
    """Everything the checks need, from one parse of the MusicXML."""
    score = Score()
    try:
        root = ET.fromstring(text)
    except ET.ParseError as error:
        score.parse_error = f"{type(error).__name__}: {error}"
        return score

    score.words = [(el.text or "").strip() for el in root.findall(".//{*}words") if (el.text or "").strip()]

    # Divisions, metre and key carry forward until a measure restates them —
    # that is what MusicXML means by putting them in `<attributes>` rather
    # than on every bar.
    for part_el in root.findall("{*}part"):
        part = Part(id=part_el.get("id") or "?")
        divisions, beats, beat_type = 0, 0, 0
        key: tuple[int, str | None] | None = None
        for index, measure in enumerate(part_el.findall("{*}measure"), start=1):
            time_changed = False
            bar_key = None
            for attributes in measure.findall("{*}attributes"):
                d = attributes.findtext("{*}divisions")
                if d:
                    divisions = _int(d, divisions)
                time_el = attributes.find("{*}time")
                if time_el is not None:
                    new = (_int(time_el.findtext("{*}beats")), _int(time_el.findtext("{*}beat-type")))
                    if new[0] and new[1]:
                        time_changed = (beats, beat_type) != (0, 0) and new != (beats, beat_type)
                        beats, beat_type = new
                key_el = attributes.find("{*}key")
                if key_el is not None and key_el.findtext("{*}fifths") is not None:
                    pair = (_int(key_el.findtext("{*}fifths")), key_el.findtext("{*}mode"))
                    if pair != key:
                        bar_key = pair
                        key = pair

            tempo = None
            for sound in measure.findall(".//{*}sound"):
                if sound.get("tempo"):
                    try:
                        tempo = float(sound.get("tempo"))
                    except ValueError:
                        pass
            if tempo is None:
                for metronome in measure.findall(".//{*}metronome"):
                    unit = BEAT_UNIT_QUARTERS.get((metronome.findtext("{*}beat-unit") or "").strip())
                    per = metronome.findtext("{*}per-minute")
                    if unit and per:
                        try:
                            tempo = float(per.strip()) * unit
                        except ValueError:
                            pass

            bar = Bar(
                number=measure.get("number") or str(index),
                index=index,
                implicit=(measure.get("implicit") == "yes"),
                divisions=divisions,
                beats=beats,
                beat_type=beat_type,
                time_changed=time_changed,
                key=bar_key,
                tempo=tempo,
            )

            # **A cursor, not a sum.** `<backup>` and `<forward>` move where the
            # next note is written; they are not themselves written time, and
            # MuseScore opens a bar with `forward 30240` followed by
            # `backup 30240` as a way of positioning. Adding durations up
            # reported `black-bottom-stomp` bar 4 as holding seven beats of
            # four because of exactly that pair. So: follow the position, and
            # record for each staff-and-voice how far its last note reached.
            #
            # Keyed by **staff and voice**, because a grand staff written as
            # one part numbers voices per staff in some exports and across the
            # part in others.
            position = 0
            current_voice = "1"
            current_staff = "1"
            for element in measure:
                tag = element.tag.rsplit("}", 1)[-1]
                if tag == "backup":
                    position = max(0, position - _int(element.findtext("{*}duration")))
                    continue
                if tag == "forward":
                    position += _int(element.findtext("{*}duration"))
                    continue
                if tag != "note":
                    if tag == "barline":
                        location = element.get("location") or "right"
                        repeat = element.find("{*}repeat")
                        if repeat is not None:
                            bar.repeats.append((location, repeat.get("direction") or "?"))
                        for ending in element.findall("{*}ending"):
                            bar.endings.append((ending.get("number") or "?", ending.get("type") or "?"))
                        style = element.findtext("{*}bar-style")
                        if style:
                            bar.styles.append((location, style))
                    continue

                voice = element.findtext("{*}voice") or current_voice
                current_voice = voice
                current_staff = element.findtext("{*}staff") or current_staff
                grace = element.find("{*}grace") is not None
                chord = element.find("{*}chord") is not None
                rest_el = element.find("{*}rest")
                pitch_el = element.find("{*}pitch")
                pitch_class = midi = None
                if pitch_el is not None:
                    step = pitch_el.findtext("{*}step") or ""
                    if step in STEP_SEMITONES:
                        alter = _int(pitch_el.findtext("{*}alter"))
                        octave = _int(pitch_el.findtext("{*}octave"), 4)
                        midi = (octave + 1) * 12 + STEP_SEMITONES[step] + alter
                        pitch_class = midi % 12
                duration = _int(element.findtext("{*}duration"))
                bar.notes.append(
                    Note(
                        voice=voice,
                        staff=element.findtext("{*}staff") or "1",
                        duration=duration,
                        grace=grace,
                        chord=chord,
                        rest=rest_el is not None,
                        whole_measure_rest=(rest_el is not None and rest_el.get("measure") == "yes"),
                        pitch_class=pitch_class,
                        midi=midi,
                        printed_type=(element.findtext("{*}type") or None),
                    )
                )
                if not grace and not chord:
                    position += duration
                    key_ = f"{current_staff}/{voice}"
                    bar.voice_lengths[key_] = max(bar.voice_lengths.get(key_, 0), position)

            part.bars.append(bar)
        score.parts.append(part)
    return score


# --------------------------------------------------------------------------
# A flag
# --------------------------------------------------------------------------


@dataclass
class Flag:
    item: str
    title: str
    check: str
    severity: str
    numbers: dict
    why: str
    #: Which *sort* of flag this is within its check, so that one item can
    #: carry two of them and still be addressed separately: a key flag from the
    #: title and one from the analysis, a grace flag and a tempo flag, one
    #: containment flag per other item. `key()` is what the proposed-fix file
    #: is keyed on, so it has to be stable across runs.
    kind: str = ""

    def key(self) -> str:
        return f"{self.item}|{self.check}|{self.kind}"

    def as_row(self) -> dict:
        return {
            "item": self.item,
            "title": self.title,
            "check": self.check,
            "kind": self.kind,
            "severity": self.severity,
            "numbers": self.numbers,
            "why": self.why,
        }


# --------------------------------------------------------------------------
# 1. key-consistency
# --------------------------------------------------------------------------

#: `Écossaise in G major`, `Andante in B-flat major`, `Minuet in G Minor`.
#: The `in` is required. Without it "Minor Swing" and "A Major Scale" match,
#: and a title is the field this repository has been burned by most
#: (`docs/00-invariants.md` §1a) — a loose match here would be exactly the
#: wrong kind of mistake.
TITLE_KEY = re.compile(
    r"\bin\s+([A-G])(?:\s*(?:-|‐|‑)?\s*(sharp|flat)\b|\s*([#b♯♭]))?"
    r"\s+(major|minor)\b",
    re.IGNORECASE,
)

MAJOR_TONIC_PC = {i: (7 * i) % 12 for i in range(-7, 8)}


def title_key(title: str) -> tuple[int, str] | None:
    """`(tonic pitch class, mode)` the title claims, or `None` if it claims none."""
    match = TITLE_KEY.search(unicodedata.normalize("NFC", title or ""))
    if not match:
        return None
    letter, word, sign, mode = match.groups()
    pc = STEP_SEMITONES[letter.upper()]
    if (word or "").lower() == "sharp" or sign in {"#", "♯"}:
        pc += 1
    elif (word or "").lower() == "flat" or sign in {"b", "♭"}:
        pc -= 1
    return pc % 12, mode.lower()


def signature_key(keys: list[tuple[int, str | None]], final_bass: int | None) -> tuple[int, str, bool]:
    """
    `(tonic pitch class, mode, mode_was_read)` from the first key signature.

    Most files omit `<mode>`, so a signature alone cannot tell A minor from C
    major. `notation.key_name` settles it the same way — by what the music ends
    on — and the third element says which of the two happened, because that is
    the difference between a fact and a good guess.
    """
    if not keys:
        return 0, "major", False
    fifths, mode = keys[0]
    major_pc = MAJOR_TONIC_PC[max(-7, min(7, fifths))]
    if mode in {"major", "minor"}:
        return (major_pc if mode == "major" else (major_pc + 9) % 12), mode, True
    relative_minor = (major_pc + 9) % 12
    if final_bass is not None and final_bass == relative_minor:
        return relative_minor, "minor", False
    return major_pc, "major", False


PC_NAMES = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"]


def check_key_consistency(row: dict, score: Score, analysis: dict | None) -> list[Flag]:
    flags: list[Flag] = []
    keys = score.keys()
    final_bass = (row.get("notation") or {}).get("finalBass")
    sig_pc, sig_mode, mode_read = signature_key(keys, final_bass)
    claimed = title_key(row.get("title") or "")
    item, title = row["id"], row.get("title") or ""

    if claimed and keys:
        pc, mode = claimed
        # What the signature allows. When the file states `<mode>` there is one
        # answer; when it does not, one signature stands for two keys and the
        # title naming the other one is not a disagreement. Without this, every
        # minor piece whose file omits `<mode>` is flagged against its own
        # relative major — which is how the G minor Minuet came up as "titled G
        # minor, written in B flat" on the first run of this check.
        major_pc = MAJOR_TONIC_PC[max(-7, min(7, keys[0][0]))]
        allowed = (
            {(sig_pc, sig_mode)}
            if mode_read
            else {(major_pc, "major"), ((major_pc + 9) % 12, "minor")}
        )
        if (pc, mode) not in allowed:
            flags.append(
                Flag(
                    item,
                    title,
                    "key-consistency",
                    "high",
                    {
                        "titleKey": f"{PC_NAMES[pc]} {mode}",
                        "signature": f"{PC_NAMES[sig_pc]} {sig_mode}",
                        "fifths": keys[0][0],
                        "modeTag": keys[0][1],
                        "modeRead": mode_read,
                        "finalBass": final_bass,
                    },
                    f"title says {PC_NAMES[pc]} {mode}; the key signature is "
                    f"fifths {keys[0][0]} ({PC_NAMES[sig_pc]} {sig_mode}"
                    f"{'' if mode_read else ', mode inferred from the final bass'})",
                    kind="title",
                )
            )

    if analysis and analysis.get("tonicPc") is not None and keys:
        a_pc = analysis["tonicPc"]
        a_mode = analysis.get("mode") or "?"
        confidence = analysis.get("correlation")
        modulates = len(keys) > 1
        # A key signature stands for two keys, and music21 choosing the other
        # one is not a disagreement about the file — it is the analysis reading
        # a C major scale as A minor, which it does for every scale exercise in
        # the corpus. Measured on a sixty-file sample, 2026-09-21: 10 of 23
        # key-consistency flags were exactly this, and none was a fault.
        major_pc = MAJOR_TONIC_PC[max(-7, min(7, keys[0][0]))]
        relatives = {major_pc, (major_pc + 9) % 12}
        # Three witnesses, as the brief put it: the key signature, the
        # pitch-class analysis, and what the music ends on. One witness against
        # the signature is not enough — music21 reads a I-IV-V loop in C as F
        # major, which is how 207 of 279 first-run flags came to be four-bar
        # exercises. So the signature has to be outvoted: the analysis *and*
        # the final bass both disagree with it, over enough bars for an
        # analysis to mean anything.
        outvoted = final_bass is not None and final_bass != sig_pc
        long_enough = score.bar_count >= KEY_ANALYSIS_MIN_BARS
        if a_pc not in relatives and not modulates and outvoted and long_enough:
            # `correlationCoefficient` above this is what music21 reports on a
            # score whose key is plain; below it the analysis is weak and the
            # disagreement says little. Measured over this corpus — see
            # `--stats`, `key analysis correlation`.
            severity = "medium" if (confidence or 0) >= ANALYSIS_CONFIDENT else "low"
            flags.append(
                Flag(
                    item,
                    title,
                    "key-consistency",
                    severity,
                    {
                        "signature": f"{PC_NAMES[sig_pc]} {sig_mode}",
                        "analysis": f"{PC_NAMES[a_pc]} {a_mode}",
                        "correlation": round(confidence, 3) if confidence is not None else None,
                        "finalBass": final_bass,
                        "bars": score.bar_count,
                    },
                    f"the notes analyse as {PC_NAMES[a_pc]} {a_mode} "
                    f"(correlation {confidence:.2f}) against a {PC_NAMES[sig_pc]} "
                    f"{sig_mode} key signature" if confidence is not None else
                    f"the notes analyse as {PC_NAMES[a_pc]} {a_mode} against a "
                    f"{PC_NAMES[sig_pc]} {sig_mode} key signature",
                    kind="analysis",
                )
            )
    return flags


# --------------------------------------------------------------------------
# 2. grace-density and a tempo far below the corpus for its metre
# --------------------------------------------------------------------------


#: A tempo marking in any of the languages this corpus's scores are marked in.
#: Wider than `TEMPO_WORDS`, which counts movement headings and must not treat
#: "sostenuto" as one: this only has to answer "does the file say it is slow".
TEMPO_MARK = re.compile(
    r"\b(adagio|adagietto|andante|andantino|larghetto|largo|lento|lent|lentement|grave|"
    r"moderato|mod[eé]r[eé]|langsam|ruhig|breit|getragen|tranquillo|sostenuto|"
    r"cantabile|allegro|allegretto|vivace|presto|prestissimo|tempo\s+di|a\s+tempo)\b",
    re.IGNORECASE,
)


def grace_share(score: Score) -> tuple[int, int, float]:
    notes = score.notes
    graces = sum(1 for n in notes if n.grace)
    return graces, len(notes), (graces / len(notes) if notes else 0.0)


def check_grace_density(row: dict, score: Score, tempo_norms: dict[str, float]) -> list[Flag]:
    flags: list[Flag] = []
    item, title = row["id"], row.get("title") or ""
    graces, total, share = grace_share(score)
    if graces and share >= GRACE_SHARE_LIMIT and graces >= GRACE_COUNT_FLOOR:
        flags.append(
            Flag(
                item,
                title,
                "grace-density",
                "high" if share >= GRACE_SHARE_LIMIT * 2 else "medium",
                {"graceNotes": graces, "notes": total, "share": round(share, 3)},
                f"{graces} of {total} notes are grace notes ({share:.0%}); the "
                f"corpus threshold is {GRACE_SHARE_LIMIT:.0%}",
                kind="density",
            )
        )

    tempos = score.tempos()
    metre = score.first_time()
    if tempos and metre:
        tempo = tempos[0]
        floor = tempo_norms.get(metre)
        # A slow piece is not a fault, and the corpus is full of them: the
        # first run of this flagged the Moonlight, Åse's Death, Nimrod and the
        # Pathétique's Adagio alongside the one file it was written for. What
        # separates them is that each of those *says* it is slow. A file
        # carrying a slow `<sound tempo>` and no tempo marking at all is the
        # shape worth a look. Still the weakest of the seven checks — most of
        # what is left is a file whose marking is only in the engraving.
        marked = any(TEMPO_MARK.search(word) for word in score.words)
        if floor is not None and tempo < floor and not marked:
            flags.append(
                Flag(
                    item,
                    title,
                    "grace-density",
                    "low",
                    {"tempoQuarterBpm": round(tempo, 1), "metre": metre, "corpusFloor": round(floor, 1)},
                    f"quarter = {tempo:.0f} in {metre}, below the corpus floor "
                    f"{floor:.0f} for that metre",
                    kind="tempo",
                )
            )
    return flags


# --------------------------------------------------------------------------
# 3. truncation
# --------------------------------------------------------------------------

STOP_WORDS = {"the", "a", "an", "de", "la", "le", "el", "van", "von", "di", "da"}


def normalise_title(text: str) -> str:
    text = unicodedata.normalize("NFKD", text or "")
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def work_key(title: str) -> str:
    """
    The part of a title that names the *work*, for matching archive copies.

    Parentheticals go (`(first movement, short edition)`, `(Piano)`), then
    everything from the first comma (`, K. 1e`, `, BWV Anh. 115`) — because the
    catalog rewrites catalogue numbers into a house style the archive's
    uploaders do not use, so matching on them matches nothing.
    """
    text = re.sub(r"\([^)]*\)", " ", title or "")
    text = text.split(",")[0]
    return normalise_title(text)


def surname(composer: str | None) -> str | None:
    tokens = [t for t in normalise_title(composer or "").split() if t not in STOP_WORDS and len(t) > 2]
    return tokens[-1] if tokens else None


@dataclass
class ArchiveIndex:
    """Titles of the 37,261 unpacked archive scores, so a copy can be reread."""

    rows: list[tuple[str, str, str]] = field(default_factory=list)  # (cid, normalised title, composer)

    @classmethod
    def load(cls) -> "ArchiveIndex":
        index = cls()
        if not LIBRARY_INDEX.exists():
            return index
        data = json.loads(LIBRARY_INDEX.read_text(encoding="utf-8", errors="replace"))
        for row in data.get("scores", []):
            cid = row[0].split("/")[-1].rsplit(".", 1)[0]
            index.rows.append((cid, normalise_title(row[1]), normalise_title(row[2])))
        return index

    def path(self, cid: str) -> Path:
        return LIBRARY_DIR / cid[2:4].lower() / f"{cid}.mxl"

    def copies(self, title: str, composer: str | None, exclude: str) -> tuple[list[str], bool]:
        """
        Archive cids of the same work, and whether the composer narrowed it.

        The composer filter is applied only when it leaves something: the
        archive's `composer` column is an uploader's free text ("Transcripción:
        Dario Roberto Hernández" on a Petzold minuet), so an empty result after
        filtering means the column is wrong, not that the copies are different
        pieces. `docs/00-invariants.md` §1a — a search returning nothing means
        the search returned nothing.
        """
        key = work_key(title)
        if len(key) < ARCHIVE_KEY_MIN_CHARS:
            return [], False
        hits = [(cid, who) for cid, name, who in self.rows if key in name and cid != exclude]
        if not hits:
            return [], False
        name = surname(composer)
        if name:
            narrowed = [cid for cid, who in hits if name in who]
            if narrowed:
                return narrowed[:ARCHIVE_COPY_LIMIT], True
        return [cid for cid, _ in hits][:ARCHIVE_COPY_LIMIT], False


def archive_bar_counts(
    index: ArchiveIndex, cids: list[str], mine: list[tuple] | None = None
) -> dict[str, tuple[int, int]]:
    """
    Bars **in one part** for each copy, recomputed the way `Score` counts.

    A copy only counts if it shares bars with the item. *Minuet in C major* is
    a title two different pieces carry — Mozart's K. 1f and a Clementi — and on
    the first run of this check the Mozart was called truncated against the
    Clementi's bar count. A title is not the music (`docs/00-invariants.md`
    §1a), so the match is confirmed against the notes: at least
    `ARCHIVE_SHARE_MIN` of the item's own distinct bars have to turn up in the
    copy before its length is allowed to say anything about the item's.
    """
    out: dict[str, tuple[int, int]] = {}
    unique = set(mine or ())
    for cid in cids:
        path = index.path(cid)
        if not path.exists():
            continue
        text = read_musicxml(path)
        if text is None:
            continue
        copy = read_score(text)
        if copy.parse_error or copy.bar_count == 0:
            continue
        run = 0
        if mine:
            prints = bar_fingerprints(copy)
            if len(unique & set(prints)) < len(unique) * ARCHIVE_SHARE_MIN:
                continue
            run = longest_run(prints, list(mine))
        out[cid] = (copy.bar_count, run)
    return out


def final_bar_incomplete(score: Score) -> tuple[bool, str]:
    """
    A last bar that is not full and carries no final barline.

    The last bar of a piece with a pickup is *supposed* to be short by exactly
    the pickup's length, so that bar is excused — without the excuse both
    Mozart minuets on `classical.4` are reported truncated for ending the way
    every piece with an upbeat ends.
    """
    for part in score.parts:
        if not part.bars:
            continue
        last = part.bars[-1]
        expected = last.expected
        if expected <= 0 or not last.voice_lengths:
            continue
        # The pickup's own length, not what it is missing: the bar that closes
        # the piece holds `full - pickup`, so those two add to a full bar.
        pickup = Fraction(0)
        first = part.bars[0]
        if first is not last and first.expected > 0 and first.voice_lengths:
            opened = max(first.voice_lengths.values())
            if opened < first.expected:
                pickup = Fraction(opened)
        reached = max(last.voice_lengths.values())
        ends = any(style in {"light-heavy", "heavy-light", "heavy-heavy"} for _, style in last.styles)
        if reached < expected and not ends and reached + pickup != expected:
            return True, (
                f"last bar {last.number} holds {reached} of {expected} divisions "
                f"and has no final barline"
            )
    return False, ""


def check_truncation(
    row: dict,
    score: Score,
    counts: dict[str, tuple[int, int]] | None = None,
    by_composer: bool = False,
) -> list[Flag]:
    """
    `counts` is `{copy: (bars, longest shared run)}`, already read by the caller.

    The run is reported because it is what separates the two things a short
    file can be. *Streets of Laredo* holds 17 bars against a 34-bar copy and 16
    of its 17 bars are an unbroken stretch of it — that is half a piece.
    *Hark the Herald* holds 20 against 80 with a longest run of 3 — that is a
    different arrangement, and the check cannot tell a reader which from the
    length alone.
    """
    item, title = row["id"], row.get("title") or ""
    bars = score.bar_count
    if bars <= 0:
        return []

    if counts:
        lengths = [b for b, _ in counts.values()]
        median = statistics.median(lengths)
        if median > 0 and bars < median * TRUNCATION_RATIO:
            run = max(r for _, r in counts.values())
            return [
                Flag(
                    item,
                    title,
                    "truncation",
                    "high" if bars < median * 0.6 else "medium",
                    {
                        "bars": bars,
                        "copyMedian": median,
                        "copies": len(counts),
                        "matchedBy": "title and composer" if by_composer else "title",
                        "copyBars": sorted(lengths),
                        "longestRun": run,
                        "verifiedAgainst": sorted(counts)[:4],
                    },
                    f"{bars} bars against a median of {median:g} over "
                    f"{len(counts)} copy/copies of the same work that share its bars; "
                    f"longest unbroken stretch of this file found in one of them: {run} bar(s)",
                    kind="copies",
                )
            ]
        return []

    short, why = final_bar_incomplete(score)
    if short:
        return [
            Flag(
                item,
                title,
                "truncation",
                "low",
                {"bars": bars},
                why + " (no copy of the work to compare against)",
                kind="final-bar",
            )
        ]
    return []


# --------------------------------------------------------------------------
# 4. bar-duration
# --------------------------------------------------------------------------


def bar_duration_faults(score: Score) -> list[dict]:
    """
    Per bar, per voice: the sum of written durations against the time signature.

    `<backup>` needs no arithmetic here because summing **per voice** is what
    backup exists to allow; `<forward>` is a written gap and is added to its
    own voice. Grace notes take no time and a `<chord>` note sounds with the
    one before it, so neither is counted — the same two exclusions
    `truncation_scan.py` makes.

    Excused, because each is ordinary notation rather than a fault:

    * a pickup — the first bar, or any bar marked `implicit="yes"`;
    * the bar that *completes* the pickup, whose shortfall equals the pickup's;
    * a bar split across a system or a repeat, which MuseScore numbers `7X1`
      and whose two halves sum to a full bar;
    * a whole-measure rest, which is written as a whole note whatever the metre.
    """
    faults: list[dict] = []
    for part in score.parts:
        bars = part.bars
        if not bars:
            continue
        # The pickup's own length. A bar that *completes* it holds
        # `full - pickup`, so the two sum to a full bar.
        pickup = Fraction(0)
        first = bars[0]
        if first.expected > 0 and first.voice_lengths:
            reached = max(first.voice_lengths.values())
            if reached < first.expected:
                pickup = Fraction(reached)
        for position, bar in enumerate(bars):
            expected = bar.expected
            if expected <= 0 or not bar.voice_lengths:
                continue
            if bar.implicit or position == 0:
                continue
            if all(n.whole_measure_rest for n in bar.notes if not n.grace and not n.chord) and bar.notes:
                continue
            split = re.fullmatch(r"\d+[Xx]\d+", bar.number) is not None
            neighbours = [bars[position - 1], bars[position + 1]] if position + 1 < len(bars) else [bars[position - 1]]
            # A division or two either way is the converter's rounding, not a
            # wrong bar: `chopin-polonaise-op53` holds 30241 of 30240 in bar 46
            # and music21 itself calls that bar overfull. A 256th note at this
            # file's `divisions` is far larger, so nothing audible hides here.
            slack = max(1, bar.divisions // 64)
            # Only the longest voice says whether the *bar* is short. An inner
            # voice that enters mid-bar is written shorter than the bar and is
            # ordinary notation — judging every voice reported six such bars in
            # `mozart-k545-i` alone (sample of sixty, 2026-09-21).
            longest = max(bar.voice_lengths.values())
            for voice, length in sorted(bar.voice_lengths.items()):
                if abs(length - expected) <= slack:
                    continue
                if length > expected:
                    faults.append(
                        {
                            "bar": bar.number,
                            "part": part.id,
                            "voice": voice,
                            "held": float(length),
                            "expected": float(expected),
                            "beats": round(float(length) * bar.beat_type / (4 * bar.divisions), 3)
                            if bar.divisions
                            else None,
                            "metre": f"{bar.beats}/{bar.beat_type}",
                            "kind": "overfull",
                        }
                    )
                    continue
                # underfull
                if length != longest:
                    continue
                if pickup and length + pickup == expected:
                    continue
                if split:
                    continue
                if any(
                    n.voice_lengths.get(voice, 0) + length == expected for n in neighbours
                ):
                    continue
                if position == len(bars) - 1:
                    continue  # the last bar is the truncation check's business
                faults.append(
                    {
                        "bar": bar.number,
                        "part": part.id,
                        "voice": voice,
                        "held": float(length),
                        "expected": float(expected),
                        "beats": round(float(length) * bar.beat_type / (4 * bar.divisions), 3)
                        if bar.divisions
                        else None,
                        "metre": f"{bar.beats}/{bar.beat_type}",
                        "kind": "underfull",
                    }
                )
    return faults


def check_bar_duration(row: dict, score: Score) -> list[Flag]:
    faults = bar_duration_faults(score)
    if not faults:
        return []
    over = [f for f in faults if f["kind"] == "overfull"]
    worst = over[0] if over else faults[0]
    return [
        Flag(
            row["id"],
            row.get("title") or "",
            "bar-duration",
            "high" if over else "medium",
            {"faults": len(faults), "overfull": len(over), "first": worst, "bars": sorted({f["bar"] for f in faults})[:12]},
            f"{len(faults)} bar/voice sum(s) disagree with the metre; bar "
            f"{worst['bar']} voice {worst['voice']} holds {worst['beats']} beats "
            f"in {worst['metre']}",
            kind="overfull" if over else "underfull",
        )
    ]


# --------------------------------------------------------------------------
# 5. containment and duplication
# --------------------------------------------------------------------------


def bar_fingerprints(score: Score) -> list[tuple]:
    """
    One fingerprint per bar: the pitch classes in it and the durations in it.

    Durations are fractions of a quarter note, so two uploads of the same piece
    with different `<divisions>` fingerprint alike. Pitch classes rather than
    pitches, so an octave transposition still matches; sorted, so voice and
    stem order do not.

    **Staff is deliberately not part of the fingerprint.** A grand staff is
    written as one part with `<staves>2` by some uploaders and as two parts by
    others, and keying on staff made those two encodings of the same minuet
    share *no* bars at all (measured 2026-09-21 on `Minuet in G minor`, 0 of 13).
    Merging the bar loses the hand a note is in, which is a real loss of
    discrimination and the reason `CONTAINMENT_RATIO` is not lower.
    """
    if not score.parts:
        return []
    length = max(len(p.bars) for p in score.parts)
    out: list[tuple] = []
    for i in range(length):
        pitches: list[int] = []
        durations: list[Fraction] = []
        for part in score.parts:
            if i >= len(part.bars):
                continue
            bar = part.bars[i]
            if bar.divisions <= 0:
                continue
            for note in bar.notes:
                if note.grace:
                    continue
                if note.pitch_class is not None:
                    pitches.append(note.pitch_class)
                if not note.chord:
                    durations.append(Fraction(note.duration, bar.divisions))
        out.append((tuple(sorted(pitches)), tuple(sorted(durations))))
    return out


def longest_run(long: list, short: list) -> int:
    """The longest stretch of `short` that appears unbroken inside `long`."""
    best = 0
    index: dict = defaultdict(list)
    for i, f in enumerate(long):
        index[f].append(i)
    for start in range(len(short)):
        for offset in index.get(short[start], ()):
            run = 0
            while (
                start + run < len(short)
                and offset + run < len(long)
                and short[start + run] == long[offset + run]
            ):
                run += 1
            best = max(best, run)
    return best


def containment_flags(
    prints: dict[str, list[tuple]],
    titles: dict[str, str],
    variants: dict[str, str] | None = None,
) -> list[Flag]:
    """
    Pairs where one item's bars are (nearly) all inside another's.

    An inverted index keeps this off the 320,000 pairs a corpus this size would
    otherwise need: a bar that appears in more than `COMMON_BAR_ITEMS` items is
    a common figure (an empty bar, a held tonic) and carries no evidence, so it
    is not indexed at all.

    A pair the catalog already *declares* to be the same music — `variantOf`,
    which is how `chopin-prelude-op28-4.alt` and `mozart-rondo-alla-turca.
    fingered` are related to their originals — is not a finding, and is
    dropped. Two generated exercises matching is reported at `low`: the
    families are built to share material across keys and hands, so
    `hanon.12.left` matching `hanon.12.right` is the generator working.
    """
    variants = variants or {}

    def declared(a: str, b: str) -> bool:
        return variants.get(a) == b or variants.get(b) == a or (
            variants.get(a) is not None and variants.get(a) == variants.get(b)
        )

    usable = {k: v for k, v in prints.items() if len(v) >= CONTAINMENT_MIN_BARS}
    where: dict[tuple, set[str]] = defaultdict(set)
    for item, bars in usable.items():
        for fingerprint in set(bars):
            where[fingerprint].add(item)
    shared: dict[tuple[str, str], int] = Counter()
    for fingerprint, items in where.items():
        if len(items) > COMMON_BAR_ITEMS or len(items) < 2:
            continue
        ordered = sorted(items)
        for i, a in enumerate(ordered):
            for b in ordered[i + 1 :]:
                shared[(a, b)] += 1

    flags: list[Flag] = []
    for (a, b), count in sorted(shared.items()):
        if declared(a, b):
            continue
        first, second = usable[a], usable[b]
        small, large = (a, b) if len(first) <= len(second) else (b, a)
        small_bars, large_bars = usable[small], usable[large]
        distinct_small = len(set(small_bars))
        if distinct_small == 0:
            continue
        ratio = count / distinct_small
        if ratio < CONTAINMENT_RATIO:
            continue
        run = longest_run(large_bars, small_bars)
        same_length = abs(len(small_bars) - len(large_bars)) <= max(2, len(large_bars) * 0.1)
        generated_pair = small.startswith("exercise.") and large.startswith("exercise.")
        flags.append(
            Flag(
                small,
                titles.get(small, ""),
                "containment",
                "low"
                if generated_pair
                else "high"
                if ratio >= 0.95 and same_length
                else "medium",
                {
                    "other": large,
                    "otherTitle": titles.get(large, ""),
                    "sharedBars": count,
                    "barsHere": len(small_bars),
                    "barsThere": len(large_bars),
                    "ratio": round(ratio, 3),
                    "longestRun": run,
                },
                (
                    f"the same piece as {large} ({titles.get(large, '')}): "
                    if same_length
                    else f"its bars sit inside {large} ({titles.get(large, '')}): "
                )
                + f"{count} of {distinct_small} distinct bars match, longest unbroken run {run}",
                kind=large,
            )
        )
    return flags


# --------------------------------------------------------------------------
# 6. title against structure
# --------------------------------------------------------------------------

ORDINALS = {
    "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5,
    "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5,
}

MULTI_TITLE = re.compile(
    r"\b("
    r"(?:first|second|third|fourth|fifth)\s*(?:,|and|&|-|–)\s*(?:first|second|third|fourth|fifth)"
    r"|movements"
    r"|nos?\.?\s*\d+\s*(?:,|and|&|-|–)\s*\d+"
    r"|complete\s+(?:sonata|suite|set)"
    r")\b",
    re.IGNORECASE,
)

TEMPO_WORDS = re.compile(
    r"\b(allegro|allegretto|andante|andantino|adagio|largo|larghetto|lento|presto|"
    r"prestissimo|vivace|moderato|grave|menuetto|minuetto|trio|rondo|rondeau|scherzo|"
    r"finale|tempo\s+di)\b",
    re.IGNORECASE,
)


def structure_sections(score: Score) -> dict:
    """A heuristic count of the movement-sized joins a file contains."""
    bars = score.parts[0].bars if score.parts else []
    tempo_changes = 0
    last_tempo = None
    for bar in bars:
        if bar.tempo and bar.tempo != last_tempo:
            if last_tempo is not None:
                tempo_changes += 1
            last_tempo = bar.tempo
    key_changes = max(0, len(score.keys()) - 1)
    time_changes = sum(1 for bar in bars if bar.time_changed)
    headings = len({w.lower() for w in score.words if TEMPO_WORDS.search(w)})
    joins = max(tempo_changes, key_changes, time_changes, max(0, headings - 1))
    return {
        "tempoChanges": tempo_changes,
        "keyChanges": key_changes,
        "timeChanges": time_changes,
        "tempoHeadings": headings,
        "sections": joins + 1,
    }


def check_title_structure(row: dict, score: Score) -> list[Flag]:
    title = row.get("title") or ""
    match = MULTI_TITLE.search(title)
    if not match:
        return []
    words = normalise_title(match.group(0)).split()
    numbers = [ORDINALS[w] for w in words if w in ORDINALS] + [int(w) for w in words if w.isdigit()]
    # Every phrase the pattern matches names at least two movements or parts —
    # "second and third", "movements", "Nos. 1 and 2". It does not say *which*
    # two, so the claim is "two or more", not a count.
    claimed = 2
    facts = structure_sections(score)
    if facts["sections"] >= claimed:
        return []
    return [
        Flag(
            row["id"],
            title,
            "title-structure",
            "low",
            {"titleClaims": claimed, **facts, "bars": score.bar_count},
            f"the title names {claimed} movements or parts; the file has "
            f"{facts['sections']} section(s) by tempo, key and metre "
            f"({facts['tempoChanges']} tempo, {facts['keyChanges']} key, "
            f"{facts['timeChanges']} metre change(s), {facts['tempoHeadings']} tempo heading(s)) "
            f"over {score.bar_count} bars — heuristic, read the file before acting",
            kind="movements",
        )
    ]


# --------------------------------------------------------------------------
# 7. repeat structure
# --------------------------------------------------------------------------


def ending_numbers(text: str) -> list[int]:
    return [int(n) for n in re.findall(r"\d+", text or "")]


def repeat_faults(score: Score) -> list[dict]:
    """Unpaired repeats, endings out of order, a repeat inside a later ending."""
    faults: list[dict] = []
    for part in score.parts:
        open_forward: list[str] = []
        spans: list[dict] = []  # ending spans, in the order they open
        current: dict | None = None
        seen_numbers: list[int] = []
        for bar in part.bars:
            # Endings first, then repeats: a `<barline>` that closes an ending
            # and carries a backward repeat writes both on the same bar, and
            # the repeat belongs to the ending that bar just closed.
            for number_text, kind in bar.endings:
                numbers = ending_numbers(number_text)
                if kind == "start":
                    current = {
                        "numbers": numbers,
                        "from": bar.number,
                        "fromIndex": bar.index,
                        "repeats": 0,
                    }
                    spans.append(current)
                    seen_numbers.append(min(numbers) if numbers else 0)
                elif current is not None:
                    current["to"] = bar.number
                    current["toIndex"] = bar.index
                    current = None
            for _, direction in bar.repeats:
                if direction == "forward":
                    open_forward.append(bar.number)
                elif direction == "backward":
                    if open_forward:
                        open_forward.pop()
                    # Which ending does this repeat close? The one that opened
                    # most recently, if the repeat is inside it or on the bar
                    # right after it. Two habits have to fit: Só Danço Samba
                    # writes `ending stop` on bar 14 and the backward repeat on
                    # bar 15, and the Gymnopédie's first ending runs eight bars
                    # (32 to 39) with the repeat on its last bar — so a fixed
                    # window of a bar or two reports the second as a fault.
                    if spans and (
                        "toIndex" not in spans[-1]
                        or bar.index - spans[-1]["toIndex"] <= 1
                    ):
                        spans[-1]["repeats"] += 1
        for bar_number in open_forward:
            faults.append({"kind": "unpaired-forward-repeat", "bar": bar_number, "part": part.id})
        # Endings run 1, 2, 3… and start again at 1 at the next repeated
        # section, so "sorted" is the wrong test: a piece with three repeated
        # strains reads 1,2,1,2,1,2 and is correct. What is wrong is a number
        # that neither restarts nor follows the one before it — `1, 3` means a
        # second-time bar is missing.
        previous = 0
        for number in seen_numbers:
            if number != 1 and number != previous + 1:
                faults.append(
                    {"kind": "endings-out-of-order", "order": seen_numbers, "part": part.id}
                )
                break
            previous = number
        for span in spans:
            if span["repeats"] and span["numbers"] and min(span["numbers"]) > 1:
                faults.append(
                    {
                        "kind": "backward-repeat-in-later-ending",
                        "ending": span["numbers"],
                        "bar": span.get("to") or span["from"],
                        "part": part.id,
                    }
                )
        if spans and spans[0]["numbers"] and min(spans[0]["numbers"]) == 1 and not spans[0]["repeats"]:
            faults.append({"kind": "first-ending-without-repeat", "bar": spans[0].get("to") or spans[0]["from"], "part": part.id})
    return faults


def check_repeat_structure(row: dict, score: Score) -> list[Flag]:
    faults = repeat_faults(score)
    if not faults:
        return []
    kinds = sorted({f["kind"] for f in faults})
    severe = {"backward-repeat-in-later-ending", "endings-out-of-order"}
    return [
        Flag(
            row["id"],
            row.get("title") or "",
            "repeat-structure",
            "high" if severe & set(kinds) else "medium",
            {"faults": faults[:6], "count": len(faults), "kinds": kinds},
            "; ".join(
                f"{f['kind']} at bar {f.get('bar', '?')}"
                if "bar" in f
                else f"{f['kind']} {f.get('order')}"
                for f in faults[:3]
            ),
            kind=kinds[0],
        )
    ]


# --------------------------------------------------------------------------
# Thresholds. Every number here was measured; `--stats` prints the measurement.
# --------------------------------------------------------------------------

#: Grace notes as a share of all notes. Measured 2026-09-21 by `--stats` over
#: the 1,975 built scores: 1,731 files have no grace note at all; of the 244
#: that do, the median share is 0.008, the 90th percentile 0.036, the 99th
#: 0.114, and the maximum 0.537 — which is `joyful-joyful`, the known fault.
#: 0.25 sits between the 99th percentile and that file. Where exactly to put it
#: in that gap is a judgement; 0.25 means one note in four has to be an
#: ornament before anyone is asked to look.
GRACE_SHARE_LIMIT = 0.25

#: …and not on a file with three notes in it.
GRACE_COUNT_FLOOR = 4

#: music21's `correlationCoefficient` above which a key disagreement is worth a
#: medium rather than a low. Measured 2026-09-21 by `--stats` over the 1,974
#: files music21 read: the 10th percentile is 0.647, the median 0.838 and the
#: 90th percentile 0.924. 0.80 sits just under the median, so "sure and
#: disagreeing" means better than half the corpus's analyses.
ANALYSIS_CONFIDENT = 0.80

#: Below this many bars a pitch-class analysis is reading a figure, not a
#: piece. Measured 2026-09-21: the median generated exercise is 4 bars and its
#: 90th percentile is 8, while the 10th percentile of the songs is 16 — so 8
#: is where "an exercise's chord loop" ends and "something with a key" begins.
KEY_ANALYSIS_MIN_BARS = 8

#: A file is called truncated below this share of the median bar count of the
#: verified copies of the same work. Measured 2026-09-21 by `--stats`: of 533
#: pdmx items, 281 have at least one copy that shares their bars, and the ratio
#: of built bars to the copies' median is **1.00 at the 5th, 50th and 95th
#: percentile** — editions of the same work that share bars agree on length
#: almost exactly. So the distribution does not itself place a cut: it says
#: anything below 1.00 is already unusual. 0.75 is a judgement placed between
#: that and the one known truncation (`minuet-in-g-minor-bach-piano`, 16 of 32
#: bars, ratio 0.50), left slack rather than tight because an edition that
#: drops a da capo is not a fault.
TRUNCATION_RATIO = 0.75

#: How many archive copies to reread per work, and how long a title has to be
#: before it is specific enough to match on. `in g` would match half the
#: archive; twelve characters is about "minuet in g".
ARCHIVE_COPY_LIMIT = 12
ARCHIVE_KEY_MIN_CHARS = 12

#: The share of the item's own distinct bars that must also appear in an
#: archive copy before that copy counts as the same work. A judgement: a
#: truncated file holds *some* of the work, so this has to be well under half;
#: 0.25 keeps the Minuet in G minor matched to its full-length copy (measured
#: 2026-09-21) while dropping the Clementi that shares a title with Mozart's
#: K. 1f and no bars at all.
ARCHIVE_SHARE_MIN = 0.25

#: Containment. Fewer than eight bars is a fragment and two fragments match by
#: accident; a bar that turns up in more than twenty items is a common figure
#: and carries no evidence. The ratio is a judgement: 0.80 catches K. 1f inside
#: K. 1e (16 of 18 distinct bars) with room for one upload's ornament.
CONTAINMENT_MIN_BARS = 8
COMMON_BAR_ITEMS = 20
CONTAINMENT_RATIO = 0.80

#: Tempo floors per metre are computed from the corpus at run time rather than
#: pinned here, because they are a per-metre distribution rather than one
#: number: see `tempo_floors`.
TEMPO_FLOOR_PERCENTILE = 0.02
TEMPO_FLOOR_MIN_SAMPLES = 40


def tempo_floors(tempos_by_metre: dict[str, list[float]]) -> dict[str, float]:
    """
    The quarter-BPM below which a tempo is unlike anything else in that metre.

    The 2nd percentile of the metre's own distribution, and only for a metre
    with enough files to have a distribution at all. A floor is not invented
    for a metre seen four times.
    """
    floors: dict[str, float] = {}
    for metre, values in tempos_by_metre.items():
        if len(values) < TEMPO_FLOOR_MIN_SAMPLES:
            continue
        ordered = sorted(values)
        cut = ordered[max(0, int(len(ordered) * TEMPO_FLOOR_PERCENTILE) - 1)]
        floors[metre] = cut
    return floors


# --------------------------------------------------------------------------
# Running the lot
# --------------------------------------------------------------------------


def load_catalog() -> list[dict]:
    return json.loads(CATALOG.read_text(encoding="utf-8"))


def scored_rows(catalog: list[dict]) -> list[dict]:
    out = []
    for row in catalog:
        rel = row.get("file")
        if not rel:
            continue
        if (CONTENT / rel).exists():
            out.append(row)
    return out


def analyse_key(path: Path) -> dict | None:
    """music21's pitch-class key analysis. Imported here: it is the slow part."""
    try:
        from music21 import converter  # noqa: PLC0415
    except ImportError:
        return None
    try:
        stream = converter.parse(str(path))
        key = stream.analyze("key")
    except Exception:  # noqa: BLE001 - a file music21 will not read is data
        return None
    try:
        correlation = float(key.correlationCoefficient)
    except Exception:  # noqa: BLE001
        correlation = None
    return {
        "tonicPc": key.tonic.pitchClass,
        "mode": key.mode,
        "correlation": correlation,
    }


def load_cache() -> dict:
    if ANALYSIS_CACHE.exists():
        try:
            return json.loads(ANALYSIS_CACHE.read_text(encoding="utf-8"))
        except ValueError:
            return {}
    return {}


def run(rows: list[dict], *, only: set[str], analysis: bool, verbose: bool) -> tuple[list[Flag], dict]:
    index = ArchiveIndex.load() if "truncation" in only else ArchiveIndex()
    cache = load_cache() if analysis else {}
    fresh: dict = {}

    flags: list[Flag] = []
    prints: dict[str, list[tuple]] = {}
    titles: dict[str, str] = {}
    tempos_by_metre: dict[str, list[float]] = defaultdict(list)
    scores: dict[str, Score] = {}
    stats: dict = {
        "items": 0,
        "unreadable": [],
        "graceShares": [],
        "correlations": [],
        "archiveRatios": [],
        "withArchiveCopies": 0,
        "pdmxItems": 0,
    }

    # One read of every file, because the tempo floors need the whole corpus
    # before the per-item checks can use them.
    for row in rows:
        path = CONTENT / row["file"]
        text = read_musicxml(path)
        if text is None:
            stats["unreadable"].append(row["id"])
            continue
        score = read_score(text)
        if score.parse_error:
            stats["unreadable"].append(row["id"])
            continue
        scores[row["id"]] = score
        titles[row["id"]] = row.get("title") or ""
        stats["items"] += 1
        graces, total, share = grace_share(score)
        if total:
            stats["graceShares"].append(share)
        metre = score.first_time()
        tempos = score.tempos()
        if metre and tempos:
            tempos_by_metre[metre].append(tempos[0])
        if {"containment", "truncation"} & only:
            prints[row["id"]] = bar_fingerprints(score)
        if verbose and stats["items"] % 250 == 0:
            print(f"  read {stats['items']} files", file=sys.stderr)

    floors = tempo_floors(tempos_by_metre)
    stats["tempoFloors"] = {k: round(v, 1) for k, v in sorted(floors.items())}
    stats["tempoCounts"] = {k: len(v) for k, v in sorted(tempos_by_metre.items())}

    done = 0
    for row in rows:
        score = scores.get(row["id"])
        if score is None:
            continue
        done += 1
        if verbose and done % 250 == 0:
            print(f"  checked {done} files", file=sys.stderr)
        if "key-consistency" in only:
            found = None
            if analysis:
                path = CONTENT / row["file"]
                stat = path.stat()
                token = f"{stat.st_size}:{int(stat.st_mtime)}"
                cached = cache.get(row["file"])
                if isinstance(cached, dict) and cached.get("token") == token:
                    found = cached.get("analysis")
                else:
                    found = analyse_key(path)
                    cached = {"token": token, "analysis": found}
                fresh[row["file"]] = cached
                if found and found.get("correlation") is not None:
                    stats["correlations"].append(found["correlation"])
            flags.extend(check_key_consistency(row, score, found))
        if "grace-density" in only:
            flags.extend(check_grace_density(row, score, floors))
        if "bar-duration" in only:
            flags.extend(check_bar_duration(row, score))
        if "title-structure" in only:
            flags.extend(check_title_structure(row, score))
        if "repeat-structure" in only:
            flags.extend(check_repeat_structure(row, score))

    if "truncation" in only:
        # After the first pass, because a copy of a work is as likely to be
        # another catalog item as an archive file: the full-length *Minuet in G
        # minor* is in the catalog (`petzold-…`) and is **not** among the 37,261
        # unpacked archive scores, so an archive-only comparison cannot see that
        # the other copy of it holds sixteen bars of thirty-two.
        by_work: dict[str, list[str]] = defaultdict(list)
        for row in rows:
            if row["id"] in scores:
                key = work_key(row.get("title") or "")
                if len(key) >= ARCHIVE_KEY_MIN_CHARS:
                    by_work[key].append(row["id"])
        for row in rows:
            score = scores.get(row["id"])
            if score is None:
                continue
            rel = row.get("file") or ""
            mine = prints.get(row["id"], [])
            unique = set(mine)
            counts: dict[str, tuple[int, int]] = {}
            by_composer = False
            for sibling in by_work.get(work_key(row.get("title") or ""), ()):
                if sibling == row["id"]:
                    continue
                theirs = prints.get(sibling, [])
                if unique and len(unique & set(theirs)) >= len(unique) * ARCHIVE_SHARE_MIN:
                    counts[sibling] = (scores[sibling].bar_count, longest_run(theirs, mine))
            if rel.startswith("scores/pdmx/") and index.rows:
                stats["pdmxItems"] += 1
                cids, by_composer = index.copies(
                    row.get("title") or "", row.get("composer"), exclude=Path(rel).stem
                )
                counts.update(archive_bar_counts(index, cids, mine))
            if counts:
                stats["withArchiveCopies"] += 1
                median = statistics.median([b for b, _ in counts.values()])
                if median:
                    stats["archiveRatios"].append(score.bar_count / median)
            flags.extend(check_truncation(row, score, counts, by_composer))

    if "containment" in only:
        variants = {
            row["id"]: row["variantOf"]
            for row in rows
            if row.get("variantOf") and row["id"] in prints
        }
        flags.extend(containment_flags(prints, titles, variants))

    if analysis and fresh:
        ANALYSIS_CACHE.parent.mkdir(parents=True, exist_ok=True)
        ANALYSIS_CACHE.write_text(json.dumps(fresh, indent=1, sort_keys=True), encoding="utf-8")

    return flags, stats


def percentile(values: list[float], share: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    return ordered[max(0, min(len(ordered) - 1, int(len(ordered) * share)))]


def print_stats(stats: dict) -> None:
    print(f"items read: {stats['items']}  unreadable: {len(stats['unreadable'])}")
    shares = [s for s in stats["graceShares"] if s > 0]
    print(f"grace share: {len(stats['graceShares']) - len(shares)} files with none, "
          f"{len(shares)} with some")
    if shares:
        print(f"  of those with some: median {percentile(shares, 0.5):.3f} "
              f"p90 {percentile(shares, 0.90):.3f} p99 {percentile(shares, 0.99):.3f} "
              f"max {max(shares):.3f}")
    corr = stats["correlations"]
    if corr:
        print(f"key analysis correlation: n {len(corr)} p10 {percentile(corr, 0.10):.3f} "
              f"median {percentile(corr, 0.5):.3f} p90 {percentile(corr, 0.90):.3f}")
    ratios = stats["archiveRatios"]
    print(f"pdmx items: {stats['pdmxItems']}  with an archive copy of the same title: "
          f"{stats['withArchiveCopies']}")
    if ratios:
        print(f"  built bars / archive median: p05 {percentile(ratios, 0.05):.2f} "
              f"median {percentile(ratios, 0.5):.2f} p95 {percentile(ratios, 0.95):.2f}")
    print("tempo floors (2nd percentile of the metre's own distribution):")
    for metre, floor in stats["tempoFloors"].items():
        print(f"  {metre:>6}  n {stats['tempoCounts'][metre]:>5}  floor {floor}")
    thin = {m: n for m, n in stats["tempoCounts"].items() if m not in stats["tempoFloors"]}
    if thin:
        print(f"  no floor (fewer than {TEMPO_FLOOR_MIN_SAMPLES} files): {thin}")


def load_fixes() -> dict[str, str]:
    if not FIXES.exists():
        return {}
    try:
        data = json.loads(FIXES.read_text(encoding="utf-8"))
    except ValueError:
        return {}
    return {k: v for k, v in data.items() if isinstance(v, str)}


def number_text(numbers: dict) -> str:
    """The measured numbers on one line, for the report's third column."""
    parts = []
    for key, value in numbers.items():
        if isinstance(value, dict):
            value = " ".join(f"{k}={v}" for k, v in value.items())
        elif isinstance(value, list):
            value = ",".join(str(v) for v in value)
        parts.append(f"{key}={value}")
    return "; ".join(parts)


def write_reports(flags: list[Flag], stats: dict, only: set[str]) -> None:
    REPORT_JSON.parent.mkdir(parents=True, exist_ok=True)
    order = {s: i for i, s in enumerate(SEVERITIES)}
    rows = sorted(flags, key=lambda f: (order.get(f.severity, 9), f.check, f.item))
    REPORT_JSON.write_text(
        json.dumps(
            {
                "generatedFrom": "tools/content/score_checks.py",
                "itemsRead": stats["items"],
                "unreadable": stats["unreadable"],
                "checksRun": sorted(only),
                "flags": [f.as_row() for f in rows],
            },
            indent=1,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    per_check: dict[str, list[Flag]] = defaultdict(list)
    for flag in rows:
        per_check[flag.check].append(flag)

    lines: list[str] = []
    lines.append("# Score checks")
    lines.append("")
    lines.append(
        f"{len(rows)} flag(s) over {stats['items']} score file(s), "
        f"{len(stats['unreadable'])} unreadable. Checks run: "
        + ", ".join(sorted(only))
        + "."
    )
    lines.append("")
    lines.append(
        "Written by `tools/content/score_checks.py`. Nothing here has been heard; every "
        "line is about what the file says. **Do not apply these; a second reader does, "
        "from this list.**"
    )
    lines.append("")
    lines.append("| check | flags | high | medium | low |")
    lines.append("|---|---:|---:|---:|---:|")
    for check in sorted(per_check, key=lambda c: -len(per_check[c])):
        group = per_check[check]
        lines.append(
            f"| {check} | {len(group)} | "
            f"{sum(1 for f in group if f.severity == 'high')} | "
            f"{sum(1 for f in group if f.severity == 'medium')} | "
            f"{sum(1 for f in group if f.severity == 'low')} |"
        )
    lines.append("")
    fixes = load_fixes()
    unfixed = sum(1 for f in rows if f.key() not in fixes)
    lines.append(
        f"Each row is `item | check | the numbers | proposed fix`. {len(rows) - unfixed} of "
        f"{len(rows)} row(s) carry a proposed fix, read from "
        f"`{FIXES.name}`; a row without one says so."
    )
    lines.append("")

    for check in sorted(per_check, key=lambda c: -len(per_check[c])):
        lines.append(f"## {check}")
        lines.append("")
        lines.append("```")
        for flag in per_check[check]:
            fix = fixes.get(flag.key())
            lines.append(
                f"{flag.item} | {flag.check} ({flag.severity}) | {number_text(flag.numbers)} | "
                + (fix if fix else f"NO FIX PROPOSED — {flag.why}")
            )
        lines.append("```")
        lines.append("")

    REPORT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--only", nargs="*", choices=CHECKS, help="run only these checks")
    parser.add_argument("--item", nargs="*", help="run only these catalog ids")
    parser.add_argument("--stats", action="store_true", help="print the corpus distributions and stop")
    parser.add_argument("--no-analysis", action="store_true", help="skip the music21 key analysis")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    only = set(args.only) if args.only else set(CHECKS)
    rows = scored_rows(load_catalog())
    if args.item:
        wanted = set(args.item)
        rows = [r for r in rows if r["id"] in wanted]
        missing = wanted - {r["id"] for r in rows}
        for item in sorted(missing):
            print(f"{item}: not in the catalog, or has no file on disk", file=sys.stderr)

    flags, stats = run(rows, only=only, analysis=not args.no_analysis, verbose=not args.quiet)

    if args.stats:
        print_stats(stats)
        return 0

    write_reports(flags, stats, only)
    per_check = Counter(f.check for f in flags)
    print(f"{len(flags)} flag(s) over {stats['items']} file(s)")
    for check in sorted(CHECKS):
        if check in only:
            print(f"  {check:<18} {per_check.get(check, 0)}")
    print(f"wrote {REPORT_JSON.relative_to(ROOT)} and {REPORT_MD.relative_to(ROOT)}")
    # A report, never a gate. `validate.py` stays the thing that fails a build;
    # a check that guesses (title-structure) or that a whole genre of ordinary
    # notation can trip must not be able to stop one. The brief asked for it to
    # be added to `build.py` only if that were cheap, and it is not: the music21
    # pass is minutes, so this stays standalone and is run on its own.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
