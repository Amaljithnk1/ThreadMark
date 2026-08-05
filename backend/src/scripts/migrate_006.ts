import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pool } from "../config/db.js";

async function run() {
  const dir = resolve(import.meta.dirname, "../../db");
  try {
    const sql = await readFile(resolve(dir, "006_documents_flagged.sql"), "utf8");
    await pool.query(sql);
    console.log("Migration 006 completed successfully.");
  } catch (error) {
    console.error("Migration 006 failed:", error);
  } finally {
    await pool.end();
  }
}
run();
