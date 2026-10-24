import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { PlotlyComponent } from 'angular-plotly.js';
import { REPLICATE_FIXTURE, SCREEN_FIXTURE } from '../../testing/fixtures';
import { flushIndex, REPLICATES_URL, SCREEN_URL } from '../../testing/data-requests';
import { PlotlyStub } from '../../testing/plotly-stub';
import { LIGHT_PALETTE } from '../../models/chart-theme';
import { Theme } from '../../services/theme';
import { DomainMap } from './domain-map';

describe('DomainMap', () => {
  let component: DomainMap;
  let fixture: ComponentFixture<DomainMap>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DomainMap],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
      .overrideComponent(DomainMap, {
        remove: { imports: [PlotlyComponent] },
        add: { imports: [PlotlyStub] },
      })
      .compileComponents();

    localStorage.clear();
    TestBed.inject(Theme).mode.set('light');
    fixture = TestBed.createComponent(DomainMap);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  async function load(): Promise<PlotlyStub> {
    flushIndex(http);
    http.expectOne(SCREEN_URL).flush(SCREEN_FIXTURE);
    http.expectOne(REPLICATES_URL).flush(REPLICATE_FIXTURE);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.debugElement.query(By.directive(PlotlyStub)).componentInstance;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('draws one callout per domain with pathogenic variants emphasised', async () => {
    const plot = await load();
    const annotations = (plot.layout() as { annotations: { name?: string; text: string }[] })
      .annotations;
    const roc = annotations.find((a) => a.name === 'ROC');

    expect(annotations.filter((a) => a.name).length).toBe(SCREEN_FIXTURE.domains.length);
    expect(roc?.text).toContain('<b><i>R1441G</i></b><b>*</b>');
    expect(annotations.find((a) => a.name === 'ARM')?.text).toContain(
      `<span style="color:${LIGHT_PALETTE.subdued}">H230R</span>&nbsp;`,
    );
  });

  it('lists double mutants in a separate box', async () => {
    const plot = await load();
    const annotations = (plot.layout() as { annotations: { text: string }[] }).annotations;

    expect(
      annotations.some((a) => a.text.includes('Double mutants') && a.text.includes('S455P-R1441H')),
    ).toBe(true);
  });

  it('emits the domain of a clicked callout', async () => {
    const plot = await load();
    const selected: string[] = [];
    component.domainSelected.subscribe((domain) => selected.push(domain));

    plot.clickAnnotation.emit({ annotation: { name: 'ROC' } });

    expect(selected).toEqual(['ROC']);
  });

  it('outlines the selected domain callout', async () => {
    fixture.componentRef.setInput('selected', 'ROC');
    const plot = await load();
    const annotations = (
      plot.layout() as { annotations: { name?: string; borderwidth?: number }[] }
    ).annotations;

    expect(annotations.find((a) => a.name === 'ROC')?.borderwidth).toBe(3);
    expect(annotations.find((a) => a.name === 'ARM')?.borderwidth).toBe(1.5);
  });

  it('shows an error message when the data cannot be loaded', async () => {
    flushIndex(http);
    http.expectOne(SCREEN_URL).flush('missing', { status: 404, statusText: 'Not Found' });
    http.expectOne(REPLICATES_URL).flush(REPLICATE_FIXTURE);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not load variant data.');
  });
});
