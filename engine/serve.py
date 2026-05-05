#!/usr/bin/env python3
"""
Galion 2.0 — local development server.

Same behaviour as `python3 -m http.server` for GET requests, plus PUT
support for .mathdown files inside fiches/. The PUT endpoint lets the
Mathdown editor's "Enregistrer" button save changes directly to disk
instead of triggering a download.

Security: localhost-only by default; PUT is restricted to .mathdown
files under the fiches/ directory of the repo root, no path traversal.
"""

import http.server
import os
import socketserver
import sys
import threading
import time
import webbrowser
from pathlib import Path
from urllib.parse import unquote

# This file lives in engine/. The repo root is its parent.
ROOT = Path(__file__).resolve().parent.parent
FICHES_DIR = (ROOT / "fiches").resolve()


class MathdownHandler(http.server.SimpleHTTPRequestHandler):
    # Quieter log lines (default prints every request including 304s)
    def log_message(self, fmt, *args):
        sys.stdout.write("%s - %s\n" % (self.address_string(), fmt % args))
        sys.stdout.flush()

    def do_PUT(self):
        rel = unquote(self.path).lstrip("/")
        try:
            target = (ROOT / rel).resolve()
        except Exception as exc:
            self.send_error(400, f"Bad path: {exc}")
            return

        # Only allow writes inside fiches/, only on .mathdown files.
        try:
            target.relative_to(FICHES_DIR)
        except ValueError:
            self.send_error(403, "PUT only allowed under fiches/")
            return
        if target.suffix != ".mathdown":
            self.send_error(403, "PUT only allowed on .mathdown files")
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            data = self.rfile.read(length)
            target.write_bytes(data)
            self.send_response(204)
            self.end_headers()
        except Exception as exc:
            self.send_error(500, f"Write failed: {exc}")


def find_free_port(start: int = 8000, end: int = 8100) -> int:
    import socket
    for p in range(start, end + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("localhost", p))
                return p
            except OSError:
                continue
    raise RuntimeError(f"No free port between {start} and {end}")


def open_browser_when_ready(url: str) -> None:
    time.sleep(0.5)
    try:
        webbrowser.open(url)
    except Exception:
        pass


def main() -> None:
    os.chdir(ROOT)
    port = find_free_port()
    url = f"http://localhost:{port}/"

    print("Galion 2.0")
    print(f"  → {url}")
    print("  PUT activé pour fiches/*.mathdown — bouton « Enregistrer » dans l'éditeur.")
    print("  Ctrl-C pour arrêter.\n")

    threading.Thread(target=open_browser_when_ready, args=(url,), daemon=True).start()
    with socketserver.ThreadingTCPServer(("localhost", port), MathdownHandler) as srv:
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            print("\nArrêt.")


if __name__ == "__main__":
    main()
