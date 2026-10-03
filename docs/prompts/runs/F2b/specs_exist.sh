#!/usr/bin/env bash
# specs_exist.sh FILE... : every spec file named for a browser step exists (relative to app/), else exit 1.
cd "$(dirname "$0")/../../../../app" || exit 99
missing=0
for spec in "$@"; do
  if [ -f "$spec" ]; then echo "exists  $spec"; else echo "MISSING $spec"; missing=1; fi
done
exit $missing
