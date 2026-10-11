# Motion Lab

A Claude Code skill for animation rendered from code: logo loops, product shots, launch clips
and GIFs built in HTML/CSS, Canvas, three.js, Remotion or GSAP, captured frame by frame and
exported for social posts.

Claude already renders such pieces correctly. It drives frames from time, captures them exactly
and keeps loops seamless. What it lacks without direction is taste. Unspecified choices fall back to
one look: a dark void, neon glow, purple-to-blue gradients, bloom, sparkles, a turntable spin.
The `directing-motion` skill makes Claude write a numeric brief before building, ban those
defaults by name, keep one hero move per shot, and review rendered frames by frame number.

## Install

```bash
/plugin marketplace add NovusEdge/motion-lab
/plugin install motion-lab@motion-lab
```

Restart Claude Code. The skill loads when you ask for an animation, or explicitly with
`/motion-lab:directing-motion`.

To use it without the plugin system, copy `skills/directing-motion` into `~/.claude/skills/`.

The render scripts need Node 18+, ffmpeg, and Playwright with Chromium in the project
(`npm i -D playwright && npx playwright install chromium`).

## What's inside

| Path | Contents |
|---|---|
| `SKILL.md` | The brief template, starting ban list, render contract, review loop, engine choice |
| `references/numbers.md` | Easing curves, spring damping ratios, durations, stagger, beat grid, holds, animation principles as frame counts |
| `references/fixes.md` | Symptom → cause → fix for flicker, seams, fonts, WebGL, silent parameter renames, audio |
| `references/sound-and-export.md` | Scoring to frame numbers, measuring sync and loudness, loop rules, MP4/GIF commands, motion blur, X upload limits |
| `scripts/render.mjs` | Frame-exact capture with Playwright: stills or full runs, supersampling, GPU, motion-blur subframes |
| `scripts/contact-sheet.sh` | One image of every Nth frame, stamped with frame numbers |
| `scripts/diff.sh` | Changed pixels and their bounding box between two frames, for seams and shot boundaries |
| `scripts/hit-check.mjs` | Where each sound hit peaks in the decoded file, against its target frame |
| `scripts/motion.mjs` | Pure-time helpers: cubic-bezier, springs, beat frames, seeded RNG, loop phase |
| `scripts/freeze.html` | `?t=2.5` snippet to open any single frame in a browser |

## Example

> Make a 6-second seamless loop for my CLI tool's launch post. Square MP4 and GIF.

Claude writes `brief.md` first (goal, timing, palette in hex, easing and springs as numbers, a
shot list with one hero move per shot, a ban list), renders stills at the shot boundaries,
reviews them against the brief, and only then renders and exports the whole clip.

## Credits

The approach follows [@flxrnc's motion lab write-up](https://x.com/flxrnc/status/2105311836190978392),
which published every prompt and follow-up behind three Opus-made animations. Values here were
rechecked against primary sources (easings.net, three.js source, Remotion and react-spring docs,
Material 3, WCAG, X's media docs) in October 2026. Where the write-up and the sources disagreed,
the skill follows the sources.

## License

MIT
