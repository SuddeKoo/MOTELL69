// Ny spilltilstand. Første natt starter med to gjester i huset og ett skittent rom fra dagvakta,
// så romkartet, telefonen og renholderen har noe å gjøre uten en tradisjonell tutorial.
import { ROOMS } from '../data/rooms.js';

export const SAVE_VERSION = 1;

export function newState() {
  const rooms = {}, keys = {};
  for (const r of ROOMS) {
    rooms[r.no] = { status: 'free', guestId: null, moveFor: null, cold: r.tags.includes('cold') };
    keys[r.no] = 'board';
  }
  return {
    version: SAVE_VERSION,
    night: 1, min: 0,
    money: 0,
    nightStats: freshStats(),
    ratings: [],
    rooms, keys,
    hand: null,
    tray: [],
    reservations: [], nextResId: 1,
    guests: {}, nextGuestId: 1,
    history: {},          // per figur: { visits, lastSat, seen }
    queue: [], nextVisitorId: 1,
    departing: null,      // gjesten som er på vei ut fra disken (disken er opptatt til hen er ute)
    away: [],             // gjester som hentet ID i bilen o.l.
    phone: { ringing: null, active: null, scheduled: [], nextId: 1, quietUntil: 0, recent: [] },
    wakeups: [],
    notes: [],            // telefonblokka
    cleaner: { job: null, log: ['RENHOLDER LEDIG'] },
    director: { nextWalkIn: 60, nextCall: 45, nextEvent: 30, mystery: false, seeded: false, wakes: 0, promised: [] },
    log: [],
    flags: {},
    totals: { nights: 0, income: 0, checkins: 0, checkouts: 0 },
  };
}

export function freshStats() {
  return { income: 0, checkins: 0, checkouts: 0, sats: [], problems: [], lost: 0, walkedOut: 0, calls: 0, missed: 0 };
}
