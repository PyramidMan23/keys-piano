// Crop a region out of an overlay PNG so a defect can be LOOKED at closely.
// Usage: node tools/crop.mjs <in.png> <out.png> <x> <y> <w> <h>   (CSS px, dsf 2)
import { decode, encode } from './png.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const [, , src, dst, X, Y, W, H] = process.argv;
const D = 2;
const a = decode(readFileSync(src));
const x0 = +X * D, y0 = +Y * D, w = +W * D, h = +H * D;
const out = { width: w, height: h, data: Buffer.alloc(w * h * 4) };
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    const i = ((y + y0) * a.width + (x + x0)) * 4, j = (y * w + x) * 4;
    out.data[j] = a.data[i]; out.data[j + 1] = a.data[i + 1];
    out.data[j + 2] = a.data[i + 2]; out.data[j + 3] = 255;
  }
writeFileSync(dst, encode(out));
console.log(`wrote ${dst} (${w}x${h} device px)`);
