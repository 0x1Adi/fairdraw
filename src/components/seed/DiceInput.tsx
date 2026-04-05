import { useState } from "react";

interface DiceInputProps {
  onSeedChange: (seed: string) => void;
}

const DICE_COUNT = 20;

export function DiceInput({ onSeedChange }: DiceInputProps) {
  const [values, setValues] = useState<string[]>(Array(DICE_COUNT).fill(""));

  function handleChange(index: number, value: string) {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const next = [...values];
    next[index] = digit;
    setValues(next);
    const seed = next.join("");
    if (seed.length === DICE_COUNT) onSeedChange("dice:" + seed);
    else onSeedChange("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "ArrowRight" || e.key === "Tab") {
      const next = document.getElementById(`die-${index + 1}`);
      next?.focus();
    } else if (e.key === "ArrowLeft" || (e.key === "Backspace" && !values[index])) {
      const prev = document.getElementById(`die-${index - 1}`);
      prev?.focus();
    }
  }

  const filled = values.filter((v) => v !== "").length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#8899AA]">
        Click each die to enter your roll (0-9)
      </p>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}
        role="group"
        aria-label="Dice input grid"
      >
        {values.map((val, i) => (
          <input
            key={i}
            id={`die-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={val}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={`w-full aspect-square text-center text-lg font-mono rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-1 focus:ring-offset-navy ${
              val
                ? "border-teal bg-teal/10 text-teal"
                : "border-border bg-muted text-[#8899AA] hover:border-[#8899AA]"
            }`}
            aria-label={`Die ${i + 1}${val ? `, showing ${val}` : ""}`}
          />
        ))}
      </div>
      <p className="text-xs text-[#8899AA]">
        20 dice gives you plenty of randomness for any draw
        {filled > 0 && (
          <span className="ml-2 text-teal">· {filled}/{DICE_COUNT} entered</span>
        )}
      </p>
    </div>
  );
}
