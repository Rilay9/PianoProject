"""
The laptop as the app's origin (P19 A11, `00` D25).

`packaging/serve-lan.py` is the whole delivery route now: the phone installs
from this laptop over HTTPS and never needs it again until an update. Two of
its details are the kind that fail silently on a phone and are invisible on a
desktop — a `.webmanifest` served as the wrong type stops Chrome offering the
install at all, and `sw.js` without `Service-Worker-Allowed` cannot control the
origin — so they are pinned here rather than discovered on the S25.

The certificate is made with `openssl` into a temporary directory; the test
skips itself when there is no `openssl`, because a test that cannot run is
better than a certificate committed to the repository.
"""
from __future__ import annotations

import http.client
import shutil
import socket
import ssl
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]

OPENSSL = shutil.which("openssl")


def load_serve_lan():
    """`serve-lan.py` has a hyphen in it, so it is loaded by path, not imported."""
    import importlib.util

    path = REPO_ROOT / "packaging" / "serve-lan.py"
    spec = importlib.util.spec_from_file_location("serve_lan", path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules["serve_lan"] = module
    spec.loader.exec_module(module)
    return module


def free_port() -> int:
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return int(probe.getsockname()[1])


@unittest.skipIf(OPENSSL is None, "openssl is not on PATH; cannot make a throwaway certificate")
class TestServeLan(unittest.TestCase):
    server: object
    thread: threading.Thread
    port: int
    root: Path

    @classmethod
    def setUpClass(cls) -> None:
        serve_lan = load_serve_lan()
        cls.serve_lan = serve_lan
        cls.tmp = tempfile.TemporaryDirectory()
        cls.root = Path(cls.tmp.name)
        site = cls.root / "dist"
        (site / "assets").mkdir(parents=True)
        (site / "index.html").write_text("<!doctype html><title>PianoPath</title>", encoding="utf-8")
        (site / "sw.js").write_text("// service worker", encoding="utf-8")
        (site / "manifest.webmanifest").write_text('{"name":"PianoPath"}', encoding="utf-8")
        (site / "assets" / "app-abc123.js").write_text("export default 1;", encoding="utf-8")
        (site / "score.mxl").write_bytes(b"PK\x03\x04 not really a zip")

        cert = cls.root / "cert.pem"
        key = cls.root / "key.pem"
        subprocess.run(
            [
                OPENSSL, "req", "-x509", "-newkey", "rsa:2048", "-nodes",
                "-keyout", str(key), "-out", str(cert),
                "-days", "1", "-subj", "/CN=localhost",
            ],
            check=True,
            capture_output=True,
        )

        from functools import partial
        from http.server import ThreadingHTTPServer

        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(str(cert), str(key))
        handler = partial(serve_lan.AppHandler, directory=str(site))
        cls.port = free_port()
        server = ThreadingHTTPServer(("127.0.0.1", cls.port), handler)
        server.socket = context.wrap_socket(server.socket, server_side=True)
        cls.server = server
        cls.thread = threading.Thread(target=server.serve_forever, daemon=True)
        cls.thread.start()
        # Give the accept loop a moment; the first connection otherwise races it.
        time.sleep(0.1)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()  # type: ignore[attr-defined]
        cls.server.server_close()  # type: ignore[attr-defined]
        cls.thread.join(timeout=5)
        cls.tmp.cleanup()

    def connect(self) -> http.client.HTTPSConnection:
        insecure = ssl._create_unverified_context()  # noqa: SLF001 — a throwaway self-signed cert
        return http.client.HTTPSConnection("127.0.0.1", self.port, context=insecure, timeout=10)

    def get(self, path: str) -> http.client.HTTPResponse:
        connection = self.connect()
        self.addCleanup(connection.close)
        connection.request("GET", path)
        response = connection.getresponse()
        response.read()
        return response

    def test_it_serves_the_app(self) -> None:
        response = self.get("/index.html")
        self.assertEqual(response.status, 200)
        self.assertIn("text/html", response.headers["Content-Type"])

    def test_the_manifest_type_chrome_needs_to_offer_an_install(self) -> None:
        # Served as anything else, Chrome quietly does not offer "Add to Home
        # screen" and there is no error to see.
        response = self.get("/manifest.webmanifest")
        self.assertEqual(response.headers["Content-Type"], "application/manifest+json")

    def test_a_score_is_not_served_as_a_generic_download(self) -> None:
        response = self.get("/score.mxl")
        self.assertEqual(response.headers["Content-Type"], "application/vnd.recordare.musicxml")

    def test_the_service_worker_may_control_the_whole_origin(self) -> None:
        response = self.get("/sw.js")
        self.assertEqual(response.headers["Service-Worker-Allowed"], "/")
        self.assertIn("text/javascript", response.headers["Content-Type"])

    def test_the_shell_is_re_checked_and_hashed_assets_are_not(self) -> None:
        # The rule that decides whether a rebuilt app is visible to a phone
        # that already has the old one.
        self.assertEqual(self.get("/index.html").headers["Cache-Control"], "no-cache")
        self.assertEqual(self.get("/sw.js").headers["Cache-Control"], "no-cache")
        self.assertEqual(
            self.get("/assets/app-abc123.js").headers["Cache-Control"],
            "public, max-age=31536000, immutable",
        )

    def test_one_connection_serves_many_requests(self) -> None:
        # The first launch fetches about 1,600 files. At HTTP/1.0 each one is a
        # fresh TLS handshake over Wi-Fi, which is the difference between a
        # minute and ten.
        connection = self.connect()
        self.addCleanup(connection.close)
        for _ in range(3):
            connection.request("GET", "/index.html")
            response = connection.getresponse()
            response.read()
            self.assertEqual(response.status, 200)
            self.assertNotEqual(response.headers.get("Connection", "").lower(), "close")
        self.assertEqual(response.version, 11)

    def test_a_missing_file_is_a_404_and_not_a_crash(self) -> None:
        self.assertEqual(self.get("/nope.js").status, 404)


class TestServeLanRefusals(unittest.TestCase):
    """The two ways to run it wrong, both of which must say what to do."""

    def test_it_refuses_a_directory_with_no_app_in_it(self) -> None:
        serve_lan = load_serve_lan()

        with tempfile.TemporaryDirectory() as tmp:
            code = serve_lan.main(["--dir", tmp])
            self.assertEqual(code, 2)

    def test_it_refuses_when_the_certificate_is_missing(self) -> None:
        serve_lan = load_serve_lan()

        with tempfile.TemporaryDirectory() as tmp:
            site = Path(tmp)
            (site / "index.html").write_text("<!doctype html>", encoding="utf-8")
            code = serve_lan.main(
                ["--dir", str(site), "--cert", str(site / "none.pem"), "--key", str(site / "none.key")]
            )
            self.assertEqual(code, 2)


if __name__ == "__main__":  # pragma: no cover
    unittest.main()
