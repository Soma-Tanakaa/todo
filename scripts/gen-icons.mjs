// TaskFlowyのアプリアイコンを依存ライブラリなしで生成する。
// アクセント青地に白のミニツリー(親ノード1つ→子ノード2つ+ベジェコネクタ)。
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

const BG = [0x1d, 0x9b, 0xf0]; // アプリのアクセント青
const FG = [0xff, 0xff, 0xff];

/** 角丸四角の符号付き距離(内側が負) */
function roundRectDist(px, py, cx, cy, hx, hy, r) {
  const qx = Math.abs(px - cx) - (hx - r);
  const qy = Math.abs(py - cy) - (hy - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** 3次ベジェを折れ線サンプリングして距離を求める */
function bezierPoints(p0, c1, c2, p1, n = 32) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push([
      u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
      u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1],
    ]);
  }
  return pts;
}

function distToPolyline(px, py, pts) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    d = Math.min(
      d,
      distToSegment(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])
    );
  }
  return d;
}

function makeIcon(size) {
  const s = (v) => v * size;
  // ノード: 親(左中央) + 子2つ(右上/右下)。アプリのツリーレイアウトの縮図
  const rects = [
    [s(0.295), s(0.5), s(0.135), s(0.105), s(0.05)],
    [s(0.705), s(0.27), s(0.135), s(0.105), s(0.05)],
    [s(0.705), s(0.73), s(0.135), s(0.105), s(0.05)],
  ];
  // コネクタ: 親の右端中央から子の左端中央へ(アプリと同じ横S字カーブ)
  const conns = [
    bezierPoints([s(0.43), s(0.5)], [s(0.505), s(0.5)], [s(0.495), s(0.27)], [s(0.57), s(0.27)]),
    bezierPoints([s(0.43), s(0.5)], [s(0.505), s(0.5)], [s(0.495), s(0.73)], [s(0.57), s(0.73)]),
  ];
  const strokeHalf = s(0.027);
  const aa = Math.max(1, size / 256);
  return png(size, (x, y) => {
    const px = x + 0.5;
    const py = y + 0.5;
    let cov = 0;
    for (const [cx, cy, hx, hy, r] of rects) {
      const d = roundRectDist(px, py, cx, cy, hx, hy, r);
      cov = Math.max(cov, Math.max(0, Math.min(1, -d / aa + 0.5)));
    }
    for (const pts of conns) {
      const d = distToPolyline(px, py, pts);
      cov = Math.max(cov, Math.max(0, Math.min(1, (strokeHalf - d) / aa + 0.5)));
    }
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
