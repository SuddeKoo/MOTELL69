// Hodeløs test: kjører de ekte spillmodulene gjennom flere nattskift med en enkel «bot-resepsjonist»
// og sjekker at rom, gjester og nøkler alltid henger sammen. Bruk: node scripts/sim.mjs [netter] [seed]
import { G, S } from '../src/game/G.js';
import { RNG } from '../src/core/rng.js';
import { newGame, tick, endShift, startNextNight } from '../src/game/Game.js';
import * as desk from '../src/game/desk.js';
import * as phone from '../src/game/phone.js';
import * as cleaner from '../src/game/cleaner.js';
import * as motel from '../src/game/motel.js';
import { repair } from '../src/game/save.js';
import { ROOMS, ROOM_TYPES } from '../src/data/rooms.js';
import { CHARACTERS } from '../src/data/characters.js';

const NIGHTS = +(process.argv[2] || 4);
G.rng = new RNG(+(process.argv[3] || 6969));
G.settings = { nightLength: 17, textSpeed: 'instant' };
globalThis.setTimeout = (fn) => fn(); // forsinkede replikker kjøres med en gang

const errors = [];
const seen = new Set();
const callKinds = {};
const stats = { checkins: 0, checkouts: 0, calls: 0, moves: 0, idAsks: 0, impostors: 0, conflicts: 0, wakes: 0, errands: 0, linesSaid: 0, mutters: 0 };
G.bus.on('desk:say', ({ text }) => { stats.linesSaid++; if (!text || /\{\w+\}/.test(text)) errors.push(`Ugyldig replikk: «${text}»`); });
G.bus.on('desk:mutter', () => stats.mutters++);

function check(where) {
  const s = S();
  for (const r of ROOMS) {
    const st = s.rooms[r.no];
    const k = s.keys[r.no];
    if (st.status === 'occupied') {
      const g = s.guests[st.guestId];
      if (!g || g.status !== 'in' || g.room !== r.no) errors.push(`${where}: rom ${r.no} opptatt uten gyldig gjest`);
      // Under et rombytte kan den gamle nøkkelen henge på brettet til den nye er levert
      if (!['guest', 'counter', 'hand', 'tray'].includes(k) && !(g?.atDesk && g?.pendingMove)) errors.push(`${where}: rom ${r.no} opptatt men nøkkel=${k}`);
    } else if (k === 'guest') errors.push(`${where}: rom ${r.no} er ${st.status}, men gjest har nøkkelen`);
  }
  for (const g of Object.values(s.guests)) if (g.status === 'in' && s.rooms[g.room].guestId !== g.id) errors.push(`${where}: gjest ${g.charId} peker på rom ${g.room} som ikke peker tilbake`);
  if (s.hand && s.keys[s.hand] !== 'hand') errors.push(`${where}: hånd=${s.hand} men nøkkel=${s.keys[s.hand]}`);
  for (const no of s.tray) if (s.keys[no] !== 'tray') errors.push(`${where}: skål har ${no} men nøkkel=${s.keys[no]}`);
  if (s.queue.length > 3) errors.push(`${where}: kø på ${s.queue.length}`);
  const chars = [...s.queue, ...s.away].map((v) => v.charId);
  if (new Set(chars).size !== chars.length) errors.push(`${where}: samme figur to steder i køen`);
  const ins = motel.guestsIn().map((g) => g.charId);
  if (new Set(ins).size !== ins.length) errors.push(`${where}: samme figur bor i to rom`);
}

function freeRoomFor(type) {
  const ok = ROOMS.filter((r) => motel.assignable(r.no) && S().keys[r.no] === 'board');
  return (ok.find((r) => r.type === type) || ok[0])?.no;
}

let busyUntil = 0;
function bot() {
  const s = S();
  if (G.realTime < busyUntil) return;
  busyUntil = G.realTime + 2.5 + G.rng.next() * 3; // en ekte spiller bruker litt tid per handling
  // Telefon først hvis den ringer
  if (s.phone.ringing) { const c = s.phone.ringing.call; const k = c.kind === 'guest' ? `guest:${motel.guestById(c.guestId)?.issue?.kind}${c.callback ? '+cb' : ''}` : c.kind; callKinds[k] = (callKinds[k] || 0) + 1; phone.answer(); stats.calls++; return; }
  if (s.phone.active) {
    const o = phone.phoneOptions();
    phone.phoneChoose((o.find((x) => x.primary) || o.find((x) => x.id === 'move') || o.find((x) => x.id === 'help') || o[0]).id);
    phone.hangup();
    return;
  }
  // Vekking
  const due = phone.dueWakeRooms();
  if (due.length && s.min >= 0) { phone.dialRoom(due[0]); if (s.phone.active?.opts?.some((o) => o.id === 'o_wake')) { phone.phoneChoose('o_wake'); stats.wakes++; } phone.hangup(); return; }
  const v = desk.current();
  if (v) {
    seen.add(v.charId);
    if (v.kind === 'arrival') {
      if (!v.steps.res) {
        const r = s.reservations.find((x) => x.status === 'expected' && (x.charId === v.charId || x.id === v.targetRes));
        if (r) desk.linkReservation(r.id);
        else { const fr = freeRoomFor(v.wantType); if (fr) desk.createWalkInRes(v.wantType, v.nights); else desk.choose('full'); }
        return;
      }
      if (v.idState === 'none') { desk.choose('askid'); stats.idAsks++; return; }
      if (v.idState === 'forgot') { desk.choose('id_trust'); return; }
      if (v.idState === 'counter') {
        if (v.anomaly === 'impostor') { stats.impostors++; desk.idDecision(G.rng.next() < 0.5 ? 'reject' : 'approve'); }
        else desk.idDecision('approve');
        return;
      }
      if (!v.steps.room) {
        const no = freeRoomFor(v.wantType);
        if (no) { desk.assignRoom(no); return; }
        const d = ROOMS.find((r) => s.rooms[r.no].status === 'dirty');
        if (d && !s.cleaner.job) { cleaner.sendClean(d.no); return; }
        if (d || s.cleaner.job) { if (!v.calmUsed) desk.choose('calm'); return; }
        desk.choose('reject');
        return;
      }
      if (v.haggling) { desk.choose('disc_no'); return; }
      if (!v.steps.paid) { desk.choose('pay'); return; }
      if (v.wakeAsk) { desk.choose('wake_yes'); return; }
      if (s.hand !== v.room) { if (s.hand) motel.hangKey(s.hand) || motel.dropToTray(); motel.pickKey(v.room); return; }
      if (desk.giveKey()) stats.checkins++;
      return;
    }
    if (v.kind === 'checkout') {
      if (v.extendAsk) { desk.choose(G.rng.next() < 0.5 ? 'ext_yes' : 'ext_no'); return; }
      if (v.keyOnCounter) { if (s.hand) motel.dropToTray(); desk.takeCounterKey(); return; }
      desk.choose('checkout'); stats.checkouts++;
      return;
    }
    if (v.kind === 'return') {
      if (v.issueKind === 'swap') {
        if (v.stage === 'old_on_counter') { if (s.hand) motel.dropToTray(); desk.takeCounterKey(); return; }
        if (s.hand !== v.newRoom) { if (s.hand) { if (!motel.hangKey(s.hand)) motel.dropToTray(); } motel.pickKey(v.newRoom); return; }
        desk.giveKey(); stats.moves++;
        return;
      }
      const o = desk.deskOptions(v).options;
      desk.choose((o.find((x) => x.id === 'move') || o[0]).id);
      return;
    }
  }
  // Rydd hånda og skåla
  if (s.hand) { if (!motel.hangKey(s.hand)) motel.dropToTray(); return; }
  if (s.tray.length) { const no = s.tray[0]; motel.pickKey(no); motel.hangKey(no); return; }
  // Gjester som vil flytte
  const mover = motel.guestsIn().find((g) => g.wantsMove && !g.pendingMove);
  if (mover) { const t = ROOMS.find((r) => motel.assignable(r.no) && r.no !== mover.room && s.keys[r.no] === 'board'); if (t) motel.planMove(mover.id, t.no); return; }
  // Renholder
  if (!s.cleaner.job) {
    const e = motel.guestsIn().find((g) => g.errand);
    if (e) { cleaner.sendErrand(e.room); stats.errands++; return; }
    const d = ROOMS.find((r) => s.rooms[r.no].status === 'dirty');
    if (d) cleaner.sendClean(d.no);
  }
}

newGame();
G.paused = false;
const summaries = [];
G.bus.on('shift:end', (sum) => summaries.push(sum));
const dt = 1 / 10;
for (let n = 1; n <= NIGHTS; n++) {
  let lastMin = -1;
  while (!S().betweenShifts) {
    try { tick(dt); bot(); } catch (e) { errors.push(`Unntak natt ${n} ${Math.round(S().min)}: ${e.stack.split('\n').slice(0, 3).join(' | ')}`); break; }
    const m = Math.floor(S().min);
    if (m !== lastMin) { lastMin = m; check(`natt ${n} ${m}`); if (process.env.DBG && n === 2 && m % 60 === 0) console.log('N2', m, JSON.stringify({q: S().queue.map(v=>[v.charId,v.kind,v.phase,v.issueKind,v.stage, v.steps]), ph: !!S().phone.active, ring: !!S().phone.ringing, exp: S().reservations.filter(r=>r.night===2).map(r=>[r.charId,r.status,r.actMin,r.spawned]), nw: S().director.nextWalkIn, avail: motel.availability()})); }
    if (m === 300 && !S().flags.simSaved) {
      // Lagre/laste midt i natta (JSON + reparasjon) og sjekk at alt fortsatt henger sammen
      S().flags.simSaved = true;
      G.state = repair(JSON.parse(JSON.stringify(S())));
      check(`etter lasting natt ${n}`);
    }
    if (errors.length > 25) break;
  }
  if (errors.length > 25) break;
  delete S().flags.simSaved;
  check(`slutt natt ${n}`);
  if (n < NIGHTS) { startNextNight(); G.paused = false; }
}

const ins = motel.guestsIn();
console.log('Netter:', summaries.map((x) => `N${x.night}: ${x.income} kr, inn ${x.checkins}, ut ${x.checkouts}, snitt ${x.avgSat ?? '–'}%, tlf ${x.calls}/${x.missed} ubesvart, problemer ${x.problems.length}`).join('\n        '));
console.log('Bot:', JSON.stringify(stats));
console.log('Samtaler per type:', JSON.stringify(Object.fromEntries(Object.entries(callKinds).sort((a, b) => b[1] - a[1]))));
console.log(`Figurer som har vært ved disken: ${seen.size}/${CHARACTERS.length}`);
console.log('Bor her nå:', ins.map((g) => `${g.charId}@${g.room}(${Math.round(g.sat)}%)`).join(', '));
console.log('Eksempel på hukommelse:', ins[0] ? ins[0].mem.map((m) => m.t).join(' · ') : '–');
if (errors.length) { console.log(`\n${errors.length} FEIL:`); for (const e of errors.slice(0, 25)) console.log(' -', e); process.exit(1); }
console.log('\nOK: ingen inkonsistenser funnet.');
