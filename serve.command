#!/bin/bash
# serve.command — Galion 2.0
#
# Double-click in Finder (macOS): opens Terminal and starts the local
# dev server (engine/serve.py). The server supports PUT on .mathdown
# files under fiches/, which lets the editor's "Enregistrer" button
# write directly to disk. Leave the Terminal open while you work;
# Ctrl-C stops it.

cd "$(dirname "$0")"
exec python3 engine/serve.py
