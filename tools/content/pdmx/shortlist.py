"""
PDMX.csv -> build/pdmx/candidates.json (replan §2.2).

A pure function of the CSV and two committed tables. 254,077 rows go in; a few
hundred candidates come out, with every rejection counted by reason and the 200
most frequent unmatched composer strings printed — which is how
`composers.json` grows, and the only way anyone finds out what the archive
actually contains.

Two things this deliberately does *not* do:

  - It does not reject on composition status. `docs/00` D23: the owner's build
    may carry anything the dataset marks public domain, so the status is a
    label carried through to the catalog and refused by `--strict-license`.
  - It does not admit on rating. The paper's finding that ratings track quality
    is used to *order* each band's queue so the best files are reviewed first;
    what gets in is decided by the machine gates in `quarry.py` and by a person.

Windows is the target machine, so: `pathlib` everywhere, the CSV opened with
`encoding='utf-8', newline=''`, and `csv.field_size_limit` raised — some rows
carry a tag list several kilobytes long and the default limit is 131,072
characters on some builds.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import sys
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass, field
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

from pdmx.composers import ComposerTable, fold  # noqa: E402
from pdmx.paths import BUILD_DIR, ArchiveMissing, fail, find_archive  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[3]
WANTS_FILE = REPO_ROOT / "content" / "sources" / "pdmx-wants.json"

#: MIDI programs 0-7 are the piano family. A two-track file whose tracks are
#: both in it is a grand staff written as two parts, which `convert.py` merges.
PIANO_PROGRAMS = set(range(8))

#: `02` Part B's stages, as the level bands the quotas are written in.
BANDS = ("1-2", "3", "4", "5", "6", "7-9")

GENRE_BUCKETS = ("classical", "folk-hymn-carol", "pop-film-game", "jazz-latin")

#: replan §2.2's table, verbatim: songs per band, split by bucket.
DEFAULT_QUOTAS: dict[str, dict[str, int]] = {
    "1-2": {"classical": 10, "folk-hymn-carol": 20, "pop-film-game": 10, "jazz-latin": 0},
    "3": {"classical": 20, "folk-hymn-carol": 15, "pop-film-game": 15, "jazz-latin": 0},
    "4": {"classical": 30, "folk-hymn-carol": 10, "pop-film-game": 25, "jazz-latin": 5},
    "5": {"classical": 30, "folk-hymn-carol": 5, "pop-film-game": 25, "jazz-latin": 10},
    "6": {"classical": 15, "folk-hymn-carol": 0, "pop-film-game": 20, "jazz-latin": 5},
    "7-9": {"classical": 20, "folk-hymn-carol": 0, "pop-film-game": 10, "jazz-latin": 0},
}

#: Bayesian rating: a file with one five-star vote is not better than one with
#: forty at 4.6. Prior 4.0, weight 5 (replan §2.2).
RATING_PRIOR = 4.0
RATING_WEIGHT = 5.0

#: Structural bounds, before anything is parsed.
MIN_BARS, MAX_BARS = 8, 400
MIN_NOTES = 30

#: Genre words the CSV uses, mapped onto the four buckets.
GENRE_WORDS: dict[str, str] = {
    "classical": "classical",
    "baroque": "classical",
    "romantic": "classical",
    "opera": "classical",
    "chamber": "classical",
    "orchestral": "classical",
    "folk": "folk-hymn-carol",
    "world": "folk-hymn-carol",
    "religious": "folk-hymn-carol",
    "gospel": "folk-hymn-carol",
    "christmas": "folk-hymn-carol",
    "holiday": "folk-hymn-carol",
    "country": "folk-hymn-carol",
    "pop": "pop-film-game",
    "rock": "pop-film-game",
    "soundtrack": "pop-film-game",
    "film": "pop-film-game",
    "video game": "pop-film-game",
    "videogame": "pop-film-game",
    "game": "pop-film-game",
    "anime": "pop-film-game",
    "electronic": "pop-film-game",
    "hip hop": "pop-film-game",
    "rnb": "pop-film-game",
    "jazz": "jazz-latin",
    "blues": "jazz-latin",
    "latin": "jazz-latin",
    "ragtime": "jazz-latin",
}


def truthy(value: str | None) -> bool:
    return (value or "").strip().lower() in {"true", "1", "yes", "t"}


def number(value: str | None, default: float = 0.0) -> float:
    try:
        return float((value or "").strip())
    except ValueError:
        return default


def integer(value: str | None, default: int = 0) -> int:
    return int(number(value, default))


def parse_tracks(value: str | None) -> list[int]:
    """
    `"0-0"` -> `[0, 0]`.

    The column is a dash-separated list of MIDI programs, not JSON. A single
    track is just `"0"`, and an empty or unparseable value yields nothing,
    which the program gate then rejects.
    """
    out: list[int] = []
    for part in (value or "").split("-"):
        part = part.strip()
        if not part:
            continue
        try:
            out.append(int(part))
        except ValueError:
            return []
    return out


def cid_of(mxl_path: str) -> str:
    """`./mxl/1/11/QmXYZ.mxl` -> `QmXYZ`."""
    return Path(mxl_path.replace("\\", "/")).stem


def member_name(mxl_path: str) -> str:
    """
    The tarball member for a CSV `mxl` path.

    The CSV writes `./mxl/1/11/<cid>.mxl`; the tarball's members are
    `mxl/1/11/<cid>.mxl`, with no leading `./`. Getting this wrong extracts
    nothing at all and looks like a corrupt archive, so it is one function with
    a test rather than a `lstrip` in three places.
    """
    cleaned = mxl_path.replace("\\", "/").strip()
    while cleaned.startswith("./"):
        cleaned = cleaned[2:]
    return cleaned.lstrip("/")


def musescore_id(metadata_path: str) -> str | None:
    """`./metadata/5/5740212.json` -> `5740212`."""
    stem = Path((metadata_path or "").replace("\\", "/")).stem
    return stem if stem.isdigit() else None


def bucket_for(genres: str, matched_composer: bool, traditional: bool) -> str:
    """
    Which of the four genre buckets a row belongs to.

    The CSV's `genres` decides where it can; a `composers.json` match is
    classical or folk; and an `NA` genre with an unmatched composer is
    pop-film-game, which is the honest default — the unmatched half of the
    archive is overwhelmingly modern arrangements.
    """
    folded = fold(genres)
    if folded and folded != "na":
        for word, bucket in GENRE_WORDS.items():
            if word in folded:
                return bucket
    if traditional:
        return "folk-hymn-carol"
    if matched_composer:
        return "classical"
    return "pop-film-game"


def band_for(bars: int, notes_per_bar: float, complexity: float) -> str:
    """
    A first guess at the level band, from the CSV alone.

    This is *not* the level: `difficulty.py` computes that from the score after
    conversion, and every PDMX item is `levelSource: "estimated"` either way.
    All this has to do is put a row in a queue, because the quotas are per band
    and a queue has to exist before anything is converted.

    The thresholds are the archive's own distribution, measured over the 37,499
    rows that pass the gates rather than assumed: notes per bar runs 3.0 at the
    5th percentile, 7.3 at the median, 17.6 at the 90th and 28.2 at the 99th.

    `complexity` is a *secondary* signal here, and that is the correction P14
    made. MuseScore's own number is 1 for 27,496 of those rows and never
    exceeds 3, so a rule written as "complexity <= 5" — as the first draft was —
    is satisfied by every row in the dataset, and the top band was unreachable.
    It now only ever pushes a row *up*, which is what a complexity score can
    honestly do.
    """
    density = notes_per_bar
    if density <= 5 and bars <= 48:
        band = "1-2"
    elif density <= 8:
        band = "3"
    elif density <= 12:
        band = "4"
    elif density <= 17:
        band = "5"
    elif density <= 24:
        band = "6"
    else:
        band = "7-9"
    # A long piece is a harder piece at the same density: 211 bars is the 99th
    # percentile, and nothing that long belongs in the first two stages.
    if band == "1-2" and bars > 48:
        band = "3"
    if complexity >= 3 and band in ("1-2", "3", "4", "5"):
        band = BANDS[min(len(BANDS) - 1, BANDS.index(band) + 1)]
    return band


def score_row(rating: float, n_ratings: int, n_views: int, official: bool, lyrics: bool) -> float:
    """
    How high up its band's queue a row sits.

    A Bayesian rating so one enthusiastic vote does not outrank forty measured
    ones, times log views so a file nobody has opened does not lead the queue,
    up-weighted when MuseScore marks it official and down-weighted when it has
    lyrics — a song sheet with a piano part is fine, but it is less likely to
    be the piano piece somebody wanted.
    """
    bayesian = ((RATING_PRIOR * RATING_WEIGHT) + (rating * n_ratings)) / (RATING_WEIGHT + n_ratings)
    reach = math.log1p(max(0, n_views))
    return bayesian * reach * (1.25 if official else 1.0) * (0.8 if lyrics else 1.0)


@dataclass
class Candidate:
    cid: str
    member: str
    title: str
    artist: str
    composer_raw: str
    composer: str | None
    composition_status: str
    composition_reason: str
    #: Which CSV column the status was decided from.
    composition_from: str
    traditional: bool
    year_conflict: str | None
    musescore_id: str | None
    license: str
    genres: str
    bucket: str
    band: str
    bars: int
    notes: int
    notes_per_bar: float
    complexity: float
    rating: float
    n_ratings: int
    n_views: int
    official: bool
    lyrics: bool
    n_tracks: int
    tracks: list[int]
    score: float
    #: Set when the row matched `pdmx-wants.json`; admitted outside the quotas.
    want: str | None = None
    #: Set when the row is a Part F reference tune (`verify` in the same file).
    verifies: str | None = None
    #: Set when the row is over its bucket's quota but otherwise fine.
    over_quota: bool = False


@dataclass
class Rejections:
    counts: Counter = field(default_factory=Counter)
    unmatched_composers: Counter = field(default_factory=Counter)

    def add(self, reason: str) -> None:
        self.counts[reason] += 1


# --- the gates, one function each so each one has a test ---------------------

def gate_has_mxl(row: dict) -> str | None:
    value = (row.get("mxl") or "").strip()
    return None if value and value.upper() != "NA" else "no mxl file in the archive"


def gate_piano_tracks(row: dict) -> str | None:
    tracks = parse_tracks(row.get("tracks"))
    n_tracks = integer(row.get("n_tracks"))
    if n_tracks not in (1, 2):
        return f"{n_tracks} tracks (want 1 or 2)"
    if not tracks or len(tracks) != n_tracks:
        return "track programs unreadable"
    if any(program not in PIANO_PROGRAMS for program in tracks):
        return f"non-piano program in {tracks}"
    return None


def gate_subsets(row: dict) -> str | None:
    if not truthy(row.get("subset:no_license_conflict")):
        return "licence conflict (the dataset's own recommendation)"
    if not truthy(row.get("subset:deduplicated")):
        return "not the deduplicated copy"
    return None


def gate_not_draft(row: dict) -> str | None:
    if truthy(row.get("is_draft")):
        return "draft"
    if truthy(row.get("has_paywall")):
        return "paywalled"
    return None


def gate_size(row: dict) -> str | None:
    bars = integer(row.get("song_length.bars"))
    notes = integer(row.get("n_notes"))
    if not (MIN_BARS <= bars <= MAX_BARS):
        return f"{bars} bars (want {MIN_BARS}-{MAX_BARS})"
    if notes < MIN_NOTES:
        return f"{notes} notes (want >= {MIN_NOTES})"
    return None


#: Applied in order; the first failure is the recorded reason.
GATES = (
    ("mxl present", gate_has_mxl),
    ("piano tracks", gate_piano_tracks),
    ("subsets", gate_subsets),
    ("not a draft", gate_not_draft),
    ("size", gate_size),
)


def load_wants(path: Path = WANTS_FILE) -> list[dict]:
    if not path.is_file():
        return []
    return json.loads(path.read_text(encoding="utf-8")).get("wants", [])


def load_verifications(path: Path = WANTS_FILE) -> list[dict]:
    """
    The Part F tunes P5 skipped for want of an edition to check against.

    A different job from the wants: these are not repertoire, they are the
    *reference* an authored ABC is checked against. Admitted outside the quotas
    for the same reason — measured on the first real run, 25 of the 28 the
    archive has were below the quota line, so ranking would never have shown
    them.
    """
    if not path.is_file():
        return []
    return json.loads(path.read_text(encoding="utf-8")).get("verify", [])


def match_want(title: str, artist: str, wants: list[dict]) -> str | None:  # noqa: D401
    """
    A named want (`02` Part D8 and the *Beautiful* suggestions).

    Folded substring on the title, and on the artist when the want names one.
    These are admitted outside the quotas: the point of the list is that these
    particular pieces are wanted whatever the ranking says.
    """
    folded_title = fold(title)
    folded_artist = fold(artist)
    for want in wants:
        title_ok = any(fold(pattern) in folded_title for pattern in want.get("title", []))
        artists = want.get("artist", [])
        artist_ok = not artists or any(fold(pattern) in folded_artist for pattern in artists)
        if title_ok and artist_ok:
            # A verification entry has no id — the tune's own title is what
            # identifies it, because nothing in the catalog is waiting for it.
            return want.get("id") or want["title"][0]
    return None


def select(
    csv_path: Path,
    table: ComposerTable,
    wants: list[dict],
    quotas: dict[str, dict[str, int]],
    limit: int = 0,
    verifications: list[dict] | None = None,
) -> tuple[list[Candidate], Rejections, dict]:
    """Reads the CSV once and returns the ranked, quota-filled shortlist."""
    csv.field_size_limit(min(sys.maxsize, 2**31 - 1))
    rejections = Rejections()
    passed: list[Candidate] = []
    rows_read = 0

    with csv_path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            rows_read += 1
            if limit and rows_read > limit:
                break
            failure = None
            for name, gate in GATES:
                failure = gate(row)
                if failure:
                    rejections.add(f"{name}: {failure}")
                    break
            if failure:
                continue

            title = (row.get("title") or row.get("song_name") or "").strip()
            artist = (row.get("artist_name") or "").strip()

            match = table.match(row.get("composer_name", ""))
            label_from = "composer_name"
            if not match.matched and artist:
                # `composer_name` is `NA` for 59 of the 306 rows this run chose,
                # and every one of them has an `artist_name`. On a pop or film
                # row the artist *is* the composition's author as far as the
                # licence question goes, so it is worth asking — and the field
                # the answer came from is recorded, because "Linkin Park" is a
                # band and not a person.
                from_artist = table.match(artist)
                if from_artist.matched:
                    match = from_artist
                    label_from = "artist_name"
            if not match.matched:
                raw = (row.get("composer_name") or "").strip()
                if raw and raw.upper() != "NA":
                    rejections.unmatched_composers[raw] += 1
                elif artist and artist.upper() != "NA":
                    rejections.unmatched_composers[f"(artist) {artist}"] += 1
            lyrics = truthy(row.get("has_lyrics"))
            official = truthy(row.get("is_official"))
            rating = number(row.get("rating"))
            n_ratings = integer(row.get("n_ratings"))
            n_views = integer(row.get("n_views"))
            bars = integer(row.get("song_length.bars"))
            complexity = number(row.get("complexity"))
            notes_per_bar = number(row.get("notes_per_bar"))

            passed.append(
                Candidate(
                    cid=cid_of(row["mxl"]),
                    member=member_name(row["mxl"]),
                    title=title,
                    artist=artist,
                    composer_raw=(row.get("composer_name") or "").strip(),
                    composer=match.canonical,
                    composition_status=match.status,
                    composition_reason=match.reason,
                    composition_from=label_from,
                    traditional=match.traditional,
                    year_conflict=match.year_conflict,
                    musescore_id=musescore_id(row.get("metadata", "")),
                    license=(row.get("license") or "").strip(),
                    genres=(row.get("genres") or "").strip(),
                    bucket=bucket_for(row.get("genres", ""), match.canonical is not None, match.traditional),
                    band=band_for(bars, notes_per_bar, complexity),
                    bars=bars,
                    notes=integer(row.get("n_notes")),
                    notes_per_bar=notes_per_bar,
                    complexity=complexity,
                    rating=rating,
                    n_ratings=n_ratings,
                    n_views=n_views,
                    official=official,
                    lyrics=lyrics,
                    n_tracks=integer(row.get("n_tracks")),
                    tracks=parse_tracks(row.get("tracks")),
                    score=score_row(rating, n_ratings, n_views, official, lyrics),
                    want=match_want(title, artist, wants),
                    verifies=match_want(title, artist, verifications or []),
                )
            )

    chosen = apply_quotas(passed, quotas)
    summary = {
        "rowsRead": rows_read,
        "passedGates": len(passed),
        "chosen": sum(1 for c in chosen if not c.over_quota),
        "overQuota": sum(1 for c in chosen if c.over_quota),
        "namedWants": sum(1 for c in chosen if c.want),
        "verifications": sum(1 for c in chosen if c.verifies and not c.over_quota),
        "verificationTunes": len(
            {c.verifies for c in chosen if c.verifies and not c.over_quota}
        ),
        "compositionStatus": dict(Counter(c.composition_status for c in chosen if not c.over_quota)),
        "perBand": {
            band: dict(Counter(c.bucket for c in chosen if c.band == band and not c.over_quota))
            for band in BANDS
        },
    }
    return chosen, rejections, summary


def apply_quotas(
    passed: list[Candidate], quotas: dict[str, dict[str, int]]
) -> list[Candidate]:
    """
    Fills each band's buckets from the top of its queue.

    A bucket that cannot fill its share hands the remainder to the others in
    the same band (replan §2.2), which matters because the jazz-latin bucket is
    empty at Stages 1-3 by design and the folk one is empty at 6 and above.
    Everything that does not fit is kept, marked `over_quota`, so a later run
    can take the next fifty without reading the CSV again.
    """
    ranked = sorted(passed, key=lambda c: (-c.score, c.cid))
    out: list[Candidate] = []
    seen: set[str] = set()

    # Named wants first and outside the quotas: the point of the list is that
    # these pieces are wanted whatever the ranking says.
    for candidate in ranked:
        if (candidate.want or candidate.verifies) and candidate.cid not in seen:
            seen.add(candidate.cid)
            out.append(candidate)

    for band in BANDS:
        band_quota = quotas.get(band, {})
        pool = [c for c in ranked if c.band == band and c.cid not in seen]
        taken: dict[str, int] = defaultdict(int)
        for bucket in GENRE_BUCKETS:
            allowance = band_quota.get(bucket, 0)
            if allowance <= 0:
                continue
            for candidate in [c for c in pool if c.bucket == bucket and c.cid not in seen]:
                if taken[bucket] >= allowance:
                    break
                seen.add(candidate.cid)
                taken[bucket] += 1
                out.append(candidate)
        # The remainder rule: whatever a bucket could not fill is offered to
        # the rest of the band, best-ranked first, regardless of bucket.
        remainder = sum(band_quota.values()) - sum(taken.values())
        for candidate in pool:
            if remainder <= 0:
                break
            if candidate.cid in seen:
                continue
            seen.add(candidate.cid)
            remainder -= 1
            out.append(candidate)
        # And the rest of the band stays, ranked, for a later run.
        for candidate in pool:
            if candidate.cid in seen:
                continue
            seen.add(candidate.cid)
            candidate.over_quota = True
            out.append(candidate)

    return out


def fingerprint(csv_path: Path, rows: int) -> dict:
    """The provenance header: what CSV this run actually read."""
    digest = hashlib.sha256()
    with csv_path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return {
        "csvSha256": digest.hexdigest(),
        "csvBytes": csv_path.stat().st_size,
        "csvRows": rows,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdmx-dir", default=None)
    parser.add_argument("--out", type=Path, default=BUILD_DIR / "candidates.json")
    parser.add_argument("--quota", type=Path, default=None, help="JSON quota table; defaults to replan §2.2")
    parser.add_argument("--limit", type=int, default=0, help="stop after N rows (smoke tests)")
    parser.add_argument("--band", action="append", default=[], help="only this band; repeatable")
    parser.add_argument("--top-unmatched", type=int, default=200)
    parser.add_argument("--no-fingerprint", action="store_true", help="skip the CSV sha256 (slow on 200 MB)")
    args = parser.parse_args(argv)

    try:
        archive = find_archive(args.pdmx_dir, require_scores=False)
    except ArchiveMissing as missing:
        fail(str(missing))
        return 2

    table = ComposerTable.load()
    wants = load_wants()
    quotas = DEFAULT_QUOTAS
    if args.quota:
        quotas = json.loads(args.quota.read_text(encoding="utf-8"))
    if args.band:
        quotas = {band: values for band, values in quotas.items() if band in args.band}

    chosen, rejections, summary = select(
        archive.csv, table, wants, quotas, args.limit, load_verifications()
    )

    header = {"pdmxDir": str(archive.root), "layout": archive.layout}
    if not args.no_fingerprint:
        header.update(fingerprint(archive.csv, summary["rowsRead"]))

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps(
            {
                "header": header,
                "summary": summary,
                "quotas": quotas,
                "rejections": dict(rejections.counts.most_common()),
                "unmatchedComposers": rejections.unmatched_composers.most_common(args.top_unmatched),
                "candidates": [asdict(c) for c in chosen],
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    print(f"read {summary['rowsRead']} row(s); {summary['passedGates']} passed the gates")
    print(
        f"chosen {summary['chosen']}, over quota {summary['overQuota']}, "
        f"named wants {summary['namedWants']}, "
        f"Part F references {summary['verifications']} "
        f"covering {summary['verificationTunes']} tune(s)"
    )
    print(f"composition status: {summary['compositionStatus']}")
    for band in BANDS:
        if band in quotas:
            print(f"  band {band}: {summary['perBand'][band]}")
    print("rejections, by reason:")
    for reason, count in rejections.counts.most_common(25):
        print(f"  {count:>8}  {reason}")
    if rejections.unmatched_composers:
        print(f"top unmatched composer strings (grow composers.json from these):")
        for name, count in rejections.unmatched_composers.most_common(20):
            print(f"  {count:>8}  {name}")
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
