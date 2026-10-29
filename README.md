# MOTELL69

Spill nummer 3 i NordNorge 69-serien (etter NATTSKIFT 69 og KIOSK69). Du har nattevakta i resepsjonen på et
slitent veikantmotell langs E6: ti rom, ett nøkkelbrett, én telefon, én renholder – og alle de 30 originale figurene.

Rent nettleserspill (HTML/CSS/JS + Vite). Ingen backend, ingen AI eller betalte API-er under spilling.

## Kjøre lokalt

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # statisk bygg i dist/
npm run preview    # test produksjonsbygget lokalt
node scripts/sim.mjs 4 6969   # hodeløs test: 4 nattskift med bot-resepsjonist + konsistenssjekk
```

## Publisering (Render)

Repoet har en `render.yaml` (Render Blueprint) for en gratis **Static Site**:
build-kommando `npm ci && npm run build`, publiseringsmappe `dist`, automatisk deploy ved hver commit til `main`.
Oppdateringer publiseres slik:

```bash
git add -A
git commit -m "Beskrivelse av endringen"
git push
```

Render bygger og legger ut den nye versjonen selv etter et par minutter.

## Kontroller

| | |
|---|---|
| **A / D** eller **← / →** | Bytt kameravinkel (telefon og nøkler · resepsjon · romkart) |
| **Esc** | Lukk bok/legitimasjon, ellers pause |
| **Mus** | Klikk på gjenstander, dra/klikk nøkkelen på gjesten, velg replikker |

En nøkkel du har plukket opp, bæres med på tvers av kameravinkler (du trenger ikke holde museknappen).
«Legg i skåla» legger den fra deg på disken.

## Spillflyt

**Innsjekking:** gjesten sier navn → finn reservasjonen i boka (eller skriv inn ny for drop-in) → be om legitimasjon
og undersøk den (navn, bilde, reservasjon) → velg rom på romkartet (D) → ta betalt på kortpressa → hent nøkkelen på
brettet (A) → gi den til gjesten. Rommet blir OPPTATT og nøkkelen forsvinner fra brettet.

**Utsjekking:** ta imot nøkkelen → registrer utsjekking → rommet blir SKITTENT → heng nøkkelen tilbake → send renholderen.

**Telefonen** ringer fra faktiske gjester (lampa for rommet blinker), fra folk som vil bestille eller spør om
ledige rom, gjester som vil forlenge eller lurer på noe, og innimellom fra noen som har ringt feil. Etter hver samtale
er det stille en stund, samme slags samtale kommer sjelden to ganger på rad, og vekking er sjelden (høyst én
forespørsel per natt). Ubesvarte gjester ringer igjen og kommer til slutt ned i resepsjonen.
Du kan også ringe rommene selv (vekking, be bråkete gjester dempe seg).

**Køen:** én gjest ved disken om gangen; de andre står på faste venteplasser (ved døra og ved vinduet).
Neste gjest går ikke fram før forrige faktisk har gått ut (animasjonen bekrefter det til spillogikken).

**Rom og naboer:** bråkete gjester (Tom, Matheo, Vebjørn, Leo, Thea Sofie) forstyrrer følsomme naboer (Ella, Arild,
Einar, Hassan …) på siden av og over/under. Kalde rom gir klager. Romønsker (rolig, nær, utsikt, billig, stort)
påvirker tilfredsheten litt.

**Rombytte** er ekte: velg «Flytt gjest» på romkartet → velg nytt rom → gjesten kommer ned, leverer gammel nøkkel
og får ny. Senere samtaler kommer fra det nye rommet.

**Skift:** 20:00–08:00 over ca. 17 minutter (15/17/20 i innstillingene). Gjester, reservasjoner, rom, nøkler,
hukommelse, renholder og økonomi følger med til neste natt. Dagvakta vasker det meste mellom skiftene.

## Kodestruktur

```
src/
  core/        rng (fra startpakken), buss, innstillinger, hjelpere
  data/        characters.js + vocals.js (originaler), rooms.js, motelProfiles.js, dialogue/ (base, arketype, 30 figurer)
  game/        G (felles tilstand), motel (rom/reservasjoner/gjester/nøkler), desk, phone, issues, cleaner,
               director (tempo), Game (klokke/skift), save (versjon, migrering, reparasjon)
  audio/       Audio.js (Web Audio, lydbilder ute/inne, telefon, syntetiske lyder)
  ui/          Portrait.js (original, uendret), PortraitView, props (nøkler, telefon, bok …), layout.js,
               art/counter.js (resepsjonsdisken som SVG), views/ (Left, Center, Right), Book, IdModal, Hud, Menu, Snow
public/assets/ bg/ (Higgsfield), audio/ (NOX SOUND CC0 + startpakken)
art_src/       Higgsfield-originaler i full oppløsning (2736×1536 PNG)
scripts/       convert-audio.mjs, convert-bg.mjs, preview-counter.mjs, sim.mjs
docs/          higgsfield-prompts.md, lydkilder.md, karakterprofiler/
```

`src/ui/layout.js` har alle koordinater målt i bakgrunnsbildene. Bytter du et bakgrunnsbilde, justerer du tallene der –
alle interaktive lag (nøkkelbrett, telefon, romkart, disk, gjester) følger med.

## Grafikk

- De fire bakgrunnene er generert med Higgsfield (FLUX 3) med NATTSKIFT 69- og KIOSK69-bildene som stilreferanser.
  Se `docs/higgsfield-prompts.md` for prompter, modell og kredittforbruk.
- De 30 figurene tegnes med originalens SVG-system (`Portrait.js`, `characters.js`) – ikke generert på nytt.
- Telefon, nøkler, bok, kortpresse, romkart, tavle, ID-kort og alt annet interaktivt er egne lag oppå bakgrunnene.
- Resepsjonsdisken er et eget SVG-forgrunnslag (`src/ui/art/counter.js`), samme prinsipp som i KIOSK69:
  bakgrunn → gjester → disk → gjenstander → UI. Den ferdigtegnede disken er fjernet fra senterbildet
  (`scripts/convert-bg.mjs`). Samme disk/pult går igjen i alle tre vinkler (vingen med telefonen til venstre,
  pulten foran romkartet til høyre), så det føles som én resepsjon.

## Lyd

Se `docs/lydkilder.md`. Ingen musikk, ingen forteller. Lyden starter etter første klikk (nettleserens autoplay-regler).
