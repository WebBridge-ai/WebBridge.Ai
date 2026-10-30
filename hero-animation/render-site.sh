#!/usr/bin/env bash
# Renders the hero videos and posters used by the site into ../assets/hero/<lang>.
# Files are swapped in only when everything has rendered.
set -euo pipefail
tmp=$(mktemp -d)
common=(--codec=h264 --crf=20 --scale=1.5 --x264-preset=slow --pixel-format=yuv420p --jpeg-quality=95 --muted --log=error)
for variant in "HeroWideEn wide en" "HeroTallEn tall en" "HeroWideSk wide sk" "HeroTallSk tall sk"; do
  read -r id name lang <<<"$variant"
  out="$tmp/$lang"
  mkdir -p "$out"
  npx remotion render "$id" "$out/$name-intro.mp4" --frames=0-59 "${common[@]}"
  npx remotion render "$id" "$out/$name-loop.mp4" --frames=60-1139 "${common[@]}"
  npx remotion still "$id" "$out/$name-poster.jpg" --frame=750 --scale=1.5 --image-format=jpeg --jpeg-quality=85 --log=error
done
mkdir -p ../assets/hero
for lang in en sk; do
  rm -rf "../assets/hero/$lang"
  mv "$tmp/$lang" "../assets/hero/$lang"
done
rm -rf "$tmp"
