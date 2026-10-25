import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { PlotlyComponent } from 'angular-plotly.js';
import { DomainFocusChip } from '../../components/domain-focus-chip/domain-focus-chip';
import { DomainMap } from '../../components/domain-map/domain-map';
import { ReplicateActivity } from '../../components/replicate-activity/replicate-activity';
import { StructureExplorer } from '../../components/structure-explorer/structure-explorer';
import { StructureViewer } from '../../components/structure-viewer/structure-viewer';
import { flushIndex, REPLICATES_URL, SCREEN_URL } from '../../testing/data-requests';
import { REPLICATE_FIXTURE, SCREEN_FIXTURE } from '../../testing/fixtures';
import { PlotlyStub } from '../../testing/plotly-stub';
import { StructureViewerStub } from '../../testing/structure-viewer-stub';
import { ActivatingVariants } from './activating-variants';

describe('ActivatingVariants', () => {
  let component: ActivatingVariants;
  let fixture: ComponentFixture<ActivatingVariants>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivatingVariants],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
      .overrideComponent(DomainMap, {
        remove: { imports: [PlotlyComponent] },
        add: { imports: [PlotlyStub] },
      })
      .overrideComponent(ReplicateActivity, {
        remove: { imports: [PlotlyComponent] },
        add: { imports: [PlotlyStub] },
      })
      .overrideComponent(StructureExplorer, {
        remove: { imports: [StructureViewer] },
        add: { imports: [StructureViewerStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ActivatingVariants);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('domain', 'KIN');
    fixture.componentRef.setInput('set', 'all');
    fixture.componentRef.setInput('variant', 'G2019S');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('stacks the domain map, structure and replicate plot and shares the URL state with them', () => {
    const map = fixture.debugElement.query(By.directive(DomainMap)).componentInstance as DomainMap;
    const structure = fixture.debugElement.query(By.directive(StructureExplorer))
      .componentInstance as StructureExplorer;
    const replicates = fixture.debugElement.query(By.directive(ReplicateActivity))
      .componentInstance as ReplicateActivity;
    const order = Array.from(fixture.nativeElement.children as HTMLCollection).map((e) =>
      e.tagName.toLowerCase(),
    );

    expect(order).toEqual([
      'app-introduction',
      'app-domain-map',
      'app-structure-explorer',
      'app-replicate-activity',
    ]);
    expect(map.selected()).toBe('KIN');
    expect(structure.domain()).toBe('KIN');
    expect(structure.set()).toBe('all');
    expect(structure.variant()).toBe('G2019S');
    expect(replicates.domain()).toBe('KIN');
  });

  it('puts a clicked domain into the query string and clears the selected variant', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const map = fixture.debugElement.query(By.directive(DomainMap)).componentInstance as DomainMap;

    map.domainSelected.emit('ROC');

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { domain: 'ROC', variant: null },
      queryParamsHandling: 'merge',
    });
  });

  it('shows a floating chip for the focused domain once the data has loaded', async () => {
    const http = TestBed.inject(HttpTestingController);
    expect(fixture.debugElement.query(By.directive(DomainFocusChip))).toBeNull();

    fixture.componentRef.setInput('domain', 'ROC');
    flushIndex(http);
    http.expectOne(SCREEN_URL).flush(SCREEN_FIXTURE);
    http.expectOne(REPLICATES_URL).flush(REPLICATE_FIXTURE);
    await fixture.whenStable();
    fixture.detectChanges();
    const chip = fixture.debugElement.query(By.directive(DomainFocusChip))
      .componentInstance as DomainFocusChip;

    expect(chip.domain().name).toBe('ROC');
    expect(chip.variantCount()).toBe(1);
  });

  it('clears the domain focus from the chip', async () => {
    const http = TestBed.inject(HttpTestingController);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentRef.setInput('domain', 'ROC');
    flushIndex(http);
    http.expectOne(SCREEN_URL).flush(SCREEN_FIXTURE);
    http.expectOne(REPLICATES_URL).flush(REPLICATE_FIXTURE);
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('app-domain-focus-chip .clear').click();

    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { domain: null },
      queryParamsHandling: 'merge',
    });
  });
});
