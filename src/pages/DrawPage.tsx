import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { PresetSelector } from "@/components/setup/PresetSelector";
import { TeamInput } from "@/components/setup/TeamInput";
import { GroupConfig } from "@/components/setup/GroupConfig";
import { ConstraintBuilder } from "@/components/setup/ConstraintBuilder";
import { SeedPanel } from "@/components/seed/SeedPanel";
import { GroupGrid } from "@/components/results/GroupGrid";
import { ConstraintBadges } from "@/components/results/ConstraintBadges";
import { ProofCard } from "@/components/results/ProofCard";
import { ShareButton } from "@/components/results/ShareButton";
import { useCryptoWorker } from "@/hooks/useCryptoWorker";
import { usePreset, usePresets } from "@/hooks/usePresets";
import { validateDrawConfig, validateSeed } from "@/config/validator";
import yaml from "js-yaml";
import type { DrawState, TeamData, PresetConfig } from "@/config/types";
import { getCopyValue } from "@/hooks/useCopy";

function loadFifaTeams(): TeamData[] {
  // Inline FIFA 2026 team data for the preset
  return [
    { name: "USA", confederation: "CONCACAF", pot: 1, is_host: true, ranking: 1 },
    { name: "Mexico", confederation: "CONCACAF", pot: 1, is_host: true, ranking: 2 },
    { name: "Canada", confederation: "CONCACAF", pot: 1, is_host: true, ranking: 3 },
    { name: "Argentina", confederation: "CONMEBOL", pot: 1, ranking: 4 },
    { name: "France", confederation: "UEFA", pot: 1, ranking: 5 },
    { name: "England", confederation: "UEFA", pot: 1, ranking: 6 },
    { name: "Brazil", confederation: "CONMEBOL", pot: 1, ranking: 7 },
    { name: "Spain", confederation: "UEFA", pot: 1, ranking: 8 },
    { name: "Germany", confederation: "UEFA", pot: 1, ranking: 9 },
    { name: "Portugal", confederation: "UEFA", pot: 1, ranking: 10 },
    { name: "Netherlands", confederation: "UEFA", pot: 1, ranking: 11 },
    { name: "Belgium", confederation: "UEFA", pot: 1, ranking: 12 },
    { name: "Colombia", confederation: "CONMEBOL", pot: 2, ranking: 13 },
    { name: "Italy", confederation: "UEFA", pot: 2, ranking: 14 },
    { name: "Croatia", confederation: "UEFA", pot: 2, ranking: 15 },
    { name: "Morocco", confederation: "CAF", pot: 2, ranking: 16 },
    { name: "Japan", confederation: "AFC", pot: 2, ranking: 17 },
    { name: "Uruguay", confederation: "CONMEBOL", pot: 2, ranking: 18 },
    { name: "Denmark", confederation: "UEFA", pot: 2, ranking: 19 },
    { name: "Senegal", confederation: "CAF", pot: 2, ranking: 20 },
    { name: "South Korea", confederation: "AFC", pot: 2, ranking: 21 },
    { name: "Switzerland", confederation: "UEFA", pot: 2, ranking: 22 },
    { name: "Austria", confederation: "UEFA", pot: 2, ranking: 23 },
    { name: "Australia", confederation: "AFC", pot: 2, ranking: 24 },
    { name: "Ukraine", confederation: "UEFA", pot: 3, ranking: 25 },
    { name: "Turkey", confederation: "UEFA", pot: 3, ranking: 26 },
    { name: "Poland", confederation: "UEFA", pot: 3, ranking: 27 },
    { name: "Serbia", confederation: "UEFA", pot: 3, ranking: 28 },
    { name: "Ecuador", confederation: "CONMEBOL", pot: 3, ranking: 29 },
    { name: "Iran", confederation: "AFC", pot: 3, ranking: 30 },
    { name: "Nigeria", confederation: "CAF", pot: 3, ranking: 31 },
    { name: "Cameroon", confederation: "CAF", pot: 3, ranking: 32 },
    { name: "Ghana", confederation: "CAF", pot: 3, ranking: 33 },
    { name: "Tunisia", confederation: "CAF", pot: 3, ranking: 34 },
    { name: "Egypt", confederation: "CAF", pot: 3, ranking: 35 },
    { name: "Saudi Arabia", confederation: "AFC", pot: 3, ranking: 36 },
    { name: "Paraguay", confederation: "CONMEBOL", pot: 4, ranking: 37 },
    { name: "Costa Rica", confederation: "CONCACAF", pot: 4, ranking: 38 },
    { name: "Jamaica", confederation: "CONCACAF", pot: 4, ranking: 39 },
    { name: "Honduras", confederation: "CONCACAF", pot: 4, ranking: 40 },
    { name: "Panama", confederation: "CONCACAF", pot: 4, ranking: 41 },
    { name: "Qatar", confederation: "AFC", pot: 4, ranking: 42 },
    { name: "China", confederation: "AFC", pot: 4, ranking: 43 },
    { name: "Iraq", confederation: "AFC", pot: 4, ranking: 44 },
    { name: "Algeria", confederation: "CAF", pot: 4, ranking: 45 },
    { name: "Mali", confederation: "CAF", pot: 4, ranking: 46 },
    { name: "New Zealand", confederation: "OFC", pot: 4, ranking: 47 },
    { name: "Peru", confederation: "CONMEBOL", pot: 4, ranking: 48 },
  ];
}

function buildPresetWithTeams(preset: PresetConfig, teams: TeamData[]): PresetConfig {
  if (preset.pots.length === 0) return { ...preset, pots: [] };

  const pots = preset.pots.map((pot) => ({
    ...pot,
    teams: teams.filter((t) => t.pot === parseInt(pot.id.replace("pot", ""))),
  }));
  return { ...preset, pots };
}

const STEPS = ["Set Up", "Public Number", "Results"];

export function DrawPage() {
  const { presetId } = useParams<{ presetId?: string }>();
  const presetDef = usePreset(presetId ?? "");

  const [state, setState] = useState<DrawState>({
    step: "setup",
    preset: null,
    teams: [],
    groups: 4,
    groupSize: 4,
    constraints: [],
    seed: "",
    seedSource: "custom",
    result: null,
    isComputing: false,
    error: null,
    progressMessage: null,
  });

  const [progress, setProgress] = useState("");

  const { runDraw } = useCryptoWorker(setProgress);

  useEffect(() => {
    if (presetDef) {
      const teams = presetDef.id === "fifa_2026" ? loadFifaTeams() : [];
      const preset = buildPresetWithTeams(presetDef, teams);
      setState((s) => ({
        ...s,
        preset: presetDef,
        teams,
        groups: presetDef.group_count ?? 4,
        groupSize: presetDef.group_size ?? 4,
        constraints: presetDef.constraints,
      }));
    }
  }, [presetDef]);

  function update<K extends keyof DrawState>(key: K, value: DrawState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function handleGenerate() {
    setState((s) => ({ ...s, error: null, isComputing: true, progressMessage: null }));

    try {
      validateSeed(state.seed);
      validateDrawConfig(state.teams, state.groups, state.groupSize);

      const activePreset = state.preset
        ? buildPresetWithTeams(state.preset, state.teams)
        : {
            id: "custom",
            name: "Custom Draw",
            description: "",
            category: "general",
            featured: false,
            icon: "shuffle",
            group_count: state.groups,
            group_size: state.groupSize,
            assignment_type: "permutation" as const,
            pots: [],
            constraints: state.constraints,
            teams_file: null,
          };

      const result = await runDraw(state.seed, state.teams, activePreset);
      setState((s) => ({
        ...s,
        result,
        step: "results",
        isComputing: false,
        progressMessage: null,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: (err as Error).message,
        isComputing: false,
        progressMessage: null,
      }));
    }
  }

  function goToStep(step: DrawState["step"]) {
    setState((s) => ({ ...s, step, error: null }));
  }

  const stepIndex = state.step === "setup" ? 0 : state.step === "seed" ? 1 : 2;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Stepper */}
      <nav className="flex items-center gap-0 mb-10" aria-label="Draw progress">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <button
              onClick={() => {
                if (i < stepIndex) goToStep(["setup", "seed", "results"][i] as DrawState["step"]);
              }}
              disabled={i > stepIndex}
              className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded transition-colors ${
                i === stepIndex
                  ? "text-teal"
                  : i < stepIndex
                  ? "text-[#8899AA] hover:text-[#F0F4F8] cursor-pointer"
                  : "text-[#8899AA]/40 cursor-not-allowed"
              }`}
              aria-current={i === stepIndex ? "step" : undefined}
            >
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full border text-xs ${
                  i === stepIndex
                    ? "border-teal bg-teal/10 text-teal"
                    : i < stepIndex
                    ? "border-teal/50 bg-teal/5 text-teal/70"
                    : "border-border text-[#8899AA]/40"
                }`}
              >
                {i < stepIndex ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < 2 && (
              <ChevronRight className="h-4 w-4 text-[#8899AA]/30 mx-1" aria-hidden="true" />
            )}
          </div>
        ))}
      </nav>

      {/* Error */}
      {state.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Setup */}
      {state.step === "setup" && (
        <div className="space-y-8">
          <PresetSelector
            selected={state.preset}
            onSelect={(p) => {
              if (p) {
                const teams = p.id === "fifa_2026" ? loadFifaTeams() : [];
                setState((s) => ({
                  ...s,
                  preset: p,
                  teams,
                  groups: p.group_count ?? s.groups,
                  groupSize: p.group_size ?? s.groupSize,
                  constraints: p.constraints,
                }));
              } else {
                setState((s) => ({ ...s, preset: null, teams: [], constraints: [] }));
              }
            }}
          />

          <Separator />

          <div className="space-y-6">
            {!state.preset && (
              <TeamInput
                teams={state.teams}
                onChange={(teams) => update("teams", teams)}
              />
            )}

            {state.preset && (
              <div className="rounded-md border border-border bg-card p-4 space-y-2">
                <p className="text-sm font-medium text-[#F0F4F8]">
                  {state.preset.name} — {state.teams.length} teams loaded
                </p>
                <p className="text-xs text-[#8899AA]">
                  Teams are pre-loaded from the template. You can run the draw immediately.
                </p>
              </div>
            )}

            {!state.preset && (
              <GroupConfig
                groups={state.groups}
                groupSize={state.groupSize}
                totalTeams={state.teams.length}
                onGroupsChange={(n) => update("groups", n)}
                onGroupSizeChange={(n) => update("groupSize", n)}
              />
            )}

            <ConstraintBuilder
              constraints={state.constraints}
              onChange={(c) => update("constraints", c)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={() => goToStep("seed")}
              disabled={state.teams.length === 0}
              className="gap-2"
            >
              Next: Choose Public Number
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Seed */}
      {state.step === "seed" && (
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToStep("setup")}
            className="gap-1.5 text-[#8899AA] -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to setup
          </Button>

          <SeedPanel
            state={{
              ...state,
              progressMessage: progress || state.progressMessage,
            }}
            onSeedChange={(seed, source) =>
              setState((s) => ({ ...s, seed, seedSource: source }))
            }
            onGenerate={handleGenerate}
          />
        </div>
      )}

      {/* Step 3: Results */}
      {state.step === "results" && state.result && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                {getCopyValue("draw.results.title")}
              </h2>
              {state.result.cycleWalkCount > 0 && (
                <p className="text-sm text-[#8899AA] mt-1">
                  Arrangements checked before finding a valid one:{" "}
                  <span className="text-[#F0F4F8] font-medium">{state.result.cycleWalkCount}</span>
                  {" — "}
                  Every arrangement was equally likely.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => goToStep("setup")}
                className="gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                New Draw
              </Button>
              <ShareButton proof={state.result.proof} />
            </div>
          </div>

          <ConstraintBadges
            constraints={state.constraints}
            assignment={state.result.assignment}
          />

          <GroupGrid assignment={state.result.assignment} />

          <ProofCard proof={state.result.proof} />
        </div>
      )}
    </div>
  );
}
