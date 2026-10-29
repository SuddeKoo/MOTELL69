// Små hjelpere for tid, tall og DOM.
export const NIGHT_MIN = 720; // 20:00 → 08:00

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Spillminutt siden 20:00 → «HH:MM» */
export function hhmm(min) {
  const m = Math.max(0, Math.round(min));
  const h = (20 + Math.floor(m / 60)) % 24;
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
/** Absolutt minutt på tvers av netter (dagtid hoppes over) */
export const absMin = (night, min) => (night - 1) * NIGHT_MIN + min;

export function kr(n) {
  return `${Math.round(n).toLocaleString('nb-NO').replace(/ /g, ' ')} kr`;
}

export function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

export function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export function surname(name) {
  const p = name.split(' ');
  return p[p.length - 1];
}
