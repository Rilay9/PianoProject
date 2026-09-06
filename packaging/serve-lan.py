#!/usr/bin/env python3
"""
Serves the built app over HTTPS on the house Wi-Fi, so the phone can install it.

docs/00 D25. A Trusted Web Activity — and Chrome's "Add to Home screen" — need an HTTPS
address to load the app from. After the first launch the service worker holds
everything and the address is never needed again except for an update, so the
address can be this laptop, switched on only when installing or updating.

Chrome only counts an origin as secure if it trusts the certificate. A
self-signed one fails that test: the TWA shows a URL bar and Web MIDI may
refuse. So the certificate comes from **mkcert**, whose root certificate is
installed once on the phone (`docs/OWNER-GUIDE.md` §1). The certificate files
live in `packaging/lan/`, which is gitignored: they are yours and never
committed.

    py -3.11 packaging/serve-lan.py                 # serves app/dist on https://<this laptop>/
    py -3.11 packaging/serve-lan.py --port 8443     # any port for Add-to-Home-screen; the APK needs 443

Nothing here is specific to this app except the MusicXML MIME types and the
cache headers that let the phone notice an update.
"""
from __future__ import annotations

import argparse
import mimetypes
import socket
import ssl
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DIR = REPO_ROOT / "app" / "dist"
LAN_DIR = REPO_ROOT / "packaging" / "lan"
DEFAULT_CERT = LAN_DIR / "cert.pem"
DEFAULT_KEY = LAN_DIR / "key.pem"

#: Types Python's table does not know, or knows wrongly on Windows. A `.mxl`
#: served as `application/octet-stream` still works, but a `.webmanifest` served
#: as anything but `application/manifest+json` stops Chrome offering the install.
MIME_TYPES = {
    ".mxl": "application/vnd.recordare.musicxml",
    ".musicxml": "application/vnd.recordare.musicxml+xml",
    ".webmanifest": "application/manifest+json",
    ".json": "application/json",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".wasm": "application/wasm",
    ".md": "text/markdown; charset=utf-8",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".sf2": "application/octet-stream",
}


class AppHandler(SimpleHTTPRequestHandler):
    """Static files with the right types and update-friendly caching."""

    # HTTP/1.1 keeps the connection open between requests. The first launch
    # precaches about 1,600 files; at HTTP/1.0 every one of them would be a
    # fresh TLS handshake, which on a phone over Wi-Fi is the difference
    # between a minute and ten.
    protocol_version = "HTTP/1.1"

    def guess_type(self, path: str) -> str:  # noqa: D102 — stdlib name
        suffix = Path(path).suffix.lower()
        return MIME_TYPES.get(suffix) or super().guess_type(path)

    def end_headers(self) -> None:  # noqa: D102 — stdlib name
        # Hashed assets never change under the same name; everything else —
        # index.html, sw.js, the manifest, the content — must be re-checked, or
        # a rebuilt app is invisible to a phone that cached the old shell.
        if "/assets/" in self.path:
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            self.send_header("Cache-Control", "no-cache")
        # A service worker registered from `/sw.js` may control the whole origin.
        if self.path.endswith("/sw.js"):
            self.send_header("Service-Worker-Allowed", "/")
        super().end_headers()

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002 — stdlib name
        # One short line per request; the default prints the client's address
        # twice and the HTTP version, which nobody reading a phone install needs.
        sys.stderr.write(f"  {self.address_string()}  {format % args}\n")


def lan_addresses() -> list[str]:
    """Every IPv4 address this machine has that a phone on the same Wi-Fi could reach."""
    found: list[str] = []
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            address = info[4][0]
            if not address.startswith(("127.", "169.254.")) and address not in found:
                found.append(address)
    except socket.gaierror:
        pass
    return found


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dir", type=Path, default=DEFAULT_DIR, help="the built app (default app/dist)")
    parser.add_argument("--port", type=int, default=443, help="443 for the APK; anything for Add to Home screen")
    parser.add_argument("--bind", default="0.0.0.0")
    parser.add_argument("--cert", type=Path, default=DEFAULT_CERT)
    parser.add_argument("--key", type=Path, default=DEFAULT_KEY)
    args = parser.parse_args(argv)

    if not (args.dir / "index.html").is_file():
        print(
            f"{args.dir} has no index.html. Build first:\n"
            "  py -3.11 tools/content/build.py --offline --personal\n"
            "  cd app && set VITE_BASE=/ && npm run build:app",
            file=sys.stderr,
        )
        return 2
    if not args.cert.is_file() or not args.key.is_file():
        print(
            f"No certificate at {args.cert} / {args.key}.\n"
            "Make one once, for this laptop's address (docs/OWNER-GUIDE.md §1):\n"
            f"  mkcert -cert-file {DEFAULT_CERT} -key-file {DEFAULT_KEY} <this laptop's IP> localhost",
            file=sys.stderr,
        )
        return 2

    for suffix, mime in MIME_TYPES.items():
        mimetypes.add_type(mime, suffix)

    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(str(args.cert), str(args.key))
    handler = partial(AppHandler, directory=str(args.dir))
    try:
        server = ThreadingHTTPServer((args.bind, args.port), handler)
    except OSError as error:
        hint = " (something else is on that port — try --port 8443 for Add to Home screen)" if args.port == 443 else ""
        print(f"could not listen on {args.bind}:{args.port}: {error}{hint}", file=sys.stderr)
        return 2
    server.socket = context.wrap_socket(server.socket, server_side=True)

    port = "" if args.port == 443 else f":{args.port}"
    print(f"serving {args.dir} over HTTPS. On the phone, open one of:")
    for address in lan_addresses() or ["<this laptop's IP>"]:
        print(f"  https://{address}{port}/")
    print("Stop with Ctrl+C. The phone only needs this while installing or updating.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
