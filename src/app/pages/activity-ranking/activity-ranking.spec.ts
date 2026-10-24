import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { PlotlyComponent } from 'angular-plotly.js';
import { RankInset } from '../../components/rank-inset/rank-inset';
import { RANKING_FIXTURE, SCREEN_3_FIXTURE } from '../../testing/fixtures';
import { flushIndex, REPLICATES_URL, SCREEN_URL } from '../../testing/data-requests';
import { PlotlyStub } from '../../testing/plotly-stub';
import { ActivityRanking } from './activity-ranking';

interface Trace {
  name: string;
  x: number[];
}

describe('ActivityRanking', () => {
  let component: ActivityRanking;
  let fixture: ComponentFixture<ActivityRanking>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityRanking],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
      .overrideComponent(ActivityRanking, {
        remove: { imports: [PlotlyComponent] },
        add: { imports: [PlotlyStub] },
      })
      .overrideComponent(RankInset, {
        remove: { imports: [PlotlyComponent] },
        add: { imports: [PlotlyStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ActivityRanking);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  async function load(screen = RANKING_FIXTURE): Promise<PlotlyStub[]> {
    flushIndex(http);
    http.expectOne(SCREEN_URL).flush(screen);
    http.expectOne(REPLICATES_URL);
    await Promise.resolve();
    fixture.detectChanges();
    return fixture.debugElement.queryAll(By.directive(PlotlyStub)).map((d) => d.componentInstance);
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('splits ranked variants into the three activity groups', async () => {
    const [main] = await load();
    const traces = main.data() as Trace[];

    expect(traces.map((t) => t.name)).toEqual([
      '≥ p.G2019S (3)',
      'Within / around WT range (2)',
      '< 0.5-fold × WT (2)',
    ]);
    expect(traces[2].x).toEqual([6, 7]);
  });

  it('summarises group counts in the plot annotations', async () => {
    const [main] = await load();
    const text = (main.layout() as { annotations: { text: string }[] }).annotations
      .map((a) => a.text)
      .join(' ');

    expect(text).toContain('3 variants with activity ≥ p.G2019S');
    expect(text).toContain('(1 ≥ 1.5-fold × WT)');
    expect(text).toContain('2 variants<br>with reduced activity');
  });

  it('renders the main plot and both inserts', async () => {
    const plots = await load();

    expect(plots.length).toBe(3);
    expect(fixture.debugElement.queryAll(By.directive(RankInset)).length).toBe(2);
  });

  it('leaves screen-3 variants out by default and adds them when screen 3 is selected', async () => {
    const [main] = await load(SCREEN_3_FIXTURE);
    const names = () => (main.data() as Trace[]).map((t) => t.name);

    expect(names()[0]).toBe('≥ p.G2019S (3)');

    await TestBed.inject(Router).navigateByUrl('/?screens=1,2,3');
    fixture.detectChanges();

    expect(names()[0]).toBe('≥ p.G2019S (4)');
  });
});
