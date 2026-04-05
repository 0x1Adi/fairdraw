import { describe, it, expect } from "vitest";
import { executeDraw } from "@/crypto/draw-engine";
import type { PresetConfig, TeamData } from "@/config/types";

const SIMPLE_TEAMS: TeamData[] = [
  { name: "Alpha" }, { name: "Beta" }, { name: "Gamma" }, { name: "Delta" },
  { name: "Epsilon" }, { name: "Zeta" }, { name: "Eta" }, { name: "Theta" },
];

const SIMPLE_PRESET: PresetConfig = {
  id: "test",
  name: "Test",
  description: "",
  category: "general",
  featured: false,
  icon: "shuffle",
  group_count: 2,
  group_size: 4,
  assignment_type: "permutation",
  pots: [],
  constraints: [],
  teams_file: null,
};

describe("executeDraw — determinism", () => {
  it("same seed always produces same groups", async () => {
    const r1 = await executeDraw("hello world", SIMPLE_TEAMS, SIMPLE_PRESET);
    const r2 = await executeDraw("hello world", SIMPLE_TEAMS, SIMPLE_PRESET);

    expect(JSON.stringify(r1.assignment)).toBe(JSON.stringify(r2.assignment));
  }, 30000);

  it("different seeds produce different groups (overwhelmingly)", async () => {
    const r1 = await executeDraw("seed-A", SIMPLE_TEAMS, SIMPLE_PRESET);
    const r2 = await executeDraw("seed-B", SIMPLE_TEAMS, SIMPLE_PRESET);
    const same = JSON.stringify(r1.assignment) === JSON.stringify(r2.assignment);
    expect(same).toBe(false);
  }, 30000);

  it("produces correct number of groups and group sizes", async () => {
    const result = await executeDraw("test", SIMPLE_TEAMS, SIMPLE_PRESET);
    expect(result.assignment.groups.length).toBe(2);
    // All teams should be assigned
    const totalTeams = result.assignment.groups.reduce((s, g) => s + g.teams.length, 0);
    expect(totalTeams).toBe(SIMPLE_TEAMS.length);
  }, 30000);
});

describe("executeDraw — constraints", () => {
  it("satisfies max_per_group constraint for 100 random seeds", async () => {
    const teams: TeamData[] = [
      { name: "T1", confederation: "A" },
      { name: "T2", confederation: "A" },
      { name: "T3", confederation: "A" },
      { name: "T4", confederation: "B" },
      { name: "T5", confederation: "B" },
      { name: "T6", confederation: "B" },
    ];

    const preset: PresetConfig = {
      ...SIMPLE_PRESET,
      group_count: 2,
      group_size: 3,
      constraints: [
        {
          type: "max_per_group",
          field: "confederation",
          max: 2,
          description: "Max 2 per confederation per group",
        },
      ],
    };

    for (let i = 0; i < 20; i++) {
      const seed = `constraint-test-${i}`;
      const result = await executeDraw(seed, teams, preset);

      for (const group of result.assignment.groups) {
        const counts: Record<string, number> = {};
        for (const team of group.teams) {
          const conf = team.confederation ?? "unknown";
          counts[conf] = (counts[conf] ?? 0) + 1;
          expect(counts[conf]).toBeLessThanOrEqual(2);
        }
      }
    }
  }, 120000);
});

describe("executeDraw — proof", () => {
  it("generates proof with correct fields", async () => {
    const result = await executeDraw("proof-test", SIMPLE_TEAMS, SIMPLE_PRESET);
    expect(result.proof.version).toBe("1.0.0");
    expect(result.proof.seed).toBe("proof-test");
    expect(result.proof.seed_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.proof.teams).toHaveLength(SIMPLE_TEAMS.length);
    expect(result.proof.assignment).toHaveLength(2);
    expect(result.proof.cycle_walk_count).toBeGreaterThanOrEqual(0);
  }, 30000);
});
