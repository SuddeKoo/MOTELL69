// MOTELL69 – oppstart: scene som skaleres til vinduet, tre kameravinkler (A/D), input, sløyfe.
import '@fontsource/rubik-dirt/latin-400.css';
import '@fontsource/special-elite/latin-400.css';
import '@fontsource/patrick-hand/latin-400.css';
import '../styles/main.css';

import { G, S } from './game/G.js';
import { loadSettings } from './core/settings.js';
import { Audio } from './audio/Audio.js';
import { svgDefs } from './ui/Portrait.js';
import { W, H } from './ui/layout.js';
import { mountCenter, centerFrame, updatePatience, resetCenter } from './ui/views/Center.js';
import { mountLeft, renderKeys, renderPhone, renderPad } from './ui/views/Left.js';
import { mountRight, renderMap, renderCard, renderBoard } from './ui/views/Right.js';
import { mountBook, isOpen as bookOpen, closeBook } from './ui/Book.js';
import { mountId, isIdOpen, closeId } from './ui/IdModal.js';
import { mountHud, showHud, renderHud, setViewTabs, moveCursor } from './ui/Hud.js';
import { mountMenu, showMenu, hideMenu, menuFrame, menuCar, playIntro, mountPanels } from './ui/Menu.js';
import { newGame, loadGame, tick, save, startNextNight } from './game/Game.js';
import { giveKey, current } from './game/desk.js';
import { guestsIn, ch } from './game/motel.js';
import { say } from './data/dialogue/index.js';
import { hhmm } from './core/util.js';

G.settings = loadSettings();
G.audio = new Audio(G.settings);
document.body.classList.toggle('no-flicker', !G.settings.flicker);

// ───────────── DOM ─────────────
const app = document.getElementById('app');
app.innerHTML = `${svgDefs()}<div id="stage"><div id="world"><div class="view v-left"></div><div class="view v-center"></div><div class="view v-right"></div></div><div id="screen"></div><div id="overlay"></div></div>`;
const stage = document.getElementById('stage');
const world = document.getElementById('world');
const overlay = document.getElementById('overlay');
const screen = document.getElementById('screen');
let scale = 1;

function fit() {
  scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
window.addEventListener('resize', fit);
fit();

mountLeft(world.querySelector('.v-left'));
mountCenter(world.querySelector('.v-center'));
mountRight(world.querySelector('.v-right'));
mountBook(overlay);
mountId(overlay);

// ───────────── Kamera ─────────────
let view = 1;
function setView(v, absolute = true) {
  const nv = Math.max(0, Math.min(2, absolute ? v : view + v));
  if (nv === view) return;
  if (bookOpen()) closeBook();
  if (isIdOpen()) closeId();
  view = nv;
  world.style.transform = `translateX(${-view * W}px)`;
  world.dataset.view = view;
  G.audio?.play('step', { volume: 0.12, rate: 1.2 });
  setViewTabs(view);
}
mountHud(overlay, setView);

// ───────────── Skjermer ─────────────
let mode = 'menu'; // menu | intro | game
const panels = mountPanels(overlay, {
  resume: () => setPause(false),
  settings: () => panels.openSettings('pause'),
  menu: () => { save(); setPause(false); toMenu(); },
  nextNight: () => { panels.showReport(null); startNextNight(); resetUi(); G.paused = false; intro(`Natt ${S().night}. Klokka e åtte.`); },
  toMenu: () => { panels.showReport(null); save(); toMenu(); },
});

mountMenu(screen, {
  new: () => { G.audio.unlock(); newGame(); resetUi(); intro(null, true); },
  continue: () => {
    G.audio.unlock();
    if (!loadGame()) return;
    resetUi();
    if (S().betweenShifts) { enterGame(); G.paused = true; panels.showReport(S().lastSummary); return; }
    intro(`Natt ${S().night}, kl ${hhmm(S().min)}. Du e tilbake bak disken.`);
  },
  settings: () => { G.audio.unlock(); panels.openSettings('main'); },
});

function intro(text, first = false) {
  mode = 'intro';
  const lines = first
    ? ['Natt 1.', 'Motell 69, et sted langs E6. Ti rom. Ett nøkkelbrett. Én telefon.', 'Forrige nattevakt slutta uten å si fra.']
    : [text];
  showMenu();
  playIntro(lines, enterGame);
}

function enterGame() {
  mode = 'game';
  G.paused = false;
  showHud(true);
  stage.classList.add('in-game');
  G.audio?.setScene('indoor');
  view = 1;
  world.style.transform = `translateX(${-W}px)`;
  renderHud(view);
}

function toMenu() {
  mode = 'menu';
  G.paused = true;
  showHud(false);
  stage.classList.remove('in-game');
  closeBook(); closeId();
  G.audio?.stopRing(); G.audio?.stopLine();
  showMenu();
}

function resetUi() {
  G.bus.emit('ui:reset');
  resetCenter();
  renderKeys(); renderPhone(); renderPad(); renderMap(); renderCard(); renderBoard();
  renderHud(view);
}

function setPause(on) {
  if (mode !== 'game') return;
  G.paused = on;
  if (on) panels.openPause(); else panels.closeAll();
  G.bus.emit('ui:freeze', on); // gjester som går, stopper også opp
  if (on) { G.audio?.stopRing(); save(); } else G.bus.emit('phone');
}
G.bus.on('ui:pause', () => setPause(true));
G.bus.on('shift:end', (sum) => { G.audio?.stopRing(); closeBook(); closeId(); panels.showReport(sum); });

// ───────────── Input ─────────────
window.addEventListener('keydown', (e) => {
  if (mode !== 'game') { if (e.key === 'Escape') panels.back(); return; }
  const k = e.key.toLowerCase();
  if (k === 'escape') {
    if (panels.screen() === 'settings') return panels.back(); // tilbake til pausemenyen
    if (panels.screen() === 'pause') return setPause(false);
    if (bookOpen()) return closeBook();
    if (isIdOpen()) return closeId();
    if (S()?.betweenShifts) return;
    return setPause(true);
  }
  if (G.paused) return;
  if (k === 'a' || k === 'arrowleft') setView(-1, false);
  if (k === 'd' || k === 'arrowright') setView(1, false);
});

stage.addEventListener('pointermove', (e) => {
  const r = stage.getBoundingClientRect();
  moveCursor((e.clientX - r.left) / scale, (e.clientY - r.top) / scale);
});
document.addEventListener('pointerdown', () => G.audio.unlock(), { once: true });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'game') { save(); setPause(true); } });
window.addEventListener('pagehide', () => { if (mode === 'game') save(); });

// ───────────── Sjeldne bakgrunnshendelser ─────────────
let nextAmbient = 25, nextMenuCar = 8;
function ambient(dt) {
  nextAmbient -= dt;
  if (nextAmbient > 0) return;
  nextAmbient = 45 + Math.random() * 70;
  const s = S();
  const r = Math.random();
  if (r < 0.25) { G.bus.emit('ambient', { kind: 'car' }); G.audio?.play('car_pass', { volume: 0.5, muffled: true }); }
  else if (r < 0.4) { G.bus.emit('ambient', { kind: 'gust' }); G.audio?.gust(); }
  else if (r < 0.52) G.audio?.play('door_slam', { volume: 0.5 });
  else if (r < 0.64) { for (let i = 0; i < 4; i++) G.audio?.play('step', { volume: 0.14, delay: i * 0.5, rate: 0.85, muffled: true }); }
  else if (r < 0.78 && G.settings.flicker) { G.bus.emit('ambient', { kind: 'flicker' }); G.audio?.play('flicker'); }
  else if (r < 0.93 && !s.queue.length && view === 1) {
    const g = guestsIn().filter((x) => !x.atDesk);
    if (g.length) { const pick = g[Math.floor(Math.random() * g.length)]; G.bus.emit('ambient', { kind: 'passerby', charId: pick.charId, text: say(pick.charId, Math.random() < 0.5 ? 'passing' : 'rare', {}) }); }
  } else { G.bus.emit('ambient', { kind: 'car' }); G.audio?.play('car_door', { volume: 0.4, muffled: true }); }
}

// ───────────── Sløyfe ─────────────
let last = performance.now(), patT = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (mode === 'game') {
    tick(dt);
    if (!G.paused) {
      centerFrame(dt, view === 1);
      ambient(dt);
      patT += dt;
      if (patT > 0.5) { patT = 0; updatePatience(); }
    }
  } else {
    menuFrame(dt);
    nextMenuCar -= dt;
    if (nextMenuCar < 0) { nextMenuCar = 35 + Math.random() * 50; menuCar(); }
  }
  requestAnimationFrame(frame);
}
showMenu();
requestAnimationFrame(frame);

// Testkrok i utviklingsmodus
if (import.meta.env.DEV) {
  Promise.all([import('./game/desk.js'), import('./game/phone.js'), import('./game/cleaner.js'), import('./game/motel.js'), import('./game/Game.js'), import('./game/issues.js')]).then(([desk, phone, cleaner, motel, game, issues]) => {
    window.__m69 = { G, S, setView, current, startNextNight, desk, phone, cleaner, motel, game, issues,
      skip(min) { for (let i = 0; i < min * 20; i++) game.tick(1 / 14.1); } };
  });
}
