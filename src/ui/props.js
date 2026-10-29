// Interaktive gjenstander som egne SVG-lag oppå Higgsfield-bakgrunnene.
// Samme blekkstil som portrettene: tykke mørke konturer, litt skitne flater.
const INK = '#1b120c';

/** Romnøkkel i messing med stor plastbrikke (rød = 1. etasje, grønn = 2. etasje). */
export function keySvg(no, { small = false } = {}) {
  const fob = no[0] === '1' ? '#a8322a' : '#2f6b4a';
  const fobHi = no[0] === '1' ? '#d0574a' : '#4f9470';
  const s = small ? 0.7 : 1;
  return `<svg viewBox="0 0 64 140" width="${64 * s}" height="${140 * s}" class="key-svg" aria-hidden="true">
    <circle cx="32" cy="10" r="7" fill="none" stroke="#c9a34a" stroke-width="3.5"/>
    <circle cx="32" cy="10" r="7" fill="none" stroke="${INK}" stroke-width="1.2" opacity=".6"/>
    <rect x="28.5" y="15" width="7" height="12" fill="#c9a34a" stroke="${INK}" stroke-width="1.6"/>
    <path d="M10,26 L54,26 L58,40 L54,108 Q32,124 10,108 L6,40 Z" fill="${fob}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M14,32 L28,32 L24,60" stroke="${fobHi}" stroke-width="3" fill="none" opacity=".7"/>
    <circle cx="32" cy="34" r="3.2" fill="#2a1a12"/>
    <text x="32" y="80" text-anchor="middle" font-family="Special Elite, Courier New, monospace" font-size="21" font-weight="700" fill="#f3e6c4" stroke="${INK}" stroke-width=".8">${no}</text>
    <text x="32" y="100" text-anchor="middle" font-family="Special Elite, monospace" font-size="7.5" fill="#f3e6c4" opacity=".8">MOTELL 69</text>
    <path d="M30,108 L30,128 L36,128 L36,124 L33,124 L33,121 L37,121 L37,117 L33,117 L33,112" fill="#c9a34a" stroke="${INK}" stroke-width="1.6"/>
  </svg>`;
}

export function hookSvg() {
  return `<svg viewBox="0 0 30 34" width="30" height="34" aria-hidden="true"><rect x="5" y="2" width="20" height="8" rx="2" fill="#8a6a2e" stroke="${INK}" stroke-width="2"/><path d="M15,10 L15,22 Q15,30 22,28" fill="none" stroke="#b8933f" stroke-width="3.5" stroke-linecap="round"/><path d="M15,10 L15,22 Q15,30 22,28" fill="none" stroke="${INK}" stroke-width="1" opacity=".5"/></svg>`;
}

/** Gammel resepsjonstelefon (dreieskive) med lampepanel for de ti rommene. */
export function phoneSvg() {
  let lamps = '';
  ['201', '202', '203', '204', '205', '101', '102', '103', '104', '105'].forEach((no, i) => {
    const x = 214 + (i % 5) * 31, y = 64 + Math.floor(i / 5) * 46;
    lamps += `<g class="lamp-btn" data-room="${no}" transform="translate(${x},${y})">
      <rect x="-13" y="-12" width="26" height="40" rx="4" fill="#d9cfb4" stroke="${INK}" stroke-width="2.2"/>
      <rect class="lamp" x="-8" y="-8" width="16" height="12" rx="2" fill="#5a4a3a" stroke="${INK}" stroke-width="1.4"/>
      <text x="0" y="22" text-anchor="middle" font-family="Special Elite, monospace" font-size="10" fill="#2a1a12">${no}</text>
    </g>`;
  });
  let holes = '';
  for (let i = 0; i < 10; i++) {
    const a = -1.1 + i * 0.5;
    holes += `<circle cx="${100 + Math.cos(a) * 42}" cy="${132 + Math.sin(a) * 42}" r="9" fill="#efe6cc" stroke="${INK}" stroke-width="2"/>`;
  }
  return `<svg viewBox="0 0 380 250" class="phone-svg" aria-hidden="true">
    <ellipse cx="190" cy="236" rx="176" ry="12" fill="#000" opacity=".35"/>
    <path d="M18,226 L36,96 Q40,78 60,76 L330,76 Q352,78 356,98 L366,226 Z" fill="#c8b48a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M30,212 L44,104 Q48,92 62,92 L170,92 L170,226 L22,226Z" fill="#b29c70" opacity=".55"/>
    <path d="M200,40 L350,40 L356,170 L200,170 Z" fill="#3a2a1e" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
    ${lamps}
    <g class="line-btn" transform="translate(276,158)"><rect x="-40" y="-8" width="80" height="22" rx="4" fill="#d9cfb4" stroke="${INK}" stroke-width="2"/><rect class="lamp line-lamp" x="-34" y="-4" width="14" height="14" rx="2" fill="#5a4a3a" stroke="${INK}" stroke-width="1.4"/><text x="8" y="8" text-anchor="middle" font-family="Special Elite, monospace" font-size="10" fill="#2a1a12">LINJE</text></g>
    <circle cx="100" cy="132" r="64" fill="#2c2420" stroke="${INK}" stroke-width="4"/>
    <circle cx="100" cy="132" r="56" fill="#3a302a"/>
    ${holes}
    <circle cx="100" cy="132" r="20" fill="#d9cfb4" stroke="${INK}" stroke-width="2.5"/>
    <text x="100" y="136" text-anchor="middle" font-family="Special Elite, monospace" font-size="9" fill="#2a1a12">RESEPSJ.</text>
    <path d="M150,96 q18,-12 36,-4" stroke="${INK}" stroke-width="3" fill="none"/>
    <g class="handset">
      <path d="M20,64 Q14,40 34,30 L56,26 Q66,22 80,22 L250,22 Q266,22 274,26 L300,30 Q320,40 312,64 L292,72 Q284,52 266,48 L68,48 Q50,52 42,72 Z" fill="#c8b48a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M68,30 L262,30" stroke="#e6d6ae" stroke-width="5" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="40" cy="62" rx="26" ry="14" fill="#b39e74" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="294" cy="62" rx="26" ry="14" fill="#b39e74" stroke="${INK}" stroke-width="3"/>
    </g>
    <path class="cord" d="M30,74 q-14,30 4,60 q-16,30 2,70" stroke="${INK}" stroke-width="3" fill="none" stroke-dasharray="4 3"/>
  </svg>`;
}

/** Lukket reservasjonsbok (skinninnbundet protokoll). */
export function bookClosedSvg() {
  return `<svg viewBox="0 0 300 168" aria-hidden="true">
    <ellipse cx="150" cy="160" rx="140" ry="8" fill="#000" opacity=".4"/>
    <path d="M12,22 L282,10 L290,140 L20,154 Z" fill="#efe3c4" stroke="${INK}" stroke-width="3"/>
    <path d="M14,28 L284,16 M16,38 L286,26" stroke="#c8b892" stroke-width="2"/>
    <path d="M8,14 L278,4 L286,132 L16,146 Z" fill="#6a2a1e" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M8,14 L44,12 L52,144 L16,146 Z" fill="#4a1c14" stroke="${INK}" stroke-width="3"/>
    <path d="M70,30 L258,22 L264,118 L76,128 Z" fill="none" stroke="#c9a34a" stroke-width="2.5" opacity=".8"/>
    <text x="166" y="72" text-anchor="middle" font-family="Rubik Dirt, Impact, sans-serif" font-size="25" fill="#e7c76a" transform="rotate(-2 166 72)">RESERVASJONER</text>
    <text x="166" y="100" text-anchor="middle" font-family="Special Elite, monospace" font-size="13" fill="#e7c76a" transform="rotate(-2 166 100)">MOTELL 69 · 1987–</text>
    <path d="M220,8 L232,7 L236,60 L228,52 L222,61 Z" fill="#b8322a" stroke="${INK}" stroke-width="2"/>
  </svg>`;
}

export function bellSvg() {
  return `<svg viewBox="0 0 74 62" aria-hidden="true">
    <ellipse cx="37" cy="56" rx="32" ry="5" fill="#000" opacity=".4"/>
    <rect x="6" y="44" width="62" height="10" rx="3" fill="#3a2a1e" stroke="${INK}" stroke-width="2.5"/>
    <path d="M12,44 Q12,16 37,14 Q62,16 62,44 Z" fill="#c9a34a" stroke="${INK}" stroke-width="3"/>
    <path d="M20,38 Q22,22 34,19" stroke="#f3dc8a" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <rect x="33" y="5" width="8" height="10" rx="2" fill="#a08035" stroke="${INK}" stroke-width="2"/>
  </svg>`;
}

/** Kortpresse («ka-tsjunk») – betaling med ett klikk. */
export function imprinterSvg() {
  return `<svg viewBox="0 0 180 104" aria-hidden="true">
    <ellipse cx="90" cy="98" rx="84" ry="6" fill="#000" opacity=".4"/>
    <path d="M8,40 L172,40 L176,92 L4,92 Z" fill="#7a7f86" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <rect x="24" y="48" width="132" height="34" fill="#e9e1cc" stroke="${INK}" stroke-width="2"/>
    <path d="M34,58 h60 M34,66 h86 M34,74 h44" stroke="#9a9078" stroke-width="2"/>
    <rect class="slider" x="14" y="16" width="62" height="30" rx="5" fill="#5a5f66" stroke="${INK}" stroke-width="3"/>
    <rect x="22" y="8" width="46" height="12" rx="4" fill="#2a2a2a" stroke="${INK}" stroke-width="2.5"/>
    <text x="128" y="34" text-anchor="middle" font-family="Special Elite, monospace" font-size="13" fill="#e9e1cc" stroke="${INK}" stroke-width=".5">BETALING</text>
  </svg>`;
}

export function traySvg() {
  return `<svg viewBox="0 0 132 62" aria-hidden="true">
    <ellipse cx="66" cy="50" rx="62" ry="10" fill="#000" opacity=".35"/>
    <path d="M6,30 Q66,6 126,30 L118,48 Q66,62 14,48 Z" fill="#7a5a32" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="66" cy="30" rx="56" ry="11" fill="#4a3220" stroke="${INK}" stroke-width="2.5"/>
    <text x="66" y="58" text-anchor="middle" font-family="Special Elite, monospace" font-size="9" fill="#e9dcb8">NØKKELSKÅL</text>
  </svg>`;
}

export function idCardSvgSmall(kind) {
  return `<svg viewBox="0 0 168 104" aria-hidden="true">
    <rect x="6" y="8" width="156" height="92" rx="8" fill="#000" opacity=".35"/>
    <rect x="2" y="2" width="156" height="92" rx="8" fill="${kind === 'PASS' ? '#7a2a2a' : '#d8e2df'}" stroke="${INK}" stroke-width="3"/>
    <rect x="12" y="14" width="44" height="58" fill="#c9b8a0" stroke="${INK}" stroke-width="2"/>
    <circle cx="34" cy="38" r="12" fill="#8a6a50"/><path d="M16,72 Q34,50 52,72" fill="#8a6a50"/>
    <path d="M66,22 h76 M66,36 h60 M66,50 h70 M66,64 h40" stroke="${kind === 'PASS' ? '#e7c76a' : '#5a6a66'}" stroke-width="4"/>
    <text x="80" y="88" text-anchor="middle" font-family="Special Elite, monospace" font-size="10" fill="${kind === 'PASS' ? '#e7c76a' : '#2a3a36'}">${kind}</text>
  </svg>`;
}

/** Grønn filtmatte med skinnhjørner: her legger gjesten legitimasjonen (dokumentkontroll). */
export function idMatSvg() {
  return `<svg viewBox="0 0 250 150" aria-hidden="true">
    <path d="M14,14 L236,8 L248,144 L2,146 Z" fill="#000" opacity=".35" transform="translate(4 4)"/>
    <path d="M14,12 L236,6 L248,142 L2,144 Z" fill="#2f4a36" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24,22 L228,17 L236,132 L14,134 Z" fill="none" stroke="#5f8a62" stroke-width="1.5" stroke-dasharray="5 4" opacity=".7"/>
    <path d="M14,12 L54,11 L16,52 Z M236,6 L196,7 L240,46 Z M248,142 L208,143 L242,98 Z M2,144 L42,144 L7,100 Z" fill="#5a2a1a" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M60,60 q30,-8 50,4 M150,96 q24,6 40,-6" stroke="#1e3224" stroke-width="5" opacity=".45" fill="none" stroke-linecap="round"/>
    <rect x="80" y="122" width="92" height="16" fill="#efe4c6" stroke="${INK}" stroke-width="1.5" transform="rotate(-1 126 130)"/>
    <text x="126" y="134" text-anchor="middle" font-family="Special Elite, monospace" font-size="11" fill="${INK}" transform="rotate(-1 126 130)">ID-KONTROLL</text>
  </svg>`;
}

/** Ribbet gummimatte midt foran gjesten: nøkler gis og leveres her. */
export function keyMatSvg() {
  const ribs = Array.from({ length: 9 }, (_, i) => `<path d="M${26 + i * 22},14 L${20 + i * 23.5},78" stroke="${INK}" stroke-width="2" opacity=".45"/>`).join('');
  return `<svg viewBox="0 0 240 96" aria-hidden="true">
    <path d="M18,10 L222,10 L236,90 L4,90 Z" fill="#000" opacity=".35" transform="translate(3 4)"/>
    <path d="M18,8 L222,8 L236,88 L4,88 Z" fill="#5a1f18" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    ${ribs}
    <path d="M18,8 L222,8 L224,16 L16,16 Z" fill="#7a3428" opacity=".7"/>
    <path d="M60,40 q20,10 50,2 M150,60 q20,-8 40,4" stroke="#c9b48a" stroke-width="3" opacity=".25" fill="none"/>
    <text x="120" y="83" text-anchor="middle" font-family="Special Elite, monospace" font-size="11" fill="#e9c98a" opacity=".85">NØKLER · KEYS</text>
  </svg>`;
}

/** Emaljekrus med avskallet kant og litt damp (pynt). */
export function mugSvg() {
  return `<svg viewBox="0 0 72 86" aria-hidden="true">
    <g class="steam"><path d="M28,22 q-6,-8 0,-14 q6,-6 0,-12" stroke="#efe4c6" stroke-width="3" fill="none" opacity=".35" stroke-linecap="round"/>
    <path d="M40,24 q6,-8 0,-14 q-6,-6 0,-12" stroke="#efe4c6" stroke-width="2.5" fill="none" opacity=".25" stroke-linecap="round"/></g>
    <ellipse cx="34" cy="80" rx="28" ry="5" fill="#000" opacity=".4"/>
    <path d="M50,40 q18,2 16,16 q-2,12 -16,12" fill="none" stroke="${INK}" stroke-width="8"/>
    <path d="M50,40 q18,2 16,16 q-2,12 -16,12" fill="none" stroke="#d9cfb2" stroke-width="4"/>
    <path d="M8,30 L60,30 L56,78 Q34,84 12,78 Z" fill="#d9cfb2" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="34" cy="30" rx="26" ry="7" fill="#3a2414" stroke="${INK}" stroke-width="3"/>
    <path d="M14,44 L54,44" stroke="#2f5a8a" stroke-width="4"/>
    <path d="M20,60 q4,4 10,2 M44,70 l6,-3" stroke="${INK}" stroke-width="2" opacity=".5"/>
    <path d="M16,38 q-2,8 2,14" stroke="#fff" stroke-width="3" opacity=".35" fill="none"/>
  </svg>`;
}

/** Pennekopp (gammel kaffeboks) med kulepenner og en blyant. */
export function penCupSvg() {
  return `<svg viewBox="0 0 56 96" aria-hidden="true">
    <ellipse cx="28" cy="91" rx="24" ry="4" fill="#000" opacity=".4"/>
    <path d="M18,40 L10,4 M28,40 L30,0 M36,40 L48,8" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <path d="M18,40 L10,4" stroke="#2f5a8a" stroke-width="4" stroke-linecap="round"/>
    <path d="M28,40 L30,0" stroke="#e8c25a" stroke-width="4" stroke-linecap="round"/>
    <path d="M36,40 L48,8" stroke="#b8322a" stroke-width="4" stroke-linecap="round"/>
    <path d="M6,36 L50,36 L48,88 Q28,93 8,88 Z" fill="#8a3a2a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="28" cy="36" rx="22" ry="5" fill="#2a1a10" stroke="${INK}" stroke-width="2.5"/>
    <rect x="11" y="52" width="34" height="18" fill="#e8c25a" stroke="${INK}" stroke-width="1.5"/>
    <text x="28" y="65" text-anchor="middle" font-family="Special Elite, monospace" font-size="9" fill="${INK}">KAFFE</text>
  </svg>`;
}
