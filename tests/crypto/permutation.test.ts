import { describe, it, expect } from "vitest";
import { permutationRank, permutationUnrank, factorial } from "@/crypto/permutation";

describe("factorial", () => {
  it("0! = 1", () => expect(factorial(0)).toBe(1n));
  it("1! = 1", () => expect(factorial(1)).toBe(1n));
  it("4! = 24", () => expect(factorial(4)).toBe(24n));
  it("12! = 479001600", () => expect(factorial(12)).toBe(479001600n));
});

describe("permutationRank / permutationUnrank — S_4 exhaustive", () => {
  it("all 24 permutations of S_4 roundtrip", () => {
    const n = 4;
    const total = Number(factorial(n));
    const seen = new Set<number>();

    function permutations(arr: number[]): number[][] {
      if (arr.length <= 1) return [arr];
      const result: number[][] = [];
      for (let i = 0; i < arr.length; i++) {
        const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
        for (const p of permutations(rest)) {
          result.push([arr[i], ...p]);
        }
      }
      return result;
    }

    const allPerms = permutations([0, 1, 2, 3]);
    expect(allPerms.length).toBe(total);

    for (const perm of allPerms) {
      const rank = permutationRank(perm);
      expect(rank >= 0n && rank < BigInt(total)).toBe(true);
      seen.add(Number(rank));
      const recovered = permutationUnrank(rank, n);
      expect(recovered).toEqual(perm);
    }

    // All ranks are distinct
    expect(seen.size).toBe(total);
  });
});

describe("permutationRank / permutationUnrank — S_12 sample", () => {
  it("1000 random samples from S_12 roundtrip correctly", () => {
    const n = 12;
    const total = factorial(n);

    for (let i = 0; i < 1000; i++) {
      const rank = BigInt(Math.floor(Math.random() * Number(total)));
      const perm = permutationUnrank(rank, n);
      expect(perm.length).toBe(n);
      // Verify it's a valid permutation
      expect(new Set(perm).size).toBe(n);
      expect(Math.min(...perm)).toBe(0);
      expect(Math.max(...perm)).toBe(n - 1);
      // Roundtrip
      expect(permutationRank(perm)).toBe(rank);
    }
  });
});

describe("permutationUnrank throws on bad input", () => {
  it("throws when rank >= n!", () => {
    expect(() => permutationUnrank(factorial(4), 4)).toThrow();
  });

  it("throws when rank < 0", () => {
    expect(() => permutationUnrank(-1n, 4)).toThrow();
  });
});
