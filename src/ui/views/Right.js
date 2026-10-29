// HØYRE: romkartet på korktavla, renholderens tavle, og pulten (samme SVG-disk) med romkortet for valgt rom.
import { G, S, toast } from '../../game/G.js';
import { RIGHT as L, BG } from '../layout.js';
import { ROOMS, ROOM_BY_NO, ROOM_TYPES, WISHES, wishFit } from '../../data/rooms.js';
import { guestInRoom, heldFor, assignable, planMove, cancelMove, guestById, ch } from '../../game/motel.js';
import { current, assignRoom } from '../../game/desk.js';
import { sendClean, sendErrand, CLEANER_NAME } from '../../game/cleaner.js';
import { esc, hhmm, surname } from '../../core/util.js';
import { counterUrl, COUNTER_RIGHT } from '../art/counter.js';

const STATUS = { free: 'LEDIG', occupied: 'OPPTATT', dirty: 'SKITTENT', cleaning: 'VASKES' };
let root, mapEl, cardEl, wbEl, selected = null, moveFrom = null;

export function mountRight(view) {
  root = view;
  const tile = (r, i) => `<button class="room-tile" data-room="${r.no}" style="left:${18 + i * 124}px">
      <span class="pin"></span><span class="rt-no">${r.no}</span><span class="rt-type">${ROOM_TYPES[r.type].short}</span>
      <span class="rt-status"></span><span class="rt-guest"></span><span class="rt-flags"></span></button>`;
  view.innerHTML = `
    <img class="bg" src="${BG.right}" alt="" draggable="false">
    <div class="lamp-glow" style="left:420px;top:0;width:900px;height:300px"></div>
    <div class="roommap" style="left:${L.cork.x}px;top:${L.cork.y}px;width:${L.cork.w}px;height:${L.cork.h}px">
      <div class="map-title">ROMOVERSIKT · MOTELL 69</div>
      <div class="floor floor2"><span class="floor-label">2. ETG · utsikt mot fjellet</span>${ROOMS.filter((r) => r.floor === 2).map(tile).join('')}</div>
      <div class="floor floor1"><span class="floor-label">1. ETG · resepsjonen ←</span>${ROOMS.filter((r) => r.floor === 1).map(tile).join('')}</div>
    </div>
    <div class="map-legend" style="left:${L.cork.x}px;top:${L.cork.y + L.cork.h + 12}px;width:${L.cork.w}px">
      <span class="lg free">LEDIG</span><span class="lg occupied">OPPTATT</span><span class="lg dirty">SKITTENT</span><span class="lg cleaning">VASKES</span><span class="lg held">📌 RESERVERT</span>
    </div>
    <div class="whiteboard" style="left:${L.whiteboard.x}px;top:${L.whiteboard.y}px;width:${L.whiteboard.w}px;height:${L.whiteboard.h}px"></div>
    <img class="counter" src="${counterUrl(COUNTER_RIGHT)}" alt="" draggable="false">
    <div class="roomcard" style="left:${L.card.x}px;top:${L.card.y}px;width:${L.card.w}px;max-height:${L.card.h}px"></div>
  `;
  mapEl = view.querySelector('.roommap');
  cardEl = view.querySelector('.roomcard');
  wbEl = view.querySelector('.whiteboard');
  mapEl.addEventListener('click', (e) => {
    const t = e.target.closest('.room-tile');
    if (!t) return;
    selected = t.dataset.room;
    G.audio?.play('paper', { volume: 0.4 });
    renderMap(); renderCard();
  });
  cardEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (b) act(b.dataset.act);
  });
  G.bus.on('rooms', () => { renderMap(); renderCard(); });
  G.bus.on('guest', () => { renderMap(); renderCard(); });
  G.bus.on('desk', renderCard);
  G.bus.on('book', renderMap);
  G.bus.on('keys', renderCard);
  G.bus.on('cleaner', renderBoard);
  G.bus.on('cleaner:progress', renderBoardProgress);
  G.bus.on('ui:reset', () => { selected = null; moveFrom = null; renderMap(); renderCard(); renderBoard(); });
}

function act(a) {
  const no = selected;
  const g = guestInRoom(no);
  if (a === 'assign') {
    const held = heldFor(no);
    const v = current();
    if (held && v && held.id !== v.resId && !cardEl.dataset.confirm) {
      cardEl.dataset.confirm = '1';
      renderCard(`Rom ${no} er holdt av for ${held.name} (ca ${hhmm(held.expMin)}). Trykk igjen for å tildele likevel.`);
      return;
    }
    delete cardEl.dataset.confirm;
    if (assignRoom(no)) toast(`Rom ${no} tildelt. Ta betalt og hent nøkkel ${no}.`);
  } else if (a === 'clean') sendClean(no);
  else if (a === 'errand') sendErrand(no);
  else if (a === 'move') { moveFrom = g?.id || null; toast(`Velg et ledig, rent rom til ${g ? ch(g.charId).first : 'gjesten'}.`); }
  else if (a === 'moveHere') {
    if (planMove(moveFrom, no)) {
      const mg = guestById(moveFrom);
      toast(`${ch(mg.charId).first} kommer ned for å bytte til rom ${no}.`);
      G.audio?.play('pen');
      moveFrom = null;
    }
  } else if (a === 'cancelMove') { if (g) cancelMove(g.id); moveFrom = null; }
  else if (a === 'abortMove') moveFrom = null;
  renderMap(); renderCard();
}

export function renderMap() {
  if (!mapEl) return;
  const s = S();
  const v = current();
  for (const t of mapEl.querySelectorAll('.room-tile')) {
    const no = t.dataset.room;
    const r = s.rooms[no];
    const g = guestInRoom(no);
    const held = heldFor(no);
    t.className = `room-tile st-${r.status}${selected === no ? ' sel' : ''}${held || r.moveFor ? ' held' : ''}`;
    t.querySelector('.rt-status').textContent = r.moveFor ? 'FLYTTING' : STATUS[r.status];
    t.querySelector('.rt-guest').textContent = g ? surname(g.name) : held ? `${surname(held.name)} ${hhmm(held.expMin)}` : '';
    const flags = [];
    if (g?.issue || g?.errand || g?.wantsMove) flags.push('<b class="fl-warn">!</b>');
    if (g && g.sat < 40) flags.push('<b class="fl-sad">☹</b>');
    if (r.cold) flags.push('<b class="fl-cold">❄</b>');
    t.querySelector('.rt-flags').innerHTML = flags.join('');
    const fits = v?.kind === 'arrival' && v.steps.res && !v.steps.paid && assignable(no);
    t.classList.toggle('candidate', !!fits);
    t.classList.toggle('move-target', !!moveFrom && assignable(no));
  }
}

function satFace(sat) { return sat >= 70 ? '😊' : sat >= 45 ? '😐' : '😠'; }

export function renderCard(warn) {
  if (!cardEl) return;
  const s = S();
  if (!selected) {
    cardEl.innerHTML = `<div class="card-head">ROMKORT</div><p class="muted">Klikk på et rom på tavla.</p>${moveFrom ? '<p>Velg rommet gjesten skal flytte til.</p>' : ''}`;
    return;
  }
  const no = selected, R = ROOM_BY_NO[no], r = s.rooms[no];
  const g = guestInRoom(no);
  const held = heldFor(no);
  const v = current();
  const j = s.cleaner.job;
  let body = `<div class="card-head">ROM ${no} <span class="type">${ROOM_TYPES[R.type].name} · ${ROOM_TYPES[R.type].price} kr</span></div>
    <div class="card-status st-${r.status}">${r.moveFor ? 'HOLDT AV TIL FLYTTING' : STATUS[r.status]}</div>
    <p class="note">${esc(R.note)}${r.cold && no !== '203' ? ' Trekkfullt i natt.' : ''}</p>`;
  if (g) {
    const left = Math.max(0, Math.ceil((g.checkoutAbs - ((s.night - 1) * 720 + s.min)) / 720));
    body += `<p><b>${esc(g.name)}</b> ${satFace(g.sat)} ${Math.round(g.sat)} %<br>Utsjekk: ${left <= 0 ? 'i løpet av natta' : left === 1 ? 'i morra tidlig' : `om ${left} netter`}${g.wish ? ` · Ønske: ${WISHES[g.wish].label.toLowerCase()}` : ''}</p>`;
    const status = [];
    if (g.errand) status.push(`Venter på: ${esc(g.errand.item)}`);
    if (g.wantsMove && !g.pendingMove) status.push('Vil bytte rom');
    if (g.pendingMove) status.push(`Flytter til ${g.pendingMove} – kommer ned for nøkkel`);
    if (g.issue) status.push('Har et problem (ringer / kommer ned)');
    if (status.length) body += `<p class="warn">${status.join('<br>')}</p>`;
  } else if (held) body += `<p>📌 Reservert: <b>${esc(held.name)}</b>, ca ${hhmm(held.expMin)}</p>`;
  if (r.status === 'cleaning' && j?.room === no) body += `<div class="progress"><span style="width:${Math.round((1 - j.left / j.total) * 100)}%"></span></div>`;
  if (warn) body += `<p class="warn">${esc(warn)}</p>`;
  const btns = [];
  if (v?.kind === 'arrival' && v.steps.res && !v.steps.paid && assignable(no)) {
    const fit = v.wish ? wishFit(v.wish, no) : 'neutral';
    const typeNote = R.type !== v.wantType ? ` (bestilt ${ROOM_TYPES[v.wantType].name})` : '';
    btns.push(`<button data-act="assign" class="opt primary">TILDEL TIL ${esc(ch(v.charId).first.toUpperCase())}${typeNote}${fit === 'met' ? ' ✓ ønske' : ''}</button>`);
  }
  if (r.status === 'dirty') btns.push(`<button data-act="clean" class="opt primary" ${j ? 'disabled' : ''}>SEND RENHOLDER${j ? ' (OPPTATT)' : ''}</button>`);
  if (g?.errand) btns.push(`<button data-act="errand" class="opt" ${j ? 'disabled' : ''}>SEND ${CLEANER_NAME.toUpperCase()}: ${esc(g.errand.item)}</button>`);
  if (g && !g.pendingMove && !moveFrom) btns.push(`<button data-act="move" class="opt">FLYTT GJEST…</button>`);
  if (g?.pendingMove) btns.push(`<button data-act="cancelMove" class="opt bad">AVBRYT FLYTTING</button>`);
  if (moveFrom && assignable(no)) btns.push(`<button data-act="moveHere" class="opt primary">FLYTT ${esc(ch(guestById(moveFrom).charId).first.toUpperCase())} HIT</button>`);
  if (moveFrom) btns.push(`<button data-act="abortMove" class="opt">Avbryt</button>`);
  cardEl.innerHTML = body + `<div class="card-btns">${btns.join('')}</div>`;
}

export function renderBoard() {
  if (!wbEl) return;
  const c = S().cleaner;
  const j = c.job;
  wbEl.innerHTML = `<div class="wb-head">RENHOLD – ${CLEANER_NAME.toUpperCase()}</div>
    <div class="wb-now">${j ? (j.kind === 'clean' ? `ROM ${j.room} VASKES` : `ROM ${j.room}: ${esc(j.item).toUpperCase()}`) : 'LEDIG'}</div>
    <div class="wb-bar"><span style="width:${j ? Math.round((1 - j.left / j.total) * 100) : 0}%"></span></div>
    <ul>${c.log.slice(0, 4).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`;
}

function renderBoardProgress() {
  const j = S().cleaner.job;
  if (!j || !wbEl) return;
  const p = `${Math.round((1 - j.left / j.total) * 100)}%`;
  const bar = wbEl.querySelector('.wb-bar span');
  if (bar) bar.style.width = p;
  if (selected === j.room) { const cb = cardEl.querySelector('.progress span'); if (cb) cb.style.width = p; }
}
