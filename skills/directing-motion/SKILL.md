---
name: directing-motion
description: Use when making an animation, motion graphic, logo reveal, product shot, looping clip, launch video or GIF that is rendered from code (HTML/CSS, SVG, Canvas, WebGL/three.js, Remotion, GSAP, HyperFrames), when scoring one with synthesized sound, or when exporting one for X or another social feed.
---

# Directing motion

Code-rendered motion has two halves. Rendering is the easy one: drive every frame from `t`, capture
frame by frame, render 0..N-1. The hard half is direction. Every decision left open in the brief is
filled with the model's default look: dark backdrop, neon glow, purple-to-blue gradients, bloom,
sparkles, particles, a turntable spin, everything centered and moving at once. Replace each adjective
with a number before building, then review frames against those numbers.

## 1. Write the brief first

Before any code, write `brief.md` next to the piece with every slot filled. If the user gave a vague
request, fill the slots yourself from the subject and show the brief in your reply; don't stop to ask
unless GOAL is unknowable.

```
GOAL:    what the viewer should understand or feel, one sentence, about THIS subject
OUTPUT:  engine + version, W x H, file types
TIME:    seconds x fps = N frames; loop yes/no; BPM if cut to a beat (frames per beat)
LOOK:    background, palette in hex with ONE accent, typeface/weight/size, materials with values
LIGHT:   (3D) key / fill / rim: color, intensity, position
CAMERA:  (3D) lens or fov, path with frame ranges and easing; never parked, never a free spin
MOTION:  easings as cubic-bezier, springs as damping ratio + Hz, durations in frames
SHOTS:   frame ranges; ONE hero move each; how each shot hands off to the next
BANNED:  defaults this piece must not use (start from the list below)
QA:      the frames to still (every shot boundary and hit), numbers to measure
```

GOAL names what the subject does. A clip for a calendar app shows a week rearranging itself; a
headphone shot shows the cushion compress. Effects that would fit any subject do not serve GOAL.

Starting BANNED list: purple/blue gradients, glow and bloom halos, lens flares, decorative particles,
sparkles and dust, turntable spins, dark void backdrops, a centered stack of every element (one
centered hero is fine; give the rest a grid edge to align to), fade-and-slide-up on every element,
all elements entering at once, text that moves while being read. Keep one only if GOAL requires it,
and say why in the brief.

Numbers come from `references/numbers.md`: easing curves, spring ratios, durations, stagger,
beat grid, holds, the animation principles as frame counts, and translations for notes like "make
it pop".

## 2. Build to the render contract

- One self-contained page; libraries pinned to an exact version. Read that version's source for
  parameter names: options get renamed between releases and the old name is silently ignored.
- `window.renderAt(t)` draws exactly time `t` in seconds. CSS and Web Animations are frozen by the
  renderer. No `Date.now`, `performance.now`, timers, transitions or unseeded `Math.random`.
- No playback loop when `?t=` or `?render=` is in the URL. Set `window.__ready = true` after
  fonts, textures and models load.
- Loops: whole cycles of `t / loopSecs`; every spring at rest by frame N-1 or running through 0.

Copy this skill's `scripts/` folder into the project as `lab/` and work from the project directory.
The renderer must resolve the project's own `playwright`, and the page can then import
`./lab/motion.mjs` (easing, springs, beat frames, seeded RNG, loop phase as pure functions). The
`.mjs` extension lets Node scripts such as a sound score import the same timeline helpers
whatever `package.json` says about module type.
`lab/freeze.html` is the `?t=` snippet for opening one frame in a browser.

## 3. Render, look, fix

```bash
cp -r <this skill's directory>/scripts lab
npm i -D playwright && npx playwright install chromium   # install is a no-op if already cached
node lab/render.mjs anim.html --secs 6 --fps 60 --size 1080x1080 --frames 0,84,112,359 --out out/stills
node lab/render.mjs anim.html --secs 6 --fps 60 --size 1080x1080        # all frames -> out/frames
bash lab/contact-sheet.sh out/frames 24 5x3 out/contact.png
```

`render.mjs` serves the page over local http (module imports fail under `file://`), waits for
`window.__ready`, and prints page errors. `--scale 2` supersamples, `--subframes 4` adds motion
blur. For WebGL, render one frame with and without `--gl` and compare with `lab/diff.sh`; if they
match, use `--gl` (several times faster than software GL).

Stills first, at the frames QA names. Only render the whole clip once the stills match SHOTS.

Each review round, before changing code:

1. Describe each still in one sentence as a viewer would. Compare it with its line in SHOTS.
2. On the contact sheet, count what moves in each frame. More than one hero at a time is the most
   common failure; demote the rest (later, shorter travel) or cut it.
3. Check every BANNED item against the frames, including ones you added while fixing.
4. Run `bash lab/diff.sh <last>.png <first>.png` across the loop seam (frame N-1 against 0)
   and across every shot boundary: the changed box must contain only motion you planned. Small pops (a few dozen
   pixels) are invisible on a contact sheet and obvious in a loop.
5. Write notes as `frame 84: <what is wrong>: <the number that changes>`. Apply one or two per
   round. Re-render only the frames the notes name.

Two to four rounds is normal. Frame numbers make notes precise; "it feels off" is not a note.
Symptom-to-fix table: `references/fixes.md`.

## 4. Sound and export

Score after the picture is final, from frame numbers: each hit peaks 1 frame after its picture
event, 3 to 6 dB over the bed. Verify sync on the decoded file with
`node lab/hit-check.mjs out/final.mp4 --fps 60 --frames <hit frames>`, not by reasoning about
the source. Loudness, phone-band mix, muxing, loop seams, GIF/MP4 commands, motion blur and X
limits: `references/sound-and-export.md`.

## Engines

| Piece | Engine |
|---|---|
| One idea under ~10 s, 2D type and shapes | Plain HTML + CSS/SVG/Canvas |
| Anything 3D | three.js (pin the version) |
| Series, templates, data-driven or long video | Remotion (free for individuals and companies up to 3 people; larger companies need a license) |
| Timeline thinking in web pages | GSAP (free incl. former bonus plugins), or HyperFrames (Apache 2.0, HTML + GSAP → MP4) |
| Motion inside a live product UI | Not this skill; use the UI's own animation tooling |

## Common mistakes

| Mistake | Instead |
|---|---|
| Building before writing the brief | Brief first; it costs minutes and saves review rounds |
| A look from adjectives ("premium", "modern") | Hex values, roughness, light positions, fov |
| Subtle principles (a 4% squash) that vanish at phone size | Push key poses 10 to 30% past what feels right |
| Reviews that only catch bugs | Also check hierarchy, BANNED and SHOTS every round |
| Sound on the picture frame, or measured in the source WAV | 1 frame after, measured on the decoded MP4 |
