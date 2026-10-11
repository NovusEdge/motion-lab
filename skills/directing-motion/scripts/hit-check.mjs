// Measures where each sound hit peaks in a decoded file, against its picture frame.
//
//   node hit-check.mjs final.mp4 --fps 60 --frames 84,112,200,337
//
// For each frame F the target is F + --lag frames (default 1: sound one frame after picture).
// Decodes through ffmpeg, so it measures what a player hears, codec delay and padding included.
// The peak is the largest sample of the mono downmix within ±window ms. A late peak means
// something else in the mix (bed, an earlier hit's ring) has a bigger crest than the hit:
// the hit does not dominate its moment, which is a mix problem, not a measurement artifact.
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const { values: o, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    fps: { type: 'string', default: '60' },
    frames: { type: 'string' },
    lag: { type: 'string', default: '1' },
    window: { type: 'string', default: '25' },
  },
});
if (!positionals[0] || !o.frames) {
  console.error('usage: node hit-check.mjs <file> --fps 60 --frames 84,112 [--lag 1] [--window 25]');
  process.exit(2);
}
const SR = 48000;
const raw = execFileSync('ffmpeg', [
  '-v', 'error', '-i', positionals[0], '-vn', '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-',
], { maxBuffer: 1 << 30 });
const pcm = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
const fps = Number(o.fps), lag = Number(o.lag), win = Math.round((Number(o.window) / 1000) * SR);
const ms = (s) => ((s / SR) * 1000).toFixed(1);
// Mono level, not a channel or true peak: use ebur128 for the export's dBTP.
const db = (x) => (x > 0 ? (20 * Math.log10(x)).toFixed(1) : '-inf');

console.log('frame  target_ms  peak_ms  offset_ms  mono_dBFS');
for (const f of o.frames.split(',').map(Number)) {
  const target = Math.round(((f + lag) / fps) * SR);
  let best = target, peak = 0;
  for (let i = Math.max(0, target - win); i < Math.min(pcm.length, target + win); i++) {
    const a = Math.abs(pcm[i]);
    if (a > peak) { peak = a; best = i; }
  }
  console.log(
    `${String(f).padStart(5)}  ${ms(target).padStart(9)}  ${ms(best).padStart(7)}  ` +
    `${ms(best - target).padStart(9)}  ${db(peak).padStart(9)}`,
  );
}
