import { useState } from "react";
import { sha256, toHex } from "@/crypto/hmac";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DiceInput } from "./DiceInput";
import { BeaconFetch } from "./BeaconFetch";
import { SeedDisplay } from "./SeedDisplay";
import { Loader2, AlertTriangle } from "lucide-react";
import type { DrawState } from "@/config/types";

interface SeedPanelProps {
  state: DrawState;
  onSeedChange: (
    seed: string,
    source: DrawState["seedSource"]
  ) => void;
  onGenerate: () => void;
}

export function SeedPanel({ state, onSeedChange, onGenerate }: SeedPanelProps) {
  const [customText, setCustomText] = useState("");
  const [partyInputs, setPartyInputs] = useState(["", ""]);
  const [diceValue, setDiceValue] = useState("");
  const [beaconHex, setBeaconHex] = useState("");

  async function combineHybrid(dice: string, beacon: string) {
    if (!dice || !beacon) return;
    const combined = `${dice}|${beacon}`;
    const hash = await sha256(new TextEncoder().encode(combined));
    onSeedChange(toHex(hash), "hybrid");
  }

  async function combineMultiParty(inputs: string[]) {
    const filled = inputs.filter((s) => s.trim());
    if (filled.length < 2) return;
    const combined = filled.join("|");
    const hash = await sha256(new TextEncoder().encode(combined));
    onSeedChange(toHex(hash), "multi_party");
  }

  function handleDiceChange(seed: string) {
    const raw = seed.replace("dice:", "");
    setDiceValue(raw);
    onSeedChange(seed, "dice");
  }

  function handleBeaconChange(seed: string, hex: string) {
    setBeaconHex(hex);
    if (seed) onSeedChange(seed, "beacon");
  }

  function handleCustomChange(val: string) {
    setCustomText(val);
    onSeedChange(val, "custom");
  }

  function updateParty(index: number, val: string) {
    const next = [...partyInputs];
    next[index] = val;
    setPartyInputs(next);
    combineMultiParty(next);
  }

  const isReady = state.seed.length > 0;
  const isShort = state.seedSource === "custom" && state.seed.length < 8;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#F0F4F8]">
          Choose your public number
        </h2>
        <p className="mt-1 text-[#8899AA] text-sm">
          This is the single number that decides the draw. Everyone can see it. No one can change it after the fact.
        </p>
      </div>

      <Tabs
        defaultValue="dice"
        onValueChange={() => onSeedChange("", state.seedSource)}
        className="w-full"
      >
        <TabsList className="flex w-full h-auto flex-wrap gap-1 bg-muted p-1">
          <TabsTrigger value="dice" className="text-xs sm:text-sm">Roll Dice</TabsTrigger>
          <TabsTrigger value="beacon" className="text-xs sm:text-sm">Internet Randomness</TabsTrigger>
          <TabsTrigger value="custom" className="text-xs sm:text-sm">Your Own Number</TabsTrigger>
          <TabsTrigger value="hybrid" className="text-xs sm:text-sm">Combined ★</TabsTrigger>
          <TabsTrigger value="multi_party" className="text-xs sm:text-sm">Multiple People</TabsTrigger>
        </TabsList>

        <div className="mt-4 rounded-md border border-border bg-card p-4">
          <TabsContent value="dice" className="mt-0">
            <DiceInput onSeedChange={handleDiceChange} />
          </TabsContent>

          <TabsContent value="beacon" className="mt-0">
            <BeaconFetch onSeedChange={handleBeaconChange} />
          </TabsContent>

          <TabsContent value="custom" className="mt-0">
            <div className="space-y-3">
              <p className="text-sm text-[#8899AA]">
                Type or paste any text — a phrase, a number, anything
              </p>
              <Input
                value={customText}
                onChange={(e) => handleCustomChange(e.target.value)}
                placeholder="Type anything here..."
                aria-label="Custom public number"
              />
              {isShort && customText.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-amber">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Short inputs mean less randomness. Consider using dice or the internet source for high-stakes draws.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="hybrid" className="mt-0">
            <div className="space-y-4">
              <p className="text-sm text-[#8899AA]">
                Use BOTH dice rolls and an internet number together — the gold standard
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[#8899AA] mb-2 font-medium uppercase tracking-wide">
                    Step 1: Roll Dice
                  </p>
                  <DiceInput onSeedChange={(s) => {
                    const raw = s.replace("dice:", "");
                    setDiceValue(raw);
                    combineHybrid(raw, beaconHex);
                  }} />
                </div>
                <div>
                  <p className="text-xs text-[#8899AA] mb-2 font-medium uppercase tracking-wide">
                    Step 2: Get Internet Number
                  </p>
                  <BeaconFetch onSeedChange={(_, hex) => {
                    setBeaconHex(hex);
                    combineHybrid(diceValue, hex);
                  }} />
                </div>
              </div>
              <p className="text-xs text-[#8899AA]">
                We combine your dice rolls with the internet number into one. Even if one source was compromised, the other keeps it fair.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="multi_party" className="mt-0">
            <div className="space-y-4">
              <p className="text-sm text-[#8899AA]">
                Each person contributes a number. Nobody alone can rig it.
              </p>
              <div className="space-y-2">
                {partyInputs.map((val, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-[#8899AA] w-20 shrink-0">
                      Person {i + 1}
                    </span>
                    <Input
                      value={val}
                      onChange={(e) => updateParty(i, e.target.value)}
                      placeholder={`Person ${i + 1}'s number`}
                      aria-label={`Person ${i + 1} contribution`}
                    />
                  </div>
                ))}
              </div>
              {partyInputs.length < 8 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPartyInputs([...partyInputs, ""])}
                >
                  Add another person
                </Button>
              )}
              <p className="text-xs text-[#8899AA]">
                We combine all contributions together. As long as at least one person is honest, the draw is fair.
              </p>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <SeedDisplay seed={state.seed} />

      <Button
        size="xl"
        onClick={onGenerate}
        disabled={!isReady || state.isComputing}
        className="w-full text-base font-semibold"
        aria-label="Run the draw"
      >
        {state.isComputing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {state.progressMessage ?? "Finding a fair arrangement..."}
          </>
        ) : (
          "Run the Draw"
        )}
      </Button>
    </div>
  );
}
