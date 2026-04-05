import { useRef, useEffect, useCallback } from "react";
import type { DrawResult, VerifyResult, TeamData, PresetConfig, Proof } from "@/config/types";

type PendingCallback = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

export function useCryptoWorker(onProgress?: (msg: string) => void) {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingCallback>>(new Map());
  const progressRef = useRef(onProgress);
  progressRef.current = onProgress;

  useEffect(() => {
    const worker = new Worker(
      new URL("../crypto/worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (e) => {
      const { type, id, result, error, message } = e.data;

      if (type === "progress") {
        progressRef.current?.(message);
        return;
      }

      const pending = pendingRef.current.get(id);
      if (!pending) return;
      pendingRef.current.delete(id);

      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(result);
      }
    };

    worker.onerror = (e) => {
      // Reject all pending with the worker error
      for (const [, cb] of pendingRef.current) {
        cb.reject(new Error(e.message));
      }
      pendingRef.current.clear();
    };

    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const runDraw = useCallback(
    (seed: string, teams: TeamData[], preset: PresetConfig): Promise<DrawResult> => {
      return new Promise((resolve, reject) => {
        const id = crypto.randomUUID();
        pendingRef.current.set(id, { resolve: resolve as (v: unknown) => void, reject });
        workerRef.current?.postMessage({
          type: "draw",
          payload: { seed, teams, preset },
          id,
        });
      });
    },
    []
  );

  const runVerify = useCallback(
    (proof: Proof): Promise<VerifyResult> => {
      return new Promise((resolve, reject) => {
        const id = crypto.randomUUID();
        pendingRef.current.set(id, { resolve: resolve as (v: unknown) => void, reject });
        workerRef.current?.postMessage({
          type: "verify",
          payload: { proof },
          id,
        });
      });
    },
    []
  );

  return { runDraw, runVerify };
}
