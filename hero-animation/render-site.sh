#!/usr/bin/env bash
# Renders the hero videos and posters used by the site into ../assets/hero/<lang>.
set -euo pipefail
common=(--codec=h264 --crf=23 --x264-preset=slow --pixel-format=yuv420p --jpeg-quality=95 --muted --log=error)
for variant in "HeroWideEn wide en" "HeroTallEn tall en" "HeroWideSk wide sk" "HeroTallSk tall sk"; do
  read -r id name lang <<<"$variant"
  out="../assets/hero/$lang"
  mkdir -p "$out"
  npx remotion render "$id" "$out/$name-intro.mp4" --frames=0-59 "${common[@]}"
  npx remotion render "$id" "$out/$name-loop.mp4" --frames=60-1139 "${common[@]}"
  npx remotion still "$id" "$out/$name-poster.jpg" --frame=750 --image-format=jpeg --jpeg-quality=85 --log=error
done
