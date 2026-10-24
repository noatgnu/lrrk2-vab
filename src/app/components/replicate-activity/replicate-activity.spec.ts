import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { PlotlyComponent } from 'angular-plotly.js';
import { REPLICATE_FIXTURE } from '../../testing/fixtures';
import { flushIndex, REPLICATES_URL } from '../../testing/data-requests';
import { PlotlyStub } from '../../testing/plotly-stub';
import { DARK_PALETTE } from '../../models/chart-theme';
import { Theme } from '../../services/theme';
import { ReplicateActivity } from './replicate-activity';

interface Trace {
  name: string;
  y: number[];
  opacity?: number;
  marker: { color: string };
}

interface Axis {
  ticktext: string[];
}

describe('ReplicateActivity', () => {
  let component: ReplicateActivity;
  let fixture: ComponentFixture<ReplicateActivity>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReplicateActivity],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
      .overrideComponent(ReplicateActivity, {
        remove: { imports: [PlotlyComponent] },
        add: { imports: [PlotlyStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ReplicateActivity);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  async function load(): Promise<PlotlyStub> {
    flushIndex(http);
    http.expectOne(REPLICATES_URL).flush(REPLICATE_FIXTURE);
    await Promise.resolve();
    fixture.detectChanges();
    return fixture.debugElement.query(By.directive(PlotlyStub)).componentInstance;
  }

  function ticks(plot: PlotlyStub): string[] {
    return (plot.layout() as { xaxis: Axis }).xaxis.ticktext;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('places controls first and variants in sequence order', async () => {
    const plot = await load();

    expect(ticks(plot)).toEqual(['WT', 'NT', 'H230R', 'R1441G', 'S455P-R1441H']);
  });

  it('omits bars for controls without replicates', async () => {
    const plot = await load();
    const bar = (plot.data() as Trace[])[0];

    expect(bar.y).toEqual([1.0, 4.65, 4.1, 7.0]);
  });

  it('ranks variants by mean when requested', async () => {
    const plot = await load();
    fixture.debugElement.queryAll(By.css('mat-button-toggle button'))[1].nativeElement.click();
    fixture.detectChanges();

    expect(ticks(plot)).toEqual(['WT', 'NT', 'S455P-R1441H', 'H230R', 'R1441G']);
  });

  it('dims replicate groups outside the highlighted domain', async () => {
    fixture.componentRef.setInput('domain', 'ROC');
    const plot = await load();
    const traces = plot.data() as Trace[];

    expect(traces.find((t) => t.name === 'ROC')?.opacity).toBe(1);
    expect(traces.find((t) => t.name === 'ARM')?.opacity).toBeLessThan(1);
  });

  it('redraws with the dark palette when the theme changes', async () => {
    const plot = await load();
    TestBed.inject(Theme).mode.set('dark');
    fixture.detectChanges();
    const traces = plot.data() as Trace[];
    const layout = plot.layout() as { font: { color: string } };

    expect(layout.font.color).toBe(DARK_PALETTE.ink);
    expect(traces.find((t) => t.name === 'ARM')?.marker.color).toBe(DARK_PALETTE.domain['ARM']);
  });
});
