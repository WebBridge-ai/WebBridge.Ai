#!/usr/bin/env bash
# Renders the hero videos and posters used by the site into ../assets/hero.
set -euo pipefail
out=../assets/hero
mkdir -p "$out"
common=(--codec=h264 --crf=23 --x264-preset=slow --pixel-format=yuv420p --jpeg-quality=95 --muted --log=error)
for variant in "HeroWide wide" "HeroTall tall"; do
  read -r id name <<<"$variant"
  npx remotion render "$id" "$out/$name-intro.mp4" --frames=0-59 "${common[@]}"
  npx remotion render "$id" "$out/$name-loop.mp4" --frames=60-959 "${common[@]}"
  npx remotion still "$id" "$out/$name-poster.jpg" --frame=620 --image-format=jpeg --jpeg-quality=85 --log=error
done
