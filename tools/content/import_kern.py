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


def kern_facts(text: str) -> dict:
    """
    Key, time signature and tempo, read straight out of the `**kern` spines.

    Read here rather than from the converted MusicXML so that a placeholder —
    which is never converted, because a build without `--allow-nc` must not
    even write the file — carries the same facts as the real item.
    """
    facts: dict = {"keySig": None, "timeSig": None, "tempoBpm": None}

    keysig = _KEYSIG_RE.search(text)
    if keysig:
        accidentals = keysig.group(1)
        fifths = accidentals.count("#") - accidentals.count("-")
        mode_match = _MODE_RE.search(text)
        mode = "minor" if mode_match and mode_match.group(1).islower() else "major"
        facts["keySig"] = key_name(fifths, mode)

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
# the import
# ---------------------------------------------------------------------------

def import_kern(out_dir: Path, catalog_path: Path, *, allow_nc: bool, limit: int | None = None) -> ImportReport:
    table = read_json(TABLE_PATH)
    assert isinstance(table, dict)
    repos: dict = table.get("repos", {})
    items: dict = table.get("items", {})
    report = ImportReport()
    assert_excluded(table, report)

    entries: list[dict] = []
    fetched_at = utc_now()
    scores_out = out_dir / "scores" / "imported"
    scores_out.mkdir(parents=True, exist_ok=True)
    decisions: dict[str, LicenseDecision] = {}

    for index, (key, spec) in enumerate(sorted(items.items())):
        if limit is not None and index >= limit:
            break
        repo_name = key.split("/", 1)[0]
        source_path = KERN_DIR / key
        if not source_path.exists():
            report.missing.append(key)
            continue
        if "exclude" in spec:
            report.excluded.append((key, spec["exclude"]))
            continue

        if repo_name not in decisions:
            decisions[repo_name] = repo_decision(KERN_DIR / repo_name, allow_nc=allow_nc)
        decision = decisions[repo_name]
        if decision.verdict is Verdict.REJECT:
            report.excluded.append((key, f"repository licence: {decision.reason}"))
            continue

        text = source_path.read_text(encoding="utf-8", errors="replace")
        records = kern_reference_records(source_path)

        # The file's own rights record outranks the repository's: a repository
        # can be relicensed wholesale while one contributed file inside it is
        # not the maintainer's to relicense.
        own = file_decision(records, source=key, allow_nc=allow_nc)
        if own is not None:
            if own.verdict is Verdict.REJECT:
                report.excluded.append((key, f"file licence: {own.reason}"))
                continue
            decision = own if own.verdict is Verdict.LOCAL_ONLY else decision

        year = publication_year(records)
        if year is None:
            report.excluded.append((key, "no !!!ODT or !!!PDT publication year in the file"))
            continue
        stated = spec.get("publishedYear")
        if stated is not None and int(stated) != year:
            report.excluded.append(
                (key, f"table says publishedYear {stated}, the file's !!!ODT/!!!PDT says {year}")
            )
            continue
        composition = composition_verdict(composer=spec.get("composer"), published_year=year)
        if composition.verdict is not Verdict.BUNDLE:
            report.excluded.append((key, f"composition: {composition.reason}"))
            continue

        repo_meta = repos.get(repo_name, {})
        facts = kern_facts(text)
        # The gate normalises CC BY-NC-SA down to "CC BY-NC" because that is the
        # part it rules on; the catalog records what the file actually says.
        stated_license = normalise_license(records.get("YEM", "")) or decision.license or "unstated"

        bundling = decision.verdict is Verdict.BUNDLE
        dest = scores_out / (spec["id"] + ".mxl")
        tags = ["kern", repo_name]

        if bundling:
            from convert import convert_file  # imported late: music21 is slow to load

            try:
                convert_file(
                    source_path,
                    dest,
                    title=spec["title"],
                    composer=spec.get("composer"),
                )
            except Exception as exc:  # noqa: BLE001 - one bad file must not cost the rest
                report.excluded.append((key, f"conversion failed: {type(exc).__name__}: {exc}"))
                continue
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

        entries.append(
            catalog_item(
                item_id=spec["id"],
                item_type="song",
                title=spec["title"],
                level=spec["level"],
                hands="both",
                tracks=spec["tracks"],
                concepts=spec["concepts"],
                source=SourceBlock(
                    name=repo_meta.get("name", f"craigsapp/{repo_name}"),
                    url=repo_meta.get("url", f"https://github.com/craigsapp/{repo_name}"),
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
        )
        if bundling:
            report.imported.append(key)

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
    args = parser.parse_args()

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
    print(
        f"imported {len(report.imported)} score(s), {len(report.placeheld)} placeholder(s), "
        f"excluded {len(report.excluded)}"
    )


if __name__ == "__main__":
    main()
