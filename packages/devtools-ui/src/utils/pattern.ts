export function parsePatterns(patterns: string) {
  return patterns
    .split(/,\s*/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function serializePatterns(patterns: string[]) {
  return patterns.join(", ");
}
