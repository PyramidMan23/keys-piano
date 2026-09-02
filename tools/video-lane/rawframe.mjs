// Decode an image (or one video frame) to raw RGB24 via ffmpeg. No image deps.
import { spawnSync } from 'node:child_process';

export function decodeImage(path) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
    { maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`ffmpeg failed on ${path}: ${r.stderr}`);
  return r.stdout; // Buffer, w*h*3
}

export const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

export function px(buf, W, x, y) {
  const i = (y * W + x) * 3;
  return [buf[i], buf[i + 1], buf[i + 2]];
}
