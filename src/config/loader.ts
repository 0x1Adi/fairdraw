import yaml from "js-yaml";
import type {
  BrandConfig,
  PresetsConfig,
  CryptoConfig,
  SecurityConfig,
} from "./types";

// Import YAML files as raw strings via Vite's ?raw suffix
import brandYaml from "../../config/brand.yml?raw";
import presetsYaml from "../../config/presets.yml?raw";
import cryptoYaml from "../../config/crypto.yml?raw";

function parseYaml<T>(content: string): T {
  return yaml.load(content) as T;
}

let _brand: BrandConfig | null = null;
let _presets: PresetsConfig | null = null;
let _crypto: CryptoConfig | null = null;

export function getBrandConfig(): BrandConfig {
  if (!_brand) _brand = parseYaml<BrandConfig>(brandYaml);
  return _brand;
}

export function getPresetsConfig(): PresetsConfig {
  if (!_presets) _presets = parseYaml<PresetsConfig>(presetsYaml);
  return _presets;
}

export function getCryptoConfig(): CryptoConfig {
  if (!_crypto) _crypto = parseYaml<CryptoConfig>(cryptoYaml);
  return _crypto;
}

// Fallback security config (not loaded from file in browser to keep bundle small)
export function getSecurityConfig(): SecurityConfig {
  return {
    security: {
      csp: {
        default_src: "'self'",
        script_src: "'self'",
        style_src: "'self' 'unsafe-inline' https://fonts.googleapis.com",
        font_src: "'self' https://fonts.gstatic.com",
        connect_src: "'self' https://api.drand.sh",
        img_src: "'self' data: blob:",
        frame_src: "'none'",
        object_src: "'none'",
        base_uri: "'self'",
      },
      input_validation: {
        max_team_name_length: 100,
        max_teams: 256,
        max_groups: 64,
        max_group_size: 32,
        max_constraints: 20,
        max_seed_length: 1024,
        allowed_seed_chars: "printable_ascii",
      },
      rate_limiting: {
        max_draws_per_minute: 30,
        max_verification_per_minute: 60,
      },
      subresource_integrity: true,
      headers: {
        x_content_type_options: "nosniff",
        x_frame_options: "DENY",
        referrer_policy: "strict-origin-when-cross-origin",
        permissions_policy: "camera=(), microphone=(), geolocation=()",
      },
    },
  };
}
