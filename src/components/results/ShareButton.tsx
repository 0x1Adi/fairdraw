import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { encodeProofToUrl } from "@/crypto/proof";
import { getBrandConfig } from "@/config/loader";
import { toast } from "sonner";
import type { Proof } from "@/config/types";

interface ShareButtonProps {
  proof: Proof;
}

export function ShareButton({ proof }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const brand = getBrandConfig().brand;

  async function handleShare() {
    const url = encodeProofToUrl(proof, brand.domain);

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied! Anyone with this link can independently check the result.", {
        duration: 4000,
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback: show the URL
      toast.info("Copy this link to share:", {
        description: url.slice(0, 60) + "...",
        duration: 8000,
      });
    }
  }

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        onClick={handleShare}
        className="w-full sm:w-auto gap-2"
        aria-label="Share and verify draw result"
      >
        {copied ? (
          <><Check className="h-4 w-4" /> Copied!</>
        ) : (
          <><Share2 className="h-4 w-4" /> Share & Verify</>
        )}
      </Button>
      <p className="text-xs text-[#8899AA]">
        This link contains everything needed to re-run the draw. Share it with anyone who wants to confirm the result.
      </p>
    </div>
  );
}
