"use client";
import { create } from "zustand";
export type Role = "buyer" | "supplier" | "admin";
export interface SessionUser { id: string; email: string; role: Role; created_at?: string }
interface AuthState { user: SessionUser | null; isHydrating: boolean; setUser: (user: SessionUser | null) => void; setHydrating: (value: boolean) => void; clear: () => void; }
export const useAuthStore = create<AuthState>((set) => ({ user: null, isHydrating: true, setUser: (user) => set({ user }), setHydrating: (isHydrating) => set({ isHydrating }), clear: () => set({ user: null, isHydrating: false }) }));
