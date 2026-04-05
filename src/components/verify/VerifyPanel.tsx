import { useState } from "react";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { decodeProofFromUrl } from "@/crypto/proof";
import { verifyDraw } from "@/crypto/draw-engine";
import type { VerifyResult } from "@/config/types";

interface VerifyPanelProps {
  initialFragment?: string;
}

export function VerifyPanel({ initialFragment }: VerifyPanelProps) {
  const [url, setUrl] = useState(initialFragment ? `https://fairdraw.io/verify${initialFragment}` : "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "fail" | "error">("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [progress, setProgress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleVerify() {
    setStatus("loading");
    setProgress("Re-running the draw from scratch...");
    setResult(null);
    setErrorMsg("");

    try {
      // Extract fragment from URL
      let fragment = "";
      try {
        const parsed = new URL(url);
        fragment = parsed.hash;
      } catch {
        // Not a full URL, maybe just the fragment
        fragment = url.startsWith("#") ? url : "#" + url;
      }

      const proof = decodeProofFromUrl(fragment);
      const verifyResult = await verifyDraw(proof, (msg) => setProgress(msg));

      setResult(verifyResult);
      setStatus(verifyResult.valid ? "success" : "fail");
    } catch (err) {
      setErrorMsg((err as Error).message.includes("proof")
        ? "This verification link doesn't look right. Make sure you copied the full link."
        : (err as Error).message);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label htmlFor="verify-url" className="text-sm font-medium text-[#F0F4F8]">
          Paste the verification link
        </label>
        <div className="flex gap-2">
          <Input
            id="verify-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && url && handleVerify()}
            aria-label="Verification link"
          />
          <Button
            onClick={handleVerify}
            disabled={!url || status === "loading"}
            aria-label="Check this draw result"
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Check It"
            )}
          </Button>
        </div>
        {status === "loading" && (
          <p className="text-sm text-[#8899AA] flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-teal" />
            {progress}
          </p>
        )}
      </div>

      {status === "error" && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Couldn't check this link</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {status === "success" && result && (
        <div className="space-y-4 animate-fade-in">
          <Alert variant="success" className="border-teal bg-teal/10">
            <ShieldCheck className="h-5 w-5 text-teal" />
            <AlertTitle className="text-teal text-lg font-semibold">
              Confirmed — This draw is genuine
            </AlertTitle>
            <AlertDescription className="text-[#F0F4F8] mt-1">
              We re-ran the draw using the same public number and got the exact same result.
              Nobody tampered with it.
            </AlertDescription>
          </Alert>

          <div className="rounded-md border border-teal/20 bg-teal/5 p-4 space-y-2">
            <p className="text-xs text-[#8899AA] uppercase tracking-wide font-medium">
              Draw details
            </p>
            <p className="text-sm text-[#F0F4F8]">
              <span className="text-[#8899AA]">Public number:</span>{" "}
              <span className="font-mono">{result.original.seed}</span>
            </p>
            <p className="text-sm text-[#F0F4F8]">
              <span className="text-[#8899AA]">Items drawn:</span>{" "}
              {result.original.teams.length} into {result.original.group_count} groups
            </p>
            <p className="text-sm text-[#F0F4F8]">
              <span className="text-[#8899AA]">Date:</span>{" "}
              {new Date(result.original.timestamp_utc).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {status === "fail" && result && (
        <div className="animate-fade-in">
          <Alert variant="destructive" className="border-destructive bg-destructive/10">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">
              Mismatch — Something is wrong
            </AlertTitle>
            <AlertDescription className="mt-1">
              We re-ran the draw and got a different result. The claimed result does not match the
              public number. This draw may have been altered.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
