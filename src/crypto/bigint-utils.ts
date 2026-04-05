/**
 * BigInt math utilities for the crypto engine.
 * SECURITY: BigInt in JS is NOT constant-time. This is a reference implementation.
 */

export function binomial(n: number, k: number): bigint {
  if (k < 0 || k > n) return 0n;
  if (k === 0 || k === n) return 1n;
  if (k > n - k) k = n - k;
  let result = 1n;
  for (let i = 0; i < k; i++) {
    result = (result * BigInt(n - i)) / BigInt(i + 1);
  }
  return result;
}

/** Convert BigInt to big-endian Uint8Array (minimal length, at least 1 byte) */
export function bigintToBytes(value: bigint): Uint8Array {
  if (value === 0n) return new Uint8Array([0]);
  if (value < 0n) throw new Error("bigintToBytes: negative value");
  const hex = value.toString(16);
  const padded = hex.length % 2 === 0 ? hex : "0" + hex;
  const bytes = new Uint8Array(padded.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Convert BigInt to big-endian Uint8Array with a fixed byte length */
export function bigintToFixedBytes(value: bigint, length: number): Uint8Array {
  if (value < 0n) throw new Error("bigintToFixedBytes: negative value");
  const result = new Uint8Array(length);
  let v = value;
  for (let i = length - 1; i >= 0; i--) {
    result[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return result;
}

/** Convert Uint8Array (big-endian) to BigInt */
export function bytesToBigint(bytes: Uint8Array): bigint {
  let result = 0n;
  for (const byte of bytes) {
    result = (result << 8n) | BigInt(byte);
  }
  return result;
}

/** Integer square root (floor) for Feistel split */
export function isqrt(n: bigint): bigint {
  if (n < 0n) throw new Error("isqrt: negative input");
  if (n === 0n) return 0n;
  let x = n;
  let y = (x + 1n) >> 1n;
  while (y < x) {
    x = y;
    y = (x + n / x) >> 1n;
  }
  return x;
}

/** Number of bytes needed to represent a BigInt domain */
export function domainByteLength(domainSize: bigint): number {
  if (domainSize <= 0n) return 1;
  const bits = domainSize.toString(2).length;
  return Math.ceil(bits / 8);
}
