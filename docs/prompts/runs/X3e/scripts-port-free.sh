#!/usr/bin/env bash
# X3e: is the port free, and does every spec named exist (a missing spec path is dropped silently by Playwright)?
# Usage, from anywhere: bash scripts-port-free.sh <port> <spec paths relative to app/>...
cd "$(dirname "$0")/../../../../app" || exit 2
port="$1"
shift
status=0
if netstat -ano | grep -q ":${port} .*LISTENING"; then echo "port ${port}: in use"; netstat -ano | grep ":${port} .*LISTENING"; status=1; else echo "port ${port}: free"; fi
for spec in "$@"; do
  if [ -f "$spec" ]; then echo "exists: $spec"; else echo "MISSING: $spec"; status=1; fi
done
exit $status
