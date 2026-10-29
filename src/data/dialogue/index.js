// Replikkoppslag: CAST[id][nøkkel] → ARCH[arketype][nøkkel] → BASE[nøkkel].
// Unngår å gjenta samme replikk for samme figur og nøkkel to ganger på rad.
import { BASE } from './base.js';
import { ARCH } from './arch.js';
import { CAST } from './cast.js';
import { CHAR_BY_ID } from '../characters.js';

const lastPick = new Map();

function pool(charId, key) {
  const ch = CHAR_BY_ID[charId];
  const own = CAST[charId]?.[key];
  const arch = ch && ARCH[ch.arch]?.[key];
  const base = BASE[key];
  // Egne replikker først; arketype- og basebanker blandes inn litt så figuren ikke låter likt hver gang
  if (own?.length) return own.length >= 2 || !arch ? own : [...own, ...arch.slice(0, 1)];
  if (arch?.length) return arch;
  return base || [];
}

export function hasLine(charId, key) {
  return pool(charId, key).length > 0;
}

export function fill(text, t = {}) {
  return text.replace(/\{(\w+)\}/g, (m, k) => (t[k] !== undefined && t[k] !== null ? String(t[k]) : m));
}

/** Henter en replikk med tokens fylt inn. rnd: funksjon som gir [0,1) */
// Siste replikker på tvers av alle figurer: samme setning skal ikke dukke opp igjen like etter
const recent = [];
const RECENT_MAX = 18;

export function say(charId, key, tokens = {}, rnd = Math.random) {
  const p = pool(charId, key);
  if (!p.length) return '';
  const id = `${charId}:${key}`;
  let i = Math.floor(rnd() * p.length);
  if (p.length > 1 && i === lastPick.get(id)) i = (i + 1) % p.length;
  // Prøv de andre variantene hvis denne nettopp ble sagt (av hvem som helst)
  for (let n = 0; n < p.length - 1 && recent.includes(p[i]); n++) {
    i = (i + 1) % p.length;
    if (i === lastPick.get(id)) i = (i + 1) % p.length;
  }
  lastPick.set(id, i);
  recent.push(p[i]);
  if (recent.length > RECENT_MAX) recent.shift();
  return fill(p[i], tokens);
}

export function nightsText(n) {
  if (n <= 0) return 'bare noen timer';
  return ['', 'én natt', 'to netter', 'tre netter', 'fire netter'][n] || `${n} netter`;
}
