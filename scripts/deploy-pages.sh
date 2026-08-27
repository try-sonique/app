#!/usr/bin/env bash
# Publish the compiled app to the gh-pages branch.
# Public URL: https://try-sonique.github.io/app/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VITE_BASE=/app/ VITE_THEME_MODE=noir npm run build:noir

DIST="$ROOT/dist-noir"
touch "$DIST/.nojekyll"
cp "$DIST/index.html" "$DIST/404.html"

npx gh-pages -d dist-noir --dotfiles

echo "Published: https://try-sonique.github.io/app/"
