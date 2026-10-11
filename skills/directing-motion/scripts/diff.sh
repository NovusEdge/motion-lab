#!/usr/bin/env bash
# Pixels that differ between two frames, and the box around them.
#   bash diff.sh out/frames/0359.png out/frames/0000.png [threshold 0-255, default 8]
# Seam check: frame N-1 against frame 0 should differ only where motion is expected.
# A rerender of the same frame should report 0.
set -euo pipefail
a=$1 b=$2 thr=${3:-8}
IFS=x read -r w h < <(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=s=x:p=0 "$a")
out=$(ffmpeg -hide_banner -i "$a" -i "$b" -filter_complex \
  "blend=all_mode=difference,format=gray,geq=lum='gt(lum(X\,Y)\,$thr)*255',signalstats,\
metadata=print:key=lavfi.signalstats.YAVG,bbox=min_val=128" -f null - 2>&1)
avg=$(grep -o 'YAVG=[0-9.]*' <<<"$out" | cut -d= -f2)
box=$(grep -o 'x1:[0-9]* x2:[0-9]* y1:[0-9]* y2:[0-9]*' <<<"$out" || true)
awk -v a="$avg" -v w="$w" -v h="$h" 'BEGIN { printf "changed pixels: %d of %d\n", a / 255 * w * h + 0.5, w * h }'
echo "box: ${box:-none}"
