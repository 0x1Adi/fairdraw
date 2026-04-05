import { hmacSha256 } from "./hmac";
import { isqrt, bigintToFixedBytes, bytesToBigint, domainByteLength } from "./bigint-utils";

/**
 * Fixed-length PRF input encoding.
 * Round as 4-byte big-endian uint32, value padded to fixed length.
 * This prevents length-extension collisions.
 */
function buildPrfInput(
  round: number,
  value: bigint,
  domainSize: bigint
): Uint8Array {
  const roundBytes = new Uint8Array(4);
  new DataView(roundBytes.buffer).setUint32(0, round, false);

  const valueByteLength = domainByteLength(domainSize);
  const valueBytes = bigintToFixedBytes(value, valueByteLength);

  const result = new Uint8Array(4 + valueByteLength);
  result.set(roundBytes, 0);
  result.set(valueBytes, 4);
  return result;
}

/**
 * Format-Preserving Encryption on domain {0, ..., domainSize-1}.
 * Unbalanced Feistel with cycle-walking (Black-Rogaway 2002).
 * Security: 8 rounds = strong PRP (Hoang-Rogaway, CRYPTO 2010).
 */
export async function feistelEncrypt(
  plaintext: bigint,
  key: Uint8Array,
  domainSize: bigint,
  rounds: number,
  maxCycleWalks: number
): Promise<{ ciphertext: bigint; cycleWalks: number }> {
  if (plaintext < 0n || plaintext >= domainSize)
    throw new Error(`Plaintext ${plaintext} out of domain [0, ${domainSize})`);

  const B = isqrt(domainSize);
  const A = (domainSize + B - 1n) / B; // ceil(domainSize / B)

  let cycleWalks = 0;
  let value = plaintext;

  do {
    let u = value / B;
    let v = value % B;

    for (let round = 0; round < rounds; round++) {
      const prfInput = buildPrfInput(
        round,
        round % 2 === 0 ? v : u,
        domainSize
      );
      const prfOutput = await hmacSha256(key, prfInput);
      const prfValue = bytesToBigint(prfOutput);

      if (round % 2 === 0) {
        u = ((u + prfValue % A) % A + A) % A;
      } else {
        v = ((v + prfValue % B) % B + B) % B;
      }
    }

    value = u * B + v;

    if (value < domainSize) {
      return { ciphertext: value, cycleWalks };
    }

    cycleWalks++;
    if (cycleWalks > maxCycleWalks) {
      throw new Error(
        `Cycle-walking exceeded ${maxCycleWalks} iterations — aborting`
      );
    }
  } while (true);
}

/**
 * Decrypt: rounds reversed, subtract instead of add.
 */
export async function feistelDecrypt(
  ciphertext: bigint,
  key: Uint8Array,
  domainSize: bigint,
  rounds: number,
  maxCycleWalks: number
): Promise<{ plaintext: bigint; cycleWalks: number }> {
  if (ciphertext < 0n || ciphertext >= domainSize)
    throw new Error(
      `Ciphertext ${ciphertext} out of domain [0, ${domainSize})`
    );

  const B = isqrt(domainSize);
  const A = (domainSize + B - 1n) / B;

  let cycleWalks = 0;
  let value = ciphertext;

  do {
    let u = value / B;
    let v = value % B;

    // Rounds in REVERSE order, subtract instead of add
    for (let round = rounds - 1; round >= 0; round--) {
      const prfInput = buildPrfInput(
        round,
        round % 2 === 0 ? v : u,
        domainSize
      );
      const prfOutput = await hmacSha256(key, prfInput);
      const prfValue = bytesToBigint(prfOutput);

      if (round % 2 === 0) {
        u = ((u - prfValue % A) % A + A) % A;
      } else {
        v = ((v - prfValue % B) % B + B) % B;
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
