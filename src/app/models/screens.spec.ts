import { DEFAULT_SCREENS, formatScreens, inScreens, parseScreens } from './screens';

describe('screens', () => {
  it('parses screen lists and falls back to the default', () => {
    expect(parseScreens('3, 1,1')).toEqual([1, 3]);
    expect(parseScreens(null)).toEqual([...DEFAULT_SCREENS]);
    expect(parseScreens('abc')).toEqual([...DEFAULT_SCREENS]);
  });

  it('keeps the default out of the URL', () => {
    expect(formatScreens([2, 1])).toBeNull();
    expect(formatScreens([3, 1, 2])).toBe('1,2,3');
  });

  it('matches variants assessed in any selected screen', () => {
    const outcome = {
      label: 'Activating (screen 1 & 2)',
      category: 'activating' as const,
      screens: [1, 2],
    };

    expect(inScreens(outcome, [2])).toBe(true);
    expect(inScreens(outcome, [3])).toBe(false);
    expect(inScreens(null, [1, 2, 3])).toBe(false);
  });
});
