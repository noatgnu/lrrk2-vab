import { ReplicateData, ScreenData, ScreenVariant } from '../models/lrrk2';

export const SCREEN_FIXTURE: ScreenData = {
  source: 'fixture.xlsx',
  measure: 'pRAB10/RAB10 (mean relative to WT)',
  length: 2527,
  domains: [
    { name: 'ARM', start: 1, end: 705 },
    { name: 'ROC', start: 1335, end: 1511 },
  ],
  variants: [
    {
      id: 1,
      variant: 'H230R',
      residue: 230,
      residues: [230],
      domain: 'ARM',
      type: 'missense',
      consurf: 5,
      classification: 'VUS',
      outcome: { label: 'Activating (screen 2)', category: 'activating', screens: [2] },
      mean: 3.43,
      sd: 1.2,
      n: 16,
    },
  ],
};

export const REPLICATE_FIXTURE: ReplicateData = {
  measure: 'pT73-RAB10 / total RAB10 relative to LRRK2 WT/LRRK2',
  controls: [
    { variant: 'WT', replicates: [0.9, 1.0, 1.1], mean: 1.0, sd: 0.1 },
    { variant: 'NT', replicates: [], mean: null, sd: null },
  ],
  variants: [
    {
      variant: 'H230R',
      replicates: [3.3, 2.9, 7.8],
      mean: 4.65,
      sd: 2.7,
      residue: 230,
      residues: [230],
      domain: 'ARM',
      classification: 'VUS',
      outcome: { label: 'Activating (screen 2)', category: 'activating', screens: [2] },
    },
    {
      variant: 'R1441G',
      replicates: [4.2, 4.0, 4.1],
      mean: 4.1,
      sd: 0.1,
      residue: 1441,
      residues: [1441],
      domain: 'ROC',
      classification: 'Pathogenic',
      outcome: { label: 'Activating (screen 1 & 2)', category: 'activating', screens: [1, 2] },
    },
    {
      variant: 'S455P-R1441H',
      replicates: [6.3, 7.2, 7.6],
      mean: 7.0,
      sd: 0.7,
      residue: 455,
      residues: [455, 1441],
      domain: null,
      classification: null,
      outcome: { label: 'Activating (screen 2)', category: 'activating', screens: [2] },
    },
  ],
};

/**
 * Builds a missense screen variant with the given name, mean activity and domain.
 */
export function screenVariant(
  variant: string,
  mean: number,
  domain: string | null = 'ARM',
  screens: number[] = [2],
): ScreenVariant {
  const residue = Number(variant.replace(/\D/g, '')) || null;
  return {
    id: 0,
    variant,
    residue,
    residues: residue ? [residue] : [],
    domain,
    type: 'missense',
    consurf: null,
    classification: null,
    outcome: {
      label: `Not activating (screen ${screens.join(' & ')})`,
      category: 'not_activating',
      screens,
    },
    mean,
    sd: 0.1,
    n: 3,
  };
}

export const RANKING_FIXTURE: ScreenData = {
  ...SCREEN_FIXTURE,
  variants: [
    screenVariant('Y1699C', 5.5, 'COR-B'),
    screenVariant('A312V', 1.46),
    screenVariant('G2019S', 1.44, 'KIN'),
    screenVariant('P1622T', 1.44, 'COR-A'),
    screenVariant('H115P', 1.0),
    screenVariant('I1192M', 0.48, 'LRR'),
    screenVariant('C1313*', 0, 'LRR'),
  ],
};

export const SCREEN_3_FIXTURE: ScreenData = {
  ...RANKING_FIXTURE,
  variants: [...RANKING_FIXTURE.variants, screenVariant('R1514G', 1.63, 'COR-A', [3])],
};
