import { ScreenVariant } from './lrrk2';

export type ActivityGroup = 'above_reference' | 'wt_range' | 'reduced';

export interface RankedVariant {
  rank: number;
  variant: ScreenVariant;
  mean: number;
  group: ActivityGroup;
}

/**
 * The variant whose activity separates the high-activity group, and the fold-change thresholds drawn on the plots.
 */
export const REFERENCE_VARIANT = 'G2019S';
export const ACTIVATING_THRESHOLD = 1.5;
export const WT_LEVEL = 1;
export const REDUCED_THRESHOLD = 0.5;

/**
 * Ranks screen variants by descending mean activity and assigns each an activity group.
 *
 * Variants ranked at or above the reference variant are `above_reference`, variants below
 * `REDUCED_THRESHOLD` are `reduced`, and the rest are `wt_range`.
 */
export function rankVariants(variants: ScreenVariant[]): RankedVariant[] {
  const sorted = variants
    .filter((v) => v.mean !== null)
    .map((v, index) => ({ v, index }))
    .sort((a, b) => (b.v.mean as number) - (a.v.mean as number) || a.index - b.index)
    .map(({ v }) => v);
  const referenceRank = sorted.findIndex((v) => v.variant === REFERENCE_VARIANT) + 1;
  return sorted.map((variant, i) => {
    const mean = variant.mean as number;
    const rank = i + 1;
    const group: ActivityGroup =
      referenceRank > 0 && rank <= referenceRank
        ? 'above_reference'
        : mean < REDUCED_THRESHOLD
          ? 'reduced'
          : 'wt_range';
    return { rank, variant, mean, group };
  });
}
