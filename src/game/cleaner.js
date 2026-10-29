// Én renholder. Spilleren sender henne manuelt til ett rom av gangen: vask (20–40 s) eller ærend (10–20 s).
import { G, S, emit, log, toast, rnd, touch } from './G.js';
import { guestInRoom, adjustSat, ch } from './motel.js';

export const CLEANER_NAME = 'Bodil';

function note(text) {
  const c = S().cleaner;
  c.log.unshift(text);
  if (c.log.length > 6) c.log.length = 6;
  emit('cleaner');
}

export const cleanerBusy = () => !!S().cleaner.job;

export function sendClean(no) {
  const s = S();
  if (s.cleaner.job) { toast('RENHOLDER OPPTATT'); note('RENHOLDER OPPTATT'); return false; }
  if (s.rooms[no].status !== 'dirty') return false;
  const total = 20 + rnd() * 20;
  s.cleaner.job = { room: no, kind: 'clean', left: total, total };
  s.rooms[no].status = 'cleaning';
  note(`ROM ${no} VASKES`);
  G.audio?.play('cart');
  touch();
  emit('rooms', no);
  return true;
}

export function sendErrand(no) {
  const s = S();
  if (s.cleaner.job) { toast('RENHOLDER OPPTATT'); note('RENHOLDER OPPTATT'); return false; }
  const g = guestInRoom(no);
  if (!g?.errand) return false;
  const total = 10 + rnd() * 10;
  s.cleaner.job = { room: no, kind: 'errand', item: g.errand.item, guestId: g.id, left: total, total };
  note(`ROM ${no}: ${g.errand.item.toUpperCase()}`);
  G.audio?.play('cart');
  touch();
  emit('rooms', no);
  return true;
}

export function cleanerTick(dt) {
  const s = S(), j = s.cleaner.job;
  if (!j) return;
  j.left -= dt;
  emit('cleaner:progress');
  if (j.left > 0) return;
  s.cleaner.job = null;
  if (j.kind === 'clean') {
    if (s.rooms[j.room].status === 'cleaning') s.rooms[j.room].status = 'free';
    note(`ROM ${j.room} FERDIG`);
    toast(`${CLEANER_NAME}: Rom ${j.room} e ferdig vaska.`);
  } else {
    const g = s.guests[j.guestId];
    if (g && g.status === 'in' && g.errand) {
      adjustSat(g, 7, 'errand', `Fikk hjelp: ${j.item}`);
      if (g.errand.kind === 'cold') s.rooms[g.room].cold = g.room === '203';
      g.errand = null;
      g.promise = null;
      note(`ROM ${j.room}: LEVERT`);
      toast(`${CLEANER_NAME}: Ordna på rom ${j.room}. ${ch(g.charId).first} sa takk.`);
    } else note(`ROM ${j.room}: INGEN DER`);
  }
  G.audio?.play('cart', { volume: 0.4 });
  touch();
  emit('rooms', j.room);
  emit('cleaner');
}
