export type OutcomeCategory = 'activating' | 'not_activating' | 'discordant';

export interface FunctionalOutcome {
  label: string;
  category: OutcomeCategory;
  screens: number[];
}

export interface Domain {
  name: string;
  start: number;
  end: number;
}

export interface ScreenVariant {
  id: number;
  variant: string;
  residue: number | null;
  residues: number[];
  domain: string | null;
  type: string | null;
  consurf: number | null;
  classification: string | null;
  outcome: FunctionalOutcome;
  mean: number | null;
  sd: number | null;
  n: number | null;
}

export interface ScreenData {
  source: string;
  measure: string;
  length: number;
  domains: Domain[];
  variants: ScreenVariant[];
}

export interface ReplicateControl {
  variant: string;
  replicates: number[];
  mean: number | null;
  sd: number | null;
}

export interface ReplicateVariant extends ReplicateControl {
  residue: number | null;
  residues: number[];
  domain: string | null;
  classification: string | null;
  outcome: FunctionalOutcome | null;
}

export interface ReplicateData {
  measure: string;
  controls: ReplicateControl[];
  variants: ReplicateVariant[];
}

export interface DataVersion {
  id: string;
  label: string | null;
  source: string;
  variants: number;
  replicateSets: number;
  hidden?: boolean;
}

export interface DataIndex {
  latest: string;
  versions: DataVersion[];
}

/**
 * The name a data package is shown under: its label, or its date when it has none.
 */
export function versionName(version: DataVersion): string {
  return version.label ?? version.id;
}
