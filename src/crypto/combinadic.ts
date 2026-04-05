import { binomial } from "./bigint-utils";

/**
 * Narayana's Uddishta: rank a k-subset to an integer.
 * Input: sorted array of k positions [c_0 < c_1 < ... < c_{k-1}]
 * Output: rank in {0, ..., C(n,k)-1}
 * Formula: rank = Σ C(c_i, i+1)
 *
 * Invented by Narayana Pandita in Ganita Kaumudi (1356 CE).
 */
export function combinadicRank(
  positions: number[],
  n: number,
  k: number
): bigint {
  if (positions.length !== k)
    throw new Error(`Expected ${k} positions, got ${positions.length}`);
  for (let i = 0; i < k; i++) {
    if (positions[i] < 0 || positions[i] >= n)
      throw new Error(`Position ${positions[i]} out of range [0, ${n})`);
    if (i > 0 && positions[i] <= positions[i - 1])
      throw new Error("Positions must be strictly increasing");
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
export function combinadicUnrank(
  rank: bigint,
  n: number,
  k: number
): number[] {
  if (k === 0) return [];
  const domain = binomial(n, k);
  if (rank < 0n || rank >= domain)
    throw new Error(`Rank ${rank} out of range [0, ${domain})`);
  const positions: number[] = new Array(k);
  let remaining = rank;
  for (let i = k - 1; i >= 0; i--) {
    // Find largest c such that C(c, i+1) <= remaining
    let lo = i;
    let hi = n - 1;
    while (lo < hi) {
      const mid = lo + Math.ceil((hi - lo) / 2);
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
