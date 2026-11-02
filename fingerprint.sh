#!/bin/sh
# Adds ?v=<content hash> to every local CSS, JS and asset address, so a changed
# file gets a new address and nginx can let browsers cache files for a year.
# Runs in the Docker build; the files in the repo stay untouched.
set -eu
cd /usr/share/nginx/html
pages="$(find . -name "*.html") /usr/share/nginx/errors/404.html /usr/share/nginx/errors/404-sk.html"

stamp() { # file, files that reference it
    file=$1
    shift
    v=$(sha256sum "$file" | cut -c1-10)
    path=$(printf '%s' "$file" | sed 's/\./\\./g')
    # Only whole addresses: the path has to end at a quote or a closing bracket.
    sed -i "s#\($path\)\([\"')]\)#\1?v=$v\2#g" "$@"
}

# Assets first, because the stylesheet and scripts change when their addresses do.
for file in $(find assets -type f); do
    stamp "$file" $pages css/style.css js/*.js
done

# main.js builds the hero video addresses at runtime, so they share one hash of all videos.
v=$(cat assets/hero/*/*.mp4 | sha256sum | cut -c1-10)
sed -i "s#\.mp4\`#.mp4?v=$v\`#" js/main.js

for file in css/style.css js/*.js; do
    stamp "$file" $pages
done
