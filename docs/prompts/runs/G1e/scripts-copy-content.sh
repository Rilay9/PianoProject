#!/bin/sh
# G1e: the offline content build could not produce a whole app/public/content in this worktree
# (content-build.log, exit 1: without the fetched kern and musetrainer folders under content/, which are
# not G1e's to touch, the merge and validation failed, as for G1d). So the built folder was copied, read
# only, from the main checkout over the partial build, as the brief allows (copy-content.txt), and the two
# reports the build rewrote were put back to HEAD's bytes (restore-reports.txt). Run as separate commands
# from the worktree root; <main checkout> is the checkout the worktree lives under.
(cd "<main checkout>/app/public/content" && tar -cf - .) | (cd app/public/content && tar -xf -)
python -c "import json,sys;print('catalogue items:', len(json.load(open(sys.argv[1],encoding='utf-8'))))" app/public/content/catalog.json
git restore --source=HEAD -- docs/prompts/inventory.md docs/prompts/rung-claims.md
git status --short
