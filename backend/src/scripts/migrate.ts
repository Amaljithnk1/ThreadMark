import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pool } from "../config/db.js";
const dir = resolve(import.meta.dirname, "../../db");
const files = (await readdir(dir)).filter(f => f.endsWith(".sql")).sort();
try {
  for (const file of files) {
    await pool.query(await readFile(resolve(dir, file), "utf8"));
  }
  console.log("Database schema migrated successfully.");
} finally { await pool.end(); }
