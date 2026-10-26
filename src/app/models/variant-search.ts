/**
 * True when a variant matches a highlight query: a whole number matches the residue position,
 * any other text matches the variant name case-insensitively. An empty query matches nothing.
 */
export function matchesQuery(
  variant: { variant: string; residues: number[] },
  query: string,
): boolean {
  const text = query.trim();
  if (!text) {
    return false;
  }
  if (/^\d+$/.test(text)) {
    return variant.residues.includes(Number(text));
  }
  return variant.variant.toLowerCase().includes(text.toLowerCase());
}
