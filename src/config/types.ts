// ─────────────────────────────────────────────
// CONFIG TYPES — TypeScript interfaces for all YAML schemas
// ─────────────────────────────────────────────

export interface BrandConfig {
  brand: {
    name: string;
    tagline: string;
    description: string;
    domain: string;
    logo_text: string;
    logo_svg: string | null;
    favicon: string;
    og_image: string;
    legal: {
      copyright_holder: string;
      license: string;
      github_url: string;
      privacy_policy_url: string | null;
      terms_url: string | null;
    };
    social: {
      twitter_handle: string | null;
      discord_url: string | null;
    };
    seo: {
      title_template: string;
      meta_description: string;
      keywords: string[];
    };
    theme: {
      primary_bg: string;
      accent: string;
      warning: string;
      error: string;
      surface: string;
      text_primary: string;
      text_muted: string;
      font_display: string;
      font_body: string;
      font_mono: string;
    };
    attribution: {
      author: string;
      project_origin: string;
      narayana_pandita: {
        text: string;
        date: string;
        location: string;
        contribution: string;
      };
    };
  };
}

export interface PotConfig {
  id: string;
  name: string;
  locked: boolean;
  teams: TeamData[];
  index?: number;
}

export interface ConstraintConfig {
  type: "max_per_group" | "fixed_position" | "seed_separation";
  field: string;
  max?: number;
  group?: number;
  description: string;
}

export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  featured: boolean;
  icon: string;
  group_count: number | null;
  group_size: number | null;
  assignment_type: "permutation" | "permutation_per_pot";
  pots: PotConfig[];
  constraints: ConstraintConfig[];
  teams_file: string | null;
}

export interface PresetsConfig {
  presets: PresetConfig[];
}

export interface RandomnessSource {
  id: string;
  name: string;
  description: string;
  type: "manual" | "beacon" | "hybrid" | "multi_party";
  entropy_bits: number | null;
  recommended_dice_count?: number;
  dice_sides?: number;
  api_url?: string;
  chain_hash?: string;
  recommended?: boolean;
}

export interface CryptoConfig {
  crypto: {
    feistel: {
      rounds: number;
      max_cycle_walks: number;
      prf: string;
    };
    hash: {
      algorithm: string;
      seed_min_entropy_bits: number;
    };
    randomness_sources: RandomnessSource[];
    verification: {
      algorithm_version: string;
      include_in_proof: string[];
    };
  };
}

export interface SecurityConfig {
  security: {
    csp: Record<string, string>;
    input_validation: {
      max_team_name_length: number;
      max_teams: number;
      max_groups: number;
      max_group_size: number;
      max_constraints: number;
      max_seed_length: number;
      allowed_seed_chars: string;
    };
    rate_limiting: {
      max_draws_per_minute: number;
      max_verification_per_minute: number;
    };
    subresource_integrity: boolean;
    headers: Record<string, string>;
  };
}

// ─────────────────────────────────────────────
// DOMAIN TYPES — Runtime data structures
// ─────────────────────────────────────────────

export interface TeamData {
  name: string;
  pot?: number;
  confederation?: string;
  country?: string;
  is_host?: boolean;
  ranking?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface GroupAssignment {
  groups: Array<{
    group_label: string;
    teams: TeamData[];
    team_indices: number[];
  }>;
}

export interface Proof {
  version: "1.0.0";
  brand: string;
  timestamp_utc: string;

  seed: string;
  seed_hash: string;
  seed_source: "dice" | "beacon" | "custom" | "hybrid" | "multi_party";

  preset_id: string | null;
  assignment_type: "permutation" | "permutation_per_pot";
  pots?: Array<{
    id: string;
    name: string;
    locked: boolean;
    team_indices: number[];
  }>;
  teams: TeamData[];
  teams_hash: string;
  group_count: number;
  group_size: number;
  constraints: ConstraintConfig[];
  constraints_hash: string;

  assignment: Array<{
    group_label: string;
    team_indices: number[];
  }>;
  cycle_walk_count: number;

  crypto_params: {
    feistel_rounds: number;
    prf: string;
    hash: string;
  };
}

export interface DrawResult {
  assignment: GroupAssignment;
  proof: Proof;
  cycleWalkCount: number;
}

export interface VerifyResult {
  valid: boolean;
  recomputed: DrawResult;
  original: Proof;
}

export interface DrawState {
  step: "setup" | "seed" | "results";
  preset: PresetConfig | null;
  teams: TeamData[];
  groups: number;
  groupSize: number;
  constraints: ConstraintConfig[];
  seed: string;
  seedSource: "dice" | "beacon" | "custom" | "hybrid" | "multi_party";
  result: DrawResult | null;
  isComputing: boolean;
  error: string | null;
  progressMessage: string | null;
}
