"use client";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore, type SessionUser } from "@/stores/auth-store";
export function AuthHydrator() {
  const { setUser, setHydrating } = useAuthStore();
  useEffect(() => {
    const timer = window.setTimeout(() => void api<{ user: SessionUser }>("/auth/me").then(r => setUser(r.user)).catch(() => setUser(null)).finally(() => setHydrating(false)), 0);
    return () => window.clearTimeout(timer);
  }, [setHydrating, setUser]);
  return null;
}
