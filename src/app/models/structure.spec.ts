import { DARK_PALETTE, LIGHT_PALETTE } from './chart-theme';
import { Domain } from './lrrk2';
import {
  buildStructureSelection,
  FADED_DOMAIN_OPACITY,
  FOCUS_FLANK,
  focusWindow,
  HIDDEN_DOMAIN_OPACITY,
} from './structure';

const DOMAINS: Domain[] = [
  { name: 'ROC', start: 1335, end: 1511 },
  { name: 'KIN', start: 1879, end: 2142 },
];

describe('buildStructureSelection', () => {
  it('colours each domain range and adds marked residues as spacefill', () => {
    const selection = buildStructureSelection(
      DOMAINS,
      new Set(),
      [{ residue: 2019, color: '#000000' }],
      LIGHT_PALETTE,
      0.5,
    );

    expect(selection.nonSelectedColor).toBe(LIGHT_PALETTE.muted);
    expect(selection.data).toEqual([
      {
        beg_auth_seq_id: 1335,
        end_auth_seq_id: 1511,
        color: LIGHT_PALETTE.domain['ROC'],
        opacity: 0.5,
      },
      {
        beg_auth_seq_id: 1879,
        end_auth_seq_id: 2142,
        color: LIGHT_PALETTE.domain['KIN'],
        opacity: 0.5,
      },
      {
        auth_seq_id: 2019,
        color: '#000000',
        representation: 'spacefill',
        representationColor: '#000000',
      },
    ]);
  });

  it('nearly hides hidden domains and fades unfocused ones', () => {
    const hidden = buildStructureSelection(DOMAINS, new Set(['ROC']), [], DARK_PALETTE, 0.5);
    const focused = buildStructureSelection(DOMAINS, new Set(), [], DARK_PALETTE, 0.5, 'KIN');

    expect(hidden.data.map((d) => d.opacity)).toEqual([HIDDEN_DOMAIN_OPACITY, 0.5]);
    expect(focused.data.map((d) => d.opacity)).toEqual([FADED_DOMAIN_OPACITY, 0.5]);
    expect(focused.data[1].color).toBe(DARK_PALETTE.domain['KIN']);
  });
});

describe('focusWindow', () => {
  it('frames the residue with flanking residues, clamped at the N-terminus', () => {
    expect(focusWindow(2019)).toEqual({
      beg_auth_seq_id: 2019 - FOCUS_FLANK,
      end_auth_seq_id: 2019 + FOCUS_FLANK,
    });
    expect(focusWindow(3).beg_auth_seq_id).toBe(1);
  });
});
