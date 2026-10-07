#!/bin/sh
# The session store's writers at every commit whose diff changed the string 'sessions' in app/src.
# Run from the worktree root.
git log --format="%h" -S"'sessions'" -- app/src > build/u102/hist/sessions-commits.txt
while read -r sha; do
  echo "== $sha"
  git grep -n -e "add('sessions'" -e "put('sessions'" "$sha" -- app/src | sed "s/^$sha://"
done < build/u102/hist/sessions-commits.txt
