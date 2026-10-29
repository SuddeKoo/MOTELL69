// Telefonen: romsamtaler fra faktiske gjester, bestillinger, rare oppringinger, rom 203,
// vekking og utgående samtaler til rom. Kan ringe mens noen står ved disken.
import { G, S, emit, log, toast, rnd, touch } from './G.js';
import { ROOM_TYPES, ROOM_BY_NO } from '../data/rooms.js';
import { QUESTIONS } from '../data/dialogue/base.js';
import { profileOf } from '../data/motelProfiles.js';
import { say, nightsText } from '../data/dialogue/index.js';
import { guestById, guestInRoom, guestsIn as guestsInHouse, adjustSat, remember, nowAbs, createReservation, availability, pickChar, ch, room } from './motel.js';
import { issueLine, issueOptions, resolveIssue, openIssue } from './issues.js';
import { spawnReturn, queueSpace } from './desk.js';
import { hhmm, kr } from '../core/util.js';

const RING_SECONDS = 22;
// Etter hver samtale (besvart eller ikke) er telefonen stille en stund, så spilleren rekker
// innsjekking, boka, romkartet og renholderen. Spillminutter (ca. 1,4 s hver ved 17-minutters skift).
const QUIET_AFTER = [16, 30];
const kindKey = (c) => (c.kind === 'guest' ? `guest:${guestById(c.guestId)?.issue?.kind || '?'}` : c.kind);

const WEIRD = [
  {
    open: 'Hallo? E det Pizzabakeren i Bardufoss?',
    options: [
      { label: 'Nei, det e Motell 69.', reply: 'Å. Har dokker pizza? Nei? Ok. Ha det.' },
      { label: 'Ja. Ka ska det vær?', reply: '…Æ trur æ har ringt feil. Eller rett. Æ vet ikkje lenger.' },
    ],
  },
  {
    open: '…*tung pust*…',
    options: [
      { label: 'Hallo? Kem e det?', reply: 'Unnskyld! Æ har nettopp gått opp ei trapp. Feil nummer. Ha det.' },
      { label: 'Æ legg på nu.', reply: '*pust* …ok.' },
    ],
  },
  {
    open: 'Hei. Æ har funnet en romnøkkel med nummer 69 på. E den dokkers?',
    options: [
      { label: 'Vi har ikkje noe rom 69.', reply: 'Rart. Den passe i døra mi hjemme.' },
      { label: 'Ja! Kom med den!', reply: 'Æ e i Kautokeino. Æ sende den med posten. I mars.' },
    ],
  },
  {
    open: 'Kan du si til han i den røde bilen at lysan står på?',
    options: [
      { label: 'Ka for en rød bil?', reply: 'Den som står utenfor. Eller sto. Den e borte nu. Glem det.' },
      { label: 'Æ ska si fra.', reply: 'Takk. Han heter Bjørn. Trur æ. Alle heter Bjørn.' },
    ],
  },
  {
    open: 'Hallo, e det motellet? Æ ville bare høre om dokker fortsatt finnes.',
    options: [
      { label: 'Ja, vi finnes.', reply: 'Så bra. Æ bodde der i 1994. Rom 203. Det e lenge siden. Ha det.' },
      { label: 'Kem e det som spør?', reply: 'Bare en gammel gjest. Ha det.' },
    ],
  },
  {
    open: 'God kveld, her e vegvesenet. E6 e stengt over fjellet. Bare så dokker vet det.',
    options: [
      { label: 'Takk for beskjed.', reply: 'Det kommer nok noen flere innom i natt, da. Lykke til.', effect: 'rush' },
      { label: 'Hvor lenge?', reply: 'Til det slutter å snø. Så rundt april. Nei, bare tull. Et par timer.', effect: 'rush' },
    ],
  },
];

WEIRD.push(
  {
    open: 'Ja hallo, e det tannlegen? Æ har så vondt i ei visdomstann.',
    options: [
      { label: 'Nei, dette e et motell.', reply: 'Et motell? Har dokker paracet i resepsjonen, da? Nei? Ok. Unnskyld.' },
      { label: 'Gap opp og si «aaa».', reply: '…Aaa? Hallo? Du e ikkje tannlegen, e du vel?' },
    ],
  },
  {
    open: 'Hei, det e Gunnar. Kan du hente Tove? Ho står ved bensinpumpa.',
    options: [
      { label: 'Det e ingen bensinpumpe her.', reply: 'Å. Da har æ ringt feil igjen. Det e tredje gangen i natt.' },
      { label: 'Æ ska rope på ho.', reply: 'Takk! …Hallo? Hallo? Ja ja.' },
    ],
  },
  {
    open: 'God kveld. Æ ringe fra Radio Saltfjell. Har dokker nordlys der dokker e nu?',
    options: [
      { label: 'Litt grønt over fjellet.', reply: 'Herlig! Da sier vi det på lufta. Takk og god natt!' },
      { label: 'Bare snø her.', reply: 'Synd. Vi sier at det e nordlys likevel. Ingen sjekke.' },
    ],
  },
  {
    open: '…hallo? Æ trur æ satt på telefonen. *knas* *knas* Nei, det va potetgull.',
    options: [
      { label: 'Hallo? Trenger du hjelp?', reply: 'Nei da. Æ visste ikkje at æ hadde ringt. God natt!' },
      { label: 'Æ legg på nu.', reply: '*knas* …ok.' },
    ],
  },
);

const MYSTERY = [
  '*sus* …har dokker ledig rom… i natt… i 1987?…',
  '*sus* …tjueseks kroner natta… med frokost… *klikk*',
  '*sus* …æ har venta på nøkkelen min… siden… *sus*',
];

// ───────────── Planlegging ─────────────
export function scheduleCall(call, delayMin = 0) {
  S().phone.scheduled.push({ at: nowAbs() + delayMin, call });
}

/** En gjest i huset har fått et problem og vil ringe. */
export function queueGuestCall(guestId, delayMin = 0) {
  const g = guestById(guestId);
  if (!g) return;
  scheduleCall({ kind: 'guest', guestId, charId: g.charId, room: g.room }, delayMin);
}

export function makeBookingCall() {
  const s = S();
  const charId = pickChar();
  if (!charId) return null;
  const p = profileOf(charId);
  const tomorrow = rnd() < 0.25 && s.min > 120;
  const night = tomorrow ? s.night + 1 : s.night;
  const exp = tomorrow ? 20 + Math.floor(rnd() * 300) : Math.min(560, s.min + 45 + Math.floor(rnd() * 150));
  const nights = Math.max(1, p.nights[0] + Math.floor(rnd() * (p.nights[1] - p.nights[0] + 1)));
  const type = rnd() < 0.75 ? p.type : G.rng.pick(['standard', 'komfort']);
  return { kind: 'booking', charId, night, expMin: Math.round(exp / 5) * 5, nights, type, wish: p.wishes[0] || null };
}

// ───────────── Tikk ─────────────
export function phoneTick(dt) {
  const s = S(), ph = s.phone;
  if (ph.ringing) {
    ph.ringing.left -= dt;
    if (ph.ringing.left <= 0) missed(ph.ringing.call);
  }
  if (!ph.ringing && !ph.active && ph.scheduled.length) {
    const now = nowAbs();
    if (now < (ph.quietUntil || 0)) return;
    const due = ph.scheduled.filter((x) => x.at <= now).sort((a, b) => a.at - b.at);
    if (!due.length) return;
    // Ikke samme slags samtale to ganger på rad hvis noe annet venter (tilbakeringinger går først)
    const last = ph.recent?.[ph.recent.length - 1];
    const next = due.find((x) => x.call.callback) || due.find((x) => kindKey(x.call) !== last) || due[0];
    ph.scheduled = ph.scheduled.filter((x) => x !== next);
    if (validCall(next.call)) ring(next.call);
  }
}

function settle() {
  const ph = S().phone;
  ph.quietUntil = nowAbs() + QUIET_AFTER[0] + Math.floor(rnd() * (QUIET_AFTER[1] - QUIET_AFTER[0]));
}

function validCall(c) {
  if (c.kind === 'guest') {
    const g = guestById(c.guestId);
    if (!g || g.status !== 'in' || !g.issue || g.atDesk) return false;
    c.room = g.room; // gjesten kan ha flyttet siden samtalen ble planlagt
  }
  if (c.kind === 'gquestion' || c.kind === 'extend') {
    const g = guestById(c.guestId);
    if (!g || g.status !== 'in' || g.atDesk || g.issue) return false;
    if (c.kind === 'extend' && g.checkoutAbs - nowAbs() < 60) return false;
    c.room = g.room;
  }
  if (c.kind === 'mystery' && room('203').guestId) return false;
  return true;
}

function ring(call) {
  const s = S();
  call.id = s.phone.nextId++;
  s.phone.ringing = { call, left: RING_SECONDS };
  s.nightStats.calls++;
  s.phone.recent = [...(s.phone.recent || []), kindKey(call)].slice(-6);
  touch();
  emit('phone');
}

function missed(call) {
  const s = S();
  s.phone.ringing = null;
  settle();
  s.nightStats.missed++;
  if (call.kind === 'guest') {
    const g = guestById(call.guestId);
    if (g && g.issue) {
      g.ignored++;
      adjustSat(g, -4, 'ignored', 'Ingen tok telefonen');
      s.notes.push(`${hhmm(s.min)}: rom ${g.room} ringte (ubesvart)`);
      if (g.ignored < 2) scheduleCall({ ...call, callback: true }, 10 + Math.floor(rnd() * 15));
      else {
        s.deskPending = [...(s.deskPending || []), { guestId: g.id, kind: 'complain_ignored' }];
        log(`${ch(g.charId).first} på rom ${g.room} gir opp telefonen og kommer ned.`, 'warn');
      }
    }
  } else if (call.kind === 'booking') {
    if (!call.retried && rnd() < 0.45) scheduleCall({ ...call, retried: true }, 12 + Math.floor(rnd() * 20));
    else log('En mulig bestilling gikk tapt (ubesvart telefon).');
  } else if (call.kind === 'out') {
    // utgående samtale ingen svarte på
  }
  emit('notes');
  emit('phone');
}

// ───────────── Spilleren ─────────────
export function answer() {
  const s = S(), ph = s.phone;
  if (!ph.ringing || ph.active) return;
  const call = ph.ringing.call;
  ph.ringing = null;
  call.step = 'talk';
  call.lines = [];
  ph.active = call;
  touch();
  G.audio?.play('handset_up');
  G.audio?.startLine();
  open(call);
  emit('phone');
}

function open(call) {
  const s = S();
  if (call.kind === 'guest') {
    const g = guestById(call.guestId);
    const hello = say(g.charId, 'phone_hello', { room: g.room, first: ch(g.charId).first });
    const body = call.callback ? say(g.charId, 'callback', {}) + ' ' + issueLine(g) : issueLine(g);
    line(call, `${hello} ${body}`);
    G.audio?.vocal(ch(g.charId), 'talk');
  } else if (call.kind === 'booking') {
    const c = ch(call.charId);
    const t = say(call.charId, 'booking_call', { name: c.name, type: ROOM_TYPES[call.type].name, nights: nightsText(call.nights), time: hhmm(call.expMin) });
    line(call, call.night > s.night ? t.replace(/\.( Æ| Det)/, ' – i morra natt.$1') : t);
  } else if (call.kind === 'avail') {
    line(call, say(call.charId, 'avail_ask', { when: call.night > s.night ? 'i morra natt' : 'i natt' }));
  } else if (call.kind === 'gquestion') {
    const g = guestById(call.guestId);
    line(call, `${say(g.charId, 'phone_hello', { room: g.room, first: ch(g.charId).first })} ${say(g.charId, 'question_phone', {})} ${G.rng.pick(QUESTIONS[call.q].ask)}`);
    G.audio?.vocal(ch(g.charId), 'talk');
  } else if (call.kind === 'extend') {
    const g = guestById(call.guestId);
    line(call, `${say(g.charId, 'phone_hello', { room: g.room, first: ch(g.charId).first })} ${say(g.charId, 'extend_phone', {})}`);
  } else if (call.kind === 'weird') {
    line(call, WEIRD[call.idx].open);
  } else if (call.kind === 'mystery') {
    line(call, G.rng.pick(MYSTERY));
    G.audio?.play('static');
    S().flags.mystery203 = (S().flags.mystery203 || 0) + 1;
  } else if (call.kind === 'out') {
    openOutgoing(call);
  }
}

function line(call, text, who = 'them') {
  call.lines.push({ who, text });
  emit('phone');
}

/** Alternativer i en aktiv samtale. */
export function phoneOptions() {
  const call = S().phone.active;
  if (!call) return [];
  if (call.step === 'done') return [{ id: 'hangup', label: 'Legg på' }];
  if (call.kind === 'guest') {
    const g = guestById(call.guestId);
    return g?.issue ? issueOptions(g) : [{ id: 'hangup', label: 'Legg på' }];
  }
  if (call.kind === 'booking') {
    const av = availability(call.night);
    const o = [{ id: 'book', label: `Skriv inn: ${ROOM_TYPES[call.type].name}, ${nightsText(call.nights)}, ca ${hhmm(call.expMin)}`, primary: true }];
    const alt = ['standard', 'komfort', 'suite'].find((t) => t !== call.type && av[t] > 0);
    if (av[call.type] <= 0 && alt) o.push({ id: `alt_${alt}`, label: `Tilby ${ROOM_TYPES[alt].name} i stedet` });
    o.push({ id: 'decline', label: 'Beklager, vi e fulle', tone: 'bad' });
    return o;
  }
  if (call.kind === 'avail') {
    const free = Object.values(availability(call.night)).some((n) => n > 0);
    const o = [];
    if (free) {
      o.push({ id: 'av_book', label: `Æ skriv dæ inn i boka: ${ROOM_TYPES[call.type].name}, ${nightsText(call.nights)}`, primary: true });
      o.push({ id: 'av_yes', label: 'Ja, vi har ledig. Bare kom innom.' });
    }
    o.push({ id: 'av_no', label: 'Beklager, vi e fulle', tone: 'bad' });
    return o;
  }
  if (call.kind === 'gquestion') return QUESTIONS[call.q].answers.map((a, i) => ({ id: `q_${i}`, label: a.label }));
  if (call.kind === 'extend') {
    const g = guestById(call.guestId);
    const p = g ? ROOM_TYPES[ROOM_BY_NO[g.room].type].price : 0;
    return [{ id: 'ext_yes', label: `Ja, en natt til (${kr(p)})`, primary: true }, { id: 'ext_no', label: 'Beklager, rommet e booka', tone: 'bad' }];
  }
  if (call.kind === 'weird') return WEIRD[call.idx].options.map((x, i) => ({ id: `w_${i}`, label: x.label }));
  if (call.kind === 'mystery') return [{ id: 'm_ask', label: 'Hallo? Kem e det?' }, { id: 'hangup', label: 'Legg på' }];
  if (call.kind === 'out') return call.opts || [{ id: 'hangup', label: 'Legg på' }];
  return [{ id: 'hangup', label: 'Legg på' }];
}

export function availabilityText(night = S().night) {
  const a = availability(night);
  return `Ledig ${night > S().night ? 'i morra' : 'i natt'} (ca): S ${Math.max(0, a.standard)} · K ${Math.max(0, a.komfort)} · SU ${Math.max(0, a.suite)}`;
}

export function phoneChoose(id) {
  const s = S(), call = s.phone.active;
  if (!call) return;
  touch();
  G.audio?.play('click', { volume: 0.35 });
  if (id === 'hangup') return hangup();
  const label = phoneOptions().find((o) => o.id === id)?.label;
  if (label) line(call, label, 'me');
  if (call.kind === 'guest') {
    const g = guestById(call.guestId);
    const reply = resolveIssue(g, id);
    line(call, reply);
    call.step = 'done';
  } else if (call.kind === 'booking') {
    const c = ch(call.charId);
    if (id === 'book' || id.startsWith('alt_')) {
      const type = id === 'book' ? call.type : id.slice(4);
      if (id !== 'book' && rnd() < 0.3) { line(call, say(call.charId, 'booking_full', {})); call.step = 'done'; emit('phone'); return; }
      const actMin = call.night === s.night ? Math.min(650, call.expMin + Math.floor(rnd() * 40) - 10) : call.expMin + Math.floor(rnd() * 40) - 10;
      createReservation({ charId: call.charId, name: c.name, night: call.night, expMin: call.expMin, actMin: Math.max(s.night === call.night ? s.min + 10 : 10, actMin), nights: call.nights, type, wish: call.wish, source: 'phone', note: `Ringte ${hhmm(s.min)}` });
      line(call, say(call.charId, id === 'book' ? 'booking_ok' : 'booking_alt_ok', { type: ROOM_TYPES[type].name }));
      G.audio?.play('pen');
      toast(`Reservasjon skrevet i boka: ${c.name}, ${ROOM_TYPES[type].name}.`);
      log(`Telefonbestilling: ${c.name} (${ROOM_TYPES[type].name}, ${call.night > s.night ? 'i morra' : hhmm(call.expMin)}).`);
    } else {
      line(call, say(call.charId, 'booking_full', {}));
    }
    call.step = 'done';
  } else if (call.kind === 'avail') {
    if (id === 'av_book') {
      const c = ch(call.charId);
      const exp = call.night === s.night ? Math.min(600, s.min + 35 + Math.floor(rnd() * 60)) : 20 + Math.floor(rnd() * 200);
      createReservation({ charId: call.charId, name: c.name, night: call.night, expMin: Math.round(exp / 5) * 5, actMin: exp + Math.floor(rnd() * 20) - 5, nights: call.nights, type: call.type, wish: call.wish, source: 'phone', note: `Spurte om ledig ${hhmm(s.min)}` });
      line(call, say(call.charId, 'booking_ok', {}));
      G.audio?.play('pen');
      toast(`Reservasjon skrevet i boka: ${c.name}, ${ROOM_TYPES[call.type].name}.`);
      log(`Telefon: ${c.name} spurte om ledig rom og ble skrevet inn i boka.`);
    } else if (id === 'av_yes') {
      line(call, say(call.charId, 'avail_yes', {}));
      // Kommer innom som drop-in om en stund (samme figur)
      if (call.night === s.night) s.director.promised = [...(s.director.promised || []), { charId: call.charId, at: s.min + 25 + Math.floor(rnd() * 60) }];
    } else line(call, say(call.charId, 'avail_no', {}));
    call.step = 'done';
  } else if (call.kind === 'gquestion') {
    const g = guestById(call.guestId);
    const a = QUESTIONS[call.q].answers[+id.slice(2)];
    if (g && a) { adjustSat(g, a.sat); line(call, G.rng.pick(a.reply)); }
    call.step = 'done';
  } else if (call.kind === 'extend') {
    const g = guestById(call.guestId);
    if (g && id === 'ext_yes') {
      const p = ROOM_TYPES[ROOM_BY_NO[g.room].type].price;
      s.money += p; s.nightStats.income += p; s.totals.income += p;
      g.checkoutAbs += 720; g.nights++;
      adjustSat(g, 5, 'extended', 'Fikk bli en natt til');
      line(call, say(g.charId, 'extend_yes', {}));
      G.audio?.play('pen');
      emit('money');
      log(`${ch(g.charId).first} forlenget oppholdet på rom ${g.room} (telefon).`);
    } else if (g) { adjustSat(g, -1); line(call, say(g.charId, 'extend_no', {})); }
    call.step = 'done';
  } else if (call.kind === 'weird') {
    const opt = WEIRD[call.idx].options[+id.slice(2)];
    line(call, opt.reply);
    if (opt.effect === 'rush') s.director.rush = s.min + 120;
    call.step = 'done';
  } else if (call.kind === 'mystery') {
    line(call, '*klikk* …*summetone*');
    G.audio?.play('static');
    call.step = 'done';
  } else if (call.kind === 'out') {
    outgoingChoose(call, id);
  }
  emit('phone');
}

export function hangup() {
  const s = S();
  if (!s.phone.active) return;
  if (s.phone.active.kind !== 'out') settle();
  s.phone.active = null;
  G.audio?.play('handset_down');
  G.audio?.stopLine();
  emit('phone');
}

// ───────────── Utgående samtaler (spilleren ringer et rom) ─────────────
export function dialRoom(no) {
  const s = S();
  if (s.phone.active || s.phone.ringing) return;
  touch();
  G.audio?.play('dial');
  const g = guestInRoom(no);
  const call = { id: s.phone.nextId++, kind: 'out', room: no, guestId: g?.id || null, charId: g?.charId || null, step: 'talk', lines: [] };
  s.phone.active = call;
  G.audio?.startLine();
  open(call);
  emit('phone');
}

function openOutgoing(call) {
  const s = S();
  const g = guestById(call.guestId);
  if (!g) {
    if (call.room === '203' && (s.flags.mystery203 || 0) > 0 && rnd() < 0.5) line(call, '*sus* …hallo?… *klikk*');
    else line(call, `(Det ringer på rom ${call.room}. Ingen svarer.)`);
    call.step = 'done';
    return;
  }
  const wake = s.wakeups.find((w) => w.guestId === g.id && w.state === 'pending');
  const opts = [];
  if (wake && nowAbs() >= absWake(wake) - 20) opts.push({ id: 'o_wake', label: 'God morgen! Det e vekking.' });
  if (g.loud && !(g.quietUntil > nowAbs())) opts.push({ id: 'o_quiet', label: 'Kan dokker dempe dokker litt?' });
  opts.push({ id: 'o_check', label: 'Bare ville høre om alt e i orden.' });
  opts.push({ id: 'hangup', label: 'Unnskyld, feil rom. (legg på)' });
  call.opts = opts;
  line(call, `(${ch(g.charId).first} tar telefonen på rom ${g.room}.) Hallo?`);
}

const absWake = (w) => (w.night - 1) * 720 + w.at;

function outgoingChoose(call, id) {
  const s = S();
  const g = guestById(call.guestId);
  if (!g) return hangup();
  if (id === 'o_wake') {
    const w = s.wakeups.find((x) => x.guestId === g.id && x.state === 'pending');
    if (w) { w.state = 'done'; adjustSat(g, 6, 'wake_ok', 'Ble vekket som avtalt'); }
    line(call, say(g.charId, 'wake_call', {}));
  } else if (id === 'o_quiet') {
    g.quietUntil = nowAbs() + 240;
    adjustSat(g, -2, 'shushed', 'Ble bedt om å dempe seg');
    line(call, say(g.charId, 'loud_asked', {}));
    // Naboer som klaget på støy fra dette rommet blir fornøyde
    for (const n of Object.values(s.guests)) {
      if (n.status === 'in' && n.issue?.kind === 'noise' && n.issue.other === g.room) {
        adjustSat(n, 5, 'fixed', 'Naboen ble stille');
        n.issue = null;
      }
    }
  } else if (id === 'o_check') {
    const late = s.min > 240 && s.min < 600;
    adjustSat(g, late ? -3 : 1);
    line(call, say(g.charId, 'check_call', { time: hhmm(s.min) }));
  }
  call.step = 'done';
}

/** Vekking: sjekk forsinkelser hvert spillminutt. */
export function wakeTick() {
  const s = S();
  for (const w of s.wakeups) {
    if (w.state !== 'pending' || w.night !== s.night) continue;
    if (s.min > w.at + 30) {
      w.state = 'missed';
      const g = guestById(w.guestId);
      if (g && g.status === 'in') adjustSat(g, -12, 'wake_missed', 'Ble ikke vekket');
      log(`Vekking til rom ${w.room} kl ${hhmm(w.at)} ble glemt.`, 'problem');
    }
  }
}

/** Rom med vekking som er klar nå (lampa på telefonen lyser gult). */
export function dueWakeRooms() {
  const s = S();
  return s.wakeups.filter((w) => w.state === 'pending' && w.night === s.night && s.min >= w.at - 10).map((w) => w.room);
}

export function scheduleWeird() {
  // Gå gjennom alle de rare samtalene før noen gjentas
  const ph = S().phone;
  let left = WEIRD.map((_, i) => i).filter((i) => !(ph.weirdUsed || []).includes(i));
  if (!left.length) { ph.weirdUsed = []; left = WEIRD.map((_, i) => i); }
  const idx = G.rng.pick(left);
  ph.weirdUsed = [...(ph.weirdUsed || []), idx];
  scheduleCall({ kind: 'weird', idx }, 0);
}

/**
 * Spontane samtaler (ikke gjesteproblemer): bestilling, spørsmål om ledig rom, gjest med et praktisk
 * spørsmål, forlengelse, feilringing/rare. Typer som nettopp har ringt, vektes kraftig ned.
 */
export function scheduleSpontaneous() {
  const s = S(), ph = s.phone, m = s.min, now = nowAbs();
  const recent = ph.recent || [];
  const quiet = (g) => !g.atDesk && !g.issue && !g.pendingMove;
  const asking = guestsInHouse().filter(quiet);
  const extenders = asking.filter((g) => !g.extendAsked && g.checkoutAbs - now > 120 && g.checkoutAbs - now < 700);
  const options = [
    ['booking', m < 640 ? 32 : 0],
    ['avail', m < 560 ? 12 : 0],
    ['gquestion', asking.length ? 13 : 0],
    ['extend', extenders.length ? 7 : 0],
    ['weird', m < 680 ? 10 : 0],
  ].map(([k, w]) => [k, w * (recent.slice(-2).includes(k) ? 0.2 : recent.includes(k) ? 0.55 : 1)]);
  const pick = G.rng.weighted(options, (x) => x[1]);
  if (!pick || !pick[1]) return;
  const kind = pick[0];
  if (kind === 'booking') return scheduleBooking();
  if (kind === 'weird') return scheduleWeird();
  if (kind === 'avail') {
    const c = makeBookingCall();
    if (c) scheduleCall({ ...c, kind: 'avail' }, 0);
    return;
  }
  if (kind === 'gquestion') {
    const g = G.rng.pick(asking);
    const used = ph.qUsed || [];
    let qs = QUESTIONS.map((_, i) => i).filter((i) => !used.includes(i));
    if (!qs.length) qs = QUESTIONS.map((_, i) => i);
    const q = G.rng.pick(qs);
    ph.qUsed = [...used, q].slice(-Math.max(1, QUESTIONS.length - 1));
    scheduleCall({ kind: 'gquestion', guestId: g.id, charId: g.charId, room: g.room, q }, 0);
    return;
  }
  if (kind === 'extend') {
    const g = G.rng.pick(extenders);
    g.extendAsked = true;
    scheduleCall({ kind: 'extend', guestId: g.id, charId: g.charId, room: g.room }, 0);
  }
}
export function scheduleMystery() {
  scheduleCall({ kind: 'mystery', room: '203' }, 0);
}
export function scheduleBooking() {
  const c = makeBookingCall();
  if (c) scheduleCall(c, 0);
}

export function sendDeskPending() {
  const s = S();
  if (!s.deskPending?.length || !queueSpace()) return;
  const item = s.deskPending.shift();
  const g = guestById(item.guestId);
  if (!g || g.status !== 'in' || g.atDesk) return;
  if ((item.kind === 'issue' || item.kind === 'complain_ignored') && !g.issue) return;
  spawnReturn(g, item.kind);
}

export { openIssue };
