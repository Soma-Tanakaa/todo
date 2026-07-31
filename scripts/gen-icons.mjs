// PWA用アイコンを依存ライブラリなしで生成する（濃色地に白のチェックマーク）
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
      raw[o++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const BG = [0x21, 0x21, 0x25];
const FG = [0xff, 0xff, 0xff];

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function makeIcon(size) {
  const p0 = [0.28 * size, 0.53 * size];
  const p1 = [0.445 * size, 0.685 * size];
  const p2 = [0.74 * size, 0.36 * size];
  const half = size * 0.055;
  const aa = Math.max(1, size / 256);
  return png(size, (x, y) => {
    const px = x + 0.5;
    const py = y + 0.5;
    const d = Math.min(
      distToSegment(px, py, p0[0], p0[1], p1[0], p1[1]),
      distToSegment(px, py, p1[0], p1[1], p2[0], p2[1])
    );
    const cov = Math.max(0, Math.min(1, (half - d) / aa + 0.5));
    return [
      Math.round(BG[0] + (FG[0] - BG[0]) * cov),
      Math.round(BG[1] + (FG[1] - BG[1]) * cov),
      Math.round(BG[2] + (FG[2] - BG[2]) * cov),
      255,
    ];
  });
}

const targets = [
  [512, "public/icon-512.png"],
  [192, "public/icon-192.png"],
  [180, "public/apple-touch-icon.png"],
  [192, "src/app/icon.png"],
];

for (const [size, file] of targets) {
  writeFileSync(join(root, file), makeIcon(size));
  console.log("wrote", file, `${size}x${size}`);
}
