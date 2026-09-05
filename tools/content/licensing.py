"""
The licence gate (docs/03-content-pipeline.md §1).

§1 is written as hard rules, so it is code rather than a checklist a builder is
trusted to remember: nothing reaches the catalog without passing `verdict()`.

Two independent questions have to be answered for every file, and both have to
be yes:

  1. Is the **composition** in the public domain in the US? (published 1930 or
     earlier as of 2026, or traditional/anonymous)
  2. Is the **edition or arrangement** public domain or under a licence that
     permits redistribution? CC BY-NC and CC BY-ND are *not* such licences,
     however convenient the file is.

The second question is where this pipeline lost most of its expected sources —
see docs/decisions/2026-09-05-p4-content-licensing.md.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

#: The year the US public-domain cutoff sits at. Advances by one each January
#: (docs/03 §1 rule 1), so it is a constant with a name rather than a literal
#: buried in a comparison.
PD_CUTOFF_YEAR = 1930


class Verdict(str, Enum):
    BUNDLE = "bundle"
    #: Usable by the tools, not shippable: the file is converted and rendered
    #: but never written into app/public/content.
    LOCAL_ONLY = "local-only"
    REJECT = "reject"


@dataclass(frozen=True)
class LicenseDecision:
    verdict: Verdict
    #: Normalised licence identifier, or the raw text when it is not one we know.
    license: str
    reason: str

    @property
    def bundlable(self) -> bool:
        return self.verdict is Verdict.BUNDLE


#: Tag put on every catalog item admitted by `allow_nc`, so a deploy can be
#: checked for them before it goes anywhere public.
NC_PERSONAL_TAG = "nc-personal-build"

#: Licences that permit redistribution inside the app.
REDISTRIBUTABLE = {
    "PD", "CC0", "CC BY", "CC BY-SA", "CC BY 4.0", "CC BY-SA 4.0", "CC BY 3.0", "CC BY-SA 3.0",
}

#: …and the ones that explicitly do not.
NON_REDISTRIBUTABLE_PATTERNS = (
    (re.compile(r"\bBY[- ]NC", re.I), "CC BY-NC", "non-commercial licences cannot be redistributed in the app (docs/03 §1 rule 1)"),
    (re.compile(r"\bNonCommercial", re.I), "CC BY-NC", "non-commercial licences cannot be redistributed in the app (docs/03 §1 rule 1)"),
    (re.compile(r"\bBY[- ]ND", re.I), "CC BY-ND", "no-derivatives licences forbid the normalisation this pipeline performs"),
    (re.compile(r"\bNoDerivat", re.I), "CC BY-ND", "no-derivatives licences forbid the normalisation this pipeline performs"),
    (re.compile(r"all rights reserved", re.I), "all rights reserved", "no licence granted"),
)

_CC_RE = re.compile(r"CC[- ]?BY(?:[- ](NC[- ]SA|NC[- ]ND|SA|NC|ND))?(?:[- ]?\d\.\d)?", re.I)
_CC0_RE = re.compile(r"\bCC0\b|public\s*domain\s*dedication", re.I)
_PD_RE = re.compile(r"\bpublic\s+domain\b", re.I)


def normalise_license(text: str) -> str:
    """Best-effort licence identifier from free text (a README, a rights tag)."""
    if not text:
        return ""
    if _CC0_RE.search(text):
        return "CC0"
    match = _CC_RE.search(text)
    if match:
        suffix = (match.group(1) or "").upper().replace(" ", "-")
        return f"CC BY-{suffix}" if suffix else "CC BY"
    if _PD_RE.search(text):
        return "PD"
    return text.strip()


def license_verdict(raw: str, *, source: str = "", allow_nc: bool = False) -> LicenseDecision:
    """
    Decides whether an *edition* licence permits bundling.

    `allow_nc` is the owner's amendment of 2026-09-05 (`docs/00` D10a): the app
    is for one person, so a personal build may carry CC BY-NC editions — which
    is what most scholarly encodings turn out to be. It stays off by default
    and it does not relax anything else: an edition with **no** licence grants
    nothing whoever is listening, and ND forbids the normalisation this
    pipeline performs whether or not anyone else ever sees the result.
    """
    if not raw or not raw.strip():
        return LicenseDecision(Verdict.REJECT, "", f"{source or 'file'} states no licence")
    for pattern, name, reason in NON_REDISTRIBUTABLE_PATTERNS:
        if pattern.search(raw):
            if allow_nc and name == "CC BY-NC":
                return LicenseDecision(
                    Verdict.BUNDLE,
                    name,
                    "non-commercial, bundled for a personal build only (docs/00 D10a)",
                )
            return LicenseDecision(Verdict.LOCAL_ONLY, name, reason)
    normalised = normalise_license(raw)
    if normalised in REDISTRIBUTABLE:
        return LicenseDecision(Verdict.BUNDLE, normalised, "redistributable licence")
    return LicenseDecision(
        Verdict.REJECT,
        normalised,
        f"unrecognised licence {normalised!r} — treated as unclear (docs/03 §1 rule 1)",
    )


def composition_verdict(
    *, composer: str | None = None, published_year: int | None = None, traditional: bool = False
) -> LicenseDecision:
    """Decides whether the *composition* is in the US public domain."""
    if traditional:
        return LicenseDecision(Verdict.BUNDLE, "PD", "traditional/anonymous")
    if published_year is not None:
        if published_year <= PD_CUTOFF_YEAR:
            return LicenseDecision(Verdict.BUNDLE, "PD", f"published {published_year} ≤ {PD_CUTOFF_YEAR}")
        return LicenseDecision(
            Verdict.REJECT, "in copyright", f"published {published_year} > {PD_CUTOFF_YEAR}"
        )
    return LicenseDecision(
        Verdict.REJECT, "unknown", f"no publication year for composer {composer or 'unknown'}"
    )


def repo_license_text(repo: Path) -> str:
    """The licence a cloned repository states, from LICENSE* then README*."""
    for pattern in ("LICENSE*", "LICENCE*", "COPYING*"):
        for candidate in sorted(repo.glob(pattern)):
            if candidate.is_file():
                return candidate.read_text(encoding="utf-8", errors="replace")[:4000]
    for candidate in sorted(repo.glob("README*")):
        if candidate.is_file():
            text = candidate.read_text(encoding="utf-8", errors="replace")[:8000]
            if re.search(r"licen[cs]e|creative commons|public domain", text, re.I):
                return text
    return ""


def kern_reference_records(krn: Path) -> dict[str, str]:
    """
    Humdrum `!!!XXX:` reference records, which carry the copyright claim.

    The whole file is scanned, not just its header. Humdrum allows reference
    records anywhere, and craigsapp's editions put the bibliographic ones
    (`OTL`, `COM`, `ODT`) on top but the *rights* ones (`YEC`, `YEM`, `EED`)
    after the last data line — so a header-only reader sees everything except
    the licence, which is the one thing this function exists to find.

    First occurrence wins: several files carry both the original `!!!YEC` from
    when the edition was encoded and a later one from a re-release.
    """
    records: dict[str, str] = {}
    for line in krn.read_text(encoding="utf-8", errors="replace").splitlines():
        if not line.startswith("!!!"):
            continue
        match = re.match(r"^!!!+([A-Za-z0-9-]+)\s*:\s*(.*)$", line)
        if match:
            records.setdefault(match.group(1), match.group(2).strip())
    return records
