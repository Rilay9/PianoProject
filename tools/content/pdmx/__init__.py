"""
The PDMX quarry (replan §2).

The archive is 254,077 rows of CSV and 1.9 GB of compressed MusicXML sitting on
the owner's laptop. It can never reach CI and it will never reach the
repository, so the quarry is deliberately two programs with a hard line between
them:

  shortlist.py CSV -> build/pdmx/candidates.json          needs the archive
  extract.py  candidates -> build/pdmx/raw/<cid>.mxl     needs the archive
  quarry.py   raw -> converted + features + level + render
  review.py   writes the review page; reads the decisions back
  commit.py   accepted rows -> content/scores/pdmx/ + content/sources/pdmx.json

  ../import_pdmx.py  the build step: reads what was committed, verifies every
                     checksum, writes build/catalog.pdmx.json. Needs nothing
                     but the repository.

Everything above the line runs once, on one machine, with a person watching.
Everything below it runs on every build, everywhere, and is deterministic.

The point of the split is that the build stays reproducible without 4 GB of
downloads, and the expensive judgement — which 300 of 36,000 candidates are
worth practising — is made once and recorded rather than recomputed.
"""
