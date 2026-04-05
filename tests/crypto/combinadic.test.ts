import { describe, it, expect } from "vitest";
import { combinadicRank, combinadicUnrank } from "@/crypto/combinadic";
import { binomial } from "@/crypto/bigint-utils";

describe("combinadicRank — Narayana's Uddishta", () => {
  it("spec vector: rank([0,1,2], 6, 3) === 0", () => {
    expect(combinadicRank([0, 1, 2], 6, 3)).toBe(0n);
  });

  it("spec vector: rank([3,4,5], 6, 3) === 19", () => {
    expect(combinadicRank([3, 4, 5], 6, 3)).toBe(19n);
  });

  it("handles k=0", () => {
    expect(combinadicRank([], 6, 0)).toBe(0n);
  });

  it("throws on wrong position count", () => {
    expect(() => combinadicRank([0, 1], 6, 3)).toThrow();
  });

  it("throws on out-of-range position", () => {
    expect(() => combinadicRank([0, 1, 6], 6, 3)).toThrow();
  });

  it("throws on non-strictly-increasing positions", () => {
    expect(() => combinadicRank([0, 2, 1], 6, 3)).toThrow();
  });
});

describe("combinadicUnrank — Narayana's Nashta", () => {
  it("spec vector: unrank(0, 6, 3) === [0,1,2]", () => {
    expect(combinadicUnrank(0n, 6, 3)).toEqual([0, 1, 2]);
  });

  it("spec vector: unrank(19, 6, 3) === [3,4,5]", () => {
    expect(combinadicUnrank(19n, 6, 3)).toEqual([3, 4, 5]);
  });

  it("handles k=0", () => {
    expect(combinadicUnrank(0n, 6, 0)).toEqual([]);
  });

  it("throws on rank out of range", () => {
    expect(() => combinadicUnrank(20n, 6, 3)).toThrow();
  });
});

describe("roundtrip — C(6, 3) exhaustive", () => {
  it("rank(unrank(r)) === r for all r in [0, C(6,3))", () => {
    const total = Number(binomial(6, 3));
    for (let r = 0; r < total; r++) {
      const positions = combinadicUnrank(BigInt(r), 6, 3);
      expect(combinadicRank(positions, 6, 3)).toBe(BigInt(r));
    }
  });

  it("unrank(rank(p)) === p for all subsets of size 3 from 6", () => {
    for (let a = 0; a < 4; a++) {
      for (let b = a + 1; b < 5; b++) {
        for (let c = b + 1; c < 6; c++) {
          const positions = [a, b, c];
          const rank = combinadicRank(positions, 6, 3);
          expect(combinadicUnrank(rank, 6, 3)).toEqual(positions);
        }
      }
    }
  });
});

describe("edge cases", () => {
  it("k=n: rank is always 0", () => {
    expect(combinadicRank([0, 1, 2], 3, 3)).toBe(0n);
  });

  it("n=1, k=1", () => {
    expect(combinadicRank([0], 1, 1)).toBe(0n);
    expect(combinadicUnrank(0n, 1, 1)).toEqual([0]);
  });

  it("larger n: C(20, 5) roundtrip for 100 samples", () => {
    const total = binomial(20, 5);
    for (let i = 0; i < 100; i++) {
      const r = BigInt(Math.floor(Math.random() * Number(total)));
      const positions = combinadicUnrank(r, 20, 5);
      expect(combinadicRank(positions, 20, 5)).toBe(r);
    }
  });
});
