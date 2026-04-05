/**
 * End-to-end verification tests.
 *
 * These tests cover the full pipeline:
 *   executeDraw → proof → encodeProofToUrl → decodeProofFromUrl → verifyDraw
 *
 * They specifically guard against the bug where verifyDraw hardcoded
 * assignment_type: "permutation", causing permutation_per_pot draws
 * (e.g. FIFA-style) to always report a mismatch.
 */

import { describe, it, expect } from "vitest";
import { executeDraw, verifyDraw } from "@/crypto/draw-engine";
import { encodeProofToUrl, decodeProofFromUrl } from "@/crypto/proof";
import type { PresetConfig, TeamData } from "@/config/types";

// ─── Fixtures ───────────────────────────────────────────────────────────────

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

// 12 teams split into 3 pots of 4, mimicking FIFA structure
const POT1_TEAMS: TeamData[] = [
  { name: "USA", confederation: "CONCACAF", pot: 1, is_host: true },
  { name: "France", confederation: "UEFA", pot: 1 },
  { name: "Brazil", confederation: "CONMEBOL", pot: 1 },
  { name: "Germany", confederation: "UEFA", pot: 1 },
];

const POT2_TEAMS: TeamData[] = [
  { name: "Spain", confederation: "UEFA", pot: 2 },
  { name: "Argentina", confederation: "CONMEBOL", pot: 2 },
  { name: "Japan", confederation: "AFC", pot: 2 },
  { name: "Morocco", confederation: "CAF", pot: 2 },
];

const POT3_TEAMS: TeamData[] = [
  { name: "Croatia", confederation: "UEFA", pot: 3 },
  { name: "Senegal", confederation: "CAF", pot: 3 },
  { name: "Mexico", confederation: "CONCACAF", pot: 3 },
  { name: "Australia", confederation: "AFC", pot: 3 },
];

const ALL_POT_TEAMS = [...POT1_TEAMS, ...POT2_TEAMS, ...POT3_TEAMS];

const PER_POT_PRESET: PresetConfig = {
  id: "fifa_test",
  name: "FIFA Test",
  description: "",
  category: "sports",
  featured: false,
  icon: "trophy",
  group_count: 4,
  group_size: 3,
  assignment_type: "permutation_per_pot",
  pots: [
    { id: "pot1", name: "Pot 1", locked: true,  teams: POT1_TEAMS },
    { id: "pot2", name: "Pot 2", locked: false, teams: POT2_TEAMS },
    { id: "pot3", name: "Pot 3", locked: false, teams: POT3_TEAMS },
  ],
  constraints: [
    {
      type: "max_per_group",
      field: "confederation",
      max: 1,
      description: "No two teams from same confederation per group",
    },
  ],
  teams_file: null,
};

// ─── verifyDraw — permutation ────────────────────────────────────────────────

describe("verifyDraw — permutation preset", () => {
  it("verifies a simple draw as valid", async () => {
    const result = await executeDraw("verify-simple-seed", SIMPLE_TEAMS, SIMPLE_PRESET);
    const { valid } = await verifyDraw(result.proof);
    expect(valid).toBe(true);
  }, 30000);

  it("recomputed assignment matches original", async () => {
    const result = await executeDraw("recompute-test", SIMPLE_TEAMS, SIMPLE_PRESET);
    const { recomputed } = await verifyDraw(result.proof);
    expect(JSON.stringify(recomputed.proof.assignment)).toBe(
      JSON.stringify(result.proof.assignment)
    );
  }, 30000);

  it("detects a tampered assignment (wrong group indices)", async () => {
    const result = await executeDraw("tamper-test", SIMPLE_TEAMS, SIMPLE_PRESET);
    const tampered = structuredClone(result.proof);
    // Swap team_indices in group A and group B
    const tmp = tampered.assignment[0].team_indices;
    tampered.assignment[0].team_indices = tampered.assignment[1].team_indices;
    tampered.assignment[1].team_indices = tmp;
    const { valid } = await verifyDraw(tampered);
    expect(valid).toBe(false);
  }, 30000);

  it("detects a tampered seed", async () => {
    const result = await executeDraw("real-seed", SIMPLE_TEAMS, SIMPLE_PRESET);
    const tampered = structuredClone(result.proof);
    tampered.seed = "fake-seed";
    const { valid } = await verifyDraw(tampered);
    expect(valid).toBe(false);
  }, 30000);

  it("verifies correctly across 5 different seeds", async () => {
    for (let i = 0; i < 5; i++) {
      const result = await executeDraw(`multi-seed-${i}`, SIMPLE_TEAMS, SIMPLE_PRESET);
      const { valid } = await verifyDraw(result.proof);
      expect(valid).toBe(true);
    }
  }, 60000);
});

// ─── verifyDraw — permutation_per_pot ────────────────────────────────────────

describe("verifyDraw — permutation_per_pot preset (regression: was always mismatch)", () => {
  it("verifies a pot-based draw as valid", async () => {
    const result = await executeDraw("pot-seed-1", ALL_POT_TEAMS, PER_POT_PRESET);
    const { valid } = await verifyDraw(result.proof);
    expect(valid).toBe(true);
  }, 30000);

  it("proof stores assignment_type = permutation_per_pot", async () => {
    const result = await executeDraw("pot-seed-2", ALL_POT_TEAMS, PER_POT_PRESET);
    expect(result.proof.assignment_type).toBe("permutation_per_pot");
  }, 30000);

  it("proof stores pot structure with correct team indices", async () => {
    const result = await executeDraw("pot-seed-3", ALL_POT_TEAMS, PER_POT_PRESET);
    expect(result.proof.pots).toBeDefined();
    expect(result.proof.pots).toHaveLength(3);
    // pot1 is locked, has 4 teams
    const pot1 = result.proof.pots![0];
    expect(pot1.locked).toBe(true);
    expect(pot1.team_indices).toHaveLength(4);
    // All indices must be valid positions in proof.teams
    for (const idx of pot1.team_indices) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(ALL_POT_TEAMS.length);
    }
  }, 30000);

  it("recomputed assignment matches original for pot-based draw", async () => {
    const result = await executeDraw("pot-recompute", ALL_POT_TEAMS, PER_POT_PRESET);
    const { recomputed } = await verifyDraw(result.proof);
    expect(JSON.stringify(recomputed.proof.assignment)).toBe(
      JSON.stringify(result.proof.assignment)
    );
  }, 30000);

  it("detects tampered assignment in pot-based draw", async () => {
    const result = await executeDraw("pot-tamper", ALL_POT_TEAMS, PER_POT_PRESET);
    const tampered = structuredClone(result.proof);
    tampered.assignment[0].team_indices = tampered.assignment[0].team_indices.map(
      (i) => (i + 1) % ALL_POT_TEAMS.length
    );
    const { valid } = await verifyDraw(tampered);
    expect(valid).toBe(false);
  }, 30000);

  it("verifies correctly across 5 different seeds", async () => {
    for (let i = 0; i < 5; i++) {
      const result = await executeDraw(`pot-multi-${i}`, ALL_POT_TEAMS, PER_POT_PRESET);
      const { valid } = await verifyDraw(result.proof);
      expect(valid).toBe(true);
    }
  }, 60000);
});

// ─── Full pipeline: encode → decode → verify ─────────────────────────────────

describe("full pipeline — encode proof to URL, decode, then verify", () => {
  it("permutation: encode → decode → verify succeeds", async () => {
    const result = await executeDraw("url-round-trip", SIMPLE_TEAMS, SIMPLE_PRESET);
    const url = encodeProofToUrl(result.proof, "fairdraw.io");
    const fragment = "#proof=" + url.split("#proof=")[1];
    const decoded = decodeProofFromUrl(fragment);
    const { valid } = await verifyDraw(decoded);
    expect(valid).toBe(true);
  }, 30000);

  it("permutation_per_pot: encode → decode → verify succeeds", async () => {
    const result = await executeDraw("pot-url-round-trip", ALL_POT_TEAMS, PER_POT_PRESET);
    const url = encodeProofToUrl(result.proof, "fairdraw.io");
    const fragment = "#proof=" + url.split("#proof=")[1];
    const decoded = decodeProofFromUrl(fragment);
    expect(decoded.assignment_type).toBe("permutation_per_pot");
    expect(decoded.pots).toBeDefined();
    const { valid } = await verifyDraw(decoded);
    expect(valid).toBe(true);
  }, 30000);

  it("decoded proof preserves all fields through compression", async () => {
    const result = await executeDraw("field-preservation", SIMPLE_TEAMS, SIMPLE_PRESET);
    const url = encodeProofToUrl(result.proof, "fairdraw.io");
    const decoded = decodeProofFromUrl("#proof=" + url.split("#proof=")[1]);
    expect(decoded.version).toBe(result.proof.version);
    expect(decoded.seed).toBe(result.proof.seed);
    expect(decoded.seed_hash).toBe(result.proof.seed_hash);
    expect(decoded.teams).toHaveLength(result.proof.teams.length);
    expect(decoded.cycle_walk_count).toBe(result.proof.cycle_walk_count);
    expect(JSON.stringify(decoded.assignment)).toBe(
      JSON.stringify(result.proof.assignment)
    );
  }, 30000);

  it("tampered URL (modified encoded payload) is rejected at decode", async () => {
    const result = await executeDraw("tamper-url", SIMPLE_TEAMS, SIMPLE_PRESET);
    const url = encodeProofToUrl(result.proof, "fairdraw.io");
    // Corrupt the last 8 chars of the base64url payload
    const corrupted = url.slice(0, -8) + "AAAAAAAA";
    expect(() =>
      decodeProofFromUrl("#proof=" + corrupted.split("#proof=")[1])
    ).toThrow();
  }, 30000);
});
