// Motellets ti rom. Typer, faste priser og egenskaper som gjesteønsker måles mot.
// tags: near (nær resepsjonen), quiet (rolig), view (utsikt), noisy (bråkete), cold (trekkfullt)

export const ROOM_TYPES = {
  standard: { id: 'standard', name: 'Standard', short: 'S', price: 590 },
  komfort: { id: 'komfort', name: 'Komfort', short: 'K', price: 790 },
  suite: { id: 'suite', name: 'Suite', short: 'SU', price: 1290 },
};
export const TYPE_ORDER = ['standard', 'komfort', 'suite'];

export const ROOMS = [
  { no: '101', floor: 1, type: 'standard', tags: ['near', 'noisy'], note: 'Nærmest resepsjonen. Vindu mot veien.' },
  { no: '102', floor: 1, type: 'standard', tags: ['near'], note: 'Vegg i vegg med resepsjonen.' },
  { no: '103', floor: 1, type: 'komfort', tags: [], note: 'Dobbeltseng. Radiatoren durer.' },
  { no: '104', floor: 1, type: 'standard', tags: ['quiet'], note: 'Mot skogen. Stille.' },
  { no: '105', floor: 1, type: 'suite', tags: ['quiet'], note: '«Kongesuiten». Badekar med rustflekk.' },
  { no: '201', floor: 2, type: 'standard', tags: ['view'], note: 'Utsikt mot fjellet.' },
  { no: '202', floor: 2, type: 'komfort', tags: ['view'], note: 'Utsikt. Knirkete gulv.' },
  { no: '203', floor: 2, type: 'standard', tags: ['noisy', 'cold'], note: 'Over fyrrommet. Kaldt. Telefonen tuller.' },
  { no: '204', floor: 2, type: 'komfort', tags: ['quiet', 'view'], note: 'Rolig hjørnerom med utsikt.' },
  { no: '205', floor: 2, type: 'suite', tags: ['quiet', 'view'], note: 'Takvindu. Nordlys når det e nordlys.' },
];
export const ROOM_BY_NO = Object.fromEntries(ROOMS.map((r) => [r.no, r]));
export const ROOM_NOS = ROOMS.map((r) => r.no);

export const WISHES = {
  quiet: { id: 'quiet', label: 'Rolig rom' },
  near: { id: 'near', label: 'Nær resepsjonen' },
  view: { id: 'view', label: 'Utsikt' },
  cheap: { id: 'cheap', label: 'Billigst mulig' },
  large: { id: 'large', label: 'Større rom' },
};

/** Naborom: samme etasje side om side, og rett over/under. */
export function neighbours(no) {
  const f = +no[0], n = +no.slice(1);
  const out = [];
  if (n > 1) out.push(`${f}0${n - 1}`);
  if (n < 5) out.push(`${f}0${n + 1}`);
  out.push(`${f === 1 ? 2 : 1}0${n}`);
  return out;
}

/** Hvordan et rom passer et ønske: 'met' | 'neutral' | 'missed' */
export function wishFit(wish, no) {
  const r = ROOM_BY_NO[no];
  if (!r || !wish) return 'neutral';
  switch (wish) {
    case 'quiet': return r.tags.includes('quiet') ? 'met' : r.tags.includes('noisy') ? 'missed' : 'neutral';
    case 'near': return r.tags.includes('near') ? 'met' : r.floor === 2 ? 'missed' : 'neutral';
    case 'view': return r.tags.includes('view') ? 'met' : 'missed';
    case 'cheap': return r.type === 'standard' ? 'met' : r.type === 'suite' ? 'missed' : 'neutral';
    case 'large': return r.type !== 'standard' ? 'met' : 'missed';
    default: return 'neutral';
  }
}

export function priceFor(type, nights) {
  const p = ROOM_TYPES[type].price;
  return nights <= 0 ? Math.round(p * 0.6 / 10) * 10 : p * nights;
}
