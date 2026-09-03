/**
 * Son de notification professionnel (~3 s) — arpège ascendant + résonance douce.
 * Usage: node scripts/generate-notification-sound.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'sounds');
const outFile = path.join(outDir, 'notification.wav');

const sampleRate = 44100;
const durationSec = 3.0;
const numSamples = Math.floor(sampleRate * durationSec);
const data = new Float32Array(numSamples);

function addTone(freq, startSec, lengthSec, volume) {
  const start = Math.floor(startSec * sampleRate);
  const len = Math.floor(lengthSec * sampleRate);
  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx >= numSamples) break;
    const t = i / sampleRate;
    const attack = Math.min(1, i / (sampleRate * 0.018));
    const release = Math.min(1, (len - i) / (sampleRate * 0.12));
    const env = attack * release * volume;
    const fundamental = Math.sin(2 * Math.PI * freq * t);
    const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.12;
    data[idx] += (fundamental + harmonic) * env;
  }
}

/** Arpège type alerte bureau (4 notes espacées) */
addTone(523.25, 0.0, 0.42, 0.48);
addTone(659.25, 0.48, 0.42, 0.5);
addTone(783.99, 0.96, 0.45, 0.52);
addTone(1046.5, 1.44, 0.55, 0.5);

/** Résonance de clôture — audible sans être agressive */
addTone(523.25, 2.05, 0.85, 0.14);
addTone(1046.5, 2.15, 0.75, 0.1);

let peak = 0;
for (let i = 0; i < numSamples; i++) {
  data[i] = Math.max(-1, Math.min(1, data[i]));
  peak = Math.max(peak, Math.abs(data[i]));
}
const normalize = peak > 0 ? 0.92 / peak : 1;

const pcm = Buffer.alloc(numSamples * 2);
for (let i = 0; i < numSamples; i++) {
  pcm.writeInt16LE(Math.round(data[i] * normalize * 32767), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(pcm.length, 40);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, Buffer.concat([header, pcm]));
console.log(`Written ${outFile} (${((header.length + pcm.length) / 1024).toFixed(1)} KB)`);
