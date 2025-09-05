import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedFromCsv } from '../src/services/wl/wlService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// allow override via CLI: npm run seed:wl -- ./data/diva_numbers.csv
const argPath = process.argv[2];
const csvPath = argPath || process.env.WL_SEED_CSV || path.join(__dirname, '../../data/diva_numbers.csv');
const delayMs = Number(process.env.WL_SEED_DELAY_MS || 2000);

console.log(`[SEED] CSV: ${csvPath}`);
console.log(`[SEED] Delay: ${delayMs} ms`);

try {
  const total = await seedFromCsv(csvPath, delayMs);
  console.log(`[SEED] Done. Total TransportStop entities upserted: ${total}`);
  process.exit(0);
} catch (e) {
  console.error('[SEED] Failed:', e);
  process.exit(1);
}
