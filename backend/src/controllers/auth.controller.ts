import type { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "@threadmark/shared";
import { makeAuthService } from "../services/auth.service.js";
import { postgresUserRepository } from "../models/user.model.js";
import { HttpError } from "../utils/http-error.js";
const auth = makeAuthService(postgresUserRepository);
const isProd = process.env.NODE_ENV === "production" || process.env.RENDER === "true" || !!process.env.RENDER;
const cookieOptions = { httpOnly: true, sameSite: (isProd ? "none" : "lax") as "none" | "lax", secure: isProd, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" };
function parse<T>(schema: { safeParse(input: unknown): { success: boolean; data?: T; error?: { issues: { message: string }[] } } }, body: unknown): T { const result = schema.safeParse(body); if (!result.success) throw new HttpError(400, result.error!.issues[0]?.message ?? "Check the information you entered"); return result.data!; }
export async function register(req: Request, res: Response, next: NextFunction) { try { const result = await auth.register(parse(registerSchema, req.body)); res.cookie("access_token", result.token, cookieOptions).status(201).json(result); } catch (error) { next(error); } }
export async function login(req: Request, res: Response, next: NextFunction) { try { const result = await auth.login(parse(loginSchema, req.body)); res.cookie("access_token", result.token, cookieOptions).status(200).json(result); } catch (error) { next(error); } }
export function logout(_req: Request, res: Response) { res.clearCookie("access_token", { ...cookieOptions, maxAge: undefined }).status(204).send(); }
export function me(req: Request, res: Response) { res.json({ user: { id: req.auth!.userId, email: req.auth!.email, role: req.auth!.role } }); }
