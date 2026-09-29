#!/usr/bin/env bash
# The union of the browser specs the path-to-checks map names for X1's modules (the router and the global
# stylesheet left out: the map gives those the whole suite, which is CI's), from e2e-union-list.txt, through
# scripts-e2e.sh (port 4373, two workers, every spec checked to exist first). Run from the worktree root.
set -u
mapfile -t specs < docs/prompts/runs/X1/e2e-union-list.txt
bash docs/prompts/runs/X1/scripts-e2e.sh "$1" "${specs[@]}"
