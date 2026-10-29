// Gjesteproblemer: oppstår ut fra faktisk rom, naboer og personlighet, og løses med
// dialog + romadministrasjon + renholderen. Brukes likt fra telefon og fra disken.
import { G, S, emit, log, toast, rnd } from './G.js';
import { profileOf } from '../data/motelProfiles.js';
import { BROKEN_ITEMS, REQ_ITEMS } from '../data/dialogue/base.js';
import { say } from '../data/dialogue/index.js';
import { guestsIn, guestInRoom, guestById, adjustSat, remember, nowAbs, loudNeighbour, room, ch } from './motel.js';
import { hhmm } from '../core/util.js';

/** Én gang per spillminutt: kanskje oppstår et problem hos en gjest. */
// Vekking er sjelden: høyst én forespørsel per natt utenom den første natta (Hassan)
const WAKE_PER_NIGHT = 1;
export const wakeAllowed = () => (S().director.wakes || 0) < WAKE_PER_NIGHT;

export function issueTick() {
  const s = S();
  // Står det allerede to gjester og venter på å ringe, får ingen nye problemer akkurat nå
  const backlog = s.phone.scheduled.filter((x) => x.call.kind === 'guest').length;
  if (backlog >= 2) return;
  const quietHours = s.min > 360 && s.min < 540 ? 0.35 : 1;
  const nightScale = 0.85 + Math.min(0.5, s.night * 0.08);
  for (const g of guestsIn()) {
    if (g.issue || g.atDesk || g.pendingMove || g.issues >= 3) continue;
    const p = profileOf(g.charId);
    const sens = p.sensitive || g.wish === 'quiet';
    const f = quietHours * nightScale * p.complain;
    let issue = null;
    const loud = loudNeighbour(g);
    if (sens && loud && (g.noiseCount || 0) < 2 && rnd() < 1 / 30) { issue = { kind: 'noise', other: loud.room, otherGuest: loud.id }; g.noiseCount = (g.noiseCount || 0) + 1; }
    else if (room(g.room).cold && g.coldRoom !== g.room && rnd() < (sens ? 1 / 55 : 1 / 90) * quietHours) { issue = { kind: 'cold' }; g.coldRoom = g.room; }
    else if (g.wishMissed && !g.askedMove && rnd() < 1 / 260 * f) { issue = { kind: 'move' }; g.askedMove = true; }
    else if (rnd() < 1 / 1300 * f) issue = { kind: 'broken', item: G.rng.pick(BROKEN_ITEMS) };
    else if (rnd() < 1 / 1100 * f) issue = { kind: 'item', item: G.rng.pick(REQ_ITEMS) };
    else if (p.demands && rnd() < 1 / 700 * f) issue = { kind: 'demand' };
    else if (!g.wakeAsked && wakeAllowed() && g.checkoutAbs - nowAbs() < 600 && s.min < 330 && rnd() < 1 / 2200) {
      g.wakeAsked = true;
      s.director.wakes = (s.director.wakes || 0) + 1;
      issue = { kind: 'wake', at: Math.min(700, 560 + 10 * Math.floor(rnd() * 12)) };
    }
    if (!issue) continue;
    openIssue(g, issue, rnd() < (issue.kind === 'demand' ? 0.4 : 0.22) ? 'desk' : 'phone');
  }
}

export function openIssue(g, issue, via = 'phone') {
  issue.since = nowAbs();
  issue.via = via;
  g.issue = issue;
  g.issues++;
  if (issue.kind === 'noise') remember(g, 'noise', `Bråk fra ${issue.other}`);
  if (issue.kind === 'cold') remember(g, 'cold', 'Kaldt på rommet');
  if (via === 'desk') S().deskPending = [...(S().deskPending || []), { guestId: g.id, kind: 'issue' }];
  else emit('phone:queueGuest', g.id);
  emit('guest', g.id);
}

/** Linja gjesten sier om problemet sitt. */
export function issueLine(g) {
  const i = g.issue;
  if (!i) return '';
  const t = { other: i.other, item: i.item, time: i.at ? hhmm(i.at) : '', room: g.room, first: ch(g.charId).first };
  if (i.lineKey) return say(g.charId, i.lineKey, t);
  switch (i.kind) {
    case 'noise': return say(g.charId, 'c_noise', t);
    case 'cold': return say(g.charId, 'c_cold', t);
    case 'broken': return say(g.charId, 'c_broken', t);
    case 'item': return say(g.charId, 'req_item', t);
    case 'move': return say(g.charId, 'req_move', t);
    case 'demand': return say(g.charId, 'demand', t);
    case 'wake': return say(g.charId, 'wake_ask', t);
    default: return '';
  }
}

/** Svaralternativer for et problem. */
export function issueOptions(g) {
  const i = g.issue;
  if (!i) return [];
  const o = [];
  const add = (id, label, extra = {}) => o.push({ id, label, ...extra });
  switch (i.kind) {
    case 'noise':
      add('quiet_neighbour', `Æ ringe rom ${i.other} og ber dem dempe sæ`);
      add('move', 'Æ kan flytte dæ til et anna rom');
      add('apology', 'Beklager, æ ska se ka æ kan gjøre');
      add('refuse', 'Det e et motell. Det bråke litt.', { tone: 'bad' });
      break;
    case 'cold':
      add('help', 'Æ sender renholderen med ekstra dyne');
      add('selffix', 'Ovnsknotten står under vinduet. Skru den til fem.');
      add('move', 'Æ kan flytte dæ til et varmere rom');
      add('refuse', 'Det e vinter. Ta på ullsokker.', { tone: 'bad' });
      break;
    case 'broken':
      add('help', 'Æ sender renholderen opp for å se på det');
      add('move', 'Æ kan flytte dæ til et anna rom');
      add('apology', 'Beklager, det blir fiksa i morra');
      break;
    case 'item':
      add('help', `Renholderen kommer med ${i.item}`);
      add('refuse', 'Beklager, vi har ikkje det', { tone: 'bad' });
      break;
    case 'move':
      add('move', 'Ja, æ finn et nytt rom til dæ');
      add('refuse', 'Beklager, det går ikkje i natt', { tone: 'bad' });
      break;
    case 'demand':
      add('discount', 'Æ trekke hundre kroner fra (−100 kr)');
      add('deny', 'Det kan vi dessverre ikkje', { tone: 'bad' });
      break;
    case 'wake':
      add('note_wake', `Æ skriv det ned: vekking ${hhmm(i.at)}`);
      add('refuse', 'Vi har ikkje vekking her', { tone: 'bad' });
      break;
  }
  return o;
}

/** Utfør et valg. Returnerer replikken gjesten svarer med. */
export function resolveIssue(g, action) {
  const i = g.issue;
  if (!i) return '';
  const t = { other: i.other, room: g.room, item: i.item };
  const s = S();
  let line = '';
  const close = () => { g.issue = null; emit('guest', g.id); };
  switch (action) {
    case 'apology':
      adjustSat(g, i.kind === 'noise' ? 0 : 1, 'apology', 'Fikk en unnskyldning');
      line = say(g.charId, 'r_apology', t);
      close();
      break;
    case 'refuse':
    case 'deny':
      adjustSat(g, g.charId === 'eskil' || g.charId === 'tom' ? -8 : -6, 'refused', 'Ble avvist i resepsjonen');
      line = say(g.charId, 'r_refuse', t);
      log(`${ch(g.charId).first} (rom ${g.room}) fikk nei.`);
      close();
      break;
    case 'discount':
      s.money -= 100; s.nightStats.income -= 100;
      adjustSat(g, 8, 'discount', 'Fikk rabatt');
      line = say(g.charId, 'r_discount', t);
      emit('money');
      close();
      break;
    case 'help': {
      const item = i.kind === 'cold' ? 'ekstra dyne' : i.kind === 'broken' ? `fikse ${i.item}` : i.item;
      g.errand = { item, kind: i.kind };
      g.promise = { kind: 'errand', deadline: nowAbs() + 50 };
      adjustSat(g, 1);
      line = say(g.charId, 'r_help', t);
      log(`Rom ${g.room}: ${item} lovet.`);
      toast(`Rom ${g.room} venter på renholderen: ${item}. Send henne fra romkartet.`);
      close();
      break;
    }
    case 'move':
      g.wantsMove = true;
      g.promise = { kind: 'move', deadline: nowAbs() + 70 };
      line = say(g.charId, 'r_move_yes', t);
      toast(`Lovet rombytte til ${ch(g.charId).first} (rom ${g.room}). Velg nytt rom på romkartet.`);
      close();
      break;
    case 'selffix':
      if (rnd() < 0.55) { adjustSat(g, 3, 'fixed', 'Fikk varmen på'); line = say(g.charId, 'r_selffix_ok', t); s.rooms[g.room].cold = g.room === '203'; close(); }
      else { adjustSat(g, -3); line = say(g.charId, 'r_selffix_fail', t); g.issue = { ...i, tried: true }; }
      break;
    case 'quiet_neighbour': {
      const n = guestById(i.otherGuest) || guestInRoom(i.other);
      if (n && n.status === 'in') {
        n.quietUntil = nowAbs() + 240;
        adjustSat(n, -2, 'shushed', 'Ble bedt om å dempe seg');
        line = `(Rom ${n.room}) ${say(n.charId, 'loud_asked', {})}`;
      } else line = '(Ingen svarer på naborommet.)';
      adjustSat(g, 6, 'fixed', 'Naboen ble bedt om å dempe seg');
      close();
      break;
    }
    case 'note_wake':
      s.wakeups.push({ room: g.room, guestId: g.id, at: i.at, night: s.night, state: 'pending' });
      s.notes.push(`VEKK ${g.room} kl ${hhmm(i.at)}`);
      adjustSat(g, 2);
      line = say(g.charId, 'wake_ok', t);
      emit('notes');
      close();
      break;
    default:
      close();
  }
  return line;
}

/** Løfter som ikke holdes: én straff, og gjesten purrer én gang per opphold. */
export function promiseTick() {
  const now = nowAbs();
  for (const g of guestsIn()) {
    if (g.promise && now > g.promise.deadline) {
      g.broken = (g.broken || 0) + 1;
      adjustSat(g, g.broken === 1 ? -10 : -4, 'promise_broken', g.promise.kind === 'move' ? 'Lovet rombytte kom aldri' : 'Lovet hjelp kom aldri');
      log(`Rom ${g.room}: ${ch(g.charId).first} venter fortsatt på det du lovet.`, 'problem');
      g.promise = null;
      if (g.broken === 1 && g.issues < 4) openIssue(g, { kind: g.wantsMove ? 'move' : 'item', item: g.errand?.item || 'hjelp', callback: true }, 'phone');
      else { g.wantsMove = false; g.errand = null; }
    }
  }
}
