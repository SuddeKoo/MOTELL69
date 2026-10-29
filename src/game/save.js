// Lagring i localStorage med versjon, migrering og reparasjon, så rom, nøkler og gjester
// aldri havner i umulige tilstander etter lasting.
import { SAVE_VERSION, newState, freshStats } from './newState.js';
import { ROOM_NOS } from '../data/rooms.js';

const KEY = 'motell69.save';

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

export function peekSave() {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function writeSave(state) {
  if (typeof localStorage === 'undefined') return false;
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { console.warn('Lagring feilet', e); return false; }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignorer */ }
}

export function readSave() {
  const raw = peekSave();
  if (!raw) return null;
  try { return repair(migrate(raw)); } catch (e) { console.warn('Ugyldig lagring', e); return null; }
}

function migrate(s) {
  if (!s.version) s.version = 1;
  // Framtidige versjoner: if (s.version < 2) { ...; s.version = 2; }
  // Fyll inn felt som mangler fra en ny standardtilstand
  const base = newState();
  for (const k of Object.keys(base)) if (s[k] === undefined) s[k] = base[k];
  s.nightStats = { ...freshStats(), ...s.nightStats };
  s.director = { ...base.director, ...s.director };
  s.phone = { ...base.phone, ...s.phone };
  s.version = SAVE_VERSION;
  return s;
}

/** Retter opp alt som kan ha blitt inkonsistent (f.eks. lagret midt i en samtale). */
export function repair(s) {
  for (const no of ROOM_NOS) {
    s.rooms[no] ||= { status: 'free', guestId: null, moveFor: null, cold: no === '203' };
    s.keys[no] ||= 'board';
  }
  // Gjester ↔ rom
  for (const g of Object.values(s.guests)) {
    if (g.status !== 'in') continue;
    const r = s.rooms[g.room];
    if (!r) { g.status = 'gone'; continue; }
    r.status = 'occupied'; r.guestId = g.id;
    g.atDesk = false;
    if (g.pendingMove && s.rooms[g.pendingMove]) s.rooms[g.pendingMove].moveFor = g.id;
  }
  for (const no of ROOM_NOS) {
    const r = s.rooms[no];
    if (r.status === 'occupied' && (!r.guestId || s.guests[r.guestId]?.status !== 'in' || s.guests[r.guestId].room !== no)) {
      r.status = 'dirty'; r.guestId = null;
    }
    if (r.status !== 'occupied') r.guestId = null;
    if (r.moveFor && s.guests[r.moveFor]?.pendingMove !== no) r.moveFor = null;
  }
  // Kø: bare gyldige besøk, og ingen halvveis inn-/utganger
  s.queue = (s.queue || []).filter((v) => {
    if ((v.kind === 'checkout' || v.kind === 'return') && s.guests[v.guestId]?.status !== 'in') return false;
    return v.phase !== 'leave';
  });
  s.queue = s.queue.slice(0, 3);
  // Den første går rett bort til disken igjen, de andre står på hver sin faste venteplass
  s.departing = null;
  s.queue.forEach((v, i) => {
    v.phase = i === 0 ? 'approach' : 'queue';
    v.slot = i === 0 ? null : i - 1;
    v.enterLeft = 0; v.approachLeft = 8; v.animDone = false;
    if (v.guestId && s.guests[v.guestId]) s.guests[v.guestId].atDesk = true;
  });
  for (const v of s.away || []) { v.returnAt = 0; }
  // Nøkler: hver nøkkel har nøyaktig ett sted
  const atCounter = new Set();
  for (const v of s.queue) {
    if (v.kind === 'checkout' && v.keyOnCounter) atCounter.add(v.room);
    if (v.kind === 'return' && v.stage === 'old_on_counter') atCounter.add(v.room);
  }
  if (s.hand && s.keys[s.hand] !== 'hand') s.hand = null;
  s.tray = (s.tray || []).filter((no) => s.keys[no] === 'tray');
  for (const no of ROOM_NOS) {
    const k = s.keys[no];
    const occ = s.rooms[no].status === 'occupied';
    if (k === 'hand' && s.hand !== no) s.keys[no] = occ ? 'guest' : 'board';
    if (k === 'counter' && !atCounter.has(no)) s.keys[no] = occ ? 'guest' : 'board';
    if (k === 'tray' && !s.tray.includes(no)) s.tray.push(no);
    if (k === 'guest' && !occ) s.keys[no] = 'board';
    if (atCounter.has(no)) s.keys[no] = 'counter';
  }
  // Telefon: en pågående samtale kan ikke gjenopptas – den ringer på nytt hvis det gjelder et problem
  const ph = s.phone;
  if (ph.active && ph.active.kind === 'guest') ph.scheduled.push({ at: 0, call: { ...ph.active, step: undefined, lines: undefined, callback: true } });
  if (ph.ringing) ph.scheduled.push({ at: 0, call: ph.ringing.call });
  ph.active = null; ph.ringing = null;
  // Renholder
  const j = s.cleaner.job;
  if (j && j.kind === 'clean' && s.rooms[j.room]?.status !== 'cleaning') s.cleaner.job = null;
  for (const no of ROOM_NOS) if (s.rooms[no].status === 'cleaning' && (!s.cleaner.job || s.cleaner.job.room !== no)) s.rooms[no].status = 'dirty';
  return s;
}
