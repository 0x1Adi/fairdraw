import { webcrypto } from "node:crypto";

// Polyfill WebCrypto for Node.js test environment
if (typeof globalThis.crypto === "undefined") {
  (globalThis as unknown as { crypto: typeof webcrypto }).crypto = webcrypto;
} else if (typeof globalThis.crypto.subtle === "undefined") {
  (globalThis.crypto as unknown as { subtle: typeof webcrypto.subtle }).subtle = webcrypto.subtle;
}
