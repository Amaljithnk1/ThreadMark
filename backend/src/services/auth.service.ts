import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { LoginInput, RegisterInput, Role } from "@threadmark/shared";
import { env } from "../config/env.js";
import type { UserRecord, UserRepository } from "../models/user.model.js";
import { HttpError } from "../utils/http-error.js";

export type PublicUser = Pick<UserRecord, "id" | "email" | "role" | "username" | "created_at">;
export interface AuthResult { user: PublicUser; token: string }
export const toPublicUser = (user: UserRecord): PublicUser => ({ id: user.id, email: user.email, role: user.role, username: user.username, created_at: user.created_at });
export function signToken(user: PublicUser) { return jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.JWT_SECRET, { expiresIn: "7d" }); }
export function verifyToken(token: string) { return jwt.verify(token, env.JWT_SECRET) as { sub: string; role: Role; email: string }; }
export function makeAuthService(users: UserRepository) {
  return {
    async register(input: RegisterInput): Promise<AuthResult> {
      const existing = await users.findByEmail(input.email);
      if (existing) throw new HttpError(409, "An account already exists for this email address");
      const passwordHash = await bcrypt.hash(input.password, 12);
      let username = input.username;
      if (!username) {
        const randomHex = Math.random().toString(16).substring(2, 6);
        username = input.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + randomHex;
      }
      let user;
      try {
        user = await users.create({ email: input.email, passwordHash, role: input.role, username });
      } catch (err: any) {
        if (err.code === '23505' && err.constraint === 'users_username_key') {
          throw new HttpError(409, "Username already taken");
        }
        throw err;
      }
      const publicUser = toPublicUser(user);
      return { user: publicUser, token: signToken(publicUser) };
    },
    async login(input: LoginInput): Promise<AuthResult> {
      const user = await users.findByEmail(input.email);
      if (!user || !(await bcrypt.compare(input.password, user.password_hash))) throw new HttpError(401, "Email or password is incorrect");
      const publicUser = toPublicUser(user);
      return { user: publicUser, token: signToken(publicUser) };
    },
  };
}
