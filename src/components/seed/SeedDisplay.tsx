import { useState, useEffect } from "react";
import { sha256, toHex } from "@/crypto/hmac";

interface SeedDisplayProps {
  seed: string;
}

export function SeedDisplay({ seed }: SeedDisplayProps) {
  const [fingerprint, setFingerprint] = useState<string>("");

  useEffect(() => {
    if (!seed) { setFingerprint(""); return; }
    let cancelled = false;
    sha256(new TextEncoder().encode(seed)).then((hash) => {
      if (!cancelled) setFingerprint(toHex(hash));
    });
    return () => { cancelled = true; };
  }, [seed]);

  if (!fingerprint) return null;

  return (
    <div className="rounded-md border border-border bg-[#060E1C] p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-teal animate-pulse" />
        <span className="text-xs font-medium text-[#8899AA] uppercase tracking-wide">
          Digital fingerprint of your number
        </span>
      </div>
      <p
        className="font-mono text-sm text-teal break-all leading-relaxed"
        aria-label="Digital fingerprint"
      >
        {fingerprint}
      </p>
      <p className="text-xs text-[#8899AA]">
        This is a tamper-evident seal — it proves the number wasn't changed after the draw.
      </p>
    </div>
  );
}
