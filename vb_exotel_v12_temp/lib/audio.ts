// Utilities for audio handling in Edge-compatible environment (no Node Buffer)

export function base64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function uint8ToBase64(u8: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin);
}

export function concatUint8(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.length; }
  return out;
}

// Create a minimal PCM16LE mono WAV header and append PCM bytes
export function wavFromPCM16(pcm: Uint8Array, sampleRate: number): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const wav = new Uint8Array(totalSize);
  const dv = new DataView(wav.buffer);

  // RIFF chunk descriptor
  writeAscii(wav, 0, 'RIFF');
  dv.setUint32(4, totalSize - 8, true);
  writeAscii(wav, 8, 'WAVE');

  // fmt sub-chunk
  writeAscii(wav, 12, 'fmt ');
  dv.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  dv.setUint16(20, 1, true);  // AudioFormat (1=PCM)
  dv.setUint16(22, numChannels, true);
  dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, byteRate, true);
  dv.setUint16(32, blockAlign, true);
  dv.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeAscii(wav, 36, 'data');
  dv.setUint32(40, dataSize, true);

  // PCM data
  wav.set(pcm, headerSize);
  return wav;
}

// Parse a PCM16LE mono WAV and return the raw PCM bytes. Very minimal parser.
export function pcm16FromWav(wavBytes: Uint8Array): { pcm: Uint8Array, sampleRate: number } {
  const dv = new DataView(wavBytes.buffer, wavBytes.byteOffset, wavBytes.byteLength);
  // Basic checks
  if (readAscii(wavBytes, 0, 4) !== 'RIFF' || readAscii(wavBytes, 8, 4) !== 'WAVE') {
    // Not a WAV; return as-is
    return { pcm: wavBytes, sampleRate: 8000 };
  }
  let offset = 12; // start of subchunks
  let fmtSampleRate = 8000;
  let dataOffset = -1;
  let dataSize = 0;
  while (offset + 8 <= wavBytes.length) {
    const chunkId = readAscii(wavBytes, offset, 4);
    const chunkSize = dv.getUint32(offset + 4, true);
    if (chunkId === 'fmt ') {
      fmtSampleRate = dv.getUint32(offset + 12, true);
    } else if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataSize = chunkSize;
      break;
    }
    offset += 8 + chunkSize;
  }
  if (dataOffset < 0) return { pcm: new Uint8Array(), sampleRate: fmtSampleRate };
  const pcm = wavBytes.slice(dataOffset, dataOffset + dataSize);
  return { pcm, sampleRate: fmtSampleRate };
}

// Split a byte stream into Exotel-friendly chunks (multiple of 320 bytes, between 320 and 100k)
export function splitForExotel(u8: Uint8Array, preferred: number = 3200): Uint8Array[] {
  const min = 320; const max = 100_000;
  const size = Math.min(Math.max(roundToMultiple(preferred, 320), min), max);
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < u8.length; i += size) chunks.push(u8.slice(i, i + size));
  return chunks;
}

function roundToMultiple(n: number, m: number) {
  const r = Math.round(n / m) * m; return r || m;
}

function writeAscii(arr: Uint8Array, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) arr[offset + i] = text.charCodeAt(i);
}
function readAscii(arr: Uint8Array, offset: number, len: number) {
  let s = '';
  for (let i = 0; i < len; i++) s += String.fromCharCode(arr[offset + i]);
  return s;
}

// Convert 8-bit µ-law sample to 16-bit PCM (LE). Returns signed 16-bit value.
function muLawByteToLinear16(b: number): number {
  // Standard G.711 µ-law decode (table-less)
  b = (~b) & 0xff;
  const sign = b & 0x80;
  const exponent = (b >> 4) & 0x07;
  const mantissa = b & 0x0F;
  let t = ((mantissa << 3) + 0x84) << exponent;
  // Apply bias and sign
  t = sign ? (0x84 - t) : (t - 0x84);
  return t;
}

// Decode a sequence of µ-law bytes to PCM16LE bytes
export function muLawToPCM16(mu: Uint8Array): Uint8Array {
  const out = new Uint8Array(mu.length * 2);
  const dv = new DataView(out.buffer);
  for (let i = 0; i < mu.length; i++) {
    const s = muLawByteToLinear16(mu[i]);
    dv.setInt16(i * 2, s, true);
  }
  return out;
}
