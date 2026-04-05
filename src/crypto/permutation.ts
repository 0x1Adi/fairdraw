/**
 * Lehmer code (factoradic) for permutation rank/unrank on S_n.
 * Used by the draw engine to convert FPE output to a group assignment.
 */

export function factorial(n: number): bigint {
  let result = 1n;
  for (let i = 2; i <= n; i++) {
    result *= BigInt(i);
  }
  return result;
}

/**
 * Rank a permutation to integer in {0, ..., n!-1} using Lehmer code.
 */
export function permutationRank(perm: number[]): bigint {
  const n = perm.length;
  const used = new Array(n).fill(false);
  let rank = 0n;

  for (let i = 0; i < n; i++) {
    // Count how many unused elements are less than perm[i]
    let smaller = 0;
    for (let j = 0; j < perm[i]; j++) {
      if (!used[j]) smaller++;
    }
    rank += BigInt(smaller) * factorial(n - 1 - i);
    used[perm[i]] = true;
  }

  return rank;
}

/**
 * Unrank integer to permutation of {0, ..., n-1}.
 */
export function permutationUnrank(rank: bigint, n: number): number[] {
  const domain = factorial(n);
  if (rank < 0n || rank >= domain)
    throw new Error(`Rank ${rank} out of range [0, ${domain})`);

  const available = Array.from({ length: n }, (_, i) => i);
  const perm: number[] = [];
  let remaining = rank;

  for (let i = n; i > 0; i--) {
    const fact = factorial(i - 1);
    const idx = Number(remaining / fact);
    perm.push(available[idx]);
    available.splice(idx, 1);
    remaining %= fact;
  }

  return perm;
}
