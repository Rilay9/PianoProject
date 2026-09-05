#!/usr/bin/env bash
#
# Prints the Digital Asset Links file that makes the TWA full-screen.
#
# Android checks https://<host>/.well-known/assetlinks.json and compares the
# SHA-256 there with the certificate the APK is signed with. If they do not
# match — or the file is missing — the app still runs, but inside a browser
# frame with a URL bar, which is the single most common "why does my TWA look
# wrong" answer. It is not an error message; it just quietly looks wrong.
#
#   ./packaging/assetlinks.sh --keystore ~/keys/pianopath.keystore \
#     --alias pianopath --app-id app.pianopath.twa > assetlinks.json
#
# The fingerprint is public information — it is in every copy of the APK — so
# the output is safe to commit and to serve. The keystore it is read from is
# not, and this script only reads it.

set -euo pipefail

KEYSTORE=""
ALIAS="pianopath"
APP_ID="app.pianopath.twa"
FINGERPRINT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --keystore) KEYSTORE="$2"; shift 2 ;;
    --alias) ALIAS="$2"; shift 2 ;;
    --app-id) APP_ID="$2"; shift 2 ;;
    # For when you have the fingerprint but not the keystore to hand — from
    # the Play Console, say, which re-signs with its own key.
    --fingerprint) FINGERPRINT="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$FINGERPRINT" ]]; then
  if [[ -z "$KEYSTORE" ]]; then
    echo "error: pass --keystore or --fingerprint" >&2
    exit 2
  fi
  # keytool asks for the store password on stdin; that is deliberate, so the
  # password never lands in a shell history or a process listing.
  FINGERPRINT="$(keytool -list -v -keystore "$KEYSTORE" -alias "$ALIAS" \
    | awk '/SHA256:/ { print $2; exit }')"
fi

if [[ -z "$FINGERPRINT" ]]; then
  echo "error: could not read a SHA-256 fingerprint" >&2
  exit 1
fi

cat <<JSON
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "$APP_ID",
      "sha256_cert_fingerprints": ["$FINGERPRINT"]
    }
  }
]
JSON
