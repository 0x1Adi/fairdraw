import { z } from "zod";
import { getSecurityConfig } from "./loader";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function sanitizeTeamName(name: string): string {
  const config = getSecurityConfig().security;
  const cleaned = name.replace(/[\x00-\x1F\x7F]/g, "");
  return cleaned.slice(0, config.input_validation.max_team_name_length);
}

export function validateSeed(seed: string): void {
  const config = getSecurityConfig().security;
  if (seed.length === 0) {
    throw new ValidationError("Enter a public number before running the draw.");
  }
  if (seed.length > config.input_validation.max_seed_length) {
    throw new ValidationError("Seed too long");
  }
  if (config.input_validation.allowed_seed_chars === "printable_ascii") {
    if (!/^[\x20-\x7E]*$/.test(seed)) {
      throw new ValidationError("Seed contains non-printable characters");
    }
  }
}

export function validateDrawConfig(
  teams: unknown[],
  groups: number,
  groupSize: number
): void {
  const config = getSecurityConfig().security.input_validation;
  if (!Array.isArray(teams))
    throw new ValidationError("Teams must be an array");
  if (teams.length < 2)
    throw new ValidationError("You need at least as many items as slots to run a draw.");
  if (teams.length > config.max_teams)
    throw new ValidationError(`That's a lot of items! The maximum is ${config.max_teams}.`);
  if (groups > config.max_groups)
    throw new ValidationError(`Max ${config.max_groups} groups`);
  if (groupSize > config.max_group_size)
    throw new ValidationError(`Max ${config.max_group_size} per group`);
  if (teams.length < groups * groupSize)
    throw new ValidationError("You need at least as many items as slots to run a draw.");
}

export const VerifyUrlSchema = z.string().url("This verification link doesn't look right. Make sure you copied the full link.");
