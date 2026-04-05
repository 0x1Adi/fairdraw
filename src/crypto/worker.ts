// Web Worker entry — runs crypto off main thread
import { executeDraw, verifyDraw } from "./draw-engine";
import type { TeamData, PresetConfig, Proof } from "../config/types";

export type WorkerMessage =
  | {
      type: "draw";
      payload: { seed: string; teams: TeamData[]; preset: PresetConfig };
      id: string;
    }
  | {
      type: "verify";
      payload: { proof: Proof };
      id: string;
    };

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = e.data;

  const onProgress = (message: string) => {
    self.postMessage({ type: "progress", id, message });
  };

  try {
    let result;
    if (type === "draw") {
      result = await executeDraw(
        payload.seed,
        payload.teams,
        payload.preset,
        onProgress
      );
    } else if (type === "verify") {
      result = await verifyDraw(payload.proof, onProgress);
    } else {
      throw new Error(`Unknown message type: ${type}`);
    }
    self.postMessage({ type: "result", id, result, error: null });
  } catch (error) {
    self.postMessage({
      type: "result",
      id,
      result: null,
      error: (error as Error).message,
    });
  }
};
