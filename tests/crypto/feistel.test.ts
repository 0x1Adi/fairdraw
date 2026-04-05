import { describe, it, expect } from "vitest";
import { feistelEncrypt, feistelDecrypt } from "@/crypto/feistel";

const ROUNDS = 8;
const MAX_CYCLE_WALKS = 1000;

function randomKey(): Uint8Array {
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) key[i] = Math.floor(Math.random() * 256);
  return key;
}

describe("feistelEncrypt / feistelDecrypt roundtrip", () => {
  it("decrypt(encrypt(m)) === m for 50 random messages in domain 100", async () => {
    const key = randomKey();
    const domainSize = 100n;
    for (let i = 0; i < 50; i++) {
      const plaintext = BigInt(Math.floor(Math.random() * 100));
      const { ciphertext } = await feistelEncrypt(
        plaintext,
        key,
        domainSize,
        ROUNDS,
        MAX_CYCLE_WALKS
      );
      expect(ciphertext >= 0n && ciphertext < domainSize).toBe(true);
      const { plaintext: recovered } = await feistelDecrypt(
        ciphertext,
        key,
        domainSize,
        ROUNDS,
        MAX_CYCLE_WALKS
      );
      expect(recovered).toBe(plaintext);
    }
  }, 30000);

  it("roundtrip in large domain (12! = 479001600)", async () => {
    const key = randomKey();
    const domainSize = 479001600n; // 12!
    for (let i = 0; i < 10; i++) {
      const plaintext = BigInt(Math.floor(Math.random() * Number(domainSize)));
      const { ciphertext } = await feistelEncrypt(
        plaintext,
        key,
        domainSize,
        ROUNDS,
        MAX_CYCLE_WALKS
      );
      const { plaintext: recovered } = await feistelDecrypt(
        ciphertext,
        key,
        domainSize,
        ROUNDS,
        MAX_CYCLE_WALKS
      );
      expect(recovered).toBe(plaintext);
    }
  }, 60000);
});

describe("feistelEncrypt determinism", () => {
  it("same key + message → same ciphertext", async () => {
    const key = randomKey();
    const domainSize = 1000n;
    const plaintext = 42n;
    const r1 = await feistelEncrypt(plaintext, key, domainSize, ROUNDS, MAX_CYCLE_WALKS);
    const r2 = await feistelEncrypt(plaintext, key, domainSize, ROUNDS, MAX_CYCLE_WALKS);
    expect(r1.ciphertext).toBe(r2.ciphertext);
  });

  it("different keys → different ciphertexts (with overwhelming probability)", async () => {
    const key1 = randomKey();
    const key2 = randomKey();
    const domainSize = 10000n;
    const plaintext = 0n;
    const r1 = await feistelEncrypt(plaintext, key1, domainSize, ROUNDS, MAX_CYCLE_WALKS);
    const r2 = await feistelEncrypt(plaintext, key2, domainSize, ROUNDS, MAX_CYCLE_WALKS);
    expect(r1.ciphertext).not.toBe(r2.ciphertext);
  });
});

describe("feistelEncrypt output range", () => {
  it("all outputs are within [0, domainSize) for domain 97 (prime)", async () => {
    const key = randomKey();
    const domainSize = 97n;
    const results = new Set<bigint>();
    for (let i = 0; i < 50; i++) {
      const { ciphertext } = await feistelEncrypt(
        BigInt(i % 97),
        key,
        domainSize,
        ROUNDS,
        MAX_CYCLE_WALKS
      );
      expect(ciphertext >= 0n && ciphertext < domainSize).toBe(true);
      results.add(ciphertext);
    }
    // As a PRP, outputs should be distinct for distinct inputs
    expect(results.size).toBe(50);
  }, 30000);

  it("cycle-walking terminates for small domain (domain=2)", async () => {
    const key = randomKey();
    const domainSize = 2n;
    for (let pt = 0n; pt < domainSize; pt++) {
      const { ciphertext } = await feistelEncrypt(
        pt,
        key,
        domainSize,
        ROUNDS,
        MAX_CYCLE_WALKS
      );
      expect(ciphertext >= 0n && ciphertext < domainSize).toBe(true);
    }
  });
});
