export const PATHOGENIC_CLASSES = new Set(['Pathogenic', 'Likely pathogenic']);

/**
 * Returns a translucent rgba() version of a hex colour.
 */
export function tint(hex: string, alpha: number): string {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255},${alpha})`;
}
