// Genera PNGs de icono muy simples (fondo + anillo tipo átomo) sin dependencias
// externas, usando solo zlib de Node. Son un placeholder: sustitúyelos cuando
// tengas un logo real en public/icons/.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const BG = [30, 27, 75]; // #1e1b4b (fondo oscuro violeta)
const FG = [167, 139, 250]; // #a78bfa (anillo claro)

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makeIcon(size, { maskable = false } = {}) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  const cx = size / 2;
  const cy = size / 2;
  // Zona segura para iconos "maskable": el contenido no debe tocar los bordes.
  const margin = maskable ? size * 0.2 : size * 0.08;
  const outerR = size / 2 - margin;
  const ringThickness = size * 0.07;
  const dotR = size * 0.09;

  for (let y = 0; y < size; y++) {
    let rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filtro "none"
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let color = BG;

      // Anillo (orbital)
      if (Math.abs(dist - outerR) < ringThickness / 2) color = FG;
      // Segundo anillo, más pequeño, ligeramente inclinado (elipse simple)
      const ex = dx;
      const ey = dy * 1.8;
      const edist = Math.sqrt(ex * ex + ey * ey);
      if (Math.abs(edist - outerR * 0.62) < ringThickness / 2.2) color = FG;
      // Núcleo central
      if (dist < dotR) color = FG;

      const off = rowStart + 1 + x * 4;
      raw[off] = color[0];
      raw[off + 1] = color[1];
      raw[off + 2] = color[2];
      raw[off + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw, { level: 9 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const t of targets) {
  const png = makeIcon(t.size, { maskable: t.maskable });
  fs.writeFileSync(path.join(outDir, t.name), png);
  console.log("Generado", t.name);
}
