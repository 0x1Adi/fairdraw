import type { Proof } from "../config/types";
import { z } from "zod";
import pako from "pako";

// ─────────────────────────────────────────────
// Zod schema for proof validation — NEVER trust URL input
// ─────────────────────────────────────────────

const ConstraintSchema = z.object({
  type: z.enum(["max_per_group", "fixed_position", "seed_separation"]),
  field: z.string(),
  max: z.number().optional(),
  group: z.number().optional(),
  description: z.string(),
});

const TeamDataSchema = z.object({
  name: z.string(),
  pot: z.number().optional(),
  confederation: z.string().optional(),
  country: z.string().optional(),
  is_host: z.boolean().optional(),
  ranking: z.number().optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

const ProofSchema = z.object({
  version: z.literal("1.0.0"),
  brand: z.string(),
  timestamp_utc: z.string(),
  seed: z.string(),
  seed_hash: z.string(),
  seed_source: z.enum(["dice", "beacon", "custom", "hybrid", "multi_party"]),
  preset_id: z.string().nullable(),
  assignment_type: z.enum(["permutation", "permutation_per_pot"]).optional(),
  pots: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        locked: z.boolean(),
        team_indices: z.array(z.number()),
      })
    )
    .optional(),
  teams: z.array(TeamDataSchema),
  teams_hash: z.string(),
  group_count: z.number(),
  group_size: z.number(),
  constraints: z.array(ConstraintSchema),
  constraints_hash: z.string(),
  assignment: z.array(
    z.object({
      group_label: z.string(),
      team_indices: z.array(z.number()),
    })
  ),
  cycle_walk_count: z.number(),
  crypto_params: z.object({
    feistel_rounds: z.number(),
    prf: z.string(),
    hash: z.string(),
  }),
});

function validateProofSchema(obj: unknown): Proof {
  return ProofSchema.parse(obj) as Proof;
}

// ─────────────────────────────────────────────
// Base64URL encoding/decoding
// ─────────────────────────────────────────────

function base64urlEncode(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlDecode(str: string): Uint8Array {
  const padded =
    str.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ─────────────────────────────────────────────
// Compression using pako (deflate)
// ─────────────────────────────────────────────

function compress(data: Uint8Array): Uint8Array {
  return pako.deflate(data);
}

function decompress(data: Uint8Array): Uint8Array {
  return pako.inflate(data);
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export function encodeProofToUrl(proof: Proof, domain: string): string {
  const json = JSON.stringify(proof);
  const bytes = new TextEncoder().encode(json);
  const compressed = compress(bytes);
  const encoded = base64urlEncode(compressed);
  return `https://${domain}/verify#proof=${encoded}`;
}

export function decodeProofFromUrl(fragment: string): Proof {
  const encoded = fragment.replace(/^#?proof=/, "");
  if (!encoded) throw new Error("No proof data in URL");

  const compressed = base64urlDecode(encoded);
  const bytes = decompress(compressed);
  const json = new TextDecoder().decode(bytes);
  const obj = JSON.parse(json);
  return validateProofSchema(obj);
}

export function proofToJson(proof: Proof): string {
  return JSON.stringify(proof, null, 2);
}
