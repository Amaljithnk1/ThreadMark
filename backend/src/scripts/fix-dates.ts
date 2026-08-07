import { pool } from "../config/db.js";

async function main() {
  try {
    // Set all created_at dates to August 7, 2026, roughly 10:00 AM UTC
    await pool.query("UPDATE products SET created_at = '2026-08-07T10:00:00Z'");
    console.log("Successfully backdated all products to August 7!");
  } catch (err) {
    console.error("Failed to backdate products:", err);
  } finally {
    await pool.end();
  }
}

main();
