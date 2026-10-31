#!/usr/bin/env bash
# Renders the link previews and app icons used by the site.
set -euo pipefail
mkdir -p ../assets/og ../assets/icons
npx remotion still OgEn ../assets/og/en.png --image-format=png --log=error
npx remotion still OgSk ../assets/og/sk.png --image-format=png --log=error
npx remotion still AppIcon ../assets/icons/icon-512.png --image-format=png --log=error
npx remotion still AppIcon ../assets/icons/apple-touch-icon.png --scale=0.3515625 --image-format=png --log=error
npx remotion still AppIcon ../assets/icons/favicon-32.png --scale=0.0625 --image-format=png --log=error
