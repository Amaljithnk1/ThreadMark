import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import type { UserRecord, UserRepository } from "../src/models/user.model.js";
import { makeAuthService } from "../src/services/auth.service.js";
import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";

function memoryUsers(): UserRepository {
  const records: UserRecord[] = [];
  return {
    async findByEmail(email) { return records.find((item) => item.email === email) ?? null; },
    async findById(id) { return records.find((item) => item.id === id) ?? null; },
    async create({ email, passwordHash, role }) { const user: UserRecord = { id: crypto.randomUUID(), email, password_hash: passwordHash, role, created_at: new Date() }; records.push(user); return user; },
  };
}

describe("authentication service", () => {
  it("registers buyers and suppliers with a hashed password and role-bearing token", async () => {
    const users = memoryUsers(); const service = makeAuthService(users);
    for (const role of ["buyer", "supplier"] as const) {
      const result = await service.register({ email: `${role}@threadmark.test`, password: "SecurePass123", role });
      expect(result.user.role).toBe(role);
      const stored = await users.findByEmail(result.user.email);
      expect(stored?.password_hash).not.toBe("SecurePass123");
      expect(await bcrypt.compare("SecurePass123", stored!.password_hash)).toBe(true);
      expect(jwt.verify(result.token, env.JWT_SECRET)).toMatchObject({ sub: result.user.id, role });
    }
  });
  it("does not permit duplicate emails", async () => {
    const service = makeAuthService(memoryUsers());
    await service.register({ email: "buyer@threadmark.test", password: "SecurePass123", role: "buyer" });
    await expect(service.register({ email: "buyer@threadmark.test", password: "SecurePass123", role: "buyer" })).rejects.toMatchObject({ status: 409 });
  });
  it("rejects an incorrect password without exposing account existence", async () => {
    const service = makeAuthService(memoryUsers());
    await service.register({ email: "buyer@threadmark.test", password: "SecurePass123", role: "buyer" });
    await expect(service.login({ email: "buyer@threadmark.test", password: "WrongPass123" })).rejects.toMatchObject({ status: 401, message: "Email or password is incorrect" });
    await expect(service.login({ email: "missing@threadmark.test", password: "WrongPass123" })).rejects.toMatchObject({ status: 401, message: "Email or password is incorrect" });
  });
});

describe("protected API middleware", () => {
  it("rejects missing and malformed authentication, and permits a valid JWT", async () => {
    const app = createApp();
    await request(app).get("/api/auth/me").expect(401);
    await request(app).get("/api/auth/me").set("Authorization", "Bearer invalid").expect(401);
    const token = jwt.sign({ sub: "00000000-0000-0000-0000-000000000001", email: "buyer@threadmark.test", role: "buyer" }, env.JWT_SECRET, { expiresIn: "1h" });
    const response = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`).expect(200);
    expect(response.body.user).toMatchObject({ role: "buyer", email: "buyer@threadmark.test" });
  });
});

describe("role-based access control", () => {
  it("allows only the required role and blocks authenticated wrong-role users", async () => {
    const express = (await import("express")).default;
    const { requireRole } = await import("../src/middleware/auth.middleware.js");
    const app = express();
    app.get("/supplier-only", ...requireRole("supplier"), (_req, res) => res.json({ ok: true }));
    const tokenFor = (role: "buyer" | "supplier" | "admin") => jwt.sign({ sub: crypto.randomUUID(), email: `${role}@threadmark.test`, role }, env.JWT_SECRET, { expiresIn: "1h" });
    await request(app).get("/supplier-only").set("Authorization", `Bearer ${tokenFor("buyer")}`).expect(403);
    await request(app).get("/supplier-only").set("Authorization", `Bearer ${tokenFor("admin")}`).expect(403);
    await request(app).get("/supplier-only").set("Authorization", `Bearer ${tokenFor("supplier")}`).expect(200);
  });
  it("rejects expired JWT sessions", async () => {
    const app = createApp();
    const expired = jwt.sign({ sub: crypto.randomUUID(), email: "buyer@threadmark.test", role: "buyer" }, env.JWT_SECRET, { expiresIn: -1 });
    await request(app).get("/api/auth/me").set("Authorization", `Bearer ${expired}`).expect(401);
  });
});
