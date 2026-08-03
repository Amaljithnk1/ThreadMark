import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 8) throw new Error("Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 8 characters before seeding an admin.");
try {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount) { console.log("Admin already exists; no change made."); }
  else { const hash = await bcrypt.hash(password, 12); await pool.query("INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')", [email, hash]); console.log("Seeded invite-only admin account."); }
} finally { await pool.end(); }
