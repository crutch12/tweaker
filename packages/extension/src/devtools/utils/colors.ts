export function textToIndex(text: string, length: number) {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) + hash + text.charCodeAt(i);
  }
  return Math.abs(hash) % length;
}

export function getTextColor(text: string) {
  const colors = [
    "#C2298A",
    "#8145B5",
    "#5753C6",
    "#0090FF",
    "#0D74CE",
    "#008573",
    "#208368",
    "#2A7E3B",
    "#71624B",
    "#AB6400",
    "#5C7C2F",
    "#00749E",
  ];
  return colors[textToIndex(text, colors.length)];
}
