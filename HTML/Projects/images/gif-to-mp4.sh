#!/usr/bin/env bash
# Run this from inside HTML/Projects/images/ (or anywhere - it always operates
# relative to its own location). For every project subfolder, converts each
# .gif to a same-named, web-friendly .mp4 (muted, even dimensions, faststart)
# and deletes the source .gif once its .mp4 is confirmed non-empty.
#
# Requires ffmpeg. Deletes originals - make sure your local backups are in
# place before running, per your own note that you have them.

set -u

command -v ffmpeg >/dev/null 2>&1 || {
  echo "ffmpeg not found - install it first." >&2
  exit 1
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

shopt -s nullglob nocaseglob

converted=0
failed=0

for dir in "$script_dir"/*/; do
  cd "$dir"
  for gif in *.gif; do
    [ -e "$gif" ] || continue
    name="${gif%.*}"
    mp4="${name}.mp4"
    echo "Converting: ${dir#"$script_dir"/}$gif -> ${dir#"$script_dir"/}$mp4"
    if ffmpeg -y -loglevel error -i "$gif" \
      -movflags faststart -pix_fmt yuv420p \
      -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
      -an "$mp4"; then
      if [ -s "$mp4" ]; then
        rm "$gif"
        converted=$((converted + 1))
      else
        echo "  Warning: $mp4 came out empty, keeping original $gif" >&2
        failed=$((failed + 1))
      fi
    else
      echo "  Failed to convert $gif, keeping original" >&2
      failed=$((failed + 1))
    fi
  done
done

echo ""
echo "Done. Converted: $converted, Failed: $failed"
