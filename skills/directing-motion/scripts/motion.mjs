// Motion tokens and pure-time helpers. Every helper returns a value for any t without
// stepping through earlier frames, so a renderer can draw frame 84 on its own.

export const EASE = {
  enter: [0.16, 1, 0.3, 1],    // ease-out-expo: reveals, arrivals
  premium: [0.22, 1, 0.36, 1], // ease-out-quint
  move: [0.76, 0, 0.24, 1],    // ease-in-out-quart: moves, camera
  exit: [0.7, 0, 0.84, 0],     // ease-in-expo: exits
  pop: [0.34, 1.56, 0.64, 1],  // ease-out-back: overshoot
};
export const css = (b) => `cubic-bezier(${b.join(', ')})`;

// CSS cubic-bezier as a function of progress 0..1, for canvas and WebGL work.
export function bezier([x1, y1, x2, y2]) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (s) => ((ax * s + bx) * s + cx) * s;
  const Y = (s) => ((ay * s + by) * s + cy) * s;
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let lo = 0, hi = 1, s = p;
    for (let i = 0; i < 30; i++) {
      const x = X(s);
      if (Math.abs(x - p) < 1e-6) break;
      x < p ? (lo = s) : (hi = s);
      s = (lo + hi) / 2;
    }
    return Y(s);
  };
}

// Progress of a segment [t0, t0 + dur] with an easing, clamped.
export const tween = (t, t0, dur, ease = EASE.move) =>
  bezier(ease)(Math.min(1, Math.max(0, (t - t0) / dur)));

// Damping ratio from any library's stiffness/damping/mass: 1 = no bounce.
export const dampingRatio = (k, c, m = 1) => c / (2 * Math.sqrt(k * m));

// Spring step response 0 -> 1 at time t (s). zeta: damping ratio. f: natural frequency in Hz.
export function spring(t, zeta = 0.7, f = 2) {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * f;
  if (zeta < 1) {
    const wd = w * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
  }
  if (zeta === 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const r = w * Math.sqrt(zeta * zeta - 1);
  const r1 = -zeta * w + r, r2 = -zeta * w - r;
  return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}

// Frame of beat n. Rounds each beat from time; summing a rounded frames-per-beat drifts.
export const beatFrame = (n, bpm, fps) => Math.round(((n * 60) / bpm) * fps);

// Seeded PRNG (mulberry32). Same seed, same sequence, every render.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Loop phase 0..1 for a loop of `secs`. Drive periodic motion with whole cycles of it,
// e.g. Math.sin(2 * Math.PI * 2 * loopPhase(t, 6)) completes exactly 2 cycles per loop.
export const loopPhase = (t, secs) => (((t / secs) % 1) + 1) % 1;
