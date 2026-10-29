// Alle reisende i spillet. Dette er fiktive karikaturfigurer laget for spillet – ikke
// beskrivelser av virkelige personer som eventuelt deler navnene.
//
// look: parametre til SVG-portrettet (src/ui/Portrait.js)
// arch: hvilken replikkbank karakteren bruker (src/data/dialogueBanks.js)
// traits: humør-startverdier og følsomhet for press/ros
// anim: idle-animasjon i vinduet
// sig: signaturreplikker som blandes inn i arketype-banken

const K = { blue: '#2b4b9b', red: '#b8322a', yellow: '#e2b23a' };

export const CHARACTERS = [
  // ───────────── HOVEDKARAKTERER ─────────────
  {
    id: 'ron', name: 'Ron Walter Knutsen', first: 'Ron', main: true, arch: 'ron',
    birth: { d: 3, m: 4, y: 1958 }, hometown: 'Kautokeino', nationality: 'NORGE',
    traits: { nerv: 0, irr: 5, joy: 10, sens: { nerv: 0.1, irr: 0.35, joy: 0.4 }, evasive: ['baggage', 'purpose'], smuggle: 0.25 },
    anim: 'still', voice: { pitch: 0.78, type: 'm' },
    look: {
      skin: '#c48a5c', head: 'round', headW: 1.08, headH: 0.95, hair: 'short_sides', hairColor: '#b9b2a6',
      hat: 'sami', hatColor: K.blue, eyes: 'tired', brows: 'bushy', browColor: '#9c968c', nose: 'potato', noseSize: 1.25,
      teeth: 'gap', beard: 'stubble', beardColor: '#a39d93', ears: 'big', extras: ['wrinkles', 'bags'],
      outfit: 'kofte', outfitColor: K.blue, outfitColor2: K.red, outfitColor3: K.yellow, build: 'normal', height: 46,
    },
  },
  {
    id: 'tom', name: 'Tom Andreasen', first: 'Tom', main: true, arch: 'tom',
    birth: { d: 17, m: 8, y: 1986 }, hometown: 'Alta', nationality: 'NORGE',
    traits: { nerv: 0, irr: 15, joy: 20, sens: { nerv: 0.2, irr: 1.3, joy: 0.8 }, smuggle: 0.35 },
    anim: 'lean', voice: { pitch: 0.7, type: 'm' },
    look: {
      skin: '#eab08d', head: 'square', headW: 1.32, headH: 1.12, hair: 'flat_top', hairColor: '#e2bd55',
      eyes: 'small', brows: 'thick', browColor: '#a8812c', nose: 'bulb', noseSize: 1.2, teeth: 'crooked',
      ears: 'normal', extras: ['stubble_shadow'], outfit: 'parka', outfitColor: '#c23b2e', outfitColor2: '#7d1f18', build: 'huge', height: -6,
    },
  },
  {
    id: 'arild', name: 'Arild Åsbakk', first: 'Arild', main: true, arch: 'arild',
    birth: { d: 29, m: 1, y: 1991 }, hometown: 'Tromsø', nationality: 'NORGE',
    traits: { nerv: 5, irr: 30, joy: 0, sens: { nerv: 0.4, irr: 1.2, joy: 0.3 }, evasive: ['baggage'], smuggle: 0.3 },
    anim: 'sway', voice: { pitch: 1.0, type: 'm' },
    look: {
      skin: '#e9c0a0', head: 'long', headW: 0.86, headH: 1.22, hair: 'side_part', hairColor: '#2b211c',
      glasses: 'square', eyes: 'squint', brows: 'thin', browColor: '#2b211c', nose: 'long', noseSize: 1.2,
      teeth: 'small', beard: 'thin', beardColor: '#2b211c', ears: 'normal', outfit: 'anorak', outfitColor: '#3c4a3a', outfitColor2: '#232b22',
      build: 'thin', height: -48,
    },
  },
  {
    id: 'daniel', name: 'Daniel Holand', first: 'Daniel', main: true, arch: 'daniel',
    birth: { d: 11, m: 6, y: 1979 }, hometown: 'Skibotn', nationality: 'NORGE',
    traits: { nerv: 0, irr: 0, joy: 45, sens: { nerv: 0.3, irr: 0.4, joy: 1.1 }, evasive: ['purpose', 'dest', 'baggage', 'papers', 'age', 'duration'], smuggle: 0.2 },
    anim: 'lecture', voice: { pitch: 1.05, type: 'm' },
    look: {
      skin: '#e3ad86', head: 'egg', headW: 1.0, headH: 1.04, hair: 'thin_top', hairColor: '#7a6a58',
      eyes: 'friendly', brows: 'normal', browColor: '#6e6152', nose: 'button', noseSize: 1.15, teeth: 'smile',
      beard: 'stubble', beardColor: '#8f8a84', ears: 'normal', extras: ['smirk', 'wrinkles'], outfit: 'fleece', outfitColor: '#4c7a43', outfitColor2: '#2e4d29',
      build: 'normal', height: 4,
    },
  },
  {
    id: 'adrian', name: 'Adrian Bror', first: 'Adrian', main: true, arch: 'adrian',
    birth: { d: 2, m: 2, y: 1998 }, hometown: 'Narvik', nationality: 'NORGE',
    traits: { nerv: 0, irr: 10, joy: 10, sens: { nerv: 0.3, irr: 0.9, joy: 0.9 }, evasive: ['name', 'purpose', 'baggage', 'papers'], smuggle: 0.3 },
    anim: 'wide', voice: { pitch: 0.82, type: 'm' },
    look: {
      skin: '#d9a17a', head: 'wide', headW: 1.18, headH: 1.0, hair: 'buzz', hairColor: '#161210',
      eyes: 'mog', brows: 'thick', browColor: '#161210', nose: 'wide', noseSize: 1.0, teeth: 'clenched',
      beard: 'jaw_shadow', ears: 'small', outfit: 'sweater_black', outfitColor: '#1d1b1f', outfitColor2: '#0f0e10',
      build: 'broad', height: -10,
    },
  },
  {
    id: 'konrad', name: 'Konrad Børli', first: 'Konrad', main: true, arch: 'konrad',
    birth: { d: 23, m: 9, y: 2001 }, hometown: 'Finnsnes', nationality: 'NORGE',
    traits: { nerv: 35, irr: 0, joy: 5, sens: { nerv: 1.4, irr: 0.3, joy: 0.6 }, smuggle: 0.65 },
    anim: 'dart', voice: { pitch: 1.18, type: 'm' },
    look: {
      skin: '#f0c7a6', head: 'egg', headW: 0.94, headH: 1.06, hair: 'middle_part', hairColor: '#a77a4c',
      eyes: 'wide', brows: 'worried', browColor: '#8c6440', nose: 'pointy', noseSize: 1.1, teeth: 'buck',
      ears: 'big', extras: ['sweaty', 'blush_faint'], outfit: 'shirt_tie', outfitColor: '#d9d5c7', outfitColor2: '#8f2b2b',
      build: 'thin', height: 10,
    },
  },
  {
    id: 'jacob', name: 'Jacob Anthon Zen', first: 'Jacob', main: true, arch: 'jacob',
    birth: { d: 7, m: 5, y: 2000 }, hometown: 'Harstad', nationality: 'NORGE',
    traits: { nerv: 0, irr: 0, joy: 75, sens: { nerv: 0.2, irr: 0.3, joy: 1.2 }, smuggle: 0.2 },
    anim: 'bounce', voice: { pitch: 1.35, type: 'm' },
    look: {
      skin: '#f1c39d', head: 'round', headW: 1.0, headH: 0.96, hair: 'fluffy', hairColor: '#7b4a2b',
      eyes: 'big', brows: 'happy', browColor: '#5e3820', nose: 'button', noseSize: 1.0, teeth: 'grin',
      ears: 'normal', extras: ['blush', 'freckles'], outfit: 'hoodie', outfitColor: '#e2b63a', outfitColor2: '#a07a1c',
      build: 'small', height: 62,
    },
  },
  // ───────────── EKSTRA NPC-ER ─────────────
  {
    id: 'vebjorn', name: 'Vebjørn Arve Laksosnes', first: 'Vebjørn', arch: 'vebjorn', special: true,
    birth: { d: 30, m: 12, y: 1999 }, hometown: 'Lakselv', nationality: 'NORGE',
    traits: { nerv: 10, irr: 0, joy: 60, sens: { nerv: 0.5, irr: 0.4, joy: 1.0 }, smuggle: 0.25 },
    anim: 'restless', voice: { pitch: 1.25, type: 'm' },
    look: {
      skin: '#eebf98', head: 'egg', headW: 0.95, headH: 1.0, hair: 'slick_fluffy', hairColor: '#b58350',
      eyes: 'wild', brows: 'raised', browColor: '#8a5e33', nose: 'pointy', noseSize: 1.05, teeth: 'crooked_grin',
      ears: 'normal', extras: ['freckles'], outfit: 'tracksuit', outfitColor: '#2a8f8a', outfitColor2: '#6b3a8f',
      build: 'thin', height: 6,
    },
  },
  {
    id: 'birger', name: 'Birger-Johan Esjeholm Jacobsen', first: 'Birger-Johan', arch: 'grumpy',
    birth: { d: 14, m: 3, y: 1951 }, hometown: 'Båtsfjord', nationality: 'NORGE',
    traits: { nerv: 0, irr: 35, joy: 0, sens: { nerv: 0.2, irr: 1.0, joy: 0.3 }, smuggle: 0.35 },
    anim: 'still', voice: { pitch: 0.72, type: 'm' },
    sig: {
      greet: ['Ja ja. Gjør det du må. Æ har stått i kø siden sekstitallet.', 'Fy faen, det e kaldt. Og du sitt der inne i varmen.'],
      idle: ['I min tid hadde vi ikkje papira. Vi hadde ansikt.', 'Æ har sko som e eldre enn deg.'],
    },
    look: {
      skin: '#d6a07f', head: 'pear', headW: 1.08, headH: 1.05, hair: 'bald_ring', hairColor: '#e2ddd5',
      hat: 'fur', hatColor: '#4a3828', eyes: 'squint', brows: 'bushy', browColor: '#e2ddd5', nose: 'hook', noseSize: 1.35,
      teeth: 'missing', beard: 'mustache', beardColor: '#e2ddd5', ears: 'big', extras: ['wrinkles', 'bags', 'mole'],
      outfit: 'lusekofte', outfitColor: '#28303f', outfitColor2: '#e9e4d8', build: 'normal', height: 30,
    },
  },
  {
    id: 'sondre', name: 'Sondre Karlsen', first: 'Sondre', arch: 'dramatic',
    birth: { d: 9, m: 7, y: 2003 }, hometown: 'Bodø', nationality: 'NORGE',
    traits: { nerv: 10, irr: 5, joy: 35, sens: { nerv: 0.6, irr: 0.6, joy: 0.9 }, smuggle: 0.2 },
    anim: 'sway', voice: { pitch: 1.05, type: 'm' },
    sig: {
      greet: ['Hei! Æ har en merkelig følelse av at æ har laga hele denne grenseovergangen.', 'Grensepost 69. Hehe. Det navnet e det nån som har tenkt mye på.'],
      idle: ['Den lampa der flimre litt for mye. Det må æ se på i neste oppdatering.', 'Visste du at du e styrt av en regelmotor? Nei? Glem det.', 'Pass på bok nummer to i regelboka. Den e skrevet av en idiot. Æ.'],
    },
    look: {
      skin: '#edc19f', head: 'egg', headW: 0.98, headH: 1.04, hair: 'messy', hairColor: '#4a3122',
      eyes: 'tired', brows: 'normal', browColor: '#3c281b', nose: 'long', noseSize: 1.0, teeth: 'smile',
      ears: 'normal', extras: ['bags'], outfit: 'hoodie', outfitColor: '#3a3f58', outfitColor2: '#262a3c', build: 'normal', height: 0,
    },
  },
  {
    id: 'einar', name: 'Einar Abel Prestegård Aars', first: 'Einar', arch: 'polite',
    birth: { d: 1, m: 10, y: 1968 }, hometown: 'Harstad', nationality: 'NORGE',
    traits: { nerv: 15, irr: 5, joy: 15, sens: { nerv: 0.8, irr: 0.7, joy: 0.6 }, smuggle: 0.2 },
    anim: 'still', voice: { pitch: 0.95, type: 'm' },
    sig: {
      greet: ['God aften. Æ har tatt med kopier av kopiene, i tilfelle.', 'Einar Abel Prestegård Aars. Alle fire navnan, takk.'],
      idle: ['Æ ser at blekket i stempelet ditt e litt tørt. Bare en observasjon.', 'Har du vurdert å laminere regelboka?'],
    },
    look: {
      skin: '#f0c9ab', head: 'long', headW: 0.92, headH: 1.12, hair: 'comb_over', hairColor: '#8a7f73',
      glasses: 'round', eyes: 'small', brows: 'thin', browColor: '#6d645a', nose: 'long', noseSize: 1.25, teeth: 'small',
      beard: 'mustache', beardColor: '#8a7f73', ears: 'big', extras: ['wrinkles'], outfit: 'suit', outfitColor: '#4a4436', outfitColor2: '#8a2b2b',
      build: 'thin', height: -20,
    },
  },
  {
    id: 'marie', name: 'Marie Edvardsen Løkaas', first: 'Marie', arch: 'cute',
    birth: { d: 21, m: 2, y: 2002 }, hometown: 'Svolvær', nationality: 'NORGE',
    traits: { nerv: 10, irr: 0, joy: 55, sens: { nerv: 0.7, irr: 0.5, joy: 1.0 }, smuggle: 0.2 },
    anim: 'bounce', voice: { pitch: 1.45, type: 'f' },
    sig: {
      greet: ['Haiii! Du har verdens søteste lille bu! Kan æ få ta bilde av den?', 'Hei hei! Æ har med kanelbolle til deg. Nei vent, æ spiste den.'],
      idle: ['Lampa di ser ut som en liten trist sopp. Æ elske den.', 'Kan du stemple meg i panna også? For moro skyld?'],
    },
    look: {
      skin: '#f4cdb0', head: 'round', headW: 1.0, headH: 0.98, hair: 'pigtails', hairColor: '#d8a24a',
      eyes: 'sparkle', brows: 'happy', browColor: '#a7782c', nose: 'button', noseSize: 0.9, teeth: 'cat',
      ears: 'normal', extras: ['blush', 'freckles'], outfit: 'cardigan', outfitColor: '#e58aa6', outfitColor2: '#a94f6a',
      build: 'small', height: 40,
    },
  },
  {
    id: 'leo', name: 'Leo Brumoen Steinlein', first: 'Leo', arch: 'chaotic',
    birth: { d: 13, m: 6, y: 1997 }, hometown: 'Hammerfest', nationality: 'NORGE',
    traits: { nerv: 5, irr: 10, joy: 50, sens: { nerv: 0.5, irr: 0.7, joy: 1.0 }, smuggle: 0.4 },
    anim: 'restless', voice: { pitch: 1.1, type: 'm' },
    sig: {
      greet: ['Yo! Æ har kjørt hit i revers fra Hammerfest. For å se om det gikk.', 'Hallo! Æ e her på vegne av meg sjøl.'],
      idle: ['Har du nånsinne slikka en lyktestolpe? Ikkje gjør det. Eller jo, gjør det.', 'Æ har en teori om at snø e bare kald regn med selvtillit.'],
    },
    look: {
      skin: '#e4b08c', head: 'pear', headW: 1.05, headH: 1.0, hair: 'mohawk', hairColor: '#c94a2a',
      eyes: 'wild', brows: 'raised', browColor: '#8e3a22', nose: 'bulb', noseSize: 1.15, teeth: 'gap',
      beard: 'goatee', beardColor: '#c94a2a', ears: 'big', extras: ['earring', 'scar'], outfit: 'flannel', outfitColor: '#a33a2c', outfitColor2: '#2b2422',
      build: 'normal', height: 0,
    },
  },
  {
    id: 'ylva', name: 'Ylva-Li Olsen Søfting', first: 'Ylva-Li', arch: 'cute',
    birth: { d: 5, m: 12, y: 2001 }, hometown: 'Tromsø', nationality: 'SVERIGE',
    traits: { nerv: 15, irr: 0, joy: 50, sens: { nerv: 0.8, irr: 0.4, joy: 1.1 }, smuggle: 0.25 },
    anim: 'shy', voice: { pitch: 1.5, type: 'f' },
    sig: {
      greet: ['Hei-hei! Æ har strikka en lue til grensebommen. Den så kald ut.', 'Hallooo! Unnskyld at æ e så glad. Det e bare sånn æ e.'],
      idle: ['Du har så fine kontrollknappa. Ka gjør den røde? Ikkje si det. La det vær en hemmelighet.', 'Æ har navngitt snøfnuggan. Den der heter Bjarne.'],
    },
    look: {
      skin: '#f6d6bd', head: 'round', headW: 0.96, headH: 0.98, hair: 'bob', hairColor: '#e9e2cf',
      hat: 'beanie', hatColor: '#7fa8c9', eyes: 'sparkle', brows: 'happy', browColor: '#c8bfa8', nose: 'button', noseSize: 0.85,
      teeth: 'cat', ears: 'small', extras: ['blush'], outfit: 'knit', outfitColor: '#b6d2e6', outfitColor2: '#ffffff', build: 'small', height: 48,
    },
  },
  {
    id: 'salha', name: 'Salha Farrik Abdulkahar', first: 'Salha', arch: 'dramatic',
    birth: { d: 18, m: 4, y: 1995 }, hometown: 'Tromsø', nationality: 'NORGE',
    traits: { nerv: 5, irr: 15, joy: 30, sens: { nerv: 0.4, irr: 0.9, joy: 0.9 }, smuggle: 0.2 },
    anim: 'lecture', voice: { pitch: 1.3, type: 'f' },
    sig: {
      greet: ['Endelig! Æ har stått i snøen så lenge at æ har fått nytt personnummer.', 'God kveld, vakt. Æ forventa ærlig talt en større bu.'],
      idle: ['Den skogen der har ingen stil. Bare grantre. Kjedelig.', 'Æ gir denne grensa tre stjerna av ti. To for lampa.'],
    },
    look: {
      skin: '#b67b55', head: 'egg', headW: 0.95, headH: 1.06, hair: 'long', hairColor: '#1b1411',
      eyes: 'side_eye', brows: 'arched', browColor: '#1b1411', nose: 'long', noseSize: 1.1, teeth: 'smile',
      ears: 'small', extras: ['earring', 'lipstick'], outfit: 'parka', outfitColor: '#c7883a', outfitColor2: '#8a5a1f', build: 'normal', height: 14,
    },
  },
  {
    id: 'ella', name: 'Ella-Sofi Lunde Limstrand', first: 'Ella-Sofi', arch: 'sleepy',
    birth: { d: 26, m: 8, y: 1999 }, hometown: 'Vadsø', nationality: 'NORGE',
    traits: { nerv: 0, irr: 10, joy: 10, sens: { nerv: 0.3, irr: 0.5, joy: 0.5 }, smuggle: 0.2 },
    anim: 'sway', voice: { pitch: 1.2, type: 'f' },
    sig: {
      greet: ['*gjesp* ...e dette Finland? Nei? Okei. Æ venta.', 'Hei. Æ har vært våken i trettiseks timer. Spør langsomt.'],
      idle: ['Den lyden der... e det vind, eller e det mæ som sovne?', 'Hvis æ lukke øynan, e æ fortsatt i kø?'],
    },
    look: {
      skin: '#efc8a8', head: 'round', headW: 1.0, headH: 1.02, hair: 'messy_bun', hairColor: '#5b3a28',
      eyes: 'sleepy', brows: 'normal', browColor: '#4a2e1f', nose: 'potato', noseSize: 1.0, teeth: 'small',
      ears: 'normal', extras: ['bags', 'freckles'], outfit: 'knit', outfitColor: '#8a7a9e', outfitColor2: '#5a4c6e', build: 'normal', height: 22,
    },
  },
  {
    id: 'liam', name: 'Liam Emil Solem-Solstad', first: 'Liam', arch: 'conspiracy',
    birth: { d: 4, m: 11, y: 1993 }, hometown: 'Kirkenes', nationality: 'NORGE',
    traits: { nerv: 30, irr: 15, joy: 5, sens: { nerv: 1.0, irr: 0.8, joy: 0.4 }, smuggle: 0.3 },
    anim: 'dart', voice: { pitch: 1.0, type: 'm' },
    sig: {
      greet: ['Ikkje se på lampa. Den registrere alt.', 'Hei. Æ vet at du vet. Og du vet at æ vet at du vet.'],
      idle: ['Grantrean står for symmetrisk. Det e ikkje naturlig.', 'Kem e det som egentlig ringe på den telefonen din? Har du tenkt på det?'],
    },
    look: {
      skin: '#e8bd9a', head: 'long', headW: 0.9, headH: 1.12, hair: 'messy', hairColor: '#6b5236',
      hat: 'foil', hatColor: '#c9c9c9', eyes: 'wide', brows: 'worried', browColor: '#55412b', nose: 'pointy', noseSize: 1.15, teeth: 'crooked',
      beard: 'thin', beardColor: '#6b5236', ears: 'big', extras: ['bags', 'sweaty'], outfit: 'raincoat', outfitColor: '#d8c13a', outfitColor2: '#8a7a1c',
      build: 'thin', height: -8,
    },
  },
  {
    id: 'matheo', name: 'Matheo Jul Schrøder Bråttvik', first: 'Matheo', arch: 'chaotic',
    birth: { d: 24, m: 12, y: 1996 }, hometown: 'Lyngseidet', nationality: 'NORGE',
    traits: { nerv: 5, irr: 5, joy: 60, sens: { nerv: 0.5, irr: 0.6, joy: 1.1 }, smuggle: 0.35 },
    anim: 'bounce', voice: { pitch: 1.0, type: 'm' },
    sig: {
      greet: ['GOD JUL! Æ vet det e november. Æ starte tidlig. Og slutte seint.', 'Hei! Ska til Rovaniemi for å klage på fjorårets gave.'],
      idle: ['Den lampa der hadde vært fin med juleglitter.', 'Æ har mellomnavn Jul. Det e ikkje en vits. Det e en livsstil.'],
    },
    look: {
      skin: '#eab48f', head: 'round', headW: 1.12, headH: 1.0, hair: 'curly', hairColor: '#3a2416',
      hat: 'santa', hatColor: '#c0302a', eyes: 'big', brows: 'raised', browColor: '#3a2416', nose: 'bulb', noseSize: 1.2, teeth: 'grin',
      beard: 'full', beardColor: '#3a2416', ears: 'normal', extras: ['blush'], outfit: 'lusekofte', outfitColor: '#9a2a24', outfitColor2: '#f1ead8',
      build: 'broad', height: 8,
    },
  },
  {
    id: 'theaa', name: 'Thea Aurora Wikerholmen', first: 'Thea Aurora', arch: 'dramatic',
    birth: { d: 22, m: 9, y: 1998 }, hometown: 'Honningsvåg', nationality: 'NORGE',
    traits: { nerv: 5, irr: 10, joy: 40, sens: { nerv: 0.5, irr: 0.8, joy: 1.0 }, smuggle: 0.2 },
    anim: 'lecture', voice: { pitch: 1.35, type: 'f' },
    sig: {
      greet: ['Åh, du ser ut som en som aldri har sett nordlyset ordentlig.', 'Kveld. Æ har nordlys i mellomnavnet og skuffelse i blikket.'],
      idle: ['Himmelen e så stille i natt. Det e nesten frekt.', 'Skulle ønske denne bua hadde et takvindu. For nordlyset. For meg.'],
    },
    look: {
      skin: '#f2cdb4', head: 'egg', headW: 0.94, headH: 1.04, hair: 'long_wavy', hairColor: '#6a2f5a',
      eyes: 'side_eye', brows: 'arched', browColor: '#3e1b33', nose: 'pointy', noseSize: 0.95, teeth: 'smile',
      ears: 'small', extras: ['lipstick', 'mole'], outfit: 'coat_fur', outfitColor: '#2c6b6a', outfitColor2: '#d9d2c2', build: 'normal', height: 16,
    },
  },
  {
    id: 'cassandra', name: 'Cassandra Strand Hansen', first: 'Cassandra', arch: 'conspiracy',
    birth: { d: 13, m: 1, y: 1990 }, hometown: 'Vardø', nationality: 'NORGE',
    traits: { nerv: 10, irr: 10, joy: 10, sens: { nerv: 0.6, irr: 0.6, joy: 0.5 }, smuggle: 0.2 },
    anim: 'still', voice: { pitch: 1.2, type: 'f' },
    sig: {
      greet: ['Æ visste du kom til å si det.', 'Hei igjen. For mæ e det ikkje første gang vi møtes. For deg kanskje.'],
      idle: ['Klokka di kommer til å stoppe snart. Ikkje bli redd da.', 'Han som kommer etter mæ... ikkje se han i øynan.'],
    },
    look: {
      skin: '#eac4a6', head: 'long', headW: 0.92, headH: 1.1, hair: 'long', hairColor: '#20232b',
      eyes: 'stare', brows: 'thin', browColor: '#20232b', nose: 'hook', noseSize: 1.05, teeth: 'small',
      ears: 'normal', extras: ['bags', 'earring'], outfit: 'cloak', outfitColor: '#3a2b4a', outfitColor2: '#1d1626', build: 'thin', height: 10,
    },
  },
  {
    id: 'emilie', name: 'Emilie Bjerk', first: 'Emilie', arch: 'grumpy',
    birth: { d: 6, m: 3, y: 2004 }, hometown: 'Narvik', nationality: 'NORGE',
    traits: { nerv: 0, irr: 40, joy: 0, sens: { nerv: 0.3, irr: 1.1, joy: 0.3 }, smuggle: 0.25 },
    anim: 'still', voice: { pitch: 1.25, type: 'f' },
    sig: {
      greet: ['Ikkje si "god kveld". Den e ikkje god.', 'Ja. Hei. Bare få det overstått.'],
      idle: ['*sukk*', 'Lampa di e stygg. Bare så du vet det.'],
    },
    look: {
      skin: '#f0c6a2', head: 'pear', headW: 0.98, headH: 1.0, hair: 'ponytail', hairColor: '#2b1a12',
      eyes: 'squint', brows: 'angry', browColor: '#2b1a12', nose: 'potato', noseSize: 0.95, teeth: 'clenched',
      ears: 'normal', extras: ['earring'], outfit: 'hoodie', outfitColor: '#2e2e2e', outfitColor2: '#1a1a1a', build: 'normal', height: 24,
    },
  },
  {
    id: 'aleksander', name: 'Aleksander Ingebrigtsen', first: 'Aleksander', arch: 'polite',
    birth: { d: 15, m: 5, y: 1994 }, hometown: 'Mo i Rana', nationality: 'NORGE',
    traits: { nerv: 10, irr: 10, joy: 20, sens: { nerv: 0.6, irr: 0.8, joy: 0.7 }, smuggle: 0.2 },
    anim: 'bounce', voice: { pitch: 0.95, type: 'm' },
    sig: {
      greet: ['God kveld. Og nei, æ e ikkje i slekt med nån som løpe fort.', 'Hei. Æ jogga hit. Ikkje spør om tida.'],
      idle: ['Æ kunne løpt rundt grensebommen tre ganga mens du les.', 'Har du vurdert intervalltrening her inne?'],
    },
    look: {
      skin: '#eebd96', head: 'long', headW: 0.95, headH: 1.08, hair: 'side_part', hairColor: '#c49a5b',
      eyes: 'normal', brows: 'normal', browColor: '#9a7440', nose: 'long', noseSize: 1.0, teeth: 'perfect',
      ears: 'normal', extras: ['headband'], outfit: 'tracksuit', outfitColor: '#c73a3a', outfitColor2: '#f2f2f2', build: 'thin', height: -14,
    },
  },
  {
    id: 'martin', name: 'Martin Oleander Sakariassen', first: 'Martin', arch: 'sleepy',
    birth: { d: 19, m: 7, y: 1988 }, hometown: 'Lakselv', nationality: 'FINLAND',
    traits: { nerv: 0, irr: 5, joy: 20, sens: { nerv: 0.3, irr: 0.4, joy: 0.6 }, smuggle: 0.3 },
    anim: 'sway', voice: { pitch: 0.85, type: 'm' },
    sig: {
      greet: ['Hei... æ va nesten her i går òg. Men så sovna æ i bilen.', 'Kveld. Æ ha et oleander-mellomnavn og et sterkt behov for kaffe.'],
      idle: ['Har du en ekstra stol der inne? Bare spør.', 'Snøen e så rolig. Akkurat som en dyne.'],
    },
    look: {
      skin: '#e1ae8b', head: 'wide', headW: 1.12, headH: 0.96, hair: 'long_messy', hairColor: '#8a6a3e',
      eyes: 'sleepy', brows: 'normal', browColor: '#6d5230', nose: 'potato', noseSize: 1.2, teeth: 'small',
      beard: 'full', beardColor: '#8a6a3e', ears: 'normal', extras: ['bags'], outfit: 'flannel', outfitColor: '#3e6b8a', outfitColor2: '#1d2c3a',
      build: 'broad', height: 6,
    },
  },
  {
    id: 'julia', name: 'Julia Hildal Molin', first: 'Julia', arch: 'cute',
    birth: { d: 8, m: 8, y: 2003 }, hometown: 'Alta', nationality: 'FINLAND',
    traits: { nerv: 20, irr: 0, joy: 45, sens: { nerv: 0.9, irr: 0.4, joy: 1.0 }, smuggle: 0.2 },
    anim: 'shy', voice: { pitch: 1.55, type: 'f' },
    sig: {
      greet: ['Hii! Æ e litt nervøs, men på en søt måte!', 'Hei hei! Æ har aldri vært i en grensekontroll før. E du snill?'],
      idle: ['Æ tror lampa di liker mæ.', 'Æ har laga et lite hjerte av snø. Det e til deg. Det smelte nok.'],
    },
    look: {
      skin: '#f5d0b5', head: 'round', headW: 0.97, headH: 1.0, hair: 'bangs_long', hairColor: '#e0b779',
      eyes: 'sparkle', brows: 'worried', browColor: '#b78c50', nose: 'button', noseSize: 0.85, teeth: 'cat',
      ears: 'small', extras: ['blush', 'freckles'], outfit: 'coat_fur', outfitColor: '#e9e0f0', outfitColor2: '#b9a2cc', build: 'small', height: 44,
    },
  },
  {
    id: 'theas', name: 'Thea Sofie Røsnes Holtmo', first: 'Thea Sofie', arch: 'chaotic',
    birth: { d: 31, m: 10, y: 2000 }, hometown: 'Kjøllefjord', nationality: 'NORGE',
    traits: { nerv: 5, irr: 10, joy: 55, sens: { nerv: 0.5, irr: 0.8, joy: 1.0 }, smuggle: 0.35 },
    anim: 'restless', voice: { pitch: 1.4, type: 'f' },
    sig: {
      greet: ['HALLO! Æ har spist en hel pakke kaffe. Ikkje drukket. Spist.', 'Hei! Æ tok feil avkjørsel i Kjøllefjord og her e æ!'],
      idle: ['Kan æ få prøve stempelet? Æ ska bare stemple ett eneste dyr.', 'Æ har lyst å slikke på det vinduet der. Ikkje noe personlig.'],
    },
    look: {
      skin: '#f3c9a8', head: 'pear', headW: 1.0, headH: 1.0, hair: 'space_buns', hairColor: '#3fae8a',
      eyes: 'wild', brows: 'raised', browColor: '#2a7a5f', nose: 'pointy', noseSize: 1.0, teeth: 'gap',
      ears: 'normal', extras: ['freckles', 'earring', 'blush'], outfit: 'raincoat', outfitColor: '#e8572a', outfitColor2: '#a63a18', build: 'small', height: 34,
    },
  },
  {
    id: 'hassan', name: 'Hassan Gill', first: 'Hassan', arch: 'sleepy',
    birth: { d: 27, m: 2, y: 1984 }, hometown: 'Tromsø', nationality: 'NORGE',
    traits: { nerv: 0, irr: 10, joy: 25, sens: { nerv: 0.3, irr: 0.5, joy: 0.7 }, smuggle: 0.2 },
    anim: 'still', voice: { pitch: 0.88, type: 'm' },
    sig: {
      greet: ['Kveld, kollega. Æ jobbe òg nattskift. Vi e samma slags gale.', 'Hei. Ikkje bry dæ om ringan under øynan. De e fast inventar.'],
      idle: ['Nattskift e en livsstil. Dessverre.', 'Du har bedre stol enn mæ. Det e det eneste æ e misunnelig på.'],
    },
    look: {
      skin: '#a8714f', head: 'square', headW: 1.06, headH: 1.04, hair: 'short_curly', hairColor: '#17110e',
      eyes: 'tired', brows: 'thick', browColor: '#17110e', nose: 'wide', noseSize: 1.15, teeth: 'smile',
      beard: 'full_short', beardColor: '#17110e', ears: 'normal', extras: ['bags'], outfit: 'hivis', outfitColor: '#e2d23a', outfitColor2: '#8a8a8a',
      build: 'broad', height: -4,
    },
  },
  {
    // Oppdatering 1.1: selvsikker, glamorøs innholdsprodusent (OF). Fiktiv voksen karakter.
    id: 'lina', name: 'Lina Elise Olsen Urud', first: 'Lina', arch: 'lina',
    birth: { d: 10, m: 4, y: 1997 }, hometown: 'Kirkenes', nationality: 'NORGE',
    traits: { nerv: 5, irr: 15, joy: 55, sens: { nerv: 0.4, irr: 1.0, joy: 0.9 }, smuggle: 0.15 },
    anim: 'confident', voice: { pitch: 1.28, type: 'f' },
    look: {
      skin: '#f1c9ad', head: 'egg', headW: 0.95, headH: 1.02, hair: 'glam_waves', hairColor: '#d9a45a',
      eyes: 'glam', shadowColor: '#b26f93', brows: 'arched', browColor: '#6b4423', nose: 'button', noseSize: 0.92, teeth: 'smile',
      ears: 'small', extras: ['blush', 'lipstick', 'mole', 'hoops'], outfit: 'puffer_glam', outfitColor: '#efe4dc', outfitColor2: '#c9a27e',
      build: 'normal', height: 14,
    },
  },
  // ───────────── OPPDATERING 1.2: tre nye NPC-er (fiktive karikaturer) ─────────────
  {
    id: 'eskil', name: 'Eskil Jøed Valdal', first: 'Eskil', arch: 'eskil',
    birth: { d: 19, m: 2, y: 1963 }, hometown: 'Kjøllefjord', nationality: 'NORGE',
    traits: { nerv: 0, irr: 40, joy: 0, sens: { nerv: 0.3, irr: 1.2, joy: 0.4 }, smuggle: 0.3 },
    anim: 'still', voice: { pitch: 0.9, type: 'm' },
    favTemplate: { id: 'shopping', chance: 0.5 }, // Eskil handler helst der det er billigst
    look: {
      skin: '#e3a885', head: 'round', headW: 1.08, headH: 0.94, hair: 'short_sides', hairColor: '#cfc6b8',
      hat: 'gnome', hatColor: '#b8322a', eyes: 'squint', brows: 'bushy', browColor: '#d8d0c2', nose: 'potato', noseSize: 1.38,
      teeth: 'clenched', beard: 'stubble', beardColor: '#bdb5a8', ears: 'big', extras: ['wrinkles', 'bags'],
      outfit: 'anorak', outfitColor: '#6b5236', outfitColor2: '#4a3824', build: 'small', height: 88,
    },
  },
  {
    id: 'sigvart', name: 'Sigvart Vassbotn', first: 'Sigvart', arch: 'sigvart',
    birth: { d: 14, m: 6, y: 2001 }, hometown: 'Lyngseidet', nationality: 'NORGE',
    traits: { nerv: 30, irr: 0, joy: 15, sens: { nerv: 1.1, irr: 0.4, joy: 0.7 }, smuggle: 0.25 },
    anim: 'shy', voice: { pitch: 1.08, type: 'm' },
    // Familielikhet med Sakarias: samme hodeform, nese, brynform og hårstruktur – lysere hår, slankere
    look: {
      skin: '#efc4a2', head: 'long', headW: 0.92, headH: 1.08, hair: 'side_part', hairColor: '#e8d48c',
      eyes: 'normal', brows: 'worried', browColor: '#bfa45e', nose: 'long', noseSize: 1.05, teeth: 'small',
      ears: 'normal', extras: ['blush_faint'], outfit: 'knit', outfitColor: '#5f7a8c', outfitColor2: '#3e5160',
      build: 'thin', height: -6,
    },
  },
  {
    id: 'sakarias', name: 'Sakarias Vassbotn', first: 'Sakarias', arch: 'sakarias',
    birth: { d: 3, m: 2, y: 1998 }, hometown: 'Lyngseidet', nationality: 'NORGE',
    traits: { nerv: 0, irr: 15, joy: 25, sens: { nerv: 0.3, irr: 0.6, joy: 0.6 }, smuggle: 0.3 },
    anim: 'wide', voice: { pitch: 0.86, type: 'm' },
    look: {
      skin: '#e6b691', head: 'long', headW: 1.04, headH: 1.08, hair: 'side_part', hairColor: '#6b4a2b',
      eyes: 'squint', brows: 'normal', browColor: '#4a3220', nose: 'long', noseSize: 1.08, teeth: 'smile',
      beard: 'stubble', beardColor: '#4a3220', ears: 'normal', extras: ['smirk'], outfit: 'parka', outfitColor: '#2f4258', outfitColor2: '#1d2a38',
      build: 'broad', height: -4,
    },
  },
];

// Lina har som regel med seg en innspilling (oppdatering 1.1)
CHARACTERS.find((c) => c.id === 'lina').favTemplate = { id: 'lina_shoot', chance: 0.75 };

export const CHAR_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));
export const ALL_NAMES = CHARACTERS.map((c) => c.name);

// Fast passnummer per person (deterministisk) – samme person viser samme pass ved gjenbesøk.
import { hashString } from '../core/rng.js';
export function basePassNo(char) {
  const h = hashString(char.id + ':pass');
  const code = char.nationality === 'FINLAND' ? 'FI' : char.nationality === 'SVERIGE' ? 'SE' : 'NO';
  return `${code}${String(h % 9000 + 1000)}${String((h >>> 13) % 9000 + 1000)}`;
}
