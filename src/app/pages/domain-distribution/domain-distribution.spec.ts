import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { PlotlyComponent } from 'angular-plotly.js';
import { SCREEN_3_FIXTURE } from '../../testing/fixtures';
import { flushIndex, REPLICATES_URL, SCREEN_URL } from '../../testing/data-requests';
import { PlotlyStub } from '../../testing/plotly-stub';
import { DomainDistribution } from './domain-distribution';

interface Violin {
  type: string;
  spanmode: string;
  name: string;
  y: number[];
  text: string[];
}

describe('DomainDistribution', () => {
  let component: DomainDistribution;
  let fixture: ComponentFixture<DomainDistribution>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DomainDistribution],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
      .overrideComponent(DomainDistribution, {
        remove: { imports: [PlotlyComponent] },
        add: { imports: [PlotlyStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DomainDistribution);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('draws one violin per domain with that domain’s variants', async () => {
    flushIndex(http);
    http.expectOne(SCREEN_URL).flush(SCREEN_3_FIXTURE);
    http.expectOne(REPLICATES_URL);
    await Promise.resolve();
    fixture.detectChanges();
    const plot: PlotlyStub = fixture.debugElement.query(By.directive(PlotlyStub)).componentInstance;
    const violins = plot.data() as Violin[];

    expect(violins.map((v) => v.name)).toEqual(['ARM', 'ROC']);
    expect(violins.every((v) => v.type === 'violin')).toBe(true);
    expect(violins.every((v) => v.spanmode === 'soft')).toBe(true);
    expect(violins[0].text).toEqual(['A312V', 'H115P']);
    expect(violins.flatMap((v) => v.text)).not.toContain('R1514G');
  });
});
