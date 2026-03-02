export function normalizeUrlIfValid(url: string): string {
  try {
    // TODO: Chrome will use the basepath to create a Resource URL.
    return new URL(url).toString();
  } catch {
    // Giving up if it's not a valid URL without basepath
    return url;
  }
}
