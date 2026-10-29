// Hovedmeny: motellet utenfra (Higgsfield) med snø, flimrende neon, varme vinduer, litt dybde
// og utendørs ambience. Pluss startsekvens, innstillinger, pause og skiftrapport.
import { G } from '../game/G.js';
import { BG } from './layout.js';
import { Snow } from './Snow.js';
import { PortraitView } from './PortraitView.js';
import { CHARACTERS } from '../data/characters.js';
import { hasSave, peekSave } from '../game/save.js';
import { saveSettings } from '../core/settings.js';
import { hhmm, kr, esc } from '../core/util.js';

let menu, snowA, snowB, layer, npcs = [];

export function mountMenu(screen, handlers) {
  menu = document.createElement('div');
  menu.className = 'menu';
  menu.innerHTML = `
    <div class="menu-layer"><img class="bg" src="${BG.menu}" alt="" draggable="false">
      <div class="glow-reception"></div><div class="neon-ledig"></div><div class="glow-sign"></div>
      <div class="car-lights"></div></div>
    <canvas class="snow-far"></canvas>
    <div class="menu-npcs"></div>
    <canvas class="snow-near"></canvas>
    <div class="menu-shade"></div>
    <div class="title"><span class="t-motell">MOTELL</span><span class="t-69">69</span></div>
    <div class="tagline">«Det e alltid ledig rom. Nesten.»</div>
    <div class="paper-note"><b>MOTELL 69</b><br>Nattresepsjon. Ti rom, én renholder, null spørsmål. Åpna i 1987.</div>
    <div class="menu-buttons">
      <button class="mbtn" data-act="new"><b>NYTT SPILL</b><small>Første nattskift. Nøklan henge på brettet.</small></button>
      <button class="mbtn" data-act="continue"><b>FORTSETT</b><small class="cont-sub"></small></button>
      <button class="mbtn" data-act="settings"><b>INNSTILLINGER</b><small>Lyd, teksthastighet, blinking</small></button>
    </div>
    <div class="menu-foot">Et fiktivt, absurd spill. Alle personer og hendelser er oppdiktet. Lyder: NOX SOUND (CC0). Bakgrunner: Higgsfield. Ingen AI kjører i spillet.</div>
    <div class="click-hint">Klikk for lyd</div>`;
  screen.appendChild(menu);
  layer = menu.querySelector('.menu-layer');
  snowA = new Snow(menu.querySelector('.snow-far'), { count: 110, size: 0.7, alpha: 0.55, speed: 0.7 });
  snowB = new Snow(menu.querySelector('.snow-near'), { count: 38, size: 1.6, alpha: 0.8, speed: 1.3 });
  menu.querySelector('.menu-buttons').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    G.audio?.play('click');
    handlers[b.dataset.act]?.();
  });
  menu.querySelectorAll('.mbtn').forEach((b) => b.addEventListener('pointerenter', () => G.audio?.play('hover')));
  menu.addEventListener('pointermove', (e) => {
    const r = menu.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
    layer.style.transform = `scale(1.045) translate(${-nx * 14}px, ${-ny * 8}px)`;
    menu.querySelector('.menu-npcs').style.transform = `translate(${-nx * 26}px, ${-ny * 6}px)`;
  });
  menu.addEventListener('pointerdown', () => menu.querySelector('.click-hint')?.remove(), { once: true });
}

export function showMenu() {
  menu.classList.remove('hidden', 'zoom-out', 'zoom-in');
  layer.style.transform = 'scale(1.045)';
  const save = peekSave();
  const cont = menu.querySelector('[data-act="continue"]');
  cont.disabled = !hasSave() || !save;
  menu.querySelector('.cont-sub').textContent = save
    ? `Natt ${save.night} · ${hhmm(save.min)} · ${kr(save.money)} · ${Object.values(save.guests || {}).filter((g) => g.status === 'in').length} gjester inne`
    : 'Ingen lagret vakt ennå';
  // Tre tilfeldige figurer i snøen, som på NATTSKIFT-menyen
  for (const p of npcs) p.destroy();
  npcs = [];
  const box = menu.querySelector('.menu-npcs');
  box.innerHTML = '';
  G.rng.pickN(CHARACTERS, 3).forEach((c, i) => {
    const p = new PortraitView(c.id, { mood: i === 1 ? 'happy' : 'normal', cls: `menu-npc n${i}` });
    box.appendChild(p.el);
    npcs.push(p);
  });
  G.audio?.setScene('outdoor');
}

export function hideMenu() { menu.classList.add('hidden'); }

export function menuFrame(dt) {
  if (menu.classList.contains('hidden')) return;
  snowA.step(dt); snowB.step(dt);
}

export function menuCar() {
  if (menu.classList.contains('hidden')) return;
  const c = menu.querySelector('.car-lights');
  c.classList.remove('go'); void c.offsetWidth; c.classList.add('go');
  G.audio?.play('car_pass', { volume: 0.32, muffled: true }); // langt borte på E6
}

/** Startsekvens: kamera mot resepsjonsvinduet, korte tekstkort, dør og bjelle. Klikk for å hoppe over. */
export function playIntro(lines, done) {
  const intro = document.createElement('div');
  intro.className = 'intro';
  menu.parentElement.appendChild(intro);
  menu.classList.add('zoom-in');
  G.audio?.play('step_snow', { volume: 0.5, delay: 0.3 }); G.audio?.play('step_snow', { volume: 0.5, delay: 0.9 }); G.audio?.play('step_snow', { volume: 0.5, delay: 1.5 });
  let i = 0, finished = false;
  const timers = [];
  const finish = () => {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    G.audio?.play('door', { volume: 0.8 });
    G.audio?.play('bell', { delay: 0.2 });
    G.audio?.setScene('indoor', 2.5);
    intro.classList.add('out');
    setTimeout(() => { intro.remove(); hideMenu(); }, 900);
    done();
  };
  const next = () => {
    if (i >= lines.length) { timers.push(setTimeout(finish, 900)); return; }
    intro.innerHTML = `<p class="intro-line">${esc(lines[i++])}</p>`;
    timers.push(setTimeout(next, 1700));
  };
  timers.push(setTimeout(next, 900));
  intro.addEventListener('pointerdown', finish);
  G.bus.emit('ui:introSkip', finish);
}

// ───────────── Innstillinger / pause / rapport ─────────────
// Pause og innstillinger er én menytilstand (nav.screen): aldri to modaler oppå hverandre.
// Innstillinger husker hvor de ble åpnet fra, og TILBAKE/Esc går dit (pausemenyen eller hovedmenyen).
export function mountPanels(overlay, h) {
  const nav = { screen: null, from: null }; // screen: null | 'pause' | 'settings'; from: 'pause' | 'main'
  const set = document.createElement('div');
  set.className = 'modal settings-modal hidden';
  overlay.appendChild(set);
  const renderSet = () => {
    const s = G.settings;
    const slider = (k, l) => `<label class="sl"><span>${l}</span><input type="range" min="0" max="1" step="0.05" value="${s[k]}" data-k="${k}"><em>${Math.round(s[k] * 100)}</em></label>`;
    const chips = (k, opts) => opts.map(([v, l]) => `<button class="chip ${s[k] === v ? 'on' : ''}" data-k="${k}" data-v="${v}">${l}</button>`).join('');
    set.innerHTML = `<div class="paper-panel"><h2>INNSTILLINGER</h2>
      ${slider('master', 'Hovedvolum')}${slider('amb', 'Ambience')}${slider('sfx', 'Lydeffekter')}${slider('voice', 'Stemmelyder')}
      <div class="row"><span>Lyd</span>${chips('muted', [[false, 'På'], [true, 'Av (mute)']])}</div>
      <div class="row"><span>Teksthastighet</span>${chips('textSpeed', [['slow', 'Rolig'], ['normal', 'Normal'], ['fast', 'Rask'], ['instant', 'Med en gang']])}</div>
      <div class="row"><span>Flimring/blinking</span>${chips('flicker', [[true, 'På'], [false, 'Redusert']])}</div>
      <div class="row"><span>Lengde på skift</span>${chips('nightLength', [[15, '15 min'], [17, '17 min'], [20, '20 min']])}</div>
      <button class="opt primary" data-close>TILBAKE</button></div>`;
  };
  set.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    G.settings[k] = +e.target.value;
    e.target.nextElementSibling.textContent = Math.round(G.settings[k] * 100);
    G.audio?.applyVolumes(); saveSettings(G.settings);
  });
  set.addEventListener('click', (e) => {
    const c = e.target.closest('[data-v]');
    if (c) {
      const k = c.dataset.k, raw = c.dataset.v;
      G.settings[k] = raw === 'true' ? true : raw === 'false' ? false : isNaN(+raw) ? raw : +raw;
      G.audio?.applyVolumes(); saveSettings(G.settings);
      document.body.classList.toggle('no-flicker', !G.settings.flicker);
      renderSet();
    }
    if (e.target.closest('[data-close]') || e.target === set) back();
  });

  const pause = document.createElement('div');
  pause.className = 'modal pause-modal hidden';
  pause.innerHTML = `<div class="paper-panel"><h2>PAUSE</h2><p class="muted">Klokka står. Gjestene venter tålmodig. Nesten.</p>
    <button class="opt primary" data-p="resume">FORTSETT VAKTA</button>
    <button class="opt" data-p="settings">INNSTILLINGER</button>
    <button class="opt" data-p="menu">LAGRE OG GÅ TIL MENYEN</button></div>`;
  overlay.appendChild(pause);
  pause.addEventListener('click', (e) => {
    const b = e.target.closest('[data-p]');
    if (b) h[b.dataset.p]?.();
    else if (e.target === pause) h.resume();
  });

  const rep = document.createElement('div');
  rep.className = 'modal report-modal hidden';
  overlay.appendChild(rep);
  rep.addEventListener('click', (e) => {
    const b = e.target.closest('[data-r]');
    if (b) h[b.dataset.r]?.();
  });

  const show = (screen) => {
    nav.screen = screen;
    pause.classList.toggle('hidden', screen !== 'pause');
    set.classList.toggle('hidden', screen !== 'settings');
  };
  /** TILBAKE fra innstillingene: til pausemenyen hvis de ble åpnet derfra, ellers lukkes de (hovedmenyen). */
  function back() {
    if (nav.screen !== 'settings') return;
    show(nav.from === 'pause' ? 'pause' : null);
    G.audio?.play('click', { volume: 0.4 });
  }

  return {
    openSettings(from = 'main') { nav.from = from; renderSet(); show('settings'); },
    openPause() { nav.from = null; show('pause'); },
    closeAll() { nav.from = null; show(null); },
    back,
    screen: () => nav.screen,
    showReport(sum) {
      if (!sum) { rep.classList.add('hidden'); return; }
      const avg = sum.avgSat == null ? '—' : `${sum.avgSat} %`;
      const stars = '★★★★★'.slice(0, Math.round(sum.stars)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(sum.stars));
      rep.innerHTML = `<div class="paper-panel report"><h2>VAKTRAPPORT · NATT ${sum.night}</h2>
        <table>
          <tr><td>Inntekter i natt</td><td>${kr(sum.income)}</td></tr>
          <tr><td>Innsjekkinger</td><td>${sum.checkins}</td></tr>
          <tr><td>Utsjekkinger</td><td>${sum.checkouts}${sum.dayCheckouts ? ` (+${sum.dayCheckouts} til dagvakta)` : ''}</td></tr>
          <tr><td>Snitt tilfredshet (utsjekka)</td><td>${avg}</td></tr>
          <tr><td>Telefoner (ubesvart)</td><td>${sum.calls} (${sum.missed})</td></tr>
          <tr><td>Tapte inntekter</td><td>${kr(sum.lost)}</td></tr>
          <tr><td>Omdømme</td><td class="stars-t">${stars}</td></tr>
          <tr><td>Kassa totalt</td><td>${kr(sum.money)}</td></tr>
        </table>
        <p class="target ${sum.income >= sum.target ? 'ok' : 'no'}">Eierens mål for natta: ${kr(sum.target)} – ${sum.income >= sum.target ? 'nådd. Han nikker fornøyd fra Spania.' : 'ikke nådd. Han sender en sur lapp.'}</p>
        ${sum.problems.length ? `<h3>Dette gikk galt</h3><ul>${sum.problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '<p class="muted">Ingen store problemer i natt.</p>'}
        <div class="rep-btns"><button class="opt primary" data-r="nextNight">NESTE NATT</button><button class="opt" data-r="toMenu">LAGRE OG AVSLUTT</button></div></div>`;
      rep.classList.remove('hidden');
    },
  };
}
