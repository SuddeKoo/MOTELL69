// Rom, reservasjoner, gjester (med hukommelse) og fysiske nøkler. Én felles database for alt.
import { G, S, emit, log, toast, rnd } from './G.js';
import { ROOMS, ROOM_BY_NO, ROOM_TYPES, TYPE_ORDER, neighbours, wishFit } from '../data/rooms.js';
import { CHARACTERS, CHAR_BY_ID } from '../data/characters.js';
import { profileOf } from '../data/motelProfiles.js';
import { absMin, NIGHT_MIN, clamp } from '../core/util.js';

export const nowAbs = () => absMin(S().night, S().min);
export const ch = (id) => CHAR_BY_ID[id];

// ───────────── Rom ─────────────
export function room(no) { return S().rooms[no]; }

export function setRoomStatus(no, status) {
  S().rooms[no].status = status;
  emit('rooms', no);
}

/** Rommet kan tildeles en ny gjest (rent, ledig og ikke holdt av til flytting). */
export function assignable(no) {
  const r = room(no);
  return r.status === 'free' && !r.moveFor;
}

/** Reservasjon i natt som har dette rommet holdt av (og ikke er ankommet ennå). */
export function heldFor(no) {
  const s = S();
  return s.reservations.find((r) => r.roomNo === no && r.status === 'expected' && r.night === s.night) || null;
}

/** Omtrentlig ledighet i natt per romtype: ledige/skitne rom minus ventende reservasjoner. */
export function availability(night = S().night) {
  const s = S();
  const out = { standard: 0, komfort: 0, suite: 0 };
  const endAbs = absMin(night, 420);
  for (const r of ROOMS) {
    const st = s.rooms[r.no];
    if (st.moveFor) continue;
    if (st.status === 'occupied') {
      const g = s.guests[st.guestId];
      if (!g || g.checkoutAbs > endAbs) continue;
    }
    out[r.type]++;
  }
  for (const res of s.reservations) {
    if (res.night !== night || !['expected', 'arrived'].includes(res.status)) continue;
    const t = res.roomNo ? ROOM_BY_NO[res.roomNo].type : res.type;
    out[t]--;
  }
  return out;
}

// ───────────── Reservasjoner ─────────────
export function createReservation(o) {
  const s = S();
  const r = {
    id: s.nextResId++, charId: o.charId, name: o.name || ch(o.charId).name,
    night: o.night ?? s.night, expMin: Math.round(o.expMin ?? s.min), actMin: Math.round(o.actMin ?? o.expMin ?? s.min),
    nights: o.nights ?? 1, type: o.type || 'standard', roomNo: o.roomNo || null, wish: o.wish || null,
    source: o.source || 'pre', status: o.status || 'expected', note: o.note || '', guestId: null,
    spawned: false, checkinMin: null, made: { n: s.night, m: Math.round(s.min) },
  };
  s.reservations.push(r);
  emit('book');
  return r;
}
export const resById = (id) => S().reservations.find((r) => r.id === id) || null;

/** Hold reservasjonslista i en fornuftig størrelse (gamle avsluttede ut). */
export function pruneReservations() {
  const s = S();
  s.reservations = s.reservations.filter((r) => r.night >= s.night - 2 || ['expected', 'arrived', 'checked_in'].includes(r.status));
}

// ───────────── Gjester ─────────────
export const guestById = (id) => S().guests[id] || null;
export const guestsIn = () => Object.values(S().guests).filter((g) => g.status === 'in');
export function guestInRoom(no) {
  const id = room(no)?.guestId;
  return id ? guestById(id) : null;
}
export const guestByChar = (charId) => guestsIn().find((g) => g.charId === charId) || null;

export function remember(g, kind, text = '') {
  g.mem.push({ n: S().night, m: Math.round(S().min), k: kind, t: text });
  if (g.mem.length > 30) g.mem.shift();
}

export function adjustSat(g, delta, kind, text) {
  g.sat = clamp(g.sat + delta, 0, 100);
  if (kind) remember(g, kind, text);
  emit('guest', g.id);
}

export function baseSat(charId) {
  const t = ch(charId).traits;
  return clamp(62 + (t.joy || 0) / 8 - (t.irr || 0) / 8, 35, 80);
}

/** Visitor ved disken fikk nøkkelen: oppholdet starter. */
export function checkInGuest(v) {
  const s = S();
  const res = resById(v.resId);
  const p = profileOf(v.charId);
  const id = s.nextGuestId++;
  const nights = res ? res.nights : v.nights;
  let checkoutAbs;
  if (nights <= 0) checkoutAbs = Math.min(nowAbs() + 180 + Math.floor(rnd() * 120), absMin(s.night, 700));
  else checkoutAbs = absMin(s.night + nights - 1, 480 + Math.floor(rnd() * 200));
  const g = {
    id, charId: v.charId, name: res ? res.name : ch(v.charId).name, resId: res?.id ?? null, room: v.room,
    sat: baseSat(v.charId) + (v.satDelta || 0), mem: [], arrived: { n: s.night, m: Math.round(s.min) },
    checkoutAbs, nights, type: res ? res.type : v.wantType, wish: res?.wish ?? v.wish ?? null,
    issue: null, issues: 0, ignored: 0, quietUntil: 0, loud: !!p.loud && rnd() < 0.8,
    pendingMove: null, wantsMove: false, promise: null, errand: null, status: 'in', fraud: !!v.fraud,
    atDesk: false, wishMissed: false,
  };
  s.guests[id] = g;
  remember(g, 'room', `Fikk rom ${v.room}`);
  // Ønske og romtype
  const fit = wishFit(g.wish, v.room);
  if (fit === 'met') adjustSat(g, 6, 'wish', 'Rommet passet ønsket');
  else if (fit === 'missed') { adjustSat(g, -6, 'wish_missed', 'Rommet passet ikke ønsket'); g.wishMissed = true; }
  if (v.upgrade) adjustSat(g, 8, 'upgrade', 'Fikk et bedre rom enn bestilt');
  if (v.downgrade) adjustSat(g, -12, 'downgrade', 'Fikk et dårligere rom enn bestilt');
  const wr = v.patience / v.patienceMax;
  if (wr > 0.5) adjustSat(g, -Math.round((wr - 0.5) * 24), 'waited', 'Ventet lenge i resepsjonen');
  // Rom og nøkkel
  s.rooms[v.room].status = 'occupied';
  s.rooms[v.room].guestId = id;
  s.keys[v.room] = 'guest';
  if (res) { res.status = 'checked_in'; res.guestId = id; res.checkinMin = Math.round(s.min); res.roomNo = v.room; }
  const h = (s.history[v.charId] ||= { visits: 0, lastSat: null, seen: 0 });
  h.visits++;
  s.nightStats.checkins++;
  s.totals.checkins++;
  emit('rooms', v.room); emit('keys'); emit('book'); emit('guest', id);
  return g;
}

/** Oppholdet er over. auto = dagvakta/gjesten gikk uten å vente. */
export function checkOutGuest(g, { keyTo = null } = {}) {
  const s = S();
  g.status = 'gone';
  g.issue = null;
  const r = s.rooms[g.room];
  if (r.guestId === g.id) { r.guestId = null; r.status = 'dirty'; }
  if (keyTo) {
    if (s.hand === g.room && keyTo !== 'hand') s.hand = null;
    s.keys[g.room] = keyTo;
    if (keyTo === 'tray' && !s.tray.includes(g.room)) s.tray.push(g.room);
  }
  if (g.pendingMove) { const t = s.rooms[g.pendingMove]; if (t?.moveFor === g.id) t.moveFor = null; g.pendingMove = null; }
  const res = resById(g.resId);
  if (res) res.status = 'checked_out';
  s.ratings.push(Math.round(g.sat));
  if (s.ratings.length > 25) s.ratings.shift();
  s.nightStats.sats.push(Math.round(g.sat));
  s.nightStats.checkouts++;
  s.totals.checkouts++;
  const h = (s.history[g.charId] ||= { visits: 1, lastSat: null, seen: 0 });
  h.lastSat = Math.round(g.sat);
  s.wakeups = s.wakeups.filter((w) => w.guestId !== g.id || w.state !== 'pending');
  emit('rooms', g.room); emit('keys'); emit('book'); emit('guest', g.id);
}

export function rating() {
  const r = S().ratings;
  if (!r.length) return 3;
  return clamp(r.reduce((a, b) => a + b, 0) / r.length / 20, 0, 5);
}

/** Lager gjestens viktigste minne om oppholdet til en replikknøkkel ved utsjekking. */
export function memoryLineKey(g) {
  const has = (k) => g.mem.some((m) => m.k === k);
  const order = [
    ['promise_broken', 'mem_promise'], ['wake_missed', 'mem_wake_missed'], ['ignored', 'mem_ignored'],
    ['moved', 'mem_moved'], ['errand', 'mem_errand'], ['fixed', 'mem_fixed'], ['wake_ok', 'mem_wake_ok'],
    ['upgrade', 'mem_upgrade'], ['downgrade', 'mem_downgrade'], ['noise', 'mem_noise'], ['cold', 'mem_cold'], ['wish', 'mem_wish'],
  ];
  for (const [k, line] of order) if (has(k)) return line;
  return null;
}

// ───────────── Figurvalg ─────────────
/** Figurer som allerede er i bruk (bor her, har reservasjon, står i kø, er i telefonen). */
export function busyChars() {
  const s = S();
  const set = new Set();
  for (const g of guestsIn()) set.add(g.charId);
  for (const r of s.reservations) if (['expected', 'arrived'].includes(r.status)) set.add(r.charId);
  for (const v of s.queue) set.add(v.charId);
  for (const v of s.away) set.add(v.charId);
  const calls = [s.phone.ringing?.call, s.phone.active, ...s.phone.scheduled.map((x) => x.call)];
  for (const c of calls) if (c?.charId) set.add(c.charId);
  return set;
}

/** Velg en ledig figur, helst en som ikke har vært innom ennå – så alle 30 dukker opp over tid. */
export function pickChar(extraExclude = []) {
  const busy = busyChars();
  for (const x of extraExclude) busy.add(x);
  const s = S();
  const pool = CHARACTERS.filter((c) => !busy.has(c.id));
  if (!pool.length) return null;
  const c = G.rng.weighted(pool, (c) => 1 / (1 + 2 * (s.history[c.id]?.seen || 0)));
  (s.history[c.id] ||= { visits: 0, lastSat: null, seen: 0 }).seen++;
  return c.id;
}

// ───────────── Nøkler ─────────────
// keys[no]: 'board' | 'guest' | 'hand' | 'tray' | 'counter'
export function pickKey(no) {
  const s = S();
  const where = s.keys[no];
  if (where !== 'board' && where !== 'tray') return false;
  if (s.hand) {
    // Har spilleren en annen nøkkel, henges den tilbake automatisk når vi står ved brettet
    if (where === 'board' && (s.keys[s.hand] === 'hand')) s.keys[s.hand] = 'board';
    else { toast(`Du holder allerede nøkkel ${s.hand}.`); return false; }
  }
  if (where === 'tray') s.tray = s.tray.filter((x) => x !== no);
  s.keys[no] = 'hand';
  s.hand = no;
  G.audio?.play('keys');
  emit('keys'); emit('hand');
  return true;
}

export function hangKey(no) {
  const s = S();
  if (s.hand !== no) return false;
  s.keys[no] = 'board';
  s.hand = null;
  G.audio?.play('key_hook');
  emit('keys'); emit('hand');
  return true;
}

export function dropToTray() {
  const s = S();
  if (!s.hand) return false;
  const no = s.hand;
  s.keys[no] = 'tray';
  if (!s.tray.includes(no)) s.tray.push(no);
  s.hand = null;
  G.audio?.play('put');
  emit('keys'); emit('hand');
  return true;
}

export function loudActive(g) {
  const m = S().min;
  return g.loud && g.status === 'in' && m >= 50 && m <= 400 && nowAbs() > g.quietUntil;
}

export function loudNeighbour(g) {
  for (const no of neighbours(g.room)) {
    const n = guestInRoom(no);
    if (n && loudActive(n)) return n;
  }
  return null;
}

/** Romkartet: gjesten skal flytte til et nytt rom. Gjesten kommer ned og bytter nøkkel. */
export function planMove(guestId, target) {
  const s = S();
  const g = guestById(guestId);
  if (!g || g.status !== 'in' || !assignable(target) || target === g.room) return false;
  if (g.pendingMove && s.rooms[g.pendingMove]?.moveFor === g.id) s.rooms[g.pendingMove].moveFor = null;
  g.pendingMove = target;
  g.swapAt = nowAbs() + 6 + Math.floor(rnd() * 14);
  s.rooms[target].moveFor = g.id;
  if (g.promise?.kind === 'move') g.promise.deadline = nowAbs() + 120;
  emit('rooms', target); emit('rooms', g.room); emit('guest', g.id);
  return true;
}

export function cancelMove(guestId) {
  const s = S();
  const g = guestById(guestId);
  if (!g?.pendingMove) return;
  if (s.rooms[g.pendingMove]?.moveFor === g.id) s.rooms[g.pendingMove].moveFor = null;
  const t = g.pendingMove;
  g.pendingMove = null;
  emit('rooms', t); emit('rooms', g.room);
}

export { ROOMS, ROOM_BY_NO, ROOM_TYPES, TYPE_ORDER, NIGHT_MIN };
