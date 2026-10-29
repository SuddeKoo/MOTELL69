// Innstillinger lagres separat fra spillet, så de overlever «Nytt spill».
const KEY = 'motell69.settings';

export const DEFAULT_SETTINGS = {
  master: 0.8, amb: 0.6, sfx: 0.85, voice: 0.7, muted: false,
  textSpeed: 'normal', // slow | normal | fast | instant
  flicker: true, // flimrende lys og blinkende lamper
  nightLength: 17, // virkelige minutter per nattskift
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    return { ...DEFAULT_SETTINGS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* privat modus */ }
}

export const TEXT_SPEED = { slow: 28, normal: 55, fast: 110, instant: 0 }; // tegn per sekund
