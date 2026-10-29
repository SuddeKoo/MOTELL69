// Felles spillkontekst. Én tilstand som alle kameravinkler og systemer deler.
import { Bus } from '../core/bus.js';
import { RNG } from '../core/rng.js';

export const G = {
  state: null,       // lagres (ren JSON)
  rng: new RNG(Date.now()),
  bus: new Bus(),
  audio: null,
  settings: null,
  paused: true,
  realTime: 0,       // sekunder spilt (ikke lagret)
  lastActivity: 0,   // realTime da noe sist skjedde (mot dødtid)
};

export const S = () => G.state;
export const emit = (ev, data) => G.bus.emit(ev, data);
export const rnd = () => G.rng.next();

/** Logg en hendelse; problems havner i skiftoppsummeringen. */
export function log(text, kind = 'info') {
  const s = G.state;
  s.log.push({ n: s.night, m: Math.round(s.min), k: kind, t: text });
  if (s.log.length > 120) s.log.splice(0, s.log.length - 120);
  if (kind === 'problem') s.nightStats.problems.push(text);
  emit('log', { text, kind });
}

export function toast(text, kind = 'info') {
  emit('toast', { text, kind });
}

export function touch() { G.lastActivity = G.realTime; }
