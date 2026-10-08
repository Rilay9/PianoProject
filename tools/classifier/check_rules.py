#!/usr/bin/env python3
"""
Acceptance gate for Phase 2 rules pages (docs/classifier/rules/area-*.md).

Made 2026-10-08 after chunk 1's hand-written detectors failed on real scores: the
library-first rule was in CLAUDE.md, but nothing stopped a rule without an external search
from being accepted (the owner: enforce it where the work is accepted, not by reminders).

For every characteristic section (a heading naming a dotted id):
  - a line starting **Reuse:** must exist;
  - "**Reuse:** custom ..." needs the survey's own row for that id to say "nothing found";
  - otherwise the tool it names (the text before the first "(", comma or em dash) must be among
    that row's candidates;
  - an id the survey has no row for may only be a "direct read (<music21 / partitura / MusicXML>)";
  - every **Validated:** line must name "evidence: <path>" to a file under docs/classifier/evidence/;
(revised after the process review of 2026-10-08 found it read whole survey sections)
  - a "Status: validated" section needs at least one **Validated:** line.
It checks that evidence exists and points the right way; whether the research was good is
the checker's job.

    python tools/classifier/check_rules.py docs/classifier/rules/area-2D.md [...]
Exit 1 with one line per failure.
"""
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SURVEY = os.path.join(ROOT, "docs", "classifier", "tools-survey.md")
HEAD = re.compile(r"^(#{2,4})\s+.*?`?([a-z][a-z0-9_-]*\.[a-z0-9_.-]+)`?", re.M)


def sections(text):
    """(id, body) for each heading that names a dotted id."""
    marks = [(m.start(), m.group(2)) for m in HEAD.finditer(text)]
    heads = [m.start() for m in re.finditer(r"^#{1,4}\s", text, re.M)]
    out = []
    for pos, cid in marks:
        nxt = min([h for h in heads if h > pos] or [len(text)])
        out.append((cid, text[pos:nxt]))
    return out


def survey_row(cid):
    """(status, tools) from the survey's own row for this id, or None if it has no row."""
    if not os.path.exists(SURVEY):
        return "missing"
    text = open(SURVEY, encoding="utf-8").read()
    m = re.search(r"^\|\s*`" + re.escape(cid) + r"`\s*\|\s*([^|]*)\|\s*([^|]*)\|", text, re.M)
    return (m.group(1).strip().lower(), m.group(2).strip().lower()) if m else None


DIRECT = ("music21", "partitura", "musicxml", "raw xml")


def check(path):
    errs = []
    text = open(path, encoding="utf-8").read()
    secs = sections(text)
    if not secs:
        return [f"{path}: no characteristic sections found"]
    for cid, body in secs:
        where = f"{os.path.basename(path)} {cid}"
        reuse = re.search(r"^\*\*Reuse:\*\*\s*(.+)$", body, re.M)
        row = survey_row(cid)
        if row == "missing":
            errs.append(f"{where}: docs/classifier/tools-survey.md is missing")
        elif not reuse:
            errs.append(f"{where}: no **Reuse:** line")
        else:
            val = reuse.group(1).strip()
            low = val.lower()
            if row is None:
                # Not surveyed: allowed only as a direct read of notation by a named reader.
                if not (low.startswith("direct read") and any(d in low for d in DIRECT)):
                    errs.append(f"{where}: not in the tools survey, so its reuse line must be 'direct read (<music21 / partitura / MusicXML field>)'; otherwise add it to the survey")
            elif low.startswith("custom"):
                if not row[0].startswith("nothing found"):
                    errs.append(f"{where}: custom detector, but the survey row for `{cid}` names candidates: {row[1][:80]}")
            else:
                tool = re.split(r"\(|—|;|,", val)[0].strip().strip("`").lower()
                if len(tool) < 3 or tool not in row[1]:
                    errs.append(f"{where}: reuse names '{tool}', which is not among the survey row's candidates for `{cid}`")
        vals = re.findall(r"^\*\*Validated:\*\*.*$", body, re.M)
        for v in vals:
            m = re.search(r"evidence:\s*`?([^\s`]+)`?", v)
            ev = m.group(1).replace("\\", "/") if m else None
            if not ev:
                errs.append(f"{where}: a **Validated:** line names no evidence file")
            elif not ev.startswith("docs/classifier/evidence/") or not os.path.isfile(os.path.join(ROOT, ev)):
                errs.append(f"{where}: evidence {ev} is not a file under docs/classifier/evidence/")
        if re.search(r"status:\s*validated", body, re.I) and not vals:
            errs.append(f"{where}: says validated but has no **Validated:** line with evidence")
    return errs


if __name__ == "__main__":
    paths = sys.argv[1:]
    if not paths:
        print(__doc__)
        sys.exit(2)
    errors = [e for p in paths for e in check(p)]
    for e in errors:
        print(e)
    sys.exit(1 if errors else 0)
