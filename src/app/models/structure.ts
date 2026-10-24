import { ChartPalette } from './chart-theme';
import { Domain } from './lrrk2';

export const STRUCTURE_MODEL = {
  id: 'AF-Q5S007-F1',
  version: 6,
  url: 'structures/AF-Q5S007-F1-model_v6.bcif',
  source: 'https://alphafold.ebi.ac.uk/entry/Q5S007',
  license: 'CC-BY 4.0',
};

/**
 * A residue drawn as spacefill on top of the domain surface, with the colour it is shown in.
 */
export interface MarkedResidue {
  residue: number;
  color: string;
}

/**
 * One item of a PDBe Mol* `visual.select` call.
 */
export interface MolstarSelectionItem {
  auth_seq_id?: number;
  beg_auth_seq_id?: number;
  end_auth_seq_id?: number;
  color?: string;
  opacity?: number;
  representation?: string;
  representationColor?: string;
}

/**
 * Parameters of a PDBe Mol* `visual.select` call.
 */
export interface MolstarSelection {
  data: MolstarSelectionItem[];
  nonSelectedColor?: string;
}

/**
 * The subset of the PDBe Mol* plugin API used by the structure viewer.
 */
export interface PdbeMolstarViewer {
  events: { loadComplete: { subscribe(next: (loaded: boolean) => void): { unsubscribe(): void } } };
  visual: {
    select(params: MolstarSelection): Promise<void>;
    focus(selection: MolstarSelectionItem[]): Promise<void>;
    highlight(params: { data: MolstarSelectionItem[]; color?: string }): Promise<void>;
    clearHighlight(): Promise<void>;
    reset(params: { camera?: boolean }): Promise<void>;
  };
  canvas: { setBgColor(color: string): Promise<void> };
}

/**
 * The `<pdbe-molstar>` custom element once its plugin instance has been created.
 */
export type PdbeMolstarElement = HTMLElement & { viewerInstance?: PdbeMolstarViewer };

/**
 * Detail carried by the `PDB.molstar.click` event dispatched on the `<pdbe-molstar>` element.
 */
export interface MolstarClickEvent extends Event {
  eventData?: { residueNumber?: number; auth_seq_id?: number };
}

export const HIDDEN_DOMAIN_OPACITY = 0.04;
export const FADED_DOMAIN_OPACITY = 0.12;
export const FOCUS_FLANK = 15;

/**
 * Returns the residue range the camera frames for a residue: the residue with `FOCUS_FLANK` residues
 * either side, so the surrounding fold stays in view.
 */
export function focusWindow(residue: number): MolstarSelectionItem {
  return {
    beg_auth_seq_id: Math.max(1, residue - FOCUS_FLANK),
    end_auth_seq_id: residue + FOCUS_FLANK,
  };
}

/**
 * Builds the selection colouring each domain's residue range in its palette colour at the given
 * surface opacity, with the marked residues added as spacefill. Hidden domains are nearly invisible;
 * when a domain is focused, the other domains are faded.
 */
export function buildStructureSelection(
  domains: Domain[],
  hidden: ReadonlySet<string>,
  marked: MarkedResidue[],
  palette: ChartPalette,
  opacity: number,
  focused?: string,
): MolstarSelection {
  return {
    nonSelectedColor: palette.muted,
    data: [
      ...domains.map((domain) => ({
        beg_auth_seq_id: domain.start,
        end_auth_seq_id: domain.end,
        color: palette.domain[domain.name],
        opacity: hidden.has(domain.name)
          ? HIDDEN_DOMAIN_OPACITY
          : focused && focused !== domain.name
            ? FADED_DOMAIN_OPACITY
            : opacity,
      })),
      ...marked.map((mark) => ({
        auth_seq_id: mark.residue,
        color: mark.color,
        representation: 'spacefill',
        representationColor: mark.color,
      })),
    ],
  };
}
