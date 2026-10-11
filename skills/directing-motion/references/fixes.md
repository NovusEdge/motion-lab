# Failures and fixes

| Symptom | Cause | Fix |
|---|---|---|
| Frames differ between two renders of the same t | Clock, timer or unseeded random in the draw path | Every value a function of t. `rng(seed)` from `motion.mjs`. No `Date.now`, `performance.now`, `setTimeout`, CSS transitions |
| Shapes jitter frame to frame | `Math.random()` called per frame | Seed once, or derive per-object values from a seeded RNG at setup |
| Stutter at the loop seam | Frame N rendered, or a motion with a fractional number of cycles | Render 0..N-1. Whole cycles of `loopPhase(t, secs)` |
| Pop at the seam | A spring or settle not at rest by frame N-1 | End every spring before the loop end, or run it through frame 0 |
| Edges pop at a transition's end | Both layers drawn when the transition sits at 0 or 1, so antialiased edges composite twice | Draw exactly one layer at progress 0 and 1. `lab/diff.sh` across the boundary shows it |
| Every frame identical | `renderAt` missing or never ran; the page plays on its own clock | Expose `window.renderAt(t)`; don't start rAF when `?t=` or `?render=` is set |
| Page renders without its script | Opened as `file://`: Chromium blocks module imports and `fetch` | Serve over http. `render.mjs` does this |
| Fallback font in early frames | Capture started before the web font loaded | `display=block`, await `document.fonts.ready`, set `window.__ready` |
| Black or blank WebGL frames | Texture, model or font not loaded at capture | Set `window.__ready = true` only after every asset resolves |
| Wrong library parameter, silently ignored | Option renamed or removed between versions (three.js `TextGeometry` reads `height` up to r162, `depth` from r163, and current releases ignore `height`; r186 falls back from `PCFSoftShadowMap` to PCF with only a console warning) | Pin the version and read that version's source for parameter names. `render.mjs` prints console errors; read them |
| Dropped frames in a live preview | Animating width, height, top or left | Animate transform and opacity. Irrelevant to frame capture, which never drops frames |
| Banding in the GIF | Gradients in 256 colors | Flat color, or dither the palette |
| Text shimmers while still | Subpixel positions on resting text | Snap resting text to whole pixels; render at `--scale 2` and downscale |
| Text moves before it can be read | Hold too short | 0.3 s per word + 0.5 s |
| Everything moves at once | No hierarchy | One hero; others 150 ms later at 60% travel |
| Sound hits sound late | Waveshaper, compressor lookahead, or sine starting at phase 0 | Cosine-phase body, 0.5 to 1 ms attack, no lookahead on hits; measure with `hit-check.mjs` |
| Clip silent on a phone | Mix energy under 60 Hz | Bass up an octave, brighter pad, check 200 Hz to 6 kHz loudness |
| Generic "AI" look | Adjectives in the brief left the look to defaults | Name each default seen in the render and add it to BANNED |

## When a fix doesn't hold

Render the frames either side of the problem and compare them before touching code:

```bash
node lab/render.mjs anim.html --fps 60 --frames 83,84,85 --out out/probe
```

List every difference between the images, find the line that causes it, change only that
line, render the same frames again.

When a fix works and the failure could recur, add a line for it to the brief's render
contract so the next piece starts without it.
