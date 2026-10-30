#!/usr/bin/env bash
# Renders the hero videos and posters used by the site into ../assets/hero.
set -euo pipefail
out=../assets/hero
mkdir -p "$out"
common=(--codec=h264 --crf=23 --x264-preset=slow --pixel-format=yuv420p --jpeg-quality=95 --muted --log=error)
for variant in "HeroWide wide 1" "HeroTall tall 0.75"; do
  read -r id name scale <<<"$variant"
  npx remotion render "$id" "$out/$name-intro.mp4" --frames=0-119 --scale="$scale" "${common[@]}"
  npx remotion render "$id" "$out/$name-loop.mp4" --frames=120-479 --scale="$scale" "${common[@]}"
  npx remotion still "$id" "$out/$name-poster.jpg" --frame=300 --scale="$scale" --image-format=jpeg --jpeg-quality=85 --log=error
done
