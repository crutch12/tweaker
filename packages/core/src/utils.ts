import { minimatch } from "minimatch";

export function keyMatchesPatterns(
  key: string,
  patterns: readonly string[],
): false | "exact" | "pattern" {
  for (const pattern of patterns) {
    if (key.trim() === pattern.trim()) {
      return "exact";
    }
    const found = minimatch(key, pattern);
    if (found) {
      return "pattern";
    }
  }
  return false;
}

export function generateNumberId(length = 9) {
  const firstDigit = Math.ceil(Math.random() * 9);
  const restDigits = Math.random()
    .toString()
    .slice(2)
    .slice(0, length - 1);
  return Number(`${firstDigit}${restDigits}`);
}

export function generateStringId(length = 9) {
  return globalThis.crypto.randomUUID().replace("-", "").slice(-length);
}
