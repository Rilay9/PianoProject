"""
No built score plays a tempo its source does not state without saying so (tempo provenance, 2026-10-07).

The proving run (`docs/classifier/proving/2026-10-07/`, row `mark.tempo-text`) found 60 catalogue songs from the
NIFC first editions of Chopin whose files play 96, the converter's default (`convert.DEFAULT_TEMPO_BPM`), with
no `tempo-defaulted` tag, while 174 other rows carrying that default were tagged. The mechanism: `convert`
answers `added_tempo` for every file it supplies a tempo to, and `import_kern` (and `import_musetrainer`, six
rows) dropped the answer. The app reads the tag (`ScoreScreen`'s `defaulted` tempo source), so it presented the
default as the score's written tempo.

The rule, per row whose built file writes a tempo (`<sound tempo>`), read against what its **source** states, not
against what the converter wrote:

- kern: the `*MM` of the `.krn`, which `import_kern.kern_facts` reads into `tempoBpm` (never the converter);
- MuseTrainer: a `<sound tempo>` or `<metronome>` in the library's own file;
- Mutopia: a `\\tempo … = N` in the edition's `.ly` (otherwise the published MIDI plays LilyPond's default);
- authored: a `Q:` line or `tempoBpm=` in the ABC, `tempoBpm` in a Python source's `PIANOPATH`;
- PDMX: the commit's own record of the converter's answer (`content/sources/pdmx.json`, `tempoDefaulted`): the
  raw uploads are not in the repository;
- an excerpt: its parent's tag is carried (`excerpts.INHERITED_TAGS`); a cut's own default is `test_excerpts`'.

A source that states none is tagged `tempo-defaulted`; one that states a tempo is not. And on every row with a
file the provenance agrees with the tag: `facts.tempo` is inferred exactly when the row is tagged, so the
tempo-sensitive demands are untrusted where `test_measured_truth` requires it.

Reads the built content: run `python tools/content/build.py` first (CI: 'Build content', before 'Content
pipeline tests'). A row whose source is not on this build (an unfetched clone) is skipped and counted.
"""
from __future__ import annotations

import json
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

REPO = Path(__file__).resolve().parents[3]
BUILT = REPO / "app" / "public" / "content"
CONTENT = REPO / "content"
TAG = "tempo-defaulted"


def writes_tempo(path: Path) -> bool:
    import import_musetrainer

    return re.search(r"<sound\b[^>]*\btempo=", import_musetrainer.read_main_xml(path)) is not None


def stated_by_source() -> dict[str, bool | None]:
    """id -> does the source state a tempo (None: the source is not on this build)."""
    out: dict[str, bool | None] = {}
    import import_musetrainer
    import import_mutopia

    for filename, spec in json.loads((CONTENT / "sources" / "musetrainer.json").read_text("utf-8"))["items"].items():
        source = import_musetrainer.LIBRARY_DIR / filename
        if not spec.get("id"):  # an edition exclusion: no row
            continue
        if source.is_file():
            xml = import_musetrainer.read_main_xml(source)
            out[spec["id"]] = "<sound tempo=" in xml or "<metronome" in xml
        else:
            out[spec["id"]] = None
    for row in json.loads((CONTENT / "sources" / "mutopia.json").read_text("utf-8"))["items"]:
        ly = import_mutopia.SOURCES_DIR / row["ly"]["path"]
        out[row["id"]] = (bool(re.search(r"^\s*\\tempo[^\n]*=\s*\d+", ly.read_text("utf-8", errors="replace"), re.M))
                          if ly.is_file() else None)
    for path in sorted((CONTENT / "scores" / "authored").glob("*.abc")):
        text = path.read_text("utf-8")
        found = re.search(r"%%pianopath\b[^\n]*\bid=(\S+)", text)
        if found:
            out[found.group(1)] = bool(re.search(r"^Q:", text, re.M) or re.search(r"\btempoBpm=\S", text))
    import author

    for path in sorted((CONTENT / "scores" / "authored").glob("*.py")):
        if path.name == "__init__.py":
            continue
        meta = getattr(author.load_module(path), "PIANOPATH", None) or {}
        if meta.get("id"):
            out[meta["id"]] = bool(meta.get("tempoBpm"))
    pdmx = json.loads((CONTENT / "sources" / "pdmx.json").read_text("utf-8"))
    for row in pdmx["items"] if isinstance(pdmx, dict) else pdmx:
        out[row["id"]] = not row.get("tempoDefaulted")
    return out


class TestEveryBuiltScore(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        path = BUILT / "catalog.json"
        if not path.is_file():
            raise AssertionError(f"{path} is missing, and this test reads the built content: run "
                                 "`python tools/content/build.py` first")
        cls.catalog = json.loads(path.read_text("utf-8"))
        cls.by_id = {item["id"]: item for item in cls.catalog}
        cls.stated = stated_by_source()

    def source(self, item: dict) -> str:
        return (item.get("provenance") or {}).get("source") or ""

    def test_a_tempo_the_source_does_not_state_is_tagged_and_only_that(self) -> None:
        checked, skipped, faults = 0, [], []
        for item in self.catalog:
            kind = self.source(item)
            if not item.get("file") or kind in ("generated", "runtime", "placeholder", "excerpt"):
                continue
            if not writes_tempo(BUILT / item["file"]):
                continue
            if kind == "kern":
                stated: bool | None = item.get("tempoBpm") is not None
            else:
                stated = self.stated.get(item["id"])
            if stated is None:
                skipped.append(item["id"])
                continue
            checked += 1
            tagged = TAG in (item.get("tags") or [])
            if tagged == stated:
                faults.append(f"{item['id']} ({kind}): the source {'states' if stated else 'states no'} tempo and "
                              f"the row is {'tagged' if tagged else 'untagged'}")
        self.assertGreater(checked, 500, f"too few rows checked; skipped {len(skipped)}")
        self.assertEqual(faults, [], f"{len(faults)} of {checked}")

    def test_an_excerpt_of_a_defaulted_parent_is_tagged(self) -> None:
        faults = [item["id"] for item in self.catalog if item.get("excerptOf")
                  and TAG in (self.by_id.get(item["excerptOf"], {}).get("tags") or [])
                  and TAG not in (item.get("tags") or [])]
        self.assertEqual(faults, [])

    def test_the_tempo_fact_is_inferred_exactly_where_the_row_is_tagged(self) -> None:
        faults = []
        for item in self.catalog:
            if not item.get("file") or self.source(item) in ("generated", "runtime"):
                continue
            fact = ((item.get("provenance") or {}).get("facts") or {}).get("tempo") or {}
            if (fact.get("kind") == "inferred") != (TAG in (item.get("tags") or [])):
                faults.append(f"{item['id']}: tempo fact {fact} with tags {item.get('tags')}")
        self.assertEqual(faults, [])

    def test_the_nifc_first_editions_the_proving_run_named_are_tagged(self) -> None:
        # The proving run's 60 (row `mark.tempo-text`, `population.missing`): every one of them on this build.
        proving = json.loads((REPO / "docs" / "classifier" / "proving" / "2026-10-07" / "results.json").read_text("utf-8"))
        named = proving["rows"]["mark.tempo-text"]["population"]["missing"]
        self.assertEqual(len(named), 60)
        present = [i for i in named if (self.by_id.get(i) or {}).get("file")]
        untagged = [i for i in present if TAG not in self.by_id[i]["tags"]]
        self.assertEqual(untagged, [], f"{len(untagged)} of {len(present)} present")


if __name__ == "__main__":
    unittest.main()
