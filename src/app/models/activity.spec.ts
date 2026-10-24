import { RANKING_FIXTURE, screenVariant } from '../testing/fixtures';
import { rankVariants } from './activity';

describe('rankVariants', () => {
  it('ranks by descending mean and keeps workbook order for ties', () => {
    const ranked = rankVariants([...RANKING_FIXTURE.variants].reverse());

    expect(ranked.map((r) => r.variant.variant)).toEqual([
      'Y1699C',
      'A312V',
      'P1622T',
      'G2019S',
      'H115P',
      'I1192M',
      'C1313*',
    ]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('groups variants ranked at or above G2019S, within WT range and below 0.5', () => {
    const groups = rankVariants(RANKING_FIXTURE.variants).map((r) => [r.variant.variant, r.group]);

    expect(groups).toEqual([
      ['Y1699C', 'above_reference'],
      ['A312V', 'above_reference'],
      ['G2019S', 'above_reference'],
      ['P1622T', 'wt_range'],
      ['H115P', 'wt_range'],
      ['I1192M', 'reduced'],
      ['C1313*', 'reduced'],
    ]);
  });

  it('skips variants without a mean', () => {
    const missing = { ...screenVariant('X1X', 1), mean: null };

    expect(rankVariants([missing, screenVariant('G2019S', 1.4)]).length).toBe(1);
  });
});
