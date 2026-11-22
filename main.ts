// The Lantern Archive — hand-in program. Validates every screenshot against
// the 256 KiB cap, copies game/ and screenshots/ into the output directory,
// and writes dossier.json with the kit's own buildDossier so the sealed
// scorer reproduces it byte for byte. Deterministic: same repo in, same
// dossier out.
import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const SHOT_MAX = 262144;

const shotsDir = join(root, 'screenshots');
const shots = readdirSync(shotsDir).filter(f => /\.(png|jpe?g)$/i.test(f)).sort();
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
}
for (const f of shots) {
  const bytes = statSync(join(shotsDir, f)).size;
  if (bytes > SHOT_MAX) throw new Error(`screenshot ${f} is ${bytes} bytes, over the ${SHOT_MAX} cap`);
  console.log(`screenshot ${f}: ${bytes} bytes OK`);
}

mkdirSync(out, { recursive: true });
cpSync(join(root, 'game'), join(out, 'game'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });
writeFileSync(join(out, 'dossier.json'), buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: SHOT_MAX },
  game_max_files: 993,
  game_max_bytes: 50331648,
}));
console.log('dossier.json written to', out);
