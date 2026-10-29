# Lydkilder og lisenser

## NOX SOUND – Essentials Series (CC0)
Lisens bekreftet i `Essentials_Series_README.pdf` i lydpakken: «All these sounds are under CC0 license.»
Konvertert med `scripts/convert-audio.mjs` (mono, 16-bit, 22 050 Hz, normalisert, sømløse looper).

| Fil i spillet | Kilde | Brukes til |
|---|---|---|
| amb/out_wind_forest.wav | Nature/Ambiance_Wind_Forest_Loop | Meny: vintervind i skogen |
| amb/out_night.wav | Nature/Ambiance_Night_Loop | Meny: nattlig bakgrunn |
| amb/in_wind_calm.wav | Nature/Ambiance_Wind_Calm_Loop | Resepsjon: vind utenfor veggen, vindkast |
| amb/neon_sign.wav | Electromagnetic/Neon_Light_Loop_02 | Neonskiltet ute / lysstoffrøret inne |
| amb/room_tone.wav | Electromagnetic/Electric_Box_Loop_01 | Svak romlyd i resepsjonen (lavt i miksen) |
| sfx/car_pass.wav | Vehicle/Car_Drive_Exterior_Loop | Bil som passerer (meny + dempet inne) |
| sfx/car_door.wav | Vehicle/Car_Door_Closing_Exterior_01 | Bildør på parkeringsplassen |
| sfx/car_stop.wav, car_start.wav | Vehicle/Car_Stop/Start_Engine | Reserve for ankomster |
| sfx/keys_jingle.wav | Vehicle/Car_Keys_01 | Nøkkel plukkes opp |
| sfx/door_wood.wav | Sample/Household_Door_Wood_Open | Inngangsdøra |
| sfx/key_hook.wav | Sample/Household_Closet_Key_Insertion | Nøkkel henges på brettet |
| sfx/coat.wav | Sample/Cloth_Winter_Coat_Throw | Reserve |
| sfx/step_wood_1–3.wav | Footsteps/Wood_Walk_01/04/07 | Fottrinn i resepsjonen |

## Miks
Ute (meny): to vindlag (`out_wind_forest` + `wind.wav`) med egne vindkast og stille perioder, svak natt-bakgrunn,
og neonskiltet langt under vinden. Inne: vinden dempet gjennom veggene (lavpass), svak romlyd og lysrør; vinden
blir tydeligere et øyeblikk når inngangsdøra går. Volumene står i `SCENES` i `src/audio/Audio.js`.

## Fra startpakken (KIOSK69, opprinnelig NOX SOUND CC0)
`amb/wind.wav` (andre vindlag på menyen), `amb/wind_calm.wav`, `amb/neon_hum.wav`, `sfx/button_*`, `sfx/key_1–3`, `sfx/paper_1–2`, `sfx/pickup`,
`sfx/put_down`, `sfx/clasp`, `sfx/thud`, `sfx/door_open`, `sfx/step_snow_*`, `sfx/step_tile_*` og alle `voice/*`
(korte stemmelyder: kremt, humring, sukk, pust – aldri én lyd per bokstav).

## Syntetiske lyder (Web Audio, laget i koden)
Telefonring (elektromekanisk bjelle), linjestøy, dreieskive, resepsjonsklokke/dørbjelle, kortpresse («ka-tsjunk»),
stempel, penn, papirblafring, statisk støy fra rom 203, døra som smeller i gangen, lysflimmer.
Disse finnes ikke i lydpakkene, så de er generert i stedet for å bruke filer med ukjent lisens.
