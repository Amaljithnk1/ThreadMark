import type { Role } from "@threadmark/shared";
import { query } from "../config/db.js";

export interface UserRecord { id: string; email: string; password_hash: string; role: Role; username: string; auth_provider: 'local' | 'google'; created_at: Date }
export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(input: { email: string; passwordHash: string; role: "buyer" | "supplier"; username: string; authProvider?: 'local' | 'google' }): Promise<UserRecord>;
}
export const postgresUserRepository: UserRepository = {
  async findByEmail(email) { const result = await query<UserRecord>("SELECT id, email, password_hash, role, username, auth_provider, created_at FROM users WHERE email = $1", [email]); return result.rows[0] ?? null; },
  async findById(id) { const result = await query<UserRecord>("SELECT id, email, password_hash, role, username, auth_provider, created_at FROM users WHERE id = $1", [id]); return result.rows[0] ?? null; },
  async create({ email, passwordHash, role, username, authProvider = 'local' }) {
    const result = await query<UserRecord>("INSERT INTO users (email, password_hash, role, username, auth_provider) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, password_hash, role, username, auth_provider, created_at", [email, passwordHash, role, username, authProvider]);
    return result.rows[0];
  },
};
