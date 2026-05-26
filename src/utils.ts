/**
 * Generates a deterministic key for cloned elements.
 *
 * Prefix already includes the parent Shimmer's `useId()` plus a positional
 * index from the caller, so it is unique per render slot and stable across
 * SSR + client hydration. No module-scope counter — that caused hydration
 * mismatches and forced React to remount cloned children every render.
 */
export function generateShimmerKey(prefix: string = 'shimmer'): string {
  return prefix;
}

/**
 * Default fallback dimensions for common elements when their
 * measured dimensions are 0px (e.g., empty inputs, images not yet loaded).
 */
export const FALLBACK_DIMENSIONS: Record<string, { width: number; height: number }> = {
  INPUT: { width: 200, height: 36 },
  BUTTON: { width: 120, height: 36 },
  TEXTAREA: { width: 300, height: 80 },
  SELECT: { width: 200, height: 36 },
  IMG: { width: 100, height: 100 },
  H1: { width: 300, height: 36 },
  H2: { width: 260, height: 30 },
  H3: { width: 220, height: 26 },
  H4: { width: 200, height: 22 },
  H5: { width: 180, height: 20 },
  H6: { width: 160, height: 18 },
  P: { width: 250, height: 16 },
  SPAN: { width: 100, height: 16 },
};
