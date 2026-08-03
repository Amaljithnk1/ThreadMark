import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pool } from "../config/db.js";
const migration = await readFile(resolve(import.meta.dirname, "../../db/001_initial_schema.sql"), "utf8");
try { await pool.query(migration); console.log("Database schema migrated successfully."); } finally { await pool.end(); }
