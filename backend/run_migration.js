import {pool} from './dist/config/db.js';
import {readFile} from 'fs/promises';
try {
  const sql = await readFile('./db/003_rfq_negotiation.sql', 'utf8');
  await pool.query(sql);
  console.log('Migration applied successfully');
} catch(e) {
  console.error('Migration failed:', e);
} finally {
  process.exit(0);
}
