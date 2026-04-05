# Verifiable Fair Draw — Complete Build Plan for Claude Code

> **Objective**: Build a production-ready, security-hardened, zero-backend web application that generates cryptographically verifiable fair random assignments for tournaments, lotteries, and constrained selections. The app name is NOT finalized — everything brand-related lives in YAML config.

---

## 0. BEFORE YOU START

### 0.1 Project Init

```bash
# Create Vite + React + TypeScript project
pnpm create vite fairdraw-app --template react-ts
cd fairdraw-app
pnpm install

# Add Tailwind CSS
pnpm install -D tailwindcss@3.4.1 postcss autoprefixer tailwindcss-animate
npx tailwindcss init -p

# Add shadcn/ui
pnpm install class-variance-authority clsx tailwind-merge lucide-react
npx shadcn@latest init -d
# Install the specific components we need:
npx shadcn@latest add button card tabs input badge collapsible separator \
  select dialog toast textarea table tooltip scroll-area alert progress
```

This gives you: React 18 + TypeScript + Vite + Tailwind 3.4 + shadcn/ui components.

**NOTE for Claude Code**: The `~/.claude/skills/frontend-design/CLAUDE.md` skill (UI UX Pro Max) is installed locally. Read it before writing ANY UI component and follow its design system instructions.

### 0.2 Additional Dependencies (install only these — nothing else)

```bash
pnpm install js-yaml @types/js-yaml
pnpm install react-router-dom
pnpm install pako @types/pako
pnpm install -D vite-plugin-html vitest @vitest/coverage-v8
```

**No backend. No database. No server. Pure static site.** All crypto runs in the browser via WebCrypto API + BigInt. Zod is already installed (came with shadcn/ui) — use it for proof schema validation.

### 0.3 Design Skill

Read `~/.claude/skills/frontend-design/CLAUDE.md` (UI UX Pro Max) before writing ANY UI component. Follow its design system. The aesthetic direction for this app:

- **Tone**: Editorial/magazine meets geometric precision. Think: Bloomberg Terminal meets Swiss design poster.
- **Typography**: Use `"JetBrains Mono"` for crypto/hash displays, `"DM Sans"` for UI text, `"Fraunces"` for hero headings. Load from Google Fonts.
- **Color**: Deep navy (#0A1628) primary bg, electric teal (#00E5A0) accent, warm amber (#FFB547) for warnings. NO purple gradients.
- **Differentiation**: The verification animation — when a user verifies a draw, show a side-by-side "lock unlocking" visual with the hash bytes cascading. Make verification feel *powerful*.

---

## 1. YAML CONFIGURATION ARCHITECTURE

**Principle**: Every string a user or marketer might want to change lives in YAML. Every constraint, preset, and parameter set lives in YAML. Code reads config at build time (Vite import) and at runtime (fetch from `/config/`).

### 1.1 File: `config/brand.yml`

```yaml
# ═══════════════════════════════════════════════════════
# BRAND CONFIGURATION — Change name/identity here ONLY
# ═══════════════════════════════════════════════════════
brand:
  name: "FairDraw"                          # ← CHANGE THIS to rename entire app
  tagline: "Fair draws anyone can check."
  description: "The draw tool that proves nobody cheated."
  domain: "fairdraw.io"                     # Used in share URLs
  logo_text: "FairDraw"                     # If no SVG logo, render this
  logo_svg: null                            # Path to SVG logo file, or null
  favicon: "/favicon.svg"
  og_image: "/og-image.png"

  legal:
    copyright_holder: "NarayanaKit Contributors"
    license: "MIT"
    github_url: "https://github.com/example/fairdraw"
    privacy_policy_url: null
    terms_url: null

  social:
    twitter_handle: null
    discord_url: null

  seo:
    title_template: "{brand} — {tagline}"   # {brand} replaced at build
    meta_description: "Run tournament draws, lottery picks, and group assignments that anyone can independently verify. No trust required — just math."
    keywords: ["fair draw", "verifiable lottery", "tournament draw tool", "fair allocation", "group draw generator"]

  theme:
    primary_bg: "#0A1628"
    accent: "#00E5A0"
    warning: "#FFB547"
    error: "#FF4B4B"
    surface: "#111D32"
    text_primary: "#F0F4F8"
    text_muted: "#8899AA"
    font_display: "Fraunces"
    font_body: "DM Sans"
    font_mono: "JetBrains Mono"
```

### 1.2 File: `config/presets.yml`

```yaml
# ═══════════════════════════════════════════════════════
# TOURNAMENT/DRAW PRESETS — Add new draw types here
# ═══════════════════════════════════════════════════════
presets:
  - id: "fifa_2026"
    name: "FIFA World Cup 2026"
    description: "48 teams → 12 groups of 4 (one per pot)"
    category: "sports"
    featured: true
    icon: "trophy"
    group_count: 12
    group_size: 4
    assignment_type: "permutation_per_pot"   # Each pot independently shuffled
    pots:
      - id: "pot1"
        name: "Pot 1"
        locked: true                         # Pot 1 teams are fixed as group headers
        teams: []                            # Populated at runtime from teams file
      - id: "pot2"
        name: "Pot 2"
        locked: false
        teams: []
      - id: "pot3"
        name: "Pot 3"
        locked: false
        teams: []
      - id: "pot4"
        name: "Pot 4"
        locked: false
        teams: []
    constraints:
      - type: "max_per_group"
        field: "confederation"
        max: 2
        description: "No group has more than 2 teams from same confederation"
      - type: "fixed_position"
        field: "is_host"
        group: 0                             # Host always in Group A (index 0)
        description: "Host nation placed in Group A"
    teams_file: "data/fifa_2026_teams.yml"   # External file with team data

  - id: "champions_league"
    name: "UEFA Champions League"
    description: "32 teams → 8 groups of 4"
    category: "sports"
    featured: true
    icon: "star"
    group_count: 8
    group_size: 4
    assignment_type: "permutation_per_pot"
    pots:
      - { id: "pot1", name: "Pot 1", locked: true, teams: [] }
      - { id: "pot2", name: "Pot 2", locked: false, teams: [] }
      - { id: "pot3", name: "Pot 3", locked: false, teams: [] }
      - { id: "pot4", name: "Pot 4", locked: false, teams: [] }
    constraints:
      - type: "max_per_group"
        field: "country"
        max: 1
        description: "No two teams from same country in one group"
      - type: "max_per_group"
        field: "paired_group"
        max: 1
        description: "TV scheduling: paired teams cannot share a group"
    teams_file: "data/ucl_teams.yml"

  - id: "generic_lottery"
    name: "Custom Lottery / Raffle"
    description: "Assign N items to M groups with optional constraints"
    category: "general"
    featured: true
    icon: "shuffle"
    group_count: null                        # User configures
    group_size: null                         # User configures
    assignment_type: "permutation"
    pots: []
    constraints: []
    teams_file: null                         # User inputs

  - id: "esports_bracket"
    name: "Esports Tournament Seeding"
    description: "16/32 team bracket with seed-based constraints"
    category: "esports"
    featured: true
    icon: "gamepad"
    group_count: null
    group_size: null
    assignment_type: "permutation"
    pots: []
    constraints:
      - type: "seed_separation"
        description: "Top seeds placed in separate bracket halves"
    teams_file: null

  - id: "school_lottery"
    name: "School Assignment Lottery"
    description: "Assign students to schools/classes fairly"
    category: "civic"
    featured: false
    icon: "graduation-cap"
    group_count: null
    group_size: null
    assignment_type: "permutation"
    pots: []
    constraints: []
    teams_file: null
```

### 1.3 File: `config/crypto.yml`

```yaml
# ═══════════════════════════════════════════════════════
# CRYPTOGRAPHIC PARAMETERS — Security engineer config
# ═══════════════════════════════════════════════════════
crypto:
  feistel:
    rounds: 8                               # Minimum 4 (Luby-Rackoff PRP). 8 = strong PRP.
    max_cycle_walks: 1000                    # Safety limit. Abort if exceeded.
    prf: "HMAC-SHA256"                       # WebCrypto native

  hash:
    algorithm: "SHA-256"                     # For seed hashing
    seed_min_entropy_bits: 64                # Warn if seed has < this entropy

  randomness_sources:
    - id: "dice"
      name: "Dice Ceremony"
      description: "Roll physical dice — enter results manually"
      type: "manual"
      entropy_bits: 66                       # 20 × log2(10)
      recommended_dice_count: 20
      dice_sides: 10

    - id: "drand"
      name: "drand Beacon (League of Entropy)"
      description: "Public randomness beacon — 256-bit values every 30s"
      type: "beacon"
      entropy_bits: 256
      api_url: "https://api.drand.sh/public/latest"
      chain_hash: "8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce"

    - id: "manual"
      name: "Custom Seed"
      description: "Enter any string as seed (hashed with SHA-256)"
      type: "manual"
      entropy_bits: null                     # Depends on input

  verification:
    algorithm_version: "1.0.0"               # Increment on ANY algorithm change
    include_in_proof:
      - "seed"
      - "algorithm_version"
      - "preset_id"
      - "teams_hash"
      - "constraints_hash"
      - "cycle_walk_count"
      - "timestamp_utc"
```

### 1.4 File: `config/security.yml`

```yaml
# ═══════════════════════════════════════════════════════
# SECURITY HARDENING — CSP, headers, input validation
# ═══════════════════════════════════════════════════════
security:
  csp:
    default_src: "'self'"
    script_src: "'self'"
    style_src: "'self' 'unsafe-inline' https://fonts.googleapis.com"
    font_src: "'self' https://fonts.gstatic.com"
    connect_src: "'self' https://api.drand.sh"  # Only external API
    img_src: "'self' data: blob:"
    frame_src: "'none'"
    object_src: "'none'"
    base_uri: "'self'"

  input_validation:
    max_team_name_length: 100
    max_teams: 256
    max_groups: 64
    max_group_size: 32
    max_constraints: 20
    max_seed_length: 1024
    allowed_seed_chars: "printable_ascii"    # No control chars

  rate_limiting:
    max_draws_per_minute: 30                 # Client-side throttle
    max_verification_per_minute: 60

  subresource_integrity: true                # Generate SRI hashes at build

  headers:
    x_content_type_options: "nosniff"
    x_frame_options: "DENY"
    referrer_policy: "strict-origin-when-cross-origin"
    permissions_policy: "camera=(), microphone=(), geolocation=()"
```

---

## 2. PROJECT STRUCTURE

```
fairdraw-app/
├── config/                          # ALL YAML configuration
│   ├── brand.yml                    # Name, colors, fonts, legal, SEO
│   ├── copy.yml                     # ALL user-facing text — zero jargon
│   ├── presets.yml                  # Tournament templates
│   ├── crypto.yml                   # Feistel rounds, sources (internal only)
│   └── security.yml                 # CSP, validation limits
├── data/                            # Preset team/item data
│   ├── fifa_2026_teams.yml
│   └── ucl_teams.yml
├── public/
│   ├── config/                      # Copied at build → runtime fetchable
│   ├── favicon.svg
│   └── og-image.png
├── src/
│   ├── components/
│   │   ├── ui/                      # shadcn/ui (pre-installed)
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # Header + footer + brand from YAML
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── setup/
│   │   │   ├── PresetSelector.tsx   # Cards for each preset
│   │   │   ├── TeamInput.tsx        # Paste/type teams + metadata
│   │   │   ├── ConstraintBuilder.tsx # Visual constraint editor
│   │   │   └── GroupConfig.tsx      # Group count/size
│   │   ├── seed/
│   │   │   ├── SeedPanel.tsx        # Tabbed: Dice / Beacon / Custom / Hybrid / Multi-Party
│   │   │   ├── DiceInput.tsx        # 20-dice grid with visual dice
│   │   │   ├── BeaconFetch.tsx      # drand fetch + display
│   │   │   ├── HybridSeed.tsx       # Dice + Beacon combined
│   │   │   ├── MultiPartySeed.tsx   # N parties contribute randomness
│   │   │   └── SeedDisplay.tsx      # Show final SHA-256 hash
│   │   ├── results/
│   │   │   ├── GroupGrid.tsx        # Group tables in FIFA style
│   │   │   ├── ConstraintBadges.tsx # Green checkmarks per constraint
│   │   │   ├── ProofCard.tsx        # Collapsible proof JSON
│   │   │   └── ShareButton.tsx      # Copy verification URL
│   │   └── verify/
│   │       ├── VerifyPanel.tsx      # Paste URL or seed → recompute
│   │       └── ComparisonView.tsx   # Side-by-side diff
│   ├── crypto/                      # ← SECURITY-CRITICAL. No UI imports.
│   │   ├── bigint-utils.ts          # Safe BigInt math (no timing leaks in JS)
│   │   ├── combinadic.ts            # rank() and unrank() — Narayana's bijection
│   │   ├── feistel.ts               # Unbalanced Feistel cipher with cycle-walking
│   │   ├── permutation.ts           # Lehmer code rank/unrank for S_n
│   │   ├── hmac.ts                  # WebCrypto HMAC-SHA256 wrapper
│   │   ├── hash.ts                  # SHA-256 hashing for seeds
│   │   ├── draw-engine.ts           # Orchestrator: seed + config → assignment
│   │   ├── proof.ts                 # Generate, verify, URL-encode/decode proof objects
│   │   └── worker.ts               # Web Worker entry — runs crypto off main thread
│   ├── config/
│   │   ├── loader.ts                # YAML → typed config objects
│   │   ├── types.ts                 # TypeScript interfaces for all YAML schemas
│   │   └── validator.ts             # Input sanitization (security.yml driven)
│   ├── hooks/
│   │   ├── useBrand.ts              # Access brand config anywhere
│   │   ├── useCopy.ts               # Access ALL user-facing strings from copy.yml
│   │   ├── usePresets.ts            # Load/filter presets
│   │   ├── useDraw.ts               # Stateful draw workflow
│   │   ├── useVerify.ts             # Verification workflow
│   │   └── useCryptoWorker.ts       # Web Worker bridge for off-thread crypto
│   ├── pages/
│   │   ├── HomePage.tsx             # Landing + preset selection
│   │   ├── DrawPage.tsx             # 3-step wizard: Setup → Seed → Results
│   │   ├── VerifyPage.tsx           # Standalone verification
│   │   └── AboutPage.tsx            # How it works + attribution
│   ├── lib/
│   │   └── utils.ts                 # shadcn cn() util (pre-installed)
│   ├── App.tsx                      # Router
│   └── main.tsx                     # Entry
├── tests/
│   ├── setup.ts                     # WebCrypto polyfill for Node.js
│   ├── crypto/
│   │   ├── combinadic.test.ts       # MUST match known test vectors from spec
│   │   ├── feistel.test.ts          # Roundtrip, cycle-walking, determinism
│   │   ├── permutation.test.ts      # S_n rank/unrank
│   │   └── draw-engine.test.ts      # Full draw + constraint satisfaction
│   └── e2e/
│       └── draw-flow.test.ts        # Playwright: full user flow (Phase 2)
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 3. CRYPTO ENGINE — DETAILED IMPLEMENTATION

> **CRITICAL SECURITY NOTE**: The `src/crypto/` directory is the trusted computing base. No UI code, no React, no DOM. Pure TypeScript functions operating on BigInt and Uint8Array. Every function must be deterministic and testable in isolation.

### 3.1 `src/crypto/hmac.ts`

```typescript
/**
 * HMAC-SHA256 via WebCrypto API.
 * Returns raw Uint8Array (32 bytes).
 * This is the PRF for the Feistel cipher.
 */
export async function hmacSha256(
  key: Uint8Array,
  data: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return new Uint8Array(sig);
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}
```

### 3.2 `src/crypto/bigint-utils.ts`

```typescript
/**
 * Multi-precision binomial coefficient C(n, k) using BigInt.
 * Uses multiplicative formula to avoid huge intermediaries.
 * SECURITY: BigInt in JS is NOT constant-time. This is a reference
 * implementation. The spec acknowledges this — see crypto.yml comments.
 */
export function binomial(n: number, k: number): bigint {
  if (k < 0 || k > n) return 0n;
  if (k === 0 || k === n) return 1n;
  if (k > n - k) k = n - k; // Optimization: C(n,k) = C(n, n-k)
  let result = 1n;
  for (let i = 0; i < k; i++) {
    result = result * BigInt(n - i) / BigInt(i + 1);
  }
  return result;
}

/** Convert BigInt to big-endian Uint8Array */
export function bigintToBytes(value: bigint): Uint8Array { /* ... */ }

/** Convert Uint8Array (big-endian) to BigInt */
export function bytesToBigint(bytes: Uint8Array): bigint { /* ... */ }

/** Integer square root (floor) for Feistel split */
export function isqrt(n: bigint): bigint { /* ... */ }
```

### 3.3 `src/crypto/combinadic.ts`

```typescript
import { binomial } from "./bigint-utils";

/**
 * Narayana's Uddishta: rank a k-subset to an integer.
 * Input: sorted array of k positions [c_0 < c_1 < ... < c_{k-1}]
 * Output: rank in {0, ..., C(n,k)-1}
 * Formula: rank = Σ C(c_i, i+1)
 */
export function combinadicRank(positions: number[], n: number, k: number): bigint {
  // Input validation — security critical
  if (positions.length !== k) throw new Error(`Expected ${k} positions, got ${positions.length}`);
  // Verify sorted, unique, in range [0, n-1]
  for (let i = 0; i < k; i++) {
    if (positions[i] < 0 || positions[i] >= n) throw new Error(`Position out of range`);
    if (i > 0 && positions[i] <= positions[i - 1]) throw new Error(`Positions must be strictly increasing`);
  }
  let rank = 0n;
  for (let i = 0; i < k; i++) {
    rank += binomial(positions[i], i + 1);
  }
  return rank;
}

/**
 * Narayana's Nashta: unrank an integer to a k-subset.
 * Input: rank in {0, ..., C(n,k)-1}
 * Output: sorted array of k positions
 */
export function combinadicUnrank(rank: bigint, n: number, k: number): number[] {
  const domain = binomial(n, k);
  if (rank < 0n || rank >= domain) throw new Error(`Rank out of range [0, ${domain})`);
  const positions: number[] = new Array(k);
  let remaining = rank;
  for (let i = k - 1; i >= 0; i--) {
    // Find largest c such that C(c, i+1) <= remaining
    // Binary search for efficiency
    let lo = i, hi = n - 1;
    while (lo < hi) {
      const mid = lo + Math.ceil((hi - lo) / 2);  // ceil to bias high
      if (binomial(mid, i + 1) <= remaining) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    positions[i] = lo;
    remaining -= binomial(lo, i + 1);
  }
  return positions;
}
```

### 3.4 `src/crypto/feistel.ts`

```typescript
import { hmacSha256 } from "./hmac";
import { isqrt, bigintToBytes, bytesToBigint } from "./bigint-utils";

/**
 * Format-Preserving Encryption on domain {0, ..., domainSize-1}.
 * Unbalanced Feistel with cycle-walking (Black-Rogaway 2002).
 *
 * SECURITY: 8 rounds = strong PRP (Hoang-Rogaway, CRYPTO 2010).
 * Cycle-walking does NOT leak plaintext info (Black-Rogaway proof).
 */
export async function feistelEncrypt(
  plaintext: bigint,
  key: Uint8Array,
  domainSize: bigint,
  rounds: number,
  maxCycleWalks: number
): Promise<{ ciphertext: bigint; cycleWalks: number }> {
  // Split domain into A × B where B = isqrt(domainSize)
  const B = isqrt(domainSize);
  const A = (domainSize + B - 1n) / B;  // ceil(domainSize / B)

  let cycleWalks = 0;
  let value = plaintext;

  do {
    let u = value / B;
    let v = value % B;

    for (let round = 0; round < rounds; round++) {
      // Build PRF input: fixed-length round (4 bytes) || fixed-length value-half
      // See Section 13.5 for why variable-length is insecure
      const prfInput = buildPrfInput(round, round % 2 === 0 ? v : u, domainSize);
      const prfOutput = await hmacSha256(key, prfInput);
      const prfValue = bytesToBigint(prfOutput);

      if (round % 2 === 0) {
        u = ((u + prfValue) % A + A) % A;
      } else {
        v = ((v + prfValue) % B + B) % B;
      }
    }

    value = u * B + v;

    if (value < domainSize) {
      return { ciphertext: value, cycleWalks };
    }

    cycleWalks++;
    if (cycleWalks > maxCycleWalks) {
      throw new Error(`Cycle-walking exceeded ${maxCycleWalks} iterations — aborting`);
    }
  } while (true);
}

/** Decrypt: same as encrypt but rounds reversed, subtract instead of add */
export async function feistelDecrypt(
  ciphertext: bigint,
  key: Uint8Array,
  domainSize: bigint,
  rounds: number,
  maxCycleWalks: number
): Promise<{ plaintext: bigint; cycleWalks: number }> {
  // Mirror of encrypt with round order reversed and subtraction
  // ... (implement symmetrically)
}
```

### 3.5 `src/crypto/permutation.ts`

```typescript
/**
 * Lehmer code (factoradic) for permutation rank/unrank on S_n.
 * Used by the fairness product to FPE-encrypt group assignments.
 */

/** Factorial as BigInt */
export function factorial(n: number): bigint { /* ... */ }

/** Rank a permutation to integer in {0, ..., n!-1} */
export function permutationRank(perm: number[]): bigint { /* ... */ }

/** Unrank integer to permutation of {0, ..., n-1} */
export function permutationUnrank(rank: bigint, n: number): number[] { /* ... */ }
```

### 3.6 `src/crypto/draw-engine.ts`

```typescript
import type { PresetConfig, CryptoConfig, DrawResult, Proof } from "../config/types";

/**
 * Core draw engine. Deterministic: same inputs → same output. Always.
 *
 * Flow:
 *   1. Hash seed → 256-bit key
 *   2. For each unlocked pot: FPE-encrypt identity permutation → shuffled assignment
 *   3. Check all constraints
 *   4. If any violated → cycle-walk (increment counter, re-encrypt from step 2)
 *   5. Build proof object
 */
export async function executeDraw(
  seed: string,
  teams: TeamData[],
  preset: PresetConfig,
  cryptoConfig: CryptoConfig
): Promise<DrawResult> {
  // Input validation (defense in depth)
  validateTeams(teams, preset);
  validateSeed(seed, cryptoConfig);

  // Step 1: Derive key
  const seedBytes = new TextEncoder().encode(seed);
  const key = await sha256(seedBytes);

  // Step 2-4: FPE with constraint cycle-walking
  let cycleWalkCount = 0;
  let assignment: GroupAssignment;

  do {
    // Derive per-attempt key: HMAC(key, counter)
    const attemptKey = await hmacSha256(key, bigintToBytes(BigInt(cycleWalkCount)));

    // Generate permutation for each unlocked pot
    assignment = await generateAssignment(teams, preset, attemptKey, cryptoConfig);

    // Check constraints
    if (checkAllConstraints(assignment, preset.constraints)) {
      break;
    }

    cycleWalkCount++;
    if (cycleWalkCount > cryptoConfig.feistel.max_cycle_walks) {
      throw new Error(`No valid assignment found in ${cryptoConfig.feistel.max_cycle_walks} attempts. Constraints may be too restrictive.`);
    }
  } while (true);

  // Step 5: Build proof
  const proof = buildProof(seed, teams, preset, cryptoConfig, cycleWalkCount);

  return { assignment, proof, cycleWalkCount };
}

/**
 * Verify a draw: recompute from proof and compare.
 * Returns { valid: boolean, recomputed: DrawResult }
 */
export async function verifyDraw(proof: Proof): Promise<VerifyResult> {
  const recomputed = await executeDraw(
    proof.seed,
    proof.teams,
    proof.preset,
    proof.cryptoConfig
  );
  const valid = deepEqual(recomputed.assignment, proof.assignment);
  return { valid, recomputed };
}
```

---

## 4. SECURITY HARDENING CHECKLIST

### 4.1 Input Sanitization (implement in `src/config/validator.ts`)

```typescript
/**
 * Validate ALL user input before it touches the crypto engine.
 * Config limits come from security.yml.
 */
export function sanitizeTeamName(name: string, maxLen: number): string {
  // Strip control characters
  const cleaned = name.replace(/[\x00-\x1F\x7F]/g, "");
  // Truncate
  return cleaned.slice(0, maxLen);
}

export function validateSeed(seed: string, config: SecurityConfig): void {
  if (seed.length > config.input_validation.max_seed_length) {
    throw new ValidationError("Seed too long");
  }
  if (config.input_validation.allowed_seed_chars === "printable_ascii") {
    if (!/^[\x20-\x7E]*$/.test(seed)) {
      throw new ValidationError("Seed contains non-printable characters");
    }
  }
}

export function validateDrawConfig(teams: unknown[], groups: number, groupSize: number, config: SecurityConfig): void {
  if (!Array.isArray(teams)) throw new ValidationError("Teams must be array");
  if (teams.length > config.input_validation.max_teams) throw new ValidationError(`Max ${config.input_validation.max_teams} teams`);
  if (groups > config.input_validation.max_groups) throw new ValidationError(`Max ${config.input_validation.max_groups} groups`);
  if (groupSize > config.input_validation.max_group_size) throw new ValidationError(`Max ${config.input_validation.max_group_size} per group`);
  // Verify groups × groupSize = teams.length for balanced assignments
}
```

### 4.2 Content Security Policy (implement in `vite.config.ts` via `vite-plugin-html`)

```typescript
// vite.config.ts
import { createHtmlPlugin } from "vite-plugin-html";

// Read CSP from security.yml at build time
const csp = loadSecurityConfig().csp;
const cspString = Object.entries(csp)
  .map(([key, val]) => `${key.replace(/_/g, "-")} ${val}`)
  .join("; ");

export default defineConfig({
  plugins: [
    react(),
    createHtmlPlugin({
      minify: true,
      inject: {
        tags: [
          { tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: cspString }, injectTo: "head" }
        ]
      }
    })
  ],
  // ...
});
```

### 4.3 Additional Security Measures

1. **No `eval()` or `Function()` anywhere.** Lint rule: `no-eval`, `no-new-func`.
2. **No `innerHTML`.** React's JSX handles this, but audit any `dangerouslySetInnerHTML`.
3. **URL verification sharing**: The share URL encodes the proof as base64url in the fragment (`#proof=...`). Fragment is NOT sent to servers. Parse with `URL` API — never with regex.
4. **drand beacon fetch**: Only fetch from configured `api_url` in crypto.yml. Validate response schema before using. Timeout after 10 seconds.
5. **WebCrypto only**: Never import a third-party crypto library. `crypto.subtle` is the only crypto API.
6. **No localStorage for secrets**: Seeds and keys live only in React state (memory). On page unload, they're gone.
7. **SRI at build time**: Vite generates integrity hashes for all chunks.

---

## 5. UI/UX IMPLEMENTATION — PAGE BY PAGE

### 5.1 HomePage (`src/pages/HomePage.tsx`)

**ALL text comes from `config/copy.yml` → `home` section. Never hardcode UI strings.**

**Layout**: Full-viewport hero with animated geometric pattern (SVG triangles), then preset cards.

**Sections**:
- Hero: headline + subheadline + two CTAs from `copy.yml home.hero`. Headline in display font 72px.
- "How it works" — 3-step visual from `copy.yml home.how_it_works`. Use shadcn `Card` with numbered badges and lucide icons.
- "Why does this matter?" — Trust section from `copy.yml home.trust_section`. Three cards: draws can be rigged / current draws are a black box / we give you the receipt.
- Preset grid: cards from `presets.yml` (filtered by `featured: true`), descriptions from `copy.yml presets.*`
- Footer: from `copy.yml footer`

### 5.2 DrawPage (`src/pages/DrawPage.tsx`)

**ALL labels, placeholders, explainers from `config/copy.yml` → `draw` section.**

**Layout**: 3-step horizontal stepper. Steps labeled from `copy.yml draw.stepper`.

**Step 1 — Set Up** (from `copy.yml draw.setup`):
- If preset selected: show pre-loaded teams, allow edit
- If custom: `TeamInput` with paste-friendly textarea. Labels from `copy.yml draw.setup.teams_input`
- `GroupConfig`: plain language labels "How many groups?" / "How many per group?"
- `ConstraintBuilder`: labeled "Any rules?" — dropdown with plain descriptions like "No more than 2 European teams in one group". Empty state: "No rules yet. The draw will be completely random."
- "Next" button → validate, show human error toasts from `copy.yml errors`

**Step 2 — Public Number** (NOT "Seed". Labels from `copy.yml draw.seed`):
- Title: "Choose your public number" with subtitle explaining it plainly
- Tabbed panel: Roll Dice | Internet Randomness | Your Own Number | Combined | Multiple People
- **Dice tab**: Grid of 20 clickable cells. Plain explainer: "20 dice gives you plenty of randomness"
- **Beacon tab**: "Get Latest Number" button. Explain in one sentence: "from a network of independent organizations, nobody controls it"
- **Hybrid tab**: Both dice and beacon combined. Explainer: "Even if one source was compromised, the other keeps it fair."
- **Multi-Party tab**: Add person fields. "As long as one person is honest, the draw is fair."
- Below tabs: "Digital fingerprint of your number" (NOT "SHA-256 hash") in monospace. One-line explainer: "a tamper-evident seal"
- "Run the Draw" button (large, accent-colored). Loading text: "Finding a fair arrangement..."

**Step 3 — Results** (from `copy.yml draw.results`):
- **Group Grid**: Responsive card grid. FIFA-style group tables.
- **Rules check**: Row of green badges "All rules satisfied"
- **Arrangements checked**: Only show if cycle_walks > 0. Frame positively: "tried {n} arrangements before finding one that satisfies all your rules"
- **Share & Verify**: Button copies URL, toast: "Anyone with this link can independently check the result"
- **Draw receipt**: Behind a toggle. Plain field labels: "Public number used", "Digital fingerprint", "Date and time"

### 5.3 VerifyPage (`src/pages/VerifyPage.tsx`)

**ALL text from `config/copy.yml` → `verify` section.**

**Layout**: Two panels side by side (stacked on mobile).

- **Title**: "Check a draw result" (NOT "Verification")
- **Input panel**: Paste URL field. "Check It" button (NOT "Verify").
- **On check**:
  - Loading: "Re-running the draw from scratch..."
  - **If match**: Full-width green banner + shield-check icon + "Confirmed — This draw is genuine" + "We re-ran the draw using the same public number and got the exact same result."
  - **If mismatch**: Red banner + shield-alert icon + "Mismatch — Something is wrong" + "The claimed result does not match the public number."
  - Side-by-side comparison of groups if mismatch

### 5.4 AboutPage (`src/pages/AboutPage.tsx`)

**ALL text from `config/copy.yml` → `about` section. Plain language first, technical behind a toggle.**

**Sections (in order)**:
- Hero: "Fair draws shouldn't require trust"
- The Problem: 4 paragraphs about FIFA, UEFA 2021, housing lotteries — storytelling, not math
- "How it really works (no jargon, we promise)": 4-step card layout — cards on a table metaphor. NO math, NO crypto terms.
- Attribution: Narayana Pandita (1356 CE) — framed as historical storytelling
- Author credit: "Built by Aditya Tiwari" + NarayanaKit project link
- **"For developers & researchers" toggle** (shadcn `Collapsible`): THIS is the only place FPE, Feistel, HMAC, combinadic, Hoang-Rogaway, etc. appear. Behind a click. Not in anyone's face.
- Comparison table (Rejection / Fisher-Yates / Sendrier / Ours): ONLY inside the developer toggle
- Links: GitHub, paper references — inside developer toggle

---

## 6. ROUTING & STATE MANAGEMENT

**Router**: `react-router-dom` with these routes:

```
/                → HomePage
/draw            → DrawPage (with optional ?preset=fifa_2026 query param)
/draw/:presetId  → DrawPage with preset pre-selected
/verify          → VerifyPage (reads #proof= from URL fragment)
/about           → AboutPage
```

**State**: React Context + `useReducer` for the draw workflow. NO external state library. State shape:

```typescript
interface DrawState {
  step: "setup" | "seed" | "results";
  preset: PresetConfig | null;
  teams: TeamData[];
  groups: number;
  groupSize: number;
  constraints: Constraint[];
  seed: string;
  seedSource: "dice" | "beacon" | "custom" | "hybrid" | "multi_party";
  result: DrawResult | null;
  isComputing: boolean;
  error: string | null;
}
```

---

## 7. BUILD, TEST & DEPLOY

### 7.1 Build Pipeline

```bash
# Development
pnpm dev

# Production build
pnpm build          # Vite outputs to dist/

# Copy YAML configs to public at build time (vite plugin or script)
cp -r config/ public/config/
cp -r data/ public/data/
```

Add to `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Content hash in filenames for cache busting + SRI
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
      }
    }
  }
});
```

### 7.2 Testing

**Unit tests** (Vitest — already installed in Section 0.2):

**Required test files** (in `tests/crypto/`):

1. `combinadic.test.ts` — MUST include these exact vectors from the product spec:
   - `rank([0,1,2], 6, 3)` → `0`
   - `rank([3,4,5], 6, 3)` → `19`
   - `unrank(0, 6, 3)` → `[0,1,2]`
   - `unrank(19, 6, 3)` → `[3,4,5]`
   - Roundtrip: for all r in `[0, C(6,3))`: `rank(unrank(r)) === r`
   - Edge cases: k=0, k=n, n=1

2. `feistel.test.ts`:
   - Roundtrip: `decrypt(encrypt(m)) === m` for 100 random messages
   - Determinism: same key + message → same ciphertext
   - Different keys → different ciphertexts
   - Cycle-walking terminates for all tested domain sizes

3. `permutation.test.ts`:
   - Roundtrip for S_4 (all 24 permutations)
   - Roundtrip for S_12 (random sample of 1000)

4. `draw-engine.test.ts`:
   - FIFA preset with fixed seed → deterministic output
   - Same seed always produces same groups
   - All constraints satisfied for 100 random seeds
   - Verification passes for all generated draws

### 7.3 Deploy

**Target**: Vercel (recommended) or Cloudflare Pages.

`vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/((?!assets|config|data).*)", "destination": "/index.html" }
  ]
}
```

---

## 8. TOKEN EFFICIENCY GUIDELINES FOR CLAUDE CODE

These rules minimize token consumption during implementation:

1. **Do NOT re-implement shadcn/ui components.** They're pre-installed. Just import: `import { Button } from "@/components/ui/button"`.

2. **Implement crypto engine FIRST, test it, THEN build UI.** Crypto is ~400 lines. UI is ~1500 lines. If crypto tests fail, UI is wasted tokens.

3. **Build order** (each step: implement → test → move on):
   - `src/crypto/bigint-utils.ts` + `src/crypto/hmac.ts` + `src/crypto/hash.ts` (50 lines)
   - `src/crypto/combinadic.ts` + tests (80 lines)
   - `src/crypto/feistel.ts` + tests (100 lines)
   - `src/crypto/permutation.ts` + tests (80 lines)
   - `src/crypto/draw-engine.ts` + `src/crypto/proof.ts` + tests (150 lines)
   - `src/config/types.ts` + `src/config/loader.ts` (60 lines)
   - YAML files (copy from this plan)
   - UI components (build from outside in: AppShell → pages → sub-components)

4. **Use shadcn primitives aggressively**: `Card`, `Tabs`, `Button`, `Input`, `Badge`, `Collapsible`, `Sonner` (toasts), `Select`, `Dialog`, `Separator`, `Table`.

5. **One file, one purpose.** Don't combine unrelated logic. Easier to test and iterate.

6. **Skip PDF export initially.** It's a stretch goal. Share URL + JSON export covers MVP.

---

## 9. MARKETING & SALES INTEGRATION POINTS

### 9.1 Built into the App

- **Social sharing meta tags**: Generated from `brand.yml` at build time. OpenGraph title, description, image.
- **Verification URL virality**: Every share URL is a marketing touch. URL format: `{brand.domain}/verify#proof=...`. Anyone clicking it sees the app, even if they came for verification.
- **FIFA 2026 preset as default**: When someone lands on the app during World Cup season, the FIFA preset is front and center. This is configurable in `presets.yml` via `featured: true`.
- **"Powered by {brand.name}" watermark**: On exported results (JSON includes `algorithm_version` and `brand.name`).
- **GitHub badge in footer**: OSS credibility for developer adoption.

### 9.2 Content Hooks (for marketing team to leverage)

- **About page** includes the Csató bias statistic ("2% bias in 2018 World Cup draw") — quotable for press.
- **Comparison table** on About page is designed to be screenshot-able for social media.
- **Verification animation** is designed to be GIF-able for Twitter/X posts.

### 9.3 Analytics-Ready (add later, not in MVP)

- Add Plausible or Fathom (privacy-respecting) script tag in `brand.yml`:
  ```yaml
  analytics:
    provider: "plausible"
    domain: "fairdraw.io"
    script_url: "https://plausible.io/js/script.js"
  ```
- Track: draw creation, preset selection, verification completion, share button clicks.

### 9.4 Pricing Tier Hooks (future)

The app is fully functional as OSS. For SaaS upsell:
- **Pro badge**: Add `brand.yml` flag `show_pro_badge: false`. When true, show "Upgrade to Pro" for features like: audit log, team management, custom branding, API access.
- **API key input**: Add to `brand.yml` for future gated features. For now: everything free.

---

## 10. DATA FILES

### 10.1 `data/fifa_2026_teams.yml`

```yaml
# FIFA 2026 World Cup — 48 teams (update when qualifiers finalize)
# Last updated: 2026-04-04
teams:
  # Pot 1 (top 12 by FIFA ranking — these become group headers)
  - { name: "USA", confederation: "CONCACAF", pot: 1, is_host: true, ranking: 1 }
  - { name: "Mexico", confederation: "CONCACAF", pot: 1, is_host: true, ranking: 2 }
  - { name: "Canada", confederation: "CONCACAF", pot: 1, is_host: true, ranking: 3 }
  - { name: "Argentina", confederation: "CONMEBOL", pot: 1, ranking: 4 }
  - { name: "France", confederation: "UEFA", pot: 1, ranking: 5 }
  - { name: "England", confederation: "UEFA", pot: 1, ranking: 6 }
  - { name: "Brazil", confederation: "CONMEBOL", pot: 1, ranking: 7 }
  - { name: "Spain", confederation: "UEFA", pot: 1, ranking: 8 }
  - { name: "Germany", confederation: "UEFA", pot: 1, ranking: 9 }
  - { name: "Portugal", confederation: "UEFA", pot: 1, ranking: 10 }
  - { name: "Netherlands", confederation: "UEFA", pot: 1, ranking: 11 }
  - { name: "Belgium", confederation: "UEFA", pot: 1, ranking: 12 }

  # Pot 2 (rankings 13-24) — placeholder names, update before launch
  - { name: "Colombia", confederation: "CONMEBOL", pot: 2, ranking: 13 }
  - { name: "Italy", confederation: "UEFA", pot: 2, ranking: 14 }
  - { name: "Croatia", confederation: "UEFA", pot: 2, ranking: 15 }
  - { name: "Morocco", confederation: "CAF", pot: 2, ranking: 16 }
  - { name: "Japan", confederation: "AFC", pot: 2, ranking: 17 }
  - { name: "Uruguay", confederation: "CONMEBOL", pot: 2, ranking: 18 }
  - { name: "Denmark", confederation: "UEFA", pot: 2, ranking: 19 }
  - { name: "Senegal", confederation: "CAF", pot: 2, ranking: 20 }
  - { name: "South Korea", confederation: "AFC", pot: 2, ranking: 21 }
  - { name: "Switzerland", confederation: "UEFA", pot: 2, ranking: 22 }
  - { name: "Austria", confederation: "UEFA", pot: 2, ranking: 23 }
  - { name: "Australia", confederation: "AFC", pot: 2, ranking: 24 }

  # Pot 3 (rankings 25-36) — placeholder
  - { name: "Ukraine", confederation: "UEFA", pot: 3, ranking: 25 }
  - { name: "Turkey", confederation: "UEFA", pot: 3, ranking: 26 }
  - { name: "Poland", confederation: "UEFA", pot: 3, ranking: 27 }
  - { name: "Serbia", confederation: "UEFA", pot: 3, ranking: 28 }
  - { name: "Ecuador", confederation: "CONMEBOL", pot: 3, ranking: 29 }
  - { name: "Iran", confederation: "AFC", pot: 3, ranking: 30 }
  - { name: "Nigeria", confederation: "CAF", pot: 3, ranking: 31 }
  - { name: "Cameroon", confederation: "CAF", pot: 3, ranking: 32 }
  - { name: "Ghana", confederation: "CAF", pot: 3, ranking: 33 }
  - { name: "Tunisia", confederation: "CAF", pot: 3, ranking: 34 }
  - { name: "Egypt", confederation: "CAF", pot: 3, ranking: 35 }
  - { name: "Saudi Arabia", confederation: "AFC", pot: 3, ranking: 36 }

  # Pot 4 (rankings 37-48) — placeholder
  - { name: "Paraguay", confederation: "CONMEBOL", pot: 4, ranking: 37 }
  - { name: "Costa Rica", confederation: "CONCACAF", pot: 4, ranking: 38 }
  - { name: "Jamaica", confederation: "CONCACAF", pot: 4, ranking: 39 }
  - { name: "Honduras", confederation: "CONCACAF", pot: 4, ranking: 40 }
  - { name: "Panama", confederation: "CONCACAF", pot: 4, ranking: 41 }
  - { name: "Qatar", confederation: "AFC", pot: 4, ranking: 42 }
  - { name: "China", confederation: "AFC", pot: 4, ranking: 43 }
  - { name: "Iraq", confederation: "AFC", pot: 4, ranking: 44 }
  - { name: "Algeria", confederation: "CAF", pot: 4, ranking: 45 }
  - { name: "Mali", confederation: "CAF", pot: 4, ranking: 46 }
  - { name: "New Zealand", confederation: "OFC", pot: 4, ranking: 47 }
  - { name: "Peru", confederation: "CONMEBOL", pot: 4, ranking: 48 }
```

---

## 11. README.md TEMPLATE

```markdown
# {brand.name}

> {brand.tagline}

**{brand.name}** runs tournament draws, lottery picks, and group assignments
that anyone can independently check. No trust required — just math.

## How it works

1. **Set up your draw** — Add your teams, names, or items. Set group sizes
   and any rules (like "no two teams from the same country in one group").

2. **Pick a public number** — Roll dice on camera, use an independent
   internet randomness source, or let multiple people each contribute a number.
   Everyone sees the number. Nobody can change it.

3. **Get your result — with a receipt** — The draw runs instantly. You get
   a shareable link. Anyone with that link can re-run the exact same draw
   and confirm the result is real.

## Why does this matter?

- In 2021, UEFA voided and redid a Champions League draw on live TV due to a software error
- In 2025, a mathematician proved FIFA's own draw method is biased
- Millions of housing and school lottery applicants have no way to check if their draw was fair

**{brand.name}** gives you the receipt.

## Built on ancient math

The core method was invented by Narayana Pandita, an Indian mathematician,
in 1356 CE — over 600 years before it was independently rediscovered in the
West.

## Open source

All code is open. Inspect it yourself. No server, no backend — everything
runs in your browser.

## License

MIT
```

---

## 12. EXECUTION SEQUENCE FOR CLAUDE CODE

**→ SEE SECTION 13.15 for the FINAL execution sequence.** It supersedes the table below, which is retained only for reference.

The updated sequence in 13.15 adds: vitest setup (step 4), Web Worker (step 10), responsive/accessibility pass (step 17), and reorders steps for correctness.

| Step | Files to create | Test before proceeding |
|------|----------------|----------------------|
| 1 | Init project with `init-artifact.sh` | `pnpm dev` starts |
| 2 | `config/*.yml` + `data/*.yml` | Files parse without error |
| 3 | `src/config/types.ts` + `src/config/loader.ts` | TypeScript compiles |
| 4 | `src/crypto/bigint-utils.ts` + `src/crypto/hmac.ts` + `src/crypto/hash.ts` | Unit tests pass |
| 5 | `src/crypto/combinadic.ts` + tests | All 4 spec vectors pass |
| 6 | `src/crypto/feistel.ts` + tests | Roundtrip passes |
| 7 | `src/crypto/permutation.ts` + tests | S_4 exhaustive + S_12 sample |
| 8 | `src/crypto/draw-engine.ts` + `src/crypto/proof.ts` + tests | FIFA preset deterministic |
| 9 | `src/components/layout/*` + `src/App.tsx` (router) | App renders with brand from YAML |
| 10 | `src/pages/HomePage.tsx` + preset cards | Presets display correctly |
| 11 | `src/pages/DrawPage.tsx` + all setup/seed/result components | Full draw flow works |
| 12 | `src/pages/VerifyPage.tsx` | Verification matches original |
| 13 | `src/pages/AboutPage.tsx` | Static content renders |
| 14 | Security hardening: CSP meta tag, headers config, input validation | CSP active in dev tools |
| 15 | `vercel.json` + production build test | `pnpm build` succeeds |
| 16 | `README.md` | Complete |

**Total estimated code**: ~2,500 lines TypeScript + ~500 lines YAML + ~100 lines config.

---

## 13. ADDENDUM — GAPS FOUND IN REVIEW

> These are critical items missing from the main plan. Claude Code MUST address each.

### 13.1 HYBRID SEED MODE (missed from spec)

The product spec explicitly recommends: *"Hybrid: dice ceremony + blockchain beacon. Final seed = SHA-256(dice_value || beacon_value)."*

The Seed panel must support **combining** sources, not just picking one:

```
SeedPanel tabs:  Dice | Beacon | Custom | Hybrid
```

**Hybrid tab**: Shows both the dice grid AND the beacon fetch side by side. Final seed = `SHA-256(concat(dice_string, "|", beacon_hex))`. The `|` separator prevents collisions. Display both contributing values AND the combined hash.

Add to `config/crypto.yml`:
```yaml
    - id: "hybrid"
      name: "Hybrid (Dice + Beacon)"
      description: "Combine dice rolls with drand beacon — recommended for high-stakes draws"
      type: "hybrid"
      entropy_bits: 322              # 66 + 256
      recommended: true
```

### 13.2 MULTI-PARTY CEREMONY MODE (missed from spec)

The spec describes: *"Multiple parties each contribute random values, combined via XOR or hash."*

Add to seed panel as an advanced option:

```
Multi-Party tab:
  - "Party 1" text input
  - "Party 2" text input
  - [+ Add Party] button (up to 8)
  - Combined seed = SHA-256(party1 || "|" || party2 || "|" || ...)
```

This is important for esports use cases where tournament organizers want each team captain to contribute randomness.

### 13.3 PROOF SCHEMA — EXACT JSON STRUCTURE

The plan references "proof object" but never defines it. Here is the canonical schema — add to `src/config/types.ts`:

```typescript
interface Proof {
  // Identity
  version: "1.0.0";                    // From crypto.yml algorithm_version
  brand: string;                        // From brand.yml brand.name
  timestamp_utc: string;                // ISO 8601

  // Inputs (everything needed to reproduce)
  seed: string;                         // Raw seed string (before hashing)
  seed_hash: string;                    // SHA-256 hex of seed
  seed_source: "dice" | "beacon" | "custom" | "hybrid" | "multi_party";

  preset_id: string | null;             // e.g. "fifa_2026" or null for custom
  teams: Array<{
    name: string;
    pot?: number;
    metadata?: Record<string, string>;  // confederation, country, etc.
  }>;
  teams_hash: string;                   // SHA-256 of canonical JSON of teams array
  group_count: number;
  group_size: number;
  constraints: Array<{
    type: string;
    field: string;
    max?: number;
    group?: number;
    description: string;
  }>;
  constraints_hash: string;             // SHA-256 of canonical JSON of constraints

  // Outputs
  assignment: Array<{                   // groups[i] = array of team indices
    group_label: string;                // "A", "B", "C" ...
    team_indices: number[];             // Indices into the teams array
  }>;
  cycle_walk_count: number;

  // Crypto params (for reproducibility across versions)
  crypto_params: {
    feistel_rounds: number;
    prf: string;                        // "HMAC-SHA256"
    hash: string;                       // "SHA-256"
  };
}
```

**URL encoding**: `#proof=<base64url(deflate(JSON.stringify(proof)))>`. Use `CompressionStream('deflate')` (native in all modern browsers) to compress before base64url encoding. This shrinks a 48-team proof from ~3KB to ~800 bytes — well within URL limits.

Add `pako` for deflate fallback if `CompressionStream` is unavailable:
```bash
pnpm install pako @types/pako
```

### 13.4 FEISTEL DECRYPT — FULL IMPLEMENTATION

The main plan left decrypt as "implement symmetrically". Here's the actual code for Claude Code:

```typescript
export async function feistelDecrypt(
  ciphertext: bigint,
  key: Uint8Array,
  domainSize: bigint,
  rounds: number,
  maxCycleWalks: number
): Promise<{ plaintext: bigint; cycleWalks: number }> {
  const B = isqrt(domainSize);
  const A = (domainSize + B - 1n) / B;

  let cycleWalks = 0;
  let value = ciphertext;

  do {
    let u = value / B;
    let v = value % B;

    // Rounds in REVERSE order
    for (let round = rounds - 1; round >= 0; round--) {
      const prfInput = new Uint8Array([
        round,
        ...bigintToBytes(round % 2 === 0 ? v : u)
      ]);
      const prfOutput = await hmacSha256(key, prfInput);
      const prfValue = bytesToBigint(prfOutput);

      // SUBTRACT instead of add
      if (round % 2 === 0) {
        u = ((u - prfValue % A) + A) % A;
      } else {
        v = ((v - prfValue % B) + B) % B;
      }
    }

    value = u * B + v;

    if (value < domainSize) {
      return { plaintext: value, cycleWalks };
    }

    cycleWalks++;
    if (cycleWalks > maxCycleWalks) {
      throw new Error(`Cycle-walking exceeded limit during decrypt`);
    }
  } while (true);
}
```

### 13.5 PRF INPUT ENCODING — SECURITY FIX

The main plan's PRF input `new Uint8Array([round, ...bigintToBytes(v)])` is ambiguous: round is a single byte (max 255), but bigintToBytes output is variable-length. This allows collisions between `(round=1, v=0x0203)` and `(round=1, v_with_leading_zero)`.

**Fix**: Use a fixed-length encoding. Round index as 4-byte big-endian uint32, value as fixed-length based on domain:

```typescript
function buildPrfInput(round: number, value: bigint, domainSize: bigint): Uint8Array {
  const roundBytes = new Uint8Array(4);
  new DataView(roundBytes.buffer).setUint32(0, round, false); // big-endian

  // Value padded to fixed length (bytes needed to represent domainSize)
  const valueByteLength = Math.ceil(domainSize.toString(2).length / 8);
  const valueBytes = bigintToFixedBytes(value, valueByteLength);

  const result = new Uint8Array(4 + valueByteLength);
  result.set(roundBytes, 0);
  result.set(valueBytes, 4);
  return result;
}
```

Add `bigintToFixedBytes(value: bigint, length: number): Uint8Array` to `bigint-utils.ts`.

### 13.6 PER-POT SUB-KEY DERIVATION (critical for FIFA algorithm correctness)

The spec says: *"For Pots 2, 3, 4: use FPE to generate a permutation of 12 teams."* Each pot needs its OWN permutation. The draw engine must derive a separate sub-key per pot:

```typescript
// In draw-engine.ts, inside generateAssignment():
for (const pot of preset.pots.filter(p => !p.locked)) {
  // Derive pot-specific key: HMAC(masterKey, potIndex || cycleCounter)
  const potKeyInput = new Uint8Array([
    ...bigintToFixedBytes(BigInt(pot.index), 4),
    ...bigintToFixedBytes(BigInt(cycleWalkCount), 4)
  ]);
  const potKey = await hmacSha256(masterKey, potKeyInput);

  // FPE on S_12 for this pot
  const domainSize = factorial(pot.teams.length);
  const { ciphertext } = await feistelEncrypt(
    0n,  // identity permutation rank
    potKey,
    domainSize,
    cryptoConfig.feistel.rounds,
    cryptoConfig.feistel.max_cycle_walks
  );
  const permutation = permutationUnrank(ciphertext, pot.teams.length);

  // Apply permutation: team at position i goes to group permutation[i]
  for (let i = 0; i < permutation.length; i++) {
    assignment.groups[permutation[i]].push(pot.teams[i]);
  }
}
```

### 13.7 WEB WORKER FOR CRYPTO (UI thread protection)

FIFA cycle-walking with mean 10.13 iterations × 3 pots × 8 HMAC calls per Feistel = ~240 async HMAC calls minimum. This WILL jank the UI without a Web Worker.

Create `src/crypto/worker.ts`:

```typescript
// This file runs in a Web Worker context
import { executeDraw, verifyDraw } from "./draw-engine";

self.onmessage = async (e: MessageEvent) => {
  const { type, payload, id } = e.data;
  try {
    let result;
    if (type === "draw") {
      result = await executeDraw(payload.seed, payload.teams, payload.preset, payload.cryptoConfig);
    } else if (type === "verify") {
      result = await verifyDraw(payload.proof);
    }
    self.postMessage({ id, result, error: null });
  } catch (error) {
    self.postMessage({ id, result: null, error: (error as Error).message });
  }
};
```

In the UI, create `src/hooks/useCryptoWorker.ts`:

```typescript
export function useCryptoWorker() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../crypto/worker.ts", import.meta.url),
      { type: "module" }
    );
    return () => workerRef.current?.terminate();
  }, []);

  const executeDraw = useCallback((params) => {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const handler = (e: MessageEvent) => {
        if (e.data.id === id) {
          workerRef.current?.removeEventListener("message", handler);
          e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.result);
        }
      };
      workerRef.current?.addEventListener("message", handler);
      workerRef.current?.postMessage({ type: "draw", payload: params, id });
    });
  }, []);

  // Same for verifyDraw...
  return { executeDraw, verifyDraw };
}
```

### 13.8 LOADING & ERROR STATES

**Loading**: When "Generate Draw" is clicked:
- Disable the button, show spinner (shadcn `Button` with `disabled` + lucide `Loader2` icon spinning)
- Show progress text: "Generating permutations..." → "Checking constraints..." → "Cycle-walking (attempt N)..."
- The Web Worker posts progress messages back. Add: `self.postMessage({ type: "progress", message: "..." })`

**Error recovery**:
- If `max_cycle_walks` exceeded: show shadcn `Alert` (destructive variant): "No valid assignment found after {N} attempts. Your constraints may be too restrictive. Try relaxing a constraint or reducing group size."
- If drand fetch fails: show toast "Could not reach drand beacon. Try again or use dice/custom seed."
- If proof URL is malformed: show "Invalid verification link. Check that the full URL was copied."

### 13.9 RESPONSIVE DESIGN

Mobile-first is critical — verification links get shared via messaging apps, opened on phones.

**Breakpoints** (use Tailwind defaults):
- `sm` (640px): Stack everything vertically. Group grid = 1 column.
- `md` (768px): Group grid = 2 columns. Seed panel tabs stack.
- `lg` (1024px): Group grid = 3 columns. Full stepper visible.
- `xl` (1280px): Group grid = 4 columns. Side panels for proof.

**VerifyPage on mobile**: Single column. Input → Result stacked. The "VERIFIED" banner must be full-width and unmissable on any screen size.

### 13.10 ACCESSIBILITY

- All interactive elements: proper `aria-label` attributes
- Color contrast: teal (#00E5A0) on navy (#0A1628) = 7.5:1 ratio (AAA pass)
- Focus rings: visible `ring-2 ring-offset-2` on all buttons/inputs (Tailwind)
- Keyboard navigation: Tab through the entire draw flow. Enter triggers "Generate Draw"
- Screen reader: Group results announced as "Group A: USA, Colombia, Turkey, Jamaica"
- Reduced motion: Wrap animations in `@media (prefers-reduced-motion: reduce)` — skip the verification cascade animation

### 13.11 AUTHOR ATTRIBUTION

The spec says `author: "Aditya Tiwari"`. Add to `config/brand.yml`:

```yaml
  attribution:
    author: "Aditya Tiwari"
    project_origin: "NarayanaKit — D006 discovery from madhva_exp project"
    narayana_pandita:
      text: "Ganita Kaumudi (गणित कौमुदी), Chapter 13"
      date: "1356 CE"
      location: "India"
      contribution: "Nashta (unranking) and Uddishta (ranking) algorithms — the first known rank/unrank bijection for k-subsets, predating Western rediscovery by Buckles (1977) by 621 years."
```

The About page MUST render this attribution prominently.

### 13.12 VITEST CONFIGURATION

Add `vitest.config.ts` to the project root:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",       // Crypto engine tests don't need DOM
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/crypto/**"],  // Only crypto needs coverage
      thresholds: {
        branches: 90,
        functions: 95,
        lines: 90,
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  }
});
```

Install: `pnpm add -D vitest @vitest/coverage-v8`

**IMPORTANT**: WebCrypto (`crypto.subtle`) is NOT available in Node.js test environment by default. Either:
- Use `vitest` with `environment: "jsdom"` (has crypto.subtle), OR
- Add a polyfill: `import { webcrypto } from "node:crypto"; globalThis.crypto = webcrypto;` in a setup file

### 13.13 FIFA TEAMS DATA DISCLAIMER

Add to `data/fifa_2026_teams.yml` header:

```yaml
# ⚠️  PLACEHOLDER DATA — Teams and rankings are approximate as of 2026-04-04.
# Update with actual qualified teams once FIFA confirms the final 48.
# Pot assignments are based on estimated FIFA rankings and may change.
# The algorithm works regardless of team data — only names and metadata matter.
```

### 13.14 COMPACT PROOF URL ENCODING

A 48-team proof JSON is ~3-4KB. After deflate: ~800 bytes. After base64url: ~1100 chars. Total URL: `https://fairdraw.io/verify#proof=<1100 chars>` ≈ 1.15KB. Within URL limits (most browsers support 2KB+ fragments).

Implementation in `src/crypto/proof.ts`:

```typescript
export async function encodeProofToUrl(proof: Proof, domain: string): Promise<string> {
  const json = JSON.stringify(proof);
  const compressed = await compress(new TextEncoder().encode(json));
  const encoded = base64urlEncode(compressed);
  return `https://${domain}/verify#proof=${encoded}`;
}

export async function decodeProofFromUrl(fragment: string): Promise<Proof> {
  const encoded = fragment.replace(/^#?proof=/, "");
  if (!encoded) throw new Error("No proof data in URL");
  const compressed = base64urlDecode(encoded);
  const json = await decompress(compressed);
  const proof = JSON.parse(new TextDecoder().decode(json));
  validateProofSchema(proof);  // Zod or manual validation — NEVER trust URL input
  return proof;
}

async function compress(data: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("deflate");
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();
  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return concatUint8Arrays(chunks);
}
```

**Security**: The `decodeProofFromUrl` function MUST validate the parsed JSON against the Proof schema using Zod (already installed via shadcn dependencies) before passing it to the crypto engine. Never trust URL fragment data.

### 13.15 UPDATED EXECUTION SEQUENCE

Replace Step 4 in Section 12 with:

| Step | Files to create | Test before proceeding |
|------|----------------|----------------------|
| 1 | Init project with `init-artifact.sh`, install extra deps | `pnpm dev` starts |
| 2 | `config/*.yml` + `data/*.yml` | Files parse without error |
| 3 | `src/config/types.ts` + `src/config/loader.ts` | TypeScript compiles |
| 4 | `vitest.config.ts` + WebCrypto polyfill setup | `pnpm test` runs (empty) |
| 5 | `src/crypto/bigint-utils.ts` + `src/crypto/hmac.ts` + `src/crypto/hash.ts` + tests | Unit tests pass |
| 6 | `src/crypto/combinadic.ts` + tests | All 4 spec vectors + exhaustive C(6,3) roundtrip |
| 7 | `src/crypto/feistel.ts` (encrypt AND decrypt) + tests | Roundtrip passes, cycle-walking terminates |
| 8 | `src/crypto/permutation.ts` + tests | S_4 exhaustive + S_12 sample |
| 9 | `src/crypto/draw-engine.ts` + `src/crypto/proof.ts` + proof URL encoding + tests | FIFA preset: deterministic, all constraints pass |
| 10 | `src/crypto/worker.ts` + `src/hooks/useCryptoWorker.ts` | Worker loads and responds |
| 11 | `src/components/layout/*` + `src/App.tsx` (router) | App renders with brand from YAML |
| 12 | `src/pages/HomePage.tsx` + preset cards | Presets display, responsive |
| 13 | `src/pages/DrawPage.tsx` + ALL sub-components incl. hybrid seed | Full draw flow with loading states |
| 14 | `src/pages/VerifyPage.tsx` + URL decoding | Verification matches, error states work |
| 15 | `src/pages/AboutPage.tsx` with Narayana attribution | Static content renders |
| 16 | Security hardening: CSP, input validation, Zod proof schema | CSP active, malformed proofs rejected |
| 17 | Responsive + accessibility pass | Works on 375px mobile, keyboard nav, ARIA |
| 18 | `vercel.json` + production build | `pnpm build` succeeds, `pnpm test` all green |
| 19 | `README.md` | Complete |

### 13.16 USER-FACING LANGUAGE — ZERO JARGON RULE

**Our audience is NOT engineers.** They are sports fans, school administrators, parents, housing applicants, esports organizers, journalists. Most have zero background in CS, cryptography, or math.

**Read `config/copy.yml` for ALL user-facing text.** It contains every heading, button label, error message, and explainer in plain English. Claude Code MUST use these strings verbatim — do NOT write ad-hoc UI copy.

**Hard rules for any text a user can see:**

1. NEVER use: cryptographic, encryption, cipher, hash, algorithm, deterministic, bijective, permutation, entropy, domain, PRF, FPE, Feistel, BigInt, combinadic, rank/unrank, PRP, WebCrypto, SHA-256
2. INSTEAD use: tamper-proof, fair, checkable, public number (not "seed"), digital fingerprint (not "hash"), receipt (not "proof object"), arrangement (not "permutation"), rules (not "constraints")
3. The ONLY place technical language appears is behind a "For developers & researchers" toggle on the About page
4. Error messages sound human: "Couldn't find an arrangement with those rules — try relaxing one" not "Constraint satisfaction failed after max cycle walks"
5. Verification result feels emotional: "Confirmed — This draw is genuine" with a big shield, not "Proof verification: PASS"
6. Explain WHY not HOW: "No one can work backwards from a desired result" not "FPE is a pseudorandom permutation"
7. The three-step framing everywhere: Set up → Public number → Result with receipt

**Variable names in code stay technical** (`feistelEncrypt`, `cycleWalks`, `seed`). Only the UI labels change. The `config/copy.yml` file is the bridge — code keys map to human labels.

### 13.17 THINGS EXPLICITLY OUT OF SCOPE FOR MVP

Do NOT build these. They are Phase 2+ features:

- PDF export of results (just JSON + share URL for now)
- REST API (`api.fairdraw.io`)
- npm package extraction (`narayana-fairness` npm)
- Analytics integration (Plausible/Fathom)
- Pro tier / API key gating
- i18n / multi-language support
- Esports bracket visualization (tree/bracket view)
- March Madness / Olympics presets (ship FIFA + UCL + generic + esports only)
- E2E tests with Playwright (unit tests cover the crypto; manual test the UI)
- Dark/light mode toggle (ship dark-only — matches the editorial aesthetic)
