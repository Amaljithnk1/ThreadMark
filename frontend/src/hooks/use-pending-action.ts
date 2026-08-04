"use client";
import { useState, useCallback } from "react";

export function usePendingAction() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  
  const run = useCallback(async (id: string, fn: () => Promise<void>) => {
    if (pendingId) return;
    setPendingId(id);
    try {
      await fn();
    } finally {
      setPendingId(null);
    }
  }, [pendingId]);
  
  return { pendingId, run, isPending: (id: string) => pendingId === id };
}
