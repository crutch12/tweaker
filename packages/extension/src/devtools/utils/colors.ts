export function textToIndex(text: string, length: number) {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) + hash + text.charCodeAt(i);
  }
  return Math.abs(hash) % length;
}

export function getTextColor(text: string) {
  const colors = [
    "#E6194B",
    "#3CB44B",
    "#FFE119",
    "#4363D8",
    "#F58231",
    "#911EB4",
    "#42D4F4",
    "#F032E6",
    "#BFEF45",
    "#FABEBE",
    "#469990",
    "#9A6324",
    "#FFFAC8",
    "#800000",
    "#AAFFC3",
    "#FFD8B1",
    "#000075",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FF8000",
    "#8000FF",
    "#00FF80",
    "#FF0080",
    "#80FF00",
    "#0080FF",
    "#FFD700",
    "#FF5733",
    "#33FF57",
    "#3357FF",
    "#F0E68C",
    "#E6E6FA",
    "#008080",
    "#FF1493",
  ];
  return colors[textToIndex(text, colors.length)];
}
