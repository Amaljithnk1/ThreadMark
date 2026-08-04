"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type Role } from "@/stores/auth-store";

export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, isHydrating } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrating) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace(`/${user.role}`);
    }
  }, [user, isHydrating, role, router]);

  if (isHydrating || !user || user.role !== role) return null;
  return <>{children}</>;
}
