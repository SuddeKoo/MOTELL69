// Lydmotor (Web Audio). Tilpasset fra referansen i startpakken.
// Lyder: NOX SOUND Essentials (CC0) + startpakkens utvalgte WAV-er. Ting som ikke finnes i lydpakken
// (telefonring, resepsjonsklokke, kortpresse, penn, linjestøy) lages syntetisk. Ingen musikk.
import { vocalProfile, vocalSound } from '../data/vocals.js';

const BASE = 'assets/audio/';

export const SOUND_MAP = {
  click: ['sfx/button_1.wav', 'sfx/button_2.wav'],
  keys: ['sfx/keys_jingle.wav', 'sfx/key_1.wav', 'sfx/key_2.wav'],
  key_hook: ['sfx/key_hook.wav', 'sfx/key_3.wav'],
  handover: ['sfx/key_2.wav', 'sfx/key_1.wav'],
  put: ['sfx/put_down.wav'],
  pickup: ['sfx/pickup.wav'],
  door: ['sfx/door_wood.wav', 'sfx/door_open.wav'],
  paper: ['sfx/paper_1.wav', 'sfx/paper_2.wav'],
  clasp: ['sfx/clasp.wav'],
  thud: ['sfx/thud.wav'],
  handset_up: ['sfx/pickup.wav'],
  handset_down: ['sfx/put_down.wav'],
  step: ['sfx/step_wood_1.wav', 'sfx/step_wood_2.wav', 'sfx/step_wood_3.wav', 'sfx/step_tile_1.wav'],
  step_snow: ['sfx/step_snow_1.wav', 'sfx/step_snow_2.wav'],
  car_pass: ['sfx/car_pass.wav'],
  car_door: ['sfx/car_door.wav'],
  car_stop: ['sfx/car_stop.wav'],
  car_start: ['sfx/car_start.wav'],
  coat: ['sfx/coat.wav'],
  m_laugh: ['voice/m_laugh_1.wav', 'voice/m_laugh_2.wav'],
  f_laugh: ['voice/f_laugh_1.wav', 'voice/f_laugh_2.wav'],
  m_sigh: ['voice/m_sigh_1.wav', 'voice/m_sigh_2.wav'],
  f_sigh: ['voice/f_sigh_1.wav', 'voice/f_sigh_2.wav'],
  m_surprise: ['voice/m_surprise_1.wav', 'voice/m_surprise_2.wav'],
  f_surprise: ['voice/f_surprise_1.wav'],
  m_hmm: ['voice/m_hmm_1.wav', 'voice/m_hmm_2.wav'],
  f_hmm: ['voice/f_hmm_1.wav', 'voice/f_hmm_2.wav'],
  m_nod: ['voice/m_nod_1.wav', 'voice/m_nod_2.wav'],
  f_nod: ['voice/f_nod_1.wav', 'voice/f_nod_2.wav'],
  m_breath: ['voice/m_breath_1.wav', 'voice/m_breath_2.wav', 'voice/m_breath_3.wav'],
  f_breath: ['voice/f_breath_1.wav', 'voice/f_breath_2.wav', 'voice/f_breath_3.wav'],
  f_sniff: ['voice/f_sniff.wav'],
  m_grunt: ['voice/m_grunt_1.wav', 'voice/m_grunt_2.wav'],
  f_grunt: ['voice/f_grunt_1.wav', 'voice/f_grunt_2.wav'],
  m_nervous: ['voice/m_nervous.wav'],
  f_nervous: ['voice/f_nervous.wav'],
  m_throat: ['voice/m_throat.wav', 'voice/m_cough.wav'],
  f_throat: ['voice/f_throat.wav', 'voice/f_cough.wav'],
};

export const AMBIENCE_MAP = {
  out_wind: 'amb/out_wind_forest.wav',
  out_night: 'amb/out_night.wav',
  neon: 'amb/neon_sign.wav',
  room_tone: 'amb/room_tone.wav',
  in_wind: 'amb/in_wind_calm.wav',
  wind_old: 'amb/wind.wav',           // andre vindlag (startpakken, NOX SOUND CC0)
};

// Lydbilder: hvilke looper og hvor sterkt (før gruppevolum).
// Ute: vinden er hovedsaken (to lag vind som kastes hver for seg); neonskiltet ligger langt under
// og høres nesten bare når det løyer. Inne: roligere enn ute – svak romlyd og lysrør, og vinden
// dempet gjennom veggene (lavpass). Den blir tydeligere et øyeblikk når inngangsdøra går.
const SCENES = {
  outdoor: { out_wind: 0.72, wind_old: 0.34, out_night: 0.12, neon: 0.016 },
  indoor: { in_wind: 0.3, room_tone: 0.045, neon: 0.022 },
  silent: {},
};
// Vindlooper får eget filter og egen «vær»-forsterkning som vindkastene styrer
const WIND = { out_wind: 2600, wind_old: 1800, in_wind: 520 };
const WEATHER = {
  outdoor: { loops: ['out_wind', 'wind_old'], every: [4, 11], strength: [1.25, 2.1], calm: 0.55 },
  indoor: { loops: ['in_wind'], every: [14, 30], strength: [1.2, 1.6], calm: 0.8 },
};

export class Audio {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.buffers = new Map();
    this.loading = new Map();
    this.loops = new Map();
    this.lastPick = {};
    this.voiceBusyUntil = 0;
    this.active = 0; // antall samtidige effekter (mot lydspam)
    this.scene = 'silent';
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.comp = this.ctx.createDynamicsCompressor(); // hindrer klipping når mye skjer samtidig
      this.comp.threshold.value = -10; this.comp.ratio.value = 4;
      this.master = this.ctx.createGain();
      this.master.connect(this.comp).connect(this.ctx.destination);
      this.groups = {};
      for (const g of ['sfx', 'amb', 'voice']) { this.groups[g] = this.ctx.createGain(); this.groups[g].connect(this.master); }
      // Dempet «utenfra»-filter for biler og vind sett fra resepsjonen
      this.muffle = this.ctx.createBiquadFilter();
      this.muffle.type = 'lowpass'; this.muffle.frequency.value = 900;
      this.muffle.connect(this.groups.sfx);
      this.applyVolumes();
      this.preload(['click', 'keys', 'key_hook', 'door', 'paper', 'put', 'pickup', 'step']);
      if (this.pendingScene) this.setScene(this.pendingScene);
    } catch (e) {
      console.warn('Lyd utilgjengelig:', e);
    }
  }

  applyVolumes() {
    if (!this.ctx) return;
    const s = this.settings, t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.05);
    this.groups.sfx.gain.setTargetAtTime(s.sfx, t, 0.05);
    this.groups.amb.gain.setTargetAtTime(s.amb, t, 0.05);
    this.groups.voice.gain.setTargetAtTime(s.voice, t, 0.05);
  }

  async load(path) {
    if (this.buffers.has(path)) return this.buffers.get(path);
    if (this.loading.has(path)) return this.loading.get(path);
    const p = fetch(BASE + path)
      .then((r) => { if (!r.ok) throw new Error(path); return r.arrayBuffer(); })
      .then((ab) => this.ctx.decodeAudioData(ab))
      .then((buf) => { this.buffers.set(path, buf); return buf; })
      .catch(() => { this.buffers.set(path, null); return null; });
    this.loading.set(path, p);
    return p;
  }

  preload(names) {
    if (!this.ctx) return;
    for (const n of names) for (const f of SOUND_MAP[n] || []) this.load(f);
  }

  pickFile(name) {
    const files = SOUND_MAP[name];
    if (!files) return null;
    let i = Math.floor(Math.random() * files.length);
    if (files.length > 1 && i === this.lastPick[name]) i = (i + 1) % files.length;
    this.lastPick[name] = i;
    return files[i];
  }

  /** opts: { volume, rate, group, delay, vary, muffled } */
  async play(name, opts = {}) {
    if (!this.ctx || this.settings.muted) return null;
    if (name === 'door' && !opts.muffled) this.doorDraft(opts.delay || 0);
    if (this.active > 10 && (opts.group || 'sfx') === 'sfx') return null;
    const file = this.pickFile(name);
    if (!file) return this.synth(name, opts);
    const buf = await this.load(file);
    if (!buf) return null;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const vary = opts.vary ?? 0.05;
    src.playbackRate.value = (opts.rate || 1) * (1 + (Math.random() * 2 - 1) * vary);
    const g = this.ctx.createGain();
    g.gain.value = (opts.volume ?? 1) * (1 + (Math.random() * 2 - 1) * 0.08);
    src.connect(g).connect(opts.muffled ? this.muffle : this.groups[opts.group || 'sfx']);
    this.active++;
    src.onended = () => { this.active--; };
    src.start(this.ctx.currentTime + (opts.delay || 0));
    return src;
  }

  /** Kort vokallyd (kremt, humring, sukk) etter karakterens profil. Aldri én lyd per bokstav. */
  vocal(ch, situation) {
    if (!this.ctx || !ch) return;
    const now = this.ctx.currentTime;
    if (now < this.voiceBusyUntil) return;
    const prof = vocalProfile(ch);
    const sit = prof[situation] || prof.talk;
    if (Math.random() > sit.p) return;
    const kind = weighted(sit.mix);
    const name = vocalSound(kind, ch.voice?.type);
    this.voiceBusyUntil = now + 1.2;
    this.play(name, { group: 'voice', rate: (prof.rate || 1) * (ch.voice?.pitch ? 0.85 + ch.voice.pitch * 0.15 : 1), vary: 0.04, volume: 0.8 });
  }

  // ── Ambience ──
  async loop(name, volume = 1, fade = 1.5) {
    if (!this.ctx) return;
    const cur = this.loops.get(name);
    if (cur) { cur.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, fade / 3); return; }
    const entry = { gain: this.ctx.createGain(), mod: this.ctx.createGain(), filter: null, src: null };
    entry.gain.gain.value = 0;
    entry.gain.connect(entry.mod);
    if (WIND[name]) {
      entry.filter = this.ctx.createBiquadFilter();
      entry.filter.type = 'lowpass'; entry.filter.frequency.value = WIND[name]; entry.filter.Q.value = 0.4;
      entry.mod.connect(entry.filter).connect(this.groups.amb);
    } else entry.mod.connect(this.groups.amb);
    this.loops.set(name, entry);
    const buf = await this.load(AMBIENCE_MAP[name]);
    if (!buf || this.loops.get(name) !== entry) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    src.connect(entry.gain);
    src.start(0, Math.random() * buf.duration);
    entry.src = src;
    entry.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, fade / 3);
  }

  stopLoop(name, fade = 1.2) {
    const e = this.loops.get(name);
    if (!e || !this.ctx) return;
    this.loops.delete(name);
    e.gain.gain.setTargetAtTime(0, this.ctx.currentTime, fade / 3);
    setTimeout(() => { try { e.src?.stop(); } catch { /* stoppet */ } e.gain.disconnect(); e.mod.disconnect(); e.filter?.disconnect(); }, fade * 1000 + 300);
  }

  /** Kryssfade mellom lydbilder (meny ute → resepsjon inne). */
  setScene(name, fade = 2) {
    this.scene = name;
    if (!this.ctx) { this.pendingScene = name; return; }
    const want = SCENES[name] || {};
    for (const k of [...this.loops.keys()]) if (!(k in want)) this.stopLoop(k, fade);
    for (const [k, v] of Object.entries(want)) this.loop(k, v, fade);
    this.weather();
  }

  /** Levende vær: vindkast med ulik styrke og lengde, og stille perioder innimellom. */
  weather() {
    clearTimeout(this.weatherTimer);
    const w = WEATHER[this.scene];
    if (!w || !this.ctx) return;
    const next = () => {
      if (WEATHER[this.scene] !== w) return;
      const r = Math.random();
      if (r < 0.18) this.lull(w); else this.gust(w.strength[0] + Math.random() * (w.strength[1] - w.strength[0]));
      this.weatherTimer = setTimeout(next, (w.every[0] + Math.random() * (w.every[1] - w.every[0])) * 1000);
    };
    this.weatherTimer = setTimeout(next, 2500 + Math.random() * 3000);
  }

  /** Vindkast: forsterk og «åpne» vindlagene kort, hvert lag litt forskjøvet. */
  gust(k = this.scene === 'outdoor' ? 1.8 : 1.4, opts = {}) {
    if (!this.ctx) return;
    const w = WEATHER[this.scene];
    if (!w) return;
    const t = this.ctx.currentTime;
    const rise = opts.rise ?? 0.6 + Math.random() * 1.4, hold = opts.hold ?? 0.6 + Math.random() * 2.2, fall = opts.fall ?? 1.2 + Math.random() * 2.4;
    w.loops.forEach((name, i) => {
      const e = this.loops.get(name);
      if (!e) return;
      const at = t + i * (0.15 + Math.random() * 0.5), kk = i ? 1 + (k - 1) * (0.5 + Math.random() * 0.6) : k;
      e.mod.gain.cancelScheduledValues(at);
      e.mod.gain.setTargetAtTime(kk, at, rise / 3);
      e.mod.gain.setTargetAtTime(1, at + rise + hold, fall / 3);
      if (e.filter) {
        const base = WIND[name], open = opts.open ?? base * (1 + (kk - 1) * 1.4);
        e.filter.frequency.cancelScheduledValues(at);
        e.filter.frequency.setTargetAtTime(open, at, rise / 3);
        e.filter.frequency.setTargetAtTime(base, at + rise + hold, fall / 3);
      }
    });
  }

  /** Vinden løyer en stund (da kan neonskiltet så vidt høres). */
  lull(w) {
    const t = this.ctx.currentTime;
    for (const name of w.loops) {
      const e = this.loops.get(name);
      if (!e) continue;
      e.mod.gain.cancelScheduledValues(t);
      e.mod.gain.setTargetAtTime(w.calm, t, 1.2);
      e.mod.gain.setTargetAtTime(1, t + 3 + Math.random() * 3, 1.5);
    }
  }

  /** Inngangsdøra åpnes: vinden utenfra blir tydelig et kort øyeblikk. */
  doorDraft(delay = 0) {
    if (this.scene !== 'indoor') return;
    setTimeout(() => this.gust(2.4, { rise: 0.25, hold: 1.1, fall: 2.2, open: 3200 }), delay * 1000);
  }

  // ── Telefon ──
  startRing() {
    if (!this.ctx || this.ringTimer) return;
    const burst = () => {
      if (this.settings.muted) return;
      // Klassisk elektromekanisk bjelle: to toner hamret ~22 ganger i sekundet, 1,6 s på
      const t = this.ctx.currentTime;
      const out = this.ctx.createGain(); out.gain.value = 0.0001; out.connect(this.groups.sfx);
      const dur = 1.6;
      for (const f of [1180, 1420]) {
        const o = this.ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
        const am = this.ctx.createGain(); am.gain.value = 0;
        const lfo = this.ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 22;
        const lg = this.ctx.createGain(); lg.gain.value = 0.5;
        lfo.connect(lg).connect(am.gain);
        o.connect(am).connect(out);
        o.start(t); lfo.start(t); o.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
      }
      out.gain.setValueAtTime(0.0001, t);
      out.gain.linearRampToValueAtTime(0.09, t + 0.02);
      out.gain.setValueAtTime(0.09, t + dur - 0.05);
      out.gain.linearRampToValueAtTime(0.0001, t + dur);
    };
    burst();
    this.ringTimer = setInterval(burst, 3600);
  }
  stopRing() { clearInterval(this.ringTimer); this.ringTimer = null; }

  startLine() {
    if (!this.ctx || this.lineSrc) return;
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.6;
    const g = this.ctx.createGain(); g.gain.value = 0.012;
    src.connect(f).connect(g).connect(this.groups.sfx);
    src.start();
    this.lineSrc = src;
  }
  stopLine() { try { this.lineSrc?.stop(); } catch { /* */ } this.lineSrc = null; }

  // ── Syntetiske lyder ──
  synth(name, opts = {}) {
    if (!this.ctx) return null;
    const t = this.ctx.currentTime + (opts.delay || 0);
    const vol = opts.volume ?? 1;
    const tone = (freq, dur, type = 'sine', v = 0.2, start = t, glide = 0) => {
      const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, start);
      if (glide) o.frequency.exponentialRampToValueAtTime(freq * glide, start + dur);
      g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(v * vol, start + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(g).connect(this.groups.sfx); o.start(start); o.stop(start + dur + 0.05);
    };
    switch (name) {
      case 'bell': // resepsjonsklokka ved døra
        for (let k = 0; k < 2; k++) { const s = t + k * 0.18; const v = 0.1 / (k + 1); tone(1975, 1.3, 'sine', v, s); tone(1975 * 2.76, 0.5, 'sine', v * 0.4, s); tone(1975 * 5.4, 0.2, 'sine', v * 0.2, s); }
        break;
      case 'desk_bell': tone(2350, 1.6, 'sine', 0.12); tone(2350 * 2.4, 0.6, 'sine', 0.05); break;
      case 'imprint': // kortpressa: ka-tsjunk
        this.noise(0.09, 300, 0.45 * vol, t); tone(90, 0.1, 'sine', 0.35, t);
        this.noise(0.12, 2400, 0.12 * vol, t + 0.16); this.noise(0.08, 260, 0.35 * vol, t + 0.32); tone(70, 0.12, 'sine', 0.3, t + 0.32);
        break;
      case 'stamp': this.noise(0.08, 220, 0.5 * vol, t); tone(80, 0.12, 'sine', 0.4, t); break;
      case 'pen': for (let i = 0; i < 5; i++) this.noise(0.05 + Math.random() * 0.05, 3500 + Math.random() * 2000, 0.05 * vol, t + i * 0.09); break;
      case 'page': this.noise(0.35, 2600, 0.12 * vol, t); this.noise(0.15, 1200, 0.06 * vol, t + 0.2); break;
      case 'dial': for (let i = 0; i < 6; i++) this.noise(0.02, 1800, 0.18 * vol, t + i * 0.09); tone(425, 0.9, 'sine', 0.05, t + 0.8); tone(425, 0.9, 'sine', 0.05, t + 2.2); break;
      case 'static': this.noise(1.4, 3000, 0.07 * vol, t); this.noise(0.6, 600, 0.05 * vol, t + 0.4); break;
      case 'cart': for (let i = 0; i < 4; i++) this.noise(0.05, 1400, 0.06 * vol, t + i * 0.13); tone(220, 0.08, 'triangle', 0.04, t + 0.1); break;
      case 'door_slam': this.noise(0.25, 160, 0.35 * vol, t, true); tone(55, 0.3, 'sine', 0.25, t); break;
      case 'flicker': for (let i = 0; i < 3; i++) tone(120, 0.06, 'sawtooth', 0.03, t + i * 0.11); break;
      case 'hover': tone(1400, 0.04, 'triangle', 0.03); break;
      case 'good': tone(660, 0.1, 'triangle', 0.08); tone(990, 0.16, 'triangle', 0.08, t + 0.1); break;
      case 'bad': tone(220, 0.22, 'sawtooth', 0.05); tone(165, 0.3, 'sawtooth', 0.05, t + 0.16); break;
      default: tone(440, 0.04, 'square', 0.02);
    }
    return null;
  }

  noise(dur, freq, vol, start, muffled = false) {
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    const g = this.ctx.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(muffled ? this.muffle : this.groups.sfx);
    src.start(start);
  }
}

function weighted(mix) {
  const e = Object.entries(mix);
  let r = Math.random() * e.reduce((s, [, w]) => s + w, 0);
  for (const [k, w] of e) { r -= w; if (r <= 0) return k; }
  return e[0][0];
}
