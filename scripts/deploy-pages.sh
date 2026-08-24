#!/usr/bin/env bash
# Publish the English YC demo to GitHub Pages site root.
# After renaming the repo to "Sonique", the public URL is:
#   https://elodieybs.github.io/Sonique/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npm run build:v2-en

DIST="$ROOT/dist-v2-en"
REDIRECT='<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta http-equiv="refresh" content="0;url=../"/><title>Redirecting…</title><script>location.replace("../"+location.search+location.hash)</script></head><body><p><a href="../">Continue to Sonique</a></p></body></html>'

mkdir -p "$DIST/yc" "$DIST/live"
printf '%s\n' "$REDIRECT" > "$DIST/yc/index.html"
printf '%s\n' "$REDIRECT" > "$DIST/live/index.html"

npx gh-pages -d dist-v2-en

echo "Published. Target URL after repo rename: https://elodieybs.github.io/Sonique/"
echo "Current URL until rename: https://elodieybs.github.io/Sonique-app-/"
