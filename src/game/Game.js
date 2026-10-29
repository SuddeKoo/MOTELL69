// Spillsløyfe og skiftets livssyklus: klokke 20:00–08:00, tikk for alle systemer,
// skiftslutt med dagvakt-opprydding og oppsummering, autolagring.
import { G, S, emit, log } from './G.js';
import { newState, freshStats } from './newState.js';
import { readSave, writeSave } from './save.js';
import { NIGHT_MIN, absMin } from '../core/util.js';
import { guestsIn, guestById, checkOutGuest, pruneReservations, rating, ch } from './motel.js';
import { deskTick } from './desk.js';
import { phoneTick, wakeTick, queueGuestCall } from './phone.js';
import { cleanerTick } from './cleaner.js';
import { issueTick, promiseTick, openIssue } from './issues.js';
import { seedNight, directorMinute, antiIdle } from './director.js';
import { ROOM_NOS } from '../data/rooms.js';

let saveTimer = 0;
let wired = false;

function wire() {
  if (wired) return;
  wired = true;
  G.bus.on('phone:queueGuest', (id) => queueGuestCall(id));
  G.bus.on('phone:issue', ({ guestId, issue, line }) => {
    const g = guestById(guestId);
    if (!g || g.issue) return;
    if (line) issue.lineKey = line;
    openIssue(g, issue, 'phone');
  });
}

export function newGame() {
  wire();
  G.state = newState();
  seedNight();
  G.state.director.seeded = true;
  G.realTime = 0; G.lastActivity = 0;
  save();
}

export function loadGame() {
  wire();
  const s = readSave();
  if (!s) return false;
  G.state = s;
  G.realTime = 0; G.lastActivity = 0;
  return true;
}

export function save() {
  if (G.state) writeSave(G.state);
}

/** Virkelige sekunder siden forrige bilde. */
export function tick(dt) {
  if (G.paused || !G.state) return;
  dt = Math.min(dt, 0.25);
  const s = S();
  G.realTime += dt;
  const rate = NIGHT_MIN / ((G.settings?.nightLength || 17) * 60);
  const before = Math.floor(s.min);
  s.min = Math.min(NIGHT_MIN, s.min + dt * rate);
  const after = Math.floor(s.min);
  for (let m = before + 1; m <= after; m++) minute();
  deskTick(dt);
  phoneTick(dt);
  cleanerTick(dt);
  saveTimer += dt;
  if (saveTimer > 20) { saveTimer = 0; save(); }
  if (s.min >= NIGHT_MIN) endShift();
}

function minute() {
  directorMinute();
  issueTick();
  promiseTick();
  wakeTick();
  antiIdle();
  emit('clock');
}

// ───────────── Skiftslutt ─────────────
export function endShift() {
  const s = S();
  G.paused = true;
  const st = s.nightStats;
  // Dagvakta tar over det som står igjen
  let dayCheckouts = 0;
  for (const v of s.queue) {
    if (v.kind === 'checkout') {
      const g = guestById(v.guestId);
      if (g) { checkOutGuest(g, { keyTo: 'board' }); dayCheckouts++; }
    } else if (v.kind === 'arrival') {
      const r = s.reservations.find((x) => x.id === v.resId);
      if (r && r.status !== 'checked_in') r.status = 'noshow';
      if (v.steps?.paid) { s.money -= v.price; st.income -= v.price; }
      st.problems.push(`${ch(v.charId).first} sto fortsatt i kø da skiftet var slutt.`);
    } else if (v.guestId && guestById(v.guestId)) guestById(v.guestId).atDesk = false;
  }
  s.queue = [];
  s.away = [];
  const end = absMin(s.night, NIGHT_MIN);
  for (const g of guestsIn()) {
    if (g.checkoutAbs <= end) { checkOutGuest(g, { keyTo: s.keys[g.room] === 'hand' ? 'hand' : 'board' }); dayCheckouts++; }
  }
  for (const r of s.reservations) if (r.night === s.night && ['expected', 'arrived'].includes(r.status)) r.status = 'noshow';
  for (const v of Object.values(s.rooms)) if (v.status === 'cleaning' && !s.cleaner.job) v.status = 'dirty';
  // Ringende telefon dør ut
  s.phone.ringing = null; s.phone.active = null;
  s.phone.scheduled = s.phone.scheduled.filter((x) => x.call.kind === 'guest');
  const sats = st.sats;
  const avg = sats.length ? Math.round(sats.reduce((a, b) => a + b, 0) / sats.length) : null;
  const inHouse = guestsIn();
  const summary = {
    night: s.night, income: st.income, checkins: st.checkins, checkouts: st.checkouts, dayCheckouts,
    avgSat: avg, inHouseAvg: inHouse.length ? Math.round(inHouse.reduce((a, g) => a + g.sat, 0) / inHouse.length) : null,
    problems: st.problems.slice(-8), calls: st.calls, missed: st.missed, lost: st.lost, walkedOut: st.walkedOut,
    stars: rating(), money: s.money, target: 1500 + s.night * 500,
  };
  s.lastSummary = summary;
  s.totals.nights++;
  s.min = NIGHT_MIN;
  s.betweenShifts = true;
  save();
  emit('shift:end', summary);
}

/** Neste natt: alt beholdes (gjester, nøkler, reservasjoner, rom), bare klokka og dagsstatistikken nullstilles. */
export function startNextNight() {
  const s = S();
  s.night++;
  s.min = 0;
  s.betweenShifts = false;
  s.nightStats = freshStats();
  s.notes = s.notes.slice(-4);
  s.wakeups = s.wakeups.filter((w) => w.state === 'pending' && w.night >= s.night);
  s.director = { ...s.director, nextWalkIn: 40 + Math.floor(G.rng.next() * 40), nextCall: 40 + Math.floor(G.rng.next() * 50), nextEvent: 30, mystery: false, rush: 0, wakes: 0, promised: [] };
  for (const no of ROOM_NOS) s.rooms[no].cold = no === '203' || G.rng.next() < 0.08;
  // Dagvakta vasker det meste i løpet av dagen, men rekker sjelden alt
  const dirty = ROOM_NOS.filter((no) => s.rooms[no].status === 'dirty');
  const leave = Math.min(dirty.length, s.night <= 2 ? 1 : 2);
  const cleaned = G.rng.shuffle(dirty).slice(leave);
  for (const no of cleaned) s.rooms[no].status = 'free';
  if (dirty.length) log(`Dagvakta vaska ${cleaned.length} rom.${leave ? ` ${leave} står fortsatt skittent.` : ''}`);
  for (const no of ROOM_NOS) if (s.keys[no] === 'counter' || (s.keys[no] === 'tray' && s.rooms[no].status !== 'occupied')) s.keys[no] = 'board';
  s.tray = s.tray.filter((no) => s.keys[no] === 'tray');
  pruneReservations();
  seedNight();
  log(`Natt ${s.night} begynner.`);
  save();
  emit('rooms'); emit('book'); emit('clock'); emit('desk');
}
