/**
 * @see https://www.radix-ui.com/themes/docs/theme/breakpoints
 */
export const MEDIA_WIDTHS = {
  initial: 0,
  xs: 520,
  sm: 768,
  md: 1024,
  lg: 1280,
  xl: 1640,
};

export function getMediaQuery(query: string, useMediaPrefix: boolean) {
  return useMediaPrefix ? `@media ${query}` : query;
}

export const Media = {
  XlAndUp: (useMediaPrefix: boolean) =>
    getMediaQuery(`(min-width: ${MEDIA_WIDTHS.xl}px)`, useMediaPrefix),
};
