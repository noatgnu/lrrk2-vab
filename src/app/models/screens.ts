import { FunctionalOutcome } from './lrrk2';

/**
 * Screens shown when the URL does not name any: the screens behind the published ranking figure.
 */
export const DEFAULT_SCREENS: readonly number[] = [1, 2];

/**
 * Parses a `screens` query value such as `"1,2,3"`, falling back to the default screens when it is
 * missing or contains no valid screen numbers.
 */
export function parseScreens(value: string | null | undefined): number[] {
  const screens = (value ?? '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return screens.length ? [...new Set(screens)].sort((a, b) => a - b) : [...DEFAULT_SCREENS];
}

/**
 * Formats screens for the `screens` query, returning null for the default so it stays out of the URL.
 */
export function formatScreens(screens: number[]): string | null {
  const sorted = [...new Set(screens)].sort((a, b) => a - b);
  const isDefault =
    sorted.length === DEFAULT_SCREENS.length && sorted.every((s, i) => s === DEFAULT_SCREENS[i]);
  return isDefault ? null : sorted.join(',');
}

/**
 * True when a variant was assessed in at least one of the selected screens.
 */
export function inScreens(outcome: FunctionalOutcome | null, screens: readonly number[]): boolean {
  return !!outcome && outcome.screens.some((screen) => screens.includes(screen));
}
