import type { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "@threadmark/shared";
import { makeAuthService, signToken, toPublicUser } from "../services/auth.service.js";
import { postgresUserRepository } from "../models/user.model.js";
import { HttpError } from "../utils/http-error.js";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const auth = makeAuthService(postgresUserRepository);
const isProd = process.env.NODE_ENV === "production" || process.env.RENDER === "true" || !!process.env.RENDER;
const cookieOptions = { httpOnly: true, sameSite: (isProd ? "none" : "lax") as "none" | "lax", secure: isProd, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" };
function parse<T>(schema: { safeParse(input: unknown): { success: boolean; data?: T; error?: { issues: { message: string }[] } } }, body: unknown): T { const result = schema.safeParse(body); if (!result.success) throw new HttpError(400, result.error!.issues[0]?.message ?? "Check the information you entered"); return result.data!; }
export async function register(req: Request, res: Response, next: NextFunction) { try { const result = await auth.register(parse(registerSchema, req.body)); res.cookie("access_token", result.token, cookieOptions).status(201).json(result); } catch (error) { next(error); } }
export async function login(req: Request, res: Response, next: NextFunction) { 
  try { 
    const input = parse(loginSchema, req.body);
    const user = await postgresUserRepository.findByEmail(input.email);
    if (user && user.auth_provider === 'google') {
      throw new HttpError(401, "Please sign in with Google");
    }
    const result = await auth.login(input); 
    res.cookie("access_token", result.token, cookieOptions).status(200).json(result); 
  } catch (error) { next(error); } 
}
export function logout(_req: Request, res: Response) { res.clearCookie("access_token", { ...cookieOptions, maxAge: undefined }).status(204).send(); }
export function me(req: Request, res: Response) { res.json({ user: { id: req.auth!.userId, email: req.auth!.email, role: req.auth!.role } }); }

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    if (!token) throw new HttpError(400, "Google token is required");
    
    // token is an access token from useGoogleLogin (implicit flow)
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!userInfoResponse.ok) throw new HttpError(400, "Invalid Google access token");
    const payload = await userInfoResponse.json();
    
    if (!payload?.email) throw new HttpError(400, "Invalid Google token payload");
    
    const user = await postgresUserRepository.findByEmail(payload.email);
    if (user) {
      const publicUser = toPublicUser(user);
      const jwtToken = signToken(publicUser);
      res.cookie("access_token", jwtToken, cookieOptions).status(200).json({ user: publicUser, token: jwtToken });
    } else {
      res.status(200).json({ status: "signup_required", email: payload.email, name: payload.name });
    }
  } catch (error) {
    next(error);
  }
}

export async function googleRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      token: z.string(),
      role: z.enum(["buyer", "supplier"]),
      username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
    });
    const { token, role, username } = parse(schema, req.body);
    
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!userInfoResponse.ok) throw new HttpError(400, "Invalid Google access token");
    const payload = await userInfoResponse.json();
    
    if (!payload?.email) throw new HttpError(400, "Invalid Google token payload");
    
    const existing = await postgresUserRepository.findByEmail(payload.email);
    if (existing) throw new HttpError(409, "Account already exists");

    const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12);
    let finalUsername = username;
    if (!finalUsername) {
      finalUsername = payload.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + Math.random().toString(16).substring(2, 6);
    }
    
    let user;
    try {
      user = await postgresUserRepository.create({ email: payload.email, passwordHash, role, username: finalUsername, authProvider: 'google' });
    } catch (err: any) {
      if (err.code === '23505' && err.constraint === 'users_username_key') {
        throw new HttpError(409, "Username already taken");
      }
      throw err;
    }
    
    const publicUser = toPublicUser(user);
    const jwtToken = signToken(publicUser);
    res.cookie("access_token", jwtToken, cookieOptions).status(201).json({ user: publicUser, token: jwtToken });
  } catch (error) {
    next(error);
  }
}
