// SENTER: resepsjonsdisken. Lag bakfra og fram: bakgrunn (Higgsfield, uten disk) → gjester →
// SVG-disken (eget forgrunnslag) → gjenstander på disken → snakkeboble og samtalekort.
import { G, S, toast } from '../../game/G.js';
import { CENTER as L, BG, W } from '../layout.js';
import { PortraitView } from '../PortraitView.js';
import { Snow } from '../Snow.js';
import { bookClosedSvg, bellSvg, imprinterSvg, traySvg, idCardSvgSmall, keySvg, idMatSvg, keyMatSvg, mugSvg, penCupSvg } from '../props.js';
import { counterUrl, COUNTER_CENTER } from '../art/counter.js';
import { current, deskOptions, choose, giveKey, takeCounterKey, deskAnimDone, deskExitDone } from '../../game/desk.js';
import { dropToTray, pickKey, ch } from '../../game/motel.js';
import { TEXT_SPEED } from '../../core/settings.js';
import { esc, kr } from '../../core/util.js';
import { CHAR_BY_ID } from '../../data/characters.js';

const sprites = new Map(); // visitorId → { el, pv }
let root, guestsEl, bubble, bubbleText, panel, idCard, counterKey, trayEl, snow, typing = null;

const box = (r) => `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;

export function mountCenter(view) {
  root = view;
  G.animConfirm = true; // køen venter på at gangen faktisk er ferdig (se desk.js)
  view.innerHTML = `
    <img class="bg" src="${BG.center}" alt="" draggable="false">
    <canvas class="win-snow" style="left:${L.window.x}px;top:${L.window.y}px;width:${L.window.w}px;height:${L.window.h}px"></canvas>
    <div class="headlights" style="left:${L.window.x}px;top:${L.window.y}px;width:${L.window.w}px;height:${L.window.h}px"></div>
    <div class="lamp-glow" style="left:${L.lamp.x - 140}px;top:${L.lamp.y - 30}px;width:${L.lamp.w + 280}px;height:340px"></div>
    <div class="guests"></div>
    <img class="counter" src="${counterUrl(COUNTER_CENTER)}" alt="" draggable="false">
    <div class="prop decor id-mat" style="${box(L.idMat)}">${idMatSvg()}</div>
    <button class="prop key-mat" style="${box(L.keyMat)}" title="Nøkkeloverlevering">${keyMatSvg()}</button>
    <div class="prop decor" style="${box(L.penCup)}">${penCupSvg()}</div>
    <div class="prop decor mug" style="${box(L.mug)}">${mugSvg()}</div>
    <button class="prop book-closed" style="${box(L.book)}" title="Reservasjonsboka">${bookClosedSvg()}</button>
    <button class="prop bell" style="${box(L.bell)}" title="Bordklokke">${bellSvg()}</button>
    <button class="prop imprinter" style="${box(L.imprinter)}" title="Ta betalt">${imprinterSvg()}<span class="price-tag"></span></button>
    <div class="prop tray" style="${box(L.tray)}" title="Nøkkelskål">${traySvg()}<div class="tray-keys"></div></div>
    <button class="prop id-card hidden" style="${box(L.idSpot)}" title="Legitimasjon"></button>
    <button class="prop counter-key hidden" style="left:${L.counterKey.x}px;top:${L.counterKey.y}px" title="Nøkkel på disken"></button>
    <div class="kjell-note" style="left:${L.note.x}px;top:${L.note.y}px;width:${L.note.w}px">Boka ligg på disken. Nøklan henge til venstre (A). Romkartet til høyre (D). Bodil vaske når du ber ho. Ikkje svar 203. <b>– Kjell</b></div>
    <div class="bubble hidden" style="left:${L.speech.x}px;top:${L.speech.y}px;width:${L.speech.w}px"><div class="bubble-name"></div><div class="bubble-text"></div></div>
    <div class="desk-panel" style="left:${L.panel.x}px;top:${L.panel.y}px;width:${L.panel.w}px;max-height:${L.panel.h}px"></div>
  `;
  guestsEl = view.querySelector('.guests');
  bubble = view.querySelector('.bubble');
  bubbleText = bubble.querySelector('.bubble-text');
  panel = view.querySelector('.desk-panel');
  idCard = view.querySelector('.id-card');
  counterKey = view.querySelector('.counter-key');
  trayEl = view.querySelector('.tray-keys');
  snow = new Snow(view.querySelector('.win-snow'), { count: 70, alpha: 0.55, size: 0.9 });

  view.querySelector('.book-closed').addEventListener('click', () => G.bus.emit('ui:openBook', { mode: 'tonight' }));
  view.querySelector('.bell').addEventListener('click', () => { G.audio?.play('desk_bell'); bump(view.querySelector('.bell')); });
  view.querySelector('.imprinter').addEventListener('click', () => {
    const v = current();
    if (v?.kind === 'arrival' && v.steps.room && !v.steps.paid && !v.haggling) choose('pay');
    else { G.audio?.play('clasp', { volume: 0.4 }); toast(v?.kind === 'arrival' && !v.steps.room ? 'Velg rom før betaling.' : 'Ingenting å ta betalt for nå.'); }
  });
  idCard.addEventListener('click', () => G.bus.emit('ui:openId'));
  counterKey.addEventListener('click', () => takeCounterKey());
  // Nøkkelmatta: med en nøkkel i hånda gis den til gjesten; ellers tas nøkkelen gjesten la der
  view.querySelector('.key-mat').addEventListener('click', () => {
    if (S().hand) { if (current()) giveKey(); else toast('Ingen ved disken å gi nøkkelen til.'); }
    else if (!takeCounterKey()) G.audio?.play('put', { volume: 0.25 });
  });
  view.querySelector('.tray').addEventListener('click', (e) => {
    const k = e.target.closest('[data-key]');
    if (S().hand && !k) { dropToTray(); return; }
    if (k) pickKey(k.dataset.key);
  });
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-opt]');
    if (b && !b.disabled) choose(b.dataset.opt);
  });
  // Nøkkel dras/klikkes på gjesten
  let lastGive = 0;
  const tryGive = (e) => {
    const sp = e.target.closest('.guest');
    if (!sp || !S().hand || performance.now() - lastGive < 400) return;
    const v = current();
    if (v && +sp.dataset.vid === v.id) { lastGive = performance.now(); giveKey(); }
  };
  guestsEl.addEventListener('pointerup', tryGive);
  guestsEl.addEventListener('click', tryGive);

  G.bus.on('desk', reconcile);
  G.bus.on('desk:say', onSay);
  G.bus.on('desk:leave', onLeave);
  G.bus.on('desk:mutter', onMutter);
  G.bus.on('keys', renderProps);
  G.bus.on('hand', renderProps);
  G.bus.on('book', renderPanel);
  G.bus.on('rooms', renderPanel);
  G.bus.on('ambient', onAmbient);
  G.bus.on('ui:reset', resetCenter);
  G.bus.on('ui:freeze', (on) => { for (const [, sp] of sprites) on ? sp.anim?.pause() : sp.anim?.play(); });
}

function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

export function resetCenter() {
  for (const [, sp] of sprites) sp.pv.destroy();
  sprites.clear();
  guestsEl.innerHTML = '';
  bubble.classList.add('hidden');
  reconcile();
}

// ───────────── Gjester ─────────────
const posOf = (p) => { const w = L.guest.w, h = w * 1.3; return `translate(${p.x - w / 2}px, ${p.bottom - h}px) scale(${p.s ?? 1})`; };

function place(sp, x, bottom, s, opacity = 1) {
  sp.el.style.transform = posOf({ x, bottom, s });
  sp.el.style.opacity = opacity;
}

/** Gå til et punkt. Løses med true først når animasjonen faktisk er ferdig (false hvis den ble avbrutt). */
function moveTo(sp, p, ms, { opacity = 1, delay = 0, easing = 'cubic-bezier(.3,.1,.3,1)' } = {}) {
  const to = posOf(p);
  const cs = getComputedStyle(sp.el);
  const from = cs.transform && cs.transform !== 'none' ? cs.transform : to;
  const fromOp = cs.opacity;
  sp.anim?.cancel();
  sp.el.style.transform = to;
  sp.el.style.opacity = opacity;
  const a = sp.el.animate([{ transform: from, opacity: fromOp }, { transform: to, opacity }], { duration: ms, delay, easing, fill: 'backwards' });
  if (G.paused) a.pause();
  sp.anim = a;
  return a.finished.then(() => sp.anim === a, () => false);
}

function steps(n, vol = 0.3, gap = 0.42, delay = 0) {
  for (let i = 0; i < n; i++) G.audio?.play('step', { volume: vol * (1 - i * 0.12), delay: delay + i * gap });
}

function makeSprite(v, at) {
  const pv = new PortraitView(v.charId, { mood: v.mood || 'normal' });
  const el = document.createElement('div');
  el.className = 'guest';
  el.dataset.vid = v.id;
  el.style.width = `${L.guest.w}px`;
  el.style.height = `${L.guest.w * 1.3}px`;
  el.appendChild(pv.el);
  const sp = { el, pv, vid: v.id, key: null };
  place(sp, at.x, at.bottom, at.s, 0);
  guestsEl.appendChild(el);
  sprites.set(v.id, sp);
  return sp;
}

/** Hvor gjesten skal stå i den tilstanden køen har nå. */
function targetOf(v) {
  if (v.phase === 'approach' || v.phase === 'counter') return { key: 'counter', p: L.guest, z: 5 };
  const slot = v.slot ?? 0;
  return { key: `slot${slot}`, p: L.queue[slot], z: 3 - slot };
}

function reconcile() {
  const q = S().queue;
  for (const v of q) {
    const tg = targetOf(v);
    let sp = sprites.get(v.id);
    const fresh = !sp;
    // Nye gjester kommer inn døra; etter lasting dukker de ventende opp der de sto
    if (!sp) sp = makeSprite(v, v.phase === 'queue' ? tg.p : L.enter);
    sp.pv.setMood(v.mood || 'normal');
    sp.el.classList.toggle('waiting', tg.key !== 'counter');
    if (sp.key === tg.key) continue;
    sp.key = tg.key;
    sp.el.style.zIndex = tg.z;
    const ms = fresh ? 1350 : tg.key === 'counter' ? 1150 : 900;
    if (fresh || tg.key === 'counter') steps(fresh ? 3 : 2, fresh ? 0.35 : 0.3, 0.42, fresh ? 0.3 : 0.1);
    const id = v.id;
    moveTo(sp, tg.p, ms).then((done) => { if (done) deskAnimDone(id); });
  }
  const ids = new Set(q.map((v) => v.id));
  for (const [id, sp] of sprites) if (!ids.has(id) && !sp.leaving) { sp.anim?.cancel(); sp.pv.destroy(); sp.el.remove(); sprites.delete(id); }
  const v = current();
  if (!v) bubble.classList.add('hidden');
  renderPanel();
  renderProps();
}

/** Utgang: (1) et steg bort fra disken, (2) bak de ventende og ut døra/gangen. Køen slippes fram etterpå. */
async function onLeave({ v, delay, fromCounter }) {
  const sp = sprites.get(v.id);
  if (!sp) { deskExitDone(v.id); return; }
  sp.leaving = true;
  sp.key = 'leaving';
  sp.el.classList.add('leaving');
  sp.el.classList.remove('waiting');
  const hall = v.exit === 'hall';
  const out = hall ? L.exitHall : L.enter;
  let ok = true;
  if (fromCounter) {
    const turn = hall ? { ...L.turn, x: 1600 - L.turn.x } : L.turn;
    steps(2, 0.3, 0.42, delay || 1);
    ok = await moveTo(sp, turn, 650, { delay: (delay || 1) * 1000, easing: 'ease-in-out' });
    if (current() == null) bubble.classList.add('hidden');
  }
  if (ok) {
    sp.el.style.zIndex = 1; // går bak de som venter
    steps(2, 0.25, 0.45);
    if (!hall) G.audio?.play('door', { delay: 0.9, volume: 0.6 });
    ok = await moveTo(sp, out, 1250, { opacity: 0, easing: 'ease-in' });
  }
  if (sprites.get(v.id) === sp) { sp.pv.destroy(); sp.el.remove(); sprites.delete(v.id); }
  if (ok) deskExitDone(v.id);
}

function onSay({ id, text, mood }) {
  const v = current();
  const sp = sprites.get(id);
  if (sp && mood) sp.pv.setMood(mood);
  if (!v || v.id !== id) {
    // Gjesten som går, sier siste replikk i boblen også
    const leaving = sp?.leaving;
    if (!leaving) return;
  }
  const c = CHAR_BY_ID[sprites.get(id)?.pv.charId || v?.charId];
  showBubble(c, text, sp);
}

function showBubble(c, text, sp) {
  bubble.classList.remove('hidden');
  bubble.querySelector('.bubble-name').textContent = c ? c.first : '';
  bump(bubble);
  clearInterval(typing);
  const cps = TEXT_SPEED[G.settings.textSpeed] ?? 55;
  if (!cps) { bubbleText.textContent = text; sp?.pv.talk(0.6); return; }
  let i = 0;
  bubbleText.textContent = '';
  sp?.pv.talk(text.length / cps);
  if (c) G.audio?.vocal(c, 'talk');
  typing = setInterval(() => {
    i = Math.min(text.length, i + Math.max(1, Math.round(cps / 30)));
    bubbleText.textContent = text.slice(0, i);
    if (i >= text.length) clearInterval(typing);
  }, 33);
}

function onMutter({ id, text }) {
  const sp = sprites.get(id);
  if (!sp) return;
  const m = document.createElement('div');
  m.className = 'mutter';
  m.textContent = text;
  const r = sp.el.style.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);
  if (r) { m.style.left = `${+r[1] + 120}px`; m.style.top = `${+r[2] + 140}px`; }
  root.appendChild(m);
  setTimeout(() => m.remove(), 4200);
}

// ───────────── Gjenstander på disken ─────────────
function renderProps() {
  const s = S();
  const v = current();
  const idOn = v?.kind === 'arrival' && ['counter', 'ok'].includes(v.idState) && v.idDoc;
  idCard.classList.toggle('hidden', !idOn);
  if (idOn) {
    idCard.innerHTML = idCardSvgSmall(v.idDoc.kind) + (v.idState === 'ok' ? '<span class="stamp-ok">OK</span>' : '');
    idCard.classList.toggle('checked', v.idState === 'ok');
  }
  const ck = v && ((v.kind === 'checkout' && v.keyOnCounter) || (v.kind === 'return' && v.stage === 'old_on_counter')) ? v.room : null;
  counterKey.classList.toggle('hidden', !ck);
  if (ck) counterKey.innerHTML = `<div class="lying-key">${keySvg(ck, { small: true })}</div>`;
  trayEl.innerHTML = s.tray.map((no, i) => `<div class="tray-key" data-key="${no}" style="left:${10 + i * 26}px">${keySvg(no, { small: true })}</div>`).join('');
  const imp = root.querySelector('.imprinter');
  const canPay = v?.kind === 'arrival' && v.steps.room && !v.steps.paid;
  imp.classList.toggle('ready', !!canPay);
  imp.querySelector('.price-tag').textContent = canPay ? kr(v.price) : '';
  root.querySelector('.guests').classList.toggle('drop-ready', !!s.hand && !!v);
}

// ───────────── Samtalekort ─────────────
function step(done, label) { return `<li class="${done ? 'done' : ''}">${done ? '✔' : '☐'} ${label}</li>`; }

export function renderPanel() {
  if (!panel) return;
  const v = current();
  const s = S();
  if (!v) {
    const q = s.queue.length;
    panel.innerHTML = `<div class="panel-head">RESEPSJONEN</div><div class="panel-empty">${q ? 'Gjesten kommer inn…' : 'Ingen ved disken.'}<br><small>Hør etter døra og telefonen.</small></div>`;
    return;
  }
  const c = ch(v.charId);
  const { hint, options } = deskOptions(v);
  let head = '', list = '';
  if (v.kind === 'arrival') {
    head = `<div class="panel-head">${v.walkIn ? 'DROP-IN' : 'ANKOMST'}</div><div class="panel-who">«${esc(v.statedName)}»</div>`;
    list = `<ul class="checklist">${step(v.steps.res, 'Reservasjon')}${step(v.steps.id, 'Legitimasjon')}${step(!!v.steps.room, v.steps.room ? `Rom ${v.steps.room}` : 'Rom')}${step(v.steps.paid, v.steps.paid ? `Betalt ${kr(v.price)}` : 'Betaling')}${step(false, 'Nøkkel')}</ul>`;
  } else if (v.kind === 'checkout') {
    head = `<div class="panel-head">UTSJEKKING</div><div class="panel-who">${esc(c.name)} · rom ${v.room}</div>`;
  } else {
    head = `<div class="panel-head">GJEST · ROM ${v.room}</div><div class="panel-who">${esc(c.name)}</div>`;
  }
  const pat = Math.min(1, v.patience / v.patienceMax);
  panel.innerHTML = `${head}${list}
    <div class="patience"><span style="width:${Math.round((1 - pat) * 100)}%" class="${pat > 0.75 ? 'low' : pat > 0.45 ? 'mid' : ''}"></span></div>
    ${hint ? `<div class="panel-hint">${esc(hint)}</div>` : ''}
    <div class="panel-opts">${options.map((o) => `<button data-opt="${o.id}" class="opt ${o.primary ? 'primary' : ''} ${o.tone === 'bad' ? 'bad' : ''}">${esc(o.label)}</button>`).join('')}</div>`;
}

export function updatePatience() {
  const v = current();
  const bar = panel?.querySelector('.patience span');
  if (!v || !bar) return;
  const pat = Math.min(1, v.patience / v.patienceMax);
  bar.style.width = `${Math.round((1 - pat) * 100)}%`;
  bar.className = pat > 0.75 ? 'low' : pat > 0.45 ? 'mid' : '';
}

export function centerFrame(dt, visible) {
  if (visible) snow.step(dt);
}

function onAmbient(ev) {
  if (ev.kind === 'car') {
    const h = root.querySelector('.headlights');
    h.classList.remove('sweep'); void h.offsetWidth; h.classList.add('sweep');
  }
  if (ev.kind === 'gust') snow.gust = 2.2;
  if (ev.kind === 'flicker' && G.settings.flicker) {
    const l = root.querySelector('.lamp-glow');
    l.classList.remove('flick'); void l.offsetWidth; l.classList.add('flick');
  }
  if (ev.kind === 'passerby') passerby(ev.charId, ev.text);
}

function passerby(charId, text) {
  const pv = new PortraitView(charId, { mood: 'normal' });
  const el = document.createElement('div');
  el.className = 'guest passer';
  el.style.width = `${L.guest.w}px`; el.style.height = `${L.guest.w * 1.3}px`;
  el.appendChild(pv.el);
  guestsEl.appendChild(el);
  const sp = { el, pv };
  place(sp, L.exitHall.x, L.exitHall.bottom, 0.5, 0);
  void el.offsetWidth;
  el.style.transition = 'transform 5.5s linear, opacity .8s';
  place(sp, L.enter.x, 640, 0.52, 1);
  G.audio?.play('step', { volume: 0.2 }); G.audio?.play('step', { volume: 0.2, delay: 0.6 }); G.audio?.play('step', { volume: 0.2, delay: 1.2 });
  setTimeout(() => {
    const m = document.createElement('div');
    m.className = 'mutter';
    m.textContent = text;
    m.style.left = '900px'; m.style.top = '330px';
    root.appendChild(m);
    setTimeout(() => m.remove(), 3800);
  }, 1400);
  setTimeout(() => { el.style.opacity = 0; G.audio?.play('door', { volume: 0.45 }); }, 5200);
  setTimeout(() => { pv.destroy(); el.remove(); }, 6400);
}
