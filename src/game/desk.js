// Resepsjonsdisken: kø (maks 3), innsjekking i fysiske steg, ID-kontroll, betaling,
// nøkkeloverlevering, utsjekking og gjester som kommer tilbake med et ærend.
import { G, S, emit, log, toast, rnd, touch } from './G.js';
import { CHAR_BY_ID, basePassNo } from '../data/characters.js';
import { profileOf, BOOKS_FOR } from '../data/motelProfiles.js';
import { ROOM_BY_NO, ROOM_TYPES, TYPE_ORDER, WISHES, priceFor } from '../data/rooms.js';
import { QUESTIONS } from '../data/dialogue/base.js';
import { say, nightsText } from '../data/dialogue/index.js';
import {
  resById, createReservation, room, assignable, heldFor, checkInGuest, checkOutGuest, guestById,
  adjustSat, remember, memoryLineKey, nowAbs, ch,
} from './motel.js';
import { issueLine, issueOptions, resolveIssue, wakeAllowed } from './issues.js';
import { hhmm, kr } from '../core/util.js';

// Køtilstander (v.phase):
//   'enter'    går fra døra til en fast venteplass (APPROACHING venteplass)
//   'queue'    WAITING på venteplassen sin (v.slot 0 = ved døra, 1 = ved vinduet)
//   'approach' APPROACHING disken
//   'counter'  AT_COUNTER, blir betjent
//   'leave'    LEAVING (ute av køen; S().departing holder disken opptatt til utgangen er ferdig)
// Bare én gjest kan være 'approach' eller 'counter' om gangen, og neste slippes ikke fram før
// visningen har bekreftet at forrige gjest faktisk har gått ut (deskExitDone).
export const QUEUE_MAX = 3;
export const queueSpace = () => S().queue.length + (S().departing ? 1 : 0) < QUEUE_MAX;
export const current = () => {
  const v = S().queue[0];
  return v && v.phase === 'counter' ? v : null;
};
// Sikkerhetsnett hvis en animasjonsbekreftelse aldri kommer (f.eks. skjult fane). Uten visning
// (hodeløs simulering) er dette bare gangtida.
const animWait = (headless) => (G.animConfirm ? 8 : headless);

function freeSlot() {
  const used = new Set(S().queue.filter((v) => v.phase === 'enter' || v.phase === 'queue').map((v) => v.slot));
  return used.has(0) ? 1 : 0;
}

/** Disken er ledig: ingen ved den, ingen på vei dit, ingen på vei ut. */
const counterFree = () => !S().departing && !S().queue.some((v) => v.phase === 'approach' || v.phase === 'counter');

function startApproach(v) {
  v.phase = 'approach';
  v.slot = null;
  v.animDone = false;
  v.approachLeft = animWait(1.3);
}

function atCounter(v) {
  v.phase = 'counter';
  v.animDone = false;
  v.lastInteract = G.realTime;
  if (!v.greeted) { v.greeted = true; greet(v); } else if (v.line) emit('desk:say', { id: v.id, text: v.line, mood: v.mood });
  emit('desk');
}

/** Fra visningen: gangen til venteplassen eller disken er ferdig. Behandles i neste tikk (ikke under pause). */
export function deskAnimDone(id) {
  const v = S()?.queue.find((x) => x.id === id);
  if (v && (v.phase === 'enter' || v.phase === 'approach')) v.animDone = true;
}

/** Fra visningen: gjesten som gikk fra disken er ute av resepsjonen. */
export function deskExitDone(id) {
  const d = S()?.departing;
  if (d && d.id === id) d.done = true;
}
const tok = (v, extra = {}) => ({ first: ch(v.charId).first, room: v.room, ...extra });

function speak(v, text, mood) {
  if (!text) return;
  v.line = text;
  if (mood) v.mood = mood;
  emit('desk:say', { id: v.id, text, mood: v.mood });
}

function baseVisitor(kind, charId, extra) {
  const s = S();
  const p = profileOf(charId);
  const mult = kind === 'checkout' ? 0.85 : kind === 'return' ? 0.9 : 1;
  return {
    id: s.nextVisitorId++, kind, charId, phase: 'enter', enterLeft: animWait(1.7), slot: 0, animDone: false,
    patience: 0, patienceMax: Math.round(165 * p.patience * mult), waitStage: 0, calmUntil: 0, calmUsed: false,
    lastInteract: 0, line: '', mood: 'normal', satDelta: 0, ...extra,
  };
}

function push(v) {
  // Tom resepsjon: rett bort til disken. Ellers til en ledig fast venteplass.
  if (counterFree() && !S().queue.length) startApproach(v);
  else v.slot = freeSlot();
  S().queue.push(v);
  G.audio?.play('door');
  G.audio?.play('bell', { delay: 0.25, volume: 0.6 });
  touch();
  emit('desk');
}

// ───────────── Opprettelse ─────────────
function makeIdDoc(charId, anomaly) {
  const c = CHAR_BY_ID[charId];
  const kinds = c.nationality === 'NORGE' ? ['FØRERKORT', 'ID-KORT', 'BANKKORT M/ BILDE'] : ['PASS'];
  const doc = { kind: G.rng.pick(kinds), name: c.name, charId, birth: c.birth, hometown: c.hometown, no: basePassNo(c), year: 2016 + Math.floor(rnd() * 9), overrides: null };
  if (anomaly === 'old_photo') {
    doc.year = 1999 + Math.floor(rnd() * 12);
    const hairs = ['long', 'messy', 'buzz', 'curly', 'mohawk', 'bob', 'middle_part'];
    doc.overrides = { hair: G.rng.pick(hairs.filter((h) => h !== c.look.hair)), hairColor: G.rng.pick(['#2a1c14', '#c9a24a', '#7a4a2b', '#151515']), beard: null, hat: null, glasses: null };
  }
  return doc;
}

/** Gjest med reservasjon (eller svindler som utgir seg for å ha en). */
export function spawnArrival(res, { impostorChar = null } = {}) {
  const charId = impostorChar || res.charId;
  const p = profileOf(charId);
  let anomaly = null;
  if (impostorChar) anomaly = 'impostor';
  else if (res.name !== ch(res.charId).name) anomaly = 'other_booker';
  else if (rnd() < (p.forgetsId || 0.05)) anomaly = 'forgot_id';
  else if (rnd() < (p.wrongName || 0.03)) anomaly = 'wrong_name';
  else if (rnd() < 0.05) anomaly = 'old_photo';
  let statedName = res.name;
  if (anomaly === 'wrong_name') {
    const other = G.rng.pick(Object.values(CHAR_BY_ID).filter((c) => c.id !== charId));
    statedName = `${ch(charId).first} ${other.name.split(' ').pop()}`;
  }
  const v = baseVisitor('arrival', charId, {
    resId: impostorChar ? null : res.id, targetRes: impostorChar ? res.id : null, walkIn: false,
    statedName, wantType: res.type, wish: res.wish, nights: res.nights, anomaly,
    idDoc: anomaly === 'forgot_id' ? null : makeIdDoc(charId, anomaly), idState: 'none',
    steps: { res: false, id: false, room: null, paid: false }, room: null, price: 0, fraud: false,
  });
  if (!impostorChar) res.spawned = true;
  push(v);
  return v;
}

export function spawnWalkIn(charId, { conflictRes = null } = {}) {
  const p = profileOf(charId);
  let nights = p.nights[0] + Math.floor(rnd() * (p.nights[1] - p.nights[0] + 1));
  if (conflictRes) nights = conflictRes.nights;
  const wantType = conflictRes ? conflictRes.type : rnd() < 0.7 ? p.type : G.rng.pick(['standard', 'standard', 'komfort', 'suite']);
  const wish = rnd() < 0.7 && p.wishes.length ? p.wishes[0] : null;
  const anomaly = rnd() < (p.forgetsId || 0.04) ? 'forgot_id' : rnd() < 0.05 ? 'old_photo' : null;
  const v = baseVisitor('arrival', charId, {
    resId: null, walkIn: true, conflict: !!conflictRes, statedName: ch(charId).name, wantType, wish, nights, anomaly,
    idDoc: anomaly === 'forgot_id' ? null : makeIdDoc(charId, anomaly), idState: 'none',
    steps: { res: false, id: false, room: null, paid: false }, room: null, price: 0, fraud: false,
  });
  push(v);
  return v;
}

export function spawnCheckout(g) {
  g.atDesk = true;
  const v = baseVisitor('checkout', g.charId, {
    guestId: g.id, room: g.room, keyOnCounter: true, extendAsk: rnd() < 0.1 && g.sat > 55, done: false,
  });
  S().keys[g.room] = 'counter';
  push(v);
  emit('keys');
  return v;
}

export function spawnReturn(g, kind) {
  g.atDesk = true;
  const extra = { guestId: g.id, room: g.room, issueKind: kind, stage: 'talk' };
  if (kind === 'swap') { extra.stage = 'old_on_counter'; extra.newRoom = g.pendingMove; S().keys[g.room] = 'counter'; emit('keys'); }
  if (kind === 'lost') {
    const others = Object.keys(S().rooms).filter((n) => n !== g.room);
    extra.choices = G.rng.shuffle([g.room, ...G.rng.pickN(others, 2)]);
  }
  if (kind === 'question') extra.q = G.rng.pick(QUESTIONS);
  const v = baseVisitor('return', g.charId, extra);
  push(v);
  return v;
}

// ───────────── Hilsen når gjesten kommer fram til disken ─────────────
function greet(v) {
  const c = ch(v.charId);
  if (v.kind === 'arrival') {
    if (v.conflict) { speak(v, say(v.charId, 'impostor_conflict', {}), 'irritated'); return; }
    if (v.walkIn) {
      const short = v.nights <= 0;
      let t = say(v.charId, short ? 'arrive_short' : 'arrive_walkin', {});
      t += ' ' + say(v.charId, 'want_type', { type: ROOM_TYPES[v.wantType].name });
      if (!short) t += ` ${nightsText(v.nights)[0].toUpperCase()}${nightsText(v.nights).slice(1)}.`;
      t += ' ' + say(v.charId, v.wish ? `wish_${v.wish}` : 'wish_none', {});
      speak(v, t);
    } else {
      let t = say(v.charId, 'arrive_res', { name: v.statedName });
      if (v.anomaly === 'other_booker') {
        const res = resById(v.resId);
        t += ' ' + say(v.charId, 'booker_explain', { booker: res.name });
      }
      speak(v, t, v.anomaly === 'impostor' ? 'nervous' : undefined);
    }
  } else if (v.kind === 'checkout') {
    speak(v, say(v.charId, 'checkout_hello', { room: v.room }));
  } else if (v.kind === 'return') {
    const g = guestById(v.guestId);
    if (v.issueKind === 'swap') speak(v, say(v.charId, 'swap_hello', {}));
    else if (v.issueKind === 'issue') speak(v, issueLine(g) || say(v.charId, 'question', {}));
    else if (v.issueKind === 'lost') speak(v, say(v.charId, 'lost_number', {}), 'confused');
    else if (v.issueKind === 'question') speak(v, G.rng.pick(v.q.ask));
    else if (v.issueKind === 'complain_ignored') speak(v, say(v.charId, 'callback', {}) + ' ' + (issueLine(g) || ''), 'irritated');
  }
  G.audio?.vocal(c, 'arrive');
}

// ───────────── Valgmuligheter ved disken ─────────────
export function deskOptions(v = current()) {
  if (!v) return { hint: '', options: [] };
  const o = [];
  let hint = '';
  const add = (id, label, extra = {}) => o.push({ id, label, ...extra });
  if (v.kind === 'arrival') {
    const st = v.steps;
    if (!st.res) {
      if (v.walkIn) { add('newres', 'Skriv inn ny reservasjon i boka'); add('full', 'Beklager, vi e fulle', { tone: 'bad' }); }
      else add('book', 'Slå opp i reservasjonsboka');
    }
    if (v.idState === 'none') add('askid', 'Legitimasjon, takk');
    else if (v.idState === 'counter') add('inspect', 'Undersøk legitimasjonen');
    else if (v.idState === 'forgot') {
      add('id_fetch', 'Hent den, æ venter');
      add('id_trust', 'Greit, æ stole på dæ');
      add('id_deny', 'Ingen legitimasjon, ingen rom', { tone: 'bad' });
    }
    if (v.haggling) { add('disc_yes', `Greit, 15 % rabatt (${kr(Math.round(v.price * 0.85 / 10) * 10)})`); add('disc_no', 'Nei, fast pris'); }
    else if (st.room && !st.paid) add('pay', `Ta betalt: ${kr(v.price)}`, { primary: true });
    if (v.wakeAsk) { add('wake_yes', `Skriv ned vekking ${hhmm(v.wakeAsk)}`); add('wake_no', 'Vi har ikkje vekking'); }
    if (st.res && !st.room && !v.askedWish) add('askwish', 'Ka slags rom ønske du deg?');
    if (!st.res) hint = v.walkIn ? 'Ny gjest. Opprett reservasjon i boka.' : 'Finn reservasjonen i boka.';
    else if (!st.id && v.idState !== 'forgot') hint = 'Sjekk legitimasjonen.';
    else if (!st.room) hint = 'Velg et ledig rom på romkartet (D →).';
    else if (!st.paid) hint = 'Ta betalt.';
    else hint = `Hent nøkkel ${v.room} på nøkkelbrettet (← A) og gi den til gjesten.`;
    if (!v.calmUsed) add('calm', 'Et øyeblikk, æ ska bare…');
    add('reject', 'Avvis gjesten', { tone: 'bad' });
  } else if (v.kind === 'checkout') {
    if (v.extendAsk) { add('ext_yes', `Ja, en natt til (${kr(ROOM_TYPES[ROOM_BY_NO[v.room].type].price)})`); add('ext_no', 'Beklager, rommet e booka'); }
    else if (v.keyOnCounter) { add('takekey', `Ta imot nøkkel ${v.room}`, { primary: true }); hint = 'Gjesten har lagt nøkkelen på disken.'; }
    else { add('checkout', 'Registrer utsjekking', { primary: true }); hint = 'Registrer utsjekkingen. Heng nøkkelen tilbake på brettet etterpå.'; }
  } else if (v.kind === 'return') {
    const g = guestById(v.guestId);
    if (v.issueKind === 'swap') {
      if (v.stage === 'old_on_counter') { add('takekey', `Ta imot gammel nøkkel (${v.room})`, { primary: true }); hint = 'Rombytte: ta imot den gamle nøkkelen.'; }
      else hint = `Gi gjesten nøkkel ${v.newRoom} fra nøkkelbrettet (← A).`;
    } else if ((v.issueKind === 'issue' || v.issueKind === 'complain_ignored') && g?.issue) {
      for (const x of issueOptions(g)) o.push(x);
    } else if (v.issueKind === 'lost') {
      for (const n of v.choices) add(`lost_${n}`, `Du bor på rom ${n}`);
      hint = 'Sjekk romkartet eller boka hvis du e usikker.';
    } else if (v.issueKind === 'question') {
      v.q.answers.forEach((a, i) => add(`q_${i}`, a.label));
    } else add('bye', 'God natt');
  }
  return { hint, options: o };
}

// ───────────── Handlinger ─────────────
export function choose(id) {
  const v = current();
  if (!v) return;
  v.lastInteract = G.realTime;
  touch();
  const c = ch(v.charId);
  G.audio?.play('click', { volume: 0.4 });

  if (id === 'book' || id === 'newres') { emit('ui:openBook', { mode: id === 'newres' ? 'new' : 'tonight' }); return; }
  if (id === 'inspect') { emit('ui:openId'); return; }
  if (id === 'calm') { v.calmUsed = true; v.calmUntil = G.realTime + 45; speak(v, say(v.charId, 'calm', {})); emit('desk'); return; }
  if (id === 'reject') return rejectVisitor(v);
  if (id === 'full') {
    speak(v, say(v.charId, 'leave_full', {}));
    log(`${c.first} ble avvist (fullt).`);
    return leave(v, 'door', 1.6);
  }
  if (id === 'askid') return askId(v);
  if (id === 'id_fetch') {
    speak(v, say(v.charId, 'id_fetch', {}));
    v.satDelta -= 2;
    v.idState = 'none'; v.anomaly = null; v.idDoc = makeIdDoc(v.charId, null);
    v.returnAt = G.realTime + 22 + rnd() * 16;
    return leave(v, 'door', 1.6, { away: true });
  }
  if (id === 'id_trust') { v.steps.id = true; v.idState = 'trusted'; v.satDelta += 3; speak(v, say(v.charId, 'id_trust', {}), 'happy'); emit('desk'); return; }
  if (id === 'id_deny') return rejectVisitor(v, 'id');
  if (id === 'askwish') {
    v.askedWish = true;
    const w = v.wish ? WISHES[v.wish].label.toLowerCase() : 'ingen spesielle ønsker';
    speak(v, say(v.charId, 'restate', { type: ROOM_TYPES[v.wantType].name, wish: w }));
    emit('desk');
    return;
  }
  if (id === 'pay') return takePayment();
  if (id === 'disc_yes') { v.price = Math.round(v.price * 0.85 / 10) * 10; v.haggling = false; v.satDelta += 6; speak(v, say(v.charId, 'discount_yes', {}), 'happy'); return finishPay(v); }
  if (id === 'disc_no') { v.haggling = false; v.satDelta -= 4; speak(v, say(v.charId, 'discount_no', {}), 'irritated'); return finishPay(v); }
  if (id === 'wake_yes') {
    const s = S();
    v.wakeNote = v.wakeAsk; v.wakeAsk = null;
    s.notes.push(`VEKK ${v.room} kl ${hhmm(v.wakeNote)}`);
    speak(v, say(v.charId, 'wake_ok', {}));
    emit('notes'); emit('desk');
    return;
  }
  if (id === 'wake_no') { v.wakeAsk = null; v.satDelta -= 2; speak(v, say(v.charId, 'wake_no', {})); emit('desk'); return; }
  if (id === 'takekey') return takeCounterKey();
  if (id === 'checkout') return registerCheckout();
  if (id === 'ext_yes' || id === 'ext_no') return extend(v, id === 'ext_yes');
  if (id === 'bye') { speak(v, say(v.charId, 'return_thanks', {})); return finishReturn(v); }
  if (id.startsWith('lost_')) {
    const g = guestById(v.guestId);
    const n = id.slice(5);
    if (n === g.room) { adjustSat(g, 2); speak(v, say(v.charId, 'lost_right', {}), 'happy'); }
    else {
      speak(v, say(v.charId, 'lost_wrong', {}));
      g.lostAngry = nowAbs() + 15;
      log(`${c.first} ble sendt til feil rom (${n}).`);
    }
    return finishReturn(v);
  }
  if (id.startsWith('q_')) {
    const a = v.q.answers[+id.slice(2)];
    const g = guestById(v.guestId);
    if (g) adjustSat(g, a.sat);
    speak(v, G.rng.pick(a.reply));
    return finishReturn(v);
  }
  // Problemløsning ved disken
  const g = guestById(v.guestId);
  if (g?.issue) {
    const line = resolveIssue(g, id);
    speak(v, line);
    if (id === 'move') toast(`Velg et nytt rom til ${c.first} på romkartet. Gjesten kommer ned og bytter nøkkel.`);
    return finishReturn(v);
  }
}

function askId(v) {
  if (v.anomaly === 'forgot_id') {
    v.idState = 'forgot';
    speak(v, say(v.charId, 'id_forgot', {}), 'nervous');
  } else {
    v.idState = 'counter';
    speak(v, say(v.charId, 'id_give', {}));
    G.audio?.play('put', { volume: 0.5 });
  }
  emit('desk');
}

/** Fra ID-visningen: godkjenn / spør / avvis. */
export function idDecision(kind) {
  const v = current();
  if (!v || v.kind !== 'arrival') return;
  v.lastInteract = G.realTime;
  touch();
  if (kind === 'approve') {
    v.steps.id = true; v.idState = 'ok';
    if (v.anomaly === 'impostor') v.fraud = true;
    G.audio?.play('stamp', { volume: 0.5 });
    emit('desk');
  } else if (kind === 'ask') {
    let line;
    const res = resById(v.resId || v.targetRes);
    switch (v.anomaly) {
      case 'other_booker': line = say(v.charId, 'ask_other_booker', { booker: res?.name || '' }); break;
      case 'old_photo': line = say(v.charId, 'ask_old_photo', {}); break;
      case 'wrong_name': line = say(v.charId, 'ask_wrong_name', {}); break;
      case 'impostor': line = say(v.charId, 'impostor_bluff', { name: v.statedName.split(' ')[0] }); v.mood = 'nervous'; break;
      default: line = say(v.charId, 'ask_normal', {}); v.satDelta -= 2;
    }
    v.asked = true;
    speak(v, line);
    emit('desk');
  } else if (kind === 'reject') {
    rejectVisitor(v, 'id');
  }
}

function rejectVisitor(v, why) {
  const c = ch(v.charId);
  const s = S();
  if (v.kind !== 'arrival') { speak(v, say(v.charId, 'r_refuse', {})); return finishReturn(v); }
  if (v.anomaly === 'impostor') {
    speak(v, say(v.charId, 'impostor_caught', {}), 'irritated');
    log(`Avslørte ${c.name}, som utga seg for å være en annen gjest.`, 'good');
    s.ratings.push(80);
  } else {
    speak(v, say(v.charId, why === 'id' ? 'id_refused' : 'turned_away', {}), 'angry');
    const res = resById(v.resId);
    if (res) { res.status = 'cancelled'; emit('book'); }
    s.nightStats.lost += priceFor(v.wantType, Math.max(1, v.nights));
    log(`${c.name} ble avvist${res ? ' – hadde reservasjon' : ''}.`, res ? 'problem' : 'info');
    if (res) s.ratings.push(25);
  }
  if (v.steps?.room) unassign(v);
  leave(v, 'door', 1.8);
}

function unassign(v) {
  v.steps.room = null;
  v.room = null;
}

/** Fra boka: knytt en reservasjon til gjesten ved disken. */
export function linkReservation(resId) {
  const v = current();
  if (!v || v.kind !== 'arrival' || v.steps.res) return false;
  const r = resById(resId);
  if (!r) return false;
  v.lastInteract = G.realTime;
  touch();
  const ok = (r.status === 'expected' && r.charId === v.charId) || (v.anomaly === 'impostor' && r.id === v.targetRes && r.status === 'expected');
  if (v.conflict && r.status === 'checked_in' && r.charId === v.charId) {
    speak(v, say(v.charId, 'impostor_conflict', {}), 'angry');
    return false;
  }
  if (!ok) {
    speak(v, say(v.charId, 'wrong_res', {}), 'confused');
    v.patience += 8;
    return false;
  }
  v.steps.res = true;
  v.resId = r.id;
  v.wantType = r.type; v.nights = r.nights; v.wish = r.wish;
  r.status = 'arrived';
  speak(v, say(v.charId, v.anomaly === 'wrong_name' ? 'res_found_sleepy' : 'res_found', {}));
  G.audio?.play('pen');
  emit('book'); emit('desk');
  return true;
}

/** Fra boka: ny reservasjon for gjesten ved disken (drop-in). */
export function createWalkInRes(type, nights) {
  const v = current();
  if (!v || v.kind !== 'arrival' || v.steps.res) return null;
  v.lastInteract = G.realTime;
  const r = createReservation({ charId: v.charId, name: ch(v.charId).name, expMin: S().min, actMin: S().min, nights, type, wish: v.wish, source: 'walkin', status: 'arrived', note: v.conflict ? 'Rommet ble tatt av en annen' : 'Drop-in' });
  r.spawned = true;
  v.steps.res = true;
  v.resId = r.id;
  if (type !== v.wantType) v.satDelta += TYPE_ORDER.indexOf(type) > TYPE_ORDER.indexOf(v.wantType) ? 0 : -4;
  v.wantType = type; v.nights = nights;
  speak(v, say(v.charId, 'res_found', {}));
  G.audio?.play('pen');
  emit('book'); emit('desk');
  return r;
}

/** Fra romkartet: tildel rom til gjesten ved disken. */
export function assignRoom(no) {
  const v = current();
  if (!v || v.kind !== 'arrival' || !v.steps.res || v.steps.paid) return false;
  if (!assignable(no)) { toast(`Rom ${no} kan ikkje tildeles nå.`); return false; }
  v.lastInteract = G.realTime;
  touch();
  const r = resById(v.resId);
  const held = heldFor(no);
  if (held && held.id !== r.id) { held.roomNo = null; log(`Rom ${no} var holdt av for ${held.name}. Det må finnes et anna rom.`, 'warn'); }
  v.room = no; v.steps.room = no; r.roomNo = no;
  const rt = ROOM_BY_NO[no].type;
  const nights = Math.max(0, v.nights);
  v.upgrade = TYPE_ORDER.indexOf(rt) > TYPE_ORDER.indexOf(v.wantType);
  v.downgrade = TYPE_ORDER.indexOf(rt) < TYPE_ORDER.indexOf(v.wantType);
  v.price = priceFor(v.upgrade ? v.wantType : rt, nights);
  let t = say(v.charId, 'room_given', { room: no });
  if (v.downgrade) t += ' ' + say(v.charId, 'type_down', { type: ROOM_TYPES[v.wantType].name });
  else if (v.upgrade) t += ' ' + say(v.charId, 'type_up', {});
  speak(v, t, v.downgrade ? 'irritated' : v.upgrade ? 'happy' : undefined);
  G.audio?.play('pen');
  emit('desk'); emit('book'); emit('rooms', no);
  return true;
}

function takePayment() {
  const v = current();
  if (!v || !v.steps.room || v.steps.paid) return;
  const p = profileOf(v.charId);
  if (p.haggle && !v.haggled) {
    v.haggled = true; v.haggling = true;
    speak(v, say(v.charId, 'haggle', { price: kr(v.price) }), 'irritated');
    emit('desk');
    return;
  }
  speak(v, say(v.charId, 'price', { price: kr(v.price) }));
  finishPay(v);
}

function finishPay(v) {
  const s = S();
  v.steps.paid = true;
  s.money += v.price;
  s.nightStats.income += v.price;
  s.totals.income += v.price;
  G.audio?.play('imprint');
  // Noen vil ha vekking hvis de reiser tidlig i morra
  // Sjelden: en og annen vil ha vekking (felles grense med telefonen)
  if (v.nights >= 1 && wakeAllowed() && rnd() < 0.06) { v.wakeAsk = Math.min(700, 540 + 10 * Math.floor(rnd() * 15)); S().director.wakes = (S().director.wakes || 0) + 1; }
  if (v.wakeAsk) setTimeout(() => { if (current() === v) speak(v, say(v.charId, 'wake_ask', { time: hhmm(v.wakeAsk) })); }, 1400);
  emit('money'); emit('desk');
}

/** Spilleren drar nøkkelen i hånda til gjesten. Returnerer true hvis nøkkelen ble levert. */
export function giveKey() {
  const v = current();
  const s = S();
  const no = s.hand;
  if (!v || !no) return false;
  v.lastInteract = G.realTime;
  touch();
  if (v.kind === 'arrival') {
    if (!v.steps.room) { speak(v, say(v.charId, 'key_noroom', {}), 'confused'); return false; }
    if (no !== v.room) { speak(v, say(v.charId, 'key_wrong', { other: no, room: v.room }), 'confused'); G.audio?.vocal(ch(v.charId), 'deny'); return false; }
    if (!v.steps.res || !v.steps.id) { speak(v, 'Ska du ikkje sjekke legitimasjonen først?', 'confused'); return false; }
    if (!v.steps.paid) { speak(v, say(v.charId, 'key_early', {}), 'confused'); return false; }
    s.hand = null;
    const g = checkInGuest(v);
    if (v.wakeNote) s.wakeups.push({ room: v.room, guestId: g.id, at: v.wakeNote, night: s.night + Math.max(0, v.nights - 1), state: 'pending' });
    if (v.fraud) {
      g.fraud = true;
      const real = resById(v.targetRes);
      if (real) { real.status = 'checked_in'; real.guestId = g.id; real.stolen = true; S().pendingConflicts = [...(S().pendingConflicts || []), { resId: real.id, charId: real.charId, at: real.actMin }]; }
    }
    let t = say(v.charId, 'key_thanks', {});
    if (v.wish) {
      const fit = g.mem.find((m) => m.k === 'wish' || m.k === 'wish_missed');
      if (fit) t += ' ' + say(v.charId, fit.k === 'wish' ? 'wish_met' : 'wish_missed', {});
    }
    speak(v, t, g.sat >= 60 ? 'happy' : 'normal');
    G.audio?.play('handover');
    G.audio?.vocal(ch(v.charId), 'approve');
    emit('hand'); emit('keys');
    leave(v, 'hall', 1.8);
    return true;
  }
  if (v.kind === 'return' && v.issueKind === 'swap') {
    if (v.stage !== 'need_new') { speak(v, 'Ta den gamle nøkkelen først.', 'confused'); return false; }
    if (no !== v.newRoom) { speak(v, say(v.charId, 'key_wrong', { other: no, room: v.newRoom }), 'confused'); return false; }
    completeMove(v);
    return true;
  }
  speak(v, 'Ka ska æ med den?', 'confused');
  return false;
}

function completeMove(v) {
  const s = S();
  const g = guestById(v.guestId);
  const from = g.room, to = v.newRoom;
  s.hand = null;
  s.rooms[from].status = 'dirty'; s.rooms[from].guestId = null;
  s.rooms[to].status = 'occupied'; s.rooms[to].guestId = g.id; s.rooms[to].moveFor = null;
  s.keys[to] = 'guest';
  g.room = to; g.pendingMove = null;
  const res = resById(g.resId);
  if (res) res.roomNo = to;
  if (g.wantsMove) { adjustSat(g, 10, 'moved', `Flyttet fra ${from} til ${to}`); g.wantsMove = false; g.promise = null; }
  else adjustSat(g, -3, 'moved_unasked', `Ble flyttet fra ${from} til ${to}`);
  if (ROOM_BY_NO[to].tags.includes('quiet') && g.wish === 'quiet') adjustSat(g, 4);
  g.wishMissed = false;
  for (const w of s.wakeups) if (w.guestId === g.id) w.room = to;
  speak(v, say(v.charId, 'swap_done', {}), 'happy');
  G.audio?.play('handover');
  log(`${ch(g.charId).first} flyttet fra rom ${from} til ${to}.`);
  emit('rooms', from); emit('rooms', to); emit('keys'); emit('hand'); emit('book');
  finishReturn(v, 'hall');
}

/** Klikk på nøkkelen gjesten la på disken. */
export function takeCounterKey() {
  const v = current();
  const s = S();
  if (!v || !(v.keyOnCounter || v.stage === 'old_on_counter')) return false;
  if (s.hand) {
    // Har spilleren noe i hånda, legges det i nøkkelskåla først
    s.keys[s.hand] = 'tray';
    if (!s.tray.includes(s.hand)) s.tray.push(s.hand);
  }
  const no = v.room;
  s.keys[no] = 'hand'; s.hand = no;
  if (v.kind === 'checkout') v.keyOnCounter = false;
  else {
    v.stage = 'need_new';
    // Gammelt rom frigjøres først når den nye nøkkelen er levert
  }
  G.audio?.play('keys');
  touch();
  emit('keys'); emit('hand'); emit('desk');
  return true;
}

function registerCheckout() {
  const v = current();
  if (!v || v.kind !== 'checkout' || v.keyOnCounter) return;
  const g = guestById(v.guestId);
  if (!g) return leave(v, 'door', 0.5);
  const memKey = memoryLineKey(g);
  checkOutGuest(g, {});
  let t = say(v.charId, g.sat >= 68 ? 'checkout_good' : g.sat >= 42 ? 'checkout_ok' : 'checkout_bad', {});
  if (memKey) t = say(v.charId, memKey, {}) + ' ' + t;
  speak(v, t, g.sat >= 68 ? 'happy' : g.sat < 42 ? 'irritated' : 'normal');
  G.audio?.play('pen');
  log(`${ch(g.charId).first} sjekket ut av rom ${g.room} (${Math.round(g.sat)} % fornøyd).`);
  G.audio?.vocal(ch(v.charId), g.sat >= 50 ? 'approve' : 'deny');
  leave(v, 'door', 2.2);
}

function extend(v, yes) {
  const g = guestById(v.guestId);
  v.extendAsk = false;
  if (yes && g) {
    const p = ROOM_TYPES[ROOM_BY_NO[g.room].type].price;
    const s = S();
    s.money += p; s.nightStats.income += p; s.totals.income += p;
    g.checkoutAbs += 720; g.nights++;
    g.atDesk = false;
    s.keys[g.room] = 'guest';
    adjustSat(g, 5, 'extended', 'Fikk bli en natt til');
    speak(v, say(v.charId, 'extend_yes', {}), 'happy');
    G.audio?.play('imprint');
    emit('money'); emit('keys');
    log(`${ch(g.charId).first} forlenget oppholdet på rom ${g.room}.`);
    leave(v, 'hall', 1.6);
  } else {
    speak(v, say(v.charId, 'extend_no', {}));
    emit('desk');
  }
}

function finishReturn(v, exit = 'hall') {
  const g = guestById(v.guestId);
  if (g) g.atDesk = false;
  if (v.issueKind === 'swap' && v.stage !== 'done' && g && g.pendingMove) {
    // Gjesten gikk før byttet ble fullført: den gamle nøkkelen går tilbake til gjesten, og de prøver igjen senere
    const st = S();
    if (st.keys[g.room] !== 'guest') {
      if (st.hand === g.room) st.hand = null;
      st.tray = st.tray.filter((x) => x !== g.room);
      st.keys[g.room] = 'guest';
      emit('keys'); emit('hand');
    }
    g.swapAt = nowAbs() + 25;
  }
  leave(v, exit, 1.8);
}

/** Gjesten går fra disken. away = kommer tilbake (henter ID i bilen). */
export function leave(v, exit = 'door', delay = 1.2, { away = false } = {}) {
  const s = S();
  const fromCounter = v.phase === 'counter' || v.phase === 'approach';
  v.phase = 'leave';
  v.exit = exit;
  s.queue = s.queue.filter((x) => x !== v);
  if (away) s.away.push(v);
  // Disken er opptatt til gjesten faktisk har gått ut
  if (fromCounter) s.departing = { id: v.id, done: false, left: delay + animWait(1.4) };
  emit('desk:leave', { v, delay, fromCounter });
  emit('desk');
  touch();
}

// ───────────── Tikk (virkelige sekunder) ─────────────
export function deskTick(dt) {
  const s = S();
  // Gange: til venteplassen, til disken, og ut
  for (const v of s.queue) {
    if (v.phase === 'enter') {
      v.enterLeft -= dt;
      if (v.animDone || v.enterLeft <= 0) { v.phase = 'queue'; v.animDone = false; emit('desk'); }
    } else if (v.phase === 'approach') {
      v.approachLeft -= dt;
      if (v.animDone || v.approachLeft <= 0) atCounter(v);
    }
  }
  if (s.departing) {
    s.departing.left -= dt;
    if (s.departing.done || s.departing.left <= 0) { s.departing = null; emit('desk'); }
  }
  // Neste i køen slippes fram først når disken er helt ledig
  const head = s.queue[0];
  if (head && head.phase === 'queue' && counterFree()) { startApproach(head); emit('desk'); }
  // Tålmodighet
  for (const v of [...s.queue]) {
    if (v.phase === 'enter' || v.phase === 'approach' || v.phase === 'leave') continue;
    let rate = 1;
    if (v.phase === 'counter' && G.realTime - v.lastInteract < 14) rate = 0.3;
    if (v.calmUntil > G.realTime) rate *= 0.4;
    if (v.kind === 'arrival' && v.steps.paid) rate *= 0.3;
    v.patience += dt * rate;
    const r = v.patience / v.patienceMax;
    if (r > 0.45 && v.waitStage === 0) { v.waitStage = 1; waitLine(v, 'wait_1'); }
    if (r > 0.78 && v.waitStage === 1) { v.waitStage = 2; v.mood = 'irritated'; waitLine(v, 'wait_2'); }
    const limit = v.kind === 'arrival' && !v.walkIn ? 1.35 : 1;
    if (r >= limit) timeout(v);
  }
  // Gjester som hentet legitimasjon i bilen
  for (const v of [...s.away]) {
    if (G.realTime >= v.returnAt && queueSpace()) {
      s.away = s.away.filter((x) => x !== v);
      v.phase = 'enter'; v.enterLeft = animWait(1.4); v.animDone = false; v.waitStage = 0; v.patience *= 0.5;
      v.idState = 'counter';
      if (counterFree() && !s.queue.length) startApproach(v);
      else v.slot = freeSlot();
      s.queue.splice(Math.min(1, s.queue.length), 0, v);
      G.audio?.play('door');
      emit('desk');
      setTimeout(() => { if (current() === v) speak(v, say(v.charId, 'id_back', {})); }, 2000);
    }
  }
}

function waitLine(v, key) {
  const text = say(v.charId, key, {});
  if (v.phase === 'counter') speak(v, text, v.mood);
  else emit('desk:mutter', { id: v.id, text });
  G.audio?.vocal(ch(v.charId), 'deny');
}

function timeout(v) {
  const s = S();
  const c = ch(v.charId);
  s.nightStats.walkedOut++;
  if (v.kind === 'arrival') {
    const res = resById(v.resId);
    if (res && res.status !== 'checked_in') res.status = 'left';
    if (v.steps.paid) { s.money -= v.price; s.nightStats.income -= v.price; emit('money'); }
    s.nightStats.lost += priceFor(v.wantType, Math.max(1, v.nights));
    s.ratings.push(20);
    log(`${c.name} ventet for lenge og dro.`, 'problem');
    speak(v, say(v.charId, 'leave_wait', {}), 'angry');
    leave(v, 'door', 1.6);
  } else if (v.kind === 'checkout') {
    const g = guestById(v.guestId);
    speak(v, say(v.charId, 'checkout_wait', {}), 'angry');
    if (g) { adjustSat(g, -12, 'waited', 'Måtte vente for lenge for å sjekke ut'); checkOutGuest(g, { keyTo: s.keys[g.room] === 'hand' ? 'hand' : 'tray' }); }
    log(`${c.first} ga opp å vente og la nøkkelen på disken.`, 'problem');
    leave(v, 'door', 1.6);
  } else {
    const g = guestById(v.guestId);
    if (g) { adjustSat(g, -8, 'ignored', 'Ingen hjalp i resepsjonen'); if (v.issueKind === 'issue') g.issue = null; }
    speak(v, say(v.charId, 'r_refuse', {}), 'angry');
    log(`${c.first} gikk fra disken uten hjelp.`, 'problem');
    finishReturn(v);
  }
}
