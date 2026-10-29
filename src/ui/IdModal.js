// Legitimasjonen gjesten la på disken, i stor visning: navn, bilde (originalportrettet som passfoto),
// fødselsdato og hjemsted, ved siden av reservasjonen og gjesten selv.
import { G } from '../game/G.js';
import { current, idDecision } from '../game/desk.js';
import { resById } from '../game/motel.js';
import { photoSvg } from './PortraitView.js';
import { esc } from '../core/util.js';

let el;

export function mountId(overlay) {
  el = document.createElement('div');
  el.className = 'modal id-modal hidden';
  overlay.appendChild(el);
  el.addEventListener('click', (e) => {
    if (e.target === el) return closeId();
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'close') return closeId();
    idDecision(a);
    if (a === 'approve' || a === 'reject') closeId();
    else render();
  });
  G.bus.on('ui:openId', openId);
  G.bus.on('desk', () => { if (isIdOpen()) { const v = current(); if (!v || !v.idDoc || v.idState === 'none') closeId(); else render(); } });
}

export const isIdOpen = () => el && !el.classList.contains('hidden');
export function openId() {
  const v = current();
  if (!v?.idDoc || !['counter', 'ok'].includes(v.idState)) return;
  el.classList.remove('hidden');
  G.audio?.play('pickup', { volume: 0.5 });
  render();
}
export function closeId() {
  if (!isIdOpen()) return;
  el.classList.add('hidden');
  G.audio?.play('put', { volume: 0.4 });
}

function render() {
  const v = current();
  if (!v?.idDoc) return;
  const d = v.idDoc;
  const res = resById(v.resId);
  const b = d.birth;
  const pass = d.kind === 'PASS';
  el.innerHTML = `<div class="id-wrap">
    <div class="id-doc ${pass ? 'pass' : ''}">
      <div class="id-top">${pass ? 'PASSPORT · PASS' : 'NORGE · NOREG'} <span>${d.kind}</span></div>
      <div class="id-photo">${photoSvg(d.charId, d.overrides)}</div>
      <div class="id-fields">
        <div><small>Navn / Name</small><b>${esc(d.name)}</b></div>
        <div><small>Født</small><b>${String(b.d).padStart(2, '0')}.${String(b.m).padStart(2, '0')}.${b.y}</b></div>
        <div><small>Hjemsted</small><b>${esc(d.hometown)}</b></div>
        <div><small>Nr.</small><b>${d.no}</b></div>
        <div><small>Utstedt</small><b>${d.year}</b></div>
      </div>
      ${v.idState === 'ok' ? '<div class="id-stamp">KONTROLLERT</div>' : ''}
    </div>
    <div class="id-side">
      <div class="id-compare"><small>Gjesten sa</small><b>«${esc(v.statedName)}»</b></div>
      <div class="id-compare"><small>Reservasjon</small><b>${res ? esc(res.name) : '<i>ikke funnet ennå</i>'}</b></div>
      <p class="id-hint">Sammenlign navn og bilde med gjesten ved disken.</p>
      ${v.idState === 'ok' ? '<button class="opt" data-act="close">LEGG FRA DEG</button>' : `
      <button class="opt primary" data-act="approve">STEMMER – GODKJENN</button>
      <button class="opt" data-act="ask">SPØR OM AVVIKET</button>
      <button class="opt bad" data-act="reject">AVVIS GJESTEN</button>
      <button class="opt" data-act="close">LUKK</button>`}
    </div></div>`;
}
