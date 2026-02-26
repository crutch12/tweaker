type Keys = string | number | symbol;

/**
 * Groups an array of objects by a computed key.
 * @param items The array to group
 * @param keySelector A function that returns the key for each item
 */
export function groupBy<T, K extends Keys>(
  items: T[],
  keySelector: (item: T) => K,
): Record<K, T[]> {
  return items.reduce(
    (accumulator, currentItem) => {
      const key = keySelector(currentItem);

      // Initialize the group if it doesn't exist
      if (!accumulator[key]) {
        accumulator[key] = [];
      }

      accumulator[key].push(currentItem);
      return accumulator;
    },
    {} as Record<K, T[]>,
  );
}
