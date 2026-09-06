#!/usr/bin/env python3
"""
Turns the [KERN] tier — craigsapp's Humdrum editions — into catalog entries.

docs/03-content-pipeline.md §2 lists eight `craigsapp/*` repositories. P4 could
not use any of them: they are CC BY-NC-SA, and §1 rule 1 forbids redistributing
a non-commercial edition. The owner's amendment of 2026-09-05 (`docs/00` D10a)
re-opens five of them for his own build only, which is what `--allow-nc` means
here.

Three of the eight stay shut whatever the flag says. `beethoven-piano-sonatas`,
`chopin-mazurkas` and `chopin-preludes` carry no LICENSE file at all — the
Chopin preludes go as far as a bare `!!!YEC: Copyright … by Craig Stuart Sapp`
inside each file, which is a claim rather than a grant. `--allow-nc` relaxes
non-commercial; it does not invent permission where none was given. The gate
below refuses them, and `assert_excluded()` re-proves it on every run rather
than leaving it to a table nobody re-reads.

Two builds, one table
---------------------
Without `--allow-nc` every row still produces a catalog item — an **import
placeholder** with no file, the licence that stopped it, and `alternatives`
pointing at scores that are present. That is what keeps a public build honest
(it ships no NC bytes) without breaking the curriculum, which names these ids
whichever way the build was run.

Nothing in `content/sources/kern.json` is trusted. The repository licence, the
file's own `!!!YEM`/`!!!YEC` rights records and the `!!!ODT`/`!!!PDT`
publication year are all re-read from disk, and a row whose stated
`publishedYear` disagrees with the file is excluded rather than quietly
believed.

Usage:
    python3 tools/content/import_kern.py --out build/content --catalog build/catalog.kern.json
    python3 tools/content/import_kern.py --out build/content --catalog build/catalog.kern.json --allow-nc
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import CONTENT_SRC, IMPORTED_DIR, SourceBlock, catalog_item, read_json, sha256_file, utc_now, write_json  # noqa: E402
from licensing import (  # noqa: E402
    NC_PERSONAL_TAG,
    LicenseDecision,
    Verdict,
    composition_verdict,
    kern_reference_records,
    license_verdict,
    normalise_license,
    repo_license_text,
)

TABLE_PATH = CONTENT_SRC / "sources" / "kern.json"
KERN_DIR = IMPORTED_DIR / "kern"

#: What a placeholder tells the owner to do instead. The Sapp editions are a
#: `git clone` away on any machine, so this is a real instruction, not a shrug.
IMPORT_HINT = (
    "Not bundled in a redistributable build: the Humdrum edition is CC BY-NC-SA. "
    "Clone https://github.com/craigsapp/{repo} and build with --allow-nc, or import "
    "your own copy of the score."
)


class ExcludedRepositoryError(RuntimeError):
    """A repository that must stay excluded got past the licence gate."""


@dataclass
class ImportReport:
    imported: list[str] = field(default_factory=list)
    placeheld: list[tuple[str, str]] = field(default_factory=list)
    excluded: list[tuple[str, str]] = field(default_factory=list)
    missing: list[str] = field(default_factory=list)
    guarded: list[tuple[str, str]] = field(default_factory=list)
    unchecked: list[str] = field(default_factory=list)
    #: Works present in a surveyed repository that no group in the table claims.
    uncovered: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# reading a Humdrum file
# ---------------------------------------------------------------------------

_YEAR_RE = re.compile(r"\b(1[5-9]\d{2}|20\d{2})\b")
_KEYSIG_RE = re.compile(r"^\*k\[([^\]]*)\]", re.M)
_MODE_RE = re.compile(r"^\*([A-Ga-g])([#-]?):", re.M)
_TIMESIG_RE = re.compile(r"^\*M(\d+)/(\d+)", re.M)
_TEMPO_RE = re.compile(r"^\*MM(\d+(?:\.\d+)?)", re.M)

SHARP_KEYS = ["C", "G", "D", "A", "E", "B", "F#", "C#"]
FLAT_KEYS = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"]
SHARP_MINORS = ["a", "e", "b", "f#", "c#", "g#", "d#", "a#"]
FLAT_MINORS = ["a", "d", "g", "c", "f", "bb", "eb", "ab"]


def publication_year(records: dict[str, str]) -> int | None:
    """
    The year the *composition* was published, from the Humdrum records.

    `!!!ODT` is the date of the original work and `!!!PDT` the date of the
    publication the edition was made from; either answers docs/03 §1 rule 1.
    `!!!CDT` is deliberately not consulted — it is the composer's dates, and
    reading a birth year as a publication year would pass things that should
    not pass. Approximate dates ("~1905") count: the tolerance either side is
    years, and the cutoff is 1930.
    """
    for tag in ("ODT", "PDT"):
        match = _YEAR_RE.search(records.get(tag, ""))
        if match:
            return int(match.group(1))
    return None


def key_name(fifths: int, mode: str) -> str:
    table = (SHARP_MINORS if fifths >= 0 else FLAT_MINORS) if mode == "minor" else (SHARP_KEYS if fifths >= 0 else FLAT_KEYS)
    name = table[min(abs(fifths), 7)]
    return f"{name} minor" if mode == "minor" else f"{name} major"


TITLE_SHARP_KEYS = ["C", "G", "D", "A", "E", "B", "F-sharp", "C-sharp"]
TITLE_FLAT_KEYS = ["C", "F", "B-flat", "E-flat", "A-flat", "D-flat", "G-flat", "C-flat"]
TITLE_SHARP_MINORS = ["A", "E", "B", "F-sharp", "C-sharp", "G-sharp", "D-sharp", "A-sharp"]
TITLE_FLAT_MINORS = ["A", "D", "G", "C", "F", "B-flat", "E-flat", "A-flat"]


def title_key(fifths: int, mode: str) -> str:
    """
    The key as a title says it: "E-flat major", "F-sharp minor".

    `key_name` above spells the same thing for the catalog's `keySig` field,
    which follows the chord-symbol convention (`Bb`, and lower case for minor).
    A title is prose and wants neither.
    """
    if mode == "minor":
        table = TITLE_SHARP_MINORS if fifths >= 0 else TITLE_FLAT_MINORS
        return f"{table[min(abs(fifths), 7)]} minor"
    table = TITLE_SHARP_KEYS if fifths >= 0 else TITLE_FLAT_KEYS
    return f"{table[min(abs(fifths), 7)]} major"


#: Pitch class of each `**kern` letter, before its accidentals.
_KERN_STEP = {"c": 0, "d": 2, "e": 4, "f": 5, "g": 7, "a": 9, "b": 11}
_KERN_NOTE_RE = re.compile(r"([a-gA-G])\1*[#\-]*")

#: Tonic pitch class of the major key with this many sharps (negative = flats).
_MAJOR_TONIC = {n: (7 * n) % 12 for n in range(-7, 8)}


def kern_pitch(token: str) -> int | None:
    """
    A `**kern` note token as a semitone number, or None if it is not a note.

    Humdrum spells the octave by repeating the letter: `c` is middle C, `cc` the
    octave above, `C` the octave below and `CC` two below. Accidentals are `#`
    and `-` and there may be several.
    """
    match = _KERN_NOTE_RE.search(token)
    if not match:
        return None
    letters = match.group(0)
    letter = letters[0]
    repeats = sum(1 for character in letters if character.lower() == letter.lower())
    step = _KERN_STEP[letter.lower()]
    octave = 4 + (repeats - 1) if letter.islower() else 3 - (repeats - 1)
    alter = letters.count("#") - letters.count("-")
    return (octave + 1) * 12 + step + alter


def final_bass_pitch_class(text: str) -> int | None:
    """
    The pitch class of the lowest note in the piece's last sounding bar.

    Used only to tell a key signature's major from its relative minor: five
    sharps is B major or G-sharp minor, and defaulting to major printed
    "Prelude Op. 28 No. 12 in B major" on a piece in G-sharp minor.

    The *lowest* note rather than the first spine's, because Humdrum spines
    split and merge: after a `*v *v` join the bass staff is no longer column
    one, which is how Joplin's *Solace* — a piece in C — came back as A minor.
    """
    for line in reversed(
        [line for line in text.splitlines() if line and not line.startswith(("!", "*", "="))][-60:]
    ):
        pitches = [
            pitch
            for token in line.replace("\t", " ").split(" ")
            for pitch in [kern_pitch(token)]
            if pitch is not None
        ]
        if pitches:
            return min(pitches) % 12
    return None


_RISM_KEY_RE = re.compile(r"^!!!rism-key\s*:\s*(.+)$", re.M)


def rism_key(text: str) -> str | None:
    """
    The key as the RISM catalogue records it — "G-sharp minor", "A-flat major".

    Present in 411 of the 512 NIFC Chopin files and worth more than anything
    that can be inferred, because it is cataloguing data about the work rather
    than a reading of the notes. It also happens to be spelled the way a title
    wants it.
    """
    match = _RISM_KEY_RE.search(text)
    return match.group(1).strip() if match else None


def mode_for(text: str, fifths: int) -> str:
    """
    Major or minor for a key signature: catalogue, then music, then the record.

    The `*C:`/`*a:` mode record comes last on purpose. craigsapp's editions use
    it correctly, but the NIFC encoding of Prelude Op. 28 No. 12 carries `*B:`
    — the *signature's* major rather than the piece's key, which is G-sharp
    minor. Trusting it printed "Prelude No. 12 in B major"; reading the last
    bass note instead gets all 24 preludes right.
    """
    catalogued = rism_key(text)
    if catalogued:
        return "minor" if catalogued.lower().endswith("minor") else "major"
    final = final_bass_pitch_class(text)
    if final is not None:
        major_tonic = _MAJOR_TONIC[max(-7, min(7, fifths))]
        if final == major_tonic:
            return "major"
        if final == (major_tonic - 3) % 12:
            return "minor"
    stated = _MODE_RE.search(text)
    if stated:
        return "minor" if stated.group(1).islower() else "major"
    return "major"


def title_key_words(text: str, fifths: int, mode: str) -> str:
    """The key for a title: the catalogue's wording when there is one."""
    return rism_key(text) or title_key(fifths, mode)


def key_fifths_and_mode(text: str) -> tuple[int, str] | None:
    """The `*k[...]` signature and `*X:` mode record, as (fifths, mode)."""
    keysig = _KEYSIG_RE.search(text)
    if not keysig:
        return None
    accidentals = keysig.group(1)
    fifths = accidentals.count("#") - accidentals.count("-")
    return fifths, mode_for(text, fifths)


def kern_facts(text: str) -> dict:
    """
    Key, time signature and tempo, read straight out of the `**kern` spines.

    Read here rather than from the converted MusicXML so that a placeholder —
    which is never converted, because a build without `--allow-nc` must not
    even write the file — carries the same facts as the real item.
    """
    facts: dict = {"keySig": None, "timeSig": None, "tempoBpm": None}

    signature = key_fifths_and_mode(text)
    if signature is not None:
        facts["keySig"] = key_name(*signature)

    timesig = _TIMESIG_RE.search(text)
    if timesig:
        facts["timeSig"] = f"{timesig.group(1)}/{timesig.group(2)}"

    tempo = _TEMPO_RE.search(text)
    if tempo:
        facts["tempoBpm"] = round(float(tempo.group(1)), 2)
    return facts


# ---------------------------------------------------------------------------
# the licence gate
# ---------------------------------------------------------------------------

def repo_decision(repo: Path, *, allow_nc: bool) -> LicenseDecision:
    """The repository's own licence, re-read from LICENSE/README on every run."""
    return license_verdict(repo_license_text(repo), source=repo.name, allow_nc=allow_nc)


def file_decision(records: dict[str, str], *, source: str, allow_nc: bool) -> LicenseDecision | None:
    """
    The licence the *file* states, or None when it states nothing.

    `!!!YEM` is the Humdrum record for the licence and is what the five usable
    repositories put there. `!!!YEC` alone — a copyright line with no licence —
    is not a grant, so it is passed through to the gate, which rejects it as an
    unrecognised licence rather than reading it as permission.
    """
    claim = records.get("YEM") or records.get("YEC") or ""
    if not claim.strip():
        return None
    return license_verdict(claim, source=source, allow_nc=allow_nc)


def assert_excluded(table: dict, report: ImportReport) -> None:
    """
    Re-proves that the unlicensed repositories cannot get in.

    This is the check docs/00 D10a's amendment needs most: `--allow-nc` is a
    single flag and the difference between the repositories it may open and the
    ones it may not is a LICENSE file nobody looks at twice. So it is asserted
    on every build, with `allow_nc=True` — the most permissive setting — and a
    repository that passes stops the build instead of shipping.
    """
    for name, why in sorted(table.get("mustStayExcluded", {}).items()):
        for key in table.get("items", {}):
            if key.split("/", 1)[0] == name:
                raise ExcludedRepositoryError(
                    f"content/sources/kern.json lists {key}, but {name} must stay excluded: {why}"
                )
        repo = KERN_DIR / name
        if not repo.exists():
            report.unchecked.append(name)
            continue
        decision = repo_decision(repo, allow_nc=True)
        if decision.verdict is Verdict.BUNDLE:
            raise ExcludedRepositoryError(
                f"{name} must stay excluded ({why}) but the licence gate admitted it as "
                f"{decision.license!r}: {decision.reason}"
            )
        report.guarded.append((name, decision.reason))


# ---------------------------------------------------------------------------
# group expansion
# ---------------------------------------------------------------------------

def solo_piano(text: str) -> bool:
    """
    Two `**kern` spines and no words: a piano score rather than a song or a trio.

    Read from the file's own spine header rather than from its `!!!AGN` genre
    tag, because the tag says what a piece *is* and this asks what the encoding
    *contains* — `craigsapp`'s Chopin songs are tagged "Song" but so is nothing
    else about the file that would stop them being imported as piano solos.
    """
    header = next((line for line in text.splitlines() if line.startswith("**")), "")
    spines = header.split("\t")
    if sum(1 for spine in spines if spine == "**kern") != 2:
        return False
    return not any(spine in ("**text", "**silbe") for spine in spines)


def work_key(stem: str, sigla: list[str]) -> tuple[str, str, str]:
    """
    (opus, work number, descriptor) for one Rink-Grabowski filename.

    `007-1-KI-001.krn` is Op. 7, Kistner's first edition, work 1. The same
    music appears under several publishers — `028-1-BH-001` and
    `028_1-12-1a-C-001` are both Prelude no. 1 — so the opus range suffix and
    the publisher have to come out of the key or every prelude arrives twice.
    """
    parts = stem.split("-")
    opus = parts[0]
    base = opus.split("_")[0]
    if base.endswith("sep"):  # `072sep` is the separate issue of Op. 72's pieces
        base = base[: -len("sep")]
    sub = opus.split("_")[1] if "_" in opus else ""
    number = next((part for part in parts[1:] if re.fullmatch(r"\d{3}", part)), None)
    if number is None:
        number = f"{int(sub):03d}" if re.fullmatch(r"\d+", sub) else "001"
    descriptor = "-".join(
        part
        for part in parts[1:]
        if not re.fullmatch(r"\d{3}", part) and part not in sigla and not re.fullmatch(r"\d+[a-z]*", part)
    )
    return base, number, descriptor


def publisher_of(stem: str, sigla: list[str]) -> str:
    for part in stem.split("-")[1:]:
        if part in sigla:
            return part
    return "?"


def survey_repo(repo_name: str, repo_meta: dict) -> dict[tuple[str, str, str], tuple[Path, str]]:
    """
    One chosen file per work in a repository, keyed by (opus, number, descriptor).

    Where a work survives in several first editions the choice is by publisher,
    in the order the table states — for Chopin that is the German house first,
    which is the text most modern editions descend from. It is an editorial
    choice and it belongs in the table, not here.
    """
    sigla: list[str] = repo_meta.get("sigla", [])
    priority: list[str] = repo_meta.get("publisherPriority", [])
    rank = {siglum: index for index, siglum in enumerate(priority)}
    skip_genres = set(repo_meta.get("skipGenres", []))

    candidates: dict[tuple[str, str, str], list[tuple[int, str, Path, str]]] = {}
    for path in sorted((KERN_DIR / repo_name / "kern").glob("*.krn")):
        text = path.read_text(encoding="utf-8", errors="replace")
        if not solo_piano(text):
            continue
        records = kern_reference_records(path)
        if records.get("AGN", "") in skip_genres:
            continue
        publisher = publisher_of(path.stem, sigla)
        key = work_key(path.stem, sigla)
        candidates.setdefault(key, []).append((rank.get(publisher, 99), path.name, path, publisher))
    return {key: (best[2], best[3]) for key, group in candidates.items() for best in [min(group)]}


def expand_groups(table: dict, report: ImportReport) -> list[tuple[str, dict]]:
    """
    Turns each `groups` entry into one row per work in that opus.

    Chopin's first editions run to 191 solo-piano works across 40-odd opus
    numbers. Writing 191 rows by hand would be 191 chances to mistype a title,
    and the titles are formulaic — genre, key, opus, number — with the key
    already stated inside every file. So the table describes an opus once and
    the level of the individual pieces where they differ from it, and this
    fills in the rest. A piece whose level came from the group default rather
    than from a judgement about that piece is tagged `level-banded`, so the
    difference is visible in the app instead of implied.
    """
    rows: list[tuple[str, dict]] = []
    surveys: dict[str, dict] = {}
    claimed: dict[str, set[str]] = {}
    for group in table.get("groups", []):
        repo_name = group["repo"]
        repo_meta = table.get("repos", {}).get(repo_name, {})
        if not (KERN_DIR / repo_name).exists():
            report.unchecked.append(f"{repo_name} (group Op. {group.get('opus')})")
            continue
        if repo_name not in surveys:
            surveys[repo_name] = survey_repo(repo_name, repo_meta)
        survey = surveys[repo_name]
        claimed.setdefault(repo_name, set()).add(group["opus"])
        works = {
            key: value for key, value in survey.items() if key[0] == group["opus"]
        }
        if not works:
            report.excluded.append((f"{repo_name} Op. {group['opus']}", "no work of that opus in the repository"))
            continue
        overrides: dict = group.get("works", {})
        ids: list[str] = []
        pending: list[tuple[str, dict]] = []
        for (_, number, descriptor), (path, publisher) in sorted(works.items()):
            # Op. 72 holds a nocturne, a funeral march and three écossaises,
            # and the numbering restarts inside each — so an override is keyed
            # by number *and* descriptor where a file has one.
            override = overrides.get(f"{number}-{descriptor}") or overrides.get(number) or {}
            if override.get("skip"):
                report.excluded.append((path.name, f"table: {override['skip']}"))
                continue
            text = path.read_text(encoding="utf-8", errors="replace")
            signature = key_fifths_and_mode(text)
            key_words = title_key_words(text, *signature) if signature else "an unstated key"
            index = int(number)
            suffix = f"-{descriptor}" if descriptor else ""
            # A title with no {n} in it belongs to an opus of one piece, and
            # `song.classical.chopin-ballade-1-1` helps nobody.
            numbered = "{n}" in group["titleTemplate"]
            stem = f"{group['idPrefix']}-{index}{suffix}" if numbered else f"{group['idPrefix']}{suffix}"
            item_id = override.get("id") or stem + repo_meta.get("idSuffix", "")
            # An override's title is a template too — Op. 72's pieces need one
            # each, and they still want the key filled in.
            title = (override.get("title") or group["titleTemplate"]).format(n=index, key=key_words)
            banded = "level" not in override
            spec = {
                "id": item_id,
                "title": title,
                "composer": repo_meta.get("composerName") or group.get("composer"),
                "level": override.get("level", group["level"]),
                "abrsmGradeApprox": override.get("abrsmGradeApprox", group.get("abrsmGradeApprox")),
                "tracks": override.get("tracks", group["tracks"]),
                "concepts": override.get("concepts", group["concepts"]),
                "editionNotes": " ".join(
                    part for part in (override.get("editionNotes"), group.get("editionNotes"), f"First edition: {publisher}.") if part
                ),
                "_banded": banded,
            }
            ids.append(item_id)
            pending.append((f"{repo_name}/kern/{path.name}", spec))

        # Siblings from the same opus are the obvious "something else at this
        # level", and unlike a cross-source link they always resolve.
        for position, (key, spec) in enumerate(pending):
            others = [other for other in ids if other != spec["id"]]
            spec["alternatives"] = others[position : position + 3] or others[:3] or None
        rows.extend(pending)

    # A repository is bigger than the part of it the table describes, and the
    # difference is the interesting number: it is the queue for the next run,
    # not an accident. Reported rather than left to be noticed.
    for repo_name, survey in surveys.items():
        deliberate = table.get("repos", {}).get(repo_name, {}).get("skipOpus", {})
        found = {opus for opus, _, _ in survey}
        for opus, why in sorted(deliberate.items()):
            if opus in found:
                report.excluded.append((f"{repo_name} Op. {opus}", why))
        missing = sorted(found - claimed.get(repo_name, set()) - set(deliberate))
        if missing:
            report.uncovered.append(f"{repo_name}: no group for opus {', '.join(missing)}")
    return rows


# ---------------------------------------------------------------------------
# the import
# ---------------------------------------------------------------------------

def build_entry(
    key: str,
    spec: dict,
    *,
    table: dict,
    decisions: dict[str, LicenseDecision],
    allow_nc: bool,
    scores_out: Path,
    fetched_at: str,
    report: ImportReport,
) -> dict | None:
    """Admits one file and turns it into a catalog item, or explains the refusal."""
    repo_name = key.split("/", 1)[0]
    repo_meta = table.get("repos", {}).get(repo_name, {})
    source_path = KERN_DIR / key
    if not source_path.exists():
        report.missing.append(key)
        return None
    if "exclude" in spec:
        report.excluded.append((key, spec["exclude"]))
        return None

    if repo_name not in decisions:
        decisions[repo_name] = repo_decision(KERN_DIR / repo_name, allow_nc=allow_nc)
    decision = decisions[repo_name]
    if decision.verdict is Verdict.REJECT:
        report.excluded.append((key, f"repository licence: {decision.reason}"))
        return None

    text = source_path.read_text(encoding="utf-8", errors="replace")
    records = kern_reference_records(source_path)

    # The file's own rights record outranks the repository's: a repository
    # can be relicensed wholesale while one contributed file inside it is
    # not the maintainer's to relicense.
    own = file_decision(records, source=key, allow_nc=allow_nc)
    if own is not None:
        if own.verdict is Verdict.REJECT:
            report.excluded.append((key, f"file licence: {own.reason}"))
            return None
        decision = own if own.verdict is Verdict.LOCAL_ONLY else decision

    year = publication_year(records)
    stated = spec.get("publishedYear")
    if year is not None and stated is not None and int(stated) != year:
        report.excluded.append(
            (key, f"table says publishedYear {stated}, the file's !!!ODT/!!!PDT says {year}")
        )
        return None

    composer_died = None
    file_composer = records.get("COM", "")
    if year is None:
        # No date in the file. The composer is in the file, though, and when
        # the table knows when that person died the question is answerable —
        # provided this really is a contemporaneous printing, which is what
        # the publisher record attests.
        composers: dict = repo_meta.get("composers", {})
        known = composers.get(file_composer)
        if known is None:
            report.excluded.append(
                (key, f"no !!!ODT/!!!PDT year, and composer {file_composer!r} is not in the table")
            )
            return None
        # Evidence that this is a contemporaneous printing rather than a modern
        # first publication of a manuscript — which is the one case where a
        # long-dead composer's work could still be in copyright. The record is
        # the direct form; the publisher siglum in the filename is the same
        # claim made by the repository's own naming convention, and 18 of the
        # 512 Chopin files carry only that.
        named_publisher = records.get("PPR") or (
            publisher_of(source_path.stem, repo_meta.get("sigla", [])) != "?"
        )
        if not named_publisher:
            report.excluded.append(
                (key, "no publication year and no publisher named — cannot show it is a contemporaneous edition")
            )
            return None
        composer_died = int(known["died"])

    composition = composition_verdict(
        composer=spec.get("composer") or file_composer or None,
        published_year=year,
        composer_died=composer_died,
    )
    if composition.verdict is not Verdict.BUNDLE:
        report.excluded.append((key, f"composition: {composition.reason}"))
        return None

    facts = kern_facts(text)
    # The gate normalises CC BY-NC-SA down to "CC BY-NC" because that is the
    # part it rules on; the catalog records what the file actually says.
    stated_license = normalise_license(records.get("YEM", "")) or decision.license or "unstated"

    bundling = decision.verdict is Verdict.BUNDLE
    dest = scores_out / (spec["id"] + ".mxl")
    tags = ["kern", repo_name]
    if spec.get("_banded") or spec.get("levelBanded"):
        # An estimate, not a judgement about this piece. `_banded` is set by
        # group expansion; `levelBanded` is the same admission on a hand row.
        tags.append("level-banded")

    if bundling:
        from convert import cached_convert  # imported late: music21 is slow to load

        try:
            cached_convert(
                source_path,
                dest,
                title=spec["title"],
                composer=spec.get("composer"),
            )
        except Exception as exc:  # noqa: BLE001 - one bad file must not cost the rest
            report.excluded.append((key, f"conversion failed: {type(exc).__name__}: {exc}"))
            return None
        if stated_license.upper().startswith("CC BY-NC"):
            tags.append(NC_PERSONAL_TAG)
        file_ref: str | None = f"scores/imported/{spec['id']}.mxl"
        checksum: str | None = sha256_file(dest)
        import_hint: str | None = None
    else:
        file_ref = None
        checksum = None
        import_hint = IMPORT_HINT.format(repo=repo_name)
        tags.append("import-only")
        report.placeheld.append((key, decision.reason))

    if bundling:
        report.imported.append(key)
    return catalog_item(
        item_id=spec["id"],
        item_type="song",
        title=spec["title"],
        level=spec["level"],
        hands="both",
        tracks=spec["tracks"],
        concepts=spec["concepts"],
        source=SourceBlock(
            name=repo_meta.get("name", repo_name),
            url=repo_meta.get("url"),
            license=stated_license,
            pd_region="worldwide",
            fetchedAt=fetched_at,
            checksum=checksum,
            editionNotes=" ".join(
                part for part in (spec.get("editionNotes"), repo_meta.get("editionNotes")) if part
            )
            or None,
        ),
        subtitle=spec.get("subtitle"),
        composer=spec.get("composer"),
        genre=["ragtime"] if "ragtime" in spec["tracks"] else ["classical"],
        abrsmGradeApprox=spec.get("abrsmGradeApprox"),
        file=file_ref,
        importHint=import_hint,
        alternatives=spec.get("alternatives"),
        variantOf=spec.get("variantOf"),
        variantLabel=spec.get("variantLabel"),
        tempoBpm=facts["tempoBpm"],
        keySig=facts["keySig"],
        timeSig=facts["timeSig"],
        tags=tags,
    )


def import_kern(out_dir: Path, catalog_path: Path, *, allow_nc: bool, limit: int | None = None) -> ImportReport:
    table = read_json(TABLE_PATH)
    assert isinstance(table, dict)
    report = ImportReport()
    assert_excluded(table, report)

    entries: list[dict] = []
    fetched_at = utc_now()
    scores_out = out_dir / "scores" / "imported"
    scores_out.mkdir(parents=True, exist_ok=True)
    decisions: dict[str, LicenseDecision] = {}

    rows: list[tuple[str, dict]] = sorted(table.get("items", {}).items())
    rows += expand_groups(table, report)
    seen: set[str] = set()
    for index, (key, spec) in enumerate(rows):
        if limit is not None and index >= limit:
            break
        if spec["id"] in seen:
            report.excluded.append((key, f"duplicate id {spec['id']}"))
            continue
        entry = build_entry(
            key,
            spec,
            table=table,
            decisions=decisions,
            allow_nc=allow_nc,
            scores_out=scores_out,
            fetched_at=fetched_at,
            report=report,
        )
        if entry is not None:
            seen.add(entry["id"])
            entries.append(entry)

    # Group expansion names siblings as alternatives before anything is
    # converted, so a piece that then fails to convert would leave its
    # neighbours pointing at nothing. Chopin's Op. 25 No. 7 does exactly that.
    for entry in entries:
        alternatives = [item for item in (entry.get("alternatives") or []) if item in seen]
        if entry.get("alternatives") and not alternatives:
            entry.pop("alternatives")
        elif alternatives != entry.get("alternatives"):
            entry["alternatives"] = alternatives

    write_json(catalog_path, entries)
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True, help="content output directory")
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--limit", type=int)
    parser.add_argument(
        "--allow-nc",
        action="store_true",
        help="bundle the CC BY-NC-SA editions — a personal build only (docs/00 D10a)",
    )
    parser.add_argument(
        "--no-cache", action="store_true", help="ignore build/cache/convert and reconvert"
    )
    args = parser.parse_args()
    if args.no_cache:
        os.environ["PIANOPATH_NO_CACHE"] = "1"

    if not KERN_DIR.exists():
        print(
            f"no kern repositories at {KERN_DIR}; run tools/content/fetch.py first",
            file=sys.stderr,
        )
        write_json(args.catalog, [])
        sys.exit(0)

    report = import_kern(args.out, args.catalog, allow_nc=args.allow_nc, limit=args.limit)
    for name, reason in report.guarded:
        print(f"  guard  {name}: stays excluded — {reason}")
    for name in report.unchecked:
        print(f"  guard  {name}: not cloned, nothing to exclude")
    for line in report.uncovered:
        print(f"  todo   {line}")
    if report.placeheld:
        print(f"import placeholders {len(report.placeheld)} (build with --allow-nc to bundle them):")
        for key, why in report.placeheld:
            print(f"  - {key}: {why}")
    if report.excluded:
        print(f"excluded {len(report.excluded)}:")
        for key, why in report.excluded:
            print(f"  - {key}: {why}")
    if report.missing:
        print(f"missing {len(report.missing)} file(s) named in the table", file=sys.stderr)
        for key in report.missing:
            print(f"  - {key}", file=sys.stderr)
    # Last, so the build's one-line summary of this step is the count.
    from convert import CACHE_STATS  # late import: music21 is slow to load

    print(
        f"imported {len(report.imported)} score(s), {len(report.placeheld)} placeholder(s), "
        f"excluded {len(report.excluded)} ({CACHE_STATS.summary()})"
    )


if __name__ == "__main__":
    main()
