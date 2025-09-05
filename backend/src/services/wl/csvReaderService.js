import fs from 'fs';

export function readDivaNumbers(csvPath) {
  const raw = fs.readFileSync(csvPath, 'utf8');

  const divas = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;                 // skip empty
    if (trimmed.startsWith('#')) continue;  // skip comments

    // Split by semicolon, take the FIRST column
    const [first] = trimmed.split(';');

    // Skip header row like "DIVA"
    if (!first || first.toUpperCase() === 'DIVA') continue;

    // Keep only numeric IDs
    if (!/^\d+$/.test(first)) continue;

    divas.push(first);
  }

  return divas;
}
