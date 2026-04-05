import { useState } from "react";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { proofToJson } from "@/crypto/proof";
import type { Proof } from "@/config/types";

interface ProofCardProps {
  proof: Proof;
}

export function ProofCard({ proof }: ProofCardProps) {
  const [open, setOpen] = useState(false);

  function downloadJson() {
    const json = proofToJson(proof);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fairdraw-receipt-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const fields = [
    { label: "Public number used", value: proof.seed },
    { label: "Digital fingerprint", value: proof.seed_hash },
    { label: "Draw method version", value: proof.version },
    { label: "Date and time (UTC)", value: new Date(proof.timestamp_utc).toLocaleString() },
    { label: "Arrangements checked", value: String(proof.cycle_walk_count) },
  ];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between p-4">
        <p className="text-sm font-medium text-[#F0F4F8]">Draw receipt</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={downloadJson}
          aria-label="Download draw receipt as data file"
          className="gap-1.5 text-xs text-[#8899AA] hover:text-teal"
        >
          <Download className="h-3.5 w-3.5" />
          Download as data file
        </Button>
      </div>

      <Separator />

      <div className="p-4 space-y-2">
        {fields.slice(0, 3).map((field) => (
          <div key={field.label} className="flex flex-col gap-0.5">
            <span className="text-xs text-[#8899AA]">{field.label}</span>
            <span className={`text-sm break-all ${field.label.includes("fingerprint") ? "font-mono text-teal" : "text-[#F0F4F8]"}`}>
              {field.value}
            </span>
          </div>
        ))}
      </div>

      <Separator />

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            className="flex w-full items-center justify-between p-4 text-sm text-[#8899AA] hover:text-[#F0F4F8] transition-colors"
            aria-expanded={open}
          >
            <span>Show technical details</span>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {fields.slice(3).map((field) => (
              <div key={field.label} className="flex flex-col gap-0.5">
                <span className="text-xs text-[#8899AA]">{field.label}</span>
                <span className="text-sm text-[#F0F4F8]">{field.value}</span>
              </div>
            ))}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-[#8899AA]">Teams in this draw</span>
              <span className="text-sm text-[#F0F4F8]">{proof.teams.length} items</span>
            </div>
            <div>
              <p className="text-xs text-[#8899AA] mb-1">Full receipt (JSON)</p>
              <pre className="font-mono text-xs text-teal/80 bg-[#060E1C] rounded p-3 overflow-auto max-h-48 leading-relaxed">
                {proofToJson(proof).slice(0, 500)}...
              </pre>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
