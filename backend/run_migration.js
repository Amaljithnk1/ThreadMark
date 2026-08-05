import {pool} from './dist/config/db.js';
import {readFile} from 'fs/promises';
try {
  const sql = await readFile(process.argv[2], 'utf8');
  await pool.query(sql);
  console.log('Migration applied successfully');
} catch(e) {
  console.error('Migration failed:', e);
} finally {
  process.exit(0);
}
