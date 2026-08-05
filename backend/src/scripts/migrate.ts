import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pool } from "../config/db.js";

const dir = resolve(import.meta.dirname, "../../db");
const files = (await readdir(dir)).filter(f => f.endsWith(".sql")).sort();

try {
  const migrationsTableExists = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'migrations'
    )
  `);

  if (!migrationsTableExists.rows[0].exists) {
    console.log("Migrations table not found. Creating...");
    await pool.query(`
      CREATE TABLE migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const usersTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (usersTableExists.rows[0].exists) {
      console.log("Existing database detected. Bootstrapping old migrations as applied...");
      for (const file of files) {
        if (file < "008_supplier_replies.sql") {
          await pool.query("INSERT INTO migrations (filename) VALUES ($1)", [file]);
          console.log(`Bootstrapped: ${file}`);
        }
      }
    }
  }

  for (const file of files) {
    const res = await pool.query("SELECT 1 FROM migrations WHERE filename = $1", [file]);
    if (res.rows.length === 0) {
      console.log(`Applying migration: ${file}`);
      const sql = await readFile(resolve(dir, file), "utf8");
      
      await pool.query('BEGIN');
      try {
        await pool.query(sql);
        await pool.query("INSERT INTO migrations (filename) VALUES ($1)", [file]);
        await pool.query('COMMIT');
        console.log(`Successfully applied ${file}`);
      } catch (err) {
        await pool.query('ROLLBACK');
        console.error(`Failed to apply migration ${file}:`, err);
        throw err;
      }
    } else {
      console.log(`Skipping already applied migration: ${file}`);
    }
  }
  console.log("Database schema migrated successfully.");
} finally { 
  await pool.end(); 
}
