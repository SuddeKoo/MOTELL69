// Konverterer NOX SOUND-WAV (48 kHz / 24-bit / stereo) til små spillfiler: mono, 16-bit, 22 050 Hz.
// Ingen ffmpeg nødvendig. Bruk: node scripts/convert-audio.mjs <NOX-rotmappe>
// Lisens: NOX SOUND Essentials Series er CC0 (se Essentials_Series_README.pdf i lydpakken).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2];
if (!ROOT) { console.error('Mangler sti til NOX-mappa'); process.exit(1); }
const OUT = path.resolve('public/assets/audio');
const RATE = 22050;

// [kilde (relativ til NOX-rot), mål, { start, dur, loop, gain }]
const JOBS = [
  ['Nature_Essentials_NOX_SOUND/Ambiance_Wind_Forest_Loop_Stereo.wav', 'amb/out_wind_forest.wav', { start: 2, dur: 24, loop: true }],
  ['Nature_Essentials_NOX_SOUND/Ambiance_Night_Loop_Stereo.wav', 'amb/out_night.wav', { start: 1, dur: 22, loop: true }],
  ['Nature_Essentials_NOX_SOUND/Ambiance_Wind_Calm_Loop_Stereo.wav', 'amb/in_wind_calm.wav', { start: 1, dur: 22, loop: true }],
  ['Electromagnetic_NOX_SOUND/Electromagnetic_Neon_Light_Loop_Mono_Elektrousi_02.wav', 'amb/neon_sign.wav', { start: 0.5, dur: 12, loop: true }],
  ['Electromagnetic_NOX_SOUND/Electromagnetic_Electric_Box_Loop_Mono_Elektrousi_01.wav', 'amb/room_tone.wav', { start: 0.5, dur: 12, loop: true }],
  ['Vehicle_Essentials_NOX_SOUND/Vehicle_Essential_Car/Vehicle_Car_Drive_Exterior_Loop_Mono.wav', 'sfx/car_pass.wav', { start: 0, dur: 9 }],
  ['Vehicle_Essentials_NOX_SOUND/Vehicle_Essential_Car/Vehicle_Car_Door_Closing_Exterior_Mono_01.wav', 'sfx/car_door.wav', { dur: 2.5 }],
  ['Vehicle_Essentials_NOX_SOUND/Vehicle_Essential_Car/Vehicle_Car_Stop_Engine_Exterior_Mono.wav', 'sfx/car_stop.wav', { dur: 3 }],
  ['Vehicle_Essentials_NOX_SOUND/Vehicle_Essential_Car/Vehicle_Car_Start_Engine_Exterior_Mono.wav', 'sfx/car_start.wav', { dur: 4 }],
  ['Vehicle_Essentials_NOX_SOUND/Vehicle_Essential_Car/Vehicle_Car_Keys_Mono_01.wav', 'sfx/keys_jingle.wav', { dur: 2 }],
  ['Sample_A_Sound_Effect/Household_Door_Wood_Open_Stereo.wav', 'sfx/door_wood.wav', { dur: 3 }],
  ['Sample_A_Sound_Effect/Household_Closet_Key_Insertion_Stereo.wav', 'sfx/key_hook.wav', { dur: 1.6 }],
  ['Sample_A_Sound_Effect/Cloth_Winter_Coat_Throw_Moderate_Stereo.wav', 'sfx/coat.wav', { dur: 1.5 }],
  ['Footsteps_Essentials_NOX_SOUND/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_01.wav', 'sfx/step_wood_1.wav', { dur: 0.7 }],
  ['Footsteps_Essentials_NOX_SOUND/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_04.wav', 'sfx/step_wood_2.wav', { dur: 0.7 }],
  ['Footsteps_Essentials_NOX_SOUND/Footsteps_Wood/Footsteps_Wood_Walk/Footsteps_Wood_Walk_07.wav', 'sfx/step_wood_3.wav', { dur: 0.7 }],
];

function readWav(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Ikke WAV: ' + file);
  let off = 12, fmt = null, data = null;
  while (off + 8 <= b.length) {
    const id = b.toString('ascii', off, off + 4), size = b.readUInt32LE(off + 4);
    if (id === 'fmt ') fmt = { format: b.readUInt16LE(off + 8), ch: b.readUInt16LE(off + 10), rate: b.readUInt32LE(off + 12), bits: b.readUInt16LE(off + 22) };
    else if (id === 'data') data = b.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size & 1);
  }
  if (!fmt || !data) throw new Error('Mangler fmt/data: ' + file);
  if (fmt.format === 0xfffe) fmt.format = fmt.bits === 32 ? 3 : 1; // WAVE_FORMAT_EXTENSIBLE
  const bps = fmt.bits / 8, frames = Math.floor(data.length / (bps * fmt.ch));
  const out = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let s = 0;
    for (let c = 0; c < fmt.ch; c++) {
      const p = (i * fmt.ch + c) * bps;
      let v;
      if (fmt.format === 3) v = data.readFloatLE(p);
      else if (fmt.bits === 16) v = data.readInt16LE(p) / 32768;
      else if (fmt.bits === 24) v = data.readIntLE(p, 3) / 8388608;
      else if (fmt.bits === 32) v = data.readInt32LE(p) / 2147483648;
      else throw new Error('Ukjent bitdybde ' + fmt.bits);
      s += v;
    }
    out[i] = s / fmt.ch;
  }
  return { rate: fmt.rate, samples: out };
}

function resample(src, from, to) {
  if (from === to) return src;
  // Enkel lavpass (glidende snitt) før nedsampling for å unngå aliasing
  const k = Math.max(1, Math.round(from / to));
  const lp = new Float32Array(src.length);
  let acc = 0;
  for (let i = 0; i < src.length; i++) { acc += src[i]; if (i >= k) acc -= src[i - k]; lp[i] = acc / Math.min(i + 1, k); }
  const n = Math.floor(src.length * to / from), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * from / to, i0 = Math.floor(x), f = x - i0;
    out[i] = lp[i0] * (1 - f) + (lp[Math.min(i0 + 1, lp.length - 1)] * f);
  }
  return out;
}

function writeWav(file, s) {
  const b = Buffer.alloc(44 + s.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + s.length * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(s.length * 2, 40);
  for (let i = 0; i < s.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s[i])) * 32767), 44 + i * 2);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, b);
}

for (const [src, dst, o] of JOBS) {
  const full = path.join(ROOT, src);
  if (!fs.existsSync(full)) { console.warn('MANGLER', src); continue; }
  const { rate, samples } = readWav(full);
  let s = resample(samples, rate, RATE);
  const a = Math.floor((o.start || 0) * RATE), len = Math.min(s.length - a, Math.floor((o.dur || 999) * RATE));
  s = s.slice(a, a + len);
  if (o.loop) {
    // Sømløs loop: kryssfade slutten inn i starten
    const xf = Math.floor(RATE * 1.5), outS = new Float32Array(s.length - xf);
    for (let i = 0; i < outS.length; i++) outS[i] = s[i];
    for (let i = 0; i < xf; i++) { const t = i / xf; outS[i] = s[s.length - xf + i] * (1 - t) + s[i] * t; }
    s = outS;
  } else {
    const fi = Math.min(Math.floor(RATE * 0.005), s.length), fo = Math.min(Math.floor(RATE * 0.08), s.length);
    for (let i = 0; i < fi; i++) s[i] *= i / fi;
    for (let i = 0; i < fo; i++) s[s.length - 1 - i] *= i / fo;
  }
  // Normaliser toppnivå til -3 dB (unngå klipping senere i miksen)
  let peak = 0; for (const v of s) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? Math.min(4, 0.7 / peak) * (o.gain || 1) : 1;
  for (let i = 0; i < s.length; i++) s[i] *= g;
  writeWav(path.join(OUT, dst), s);
  console.log('OK', dst, (s.length / RATE).toFixed(1) + 's');
}
