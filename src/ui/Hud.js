// HUD: LED-klokke, natt, kasse, stjerner, kameravinkler, telefonvarsel, renholder, nøkkel i hånda og meldinger.
import { G, S } from '../game/G.js';
import { rating } from '../game/motel.js';
import { dropToTray } from '../game/motel.js';
import { keySvg } from './props.js';
import { hhmm, kr, esc } from '../core/util.js';

// Sjusegment-siffer (som LED-klokka i NATTSKIFT 69)
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
const SEGP = { a: 'M3,1 h12 l-2,3 h-8z', b: 'M16,2 v12 l-3,-2 v-8z', c: 'M16,16 v12 l-3,-2 v-8z', d: 'M3,29 h12 l-2,-3 h-8z', e: 'M2,16 v12 l3,-2 v-8z', f: 'M2,2 v12 l3,-2 v-8z', g: 'M3,15 h12 l-1.5,1.5 l1.5,1.5 h-12 l1.5,-1.5z' };
function digit(n) {
  const on = SEG[n] || '';
  return `<svg viewBox="0 0 18 30" class="seg">${Object.entries(SEGP).map(([k, d]) => `<path d="${d}" class="${on.includes(k) ? 'on' : ''}"/>`).join('')}</svg>`;
}
function sevenSeg(t) { return t.split('').map((c) => (c === ':' ? '<span class="colon">:</span>' : digit(c))).join(''); }

let hud, clockEl, nightEl, moneyEl, starsEl, phoneInd, cleanInd, handChip, cursor, toasts, tabs, arrows;

export function mountHud(overlay, onView) {
  hud = document.createElement('div');
  hud.className = 'hud hidden';
  hud.innerHTML = `
    <div class="hud-box">
      <div class="led"><div class="led-clock"></div><div class="led-night"></div></div>
      <div class="hud-row"><span class="money"></span><span class="stars"></span></div>
    </div>
    <div class="hud-tabs">
      <button data-view="0">◀ TELEFON &amp; NØKLER <kbd>A</kbd></button>
      <button data-view="1">RESEPSJON</button>
      <button data-view="2"><kbd>D</kbd> ROMKART ▶</button>
    </div>
    <div class="hud-right">
      <div class="ind phone-ind" title="Telefonen">☎</div>
      <div class="ind clean-ind" title="Renholder"></div>
      <button class="ind pause-btn" title="Pause (Esc)">❚❚</button>
    </div>
    <button class="edge edge-l" data-dir="-1">‹</button>
    <button class="edge edge-r" data-dir="1">›</button>
    <div class="hand-chip hidden"></div>
    <div class="toasts"></div>`;
  overlay.appendChild(hud);
  cursor = document.createElement('div');
  cursor.className = 'held-key hidden';
  overlay.appendChild(cursor);
  clockEl = hud.querySelector('.led-clock');
  nightEl = hud.querySelector('.led-night');
  moneyEl = hud.querySelector('.money');
  starsEl = hud.querySelector('.stars');
  phoneInd = hud.querySelector('.phone-ind');
  cleanInd = hud.querySelector('.clean-ind');
  handChip = hud.querySelector('.hand-chip');
  toasts = hud.querySelector('.toasts');
  tabs = hud.querySelectorAll('.hud-tabs button');
  arrows = hud.querySelectorAll('.edge');
  hud.querySelector('.hud-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) onView(+b.dataset.view, true); });
  arrows.forEach((a) => a.addEventListener('click', () => onView(+a.dataset.dir, false)));
  phoneInd.addEventListener('click', () => onView(0, true));
  hud.querySelector('.pause-btn').addEventListener('click', () => G.bus.emit('ui:pause'));
  handChip.addEventListener('click', (e) => { if (e.target.closest('[data-drop]')) dropToTray(); });

  G.bus.on('clock', renderTop);
  G.bus.on('money', renderTop);
  G.bus.on('phone', renderPhoneInd);
  G.bus.on('cleaner', renderClean);
  G.bus.on('hand', renderHand);
  G.bus.on('toast', ({ text, kind }) => toast(text, kind));
  G.bus.on('log', ({ text, kind }) => { if (kind === 'problem' || kind === 'good') toast(text, kind); });
}

export function showHud(on) { hud.classList.toggle('hidden', !on); if (!on) cursor.classList.add('hidden'); }

export function renderHud(view) {
  renderTop(); renderPhoneInd(); renderClean(); renderHand();
  setViewTabs(view);
}

export function setViewTabs(view) {
  tabs.forEach((t, i) => t.classList.toggle('on', i === view));
  arrows[0].classList.toggle('hidden', view === 0);
  arrows[1].classList.toggle('hidden', view === 2);
  renderPhoneInd(view);
}

let lastView = 1;
function renderTop() {
  const s = S();
  if (!s) return;
  clockEl.innerHTML = sevenSeg(hhmm(s.min));
  nightEl.textContent = `NATT ${s.night}`;
  moneyEl.textContent = kr(s.money);
  const r = rating();
  starsEl.innerHTML = '★★★★★'.split('').map((c, i) => `<i class="${r >= i + 0.75 ? 'on' : r >= i + 0.25 ? 'half' : ''}">★</i>`).join('');
}

function renderPhoneInd(view = lastView) {
  lastView = view;
  const s = S();
  if (!s) return;
  phoneInd.classList.toggle('ringing', !!s.phone.ringing);
  phoneInd.classList.toggle('active', !!s.phone.active);
}

function renderClean() {
  const j = S()?.cleaner.job;
  cleanInd.innerHTML = j ? `🧹 ${j.room}` : '🧹 ledig';
  cleanInd.classList.toggle('busy', !!j);
}

function renderHand() {
  const no = S()?.hand;
  handChip.classList.toggle('hidden', !no);
  cursor.classList.toggle('hidden', !no);
  if (no) {
    handChip.innerHTML = `I hånda: <b>nøkkel ${no}</b> <button data-drop>Legg i skåla</button>`;
    cursor.innerHTML = keySvg(no);
  }
}

export function moveCursor(x, y) {
  if (!cursor || cursor.classList.contains('hidden')) return;
  cursor.style.transform = `translate(${x - 20}px, ${y - 12}px) rotate(-14deg)`;
}

export function toast(text, kind = 'info') {
  if (!toasts) return;
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.innerHTML = esc(text);
  toasts.appendChild(t);
  while (toasts.children.length > 3) toasts.firstChild.remove();
  setTimeout(() => t.classList.add('out'), 4200);
  setTimeout(() => t.remove(), 4800);
}
