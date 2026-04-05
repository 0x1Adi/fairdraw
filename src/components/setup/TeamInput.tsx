import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";
import { sanitizeTeamName } from "@/config/validator";
import type { TeamData } from "@/config/types";

interface TeamInputProps {
  teams: TeamData[];
  onChange: (teams: TeamData[]) => void;
}

export function TeamInput({ teams, onChange }: TeamInputProps) {
  const [raw, setRaw] = useState(teams.map((t) => t.name).join("\n"));

  function handleChange(value: string) {
    setRaw(value);
    const names = value
      .split(/[\n,]+/)
      .map((s) => sanitizeTeamName(s.trim()))
      .filter((s) => s.length > 0);
    onChange(names.map((name) => ({ name })));
  }

  return (
    <div className="space-y-2">
      <Label
        htmlFor="teams-input"
        className="text-sm font-medium text-[#F0F4F8]"
      >
        Who's in the draw?
      </Label>
      <Textarea
        id="teams-input"
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Paste names here — one per line, or separated by commas"
        className="min-h-[160px] resize-y font-mono text-sm"
        aria-label="Enter names for the draw, one per line"
      />
      <p className="text-xs text-[#8899AA]">
        Tip: copy-paste from a spreadsheet works great
        {teams.length > 0 && (
          <span className="ml-2 text-teal font-medium">
            · {teams.length} item{teams.length !== 1 ? "s" : ""}
          </span>
        )}
      </p>
    </div>
  );
}
