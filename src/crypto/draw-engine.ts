import type {
  TeamData,
  PresetConfig,
  ConstraintConfig,
  DrawResult,
  GroupAssignment,
  Proof,
} from "../config/types";
import { sha256, hmacSha256, toHex } from "./hmac";
import { bigintToFixedBytes, bytesToBigint } from "./bigint-utils";
import { feistelEncrypt } from "./feistel";
import { permutationUnrank, factorial } from "./permutation";
import { getBrandConfig, getCryptoConfig } from "../config/loader";

export type ProgressCallback = (message: string) => void;

async function hashJson(obj: unknown): Promise<string> {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  const hash = await sha256(bytes);
  return toHex(hash);
}

function checkAllConstraints(
  assignment: GroupAssignment,
  constraints: ConstraintConfig[]
): boolean {
  for (const constraint of constraints) {
    if (constraint.type === "max_per_group") {
      const max = constraint.max ?? 1;
      const field = constraint.field as keyof TeamData;
      for (const group of assignment.groups) {
        const counts = new Map<unknown, number>();
        for (const team of group.teams) {
          const val = team[field];
          if (val !== undefined && val !== null) {
            counts.set(val, (counts.get(val) ?? 0) + 1);
            if ((counts.get(val) ?? 0) > max) return false;
          }
        }
      }
    } else if (constraint.type === "fixed_position") {
      const field = constraint.field as keyof TeamData;
      const groupIdx = constraint.group ?? 0;
      const group = assignment.groups[groupIdx];
      if (!group) return false;
      // At least one team in this group must have the field truthy
      const hasMatcher = group.teams.some((t) => t[field]);
      if (!hasMatcher) return false;
    }
  }
  return true;
}

async function generateAssignment(
  teams: TeamData[],
  preset: PresetConfig,
  masterKey: Uint8Array,
  rounds: number,
  cycleWalkCount: number,
  onProgress?: ProgressCallback
): Promise<GroupAssignment> {
  const groupCount = preset.group_count ?? 1;
  const groups: GroupAssignment["groups"] = Array.from(
    { length: groupCount },
    (_, i) => ({
      group_label: String.fromCharCode(65 + i), // A, B, C...
      teams: [],
      team_indices: [],
    })
  );

  if (preset.assignment_type === "permutation_per_pot") {
    // Per-pot sub-key derivation
    const activePots = preset.pots
      .map((p, i) => ({ ...p, index: i }))
      .filter((p) => !p.locked);

    for (const pot of activePots) {
      if (pot.teams.length === 0) continue;

      onProgress?.(`Arranging group ${pot.name}...`);

      // Derive pot-specific key
      const potKeyInput = new Uint8Array([
        ...bigintToFixedBytes(BigInt(pot.index ?? 0), 4),
        ...bigintToFixedBytes(BigInt(cycleWalkCount), 4),
      ]);
      const potKey = await hmacSha256(masterKey, potKeyInput);

      const domainSize = factorial(pot.teams.length);
      const { ciphertext } = await feistelEncrypt(
        0n,
        potKey,
        domainSize,
        rounds,
        1000
      );
      const permutation = permutationUnrank(ciphertext, pot.teams.length);

      // permutation[i] = group index that pot.teams[i] goes to
      for (let i = 0; i < permutation.length; i++) {
        const groupIdx = permutation[i] % groupCount;
        const teamIdx = teams.indexOf(pot.teams[i]);
        groups[groupIdx].teams.push(pot.teams[i]);
        if (teamIdx >= 0) groups[groupIdx].team_indices.push(teamIdx);
      }
    }

    // Place locked pot (pot 1) teams — one per group in order
    const lockedPot = preset.pots.find((p) => p.locked);
    if (lockedPot && lockedPot.teams.length > 0) {
      for (let i = 0; i < lockedPot.teams.length && i < groupCount; i++) {
        const teamIdx = teams.indexOf(lockedPot.teams[i]);
        groups[i].teams.push(lockedPot.teams[i]);
        if (teamIdx >= 0) groups[i].team_indices.push(teamIdx);
      }
    }
  } else {
    // Simple permutation of all teams
    onProgress?.("Arranging items...");
    const potKeyInput = bigintToFixedBytes(BigInt(cycleWalkCount), 8);
    const potKey = await hmacSha256(masterKey, potKeyInput);

    const domainSize = factorial(teams.length);
    const { ciphertext } = await feistelEncrypt(
      0n,
      potKey,
      domainSize,
      rounds,
      1000
    );
    const permutation = permutationUnrank(ciphertext, teams.length);

    for (let i = 0; i < permutation.length; i++) {
      const groupIdx = Math.floor(i / (preset.group_size ?? 1));
      if (groupIdx < groupCount) {
        const teamIdx = permutation[i];
        groups[groupIdx].teams.push(teams[teamIdx]);
        groups[groupIdx].team_indices.push(teamIdx);
      }
    }
  }

  return { groups };
}

export async function executeDraw(
  seed: string,
  teams: TeamData[],
  preset: PresetConfig,
  onProgress?: ProgressCallback
): Promise<DrawResult> {
  const cryptoConfig = getCryptoConfig().crypto;
  const brandConfig = getBrandConfig().brand;

  const seedBytes = new TextEncoder().encode(seed);
  const key = await sha256(seedBytes);
  const seedHash = toHex(key);

  const teamsHash = await hashJson(teams);
  const constraintsHash = await hashJson(preset.constraints);

  let cycleWalkCount = 0;
  let assignment: GroupAssignment;

  onProgress?.("Starting the draw...");

  do {
    onProgress?.(
      cycleWalkCount === 0
        ? "Finding a fair arrangement..."
        : `Searching for a valid arrangement (attempt ${cycleWalkCount + 1})...`
    );

    const attemptKey = await hmacSha256(
      key,
      bigintToFixedBytes(BigInt(cycleWalkCount), 8)
    );

    assignment = await generateAssignment(
      teams,
      preset,
      attemptKey,
      cryptoConfig.feistel.rounds,
      cycleWalkCount,
      onProgress
    );

    if (checkAllConstraints(assignment, preset.constraints)) break;

    cycleWalkCount++;
    if (cycleWalkCount > cryptoConfig.feistel.max_cycle_walks) {
      throw new Error(
        `No valid arrangement found after ${cryptoConfig.feistel.max_cycle_walks} attempts. Try relaxing a rule.`
      );
    }
  } while (true);

  const proof: Proof = {
    version: "1.0.0",
    brand: brandConfig.name,
    timestamp_utc: new Date().toISOString(),
    seed,
    seed_hash: seedHash,
    seed_source: "custom",
    preset_id: preset.id,
    assignment_type: preset.assignment_type,
    pots:
      preset.assignment_type === "permutation_per_pot"
        ? preset.pots.map((p) => ({
            id: p.id,
            name: p.name,
            locked: p.locked,
            team_indices: p.teams
              .map((t) => teams.indexOf(t))
              .filter((i) => i >= 0),
          }))
        : undefined,
    teams,
    teams_hash: teamsHash,
    group_count: preset.group_count ?? assignment!.groups.length,
    group_size: preset.group_size ?? Math.ceil(teams.length / assignment!.groups.length),
    constraints: preset.constraints,
    constraints_hash: constraintsHash,
    assignment: assignment!.groups.map((g) => ({
      group_label: g.group_label,
      team_indices: g.team_indices,
    })),
    cycle_walk_count: cycleWalkCount,
    crypto_params: {
      feistel_rounds: cryptoConfig.feistel.rounds,
      prf: cryptoConfig.feistel.prf,
      hash: cryptoConfig.hash.algorithm,
    },
  };

  return { assignment: assignment!, proof, cycleWalkCount };
}

export async function verifyDraw(
  proof: Proof,
  onProgress?: ProgressCallback
): Promise<{ valid: boolean; recomputed: DrawResult; original: Proof }> {
  // Reconstruct preset-like config from proof
  const fakePreset: PresetConfig = {
    id: proof.preset_id ?? "custom",
    name: proof.preset_id ?? "Custom",
    description: "",
    category: "general",
    featured: false,
    icon: "shuffle",
    group_count: proof.group_count,
    group_size: proof.group_size,
    assignment_type: proof.assignment_type ?? "permutation",
    pots: proof.pots
      ? proof.pots.map((p) => ({
          id: p.id,
          name: p.name,
          locked: p.locked,
          teams: p.team_indices.map((i) => proof.teams[i]),
        }))
      : [],
    constraints: proof.constraints,
    teams_file: null,
  };

  const recomputed = await executeDraw(
    proof.seed,
    proof.teams,
    fakePreset,
    onProgress
  );

  // Compare assignments
  const valid = JSON.stringify(recomputed.proof.assignment) ===
    JSON.stringify(proof.assignment);

  return { valid, recomputed, original: proof };
}

export { checkAllConstraints };
