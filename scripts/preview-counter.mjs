// Forhåndsvisning av SVG-disken over bakgrunnen i full oppløsning (for å sjekke tegningen uten nettleser).
// Bruk: node scripts/preview-counter.mjs <ut.png> [center|left|right]
import sharp from 'sharp';
import { counterSvg, COUNTER_CENTER, COUNTER_LEFT, COUNTER_RIGHT } from '../src/ui/art/counter.js';

const out = process.argv[2] || 'counter-preview.png';
const which = process.argv[3] || 'center';
const bg = `public/assets/bg/reception_${which}.jpg`;
const svg = Buffer.from(counterSvg({ left: COUNTER_LEFT, center: COUNTER_CENTER, right: COUNTER_RIGHT }[which]));
const base = await sharp(bg).resize(1600, 900).toBuffer();
await sharp(base).composite([{ input: await sharp(svg).png().toBuffer() }]).png().toFile(out);
console.log('OK', out);
