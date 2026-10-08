#!/usr/bin/env python3
"""
Acceptance gate for Phase 2 rules pages (docs/classifier/rules/area-*.md).

Made 2026-10-08 after chunk 1's hand-written detectors failed on real scores: the
library-first rule was in CLAUDE.md, but nothing stopped a rule without an external search
from being accepted (the owner: enforce it where the work is accepted, not by reminders).

For every characteristic section (a heading naming a dotted id):
  - a line starting **Reuse:** must exist;
  - "**Reuse:** custom ..." needs the tools survey's section for that id to say "nothing found";
  - otherwise the tool it names (the text before the first "(" or em dash) must appear in the
    survey's section for that id;
  - every **Validated:** line must name "evidence: <path>" to a file that exists in the repo;
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


def survey_sections(cid):
    if not os.path.exists(SURVEY):
        return None
    text = open(SURVEY, encoding="utf-8").read()
    parts = re.split(r"(?m)^(?=#{1,4}\s)", text)
    return [p for p in parts if re.search(r"`" + re.escape(cid) + r"`", p)]


def check(path):
    errs = []
    text = open(path, encoding="utf-8").read()
    secs = sections(text)
    if not secs:
        return [f"{path}: no characteristic sections found"]
    for cid, body in secs:
        where = f"{os.path.basename(path)} {cid}"
        reuse = re.search(r"^\*\*Reuse:\*\*\s*(.+)$", body, re.M)
        surv = survey_sections(cid)
        if not reuse:
            errs.append(f"{where}: no **Reuse:** line")
        elif surv is None:
            errs.append(f"{where}: docs/classifier/tools-survey.md is missing")
        elif not surv:
            errs.append(f"{where}: the tools survey has no section listing `{cid}`")
        else:
            val = reuse.group(1).strip()
            joined = "\n".join(surv).lower()
            if val.lower().startswith("custom"):
                if "nothing found" not in joined:
                    errs.append(f"{where}: custom detector, but the survey's section for it does not say nothing found")
            else:
                tool = re.split(r"\(|—|;", val)[0].strip().strip("`").lower()
                if not tool or tool not in joined:
                    errs.append(f"{where}: reuse names '{tool}', which is not in the survey's section for `{cid}`")
        vals = re.findall(r"^\*\*Validated:\*\*.*$", body, re.M)
        for v in vals:
            m = re.search(r"evidence:\s*`?([^\s`]+)`?", v)
            if not m:
                errs.append(f"{where}: a **Validated:** line names no evidence file")
            elif not os.path.exists(os.path.join(ROOT, m.group(1))):
                errs.append(f"{where}: evidence file {m.group(1)} does not exist")
        if re.search(r"status:\s*validated", body, re.I) and not vals:
            errs.append(f"{where}: says validated but has no **Validated:** line")
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
