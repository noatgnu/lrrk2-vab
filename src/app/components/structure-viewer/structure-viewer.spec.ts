import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { LIGHT_PALETTE } from '../../models/chart-theme';
import { MolstarSelection, MolstarSelectionItem, PdbeMolstarViewer } from '../../models/structure';
import { MolstarLoader } from '../../services/molstar-loader';
import { Theme } from '../../services/theme';
import { StructureViewer } from './structure-viewer';

/**
 * Records every call the viewer component makes on the PDBe Mol* plugin.
 */
class FakeViewer implements PdbeMolstarViewer {
  readonly loaded = new Subject<boolean>();
  readonly selections: MolstarSelection[] = [];
  readonly focused: MolstarSelectionItem[][] = [];
  readonly backgrounds: string[] = [];
  resets = 0;
  events = { loadComplete: this.loaded };
  visual = {
    select: async (params: MolstarSelection) => void this.selections.push(params),
    focus: async (selection: MolstarSelectionItem[]) => void this.focused.push(selection),
    highlight: async () => undefined,
    clearHighlight: async () => undefined,
    reset: async () => void this.resets++,
  };
  canvas = { setBgColor: async (color: string) => void this.backgrounds.push(color) };
}

let current: FakeViewer;

if (!customElements.get('pdbe-molstar')) {
  customElements.define(
    'pdbe-molstar',
    class extends HTMLElement {
      readonly viewerInstance = current;
    },
  );
}

describe('StructureViewer', () => {
  let component: StructureViewer;
  let fixture: ComponentFixture<StructureViewer>;

  beforeEach(async () => {
    localStorage.clear();
    current = new FakeViewer();
    await TestBed.configureTestingModule({
      imports: [StructureViewer],
      providers: [{ provide: MolstarLoader, useValue: { load: () => Promise.resolve() } }],
    }).compileComponents();

    TestBed.inject(Theme).mode.set('light');
    fixture = TestBed.createComponent(StructureViewer);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('domains', [{ name: 'KIN', start: 1879, end: 2142 }]);
    fixture.componentRef.setInput('marked', [{ residue: 2019, color: '#000000' }]);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  function element(): HTMLElement {
    return fixture.nativeElement.querySelector('pdbe-molstar');
  }

  async function finishLoading(): Promise<void> {
    current.loaded.next(true);
    await fixture.whenStable();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the AlphaFold model from the bundled binary CIF', () => {
    expect(element().getAttribute('custom-data-url')).toBe('structures/AF-Q5S007-F1-model_v6.bcif');
    expect(element().getAttribute('custom-data-binary')).toBe('true');
  });

  it('colours domains and marks residues once the structure has loaded', async () => {
    expect(current.selections.length).toBe(0);

    await finishLoading();

    const last = current.selections.at(-1)!;
    expect(last.data[0]).toEqual(
      expect.objectContaining({ beg_auth_seq_id: 1879, color: LIGHT_PALETTE.domain['KIN'] }),
    );
    expect(last.data[1]).toEqual(
      expect.objectContaining({ auth_seq_id: 2019, representation: 'spacefill' }),
    );
    expect(current.resets).toBe(1);
    expect(current.backgrounds.length).toBe(1);
  });

  it('focuses on residues, then on a domain', async () => {
    await finishLoading();

    fixture.componentRef.setInput('focusResidues', [2019]);
    await fixture.whenStable();
    fixture.componentRef.setInput('focusResidues', []);
    fixture.componentRef.setInput('focusDomain', { name: 'KIN', start: 1879, end: 2142 });
    await fixture.whenStable();

    expect(current.focused).toEqual([
      [{ beg_auth_seq_id: 2004, end_auth_seq_id: 2034 }],
      [{ beg_auth_seq_id: 1879, end_auth_seq_id: 2142 }],
    ]);
  });

  it('emits the residue number of a residue clicked in 3D', async () => {
    const clicked: number[] = [];
    component.residueClicked.subscribe((residue) => clicked.push(residue));
    const event = Object.assign(new Event('PDB.molstar.click'), {
      eventData: { auth_seq_id: 1441 },
    });

    element().dispatchEvent(event);

    expect(clicked).toEqual([1441]);
  });
});
