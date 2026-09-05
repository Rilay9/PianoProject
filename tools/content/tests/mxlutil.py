"""Reading a written .mxl back, so the tests assert on the file, not the stream."""
from __future__ import annotations

import re
import zipfile
from dataclasses import dataclass
from pathlib import Path


@dataclass
class WrittenScore:
    xml: str

    @property
    def score_parts(self) -> int:
        return self.xml.count("<score-part ")

    @property
    def staves(self) -> int:
        found = re.search(r"<staves>(\d+)</staves>", self.xml)
        return int(found.group(1)) if found else 1

    @property
    def fingerings(self) -> list[int]:
        return [int(f) for f in re.findall(r"<fingering[^>]*>(\d)</fingering>", self.xml)]

    @property
    def harmonies(self) -> int:
        return self.xml.count("<harmony")

    @property
    def lyrics(self) -> int:
        return self.xml.count("<lyric")

    @property
    def tempos(self) -> list[float]:
        return [float(t) for t in re.findall(r'<sound tempo="([0-9.]+)"', self.xml)]

    @property
    def measures(self) -> int:
        return len(re.findall(r"<measure ", self.xml)) // max(1, self.score_parts)

    def clef_of_staff(self, number: int) -> str | None:
        """The clef sign printed on `number`, for grand-staff ordering checks."""
        for block in re.findall(r"<clef[^>]*>.*?</clef>", self.xml, re.S):
            attrs = re.search(r'number="(\d+)"', block)
            sign = re.search(r"<sign>([A-Z]+)</sign>", block)
            if sign and (attrs is None or int(attrs.group(1)) == number):
                if attrs is not None or number == 1:
                    return sign.group(1)
        return None


def read_mxl(path: Path) -> WrittenScore:
    if path.suffix == ".mxl":
        with zipfile.ZipFile(path) as archive:
            names = [n for n in archive.namelist() if not n.startswith("META-INF")]
            return WrittenScore(archive.read(names[0]).decode("utf-8"))
    return WrittenScore(path.read_text(encoding="utf-8"))
