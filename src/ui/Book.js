// Den fysiske reservasjonsboka. Faner (bokmerker), bla mellom oppslag, klikkbare linjer.
// Alle reservasjoner – forhåndsbestilt, telefon og drop-in – ligger i samme database.
import { G, S } from '../game/G.js';
import { ROOM_TYPES, WISHES } from '../data/rooms.js';
import { current, linkReservation, createWalkInRes } from '../game/desk.js';
import { guestsIn, availability, ch } from '../game/motel.js';
import { esc, hhmm } from '../core/util.js';
import { nightsText } from '../data/dialogue/index.js';

const PER_PAGE = 8;
const STAMP = { expected: '', arrived: 'ANKOMMET', checked_in: 'INNSJEKKA', checked_out: 'UTSJEKKA', noshow: 'MØTTE IKKJE', cancelled: 'AVLYST', left: 'DRO' };
const SRC = { pre: 'Forh.', phone: 'Tlf.', walkin: 'Drop-in' };
let el, tab = 'tonight', spread = 0, sel = null, form = null;

export function mountBook(overlay) {
  el = document.createElement('div');
  el.className = 'modal book-modal hidden';
  overlay.appendChild(el);
  el.addEventListener('click', onClick);
  G.bus.on('ui:openBook', ({ mode } = {}) => openBook(mode));
  G.bus.on('book', () => { if (isOpen()) render(); });
  G.bus.on('desk', () => { if (isOpen()) render(); });
}

export const isOpen = () => el && !el.classList.contains('hidden');

export function openBook(mode = 'tonight') {
  tab = mode === 'new' ? 'new' : mode;
  spread = 0; sel = null;
  if (tab === 'new') initForm();
  el.classList.remove('hidden');
  G.audio?.play('paper');
  render();
}
export function closeBook() {
  if (!isOpen()) return;
  el.classList.add('hidden');
  G.audio?.play('paper', { volume: 0.5, rate: 0.9 });
}

function initForm() {
  const v = current();
  form = v?.kind === 'arrival' && !v.steps.res ? { type: v.wantType, nights: v.nights } : null;
}

function rowsFor(t) {
  const s = S();
  if (t === 'tonight') return s.reservations.filter((r) => r.night === s.night).sort((a, b) => (a.status === 'expected' ? 0 : 1) - (b.status === 'expected' ? 0 : 1) || a.expMin - b.expMin);
  if (t === 'later') return s.reservations.filter((r) => r.night > s.night && r.status === 'expected').sort((a, b) => a.night - b.night || a.expMin - b.expMin);
  return [];
}

function resRow(r) {
  const s = S();
  const when = r.night > s.night ? `${r.night - s.night === 1 ? 'i morra' : `natt ${r.night}`} ${hhmm(r.expMin)}` : hhmm(r.expMin);
  return `<button class="b-row ${sel === `r${r.id}` ? 'sel' : ''} st-${r.status}" data-sel="r${r.id}">
    <span class="c-time">${when}</span><span class="c-name">${esc(r.name)}</span>
    <span class="c-type">${ROOM_TYPES[r.type].short}·${r.nights <= 0 ? 't' : r.nights}</span><span class="c-room">${r.roomNo || '—'}</span>
    <span class="c-src">${SRC[r.source] || ''}</span>${STAMP[r.status] ? `<span class="stamp s-${r.status}">${STAMP[r.status]}</span>` : ''}</button>`;
}

function guestRow(g) {
  const s = S();
  const left = Math.ceil((g.checkoutAbs - ((s.night - 1) * 720 + s.min)) / 720);
  return `<button class="b-row ${sel === `g${g.id}` ? 'sel' : ''}" data-sel="g${g.id}">
    <span class="c-room big">${g.room}</span><span class="c-name">${esc(g.name)}</span>
    <span class="c-type">${left <= 0 ? 'ut i natt' : left === 1 ? 'ut i morra' : `${left} n.`}</span>
    <span class="c-src">${g.wish ? WISHES[g.wish].label : ''}</span></button>`;
}

function pages() {
  if (tab === 'guests') return guestsIn().sort((a, b) => a.room.localeCompare(b.room)).map(guestRow);
  return rowsFor(tab).map(resRow);
}

function detail() {
  if (!sel) return '<p class="b-muted">Klikk på en linje for detaljer.</p>';
  const s = S();
  const v = current();
  if (sel[0] === 'r') {
    const r = s.reservations.find((x) => x.id === +sel.slice(1));
    if (!r) return '';
    const canLink = v?.kind === 'arrival' && !v.steps.res && ['expected'].includes(r.status) && r.night <= s.night;
    return `<div class="b-detail"><b>${esc(r.name)}</b> · ${ROOM_TYPES[r.type].name} · ${nightsText(r.nights)}${r.roomNo ? ` · rom ${r.roomNo}` : ''}<br>
      Forventet ${hhmm(r.expMin)}${r.wish ? ` · Ønske: ${WISHES[r.wish].label.toLowerCase()}` : ''}${r.note ? ` · <i>${esc(r.note)}</i>` : ''}
      ${canLink ? `<button class="opt primary" data-act="link" data-id="${r.id}">DETTE E GJESTEN VED DISKEN</button>` : ''}</div>`;
  }
  const g = s.guests[+sel.slice(1)];
  if (!g) return '';
  return `<div class="b-detail"><b>${esc(g.name)}</b>, rom ${g.room} · innsjekka natt ${g.arrived.n} kl ${hhmm(g.arrived.m)}<br>
    ${g.mem.slice(-3).map((m) => esc(m.t)).join(' · ')}</div>`;
}

function formHtml() {
  const v = current();
  if (!form || !v || v.kind !== 'arrival' || v.steps.res) return `<div class="b-left"><h3>NY RESERVASJON</h3><p class="b-muted">Ingen gjest uten reservasjon ved disken.<br>Telefonbestillinger skrives inn fra telefonen.</p></div><div class="b-right"></div>`;
  const av = availability();
  const c = ch(v.charId);
  return `<div class="b-left"><h3>NY RESERVASJON</h3>
      <div class="f-row"><span>Navn</span><b class="hand">${esc(c.name)}</b></div>
      <div class="f-row"><span>Ankomst</span><b class="hand">${hhmm(S().min)} (drop-in)</b></div>
      <div class="f-row"><span>Ønske</span><b class="hand">${v.wish ? WISHES[v.wish].label : '—'}</b></div>
      <div class="f-row"><span>Gjesten vil ha</span><b class="hand">${ROOM_TYPES[v.wantType].name}, ${nightsText(v.nights)}</b></div></div>
    <div class="b-right"><h3>&nbsp;</h3>
      <div class="f-label">Romtype (ledig i natt)</div>
      <div class="f-choices">${['standard', 'komfort', 'suite'].map((t) => `<button class="chip ${form.type === t ? 'on' : ''} ${av[t] <= 0 ? 'none' : ''}" data-type="${t}">${ROOM_TYPES[t].name} <small>${Math.max(0, av[t])} ledig · ${ROOM_TYPES[t].price} kr</small></button>`).join('')}</div>
      <div class="f-label">Varighet</div>
      <div class="f-choices">${[0, 1, 2, 3].map((n) => `<button class="chip ${form.nights === n ? 'on' : ''}" data-nights="${n}">${n === 0 ? 'Noen timer' : nightsText(n)}</button>`).join('')}</div>
      <button class="opt primary write" data-act="create">SKRIV INN OG KNYTT TIL GJESTEN</button></div>`;
}

function render() {
  const tabs = [['tonight', 'I NATT'], ['guests', 'I HUSET'], ['later', 'SENERE'], ['new', 'NY']];
  let inner;
  if (tab === 'new') inner = formHtml();
  else {
    const rows = pages();
    const maxSpread = Math.max(0, Math.ceil(rows.length / (PER_PAGE * 2)) - 1);
    spread = Math.min(spread, maxSpread);
    const a = rows.slice(spread * PER_PAGE * 2, spread * PER_PAGE * 2 + PER_PAGE);
    const b = rows.slice(spread * PER_PAGE * 2 + PER_PAGE, (spread + 1) * PER_PAGE * 2);
    const title = { tonight: `ANKOMSTER · NATT ${S().night}`, guests: 'GJESTER I HUSET', later: 'KOMMENDE NETTER' }[tab];
    inner = `<div class="b-left"><h3>${title}</h3>${a.join('') || '<p class="b-muted">Ingen oppføringer.</p>'}
        <div class="b-pagenum">${spread * 2 + 1}</div>${spread > 0 ? '<button class="b-prev" data-act="prev">◀ bla</button>' : ''}</div>
      <div class="b-right"><h3>&nbsp;</h3>${b.join('')}<div class="b-detailbox">${detail()}</div>
        <div class="b-pagenum">${spread * 2 + 2}</div>${spread < maxSpread ? '<button class="b-next" data-act="next">bla ▶</button>' : ''}</div>`;
  }
  const v = current();
  const who = v?.kind === 'arrival' && !v.steps.res ? `<div class="b-desk">Ved disken: «${esc(v.statedName)}»</div>` : '';
  el.innerHTML = `<div class="book">
    <div class="b-tabs">${tabs.map(([k, l]) => `<button class="b-tab ${tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
    ${who}<div class="b-spread">${inner}</div>
    <button class="b-close" data-act="close" title="Lukk (Esc)">✕</button></div>`;
}

function flip(dir) {
  const sp = el.querySelector('.b-spread');
  sp?.classList.add(dir > 0 ? 'flip-next' : 'flip-prev');
  G.audio?.play('page');
  G.audio?.play('paper', { volume: 0.5 });
}

function onClick(e) {
  if (e.target === el) return closeBook();
  const t = e.target.closest('[data-tab],[data-sel],[data-act],[data-type],[data-nights]');
  if (!t) return;
  if (t.dataset.tab) { tab = t.dataset.tab; spread = 0; sel = null; if (tab === 'new') initForm(); flip(1); setTimeout(render, 140); return; }
  if (t.dataset.sel) { sel = t.dataset.sel; G.audio?.play('click', { volume: 0.3 }); render(); return; }
  if (t.dataset.type) { form.type = t.dataset.type; render(); return; }
  if (t.dataset.nights !== undefined) { form.nights = +t.dataset.nights; render(); return; }
  const a = t.dataset.act;
  if (a === 'close') closeBook();
  else if (a === 'next') { spread++; sel = null; flip(1); setTimeout(render, 140); }
  else if (a === 'prev') { spread--; sel = null; flip(-1); setTimeout(render, 140); }
  else if (a === 'link') { if (linkReservation(+t.dataset.id)) setTimeout(closeBook, 450); else render(); }
  else if (a === 'create') { if (createWalkInRes(form.type, form.nights)) setTimeout(closeBook, 450); }
}
