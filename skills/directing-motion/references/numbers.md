# Motion numbers

Starting values. Each one replaces an adjective in a brief. `lab/motion.mjs` carries the
easing, spring, beat and RNG helpers as code.

## Easing

CSS values from easings.net (github.com/ai/easings.net, `src/easings.yml`).

| Name | cubic-bezier | Use for |
|---|---|---|
| ease-out-expo | 0.16, 1, 0.3, 1 | Text and logo reveals, arrivals |
| ease-out-quint | 0.22, 1, 0.36, 1 | Softer premium entrances |
| ease-in-out-quart | 0.76, 0, 0.24, 1 | Moves across the frame, camera pushes |
| ease-in-expo | 0.7, 0, 0.84, 0 | Fast exits |
| ease-out-back | 0.34, 1.56, 0.64, 1 | A pop with about 10% overshoot |

- Enter with ease-out, exit with ease-in, cross the frame with ease-in-out.
- Exits run 40 to 50% of the entrance duration.
- Linear only for rotation, progress bars and loop phase. Linear on a move reads as a render.
- Camera gets the softest curve in the piece; objects get snappier ones.

## Springs

One number translates between libraries: the damping ratio ζ = damping / (2·√(stiffness·mass)).

| ζ | Feel |
|---|---|
| 1.0 | No bounce |
| 0.7 to 0.85 | Premium, one small settle |
| 0.4 to 0.6 | Playful |
| under 0.3 | Cartoon wobble |

Library defaults: Remotion `spring()` is mass 1, damping 10, stiffness 100, so ζ = 0.5.
react-spring's default (tension 170, friction 26) is ζ ≈ 1.0.

Material 3 splits springs into spatial (position, size, rotation) and effects (color, opacity).
Effects springs must not overshoot: opacity above 1 or a color past its target reads as a glitch.

Give a spring as ζ plus a frequency in Hz (`spring(t, 0.7, 2)`), or as ζ plus a settle time.
"Bouncy" is not a value.

## Durations

| Move | Duration | At 60 fps | At 24 fps |
|---|---|---|---|
| UI feedback | 100 to 200 ms | 6 to 12 f | 2 to 5 f |
| UI move | 200 to 500 ms | 12 to 30 f | 5 to 12 f |
| Hero reveal | 600 to 900 ms | 36 to 54 f | 14 to 22 f |
| Exit | 40 to 50% of its entrance | | |

0.1 s is the limit for a response to feel instantaneous (Nielsen Norman Group).

## Stagger and hierarchy

- Letters 1 frame apart, words 60 to 120 ms, list items 40 to 80 ms.
- Start the next element when the previous is 30 to 50% done. Fully sequential looks mechanical;
  all at once looks cheap.
- One hero move per shot. Secondary moves travel 50 to 70% of the hero's distance and start
  100 to 200 ms after it. Ambient motion stays under 5% of the hero's travel on a slow sine.
- Parallax speeds: foreground 1.0, middle 0.5, background 0.2.

## Beat grid

Frames per beat = fps × 60 / BPM. At 120 BPM: 30 f at 60 fps, 12 f at 24 fps.

At 128 BPM and 30 fps a beat is 14.06 frames. Compute each beat from time and round it
(`beatFrame(n, bpm, fps)`); adding a rounded 14 per beat drifts 2 frames off by beat 32.

Cut on the beat. Change layout on the bar (every 4 beats), not every beat.

## Holds and legibility

- Text holds at least 0.3 s per word plus 0.5 s: a two-word title holds 1.1 s.
- Text does not move while it is being read. A 2% push on the whole frame is fine.
- Text contrast at least 4.5:1 on every frame, including over moving backgrounds (WCAG 1.4.3).
- No more than 3 flashes in any one second (WCAG 2.3.1).
- Push key poses 10 to 30% further than feels right: the feed plays everything small.

## Animation principles as numbers

| Principle | Write it as |
|---|---|
| Anticipation | 8 to 12 frame crouch at 1.2 × 0.75 scale before the move |
| Squash and stretch | 0.85 × 1.28 at takeoff, 1.25 × 0.7 on landing; volume roughly constant |
| Overlapping action | Limbs or secondary parts lag the body by 3 to 6 frames |
| Follow-through | Trailing parts settle on a looser spring than the body (ζ 0.2 to 0.4) |
| Arcs | Paths curve; give apex height and landing frame |
| Slow in, slow out | Springs or eases at every key; no linear starts or stops |
| Timing | Frame counts set weight: more air frames read lighter |
| Guardrail | The proportions that must not change, so the character stays itself |

## Feelings to numbers

| Note | Translation |
|---|---|
| "Make it pop" | Scale 1.0 → 1.08 → 1.0 over 6 frames, peak on the beat |
| "More premium" | ease-out-quint entrances, springs at ζ 0.8, no overshoot on text |
| "It drags" | Cut each hold by one beat, keeping cuts on the grid |
| "Too busy" | One hero at a time; others 150 ms later at 60% travel. Or remove 30% of the motion |
| "Looks like AI" | Name each default it used, add each to BANNED, render again |
| "Abrupt ending" | 36-frame hold with a 2% push, settling on a ζ 0.8 spring |
