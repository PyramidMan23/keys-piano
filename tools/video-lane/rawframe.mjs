// Decode an image (or one video frame) to raw RGB24 via ffmpeg. No image deps.
import { spawnSync } from 'node:child_process';

// Accurate input seeking with copyts preserves the source presentation
// timestamp (PTS). Return the timestamp showinfo actually decoded, not a
// frame-number / frame-rate estimate. Intended for evidence, not extraction.
export function renderVideoFrame(video, seconds, out, filters = '') {
  const r = spawnSync('ffmpeg', ['-v', 'info', '-y', '-copyts', '-ss', String(seconds),
    '-i', video, '-frames:v', '1', '-vf', ['showinfo', filters].filter(Boolean).join(','), out],
    { maxBuffer: 8 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(String(r.stderr));
  const pts = String(r.stderr).match(/Parsed_showinfo.*\bn:\s*0\b.*pts_time:\s*([\d.]+)/);
  if (!pts) throw new Error('REFUSE: evidence frame has no presentation timestamp');
  return { requestedSeconds: seconds, presentationSeconds: Number(pts[1]), path: out };
}

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
