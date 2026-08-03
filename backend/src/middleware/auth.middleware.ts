import type { NextFunction, Request, Response } from "express";
import type { Role } from "@threadmark/shared";
import { verifyToken } from "../services/auth.service.js";
import { HttpError } from "../utils/http-error.js";

declare global { namespace Express { interface Request { auth?: { userId: string; email: string; role: Role } } } }
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.access_token || req.header("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) throw new HttpError(401, "Sign in to continue");
    const payload = verifyToken(token);
    req.auth = { userId: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch { next(new HttpError(401, "Your session is invalid or has expired. Please sign in again.")); }
}
export const requireRole = (...roles: Role[]) => [requireAuth, (req: Request, _res: Response, next: NextFunction) => {
  if (!req.auth || !roles.includes(req.auth.role)) return next(new HttpError(403, "You do not have permission to access this resource"));
  next();
}];

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try { const token = req.cookies?.access_token || req.header("Authorization")?.replace(/^Bearer\s+/i, ""); if (token) { const payload = verifyToken(token); req.auth = { userId: payload.sub, email: payload.email, role: payload.role }; } } catch { /* Guests and invalid optional sessions continue as guests. */ }
  next();
}
