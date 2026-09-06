#!/usr/bin/env python3
"""
The grace-16th truncation scan, run over every converted file.

`docs/decisions/2026-09-05-p2-score-rendering.md` §8 records an OpenSheetMusic-
Display defect: a `<grace>` note whose `<type>` is a sixteenth or shorter makes
OSMD read the whole measure as a single quarter — or as nothing, when the grace
group opens the bar — and the iterator then stops after the first entry, losing
the rest of the bar *silently*. An eighth-note grace in the same bar is fine.

P2 ran a one-off scan over the 69 `[MT]` files and asked that it be re-run over
whatever later phases import. This is that scan, made permanent (replan §7).

It is deliberately crude, and reads the MusicXML directly rather than through
music21: the point is to be cheap enough to run on every build over every
converted file. Two facts per measure —

  * how far the cursor actually reaches, in divisions, allowing for `<backup>`
    and `<forward>` so multi-voice and multi-staff bars are measured correctly;
  * whether the measure contains a grace note with a short printed type.

A measure that reaches less than half the length its time signature implies
*and* contains a short grace is the defect's signature. A short measure without
one is ordinary — a pickup, a bar split at a repeat — and is counted but not
reported, which is exactly what P2's scan found: six flagged files, none with a
short grace in the flagged bar.

Usage:
    python3 tools/content/truncation_scan.py app/public/content/scores
"""
from __future__ import annotations

import argparse
import sys
import zipfile
from dataclasses import dataclass
from pathlib import Path
from xml.etree import ElementTree

#: Printed grace-note values that trigger the defect. An eighth does not.
SHORT_GRACE_TYPES = frozenset(
    {"16th", "32nd", "64th", "128th", "256th", "512th", "1024th"}
)


@dataclass(frozen=True)
class Finding:
    """One measure that looks truncated by a short grace note."""

    path: str
    measure: str
    reached: float
    expected: float
    grace_types: tuple[str, ...]

    def describe(self) -> str:
        types = ", ".join(sorted(set(self.grace_types)))
        return (
            f"{self.path} bar {self.measure}: reached {self.reached:g} of "
            f"{self.expected:g} divisions with a {types} grace"
        )


@dataclass
class ScanReport:
    files: int = 0
    measures: int = 0
    #: Measures shorter than half their time signature, whatever the cause.
    short: int = 0
    findings: list[Finding] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        if self.findings is None:
            self.findings = []

    def summary(self) -> str:
        return (
            f"truncation scan: {self.files} file(s), {self.measures} bar(s), "
            f"{self.short} short, {len(self.findings)} with a short grace"
        )


def read_main_xml(path: Path) -> bytes:
    """The MusicXML inside a `.mxl` container, or the file itself."""
    if path.suffix.lower() != ".mxl":
        return path.read_bytes()
    with zipfile.ZipFile(path) as archive:
        names = [n for n in archive.namelist() if n.lower().endswith((".xml", ".musicxml"))]
        # META-INF/container.xml points at the real score; skip it and anything
        # else in META-INF rather than parsing the pointer, which for every
        # file music21 writes names the one remaining entry anyway.
        main = [n for n in names if not n.upper().startswith("META-INF")]
        if not main:
            raise ValueError(f"{path}: no MusicXML entry in the container")
        return archive.read(main[0])


def _int_text(element: ElementTree.Element | None, default: int = 0) -> int:
    if element is None or not (element.text or "").strip():
        return default
    try:
        return int(float(element.text.strip()))
    except ValueError:
        return default


def scan_xml(xml: bytes, path: str = "<memory>") -> ScanReport:
    """Scans one parsed score. Never raises on odd input: it returns no findings."""
    report = ScanReport(files=1)
    try:
        root = ElementTree.fromstring(xml)
    except ElementTree.ParseError:
        return report

    # Both carry forward until a measure restates them, which is what MusicXML
    # means by them being in `<attributes>` rather than on every measure.
    divisions = 0
    beats, beat_type = 4, 4

    for part in root.iter("part"):
        for measure in part.findall("measure"):
            report.measures += 1
            attributes = measure.find("attributes")
            if attributes is not None:
                divisions = _int_text(attributes.find("divisions"), divisions)
                time_signature = attributes.find("time")
                if time_signature is not None:
                    beats = _int_text(time_signature.find("beats"), beats)
                    beat_type = _int_text(time_signature.find("beat-type"), beat_type)
            if divisions <= 0 or beats <= 0 or beat_type <= 0:
                continue

            position = 0
            reached = 0
            graces: list[str] = []
            for element in measure:
                if element.tag == "backup":
                    position -= _int_text(element.find("duration"))
                elif element.tag == "forward":
                    position += _int_text(element.find("duration"))
                elif element.tag == "note":
                    if element.find("grace") is not None:
                        printed = element.find("type")
                        if printed is not None and (printed.text or "").strip() in SHORT_GRACE_TYPES:
                            graces.append(printed.text.strip())
                        continue  # a grace note takes no time of its own
                    if element.find("chord") is not None:
                        continue  # sounds with the previous note, adds no time
                    position += _int_text(element.find("duration"))
                reached = max(reached, position)

            expected = divisions * 4 * beats / beat_type
            if expected <= 0 or reached >= expected / 2:
                continue
            report.short += 1
            if graces:
                report.findings.append(
                    Finding(
                        path=path,
                        measure=measure.get("number", "?"),
                        reached=reached,
                        expected=expected,
                        grace_types=tuple(graces),
                    )
                )
    return report


def scan_file(path: Path) -> ScanReport:
    try:
        return scan_xml(read_main_xml(path), path=path.name)
    except (OSError, ValueError, zipfile.BadZipFile):
        # An unreadable score is the render check's problem, not this scan's.
        return ScanReport(files=1)


def scan_dir(root: Path) -> ScanReport:
    total = ScanReport(files=0)
    if not root.exists():
        return total
    for path in sorted(root.rglob("*")):
        if path.suffix.lower() not in {".mxl", ".musicxml", ".xml"}:
            continue
        one = scan_file(path)
        total.files += one.files
        total.measures += one.measures
        total.short += one.short
        total.findings.extend(one.findings)
    return total


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path, help="directory of converted scores")
    args = parser.parse_args()
    report = scan_dir(args.root)
    for finding in report.findings:
        print(f"  - {finding.describe()}")
    print(report.summary())
    sys.exit(1 if report.findings else 0)


if __name__ == "__main__":
    main()
