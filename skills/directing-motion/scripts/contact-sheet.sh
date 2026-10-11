#!/usr/bin/env bash
# One image of every Nth frame, each stamped with its frame number, for reviewing a whole clip.
#   bash contact-sheet.sh out/frames 12 4x3 out/contact.png
set -euo pipefail
dir=${1:-out/frames} every=${2:-12} grid=${3:-4x3} out=${4:-out/contact.png}
# drawtext runs before select, so %{n} is the source frame index, not the tile index.
ffmpeg -v error -y -framerate 60 -i "$dir/%04d.png" -vf \
  "drawtext=text='%{n}':x=12:y=12:fontsize=36:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=6,\
select='not(mod(n\,$every))',scale=480:-1,tile=$grid:padding=4" \
  -frames:v 1 "$out"
echo "$out"
