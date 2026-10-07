#!/bin/sh
# G1d: the offline content build could not produce a whole app/public/content in this worktree
# (content-build.log: without the imported kern and musetrainer folders, which live under content/ and
# are another builder's to touch, the merge and validation failed). So the built folder is copied, read
# only, from the main checkout, as the brief allows, over the partial build; and the two reports the
# build rewrote are put back to HEAD's bytes.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"  # the worktree, from this script's own place
M="$(cd "$W/../../.." && pwd)"                  # the main checkout the worktree lives under
echo "copy app/public/content from the main checkout (read only)"
(cd "$M/app/public/content" && tar -cf - .) | (cd "$W/app/public/content" && tar -xf -)
echo "tar app/public/content exit=$?"
python -c "import json,sys;print('catalogue items:', len(json.load(open(sys.argv[1],encoding='utf-8'))))" "$W/app/public/content/catalog.json"
cd "$W" || exit 1
for f in docs/prompts/inventory.md docs/prompts/rung-claims.md; do
  git show "HEAD:$f" > "$f"; echo "restored $f to HEAD's bytes exit=$?"
done
git status --short
