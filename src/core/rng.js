// Seedbar tilfeldighetsgenerator (mulberry32) slik at saker kan gjenskapes under testing.

export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export class RNG {
  constructor(seed = Date.now()) {
    this.seed = typeof seed === 'string' ? hashString(seed) : (seed >>> 0);
    this.state = this.seed || 1;
  }
  next() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min, max) { return min + Math.floor(this.next() * (max - min + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  pickN(arr, n) { return this.shuffle(arr.slice()).slice(0, n); }
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  /** items: [{weight, ...}] eller [[value, weight]] */
  weighted(items, weightOf = (x) => x.weight) {
    const total = items.reduce((s, it) => s + Math.max(0, weightOf(it)), 0);
    if (total <= 0) return items[0];
    let r = this.next() * total;
    for (const it of items) {
      r -= Math.max(0, weightOf(it));
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  }
  fork(label) { return new RNG(hashString(`${this.seed}:${label}`)); }
}
