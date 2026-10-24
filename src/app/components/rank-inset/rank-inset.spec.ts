import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PlotlyComponent } from 'angular-plotly.js';
import { rankVariants } from '../../models/activity';
import { RANKING_FIXTURE } from '../../testing/fixtures';
import { PlotlyStub } from '../../testing/plotly-stub';
import { RankInset } from './rank-inset';

describe('RankInset', () => {
  let component: RankInset;
  let fixture: ComponentFixture<RankInset>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankInset],
    })
      .overrideComponent(RankInset, {
        remove: { imports: [PlotlyComponent] },
        add: { imports: [PlotlyStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RankInset);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Insert 1');
    fixture.componentRef.setInput('ranked', rankVariants(RANKING_FIXTURE.variants));
    fixture.componentRef.setInput('yMin', 1.4);
    fixture.componentRef.setInput('yMax', 1.56);
    fixture.componentRef.setInput('lines', [{ y: 1.5, color: '#e34948' }]);
    fixture.detectChanges();
  });

  function plot(): PlotlyStub {
    return fixture.debugElement.query(By.directive(PlotlyStub)).componentInstance;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('plots and labels only the variants inside the window', () => {
    const layout = plot().layout() as { annotations: { text: string }[]; shapes: { y0: number }[] };

    expect(layout.annotations.map((a) => a.text)).toEqual(['A312V', 'G2019S', 'P1622T']);
    expect(layout.shapes.map((s) => s.y0)).toEqual([1.5]);
  });

  it('shows a message when no variants fall in the window', () => {
    fixture.componentRef.setInput('yMin', 9);
    fixture.componentRef.setInput('yMax', 10);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No variants in this range.');
  });
});
