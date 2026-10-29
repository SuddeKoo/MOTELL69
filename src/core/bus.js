// Liten hendelsesbuss: systemene sier fra om endringer, UI oppdaterer bare det som berøres.
export class Bus {
  constructor() { this.map = new Map(); }
  on(ev, fn) {
    if (!this.map.has(ev)) this.map.set(ev, new Set());
    this.map.get(ev).add(fn);
    return () => this.map.get(ev)?.delete(fn);
  }
  emit(ev, data) {
    const set = this.map.get(ev);
    if (!set) return;
    for (const fn of [...set]) {
      try { fn(data); } catch (e) { console.error(`[bus] ${ev}`, e); }
    }
  }
}
