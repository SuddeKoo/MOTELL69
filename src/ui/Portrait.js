// Prosedyretegnede, groteske tegneserieportretter i SVG.
// Én renderer for både karakteren i vinduet og passbildet, så stilen alltid er konsistent
// og passfoto-avvik (frisyre, nese, annen person) faktisk vises.
import { RNG, hashString } from '../core/rng.js';

const INK = '#1b120c';
const SW = 4.2; // strektykkelse

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  const h = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

// Catmull-Rom → kubiske Bézier-kurver for glatte, men litt ujevne former
function smoothPath(pts, closed = true) {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + (closed ? 'Z' : '');
}

function headPoints(shape, cx, cy, w, h, rng) {
  const cfg = {
    round: { n: 2.2 }, square: { n: 6 }, long: { n: 2.5 }, egg: { n: 2.3, chin: 0.2 }, pear: { n: 2.7, top: 0.16 }, wide: { n: 3.6, jaw: 0.08 },
  }[shape] || { n: 2.3 };
  const pts = [];
  const N = 28;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const c = Math.cos(t), s = Math.sin(t);
    let x = Math.sign(c) * Math.pow(Math.abs(c), 2 / cfg.n) * (w / 2);
    const y = Math.sign(s) * Math.pow(Math.abs(s), 2 / cfg.n) * (h / 2);
    if (cfg.chin && s > 0) x *= 1 - cfg.chin * s;
    if (cfg.top && s < 0) x *= 1 - cfg.top * -s;
    if (cfg.jaw && s > 0) x *= 1 + cfg.jaw * s;
    const j = 1 + (rng.next() - 0.5) * 0.035;
    pts.push([cx + x * j, cy + y * j]);
  }
  return pts;
}

// ─────────────── Kropp og klær ───────────────
const BUILD = { small: 230, thin: 250, normal: 285, broad: 335, huge: 375 };

function body(L, cx, top) {
  const W = BUILD[L.build] || 285;
  const c1 = L.outfitColor || '#555', c2 = L.outfitColor2 || shade(c1, -0.35), c3 = L.outfitColor3 || '#e2b23a';
  // Torsoen fortsetter godt under tegneflaten (bot > 520), så høye karakterer som løftes i vinduet
  // ikke ser ut til å sveve: kroppen forsvinner bak vinduskarmen i stedet for å slutte i lufta.
  const left = cx - W / 2, right = cx + W / 2, bot = 680;
  const sh = top + 46;
  const torso = `M${left},${bot} C${left + 4},${sh + 40} ${left + 20},${sh} ${cx - 50},${top + 18} L${cx + 50},${top + 18} C${right - 20},${sh} ${right - 4},${sh + 40} ${right},${bot} Z`;
  let s = `<path d="${torso}" fill="${c1}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`;
  // Skygge på høyre side
  s += `<path d="M${right - 60},${bot} C${right - 50},${sh + 60} ${right - 40},${sh + 20} ${right - 30},${sh + 8} C${right - 10},${sh + 30} ${right - 3},${sh + 60} ${right},${bot} Z" fill="#000" opacity="0.18"/>`;
  const o = L.outfit;
  if (o === 'kofte') {
    // Kofte: stå-krage og pyntebord i rødt og gult rundt halsen og over skuldrene
    s += `<path d="M${cx - 62},${top + 16} Q${cx},${top + 92} ${cx + 62},${top + 16}" fill="none" stroke="${c2}" stroke-width="16"/>`;
    s += `<path d="M${cx - 62},${top + 16} Q${cx},${top + 92} ${cx + 62},${top + 16}" fill="none" stroke="${c3}" stroke-width="5" transform="translate(0,9)"/>`;
    s += `<path d="M${left + 18},${sh + 30} Q${cx - 70},${sh - 6} ${cx - 56},${top + 22}" fill="none" stroke="${c2}" stroke-width="12"/>`;
    s += `<path d="M${right - 18},${sh + 30} Q${cx + 70},${sh - 6} ${cx + 56},${top + 22}" fill="none" stroke="${c2}" stroke-width="12"/>`;
    s += `<path d="M${left + 22},${sh + 42} Q${cx - 74},${sh + 6} ${cx - 58},${top + 36}" fill="none" stroke="${c3}" stroke-width="4"/>`;
    s += `<path d="M${right - 22},${sh + 42} Q${cx + 74},${sh + 6} ${cx + 58},${top + 36}" fill="none" stroke="${c3}" stroke-width="4"/>`;
    s += `<rect x="${cx - 46}" y="${top + 4}" width="92" height="22" rx="6" fill="${c1}" stroke="${INK}" stroke-width="${SW}"/>`;
    s += `<rect x="${cx - 46}" y="${top + 12}" width="92" height="7" fill="${c2}"/><rect x="${cx - 46}" y="${top + 19}" width="92" height="3" fill="${c3}"/>`;
    s += `<path d="M${cx},${top + 80} L${cx},${bot}" stroke="${c2}" stroke-width="10"/><path d="M${cx},${top + 80} L${cx},${bot}" stroke="${c3}" stroke-width="3"/>`;
  } else if (o === 'parka') {
    for (let y = sh + 30; y < bot; y += 34) s += `<path d="M${left + 12},${y} Q${cx},${y + 14} ${right - 12},${y}" fill="none" stroke="${c2}" stroke-width="3" opacity=".7"/>`;
    s += `<path d="M${cx - 80},${top + 30} C${cx - 70},${top - 6} ${cx + 70},${top - 6} ${cx + 80},${top + 30} C${cx + 40},${top + 60} ${cx - 40},${top + 60} ${cx - 80},${top + 30}Z" fill="${c2}" stroke="${INK}" stroke-width="${SW}"/>`;
    s += `<path d="M${cx},${top + 52} L${cx},${bot}" stroke="${INK}" stroke-width="3"/><path d="M${cx},${top + 52} L${cx},${bot}" stroke="#bbb" stroke-width="1.5" stroke-dasharray="3 4"/>`;
    s += `<g opacity=".9">${[...Array(7)].map((_, i) => `<circle cx="${cx - 70 + i * 23}" cy="${top + 26 + Math.sin(i) * 4}" r="13" fill="#d9ccb4" stroke="${INK}" stroke-width="2"/>`).join('')}</g>`;
  } else if (o === 'puffer_glam') {
    for (let y = sh + 58; y < bot; y += 30) s += `<path d="M${left + 20},${y} Q${cx},${y + 18} ${right - 20},${y}" fill="none" stroke="${shade(c1, -0.18)}" stroke-width="3"/>`;
    s += `<path d="M${cx},${top + 60} L${cx},${bot}" stroke="${INK}" stroke-width="3"/><path d="M${cx},${top + 60} L${cx},${bot}" stroke="#d8b23a" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    const fur = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16; const x = cx - 92 + t * 184; fur.push([x, top + 30 + Math.sin(t * Math.PI) * -18 + (i % 2 ? 7 : -5)]); }
    for (let i = 16; i >= 0; i--) { const t = i / 16; const x = cx - 74 + t * 148; fur.push([x, top + 52 + Math.sin(t * Math.PI) * 20 + (i % 2 ? 6 : -3)]); }
    s += `<path d="${smoothPath(fur)}" fill="${c2}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`;
    s += `<path d="M${cx - 70},${top + 34} q30,10 60,2 M${cx + 10},${top + 36} q30,4 58,-6" stroke="${shade(c2, 0.3)}" stroke-width="3" fill="none"/>`;
  } else if (o === 'sweater_black') {
    s += `<path d="M${cx - 52},${top + 18} Q${cx},${top + 50} ${cx + 52},${top + 18}" fill="none" stroke="${c2}" stroke-width="14"/>`;
    for (let x = cx - 50; x <= cx + 50; x += 9) s += `<line x1="${x}" y1="${top + 14}" x2="${x}" y2="${top + 30}" stroke="#333" stroke-width="2"/>`;
    s += `<path d="M${left + 40},${sh + 70} Q${left + 70},${sh + 20} ${cx - 60},${sh + 14}" fill="none" stroke="#3a3a3f" stroke-width="3"/><path d="M${right - 40},${sh + 70} Q${right - 70},${sh + 20} ${cx + 60},${sh + 14}" fill="none" stroke="#3a3a3f" stroke-width="3"/>`;
  } else if (o === 'shirt_tie' || o === 'suit') {
    if (o === 'suit') {
      s += `<path d="M${cx - 60},${top + 20} L${cx - 14},${top + 130} L${cx - 26},${bot} M${cx + 60},${top + 20} L${cx + 14},${top + 130} L${cx + 26},${bot}" fill="none" stroke="${INK}" stroke-width="3"/>`;
      s += `<path d="M${cx - 50},${top + 20} L${cx},${top + 140} L${cx + 50},${top + 20}Z" fill="#efeadf" stroke="${INK}" stroke-width="3"/>`;
    } else {
      s += `<path d="M${cx - 56},${top + 18} L${cx},${top + 70} L${cx + 56},${top + 18}" fill="#f2efe6" stroke="${INK}" stroke-width="3"/>`;
      for (let y = top + 90; y < bot; y += 34) s += `<circle cx="${cx + 3}" cy="${y}" r="3.5" fill="#bbb" stroke="${INK}" stroke-width="1.5"/>`;
      s += `<ellipse cx="${left + 70}" cy="${sh + 60}" rx="16" ry="24" fill="#c9b9a0" opacity=".55"/>`; // svetteflekk
    }
    s += `<path d="M${cx - 30},${top + 18} L${cx - 6},${top + 48} L${cx - 34},${top + 44}Z M${cx + 30},${top + 18} L${cx + 6},${top + 48} L${cx + 34},${top + 44}Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M${cx - 9},${top + 46} L${cx + 9},${top + 46} L${cx + 7},${top + 58} L${cx + 14},${top + 150} L${cx},${top + 168} L${cx - 14},${top + 150} L${cx - 7},${top + 58}Z" fill="${c2}" stroke="${INK}" stroke-width="3" stroke-linejoin="round" transform="rotate(${o === 'shirt_tie' ? 6 : 0} ${cx} ${top + 50})"/>`;
  } else if (o === 'hoodie') {
    s += `<path d="M${cx - 92},${top + 40} C${cx - 100},${top - 20} ${cx + 100},${top - 20} ${cx + 92},${top + 40} C${cx + 50},${top + 70} ${cx - 50},${top + 70} ${cx - 92},${top + 40}Z" fill="${c2}" stroke="${INK}" stroke-width="${SW}"/>`;
    s += `<path d="M${cx - 18},${top + 56} q-4,40 -8,70 M${cx + 18},${top + 56} q4,40 8,70" fill="none" stroke="#eee" stroke-width="3"/><circle cx="${cx - 26}" cy="${top + 128}" r="4" fill="#eee" stroke="${INK}" stroke-width="1.5"/><circle cx="${cx + 26}" cy="${top + 128}" r="4" fill="#eee" stroke="${INK}" stroke-width="1.5"/>`;
    s += `<path d="M${cx - 80},${bot} L${cx - 70},${top + 190} L${cx + 70},${top + 190} L${cx + 80},${bot}" fill="none" stroke="${c2}" stroke-width="3"/>`;
  } else if (o === 'fleece' || o === 'anorak' || o === 'raincoat' || o === 'tracksuit' || o === 'hivis') {
    s += `<path d="M${cx - 58},${top + 6} L${cx - 54},${top + 46} L${cx},${top + 66} L${cx + 54},${top + 46} L${cx + 58},${top + 6}" fill="${c2}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`;
    s += `<path d="M${cx},${top + 66} L${cx},${bot}" stroke="${INK}" stroke-width="3"/>`;
    if (o === 'tracksuit') s += `<path d="M${left + 26},${bot} C${left + 28},${sh + 50} ${left + 40},${sh + 14} ${cx - 70},${top + 26}" fill="none" stroke="${c2}" stroke-width="14"/><path d="M${right - 26},${bot} C${right - 28},${sh + 50} ${right - 40},${sh + 14} ${cx + 70},${top + 26}" fill="none" stroke="${c2}" stroke-width="14"/><path d="M${left + 26},${bot} C${left + 28},${sh + 50} ${left + 40},${sh + 14} ${cx - 70},${top + 26}" fill="none" stroke="#fff" stroke-width="3"/><path d="M${right - 26},${bot} C${right - 28},${sh + 50} ${right - 40},${sh + 14} ${cx + 70},${top + 26}" fill="none" stroke="#fff" stroke-width="3"/>`;
    if (o === 'raincoat') s += `<path d="M${left + 40},${sh + 30} q20,-10 40,0 M${right - 40},${sh + 30} q-20,-10 -40,0" stroke="#fff" stroke-width="4" opacity=".5" fill="none"/>`;
    if (o === 'hivis') s += `<rect x="${left + 10}" y="${sh + 90}" width="${W - 20}" height="16" fill="#d9d9d9" stroke="${INK}" stroke-width="2"/><rect x="${left + 10}" y="${sh + 130}" width="${W - 20}" height="16" fill="#d9d9d9" stroke="${INK}" stroke-width="2"/>`;
    if (o === 'anorak') s += `<path d="M${cx - 60},${sh + 120} L${cx + 60},${sh + 120} L${cx + 50},${bot - 10} L${cx - 50},${bot - 10}Z" fill="${c2}" stroke="${INK}" stroke-width="3" opacity=".8"/>`;
    if (o === 'fleece') for (let i = 0; i < 40; i++) { const x = left + 30 + ((i * 53) % (W - 60)); const y = sh + 30 + ((i * 37) % 120); s += `<circle cx="${x}" cy="${y}" r="2" fill="${shade(c1, 0.25)}"/>`; }
  } else if (o === 'lusekofte') {
    s += `<path d="M${cx - 120},${sh + 40} Q${cx},${sh + 96} ${cx + 120},${sh + 40} L${cx + 60},${top + 18} L${cx - 60},${top + 18}Z" fill="${c2}" stroke="${INK}" stroke-width="3"/>`;
    for (let i = 0; i < 9; i++) { const x = cx - 96 + i * 24; s += `<path d="M${x},${sh + 30} l7,-9 l7,9 l-7,9z" fill="${c1}"/>`; }
    for (let y = sh + 110; y < bot; y += 26) for (let x = left + 30; x < right - 20; x += 26) s += `<path d="M${x - 4},${y} h8 M${x},${y - 4} v8" stroke="${c2}" stroke-width="2.5"/>`;
  } else if (o === 'cardigan' || o === 'knit') {
    if (o === 'cardigan') {
      s += `<path d="M${cx - 50},${top + 18} L${cx},${top + 120} L${cx + 50},${top + 18}" fill="${c2}" stroke="${INK}" stroke-width="3"/>`;
      for (let y = top + 140; y < bot; y += 30) s += `<circle cx="${cx}" cy="${y}" r="5" fill="#fff6d0" stroke="${INK}" stroke-width="2"/>`;
    } else {
      s += `<path d="M${cx - 56},${top + 12} Q${cx},${top + 54} ${cx + 56},${top + 12}" fill="none" stroke="${c2}" stroke-width="18"/>`;
      for (let x = left + 40; x < right - 20; x += 34) s += `<path d="M${x},${sh + 30} q8,15 0,30 q-8,15 0,30 q8,15 0,30 q-8,15 0,30" fill="none" stroke="${shade(c1, -0.2)}" stroke-width="4"/>`;
    }
  } else if (o === 'flannel') {
    for (let x = left + 20; x < right; x += 30) s += `<line x1="${x}" y1="${sh}" x2="${x}" y2="${bot}" stroke="${c2}" stroke-width="7" opacity=".55"/>`;
    for (let y = sh + 10; y < bot; y += 30) s += `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="${c2}" stroke-width="7" opacity=".45"/>`;
    s += `<path d="M${cx - 50},${top + 18} L${cx - 10},${top + 60} L${cx},${top + 50} L${cx + 10},${top + 60} L${cx + 50},${top + 18}" fill="${c1}" stroke="${INK}" stroke-width="3"/>`;
  } else if (o === 'coat_fur' || o === 'cloak') {
    if (o === 'cloak') s += `<path d="M${cx - 80},${top + 40} C${cx - 90},${top - 30} ${cx + 90},${top - 30} ${cx + 80},${top + 40} L${cx + 40},${top + 60} L${cx - 40},${top + 60}Z" fill="${c2}" stroke="${INK}" stroke-width="${SW}"/>`;
    else s += `<g>${[...Array(9)].map((_, i) => `<circle cx="${cx - 84 + i * 21}" cy="${top + 24 + Math.abs(i - 4) * -3}" r="14" fill="${c2}" stroke="${INK}" stroke-width="2.5"/>`).join('')}</g>`;
    s += `<path d="M${cx},${top + 60} L${cx},${bot}" stroke="${INK}" stroke-width="3"/>`;
  }
  return s;
}

// ─────────────── Hår ───────────────
function hairBack(L, cx, cy, w, h, hairCol) {
  const s = L.hair;
  const top = cy - h / 2;
  const st = `fill="${hairCol}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"`;
  if (s === 'long' || s === 'long_wavy' || s === 'bangs_long' || s === 'long_messy') {
    const wave = s === 'long_wavy' ? 14 : 4;
    return `<path d="M${cx - w * 0.56},${cy - h * 0.1} C${cx - w * 0.66},${cy + h * 0.4} ${cx - w * 0.62 - wave},${cy + h * 0.7} ${cx - w * 0.5},${cy + h * 0.95} L${cx + w * 0.5},${cy + h * 0.95} C${cx + w * 0.62 + wave},${cy + h * 0.7} ${cx + w * 0.66},${cy + h * 0.4} ${cx + w * 0.56},${cy - h * 0.1} C${cx + w * 0.5},${top - 10} ${cx - w * 0.5},${top - 10} ${cx - w * 0.56},${cy - h * 0.1}Z" ${st}/>`;
  }
  if (s === 'glam_waves') {
    const pts = [];
    // venstre side ned, bølger, rundt bunnen, opp høyre side
    const side = (dir) => {
      const out = [];
      for (let i = 0; i <= 6; i++) {
        const t = i / 6;
        const x = cx + dir * (w * (0.6 + 0.14 * Math.sin(t * Math.PI)) + (i % 2 ? 10 : -4));
        out.push([x, cy - h * 0.25 + t * h * 1.02]);
      }
      return out;
    };
    const left = side(-1), right = side(1).reverse();
    pts.push([cx - w * 0.4, top + h * 0.02], ...left, [cx - w * 0.2, cy + h * 0.8], [cx + w * 0.2, cy + h * 0.8], ...right, [cx + w * 0.4, top + h * 0.02], [cx, top - h * 0.12]);
    return `<path d="${smoothPath(pts)}" ${st}/>` + [-1, 1].map((d) => `<path d="M${cx + d * w * 0.52},${cy} q${d * 14},${h * 0.22} ${d * 2},${h * 0.45} q${-d * 12},${h * 0.15} ${d * 6},${h * 0.28}" stroke="${shade(hairCol, 0.35)}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`).join('');
  }
  if (s === 'bob') return `<path d="M${cx - w * 0.6},${cy - h * 0.05} C${cx - w * 0.66},${cy + h * 0.3} ${cx - w * 0.6},${cy + h * 0.42} ${cx - w * 0.45},${cy + h * 0.44} L${cx + w * 0.45},${cy + h * 0.44} C${cx + w * 0.6},${cy + h * 0.42} ${cx + w * 0.66},${cy + h * 0.3} ${cx + w * 0.6},${cy - h * 0.05} C${cx + w * 0.55},${top - 16} ${cx - w * 0.55},${top - 16} ${cx - w * 0.6},${cy - h * 0.05}Z" ${st}/>`;
  if (s === 'pigtails') return `<path d="M${cx - w * 0.5},${cy - h * 0.1} c-40,10 -60,60 -50,110 c20,-10 40,-40 46,-80Z M${cx + w * 0.5},${cy - h * 0.1} c40,10 60,60 50,110 c-20,-10 -40,-40 -46,-80Z" ${st}/>`;
  if (s === 'ponytail') return `<path d="M${cx + w * 0.42},${top + h * 0.2} c50,-10 70,60 40,130 c-6,-40 -20,-70 -44,-90Z" ${st}/>`;
  return '';
}

/**
 * Ytterkant for hår som skal dekke skallen: hodekonturen over yCut (venstre → topp → høyre), skjøvet `pad` px
 * utover, med `lift` px ekstra volum øverst. Starter i [x0, y0] og slutter i [x1, y1]. Gir C-segmenter uten M.
 */
function crownEdge(headPts, cx, cy, yCut, [x0, y0], [x1, y1], pad = 6, lift = 5) {
  const n = headPts.length;
  const arc = [];
  for (let i = n / 2; i <= n; i++) arc.push(headPts[i % n]);
  const pts = [[x0, y0], ...arc.filter((p) => p[1] < yCut - 4).map(([x, y]) => {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1;
    const out = pad + lift * Math.max(0, -dy / d) ** 2;
    return [x + (dx / d) * out, y + (dy / d) * out];
  }), [x1, y1]];
  let seg = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    seg += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return seg;
}

function hairFront(L, cx, cy, w, h, hairCol, rng, headPts) {
  const s = L.hair;
  const top = cy - h / 2;
  const st = `fill="${hairCol}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"`;
  const sheen = `stroke="${shade(hairCol, 0.35)}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"`;
  const L0 = cx - w / 2, R0 = cx + w / 2;
  // Hårkappe fra (L0 - dx, yL) over hele skallen til (R0 + dx, yR); resten av stien (hårfestet) legges til av hver frisyre
  const cap = (yL, yR = yL, dx = 6, pad = 6, lift = 5) => `M${L0 - dx},${yL}${crownEdge(headPts, cx, cy, Math.max(yL, yR), [L0 - dx, yL], [R0 + dx, yR], pad, lift)}`;
  switch (s) {
    case 'flat_top': // fullfører det firkantede hodet
      return `<path d="M${L0 - 6},${top + h * 0.22} L${L0 - 4},${top - h * 0.14} L${R0 + 4},${top - h * 0.14} L${R0 + 6},${top + h * 0.22} L${R0 - 10},${top + h * 0.12} L${L0 + 10},${top + h * 0.12}Z" ${st}/>` +
        `<path d="M${L0 + 10},${top - h * 0.1} h${w - 20}" ${sheen}/>` + [...Array(10)].map((_, i) => `<line x1="${L0 + 6 + i * (w / 10)}" y1="${top - h * 0.13}" x2="${L0 + 6 + i * (w / 10)}" y2="${top - h * 0.04}" stroke="${shade(hairCol, -0.3)}" stroke-width="2"/>`).join('');
    case 'slick_fluffy': { // Vebjørn: voldsomt volum, sleik bakover
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const t = Math.PI + (i / 16) * Math.PI;
        const r = (w * 0.78) * (1 + 0.1 * Math.sin(i * 2.7));
        pts.push([cx + Math.cos(t) * r * 0.95, top + h * 0.12 + Math.sin(t) * r * 0.92]);
      }
      pts.push([R0 + 4, top + h * 0.3], [R0 - 14, top + h * 0.16], [cx, top + h * 0.06], [L0 + 14, top + h * 0.16], [L0 - 4, top + h * 0.3]);
      return `<path d="${smoothPath(pts)}" ${st}/>` + [0, 1, 2, 3, 4].map((i) => `<path d="M${L0 + 10 + i * w * 0.2},${top + h * 0.1} q${w * 0.1},-${h * 0.35} ${w * 0.3},-${h * 0.45}" ${sheen}/>`).join('');
    }
    case 'side_part':
      return `<path d="${cap(top + h * 0.34, top + h * 0.3, 4, 5, 4)} L${R0 - 8},${top + h * 0.16} C${cx + 20},${top + h * 0.04} ${cx - 40},${top + h * 0.2} ${L0 + 6},${top + h * 0.3}Z" ${st}/>` +
        `<path d="M${cx - w * 0.22},${top + 4} q-10,${h * 0.12} -${w * 0.2},${h * 0.22}" stroke="${INK}" stroke-width="3" fill="none"/><path d="M${cx},${top + 6} q${w * 0.2},0 ${w * 0.4},${h * 0.1}" ${sheen}/>`;
    case 'middle_part': // tydelig midtskill med to gardiner
      return `<path d="M${L0 - 8},${top + h * 0.42} C${L0 - 14},${top - 14} ${cx - 6},${top - 22} ${cx},${top + 2} C${cx + 6},${top - 22} ${R0 + 14},${top - 14} ${R0 + 8},${top + h * 0.42} C${R0 - 6},${top + h * 0.2} ${cx + 24},${top + h * 0.2} ${cx + 4},${top + h * 0.12} L${cx - 4},${top + h * 0.12} C${cx - 24},${top + h * 0.2} ${L0 + 6},${top + h * 0.2} ${L0 - 8},${top + h * 0.42}Z" ${st}/>` +
        `<path d="M${cx},${top + 2} L${cx},${top + h * 0.12}" stroke="${INK}" stroke-width="3"/><path d="M${cx - 12},${top + 4} q-${w * 0.22},2 -${w * 0.36},${h * 0.22}" ${sheen}/><path d="M${cx + 12},${top + 4} q${w * 0.22},2 ${w * 0.36},${h * 0.22}" ${sheen}/>`;
    case 'thin_top':
      return `<path d="M${L0 - 4},${cy - h * 0.02} C${L0 - 8},${top + h * 0.2} ${L0 + 10},${top + h * 0.12} ${L0 + 16},${top + h * 0.2}Z M${R0 + 4},${cy - h * 0.02} C${R0 + 8},${top + h * 0.2} ${R0 - 10},${top + h * 0.12} ${R0 - 16},${top + h * 0.2}Z" ${st}/>` +
        [...Array(5)].map((_, i) => `<path d="M${cx - 30 + i * 15},${top + 8} q${rng.int(-8, 8)},-${rng.int(8, 18)} ${rng.int(-6, 10)},-${rng.int(14, 24)}" stroke="${hairCol}" stroke-width="2.5" fill="none"/>`).join('') +
        `<ellipse cx="${cx - w * 0.12}" cy="${top + h * 0.12}" rx="${w * 0.16}" ry="${h * 0.05}" fill="#fff" opacity=".35"/>`;
    case 'fluffy': case 'curly': case 'short_curly':
      // Oppdatering 1.1: én sammenhengende hårsky i stedet for rader med løse runde klumper
      return cloudHair(s, cx, top, w, h, hairCol, rng, st);
    case 'buzz':
      return `<path d="${cap(top + h * 0.3, top + h * 0.3, -2, 1, 0)} C${R0 - 14},${top + h * 0.16} ${L0 + 14},${top + h * 0.16} ${L0 + 2},${top + h * 0.3}Z" fill="${hairCol}" stroke="${INK}" stroke-width="3" opacity=".92"/>` +
        [...Array(30)].map(() => `<circle cx="${cx + rng.int(-w * 0.4, w * 0.4)}" cy="${top + rng.int(8, h * 0.18)}" r="1.4" fill="${shade(hairCol, 0.3)}"/>`).join('');
    case 'long': case 'long_wavy': case 'long_messy': case 'bangs_long': case 'bob':
      if (s === 'bangs_long') return `<path d="${cap(top + h * 0.4, top + h * 0.4, 6, 6, 6)} L${R0 - 8},${top + h * 0.3} L${R0 - 16},${top + h * 0.26} L${cx + 20},${top + h * 0.3} L${cx},${top + h * 0.25} L${cx - 22},${top + h * 0.3} L${L0 + 16},${top + h * 0.26} L${L0 + 8},${top + h * 0.3}Z" ${st}/>`;
      return `<path d="${cap(top + h * 0.45, top + h * 0.45, 6, 6, 6)} C${R0 - 4},${top + h * 0.2} ${cx + w * 0.3},${top + h * 0.12} ${cx - w * 0.05},${top + h * 0.16} C${cx - w * 0.3},${top + h * 0.14} ${L0 + 6},${top + h * 0.22} ${L0 - 6},${top + h * 0.45}Z" ${st}/>` +
        (s === 'long_messy' ? [...Array(6)].map((_, i) => `<path d="M${L0 + i * w * 0.18},${top + 6} l${rng.int(-10, 10)},-${rng.int(10, 22)}" stroke="${INK}" stroke-width="3"/>`).join('') : `<path d="M${cx - w * 0.2},${top + 10} q${w * 0.2},-6 ${w * 0.4},${h * 0.06}" ${sheen}/>`);
    case 'pigtails':
      return `<path d="${cap(top + h * 0.38, top + h * 0.38, 4, 5, 5)} L${R0 - 10},${top + h * 0.22} Q${cx},${top + h * 0.3} ${L0 + 10},${top + h * 0.22}Z" ${st}/>` +
        `<circle cx="${L0 - 6}" cy="${top + h * 0.38}" r="8" fill="#e84a7a" stroke="${INK}" stroke-width="2.5"/><circle cx="${R0 + 6}" cy="${top + h * 0.38}" r="8" fill="#e84a7a" stroke="${INK}" stroke-width="2.5"/>`;
    case 'ponytail':
      return `<path d="${cap(top + h * 0.34, top + h * 0.34, 2, 4, 3)} C${R0 - 10},${top + h * 0.12} ${L0 + 10},${top + h * 0.12} ${L0 - 2},${top + h * 0.34}Z" ${st}/><path d="M${L0 + 10},${top + h * 0.1} q${w * 0.3},-${h * 0.1} ${w * 0.7},0" ${sheen}/>`;
    case 'messy':
      return `<path d="M${L0 - 4},${top + h * 0.32} ${[...Array(9)].map((_, i) => `L${L0 + (i + 0.5) * (w / 9)},${top - rng.int(6, 24)} L${L0 + (i + 1) * (w / 9)},${top + rng.int(4, 12)}`).join(' ')} L${R0 + 4},${top + h * 0.32} C${R0 - 14},${top + h * 0.16} ${L0 + 14},${top + h * 0.16} ${L0 - 4},${top + h * 0.32}Z" ${st}/>`;
    case 'mohawk':
      return `<path d="M${cx - 18},${top + h * 0.2} ${[...Array(6)].map((_, i) => `L${cx - 22 + i * 3},${top - 16 - i * 8} L${cx - 10 + i * 4},${top - 2 - i * 4}`).join(' ')} L${cx + 18},${top + h * 0.2}Z" ${st}/>` +
        [...Array(24)].map(() => `<circle cx="${cx + rng.int(-w * 0.42, w * 0.42)}" cy="${top + rng.int(10, h * 0.2)}" r="1.3" fill="${shade(hairCol, -0.3)}" opacity=".7"/>`).join('');
    case 'bald_ring': case 'comb_over': case 'short_sides': {
      let out = `<path d="M${L0 - 4},${cy + h * 0.02} C${L0 - 6},${top + h * 0.3} ${L0 + 4},${top + h * 0.22} ${L0 + 14},${top + h * 0.26} L${L0 + 10},${cy}Z M${R0 + 4},${cy + h * 0.02} C${R0 + 6},${top + h * 0.3} ${R0 - 4},${top + h * 0.22} ${R0 - 14},${top + h * 0.26} L${R0 - 10},${cy}Z" ${st}/>`;
      if (s === 'comb_over') out += [...Array(5)].map((_, i) => `<path d="M${L0 + 10},${top + h * 0.24 - i * 5} Q${cx},${top - 4 + i * 6} ${R0 - 12},${top + h * 0.18 + i * 3}" stroke="${hairCol}" stroke-width="3" fill="none"/>`).join('');
      if (s === 'bald_ring') out += `<ellipse cx="${cx - w * 0.14}" cy="${top + h * 0.12}" rx="${w * 0.18}" ry="${h * 0.05}" fill="#fff" opacity=".4"/>`;
      return out;
    }
    case 'glam_waves': {
      const light = shade(hairCol, 0.38), dark = shade(hairCol, -0.3);
      return `<path d="M${L0 - 10},${top + h * 0.5} C${L0 - 20},${top - h * 0.12} ${R0 + 18},${top - h * 0.16} ${R0 + 10},${top + h * 0.46} C${R0 - 2},${top + h * 0.22} ${cx + w * 0.22},${top + h * 0.12} ${cx + w * 0.02},${top + h * 0.14} C${cx - w * 0.16},${top + h * 0.3} ${L0 + 14},${top + h * 0.36} ${L0 + 2},${top + h * 0.56} C${L0 - 2},${top + h * 0.52} ${L0 - 8},${top + h * 0.5} ${L0 - 10},${top + h * 0.5}Z" ${st}/>` +
        `<path d="M${cx + w * 0.05},${top + 4} C${cx - w * 0.1},${top + h * 0.06} ${cx - w * 0.3},${top + h * 0.2} ${L0 + 12},${top + h * 0.44}" stroke="${light}" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".85"/>` +
        `<path d="M${cx + w * 0.12},${top + 6} C${cx + w * 0.3},${top + h * 0.02} ${R0 - 6},${top + h * 0.12} ${R0 + 2},${top + h * 0.34}" stroke="${light}" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".7"/>` +
        `<path d="M${cx - w * 0.02},${top + h * 0.13} q-${w * 0.12},${h * 0.1} -${w * 0.3},${h * 0.26}" stroke="${dark}" stroke-width="2.5" fill="none" opacity=".7"/>`;
    }
    case 'messy_bun':
      return `<circle cx="${cx + 6}" cy="${top - h * 0.08}" r="${w * 0.2}" ${st}/><path d="${cap(top + h * 0.34, top + h * 0.34, 2, 4, 3)} C${R0 - 12},${top + h * 0.14} ${L0 + 12},${top + h * 0.14} ${L0 - 2},${top + h * 0.34}Z" ${st}/><path d="M${L0 + 6},${top + h * 0.3} q-10,30 -4,60 M${R0 - 6},${top + h * 0.3} q12,26 4,56" stroke="${hairCol}" stroke-width="3" fill="none"/>`;
    case 'space_buns':
      return `<circle cx="${L0 + w * 0.12}" cy="${top - h * 0.02}" r="${w * 0.17}" ${st}/><circle cx="${R0 - w * 0.12}" cy="${top - h * 0.02}" r="${w * 0.17}" ${st}/><path d="${cap(top + h * 0.32, top + h * 0.32, 2, 4, 3)} C${R0 - 12},${top + h * 0.14} ${L0 + 12},${top + h * 0.14} ${L0 - 2},${top + h * 0.32}Z" ${st}/>`;
    default:
      return '';
  }
}

/** Krøllete/fluffy hår som én sammenhengende silhuett: bølget ytterkant, naturlig hårlinje og krøll-tekstur. */
function cloudHair(kind, cx, top, w, h, hairCol, rng, st) {
  const cfg = {
    fluffy: { vol: 1.2, bumps: 9, amp: 0.075, line: 0.3, tufts: 5, curls: 9 },
    curly: { vol: 1.08, bumps: 12, amp: 0.05, line: 0.27, tufts: 6, curls: 12 },
    short_curly: { vol: 0.99, bumps: 15, amp: 0.028, line: 0.22, tufts: 7, curls: 16 },
  }[kind];
  const baseY = top + h * 0.4;
  const rx = w * 0.56 * cfg.vol, ry = h * 0.5 * cfg.vol;
  // Ytterkanten: punkter langs en halv ellipse, med mykt bølgede «skjell» mellom dem
  const pts = [];
  for (let i = 0; i <= cfg.bumps; i++) {
    const t = Math.PI + (i / cfg.bumps) * Math.PI;
    pts.push([cx + Math.cos(t) * rx, baseY + Math.sin(t) * ry]);
  }
  let d = `M${(cx - w * 0.5 - 4).toFixed(1)},${(baseY + h * 0.06).toFixed(1)} L${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const nx = mx - cx, ny = my - baseY;
    const len = Math.hypot(nx, ny) || 1;
    const a = w * cfg.amp * (0.8 + rng.next() * 0.4);
    d += ` Q${(mx + (nx / len) * a).toFixed(1)},${(my + (ny / len) * a).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  // Ned til høyre tinning, og hårlinja tilbake over panna med små naturlige dotter
  const hl = top + h * cfg.line;
  d += ` L${(cx + w * 0.5 + 4).toFixed(1)},${(baseY + h * 0.06).toFixed(1)} Q${(cx + w * 0.46).toFixed(1)},${(hl - h * 0.02).toFixed(1)} ${(cx + w * 0.38).toFixed(1)},${hl.toFixed(1)}`;
  for (let i = 1; i <= cfg.tufts; i++) {
    const x1 = cx + w * 0.38 - (i / cfg.tufts) * w * 0.76;
    const xm = x1 + (w * 0.76) / cfg.tufts / 2;
    const dip = h * (0.03 + rng.next() * 0.035);
    d += ` Q${xm.toFixed(1)},${(hl + dip).toFixed(1)} ${x1.toFixed(1)},${(hl - h * 0.005 * rng.int(0, 3)).toFixed(1)}`;
  }
  d += ` Q${(cx - w * 0.46).toFixed(1)},${(hl - h * 0.02).toFixed(1)} ${(cx - w * 0.5 - 4).toFixed(1)},${(baseY + h * 0.06).toFixed(1)}Z`;
  let out = `<path d="${d}" ${st}/>`;
  // Krøll-tekstur inni silhuetten (tegnede strøk, ikke nye klumper)
  const dark = shade(hairCol, -0.35), light = shade(hairCol, 0.3);
  for (let i = 0; i < cfg.curls; i++) {
    const t = Math.PI * (1.08 + rng.next() * 0.84);
    const r = 0.35 + rng.next() * 0.5;
    const x = cx + Math.cos(t) * rx * r, y = baseY + Math.sin(t) * ry * r - h * 0.04;
    const s2 = w * (kind === 'short_curly' ? 0.035 : 0.055);
    out += `<path d="M${(x - s2).toFixed(1)},${y.toFixed(1)} q${s2.toFixed(1)},-${(s2 * 1.3).toFixed(1)} ${(s2 * 2).toFixed(1)},0" stroke="${i % 3 ? dark : light}" stroke-width="${kind === 'short_curly' ? 2 : 2.6}" fill="none" stroke-linecap="round"/>`;
  }
  return out;
}

function hat(L, cx, cy, w, h) {
  const top = cy - h / 2;
  const c = L.hatColor || '#444';
  if (!L.hat) return '';
  if (L.hat === 'sami') {
    // Firevindslue-inspirert: blå med rødt bånd og gul pynt. Tegnet respektfullt, uten karikatur.
    const by = top + h * 0.2;
    let s = `<path d="M${cx - w * 0.56},${by} C${cx - w * 0.62},${top - h * 0.2} ${cx - w * 0.3},${top - h * 0.42} ${cx - w * 0.22},${top - h * 0.3} C${cx - w * 0.12},${top - h * 0.5} ${cx + w * 0.12},${top - h * 0.5} ${cx + w * 0.22},${top - h * 0.3} C${cx + w * 0.3},${top - h * 0.42} ${cx + w * 0.62},${top - h * 0.2} ${cx + w * 0.56},${by}Z" fill="${c}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`;
    s += `<path d="M${cx - w * 0.2},${top - h * 0.28} q${w * 0.2},${h * 0.1} ${w * 0.4},0" stroke="${shade(c, -0.3)}" stroke-width="3" fill="none"/>`;
    s += `<rect x="${cx - w * 0.58}" y="${by - 26}" width="${w * 1.16}" height="30" rx="8" fill="#b8322a" stroke="${INK}" stroke-width="${SW}"/>`;
    s += `<rect x="${cx - w * 0.56}" y="${by - 18}" width="${w * 1.12}" height="5" fill="#e2b23a"/><rect x="${cx - w * 0.56}" y="${by - 9}" width="${w * 1.12}" height="4" fill="#2f7d3a"/>`;
    for (let i = 0; i < 8; i++) s += `<rect x="${cx - w * 0.5 + i * w * 0.14}" y="${by - 24}" width="${w * 0.06}" height="4" fill="#e2b23a"/>`;
    return s;
  }
  if (L.hat === 'gnome') {
    // Eskil: høy, spiss rød lue som knekker litt til siden – nordnorsk hagenisse, men et menneske
    const by = top + h * 0.24;
    return `<path d="M${cx - w * 0.6},${by} C${cx - w * 0.5},${top - h * 0.25} ${cx - w * 0.1},${top - h * 0.7} ${cx + w * 0.42},${top - h * 0.98} C${cx + w * 0.3},${top - h * 0.6} ${cx + w * 0.42},${top - h * 0.2} ${cx + w * 0.6},${by}Z" fill="${c}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>` +
      `<path d="M${cx - w * 0.15},${top - h * 0.3} q${w * 0.18},-${h * 0.05} ${w * 0.32},-${h * 0.42}" stroke="${shade(c, -0.3)}" stroke-width="3" fill="none"/>` +
      `<path d="M${cx + w * 0.05},${top - h * 0.1} q${w * 0.12},${h * 0.02} ${w * 0.22},-${h * 0.2}" stroke="${shade(c, 0.3)}" stroke-width="3" fill="none" opacity=".7"/>` +
      `<rect x="${cx - w * 0.62}" y="${by - 22}" width="${w * 1.24}" height="26" rx="10" fill="${shade(c, -0.2)}" stroke="${INK}" stroke-width="${SW}"/>`;
  }
  if (L.hat === 'beanie') return `<path d="M${cx - w * 0.56},${top + h * 0.24} C${cx - w * 0.6},${top - h * 0.3} ${cx + w * 0.6},${top - h * 0.3} ${cx + w * 0.56},${top + h * 0.24}Z" fill="${c}" stroke="${INK}" stroke-width="${SW}"/><rect x="${cx - w * 0.6}" y="${top + h * 0.1}" width="${w * 1.2}" height="${h * 0.16}" rx="10" fill="${shade(c, -0.15)}" stroke="${INK}" stroke-width="${SW}"/><circle cx="${cx}" cy="${top - h * 0.18}" r="${w * 0.12}" fill="#fff" stroke="${INK}" stroke-width="3"/>` + [...Array(8)].map((_, i) => `<line x1="${cx - w * 0.5 + i * w * 0.14}" y1="${top + h * 0.12}" x2="${cx - w * 0.5 + i * w * 0.14}" y2="${top + h * 0.24}" stroke="${shade(c, -0.35)}" stroke-width="2"/>`).join('');
  if (L.hat === 'fur') return `<path d="M${cx - w * 0.6},${top + h * 0.5} L${cx - w * 0.66},${top + h * 0.1} C${cx - w * 0.6},${top - h * 0.3} ${cx + w * 0.6},${top - h * 0.3} ${cx + w * 0.66},${top + h * 0.1} L${cx + w * 0.6},${top + h * 0.5} L${cx + w * 0.48},${top + h * 0.18} L${cx - w * 0.48},${top + h * 0.18}Z" fill="${c}" stroke="${INK}" stroke-width="${SW}"/><path d="M${cx - w * 0.6},${top + h * 0.14} q${w * 0.6},-${h * 0.14} ${w * 1.2},0" stroke="${shade(c, 0.3)}" stroke-width="10" fill="none"/>`;
  if (L.hat === 'foil') return `<path d="M${cx - w * 0.5},${top + h * 0.18} L${cx - w * 0.1},${top - h * 0.45} L${cx + w * 0.05},${top - h * 0.3} L${cx + w * 0.5},${top + h * 0.18}Z" fill="${c}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/><path d="M${cx - w * 0.3},${top} l${w * 0.15},-${h * 0.15} l${w * 0.1},${h * 0.12} M${cx},${top + h * 0.08} l${w * 0.2},-${h * 0.06}" stroke="#fff" stroke-width="2.5" fill="none"/>`;
  if (L.hat === 'santa') return `<path d="M${cx - w * 0.55},${top + h * 0.2} C${cx - w * 0.4},${top - h * 0.4} ${cx + w * 0.4},${top - h * 0.5} ${cx + w * 0.7},${top - h * 0.1} L${cx + w * 0.55},${top + h * 0.2}Z" fill="${c}" stroke="${INK}" stroke-width="${SW}"/><rect x="${cx - w * 0.6}" y="${top + h * 0.1}" width="${w * 1.2}" height="${h * 0.15}" rx="12" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="${cx + w * 0.72}" cy="${top - h * 0.08}" r="${w * 0.1}" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
  return '';
}

// ─────────────── Ansikt ───────────────
function eyes(L, cx, ey, dx, mood, anim, photo) {
  const type = L.eyes || 'normal';
  const cfg = {
    normal: [14, 12, 6], glam: [17, 15, 7.5], small: [8, 7, 4], big: [20, 19, 9], tired: [14, 10, 6], wide: [18, 18, 4.5], squint: [14, 5, 4.5],
    friendly: [14, 10, 6], mog: [13, 7, 6], wild: [17, 17, 5], sparkle: [19, 19, 9], sleepy: [14, 9, 6], side_eye: [15, 11, 6], stare: [17, 17, 3.5],
  }[type] || [14, 12, 6];
  let [rx, ry, pr] = cfg;
  if (mood === 'nervous') { ry *= 1.15; pr *= 0.8; }
  if (mood === 'angry') ry *= 0.75;
  const pupilOff = type === 'side_eye' ? 6 : 0;
  let s = '';
  const lidCls = photo ? '' : 'lid';
  for (const side of [-1, 1]) {
    const x = cx + side * dx;
    const rr = type === 'wild' && side === 1 ? rx * 0.8 : rx;
    s += `<ellipse cx="${x}" cy="${ey}" rx="${rr}" ry="${ry}" fill="#f7f1e3" stroke="${INK}" stroke-width="3.2"/>`;
    s += `<g class="pupil"><circle cx="${x + pupilOff}" cy="${ey + 1}" r="${pr}" fill="${INK}"/>${type !== 'stare' ? `<circle cx="${x + pupilOff - pr * 0.35}" cy="${ey - pr * 0.35}" r="${Math.max(1.2, pr * 0.32)}" fill="#fff"/>` : ''}${type === 'sparkle' ? `<circle cx="${x + pr * 0.4}" cy="${ey + pr * 0.4}" r="2" fill="#fff"/>` : ''}</g>`;
    // Tunge øyelokk for trøtte typer
    if (type === 'tired' || type === 'sleepy' || type === 'mog') {
      const lidY = ey - ry + (type === 'sleepy' ? ry * 1.0 : ry * 0.6);
      s += `<path d="M${x - rr - 1},${ey - 0.5} C${x - rr},${ey - ry - 2} ${x + rr},${ey - ry - 2} ${x + rr + 1},${ey - 0.5} L${x + rr},${lidY} Q${x},${lidY + 3} ${x - rr},${lidY}Z" fill="${L.skin}" stroke="${INK}" stroke-width="3"/>`;
    }
    if (type === 'glam') {
      s += `<path d="M${x - rr - 2},${ey - 2} Q${x},${ey - ry - 12} ${x + rr + 2},${ey - 2}" fill="${L.shadowColor || '#b26f93'}" opacity=".45"/>`;
      s += `<path d="M${x - side * (rr + 1)},${ey + 1} Q${x},${ey - ry - 3} ${x + side * (rr + 1)},${ey - 1} l${side * 9},-7" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
      for (const k of [-0.5, 0, 0.5]) s += `<path d="M${x + k * rr},${ey - ry * 0.95} l${k * 6 + side * 2},-8" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;
    }
    if (type === 'friendly') s += `<path d="M${x - rr},${ey + ry * 0.5} Q${x},${ey + ry * 0.1} ${x + rr},${ey + ry * 0.5} L${x + rr},${ey + ry + 2} L${x - rr},${ey + ry + 2}Z" fill="${L.skin}"/>`;
    // Blunke-lokk (animeres med CSS)
    if (lidCls) s += `<g class="${lidCls}" style="transform-origin:${x}px ${ey - ry}px"><ellipse cx="${x}" cy="${ey}" rx="${rr + 1.5}" ry="${ry + 1.5}" fill="${L.skin}"/><path d="M${x - rr},${ey + 1} Q${x},${ey + ry * 0.6} ${x + rr},${ey + 1}" stroke="${INK}" stroke-width="3" fill="none"/></g>`;
  }
  return s;
}

function glasses(L, cx, ey, dx) {
  if (!L.glasses) return '';
  const g = L.glasses;
  const w = g === 'thick' ? 26 : 22, h = g === 'thick' ? 22 : 18;
  const sw = g === 'thick' ? 6 : 3.5;
  const shape = (x) => (g === 'round' ? `<circle cx="${x}" cy="${ey}" r="${w * 0.85}" fill="#cde3ee" fill-opacity=".18" stroke="${INK}" stroke-width="${sw}"/>` : `<rect x="${x - w}" y="${ey - h}" width="${w * 2}" height="${h * 2}" rx="5" fill="#cde3ee" fill-opacity=".18" stroke="${INK}" stroke-width="${sw}"/>`);
  return `<g>${shape(cx - dx)}${shape(cx + dx)}<path d="M${cx - dx + w * 0.85},${ey - 3} Q${cx},${ey - 10} ${cx + dx - w * 0.85},${ey - 3}" stroke="${INK}" stroke-width="${sw}" fill="none"/><path d="M${cx - dx - w + 6},${ey - h + 6} l8,8" stroke="#fff" stroke-width="2.5" opacity=".7"/></g>`;
}

function brows(L, cx, by, dx, mood) {
  const type = L.brows || 'normal';
  const col = L.browColor || INK;
  const thick = { thick: 9, bushy: 11, thin: 3.5, normal: 6, worried: 6, happy: 6, raised: 6, arched: 5, angry: 8 }[type] || 6;
  let tilt = { worried: -8, happy: -4, raised: -6, angry: 9, arched: -3 }[type] || 0; // + = indre del ned (sint)
  let lift = type === 'raised' ? -8 : 0;
  if (mood === 'angry') tilt = 12;
  else if (mood === 'irritated') tilt = Math.max(tilt, 7);
  else if (mood === 'nervous') { tilt = -10; lift -= 4; }
  else if (mood === 'happy') lift -= 4;
  else if (mood === 'confused') tilt = 0;
  let s = '';
  for (const side of [-1, 1]) {
    const inner = cx + side * (dx - 14), outer = cx + side * (dx + 20);
    const yi = by + lift + tilt * 0.6 + (mood === 'confused' && side === 1 ? -8 : 0), yo = by + lift - tilt * 0.4;
    if (type === 'bushy') s += `<path d="M${inner},${yi} Q${(inner + outer) / 2},${Math.min(yi, yo) - 8} ${outer},${yo}" stroke="${col}" stroke-width="${thick}" stroke-linecap="round" fill="none"/><path d="M${inner},${yi - 4} l-4,-5 M${outer},${yo - 3} l6,-4" stroke="${col}" stroke-width="3"/>`;
    else s += `<path d="M${inner},${yi} Q${(inner + outer) / 2},${Math.min(yi, yo) - 6} ${outer},${yo}" stroke="${col}" stroke-width="${thick}" stroke-linecap="round" fill="none"/>`;
  }
  return s;
}

// Hvor langt hver nesetype rekker over og under ny, i enheter av størrelsen k
const NOSE_EXT = { potato: [34, 29], long: [38, 37], hook: [36, 29], button: [18, 21], pointy: [34, 23], wide: [28, 26], bulb: [34, 30] };
const NOSE_GAP = 6; // minste avstand fra nesetipp til munn (før strektykkelse)

function nose(type, size, cx, ny, skin) {
  const k = size || 1;
  const f = shade(skin, -0.08), d = shade(skin, -0.25);
  const st = `fill="${f}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"`;
  switch (type) {
    case 'potato': return `<path d="M${cx - 8 * k},${ny - 34 * k} C${cx - 12 * k},${ny - 10 * k} ${cx - 34 * k},${ny} ${cx - 26 * k},${ny + 18 * k} C${cx - 18 * k},${ny + 32 * k} ${cx + 18 * k},${ny + 32 * k} ${cx + 26 * k},${ny + 18 * k} C${cx + 34 * k},${ny} ${cx + 12 * k},${ny - 10 * k} ${cx + 8 * k},${ny - 34 * k}" ${st}/><ellipse cx="${cx - 10 * k}" cy="${ny + 18 * k}" rx="${5 * k}" ry="${3.5 * k}" fill="${INK}"/><ellipse cx="${cx + 10 * k}" cy="${ny + 18 * k}" rx="${5 * k}" ry="${3.5 * k}" fill="${INK}"/><circle cx="${cx - 9 * k}" cy="${ny + 2 * k}" r="${4 * k}" fill="#fff" opacity=".4"/>`;
    case 'long': return `<path d="M${cx - 6 * k},${ny - 38 * k} C${cx - 10 * k},${ny} ${cx - 22 * k},${ny + 26 * k} ${cx - 10 * k},${ny + 34 * k} C${cx - 4 * k},${ny + 38 * k} ${cx + 8 * k},${ny + 38 * k} ${cx + 14 * k},${ny + 30 * k} C${cx + 18 * k},${ny + 22 * k} ${cx + 6 * k},${ny} ${cx + 4 * k},${ny - 38 * k}" ${st}/><path d="M${cx - 8 * k},${ny + 30 * k} q3,-4 6,0" stroke="${INK}" stroke-width="3" fill="none"/>`;
    case 'hook': return `<path d="M${cx - 6 * k},${ny - 36 * k} C${cx + 4 * k},${ny - 20 * k} ${cx + 30 * k},${ny + 4 * k} ${cx + 20 * k},${ny + 24 * k} C${cx + 14 * k},${ny + 34 * k} ${cx - 2 * k},${ny + 26 * k} ${cx - 2 * k},${ny + 20 * k} C${cx - 14 * k},${ny + 30 * k} ${cx - 24 * k},${ny + 20 * k} ${cx - 16 * k},${ny + 8 * k}" ${st}/><ellipse cx="${cx - 8 * k}" cy="${ny + 18 * k}" rx="${4 * k}" ry="${3 * k}" fill="${INK}"/>`;
    case 'button': return `<path d="M${cx - 4 * k},${ny - 18 * k} C${cx - 6 * k},${ny - 2 * k} ${cx - 18 * k},${ny + 4 * k} ${cx - 14 * k},${ny + 14 * k} C${cx - 8 * k},${ny + 22 * k} ${cx + 8 * k},${ny + 22 * k} ${cx + 14 * k},${ny + 14 * k} C${cx + 18 * k},${ny + 4 * k} ${cx + 6 * k},${ny - 2 * k} ${cx + 4 * k},${ny - 18 * k}" ${st}/><circle cx="${cx - 5 * k}" cy="${ny + 13 * k}" r="${2.6 * k}" fill="${INK}"/><circle cx="${cx + 5 * k}" cy="${ny + 13 * k}" r="${2.6 * k}" fill="${INK}"/>`;
    case 'pointy': return `<path d="M${cx - 4 * k},${ny - 34 * k} L${cx + 26 * k},${ny + 16 * k} C${cx + 18 * k},${ny + 24 * k} ${cx - 2 * k},${ny + 24 * k} ${cx - 12 * k},${ny + 18 * k}" ${st}/><path d="M${cx - 2 * k},${ny + 16 * k} q4,-5 8,0" stroke="${INK}" stroke-width="3" fill="none"/>`;
    case 'wide': return `<path d="M${cx - 8 * k},${ny - 28 * k} C${cx - 10 * k},${ny - 4 * k} ${cx - 38 * k},${ny + 6 * k} ${cx - 34 * k},${ny + 18 * k} C${cx - 26 * k},${ny + 28 * k} ${cx + 26 * k},${ny + 28 * k} ${cx + 34 * k},${ny + 18 * k} C${cx + 38 * k},${ny + 6 * k} ${cx + 10 * k},${ny - 4 * k} ${cx + 8 * k},${ny - 28 * k}" ${st}/><ellipse cx="${cx - 14 * k}" cy="${ny + 16 * k}" rx="${7 * k}" ry="${4 * k}" fill="${INK}"/><ellipse cx="${cx + 14 * k}" cy="${ny + 16 * k}" rx="${7 * k}" ry="${4 * k}" fill="${INK}"/>`;
    case 'bulb': default: return `<path d="M${cx - 6 * k},${ny - 34 * k} L${cx - 10 * k},${ny - 6 * k}" stroke="${INK}" stroke-width="3.5" fill="none"/><circle cx="${cx}" cy="${ny + 8 * k}" r="${22 * k}" ${st}/><path d="M${cx - 14 * k},${ny + 18 * k} q6,6 12,0 M${cx + 2 * k},${ny + 18 * k} q6,6 12,0" stroke="${INK}" stroke-width="3" fill="none"/><circle cx="${cx - 8 * k}" cy="${ny} " r="${6 * k}" fill="#fff" opacity=".35"/><circle cx="${cx + 6 * k}" cy="${ny + 14 * k}" r="${10 * k}" fill="${d}" opacity=".35"/>`;
  }
}

function mouthClosed(L, cx, my, mood, wide) {
  const t = L.teeth || 'smile';
  const lip = L.extras?.includes('lipstick') ? '#a3263a' : INK;
  const W = wide;
  if (mood === 'happy' || t === 'grin' || t === 'crooked_grin' || (mood === 'normal' && (t === 'smile' || t === 'cat'))) {
    if (t === 'cat') return `<path d="M${cx - 18},${my} q9,10 18,0 q9,10 18,0" stroke="${lip}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    const teethRow = t === 'grin' || t === 'crooked_grin' || mood === 'happy';
    return `<path d="M${cx - W},${my - 6} Q${cx},${my + 30} ${cx + W},${my - 6} Q${cx},${my + 6} ${cx - W},${my - 6}Z" fill="${teethRow ? '#f5efdc' : '#5a1d1d'}" stroke="${lip}" stroke-width="4" stroke-linejoin="round"/>` +
      (teethRow ? [...Array(6)].map((_, i) => `<line x1="${cx - W * 0.7 + i * W * 0.28}" y1="${my}" x2="${cx - W * 0.7 + i * W * 0.28 + (t === 'crooked_grin' && i % 2 ? 3 : 0)}" y2="${my + 10}" stroke="${INK}" stroke-width="2"/>`).join('') : '');
  }
  if (mood === 'angry' || t === 'clenched') {
    return `<rect x="${cx - W * 0.8}" y="${my - 9}" width="${W * 1.6}" height="18" rx="6" fill="#f2ecd8" stroke="${lip}" stroke-width="4"/><line x1="${cx - W * 0.8}" y1="${my}" x2="${cx + W * 0.8}" y2="${my}" stroke="${INK}" stroke-width="2"/>` +
      [...Array(5)].map((_, i) => `<line x1="${cx - W * 0.55 + i * W * 0.28}" y1="${my - 9}" x2="${cx - W * 0.55 + i * W * 0.28}" y2="${my + 9}" stroke="${INK}" stroke-width="2"/>`).join('');
  }
  if (mood === 'irritated') return `<path d="M${cx - W * 0.7},${my + 4} Q${cx},${my - 6} ${cx + W * 0.7},${my + 6}" stroke="${lip}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  if (mood === 'nervous') {
    let s = `<path d="M${cx - W * 0.8},${my} q${W * 0.2},-6 ${W * 0.4},0 t${W * 0.4},0 t${W * 0.4},0 t${W * 0.4},0" stroke="${lip}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    if (t === 'buck') s += `<rect x="${cx - 9}" y="${my + 1}" width="9" height="12" rx="2" fill="#fff" stroke="${INK}" stroke-width="2.5"/><rect x="${cx}" y="${my + 1}" width="9" height="12" rx="2" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`;
    return s;
  }
  if (mood === 'confused') return `<path d="M${cx - W * 0.6},${my + 2} Q${cx - W * 0.2},${my - 6} ${cx + W * 0.1},${my + 2} T${cx + W * 0.7},${my - 2}" stroke="${lip}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  // normal
  let s = `<path d="M${cx - W * 0.7},${my} Q${cx},${my + (L.extras?.includes('smirk') ? 6 : 3)} ${cx + W * 0.7},${my - (L.extras?.includes('smirk') ? 6 : 0)}" stroke="${lip}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  if (t === 'buck') s += `<rect x="${cx - 9}" y="${my + 1}" width="9" height="13" rx="2" fill="#fff" stroke="${INK}" stroke-width="2.5"/><rect x="${cx}" y="${my + 1}" width="9" height="13" rx="2" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`;
  if (t === 'gap' || t === 'missing') s += `<rect x="${cx + 6}" y="${my}" width="8" height="8" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
  return s;
}

function mouthOpen(L, cx, my, wide) {
  const t = L.teeth || 'smile';
  const W = wide * 0.85;
  let s = `<path d="M${cx - W},${my - 4} Q${cx},${my - 12} ${cx + W},${my - 4} Q${cx + W * 0.8},${my + 26} ${cx},${my + 28} Q${cx - W * 0.8},${my + 26} ${cx - W},${my - 4}Z" fill="#4a1414" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
  s += `<ellipse cx="${cx + 3}" cy="${my + 18}" rx="${W * 0.5}" ry="7" fill="#c4515a"/>`;
  // Tenner i overmunnen
  if (t === 'buck') s += `<rect x="${cx - 10}" y="${my - 7}" width="10" height="16" rx="2" fill="#fff" stroke="${INK}" stroke-width="2.5"/><rect x="${cx}" y="${my - 7}" width="10" height="16" rx="2" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`;
  else if (t === 'gap') s += `<rect x="${cx - W * 0.7}" y="${my - 7}" width="${W * 0.62}" height="9" fill="#f4eed9" stroke="${INK}" stroke-width="2"/><rect x="${cx + W * 0.1}" y="${my - 7}" width="${W * 0.6}" height="9" fill="#f4eed9" stroke="${INK}" stroke-width="2"/>`;
  else if (t === 'missing') s += [0, 2, 3].map((i) => `<rect x="${cx - W * 0.7 + i * W * 0.36}" y="${my - 7}" width="${W * 0.3}" height="10" fill="#e9dfb9" stroke="${INK}" stroke-width="2"/>`).join('');
  else if (t === 'crooked' || t === 'crooked_grin') s += [...Array(5)].map((_, i) => `<rect x="${cx - W * 0.72 + i * W * 0.3}" y="${my - 8 + (i % 2) * 3}" width="${W * 0.26}" height="${9 + (i % 3) * 3}" fill="#f1e9cf" stroke="${INK}" stroke-width="2" transform="rotate(${(i - 2) * 6} ${cx - W * 0.6 + i * W * 0.3} ${my})"/>`).join('');
  else s += `<rect x="${cx - W * 0.72}" y="${my - 7}" width="${W * 1.44}" height="9" rx="2" fill="#f7f2e2" stroke="${INK}" stroke-width="2"/>`;
  return s;
}

function beard(L, cx, cy, w, h, my) {
  const b = L.beard;
  if (!b && !L.extras?.includes('stubble_shadow')) return '';
  const col = L.beardColor || '#333';
  const jaw = `M${cx - w * 0.48},${cy + h * 0.02} C${cx - w * 0.5},${cy + h * 0.4} ${cx - w * 0.2},${cy + h * 0.52} ${cx},${cy + h * 0.52} C${cx + w * 0.2},${cy + h * 0.52} ${cx + w * 0.5},${cy + h * 0.4} ${cx + w * 0.48},${cy + h * 0.02} C${cx + w * 0.4},${cy + h * 0.3} ${cx + w * 0.2},${my - 14} ${cx},${my - 14} C${cx - w * 0.2},${my - 14} ${cx - w * 0.4},${cy + h * 0.3} ${cx - w * 0.48},${cy + h * 0.02}Z`;
  if (b === 'full' || b === 'full_short') {
    const ext = b === 'full' ? 0.72 : 0.58;
    return `<path d="M${cx - w * 0.5},${cy} C${cx - w * 0.56},${cy + h * 0.5} ${cx - w * 0.3},${cy + h * ext} ${cx},${cy + h * ext} C${cx + w * 0.3},${cy + h * ext} ${cx + w * 0.56},${cy + h * 0.5} ${cx + w * 0.5},${cy} C${cx + w * 0.36},${cy + h * 0.24} ${cx + w * 0.2},${my - 16} ${cx},${my - 18} C${cx - w * 0.2},${my - 16} ${cx - w * 0.36},${cy + h * 0.24} ${cx - w * 0.5},${cy}Z" fill="${col}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>` +
      `<path d="M${cx - w * 0.2},${cy + h * 0.4} q4,10 0,20 M${cx + w * 0.18},${cy + h * 0.42} q4,10 0,20 M${cx},${cy + h * 0.5} q3,8 0,16" stroke="${shade(col, 0.3)}" stroke-width="2.5" fill="none"/>`;
  }
  if (b === 'mustache') return `<path d="M${cx - 30},${my - 6} C${cx - 20},${my - 22} ${cx - 4},${my - 18} ${cx},${my - 12} C${cx + 4},${my - 18} ${cx + 20},${my - 22} ${cx + 30},${my - 6} C${cx + 20},${my - 10} ${cx + 8},${my - 6} ${cx},${my - 8} C${cx - 8},${my - 6} ${cx - 20},${my - 10} ${cx - 30},${my - 6}Z" fill="${col}" stroke="${INK}" stroke-width="3"/>`;
  if (b === 'goatee') return `<path d="M${cx - 14},${my + 14} Q${cx},${my + 48} ${cx + 14},${my + 14} Q${cx},${my + 22} ${cx - 14},${my + 14}Z" fill="${col}" stroke="${INK}" stroke-width="3"/>`;
  if (b === 'thin') return `<path d="${jaw}" fill="${col}" opacity=".55"/><path d="M${cx - 10},${my + 16} Q${cx},${my + 34} ${cx + 10},${my + 16}" fill="${col}" stroke="${INK}" stroke-width="2.5"/>`;
  // stubble / jaw_shadow / stubble_shadow
  const op = b === 'jaw_shadow' || L.extras?.includes('stubble_shadow') ? 0.22 : 0.3;
  let s = `<path d="${jaw}" fill="${b === 'jaw_shadow' ? '#26323d' : col}" opacity="${op}"/>`;
  if (b === 'stubble') {
    const rng = new RNG(hashString(cx + ':' + w));
    for (let i = 0; i < 70; i++) {
      const a = rng.next() * Math.PI, r = rng.next();
      const x = cx + Math.cos(a) * w * 0.42 * (0.4 + r * 0.6);
      const y = my - 6 + Math.sin(a) * h * 0.22 * (0.2 + r * 0.8);
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.4" fill="${shade(col, -0.3)}" opacity=".8"/>`;
    }
  }
  return s;
}

function extrasFace(L, cx, cy, w, h, ey, dx, my, rng) {
  const ex = L.extras || [];
  let s = '';
  if (ex.includes('wrinkles')) s += `<path d="M${cx - w * 0.22},${cy - h * 0.3} q${w * 0.22},-6 ${w * 0.44},0 M${cx - w * 0.18},${cy - h * 0.24} q${w * 0.18},-5 ${w * 0.36},0" stroke="${shade(L.skin, -0.35)}" stroke-width="2.5" fill="none"/><path d="M${cx - dx - 26},${ey - 4} l-8,-4 M${cx - dx - 26},${ey + 2} l-9,2 M${cx + dx + 26},${ey - 4} l8,-4 M${cx + dx + 26},${ey + 2} l9,2" stroke="${shade(L.skin, -0.35)}" stroke-width="2.2"/>`;
  if (ex.includes('bags')) s += `<path d="M${cx - dx - 14},${ey + 16} q14,8 28,0 M${cx + dx - 14},${ey + 16} q14,8 28,0" stroke="${shade(L.skin, -0.35)}" stroke-width="2.5" fill="none"/><path d="M${cx - dx - 12},${ey + 12} q12,10 24,0 M${cx + dx - 12},${ey + 12} q12,10 24,0" fill="#7a5a8a" opacity=".2"/>`;
  if (ex.includes('freckles')) for (let i = 0; i < 16; i++) { const side = i % 2 ? 1 : -1; s += `<circle cx="${cx + side * (dx * 0.6 + rng.int(0, 26))}" cy="${ey + 22 + rng.int(0, 18)}" r="1.8" fill="${shade(L.skin, -0.4)}" opacity=".75"/>`; }
  if (ex.includes('blush') || ex.includes('blush_faint')) { const o = ex.includes('blush') ? 0.45 : 0.25; s += `<ellipse cx="${cx - dx - 4}" cy="${ey + 30}" rx="17" ry="9" fill="#e8636b" opacity="${o}"/><ellipse cx="${cx + dx + 4}" cy="${ey + 30}" rx="17" ry="9" fill="#e8636b" opacity="${o}"/>`; }
  if (ex.includes('mole')) s += `<circle cx="${cx + dx + 8}" cy="${my - 10}" r="4" fill="#3a2418"/><line x1="${cx + dx + 8}" y1="${my - 13}" x2="${cx + dx + 12}" y2="${my - 20}" stroke="${INK}" stroke-width="1.5"/>`;
  if (ex.includes('scar')) s += `<path d="M${cx - dx - 10},${ey - 30} l14,40" stroke="#b56a6a" stroke-width="4"/><path d="M${cx - dx - 8},${ey - 20} l8,-3 M${cx - dx - 4},${ey - 8} l8,-3 M${cx - dx},${ey + 4} l8,-3" stroke="#7a3a3a" stroke-width="2"/>`;
  if (ex.includes('headband')) s += `<path d="M${cx - w * 0.5},${cy - h * 0.25} Q${cx},${cy - h * 0.34} ${cx + w * 0.5},${cy - h * 0.25}" stroke="#fff" stroke-width="16" fill="none"/><path d="M${cx - w * 0.5},${cy - h * 0.25} Q${cx},${cy - h * 0.34} ${cx + w * 0.5},${cy - h * 0.25}" stroke="#c73a3a" stroke-width="5" fill="none"/>`;
  return s;
}

// ─────────────── Hovedrenderer ───────────────
/**
 * @param char karakter fra characters.js
 * @param opts { mood, photo, overrides: {hair, hairColor, nose, noseSize}, anomaly, uid }
 */
export function renderPortrait(char, opts = {}) {
  const L = { ...char.look, ...(opts.overrides || {}) };
  const photo = !!opts.photo;
  const mood = photo ? 'normal' : (opts.mood || 'normal');
  const rng = new RNG(hashString(char.id + ':face'));
  const uid = opts.uid || `${char.id}${photo ? 'p' : ''}${Math.floor(Math.random() * 1e6)}`;
  const cx = 200;
  const w = 150 * (L.headW || 1), h = 172 * (L.headH || 1);
  const cy = 196;
  const skin = L.skin;
  const hairCol = L.hairColor || '#333';
  const headPts = headPoints(L.head, cx, cy, w, h, rng);
  const headD = smoothPath(headPts);
  const ey = cy - h * 0.06, dx = w * 0.21;
  const ny = cy + h * 0.1;
  const my = cy + h * 0.31;
  const mouthW = w * 0.2 + (L.teeth === 'grin' || L.teeth === 'crooked_grin' ? 10 : 0);
  const neckTop = cy + h * 0.38;

  let s = '';
  s += `<defs><clipPath id="hc${uid}"><path d="${headD}"/></clipPath></defs>`;
  // Skygge bak figuren (kastet av lyktestolpen) – vises ikke på passbilder
  s += `<g class="ch-body">`;
  s += hairBack(L, cx, cy, w, h, hairCol);
  s += body(L, cx, neckTop + 10);
  // Hals
  s += `<path d="M${cx - w * 0.2},${neckTop - 20} L${cx - w * 0.22},${neckTop + 34} Q${cx},${neckTop + 50} ${cx + w * 0.22},${neckTop + 34} L${cx + w * 0.2},${neckTop - 20}Z" fill="${shade(skin, -0.12)}" stroke="${INK}" stroke-width="${SW}"/>`;
  if (L.outfit === 'kofte' || L.outfit === 'sweater_black' || L.outfit === 'knit') s += `<rect x="${cx - w * 0.26}" y="${neckTop + 14}" width="${w * 0.52}" height="22" rx="8" fill="${L.outfit === 'kofte' ? L.outfitColor : L.outfitColor2}" stroke="${INK}" stroke-width="${SW}"/>`;
  s += `</g>`;
  s += `<g class="ch-head">`;
  // Ører
  const earS = L.ears === 'big' ? 1.35 : L.ears === 'small' ? 0.8 : 1;
  for (const side of [-1, 1]) {
    const ex = cx + side * (w * 0.5);
    s += `<ellipse cx="${ex}" cy="${ey + 8}" rx="${14 * earS}" ry="${22 * earS}" fill="${skin}" stroke="${INK}" stroke-width="${SW}"/><path d="M${ex + side * -2},${ey} q${side * 6},8 0,18" stroke="${shade(skin, -0.35)}" stroke-width="3" fill="none"/>`;
    if (L.extras?.includes('hoops')) s += `<circle cx="${ex + side * 3}" cy="${ey + 14 + 22 * earS}" r="12" fill="none" stroke="#d8b23a" stroke-width="4"/><circle cx="${ex + side * 3}" cy="${ey + 14 + 22 * earS}" r="12" fill="none" stroke="${INK}" stroke-width="1.2" opacity=".6"/>`;
    if (L.extras?.includes('earring')) s += `<circle cx="${ex + side * 2}" cy="${ey + 8 + 22 * earS}" r="5" fill="none" stroke="#d8b23a" stroke-width="3"/>`;
  }
  // Hode
  s += `<path d="${headD}" fill="${skin}" stroke="${INK}" stroke-width="${SW + 0.6}" stroke-linejoin="round"/>`;
  // Skygge og skitt (cel-shading + tekstur), klippet til hodet
  s += `<g clip-path="url(#hc${uid})">`;
  s += `<ellipse cx="${cx + w * 0.42}" cy="${cy + h * 0.1}" rx="${w * 0.32}" ry="${h * 0.62}" fill="${shade(skin, -0.3)}" opacity=".45"/>`;
  s += `<ellipse cx="${cx - w * 0.3}" cy="${cy - h * 0.28}" rx="${w * 0.2}" ry="${h * 0.12}" fill="#fff" opacity=".18"/>`;
  s += `<ellipse cx="${cx}" cy="${cy + h * 0.55}" rx="${w * 0.6}" ry="${h * 0.14}" fill="${shade(skin, -0.35)}" opacity=".4"/>`;
  if (!photo) s += `<rect x="${cx - w}" y="${cy - h}" width="${w * 2}" height="${h * 2}" filter="url(#grime)" opacity=".5"/>`;
  if (!photo && mood === 'angry') s += `<rect x="${cx - w}" y="${cy - h}" width="${w * 2}" height="${h * 2}" fill="#d0302a" opacity=".22"/>`;
  s += `</g>`;
  s += beard(L, cx, cy, w, h, my);
  s += extrasFace(L, cx, cy, w, h, ey, dx, my, rng);
  s += `<g class="eyes">${eyes(L, cx, ey, dx, mood, opts.anim, photo)}</g>`;
  s += glasses(L, cx, ey, dx);
  s += brows(L, cx, ey - 30, dx, mood);
  // Nesen skal aldri gå ned i munnen (verst: sint munn og åpen munn, topp ved my - 9).
  // For lange neser krympes fra roten, bare så mye som trengs – nesetypen og særpreget beholdes.
  const nk = (L.noseSize || 1) * 1.18;
  const [nTop, nBot] = NOSE_EXT[L.nose] || NOSE_EXT.bulb;
  const root = ny - nTop * nk;
  const fit = Math.min(1, Math.max(0.7, (my - 9 - NOSE_GAP - root) / ((nTop + nBot) * nk)));
  s += `<g class="nose">${nose(L.nose, nk * fit, cx, root + nTop * nk * fit, skin)}</g>`;
  s += `<g class="mouth-closed">${mouthClosed(L, cx, my, mood, mouthW)}</g>`;
  if (!photo) s += `<g class="mouth-open">${mouthOpen(L, cx, my, mouthW)}</g>`;
  if (L.beard === 'mustache') s += beard({ ...L, extras: [] }, cx, cy, w, h, my);
  s += hairFront(L, cx, cy, w, h, hairCol, rng, headPts);
  s += hat(L, cx, cy, w, h);
  s += `</g>`;
  // Humørdetaljer legges UTENFOR wobble-filteret: animert svette inne i filteret tvang nettleseren
  // til å tegne hele det filtrerte portrettet på nytt hvert eneste bilde.
  let fx = '';
  if (!photo && (mood === 'nervous' || L.extras?.includes('sweaty'))) {
    fx += `<g class="sweat"><path d="M${cx + w * 0.42},${cy - h * 0.3} q-7,12 0,17 q7,-5 0,-17Z" fill="#9fd3ef" stroke="${INK}" stroke-width="2.5"/>${mood === 'nervous' ? `<path d="M${cx - w * 0.44},${cy - h * 0.18} q-6,10 0,14 q6,-4 0,-14Z" fill="#9fd3ef" stroke="${INK}" stroke-width="2.5"/>` : ''}</g>`;
  }
  if (!photo && mood === 'angry') fx += `<path d="M${cx + w * 0.22},${cy - h * 0.36} l8,8 l-8,8 M${cx + w * 0.22 + 10},${cy - h * 0.36} l-4,10 l10,2" stroke="#b01e1e" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  if (!photo && mood === 'confused') fx += `<text x="${cx + w * 0.5}" y="${cy - h * 0.45}" font-family="Rubik Dirt, Impact, sans-serif" font-size="40" fill="#f2e6b8" stroke="${INK}" stroke-width="2">?</text>`;

  const vb = photo ? '70 60 260 300' : '0 0 400 520';
  return `<svg class="portrait-svg${photo ? ' is-photo' : ''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet"><g ${photo ? '' : 'filter="url(#wobble)"'}>${s}</g>${fx}</svg>`;
}

/** Globale SVG-filtre (håndtegnet skjelving og skittent papir). Settes inn én gang i DOM. */
export function svgDefs() {
  return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G"/></filter>
    <filter id="grime" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.12  0 0 0 -1.6 1.05"/></filter>
    <filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="11"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 -1.8 1.1"/></filter>
  </defs></svg>`;
}
