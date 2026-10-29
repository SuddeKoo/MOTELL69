# MOTELL69 – Higgsfield-bakgrunner

## Status (29.10.2026)
Generert etter godkjenning (maks 20 kreditter). **Brukt: 15 kreditter** (5 bilder × 3, FLUX 3, 2K).
GPT Image 2.5 var planlagt, men krever betalt abonnement («Requires basic plan or higher»), så FLUX 3 ble brukt.

| Bilde | Fil | Merknad |
|---|---|---|
| Senter | `art_src/center_v1.png` → `public/assets/bg/reception_center.jpg` | Godkjent på første forsøk |
| Venstre | `art_src/left_v1.png` → `reception_left.jpg` | Senterbildet som referanse for samme interiør |
| Høyre | `art_src/right_v1.png` → `reception_right.jpg` | Senterbildet som referanse |
| Meny | `art_src/menu_v1.png` (forkastet) | KIOSK69-referansen lakk inn: en «KIOSK69»-bod sto foran motellet |
| Meny | `art_src/menu_v2.png` → `menu_exterior.jpg` | Nytt forsøk uten kioskreferansen; resepsjonen er nå en del av motellet |

Stilreferanser som ble lastet opp: brukerens to NATTSKIFT 69-skjermbilder, startpakkens `menu.jpg` og `center.jpg`.
Bildene er skalert til 1920×1080 JPG med `node scripts/convert-bg.mjs`. Koordinatene til alle interaktive lag
står i `src/ui/layout.js`.

## Stilanalyse av referansene

| Referanse | Hva vi tar med |
|---|---|
| NATTSKIFT 69 meny | Mørk granskog, kaldt marineblått, kornete tekstur, lett snøfall, rustne detaljer, venstre tredjedel rolig/mørk for tittel og knapper |
| NATTSKIFT 69 spill | Gatelykt med gul lyskjegle i snøvær, frontal vinkel |
| KIOSK69 meny (`menu.jpg`) | Graphic novel-strek: tykke svarte blekkonturer, skravering, avflasset maling, istapper, rennende rust, varme ravgule vinduer mot blå natt, fjell bak |
| KIOSK69 interiør (`center.jpg`) | Gulnet panelvegg, lysstoffrør, frostede vinduer med snø, slitt flisgulv med skitne fotspor, messingbjelle, veggklokke, frontal ettpunktsperspektiv i øyehøyde |

Palett: ute `#0b1424 → #1f3350` (natt), snø `#9fb2c8`; inne `#c9a15a / #8a6430 / #4a2e1c` (gulnet panel og mørkt treverk), lys `#f2d27a`. Blekk `#1b120c`.

## Felles stilblokk (limes først i hver prompt)

> Hand-drawn 2D graphic-novel illustration for a video game background, thick black ink outlines, cross-hatching, gritty grain and grime texture, worn dirty surfaces, slightly grotesque comic style, muted colours: cold navy-blue winter night outside, warm sickly-yellow fluorescent light inside. A cheap Northern Norwegian roadside motel from the 1980s that was never renovated. Match the drawing style, line weight, texture and colour of the reference images exactly. No people, no animals, no characters, no logos, no modern technology. Not photorealistic. 16:9.

## 1. Hovedmeny – motellet utenfra (`public/assets/bg/menu_exterior.jpg`)

> [STIL] A shabby two-storey roadside motel at night, seen from the snowy parking lot at eye level. Long low building with a flat roof under a thick overhanging layer of snow with icicles. Ground floor has five guest room doors with small windows; an open upstairs walkway with a rusty railing gives access to five more doors, with an exterior staircase at the right end. Faded dark-red wooden cladding with cream trim and peeling paint, rusty gutters. The reception office is at the left end of the building with large frosty windows glowing warm amber and a lit glass door. A few room windows glow dimly behind curtains, most are dark. On the left a tall rusty pole sign with a weathered sign board reading "MOTELL 69" and a small red neon tube sign below it reading "LEDIG ROM". Two old boxy 1980s station wagons half buried in snow in the parking lot, one with snow on the roof. A single street lamp casts a cone of yellow light through falling snow. Orange-tipped snow poles along a dark road in the foreground. Dense dark spruce forest behind the motel and snowy mountains under a deep navy sky, light snowfall. Keep the left third of the image darker and calmer, with no important details, to leave room for a game title and menu buttons. The motel fills the centre and right.

## 2. Senter – resepsjonsdisken (`public/assets/bg/reception_center.jpg`)

> [STIL] Interior of the motel's tiny night reception, seen straight-on from behind the reception desk looking towards the entrance, one-point perspective at standing eye level. FOREGROUND: a long worn dark wooden reception counter runs across the ENTIRE width of the image; its top edge is a perfectly straight horizontal line at 70% of the image height; the counter top is completely EMPTY; the counter front below it shows scuffed dark varnished planks. BEHIND the counter: an open floor of worn linoleum with dirty wet snow footprints, kept clear in the middle of the image where guests will stand. BACK WALL: yellowed vertical wood panelling; a glass entrance door left of centre with frosted glass showing snowy night and a distant street lamp; a small brass bell on a bracket above the door; a coat rack with an old parka; a dusty rubber plant; a wide frosty window right of centre showing the snowy parking lot and dark forest; a round wall clock; a faded framed photo of the motel; a doorway on the far right opening into a dim hallway with a small wooden arrow sign reading "ROM 101–205". A long fluorescent tube light on the ceiling. Warm sickly-yellow light inside, cold blue night outside.

## 3. Venstre – telefon og nøkkelbrett (`public/assets/bg/reception_left.jpg`)

> [STIL] The SAME motel reception interior as the reference image (same yellowed wood panelling, same fluorescent tube light, same dark wooden counter, same colours and light), the camera turned to face the LEFT wall, straight-on at standing eye level. FOREGROUND: the left end of the same dark wooden counter runs across the full width; its top edge is a perfectly straight horizontal line at 70% of the image height; the counter top is EMPTY. WALL: on the right half a large empty rectangular dark-wood board with a thin frame is mounted on the panelling (about 45% of the image width and 45% of the image height, centred at about 66% from the left and 33% from the top) — plain wood, NO keys and NO hooks on it. On the left half: a small frosty window with snowy night outside, a paper wall calendar from 1987, a cork notice board with yellowed notes and pins, an old fuse box, a fire extinguisher. Leave the left part of the counter top clear for a telephone.

## 4. Høyre – romkart og renhold (`public/assets/bg/reception_right.jpg`)

> [STIL] The SAME motel reception interior as the reference image (same yellowed wood panelling, same fluorescent tube light, same dark wooden counter, same colours and light), the camera turned to face the RIGHT wall, straight-on at standing eye level. FOREGROUND: the right end of the same dark wooden counter runs across the full width; its top edge is a perfectly straight horizontal line at 70% of the image height; the counter top is EMPTY. WALL: on the left two-thirds a large EMPTY pale cork board in a wooden frame (about 60% of the image width and 55% of the image height, top-left corner at about 6% from the left and 9% from the top) — nothing pinned to it. On the right third a smaller EMPTY whiteboard with a marker tray. Next to it a narrow doorway to a dim hallway, a cleaning trolley with a mop bucket, a folded "WET FLOOR" sign without text, a wall radiator.

## Arbeidsflyt

1. Last opp stilreferanser: brukerens skjermbilder (NATTSKIFT meny + spill) og startpakkens `menu.jpg` + `center.jpg`.
2. Generer **senter** først med stilreferansene.
3. Generer **venstre** og **høyre** med senterbildet som ekstra referanse (samme interiør).
4. Generer **meny** med stilreferansene.
5. Lagre til `public/assets/bg/` og mål opp tavler og vinduer i `src/ui/layout.js`.

## Oppdatering: disken er ikke lenger en del av bildene
Bakgrunnene ble generert med en disk i forgrunnen. Den er nå erstattet av en egen SVG-disk
(`src/ui/art/counter.js`) som ligger foran gjestene i alle tre vinkler. Senterbildet får den gamle disken
fjernet i `scripts/convert-bg.mjs` (gulvet forlenges under); i venstre og høyre vinkel dekker SVG-disken den
gamle helt (kontrollert med `node scripts/preview-counter.mjs ut.png center|left|right`).
Ingen nye Higgsfield-kreditter ble brukt til dette.

Modell: GPT Image 2.5, kvalitet high, 2K, 16:9 (2,75 kreditter per bilde).
