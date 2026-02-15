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
