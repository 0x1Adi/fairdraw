import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Wifi, WifiOff } from "lucide-react";

interface BeaconFetchProps {
  onSeedChange: (seed: string, beaconHex: string) => void;
}

interface DrandResponse {
  round: number;
  randomness: string;
  signature: string;
  previous_signature: string;
}

export function BeaconFetch({ onSeedChange }: BeaconFetchProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [beaconData, setBeaconData] = useState<DrandResponse | null>(null);

  async function fetchBeacon() {
    setStatus("loading");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch("https://api.drand.sh/public/latest", {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: DrandResponse = await res.json();

      // Validate response schema
      if (typeof data.randomness !== "string" || !/^[0-9a-f]{64}$/i.test(data.randomness)) {
        throw new Error("Unexpected response format from beacon");
      }

      setBeaconData(data);
      setStatus("success");
      onSeedChange("beacon:" + data.randomness, data.randomness);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setStatus("error");
      } else {
        setStatus("error");
      }
      onSeedChange("", "");
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#8899AA]">
        Grab a number from an independent public service that nobody controls
      </p>

      <Button
        type="button"
        variant={status === "success" ? "outline" : "default"}
        onClick={fetchBeacon}
        disabled={status === "loading"}
        className="w-full sm:w-auto"
        aria-label="Get latest number from internet randomness service"
      >
        {status === "loading" ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Fetching...</>
        ) : status === "success" ? (
          <><Wifi className="h-4 w-4 text-teal" /> Got it! Fetch again</>
        ) : status === "error" ? (
          <><WifiOff className="h-4 w-4" /> Try again</>
        ) : (
          "Get Latest Number"
        )}
      </Button>

      {status === "error" && (
        <p className="text-sm text-[#FFB547]">
          Couldn't reach the internet randomness service. Try again in a moment, or use dice or a custom number instead.
        </p>
      )}

      {beaconData && status === "success" && (
        <div className="rounded-md border border-teal/30 bg-teal/5 p-4 space-y-3">
          <p className="text-sm font-medium text-teal">Got it!</p>
          <div className="space-y-1">
            <p className="text-xs text-[#8899AA]">Round: {beaconData.round}</p>
            <p className="font-mono text-xs text-[#F0F4F8] break-all leading-relaxed">
              {beaconData.randomness}
            </p>
          </div>
          <p className="text-xs text-[#8899AA]">
            This number comes from the League of Entropy — a network of independent organizations
            that publish random numbers every 30 seconds. No single organization controls it.
          </p>
        </div>
      )}
    </div>
  );
}
