# Sound, loops and export

## Sound

The feed autoplays muted, so the picture must work silent. Add sound after the picture is final.

Score from frame numbers, since the model cannot listen. Write the cue list against the
picture's events, then synthesize every sound in code (Web Audio `OfflineAudioContext`, or any
DSP you can run offline). No samples means nothing to license and nothing to download.

- **Sync:** each hit's waveform peak lands 1 frame after its picture event. Light reaches us
  before sound, so sound slightly late reads as natural; sound early reads as wrong.
- **Peaks on time:** start tonal bodies in cosine phase with a 0.5 to 1 ms attack, so the first
  peak is on the target sample. A waveshaper, compressor or sine started at phase 0 moves the
  peak 2 to 10 ms late.
- **Hits over the bed:** each hit 3 to 6 dB above the bed around it. Measure it as the K-weighted
  loudness of the 60 ms from the hit, rendered once with the hit and once with it muted; the
  difference is the hit's lift. Less and it disappears on a phone; more and it clips the limiter.
- **Duck the bed:** a 3 to 5 dB dip in the bed for about 80 ms around each hit lets a hit stay
  in the 3 to 6 dB range while still owning the largest crest at its moment.
- **Phone band:** phone speakers play little under about 150 Hz. If most of the mix's energy
  sits under 60 Hz, the clip is silent on a phone. Move bass up an octave, brighten the pad.
- **Loudness:** about -14 LUFS integrated is a common web-video target, with true peak at
  -1 dBTP on the decoded file. AAC can raise the true peak by about 1 dB, so limit the master
  WAV around -2 dBTP.
- **Seamless audio loop:** the last sample flows into the first. For a single-play MP4, a 2 ms
  raised-cosine fade on the first and last samples avoids a click where the codec pads.

### Measure, don't listen

```bash
# Where each hit actually peaks in the decoded file (codec delay included)
node lab/hit-check.mjs out/final.mp4 --fps 60 --frames 84,112,200,337

# Integrated loudness and true peak
ffmpeg -hide_banner -i out/final.mp4 -af ebur128=peak=true -f null - 2>&1 | tail -12
```

Offsets within ±1 ms of the target are on time. A hit reporting `-inf` was not found within
±25 ms: it is missing or badly late. A late offset with the same value in the source WAV is a
mix problem: the bed or an earlier hit's ring has a bigger crest than the hit's attack. Duck the
bed, add a short broadband click (a 0.5 ms Hann pulse) at the attack, or shorten the ring;
don't just shift the hit earlier. A late offset only in the MP4 is codec delay.

A peak-to-loudness ratio under about 12 dB leaves no room for -14 LUFS at -2 dBTP. If the mix
can't reach both, lower the bed rather than limiting the hits harder.

### Mux

```bash
ffmpeg -i out/anim.mp4 -i out/score.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k \
  -shortest -movflags +faststart out/final.mp4
```

To mix separate music and effects stems and normalize in one pass:
`-filter_complex "[1:a][2:a]amix=inputs=2:duration=first,loudnorm=I=-14:TP=-1:LRA=11[a]"`.
`loudnorm` in one pass is dynamic; for exact numbers render the mix to the target yourself.

## Loops

- A loop of N frames renders frames 0 to N-1. Frame N equals frame 0; rendering it shows that
  pose twice and the seam stutters.
- Drive periodic motion from `phase = t / loopSecs` with whole numbers of cycles: a square that
  turns 90° per loop, a wave that completes exactly 2 cycles.
- Noise loops when sampled along a circle: `noise(cos(2πφ)·r, sin(2πφ)·r)`.
- Springs and settles that cross the seam must be at rest at frame 0, or start their motion
  in frame N-1's state (a wobble running through frame 0).
- Frame 0 is a finished composition. It is the poster frame while the file loads.
- Check the seam on video, not stills:
  `ffmpeg -stream_loop 2 -i out/anim.mp4 -c copy out/loop3.mp4` and step across each join.

## Frames to files

```bash
# MP4: H.264 High, yuv420p, plays before fully downloaded
ffmpeg -framerate 60 -i out/frames/%04d.png -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf 18 -movflags +faststart out/anim.mp4

# GIF: one palette for the whole clip so colors don't flicker frame to frame
ffmpeg -framerate 24 -i out/frames/%04d.png -vf "scale=1080:-1:flags=lanczos,split[a][b];\
[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
  -loop 0 out/anim.gif
```

GIF delays are stored in hundredths of a second. ffmpeg alternates 40 and 50 ms delays so a
24 fps GIF keeps exact total time; a tool that writes one fixed 40 ms delay runs 4% fast.
25 or 50 fps divide evenly and avoid the question.

GIF has 256 colors per frame: smooth gradients band. Prefer flat color in pieces meant as GIF,
or dither.

### Motion blur

`node lab/render.mjs anim.html --subframes 4` renders 4 subframes spread over the first
half of each frame (a 180° shutter) and prints the ffmpeg `tmix` command that averages each
group into one frame. Fast moves smear instead of strobing. `tmix` blends gamma-encoded values,
so bright edges blur slightly dark; for exact results, average in linear light in your own code.

## Canvas sizes

| Aspect | Size |
|---|---|
| 1:1 | 1080 × 1080 |
| 4:5 | 1080 × 1350 |
| 9:16 | 1080 × 1920 |
| 16:9 | 1920 × 1080 |

Choose before the first frame. A canvas change later means redirecting every shot.

## X (Twitter) limits

From the X API media best-practices page (docs.x.com/x-api/media/quickstart/best-practices),
checked October 2026:

| | GIF | Video |
|---|---|---|
| File size | ≤ 15 MB | |
| Dimensions | ≤ 1280 × 1080 | 32 × 32 to 1280 × 1024 via the API |
| Frames / rate | ≤ 350 frames, and width × height × frames ≤ 300 million | ≤ 60 fps |
| Format | | H.264 High profile, yuv420p, AAC-LC audio |
| Aspect ratio | | 1:3 to 3:1 |

A 1080 × 1080 video is over the API's 1024 height. For an API upload, scale the export to
1024 × 1024 (`-vf scale=1024:1024:flags=lanczos`). The X apps accept larger video than the API
page lists; check help.x.com before an export that depends on an app limit. At 24 fps the
350-frame GIF cap allows about 14.5 s.
