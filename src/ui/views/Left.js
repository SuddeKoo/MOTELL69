// VENSTRE: telefonen med romlamper, telefonblokka og det fysiske nøkkelbrettet.
import { G, S, toast } from '../../game/G.js';
import { LEFT as L, BG } from '../layout.js';
import { phoneSvg, keySvg, hookSvg } from '../props.js';
import { counterUrl, COUNTER_LEFT } from '../art/counter.js';
import { pickKey, hangKey, guestById, ch } from '../../game/motel.js';
import { answer, phoneOptions, phoneChoose, hangup, dialRoom, dueWakeRooms, availabilityText } from '../../game/phone.js';
import { ROOMS } from '../../data/rooms.js';
import { esc, hhmm } from '../../core/util.js';

let root, board, phoneEl, callEl, padEl;

export function mountLeft(view) {
  root = view;
  const rows = [ROOMS.filter((r) => r.floor === 1), ROOMS.filter((r) => r.floor === 2)];
  const hooks = rows.map((row, ri) => row.map((r, i) => {
    const x = 96 + i * 92, y = 14 + ri * 154;
    return `<div class="hook" data-room="${r.no}" style="left:${x}px;top:${y}px">
      <div class="hook-metal">${hookSvg()}</div>
      <div class="hook-plate">${r.no}</div>
      <div class="hook-key"></div>
    </div>`;
  }).join('')).join('');
  view.innerHTML = `
    <img class="bg" src="${BG.left}" alt="" draggable="false">
    <div class="lamp-glow" style="left:500px;top:0;width:780px;height:300px"></div>
    <div class="keyboard" style="left:${L.board.x}px;top:${L.board.y}px;width:${L.board.w}px;height:${L.board.h}px">
      <div class="kb-label" style="top:40px">1.<br>ETG</div>
      <div class="kb-label" style="top:194px">2.<br>ETG</div>
      ${hooks}
    </div>
    <img class="counter" src="${counterUrl(COUNTER_LEFT)}" alt="" draggable="false">
    <div class="phone" style="left:${L.phone.x}px;top:${L.phone.y}px;width:${L.phone.w}px;height:${L.phone.h}px">${phoneSvg()}</div>
    <div class="notepad" style="left:${L.notepad.x}px;top:${L.notepad.y}px;width:${L.notepad.w}px;height:${L.notepad.h}px"></div>
    <div class="call hidden" style="left:${L.call.x}px;top:${L.call.y}px;width:${L.call.w}px;height:${L.call.h}px"></div>
  `;
  board = view.querySelector('.keyboard');
  phoneEl = view.querySelector('.phone');
  callEl = view.querySelector('.call');
  padEl = view.querySelector('.notepad');

  board.addEventListener('pointerdown', (e) => {
    const h = e.target.closest('.hook');
    if (!h) return;
    const no = h.dataset.room;
    const s = S();
    if (s.hand === no) { hangKey(no); return; }
    if (s.keys[no] === 'board') { pickKey(no); return; }
    if (s.hand) { toast(`Nøkkel ${s.hand} henger på krok ${s.hand}.`); return; }
    const where = { guest: 'Gjesten har nøkkelen.', tray: 'Nøkkelen ligger i nøkkelskåla på disken.', counter: 'Nøkkelen ligger på disken.' }[s.keys[no]];
    if (where) toast(`${no}: ${where}`);
  });
  phoneEl.addEventListener('click', (e) => {
    const s = S();
    if (s.phone.ringing) { answer(); return; }
    const btn = e.target.closest('.lamp-btn');
    if (btn && !s.phone.active) { dialRoom(btn.dataset.room); return; }
    if (e.target.closest('.handset') && s.phone.active) hangup();
  });
  callEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-opt]');
    if (b) phoneChoose(b.dataset.opt);
  });

  G.bus.on('keys', renderKeys);
  G.bus.on('hand', renderKeys);
  G.bus.on('phone', renderPhone);
  G.bus.on('notes', renderPad);
  G.bus.on('clock', () => { renderLamps(); renderPad(); });
  G.bus.on('ambient', (ev) => {
    if (ev.kind === 'flicker' && G.settings.flicker) { const l = root.querySelector('.lamp-glow'); l.classList.remove('flick'); void l.offsetWidth; l.classList.add('flick'); }
  });
  G.bus.on('ui:reset', () => { renderKeys(); renderPhone(); renderPad(); });
}

export function renderKeys() {
  const s = S();
  for (const h of board.querySelectorAll('.hook')) {
    const no = h.dataset.room;
    const on = s.keys[no] === 'board';
    const slot = h.querySelector('.hook-key');
    if (on && !slot.firstChild) slot.innerHTML = keySvg(no);
    if (!on) slot.innerHTML = '';
    h.classList.toggle('empty', !on);
    h.classList.toggle('target', s.hand === no);
  }
}

function renderLamps() {
  const s = S();
  const ringing = s.phone.ringing?.call;
  const due = new Set(dueWakeRooms());
  for (const b of phoneEl.querySelectorAll('.lamp-btn')) {
    const no = b.dataset.room;
    const lamp = b.querySelector('.lamp');
    const calling = ringing && ((ringing.kind === 'guest' && ringing.room === no) || (ringing.kind === 'mystery' && no === '203'));
    const active = s.phone.active && s.phone.active.room === no;
    lamp.setAttribute('class', `lamp ${calling ? 'ring' : active ? 'on' : due.has(no) ? 'wake' : guestRoom(no) ? 'occ' : ''}`);
  }
  const ext = ringing && ['booking', 'weird'].includes(ringing.kind);
  phoneEl.querySelector('.line-lamp').setAttribute('class', `lamp line-lamp ${ext ? 'ring' : s.phone.active && !s.phone.active.room ? 'on' : ''}`);
}

const guestRoom = (no) => S().rooms[no].status === 'occupied';

export function renderPhone() {
  const s = S(), ph = s.phone;
  phoneEl.classList.toggle('ringing', !!ph.ringing);
  phoneEl.classList.toggle('offhook', !!ph.active);
  renderLamps();
  if (ph.ringing) G.audio?.startRing(); else G.audio?.stopRing();
  const call = ph.active;
  callEl.classList.toggle('hidden', !call);
  if (!call) return;
  let who = 'EKSTERN LINJE';
  if (call.room) {
    const g = guestById(call.guestId);
    who = `ROM ${call.room}${g ? ` · ${esc(g.name)}` : ''}`;
  } else if (call.kind === 'booking') who = 'EKSTERN LINJE · bestilling';
  const opts = phoneOptions();
  callEl.innerHTML = `<div class="call-head">☎ ${who}</div>
    <div class="call-lines">${call.lines.map((l) => `<p class="${l.who}">${l.who === 'me' ? '– ' : ''}${esc(l.text)}</p>`).join('')}</div>
    ${call.kind === 'booking' && call.step !== 'done' ? `<div class="call-info">${availabilityText(call.night)}</div>` : ''}
    <div class="call-opts">${opts.map((o) => `<button data-opt="${o.id}" class="opt ${o.primary ? 'primary' : ''} ${o.tone === 'bad' ? 'bad' : ''}">${esc(o.label)}</button>`).join('')}</div>`;
  const ls = callEl.querySelector('.call-lines');
  ls.scrollTop = ls.scrollHeight;
}

export function renderPad() {
  const s = S();
  const wakes = s.wakeups.filter((w) => w.night === s.night || w.state === 'pending');
  const lines = [
    ...wakes.map((w) => `<li class="${w.state}">${w.state === 'done' ? '✔' : w.state === 'missed' ? '✘' : '⏰'} VEKK ${w.room} kl ${hhmm(w.at)}${w.night > s.night ? ' (i morra)' : ''}</li>`),
    ...s.notes.filter((n) => !n.startsWith('VEKK')).slice(-5).map((n) => `<li>${esc(n)}</li>`),
  ];
  padEl.innerHTML = `<div class="pad-head">BESKJEDER</div><ul>${lines.join('') || '<li class="muted">Ingen beskjeder.</li>'}</ul>`;
}
