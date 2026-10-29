// Hvordan hver av de 30 originale figurene oppfører seg som MOTELLGJEST.
// Bygget på temperamentet i characters.js (traits/anim) og stemmen i de originale replikkbankene.
//
// wishes:     romønsker de nevner (det første er viktigst)
// type:       romtypen de helst bestiller
// nights:     [min, maks] netter (0 = bare noen timer)
// patience:   ganger normal tålmodighet ved disken
// loud:       lager støy på rommet om kvelden (naboer kan klage)
// sensitive:  tåler dårlig støy og trekk
// complain:   hvor ofte de tar kontakt med problemer (1 = normalt)
// demands:    kommer med urimelige krav
// haggle:     prøver å prute
// forgetsId:  sjanse for å ha glemt legitimasjonen
// wrongName:  sjanse for å si navnet litt feil (trøtt/nervøs)

export const MOTEL = {
  ron: { wishes: ['view'], type: 'standard', nights: [1, 3], patience: 1.6, complain: 0.35 },
  tom: { wishes: ['large'], type: 'suite', nights: [1, 2], patience: 0.7, loud: true, complain: 1.3, demands: true },
  arild: { wishes: ['quiet'], type: 'standard', nights: [1, 2], patience: 0.85, sensitive: true, complain: 1.5 },
  daniel: { wishes: ['quiet', 'view'], type: 'komfort', nights: [1, 2], patience: 1.25, complain: 0.7 },
  adrian: { wishes: ['large'], type: 'komfort', nights: [1, 2], patience: 1.0, complain: 0.6 },
  konrad: { wishes: ['near'], type: 'standard', nights: [1, 1], patience: 1.35, sensitive: true, complain: 0.5, forgetsId: 0.2, wrongName: 0.15 },
  jacob: { wishes: [], type: 'standard', nights: [1, 2], patience: 1.6, complain: 0.25 },
  vebjorn: { wishes: [], type: 'standard', nights: [0, 1], patience: 0.6, loud: true, complain: 1.1 },
  birger: { wishes: ['near', 'cheap'], type: 'standard', nights: [1, 3], patience: 0.85, sensitive: true, complain: 1.4 },
  sondre: { wishes: [], type: 'komfort', nights: [1, 2], patience: 1.1, complain: 0.6 },
  einar: { wishes: ['quiet'], type: 'komfort', nights: [1, 2], patience: 1.45, sensitive: true, complain: 0.8 },
  marie: { wishes: ['view'], type: 'standard', nights: [1, 2], patience: 1.25, complain: 0.4 },
  leo: { wishes: [], type: 'standard', nights: [0, 1], patience: 0.9, loud: true, complain: 0.7 },
  ylva: { wishes: ['view'], type: 'standard', nights: [1, 2], patience: 1.3, complain: 0.3 },
  salha: { wishes: ['large', 'view'], type: 'suite', nights: [1, 2], patience: 0.9, complain: 1.2, demands: true },
  ella: { wishes: ['quiet'], type: 'standard', nights: [1, 3], patience: 1.1, sensitive: true, complain: 1.0, wrongName: 0.1 },
  liam: { wishes: ['quiet'], type: 'standard', nights: [1, 2], patience: 0.9, sensitive: true, complain: 1.1 },
  matheo: { wishes: ['large'], type: 'komfort', nights: [1, 2], patience: 1.0, loud: true, complain: 0.5 },
  theaa: { wishes: ['view'], type: 'suite', nights: [1, 2], patience: 1.0, complain: 1.0, demands: true },
  cassandra: { wishes: [], type: 'standard', nights: [1, 2], patience: 1.45, complain: 0.4 },
  emilie: { wishes: ['quiet'], type: 'standard', nights: [1, 1], patience: 0.6, sensitive: true, complain: 1.2 },
  aleksander: { wishes: ['view'], type: 'standard', nights: [1, 1], patience: 1.0, complain: 0.5 },
  martin: { wishes: ['quiet', 'cheap'], type: 'standard', nights: [2, 3], patience: 1.6, complain: 0.3, wrongName: 0.1 },
  julia: { wishes: ['near'], type: 'standard', nights: [1, 2], patience: 1.2, sensitive: true, complain: 0.5, forgetsId: 0.15 },
  theas: { wishes: [], type: 'standard', nights: [0, 1], patience: 0.8, loud: true, complain: 0.8 },
  hassan: { wishes: ['quiet'], type: 'standard', nights: [2, 3], patience: 1.45, sensitive: true, complain: 0.5 },
  lina: { wishes: ['view', 'large'], type: 'suite', nights: [1, 2], patience: 0.8, complain: 1.1, demands: true },
  eskil: { wishes: ['cheap'], type: 'standard', nights: [1, 2], patience: 0.7, complain: 1.5, demands: true, haggle: true },
  sigvart: { wishes: ['quiet'], type: 'standard', nights: [1, 1], patience: 1.35, complain: 0.3, forgetsId: 0.1 },
  sakarias: { wishes: [], type: 'komfort', nights: [1, 2], patience: 0.9, complain: 0.8, demands: true },
};

// Hvem kan finne på å bestille rom til hvem (reservasjon står på et annet navn enn gjesten).
export const BOOKS_FOR = {
  sigvart: 'sakarias',
  sakarias: 'sigvart',
  julia: 'marie',
  marie: 'ylva',
  konrad: 'daniel',
  martin: 'hassan',
  ella: 'theaa',
  emilie: 'birger',
};

export function profileOf(id) {
  return { wishes: [], type: 'standard', nights: [1, 2], patience: 1, complain: 0.6, ...(MOTEL[id] || {}) };
}
