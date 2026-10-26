import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { StructureViewer } from '../../components/structure-viewer/structure-viewer';
import { LIGHT_PALETTE } from '../../models/chart-theme';
import { Theme } from '../../services/theme';
import { flushIndex, REPLICATES_URL, SCREEN_URL } from '../../testing/data-requests';
import {
  RANKING_FIXTURE,
  REPLICATE_FIXTURE,
  SCREEN_3_FIXTURE,
  SCREEN_FIXTURE,
} from '../../testing/fixtures';
import { StructureViewerStub } from '../../testing/structure-viewer-stub';
import { StructureExplorer } from './structure-explorer';

describe('StructureExplorer', () => {
  let component: StructureExplorer;
  let fixture: ComponentFixture<StructureExplorer>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [StructureExplorer],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
      .overrideComponent(StructureExplorer, {
        remove: { imports: [StructureViewer] },
        add: { imports: [StructureViewerStub] },
      })
      .compileComponents();

    TestBed.inject(Theme).mode.set('light');
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(StructureExplorer);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  async function load(
    inputs: Record<string, string> = {},
    screen = RANKING_FIXTURE,
  ): Promise<StructureViewerStub> {
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    flushIndex(http);
    http.expectOne(SCREEN_URL).flush(screen);
    http.expectOne(REPLICATES_URL).flush(REPLICATE_FIXTURE);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.debugElement.query(By.directive(StructureViewerStub)).componentInstance;
  }

  function listed(): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.variants tbody td.name') as NodeListOf<HTMLElement>,
    ).map((e) => e.textContent?.trim() ?? '');
  }

  function cells(name: string): string[] {
    const row: HTMLElement = fixture.nativeElement.querySelector(`tr[data-variant="${name}"]`);
    return Array.from(row.querySelectorAll('td')).map((td) =>
      (td.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists the replicate-validated variants by default and marks both residues of double mutants', async () => {
    const viewer = await load();

    expect(listed()).toEqual(['H230R', 'R1441G', 'S455P-R1441H']);
    expect(viewer.marked().map((m) => m.residue)).toEqual([230, 1441, 455, 1441]);
    expect(viewer.marked()[0].color).toBe(LIGHT_PALETTE.ink);
  });

  it('lists every screened variant coloured by activity group in the all set', async () => {
    const viewer = await load({ set: 'all' });

    expect(listed()[0]).toBe('Y1699C');
    expect(listed().length).toBe(RANKING_FIXTURE.variants.length);
    expect(viewer.marked()[0].color).toBe(LIGHT_PALETTE.group.above_reference);
  });

  it('focuses the selected variant and keeps the selection in the URL', async () => {
    const viewer = await load({ variant: 'R1441G' });

    expect(viewer.focusResidues()).toEqual([1441]);
    expect(fixture.nativeElement.querySelector('.detail').textContent).toContain('Pathogenic');

    fixture.nativeElement.querySelectorAll('.variants tbody tr')[0].click();
    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { variant: 'H230R', domain: null },
      queryParamsHandling: 'merge',
    });
  });

  it('selects the variant at a residue clicked in 3D', async () => {
    const viewer = await load();

    viewer.residueClicked.emit(230);

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { variant: 'H230R', domain: null },
      queryParamsHandling: 'merge',
    });
  });

  it('shows only the focused domain’s residues, including a double mutant’s residue there', async () => {
    const viewer = await load({ domain: 'ROC' });

    expect(viewer.focusDomain()?.name).toBe('ROC');
    expect(viewer.marked().map((m) => m.residue)).toEqual([1441, 1441]);
  });

  it('counts a double mutant under its domain combination so the panel adds up to the list', async () => {
    await load();
    const rows = Array.from(
      fixture.nativeElement.querySelectorAll('.domains li') as NodeListOf<HTMLElement>,
    ).map((li) => [
      li.querySelector('.link')?.textContent?.trim(),
      li.querySelector('.count')?.textContent?.trim(),
    ]);
    const total = rows.reduce((sum, [, count]) => sum + Number(count), 0);

    expect(cells('S455P-R1441H')[1]).toBe('ARM + ROC');
    expect(rows).toEqual([
      ['ARM', '1'],
      ['ROC', '1'],
      ['ARM + ROC', '1'],
    ]);
    expect(total).toBe(listed().length);
  });

  it('filters the variant list to a domain combination when its name is clicked', async () => {
    await load();
    const combination: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.domains li.combination .link',
    );

    combination.click();
    fixture.detectChanges();

    expect(listed()).toEqual(['S455P-R1441H']);
  });

  it('keeps a double mutant listed until both of its domains are hidden', async () => {
    const viewer = await load();
    const checkboxes = fixture.nativeElement.querySelectorAll('.domains input');

    checkboxes[1].click();
    fixture.detectChanges();
    expect(listed()).toEqual(['H230R', 'S455P-R1441H']);
    expect(viewer.marked().map((m) => m.residue)).toEqual([230, 455]);

    checkboxes[0].click();
    fixture.detectChanges();
    expect(listed()).toEqual([]);
  });

  it('hides a domain’s surface and variants when unchecked', async () => {
    const viewer = await load();
    const arm: HTMLInputElement = fixture.nativeElement.querySelector('.domains input');

    arm.click();
    fixture.detectChanges();

    expect(viewer.hiddenDomains().has('ARM')).toBe(true);
    expect(listed()).toEqual(['R1441G', 'S455P-R1441H']);
  });

  it('lists variants from every screen in the all-screened set', async () => {
    await load({ set: 'all' }, SCREEN_3_FIXTURE);

    expect(listed()).toContain('R1514G');
    expect(fixture.nativeElement.querySelector('app-screen-filter')).toBeNull();
  });

  it('labels the table columns and shows screen and replicate activity side by side', async () => {
    await load({}, SCREEN_FIXTURE);
    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('.variants th') as NodeListOf<HTMLElement>,
    ).map((th) => th.textContent?.trim());

    expect(headers).toEqual(['Variant', 'Domain', 'Screen', 'Replicates']);
    expect(cells('H230R')).toEqual(['H230R', 'ARM', '3.43 (16)', '4.65 (3)']);
    expect(cells('R1441G')).toEqual(['R1441G', 'ROC', '–', '4.10 (3)']);
  });

  it('shows both measurements with SD in the selected variant details', async () => {
    await load({ variant: 'H230R' }, SCREEN_FIXTURE);
    const detail = fixture.nativeElement.querySelector('.detail').textContent.replace(/\s+/g, ' ');

    expect(detail).toContain('Screen 3.43 ± 1.20 (n = 16)');
    expect(detail).toContain('Replicates 4.65 ± 2.70 (n = 3)');
  });

  it('sorts by a column, reverses on a second click and restores the order on a third', async () => {
    await load();
    const header = (label: string): HTMLButtonElement =>
      Array.from(
        fixture.nativeElement.querySelectorAll(
          '.variants th button',
        ) as NodeListOf<HTMLButtonElement>,
      ).find((b) => b.textContent?.includes(label))!;
    const click = (label: string) => {
      header(label).click();
      fixture.detectChanges();
    };

    click('Replicates');
    expect(listed()).toEqual(['S455P-R1441H', 'H230R', 'R1441G']);
    expect(header('Replicates').parentElement?.getAttribute('aria-sort')).toBe('descending');

    click('Replicates');
    expect(listed()).toEqual(['R1441G', 'H230R', 'S455P-R1441H']);

    click('Replicates');
    expect(listed()).toEqual(['H230R', 'R1441G', 'S455P-R1441H']);
    expect(header('Replicates').parentElement?.getAttribute('aria-sort')).toBe('none');
  });
});
