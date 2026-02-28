export function textToIndex(text: string, length: number) {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) + hash + text.charCodeAt(i);
  }
  return Math.abs(hash) % length;
}

export function getColorName(text: string) {
  const colors = [
    // "#C2298A",
    // "#8145B5",
    // "#5753C6",
    // "#0090FF",
    // "#0D74CE",
    // "#008573",
    // "#208368",
    // "#2A7E3B",
    // "#71624B",
    // "#AB6400",
    // "#5C7C2F",
    // "#00749E",
    "plum",
    "violet",
    "indigo",
    "blue",
    "cyan",
    "jade",
    "grass",
    "yellow",
    "lime",
    "mint",
    "sky",
  ] as const;
  return colors[textToIndex(text, colors.length)];
}

export function getColor(
  text: string,
  intensity: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
) {
  return `var(--${getColorName(text)}-${intensity})`;
}

export function getTextColor(text: string) {
  return getColor(text, 11);
}

export function getControlColor(text: string) {
  return getColor(text, 11);
}

export function getBackgroundColor(text: string) {
  return getColor(text, 2);
}

export function getActiveBackgroundColor(text: string) {
  return getColor(text, 3);
}
