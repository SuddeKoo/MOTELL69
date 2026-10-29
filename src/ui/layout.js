// Koordinater (scene 1600×900) målt opp i Higgsfield-bakgrunnene i public/assets/bg/.
// Bytter du bakgrunnsbilde, justerer du bare tallene her – alle interaktive lag følger med.
export const W = 1600, H = 900;

export const BG = {
  menu: 'assets/bg/menu_exterior.jpg',
  left: 'assets/bg/reception_left.jpg',
  center: 'assets/bg/reception_center.jpg',
  right: 'assets/bg/reception_right.jpg',
};

export const CENTER = {
  counterTop: 562,                 // øverste kant av SVG-disken (src/ui/art/counter.js): gjestene skjules under den
  door: { x: 424, y: 112, w: 176, h: 400 },
  window: { x: 768, y: 112, w: 488, h: 308 },
  hall: { x: 1448, y: 104, w: 144, h: 496 },
  lamp: { x: 656, y: 38, w: 384, h: 30 },
  guest: { x: 800, bottom: 720, w: 430 },            // gjesten ved disken (midt-x)
  // Faste venteplasser: nr. 2 ved døra, nr. 3 ved vinduet. Ingen står i veien for disken.
  queue: [{ x: 470, bottom: 646, s: 0.62 }, { x: 1180, bottom: 646, s: 0.6 }],
  enter: { x: 512, bottom: 600, s: 0.42 },
  exitHall: { x: 1530, bottom: 640, s: 0.5 },
  turn: { x: 780, bottom: 668, s: 0.8 },              // første steg bakover fra disken (overlapper ingen venteplass)
  // Gjenstander på disken
  bell: { x: 336, y: 520, w: 74, h: 62 },             // på den hevede kanten
  penCup: { x: 418, y: 572, w: 50, h: 86 },
  book: { x: 70, y: 670, w: 300, h: 168 },
  idMat: { x: 432, y: 650, w: 250, h: 150 },          // dokumentkontroll
  idSpot: { x: 470, y: 670, w: 168, h: 104 },
  keyMat: { x: 698, y: 640, w: 240, h: 96 },          // nøkkeloverlevering
  counterKey: { x: 772, y: 652, w: 92, h: 56 },
  imprinter: { x: 980, y: 646, w: 180, h: 104 },      // betaling
  tray: { x: 960, y: 772, w: 132, h: 62 },
  mug: { x: 1118, y: 766, w: 72, h: 86 },
  speech: { x: 1028, y: 108, w: 350 },
  panel: { x: 1206, y: 400, w: 376, h: 484 },
  note: { x: 420, y: 812, w: 230, h: 76 },
};

export const LEFT = {
  counterTop: 574,                 // samme SVG-disk (vingen mot veggen)
  window: { x: 32, y: 80, w: 216, h: 492 },
  board: { x: 788, y: 176, w: 560, h: 316 },
  phone: { x: 300, y: 470, w: 380, h: 250 },
  notepad: { x: 720, y: 596, w: 250, h: 230 },
  call: { x: 270, y: 60, w: 500, h: 400 },
};

export const RIGHT = {
  counterTop: 518,                 // pulten (COUNTER_RIGHT) foran romkartet
  cork: { x: 340, y: 136, w: 644, h: 296 },
  whiteboard: { x: 1048, y: 192, w: 264, h: 200 },
  card: { x: 372, y: 548, w: 600, h: 336 },          // romkortet ligger på pulten
};
