// Hendelsesflyt: forhåndsbestillinger, drop-in, telefoner, utsjekkinger og gjester som kommer tilbake.
// Mål: alltid litt å gjøre, aldri uendelig kaos. Ingen fast NPC-rekkefølge.
import { G, S, emit, log, rnd } from './G.js';
import { ROOMS, ROOM_BY_NO } from '../data/rooms.js';
import { profileOf, BOOKS_FOR } from '../data/motelProfiles.js';
import { CHAR_BY_ID } from '../data/characters.js';
import { createReservation, guestsIn, pickChar, nowAbs, resById, availability, room, ch } from './motel.js';
import { spawnArrival, spawnWalkIn, spawnCheckout, spawnReturn, queueSpace } from './desk.js';
import { scheduleSpontaneous, scheduleMystery, sendDeskPending } from './phone.js';
import { absMin } from '../core/util.js';

const NOTES = ['Ringte forrige uke', 'Stamgjest', 'Bestilt per brev', 'Ringte i går', 'Via turistkontoret', 'Bestilt av firmaet'];

/** Forhåndsbestillinger for natta (kalles når et nytt skift starter). */
export function seedNight() {
  const s = S();
  if (s.night === 1) return seedFirstNight();
  const nightStart = absMin(s.night, 0);
  const staying = guestsIn().filter((g) => g.checkoutAbs > nightStart + 300).length;
  const capacity = ROOMS.length - staying;
  const already = s.reservations.filter((r) => r.night === s.night && r.status === 'expected').length;
  const want = Math.min(3 + Math.floor(s.night * 0.6), 7);
  const n = Math.max(0, Math.min(want, capacity - 2) - already);
  const times = [];
  for (let i = 0; i < n; i++) times.push(15 + Math.floor(Math.pow(rnd(), 1.3) * 380));
  times.sort((a, b) => a - b);
  for (const t of times) {
    const charId = pickChar();
    if (!charId) break;
    makePreBooking(charId, t);
  }
  // Svindler (fra natt 2): en annen figur prøver seg på en reservasjon som kommer seint
  if (s.night >= 2 && rnd() < 0.35) s.director.impostorAt = 60 + Math.floor(rnd() * 200);
  else s.director.impostorAt = null;
}

function makePreBooking(charId, expMin, o = {}) {
  const s = S();
  const p = profileOf(charId);
  const type = o.type || (rnd() < 0.75 ? p.type : G.rng.pick(['standard', 'standard', 'komfort']));
  const nights = o.nights ?? Math.max(1, p.nights[0] + Math.floor(rnd() * (p.nights[1] - p.nights[0] + 1)));
  let name = ch(charId).name, note = o.note || G.rng.pick(NOTES);
  const booker = BOOKS_FOR[charId];
  if (!o.noAnomaly && booker && rnd() < 0.35) { name = CHAR_BY_ID[booker].name; note = `Bestilt av ${CHAR_BY_ID[booker].first}`; }
  let roomNo = o.roomNo || null;
  if (!roomNo && rnd() < 0.25) {
    const cands = ROOMS.filter((r) => r.type === type && s.rooms[r.no].status !== 'occupied' && !s.reservations.some((x) => x.roomNo === r.no && x.night === s.night && x.status === 'expected'));
    if (cands.length) { roomNo = G.rng.pick(cands).no; note = `Ønsker rom ${roomNo}`; }
  }
  const actMin = Math.max(8, expMin + Math.floor(rnd() * 45) - 15);
  return createReservation({ charId, name, expMin, actMin, nights, type, roomNo, wish: p.wishes[0] || null, source: 'pre', note });
}

/** Første natt: håndterbar, men ekte. To gjester bor her allerede, ett rom er skittent. */
function seedFirstNight() {
  const s = S();
  const mk = (charId, no, nights, checkoutAbs, extra = {}) => {
    const id = s.nextGuestId++;
    s.guests[id] = {
      id, charId, name: ch(charId).name, resId: null, room: no, sat: 64, mem: [{ n: 0, m: 0, k: 'room', t: `Fikk rom ${no}` }],
      arrived: { n: 0, m: 300 }, checkoutAbs, nights, type: ROOM_BY_NO[no].type, wish: profileOf(charId).wishes[0] || null,
      issue: null, issues: 0, ignored: 0, quietUntil: 0, loud: false, pendingMove: null, wantsMove: false, promise: null,
      errand: null, status: 'in', fraud: false, atDesk: false, wishMissed: false, ...extra,
    };
    s.rooms[no].status = 'occupied'; s.rooms[no].guestId = id; s.keys[no] = 'guest';
    (s.history[charId] ||= { visits: 1, lastSat: null, seen: 1 });
    return s.guests[id];
  };
  mk('hassan', '104', 3, absMin(2, 520));
  mk('ron', '201', 2, absMin(1, 610));
  s.rooms['103'].status = 'dirty';
  // Hassan vil ha vekking – lærer telefonen uten tutorial
  s.director.firstCall = 22;
  for (const [id, t, o] of [['jacob', 12, { type: 'standard', nights: 1, noAnomaly: true, note: 'Ringte i går. Veldig blid.' }], ['einar', 75, { type: 'komfort', nights: 1, noAnomaly: true, roomNo: '202' }], ['lina', 165, { type: 'suite', nights: 1 }], ['konrad', 250, { type: 'standard', nights: 1 }]]) {
    (s.history[id] ||= { visits: 0, lastSat: null, seen: 0 }).seen++;
    const r = makePreBooking(id, t, o);
    if (id === 'jacob') r.actMin = 4;
  }
  s.director.nextWalkIn = 95;
  s.director.nextCall = 120;
}

// ───────────── Hvert spillminutt ─────────────
export function directorMinute() {
  const s = S(), d = s.director, m = s.min;
  const late = m >= 690;
  const now = nowAbs();
  const scale = Math.min(1.8, 1 + (s.night - 1) * 0.15) * (d.rush && m < d.rush ? 1.6 : 1);

  // Første natt: Hassan ringer om vekking etter litt tid
  if (d.firstCall && m >= d.firstCall) {
    d.firstCall = null;
    const g = guestsIn().find((x) => x.charId === 'hassan');
    if (g && !g.issue) { g.wakeAsked = true; s.phoneQueueFirst = true; G.bus.emit('phone:issue', { guestId: g.id, issue: { kind: 'wake', at: 570 } }); }
  }

  // 1) Reservasjoner som kommer nå
  if (!late) {
    for (const r of s.reservations) {
      if (r.night === s.night && r.status === 'expected' && !r.spawned && r.actMin <= m) {
        if (!queueSpace()) break;
        if (r.stolen) continue;
        spawnArrival(r);
        break;
      }
    }
  }
  // Ekte gjest kommer etter at en svindler tok rommet
  if (s.pendingConflicts?.length && queueSpace()) {
    const c = s.pendingConflicts[0];
    if (c.at <= m || m > 600) {
      s.pendingConflicts.shift();
      if (!late) { spawnWalkIn(c.charId, { conflictRes: resById(c.resId) }); log(`${ch(c.charId).name} kom – men reservasjonen er allerede «innsjekka».`, 'problem'); }
    }
  }
  // Svindler
  if (d.impostorAt != null && m >= d.impostorAt && queueSpace() && !late) {
    d.impostorAt = null;
    const target = s.reservations.find((r) => r.night === s.night && r.status === 'expected' && !r.spawned && r.actMin > m + 60);
    const imp = target && pickChar([target.charId]);
    if (target && imp) spawnArrival(target, { impostorChar: imp });
  }
  // 2) Utsjekkinger
  for (const g of guestsIn()) {
    if (!g.atDesk && g.checkoutAbs <= now && queueSpace()) { spawnCheckout(g); break; }
  }
  // 3) Rombytter som venter på nøkkelbytte
  for (const g of guestsIn()) {
    if (g.pendingMove && !g.atDesk && g.swapAt <= now && queueSpace()) { spawnReturn(g, 'swap'); break; }
  }
  // 4) Gjester som kommer ned med et ærend
  sendDeskPending();
  if (!late && queueSpace() && rnd() < 1 / 260 * scale) {
    const cand = guestsIn().filter((g) => !g.atDesk && !g.issue && !g.pendingMove);
    if (cand.length) spawnReturn(G.rng.pick(cand), rnd() < 0.35 ? 'lost' : 'question');
  }
  for (const g of guestsIn()) {
    if (g.lostAngry && now >= g.lostAngry) {
      g.lostAngry = null;
      G.bus.emit('phone:issue', { guestId: g.id, issue: { kind: 'demand' }, line: 'lost_angry' });
    }
  }
  // 5) Drop-in
  if (!late && m < 600 && m >= d.nextWalkIn) {
    const sleepy = m > 360 && m < 520 ? 1.7 : 1;
    d.nextWalkIn = m + Math.round((55 + rnd() * 60) * sleepy / scale);
    const full = Object.values(availability()).reduce((a, b) => a + Math.max(0, b), 0) <= 0;
    if (queueSpace() && (!full || rnd() < 0.3)) {
      const id = pickChar();
      if (id) spawnWalkIn(id);
    }
  }
  // Noen som ringte og spurte om ledig rom, kommer innom
  if (d.promised?.length && !late && queueSpace()) {
    const p = d.promised.find((x) => x.at <= m);
    if (p) {
      d.promised = d.promised.filter((x) => x !== p);
      const busy = s.queue.some((v) => v.charId === p.charId) || guestsIn().some((g) => g.charId === p.charId);
      if (!busy) spawnWalkIn(p.charId);
    }
  }
  // 6) Telefon: én felles takt for spontane samtaler (gjesteproblemer kommer i tillegg fra issues.js)
  if (m >= d.nextCall && m < 680) {
    d.nextCall = m + Math.round((85 + rnd() * 75) / Math.sqrt(scale));
    scheduleSpontaneous();
  }
  if (!d.mystery && m > 300 && m < 480 && !room('203').guestId && rnd() < 1 / 120) {
    d.mystery = true;
    scheduleMystery();
  }
}

/** Mot dødtid: er det stille lenge, framskyndes neste hendelse. */
export function antiIdle() {
  const s = S(), d = s.director;
  if (s.queue.length || s.phone.ringing || s.phone.active) return;
  if (G.realTime - G.lastActivity < 38) return;
  G.lastActivity = G.realTime;
  if (rnd() < 0.55 && s.min < 600) d.nextWalkIn = Math.min(d.nextWalkIn, s.min);
  else if (s.min < 640) d.nextCall = Math.min(d.nextCall, s.min);
}
