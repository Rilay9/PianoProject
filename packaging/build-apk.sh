#!/usr/bin/env bash
#
# Builds the PianoPath TWA APK (docs/00 D19).
#
# Run this on YOUR machine, not in CI: it needs the Android SDK and, more to
# the point, it needs your signing key — which must never be committed and
# never leave your disk. CI has neither and is not supposed to.
#
#   export PIANOPATH_HOST=pianopath.example.pages.dev   # the HTTPS origin
#   export PIANOPATH_KEYSTORE="$HOME/keys/pianopath.keystore"
#   export PIANOPATH_KEY_ALIAS=pianopath
#   ./packaging/build-apk.sh
#
# Everything else has a sane default; run with --help to see them.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"

APP_ID="${PIANOPATH_APP_ID:-app.pianopath.twa}"
HOST="${PIANOPATH_HOST:-}"
BASE_PATH="${PIANOPATH_BASE_PATH:-/}"
KEYSTORE="${PIANOPATH_KEYSTORE:-}"
KEY_ALIAS="${PIANOPATH_KEY_ALIAS:-pianopath}"
VERSION="${PIANOPATH_VERSION:-$(node -p "require('$ROOT/app/package.json').version")}"
VERSION_CODE="${PIANOPATH_VERSION_CODE:-1}"
OUT="${PIANOPATH_OUT:-$ROOT/build/apk}"

usage() {
  cat <<'USAGE'
Environment:
  PIANOPATH_HOST          (required) HTTPS host the APK loads, e.g. pianopath.pages.dev
  PIANOPATH_KEYSTORE      (required) path to your Android signing keystore
  PIANOPATH_KEY_ALIAS     key alias inside it            [pianopath]
  PIANOPATH_APP_ID        Android package id             [app.pianopath.twa]
  PIANOPATH_BASE_PATH     path the app is served under   [/]
  PIANOPATH_VERSION       version name                   [app/package.json version]
  PIANOPATH_VERSION_CODE  integer, must increase per build [1]
  PIANOPATH_OUT           output directory               [build/apk]

The keystore is yours. Create one once, back it up somewhere you will still
have in five years, and never commit it:

  keytool -genkeypair -v -keystore ~/keys/pianopath.keystore \
    -alias pianopath -keyalg RSA -keysize 2048 -validity 10000

Losing it means you cannot update an installed APK — Android will refuse an
upgrade signed by a different key, and the only way out is uninstalling, which
takes your practice history with it. Export a backup from Progress first.
USAGE
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then usage; exit 0; fi

missing=()
[[ -z "$HOST" ]] && missing+=("PIANOPATH_HOST")
[[ -z "$KEYSTORE" ]] && missing+=("PIANOPATH_KEYSTORE")
if (( ${#missing[@]} )); then
  echo "error: set ${missing[*]}" >&2
  echo >&2
  usage >&2
  exit 2
fi
if [[ ! -f "$KEYSTORE" ]]; then
  echo "error: no keystore at $KEYSTORE" >&2
  exit 2
fi

BASE_PATH="/${BASE_PATH#/}"
BASE_PATH="${BASE_PATH%/}/"
ORIGIN="https://$HOST"
SCOPE="$ORIGIN$BASE_PATH"

echo "==> Building the web app for $SCOPE"
( cd "$ROOT/app" && VITE_BASE="$BASE_PATH" npm run build )

echo "==> Writing twa-manifest.json"
mkdir -p "$OUT"
MANIFEST="$HERE/twa-manifest.json"
sed \
  -e "s|APP_ID|$APP_ID|g" \
  -e "s|\"host\": \"HOST\"|\"host\": \"$HOST\"|g" \
  -e "s|START_URL|$BASE_PATH|g" \
  -e "s|SCOPE_URL|$SCOPE|g" \
  -e "s|SHARE_TARGET_URL|${SCOPE}share-target|g" \
  -e "s|MANIFEST_URL|${SCOPE}manifest.webmanifest|g" \
  -e "s|MASKABLE_ICON_URL|${SCOPE}icons/icon-maskable-512.png|g" \
  -e "s|ICON_URL|${SCOPE}icons/icon-512.png|g" \
  -e "s|KEYSTORE_PATH|$KEYSTORE|g" \
  -e "s|KEYSTORE_ALIAS|$KEY_ALIAS|g" \
  -e "s|APP_VERSION_CODE|$VERSION_CODE|g" \
  -e "s|APP_VERSION|$VERSION|g" \
  "$HERE/twa-manifest.template.json" > "$MANIFEST"

echo "==> Bubblewrap"
# npx, so there is nothing global to keep up to date. The first run downloads
# the Android SDK build-tools and a JDK if it cannot find them, which is a
# few hundred megabytes and happens once.
( cd "$HERE" && npx --yes @bubblewrap/cli@latest build --skipPwaValidation )

echo "==> Digital Asset Links"
# Written into the build output, because that is what gets published. Note the
# path: assetlinks MUST be at the ORIGIN root, never under the app's base path.
# If the app is served from a sub-path (as it is on GitHub Pages), the file
# still has to be at https://host/.well-known/assetlinks.json — which is one
# more reason the APK's origin should serve the app at "/".
if [[ "$BASE_PATH" != "/" ]]; then
  echo "    note: the app is served under $BASE_PATH, but assetlinks must be at the origin root."
  echo "    Publish it yourself at https://$HOST/.well-known/assetlinks.json"
fi
mkdir -p "$ROOT/app/dist/.well-known"
if "$HERE/assetlinks.sh" --keystore "$KEYSTORE" --alias "$KEY_ALIAS" --app-id "$APP_ID" \
     > "$ROOT/app/dist/.well-known/assetlinks.json" 2>/dev/null; then
  echo "    wrote app/dist/.well-known/assetlinks.json"
else
  rm -f "$ROOT/app/dist/.well-known/assetlinks.json"
  echo "    could not read the keystore (wrong password?); run assetlinks.sh by hand"
fi

echo "==> Collecting output"
for artefact in app-release-signed.apk app-release-bundle.aab; do
  [[ -f "$HERE/$artefact" ]] && mv "$HERE/$artefact" "$OUT/"
done

echo
echo "APK:  $OUT/app-release-signed.apk"
echo
echo "Next, and this is the step that is easy to forget:"
echo "  1. Print the fingerprint of the key you just signed with:"
echo "       ./packaging/assetlinks.sh --keystore \"$KEYSTORE\" --alias \"$KEY_ALIAS\" --app-id \"$APP_ID\""
echo "  2. Publish the JSON it prints at https://$HOST/.well-known/assetlinks.json"
echo "  3. Only then install the APK. Without the file, Android shows the app"
echo "     inside a browser frame with a URL bar instead of full screen."
