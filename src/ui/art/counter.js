// Resepsjonsdisken som eget forgrunnslag (samme prinsipp som disken i KIOSK69):
// gjestene står bak den, gjenstandene ligger oppå den. Tegnes som én SVG i bakgrunnenes strek –
// tykke blekklinjer, slitt mørkbeiset tre med lyse avskallinger, skravur i skyggene – og vises som
// et <img> (rastreres én gang, koster ingenting per bilde).
import { RNG } from '../../core/rng.js';

const INK = '#1b120c';
const W = 1600, H = 900;

/** Håndtegnet linje: små skjelv langs en rett strek. */
function wobble(rng, x1, y1, x2, y2, step = 46, amp = 0.9) {
  const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / step));
  let d = `M${x1.toFixed(1)},${y1.toFixed(1)}`;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const j = i === n ? 0 : (rng.next() * 2 - 1) * amp;
    d += ` L${(x1 + (x2 - x1) * t).toFixed(1)},${(y1 + (y2 - y1) * t + j).toFixed(1)}`;
  }
  return d;
}

/** Uregelmessig flekk (avskallet lakk), flattrykt i perspektiv. */
function blob(rng, cx, cy, r, flat) {
  const n = 9 + rng.int(0, 5);
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.45 + rng.next() * 0.75);
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr * flat).toFixed(1)}`;
  }
  return `${d}Z`;
}

/** x-posisjon langs en linje mot forsvinningspunktet (for skjøter og klaffen). */
const toward = (vp, x0, y0, y) => vp.x + (x0 - vp.x) * ((y - vp.y) / (y0 - vp.y));

/**
 * opts:
 *  surfaceTop  – bakkant av arbeidsflata (scene-y)
 *  ledge       – { top, topH, faceH } hevet kant mot gjestene, eller null (disk mot vegg)
 *  lip         – y der den avrundede forkanten nærmest spilleren begynner
 *  flapX       – x for løfteklaffen (gjennomgang), eller null
 *  endX        – x der en frittstående pult slutter (med endeflate og skygge), eller null = hele bredden
 *  carve       – inngraverte initialer (bare på hoveddisken)
 *  seed        – fast tilfeldighet, så disken ser lik ut hver gang
 */
export function counterSvg({ surfaceTop, ledge = null, lip = 866, flapX = null, endX = null, carve = false, seed = 'disk', vp = { x: 800, y: 200 } } = {}) {
  const rng = new RNG(seed);
  const top = ledge ? ledge.top : surfaceTop - 10;
  const out = [];
  const P = (s) => out.push(s);

  P(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`);
  P(`<defs>
    <linearGradient id="surf" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2e1f14"/><stop offset=".3" stop-color="#553a25"/><stop offset=".7" stop-color="#4a3220"/><stop offset="1" stop-color="#2a1b11"/>
    </linearGradient>
    <linearGradient id="ledgeTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#76533a"/><stop offset="1" stop-color="#523824"/></linearGradient>
    <linearGradient id="ledgeFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1b11"/><stop offset="1" stop-color="#3a2717"/></linearGradient>
    <linearGradient id="lipG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#80603f"/><stop offset=".22" stop-color="#5b3e27"/><stop offset=".45" stop-color="#2e1e13"/><stop offset="1" stop-color="#140c07"/></linearGradient>
    <linearGradient id="shadeDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".62"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <radialGradient id="pool" cx="820" cy="700" r="760" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 420) scale(1 .4)">
      <stop offset="0" stop-color="#ffd68a" stop-opacity=".26"/><stop offset=".55" stop-color="#ffcf80" stop-opacity=".09"/><stop offset="1" stop-color="#ffcf80" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="endsG" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${endX || W}" y2="0">
      <stop offset="0" stop-color="#fff"/><stop offset=".22" stop-color="#000"/><stop offset=".78" stop-color="#000"/><stop offset="1" stop-color="#fff"/>
    </linearGradient>
    <mask id="endsM"><rect width="${W}" height="${H}" fill="url(#endsG)"/></mask>
    <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><line x1="0" y1="0" x2="0" y2="7" stroke="${INK}" stroke-width="1.3"/></pattern>
    <filter id="fiber" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.21" numOctaves="3" seed="7"/>
      <feColorMatrix values="0 0 0 0 .06  0 0 0 0 .035  0 0 0 0 .015  0 0 0 -3.2 2"/>
    </filter>
    <filter id="grit" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3"/>
      <feColorMatrix values="0 0 0 0 .07  0 0 0 0 .05  0 0 0 0 .03  0 0 0 9 -5.9"/>
    </filter>
    <clipPath id="endClip"><rect x="0" y="0" width="${endX || W}" height="${H}"/></clipPath>
    <linearGradient id="sideG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2717"/><stop offset="1" stop-color="#1a110a"/></linearGradient>
    <linearGradient id="floorShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <clipPath id="surfClip"><rect x="0" y="${surfaceTop}" width="${W}" height="${H - surfaceTop}"/></clipPath>
  </defs>`);

  P(`<g clip-path="url(#endClip)">`);
  // ── Arbeidsflata ──
  P(`<rect x="0" y="${surfaceTop}" width="${W}" height="${H - surfaceTop}" fill="url(#surf)"/>`);
  P(`<g clip-path="url(#surfClip)">`);
  P(`<rect x="0" y="${surfaceTop}" width="${W}" height="${H - surfaceTop}" filter="url(#fiber)" opacity=".75"/>`);
  // Bord som går langs disken, bredere jo nærmere spilleren
  const seams = [];
  let y = surfaceTop, h = (lip - surfaceTop) * 0.13;
  while (y + h < lip - 18) { y += h; seams.push(Math.round(y)); h *= 1.24; }
  const rows = [surfaceTop, ...seams, lip];
  for (let b = 0; b < rows.length - 1; b++) {
    const y1 = rows[b], y2 = rows[b + 1], bh = y2 - y1;
    // litt ulik tone per bord
    P(`<rect x="0" y="${y1}" width="${W}" height="${bh}" fill="${rng.chance(0.5) ? '#000' : '#8a5a34'}" opacity="${(0.05 + rng.next() * 0.09).toFixed(3)}"/>`);
    // åreringer
    const lines = Math.round(bh / 4.2);
    for (let i = 0; i < lines; i++) {
      const base = y1 + 2 + (i + rng.next() * 0.6) * (bh - 4) / lines;
      const amp = 0.6 + rng.next() * (bh * 0.05), f = 0.002 + rng.next() * 0.004, ph = rng.next() * 6;
      let d = '';
      for (let x = -20; x <= W + 40; x += 40) {
        const yy = base + Math.sin(x * f + ph) * amp + (rng.next() - 0.5) * 0.7;
        d += `${x === -20 ? 'M' : 'L'}${x},${yy.toFixed(1)}`;
      }
      P(`<path d="${d}" fill="none" stroke="${rng.chance(0.2) ? '#a07850' : INK}" stroke-width="${(0.7 + rng.next() * 1.1).toFixed(2)}" opacity="${(0.22 + rng.next() * 0.3).toFixed(2)}"/>`);
    }
    // kvister
    for (let k = rng.int(0, 2); k > 0; k--) {
      const kx = 60 + rng.next() * (W - 120), ky = y1 + bh * (0.3 + rng.next() * 0.4), rx = 10 + rng.next() * (bh * 0.45), ry = Math.max(3, bh * 0.16);
      for (let r = 3; r >= 1; r--) P(`<ellipse cx="${kx.toFixed(0)}" cy="${ky.toFixed(0)}" rx="${(rx * r / 2.2).toFixed(1)}" ry="${(ry * r / 2.2).toFixed(1)}" fill="none" stroke="${INK}" stroke-width="1" opacity=".3"/>`);
      P(`<ellipse cx="${kx.toFixed(0)}" cy="${ky.toFixed(0)}" rx="${(rx * 0.35).toFixed(1)}" ry="${(ry * 0.35).toFixed(1)}" fill="${INK}" opacity=".55"/>`);
    }
    // skjøter mot forsvinningspunktet
    for (let j = rng.int(1, 2); j > 0; j--) {
      const x0 = 120 + rng.next() * (W - 240), ym = (y1 + y2) / 2;
      const xa = toward(vp, x0, ym, y1), xb = toward(vp, x0, ym, y2);
      P(`<path d="${wobble(rng, xa, y1, xb, y2, 20, 0.6)}" stroke="${INK}" stroke-width="2.2" opacity=".8"/>`);
      P(`<path d="M${xa + 2},${y1} L${xb + 2.5},${y2}" stroke="#9a7450" stroke-width="1" opacity=".35"/>`);
    }
  }
  // fuger mellom bordene (mørk strek + lys fas)
  for (const sy of seams) {
    P(`<path d="${wobble(rng, -10, sy, W + 10, sy)}" fill="none" stroke="${INK}" stroke-width="3"/>`);
    P(`<path d="M0,${sy + 2.5} L${W},${sy + 2.5}" stroke="#b08860" stroke-width="1.4" opacity=".4"/>`);
  }
  // lyset fra lysrøret, skravur og skitt ut mot endene
  P(`<rect x="0" y="${surfaceTop}" width="${W}" height="${H - surfaceTop}" fill="url(#pool)"/>`);
  P(`<rect x="0" y="${surfaceTop}" width="${W}" height="${H - surfaceTop}" fill="url(#hatch)" mask="url(#endsM)" opacity=".6"/>`);
  P(`<rect x="0" y="${surfaceTop}" width="${W}" height="${H - surfaceTop}" fill="#0a0603" mask="url(#endsM)" opacity=".45"/>`);
  P(`<rect x="0" y="${surfaceTop}" width="${W}" height="${H - surfaceTop}" filter="url(#grit)" opacity=".9"/>`);
  // slitasje (oppå skitten): lyse avskallinger der hender og vesker hviler
  const chips = (n, yA, yB, rMin, rMax) => {
    for (let i = 0; i < n; i++) {
      const cx = rng.next() * W, cy = yA + rng.next() * (yB - yA), r = rMin + rng.next() * (rMax - rMin);
      P(`<path d="${blob(rng, cx, cy, r, 0.32)}" fill="#cdbd98" opacity="${(0.5 + rng.next() * 0.35).toFixed(2)}" stroke="${INK}" stroke-width="1.2" stroke-opacity=".6"/>`);
      if (rng.chance(0.6)) P(`<path d="${blob(rng, cx + r * 0.9, cy + 2, r * 0.35, 0.4)}" fill="#cdbd98" opacity=".3"/>`);
    }
  };
  chips(9, surfaceTop + 6, surfaceTop + 60, 8, 34);
  chips(7, surfaceTop + 60, lip - 40, 6, 22);
  chips(10, lip - 34, lip - 4, 10, 46);
  // riper
  for (let i = 0; i < 70; i++) {
    const sx = rng.next() * W, sy = surfaceTop + 8 + rng.next() * (lip - surfaceTop - 12), len = 8 + rng.next() * 46, a = (rng.next() - 0.5) * 0.5;
    P(`<path d="M${sx.toFixed(0)},${sy.toFixed(0)} l${(Math.cos(a) * len).toFixed(1)},${(Math.sin(a) * len * 0.4).toFixed(1)}" stroke="#d8c6a0" stroke-width="${(0.6 + rng.next()).toFixed(1)}" opacity="${(0.14 + rng.next() * 0.22).toFixed(2)}"/>`);
  }
  // kaffeskjolder, brennmerke, inngravert «K.J. 87»
  for (const [cx, cy, rx] of [[1235, surfaceTop + (lip - surfaceTop) * 0.62, 34], [1290, surfaceTop + (lip - surfaceTop) * 0.7, 30], [140, surfaceTop + (lip - surfaceTop) * 0.82, 38]]) {
    P(`<ellipse cx="${cx}" cy="${cy.toFixed(0)}" rx="${rx}" ry="${(rx * 0.34).toFixed(1)}" fill="none" stroke="#140b05" stroke-width="3.2" opacity=".32" stroke-dasharray="${(rx * 4).toFixed(0)} 14"/>`);
  }
  P(`<ellipse cx="612" cy="${(lip - 22).toFixed(0)}" rx="13" ry="4.5" fill="#0d0704" opacity=".7"/><ellipse cx="609" cy="${(lip - 23).toFixed(0)}" rx="6" ry="2" fill="#5a3a20" opacity=".6"/>`);
  if (carve) P(`<text x="1060" y="${((lip - 14) / 0.5).toFixed(0)}" transform="scale(1 .5)" font-family="Courier New, monospace" font-size="34" font-weight="700" fill="none" stroke="#dcc9a2" stroke-width="1.6" opacity=".38">K.J. 87</text>`);
  if (carve) P(`<text x="430" y="${((surfaceTop + 50) / 0.45).toFixed(0)}" transform="scale(1 .45)" font-family="Courier New, monospace" font-size="30" font-weight="700" fill="none" stroke="#dcc9a2" stroke-width="1.4" opacity=".3">69</text>`);
  P(`</g>`);

  // ── Klaff (gjennomgang) med hengsler ──
  if (flapX) {
    const ym = (surfaceTop + lip) / 2;
    const xa = toward(vp, flapX, ym, top), xb = toward(vp, flapX, ym, H);
    P(`<path d="${wobble(rng, xa, top, xb, H, 24, 0.7)}" stroke="${INK}" stroke-width="3.2"/>`);
    P(`<path d="M${xa + 3},${top} L${xb + 4},${H}" stroke="#a27a52" stroke-width="1.2" opacity=".35"/>`);
    for (const t of [0.3, 0.72]) {
      const hy = surfaceTop + (lip - surfaceTop) * t, hx = toward(vp, flapX, ym, hy);
      const hw = 34 + t * 12, hh = 9 + t * 5;
      P(`<rect x="${(hx - hw / 2).toFixed(0)}" y="${(hy - hh / 2).toFixed(0)}" width="${hw.toFixed(0)}" height="${hh.toFixed(0)}" rx="3" fill="#a9853a" stroke="${INK}" stroke-width="2"/>`);
      P(`<line x1="${hx.toFixed(0)}" y1="${(hy - hh / 2).toFixed(0)}" x2="${hx.toFixed(0)}" y2="${(hy + hh / 2).toFixed(0)}" stroke="${INK}" stroke-width="1.5"/>`);
      for (const dx of [-hw / 3, hw / 3]) P(`<circle cx="${(hx + dx).toFixed(0)}" cy="${hy.toFixed(0)}" r="1.8" fill="${INK}"/>`);
    }
    const ry = surfaceTop + (lip - surfaceTop) * 0.5, rx = toward(vp, flapX + 70, ym, ry);
    P(`<ellipse cx="${rx.toFixed(0)}" cy="${ry.toFixed(0)}" rx="15" ry="6" fill="none" stroke="#a9853a" stroke-width="3.5"/><ellipse cx="${rx.toFixed(0)}" cy="${ry.toFixed(0)}" rx="15" ry="6" fill="none" stroke="${INK}" stroke-width="1.2"/>`);
  }

  // ── Hevet kant mot gjestene (eller vegglist når disken står mot veggen) ──
  if (ledge) {
    const { top: lt, topH, faceH } = ledge;
    const fy = lt + topH, by = fy + faceH;
    P(`<rect x="0" y="${by}" width="${W}" height="46" fill="url(#shadeDown)"/>`);
    P(`<rect x="0" y="${by}" width="${W}" height="26" fill="url(#hatch)" opacity=".3"/>`);
    // innsiden av kanten (mot spilleren): mørke panelbord
    P(`<rect x="0" y="${fy}" width="${W}" height="${faceH}" fill="url(#ledgeFace)"/>`);
    P(`<rect x="0" y="${fy}" width="${W}" height="${faceH}" filter="url(#fiber)" opacity=".5"/>`);
    for (let x = 30 + rng.next() * 30; x < W; x += 58 + rng.next() * 22) {
      P(`<path d="${wobble(rng, x, fy + 2, x + (x - vp.x) * 0.012, by, 12, 0.5)}" stroke="${INK}" stroke-width="1.8" opacity=".75"/>`);
      P(`<line x1="${(x + 2).toFixed(0)}" y1="${fy + 3}" x2="${(x + 2).toFixed(0)}" y2="${by - 2}" stroke="#7a5a3a" stroke-width=".8" opacity=".3"/>`);
    }
    P(`<rect x="0" y="${fy}" width="${W}" height="${faceH}" fill="url(#hatch)" mask="url(#endsM)" opacity=".35"/>`);
    // toppflata på kanten
    P(`<rect x="0" y="${lt}" width="${W}" height="${topH}" fill="url(#ledgeTop)"/>`);
    P(`<rect x="0" y="${lt}" width="${W}" height="${topH}" filter="url(#fiber)" opacity=".55"/>`);
    for (let i = 0; i < 4; i++) {
      const gy = lt + 4 + i * (topH - 6) / 4;
      P(`<path d="${wobble(rng, 0, gy, W, gy, 60, 0.8)}" fill="none" stroke="${INK}" stroke-width=".8" opacity=".22"/>`);
    }
    for (let i = 0; i < 18; i++) {
      const cx = rng.next() * W, r = 6 + rng.next() * 30;
      P(`<path d="${blob(rng, cx, lt + topH * (0.3 + rng.next() * 0.5), r, 0.22)}" fill="#d2c29d" opacity="${(0.3 + rng.next() * 0.35).toFixed(2)}"/>`);
    }
    // skrammer i forkanten (lyse hakk som renner ned)
    for (let i = 0; i < 14; i++) {
      const cx = rng.next() * W;
      P(`<path d="M${cx.toFixed(0)},${fy} q${(rng.next() * 6 - 3).toFixed(1)},${(4 + rng.next() * 10).toFixed(1)} ${(rng.next() * 4 - 2).toFixed(1)},${(8 + rng.next() * 16).toFixed(1)}" stroke="#cdbd98" stroke-width="${(1 + rng.next() * 2).toFixed(1)}" opacity=".45" fill="none"/>`);
    }
    P(`<path d="M0,${lt + 2} L${W},${lt + 2}" stroke="#b9925f" stroke-width="2" opacity=".75"/>`);
    P(`<path d="${wobble(rng, -10, lt, W + 10, lt, 40, 0.7)}" fill="none" stroke="${INK}" stroke-width="3.4"/>`);
    P(`<path d="${wobble(rng, -10, fy, W + 10, fy, 40, 0.6)}" fill="none" stroke="${INK}" stroke-width="2.4"/>`);
    P(`<path d="${wobble(rng, -10, by, W + 10, by, 40, 0.6)}" fill="none" stroke="${INK}" stroke-width="2.6"/>`);
  } else {
    // disken står inntil veggen: smal mørk vegglist og skygge ned på flata
    P(`<rect x="0" y="${surfaceTop}" width="${W}" height="40" fill="url(#shadeDown)"/>`);
    P(`<rect x="0" y="${top}" width="${W}" height="${surfaceTop - top}" fill="#2a1b11"/>`);
    P(`<path d="M0,${top + 2} L${W},${top + 2}" stroke="#8a6a46" stroke-width="1.5" opacity=".6"/>`);
    P(`<path d="${wobble(rng, -10, top, W + 10, top, 40, 0.7)}" fill="none" stroke="${INK}" stroke-width="3"/>`);
    P(`<path d="${wobble(rng, -10, surfaceTop, W + 10, surfaceTop, 40, 0.6)}" fill="none" stroke="${INK}" stroke-width="2.4"/>`);
  }

  // ── Avrundet forkant nærmest spilleren ──
  P(`<rect x="0" y="${lip}" width="${W}" height="${H - lip}" fill="url(#lipG)"/>`);
  P(`<rect x="0" y="${lip}" width="${W}" height="${H - lip}" filter="url(#grit)" opacity=".6"/>`);
  for (let i = 0; i < 16; i++) {
    const cx = rng.next() * W, r = 10 + rng.next() * 40;
    P(`<path d="${blob(rng, cx, lip + 4, r, 0.12)}" fill="#d2c29d" opacity="${(0.35 + rng.next() * 0.3).toFixed(2)}"/>`);
  }
  P(`<path d="${wobble(rng, -10, lip, W + 10, lip, 40, 0.8)}" fill="none" stroke="${INK}" stroke-width="3.2"/>`);
  P(`<path d="M0,${lip + 8} L${W},${lip + 8}" stroke="${INK}" stroke-width="1.2" opacity=".5"/>`);
  P(`</g>`);
  // ── Endeflate på en frittstående pult: sidepanel ned mot gulvet og skygge på gulvet ──
  if (endX) {
    const sw = 24;
    P(`<path d="M${endX},${top} L${endX + sw},${top + 10} L${endX + sw + 70},${H} L${endX + sw},${H} Z" fill="url(#floorShade)"/>`);
    P(`<path d="M${endX},${top} L${endX + sw},${top + 10} L${endX + sw},${H} L${endX},${H} Z" fill="url(#sideG)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`);
    P(`<rect x="${endX}" y="${top}" width="${sw}" height="${H - top}" fill="url(#hatch)" opacity=".35"/>`);
    for (let i = 0; i < 6; i++) {
      const cy = top + 40 + rng.next() * (H - top - 80);
      P(`<path d="M${endX + 4},${cy.toFixed(0)} q6,${(4 + rng.next() * 8).toFixed(1)} 2,${(10 + rng.next() * 16).toFixed(1)}" stroke="#cdbd98" stroke-width="2" opacity=".45" fill="none"/>`);
    }
    P(`<path d="M${endX},${top} L${endX},${H}" stroke="#a27a52" stroke-width="1.5" opacity=".45"/>`);
    P(`<path d="${wobble(rng, endX, top - 1, endX, H, 30, 0.6)}" stroke="${INK}" stroke-width="3.4"/>`);
  }
  P(`</svg>`);
  return out.join('');
}

const urls = new Map();
/** Blob-URL for et <img>, laget én gang per variant. */
export function counterUrl(opts) {
  const key = JSON.stringify(opts);
  if (!urls.has(key)) urls.set(key, URL.createObjectURL(new Blob([counterSvg(opts)], { type: 'image/svg+xml' })));
  return urls.get(key);
}

// Diskvarianter for de tre kameravinklene (samme disk, samme tre)
export const COUNTER_CENTER = { surfaceTop: 624, ledge: { top: 562, topH: 26, faceH: 36 }, lip: 866, flapX: 1452, carve: true, seed: 'disk-senter' };
// Høyre: frittstående pult foran romkartet, slutter før vaskevogna
export const COUNTER_RIGHT = { surfaceTop: 528, ledge: null, lip: 872, endX: 1288, seed: 'disk-hoyre' };
export const COUNTER_LEFT = { surfaceTop: 584, ledge: null, lip: 870, seed: 'disk-venstre' };
