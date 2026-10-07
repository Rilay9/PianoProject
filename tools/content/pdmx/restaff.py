"""
A two-staff teaching edition of a PDMX ensemble upload: a source-side part selection before
normalisation (requirement `A7a1-bluesriff-restaff`; the ruling `docs/review/responses/a7a-lanes-landing.md`
sections 12-14; the brief `docs/prompts/runs/A7a1/brief-bluesriff-restaff.md`).

Why it exists. `convert.normalise` writes every score as one piano part on two staves, and when the
source has more than two parts `collapse_to_two` merges them by register. For an ensemble upload that
puts the wrong music on the learner's staves: Blues Riff in C's riff, the piano's rootless voicings
and the drum kit's unpitched heads all land on the treble staff. The edition the curriculum needs is
the riff over the roots, nothing else. So the selection is made on the parsed source, by part id,
before the converter runs; the converter itself is reused whole and unchanged, and the source file is
never edited.

What it does, per edition in `EDITIONS`:

1. reads the raw archive member and refuses it unless its sha256 is the pinned one;
2. parses it with `convert.parse_source` (music21, as every import does);
3. keeps the parts whose music21 ids are named in `keep`, removes those named in `omit`, and refuses
   when a kept id is missing, an omitted id is missing, or any part is neither (so a third pitched part
   can never slip through);
4. runs `convert.normalise(score, keep_lyrics=False, tempo_bpm=None)` and `convert.write_mxl`.

With two parts left `collapse_to_two` merges nothing, and `order_as_grand_staff` puts the treble-clef
part above the bass-clef one.

`--freeze` writes the verifier's frozen source-event fixture from the same raw bytes, by
`restaff_verify.freeze` (a raw MusicXML walk, not music21). That is the oracle CI compares the
committed edition against (`tools/content/tests/test_restaff.py`), so the raw member never has to be
in the repository for CI (the ruling, section 13). It is written here, at the import step, and never
from the edition.

Above the archive line, like `quarry.py`: it needs the raw member (extract it with
`extract.py --cid`); the build never runs it. Its row in `content/sources/pdmx.json` carries a
`derivation` block naming this tool, the source sha256 and the selection, which `import_pdmx.py`
validates on every build.

Usage:
    py -3.11 tools/content/pdmx/restaff.py --raw <member.mxl>            # write the edition
    py -3.11 tools/content/pdmx/restaff.py --raw <member.mxl> --freeze   # and the fixture
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from dataclasses import dataclass
from pathlib import Path

_HERE = Path(__file__).resolve().parent
# `tools/content` on the path and this directory off it, as `commit.py` does and for its reason.
sys.path[:] = [entry for entry in sys.path if entry and Path(entry).resolve() != _HERE]
if str(_HERE.parent) not in sys.path:
    sys.path.insert(0, str(_HERE.parent))

from pdmx import restaff_verify  # noqa: E402
from pdmx.paths import REPO_ROOT  # noqa: E402

SCORES_DIR = REPO_ROOT / "content" / "scores" / "pdmx"
FIXTURES_DIR = REPO_ROOT / "tools" / "content" / "tests" / "fixtures" / "restaff"
TOOL = "tools/content/pdmx/restaff.py"


class RestaffError(RuntimeError):
    pass


@dataclass(frozen=True)
class Edition:
    cid: str
    raw_sha256: str
    #: music21 part ids, after `parse_source` (a two-staff part becomes `<id>-Staff1`, `<id>-Staff2`).
    keep: tuple[str, ...]
    omit: tuple[str, ...]
    #: The same selection in the raw file's own terms, for the fixture: score-part id, part-name, staff.
    upper: dict
    lower: dict
    omitted: tuple[dict, ...]

    @property
    def file(self) -> str:
        return f"{self.cid}.restaff.mxl"

    @property
    def fixture(self) -> str:
        return f"tools/content/tests/fixtures/restaff/{self.cid}.source-events.json"

    def derivation(self) -> dict:
        """The block the `pdmx.json` row carries (`import_pdmx.validate_derivation` reads it)."""
        return {"kind": "restaff", "sourceSha256": self.raw_sha256, "keep": list(self.keep),
                "omit": list(self.omit), "tool": TOOL, "fixture": self.fixture}


EDITIONS = {
    # Blues Riff in C. Source: P1 "Piano" (two staves: rootless voicings over whole-note roots), P2 "Riff"
    # (one staff), P3 "Drumset" (unpitched). Edition: the riff over the roots (the ruling, section 13).
    "Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi": Edition(
        cid="Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi",
        raw_sha256="69d5bb7ee0e3cd6ff1aed15863a4d6340538a50b0108661b7657bd0d1b877481",
        keep=("Riff", "P1-Staff2"),
        omit=("P1-Staff1", "Drumset"),
        upper={"part": "P2", "name": "Riff", "staff": 1},
        lower={"part": "P1", "name": "Piano", "staff": 2},
        omitted=({"part": "P1", "name": "Piano", "staff": 1}, {"part": "P3", "name": "Drumset", "staff": 1}),
    ),
}


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def select(score, edition: Edition):  # noqa: ANN001 - a music21 Score
    """The parsed source with only the kept parts, refused when the parts are not the expected ones."""
    ids = [part.id for part in score.parts]
    missing = [pid for pid in edition.keep + edition.omit if pid not in ids]
    if missing:
        raise RestaffError(f"parts {missing} are not in the source (it has {ids})")
    unexpected = [pid for pid in ids if pid not in edition.keep and pid not in edition.omit]
    if unexpected:
        raise RestaffError(f"parts {unexpected} are neither kept nor omitted (the source has {ids})")
    if len(ids) != len(set(ids)):
        raise RestaffError(f"duplicate part ids in the source: {ids}")
    for part in list(score.parts):
        if part.id in edition.omit:
            score.remove(part)
    kept = [part.id for part in score.parts]
    if sorted(kept) != sorted(edition.keep):
        raise RestaffError(f"kept {kept}, wanted {list(edition.keep)}")
    return score


def restaff(raw: Path, dest: Path, edition: Edition):  # noqa: ANN201 - convert.ConversionResult
    """Writes the edition to `dest` and returns the converter's result (its notes say what it did)."""
    import convert  # music21; imported here so the fixture half runs without it

    data = raw.read_bytes()
    digest = sha256_bytes(data)
    if digest != edition.raw_sha256:
        raise RestaffError(f"{raw}: sha256 {digest} is not the pinned {edition.raw_sha256}")
    score = select(convert.parse_source(raw), edition)
    normalised, result = convert.normalise(score, keep_lyrics=False, tempo_bpm=None)
    convert.write_mxl(normalised, dest)
    result.path = dest
    return result


def freeze(raw: Path, edition: Edition) -> dict:
    return restaff_verify.freeze(raw.read_bytes(), raw_sha256=edition.raw_sha256, upper=edition.upper,
                                 lower=edition.lower, omit=list(edition.omitted))


def fixture_text(fixture: dict) -> str:
    """JSON with one event or rest per line, so a reviewer reads the fixture as the probe's table."""
    def rows(items: list) -> str:
        return "[\n" + ",\n".join("      " + json.dumps(item, ensure_ascii=False) for item in items) + "\n    ]" if items else "[]"

    def block(value: dict) -> str:
        fields = [f'    "{k}": {rows(v) if isinstance(v, list) and v and isinstance(v[0], dict) else json.dumps(v, ensure_ascii=False)}'
                  for k, v in value.items()]
        return "{\n" + ",\n".join(fields) + "\n  }"

    fields = [f'  "{k}": {block(v) if isinstance(v, dict) else json.dumps(v, ensure_ascii=False)}' for k, v in fixture.items()]
    text = "{\n" + ",\n".join(fields) + "\n}\n"
    assert json.loads(text) == fixture
    return text


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--raw", type=Path, required=True, help="the raw archive member (<cid>.mxl)")
    parser.add_argument("--cid", default=None, help="which edition; read from the raw file's name when left off")
    parser.add_argument("--scores", type=Path, default=SCORES_DIR)
    parser.add_argument("--freeze", action="store_true", help="also write the verifier's source-event fixture")
    parser.add_argument("--fixtures", type=Path, default=FIXTURES_DIR)
    args = parser.parse_args(argv)

    cid = args.cid or args.raw.name.split(".")[0]
    edition = EDITIONS.get(cid)
    if edition is None:
        print(f"no re-staffed edition is defined for {cid}", file=sys.stderr)
        return 2
    try:
        dest = args.scores / edition.file
        result = restaff(args.raw, dest, edition)
        written = dest.read_bytes()
        print(f"edition {dest.name}: sha256 {sha256_bytes(written)}")
        print(f"  converter notes: {result.warnings}")
        print(f"  bars {result.measures}, notes {result.notes}, staves {result.staves}, "
              f"tempo {result.tempo_bpm:g} (defaulted: {result.added_tempo})")
        if args.freeze:
            fixture = freeze(args.raw, edition)
            path = args.fixtures / f"{cid}.source-events.json"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(fixture_text(fixture), encoding="utf-8")
            print(f"fixture {path.name}: {len(fixture['upper']['events'])} upper, "
                  f"{len(fixture['lower']['events'])} lower, {len(fixture['upper']['rests'])} upper rests")
        verdict = restaff_verify.verify(written, restaff_verify.load_fixture(args.fixtures / f"{cid}.source-events.json"))
    except (RestaffError, ValueError, FileNotFoundError) as error:
        print(f"refused: {error}", file=sys.stderr)
        return 1
    for note in verdict.notes:
        print(f"  note: {note}")
    for failure in verdict.failures:
        print(f"  FAIL: {failure}", file=sys.stderr)
    print("verify:", "PASS" if verdict.ok else f"FAIL ({len(verdict.failures)})")
    return 0 if verdict.ok else 1


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
