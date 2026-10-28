import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, isMaskable = false) {
  // RGBA buffer
  const stride = width * 4 + 1; // 1 filter byte per line
  const rawData = Buffer.alloc(stride * height);

  // Background color: #1C2541 (R:28, G:37, B:65) or deep navy
  const bgR = 28, bgG = 37, bgB = 65, bgA = 255;
  // Accent Blue: #2196F3 (R:33, G:150, B:243)
  // Accent Orange: #FF9800 (R:255, G:152, B:0)
  // White: #FFFFFF (R:255, G:255, B:255)

  const cx = width / 2;
  const cy = height / 2;
  const rCircle = width * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride;
    rawData[rowOffset] = 0; // Filter type None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background
      let r = bgR, g = bgG, b = bgB, a = bgA;

      // Inner circular badge for non-maskable or rounded look
      if (!isMaskable) {
        if (dist <= rCircle) {
          r = 255; g = 255; b = 255;
        } else if (dist <= rCircle + 4) {
          // Soft border
          r = 47; g = 123; b = 255;
        }
      } else {
        // Maskable safe zone circle
        if (dist <= width * 0.38) {
          r = 255; g = 255; b = 255;
        }
      }

      // Draw eHub logo emblem:
      // Left side: Blue 'e' region around cx - width*0.14
      // Right side: Orange rounded badge 'hub' around cx + width*0.14
      const scale = width / 512;
      const ex = x - (cx - 100 * scale);
      const ey = y - cy;
      const eDist = Math.sqrt(ex * ex + ey * ey);

      // 'e' stylized arc/circle
      if (eDist <= 55 * scale && eDist >= 26 * scale && !(ey > 8 * scale && ex > 8 * scale)) {
        r = 33; g = 150; b = 243; a = 255;
      }
      // 'e' horizontal bar
      if (Math.abs(ey) <= 12 * scale && ex >= -45 * scale && ex <= 45 * scale) {
        r = 33; g = 150; b = 243; a = 255;
      }

      // Orange pill box for 'hub'
      const hx = x - (cx + 65 * scale);
      const hy = y - cy;
      const pillW = 100 * scale;
      const pillH = 50 * scale;
      const pillR = 14 * scale;

      const insidePill = Math.abs(hx) <= pillW && Math.abs(hy) <= pillH;
      if (insidePill) {
        // Pill rounded corners
        const cornerDx = Math.max(0, Math.abs(hx) - (pillW - pillR));
        const cornerDy = Math.max(0, Math.abs(hy) - (pillH - pillR));
        if (cornerDx * cornerDx + cornerDy * cornerDy <= pillR * pillR) {
          // Inside orange badge
          r = 255; g = 152; b = 0; a = 255;

          // Simple white letters representation inside pill
          // 'h' vertical bar
          if (hx >= -75 * scale && hx <= -55 * scale && Math.abs(hy) <= 32 * scale) {
            r = 255; g = 255; b = 255;
          }
          // 'h' arch
          if (hx >= -55 * scale && hx <= -30 * scale && hy >= -10 * scale && hy <= 32 * scale && !(hy < 15 * scale && hx > -50 * scale && hx < -35 * scale)) {
            r = 255; g = 255; b = 255;
          }
          // 'u'
          if (hx >= -15 * scale && hx <= 20 * scale && hy >= -8 * scale && hy <= 32 * scale && !(hy < 22 * scale && hx > -5 * scale && hx < 10 * scale)) {
            r = 255; g = 255; b = 255;
          }
          // 'b' vertical stem
          if (hx >= 35 * scale && hx <= 50 * scale && Math.abs(hy) <= 32 * scale) {
            r = 255; g = 255; b = 255;
          }
          // 'b' loop
          if (hx >= 48 * scale && hx <= 82 * scale && hy >= -8 * scale && hy <= 32 * scale && !(Math.abs(hy - 12 * scale) < 10 * scale && hx > 58 * scale && hx < 72 * scale)) {
            r = 255; g = 255; b = 255;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Deflate
  const compressed = zlib.deflateSync(rawData);

  // PNG chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  }
  return (c ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
  }
  CRC_TABLE[n] = c;
}

// Write files
fs.writeFileSync('public/pwa-192x192.png', createPng(192, 192, false));
fs.writeFileSync('public/pwa-512x512.png', createPng(512, 512, false));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPng(512, 512, true));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180, 180, false));
console.log('Successfully generated PWA icon set!');
