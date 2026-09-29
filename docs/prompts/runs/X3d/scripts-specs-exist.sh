#!/usr/bin/env bash
# X3d (X3c's check): every spec file named for a browser step exists (Playwright drops a missing name
# silently, Q65a). Usage, from app/: bash ../docs/prompts/runs/X3d/scripts-specs-exist.sh <spec>...
missing=0
for f in "$@"; do
  if [ -f "$f" ]; then echo "present: $f"; else echo "MISSING: $f"; missing=1; fi
done
exit $missing
