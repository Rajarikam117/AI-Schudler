import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const INITIAL = { tasks: [], schedules: [], preferences: { workStart: '09:00', workEnd: '17:00', breakMinutes: 10, theme: 'light' } };
let queue = Promise.resolve();
async function ensure() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(DB_FILE); }
  catch { await fs.writeFile(DB_FILE, JSON.stringify(INITIAL, null, 2)); }
}
async function readRaw() {
  await ensure();
  try { return JSON.parse(await fs.readFile(DB_FILE, 'utf8')); }
  catch (error) {
    if (error instanceof SyntaxError) {
      const backup = `${DB_FILE}.corrupt-${Date.now()}`;
      await fs.copyFile(DB_FILE, backup).catch(() => {});
      throw new Error(`Local database JSON is corrupted. A copy was preserved at ${path.basename(backup)}. Please repair or remove data/database.json.`);
    }
    throw error;
  }
}
export async function readDb() { return readRaw(); }
export async function updateDb(mutator) {
  let release;
  const previous = queue;
  queue = new Promise(resolve => { release = resolve; });
  await previous;
  try {
    const db = await readRaw();
    const result = await mutator(db);
    const temp = `${DB_FILE}.tmp`;
    await fs.writeFile(temp, JSON.stringify(db, null, 2), 'utf8');
    await fs.rename(temp, DB_FILE);
    return result;
  } finally { release(); }
}
export const databasePath = DB_FILE;
