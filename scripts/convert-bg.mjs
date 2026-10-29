// Skalerer Higgsfield-bakgrunnene (art_src/*.png, 2736×1536) til spillets 1920×1080-JPG-er.
// Senterbildet får den ferdigtegnede disken fjernet: gulvet under diskkanten forlenges nedover,
// mørkt og uskarpt (det ligger alltid bak disken), slik at den nye SVG-disken (src/ui/art/counter.js) er den eneste disken i bildet.
// Bruk: node scripts/convert-bg.mjs
import sharp from 'sharp';
import fs from 'node:fs';

const JOBS = [
  ['art_src/center_v1.png', 'public/assets/bg/reception_center.jpg', { floorFrom: 640, counterTop: 744 }],
  ['art_src/left_v1.png', 'public/assets/bg/reception_left.jpg'],
  ['art_src/right_v1.png', 'public/assets/bg/reception_right.jpg'],
  ['art_src/menu_v2.png', 'public/assets/bg/menu_exterior.jpg'],
];

/** Erstatter alt under diskkanten med gulvstripa rett over den, strukket nedover (nærmere = større fliser). */
async function removeCounter(img, { floorFrom, counterTop }) {
  const band = await img.clone().extract({ left: 0, top: floorFrom, width: 1920, height: counterTop - floorFrom })
    .resize(1920, 1080 - counterTop, { fit: 'fill' }).blur(14).modulate({ brightness: 0.5 }).toBuffer();
  const base = await img.toBuffer();
  return sharp(base).composite([{ input: band, left: 0, top: counterTop }]);
}

fs.mkdirSync('public/assets/bg', { recursive: true });
for (const [src, dst, cut] of JOBS) {
  if (!fs.existsSync(src)) { console.warn('mangler', src); continue; }
  let img = sharp(src).resize(1920, 1080, { fit: 'cover' });
  if (cut) img = await removeCounter(sharp(await img.png().toBuffer()), cut);
  await img.jpeg({ quality: 84, mozjpeg: true }).toFile(dst);
  console.log('OK', dst, (fs.statSync(dst).size / 1024).toFixed(0) + ' kB');
}
