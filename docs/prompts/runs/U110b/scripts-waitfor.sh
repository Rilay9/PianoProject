#!/bin/bash
# waitfor.sh <file> <seconds>: returns when the file has a line starting "exit ", or after <seconds>.
f="$1"; n="${2:-500}"
i=0
while [ "$i" -lt "$n" ]; do
  if grep -q "^exit " "$f" 2>/dev/null; then echo "finished"; exit 0; fi
  sleep 5; i=$((i+5))
done
echo "still running after ${n}s"
