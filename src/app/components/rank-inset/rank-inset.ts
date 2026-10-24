import { Component, computed, inject, input } from '@angular/core';
import { PlotlyComponent } from 'angular-plotly.js';
import type { Data, Layout } from 'plotly.js-dist-min';
import { RankedVariant } from '../../models/activity';
import { baseLayout, ChartPalette, Figure } from '../../models/chart-theme';
import { ChartExport } from '../../services/chart-export';
import { Theme } from '../../services/theme';

type AnnotationSpec = NonNullable<Layout['annotations']>[number];
type ShapeSpec = NonNullable<Layout['shapes']>[number];

/**
 * A horizontal reference line drawn across the inset.
 */
export interface InsetLine {
  y: number;
  color: string;
}

/**
 * Zoomed view of the ranked activity plot between two activity values, with rotated variant labels.
 */
@Component({
  imports: [PlotlyComponent],
  selector: 'app-rank-inset',
  styleUrl: './rank-inset.scss',
  templateUrl: './rank-inset.html',
})
export class RankInset {
  private readonly theme = inject(Theme);
  private readonly chartExport = inject(ChartExport);

  readonly title = input.required<string>();
  readonly ranked = input.required<RankedVariant[]>();
  readonly yMin = input.required<number>();
  readonly yMax = input.required<number>();
  readonly lines = input<InsetLine[]>([]);
  readonly filename = input('lrrk2-rank-inset');

  protected readonly points = computed(() =>
    this.ranked().filter((r) => r.mean >= this.yMin() && r.mean <= this.yMax()),
  );

  protected readonly config = computed(() =>
    this.chartExport.config(
      this.filename(),
      (palette) => this.buildFigure(palette),
      ['select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d'],
      { displayModeBar: 'hover' },
    ),
  );

  protected readonly figure = computed(() => this.buildFigure(this.theme.palette()));

  private buildFigure(palette: ChartPalette): Figure | null {
    const points = this.points();
    if (points.length === 0) {
      return null;
    }
    const first = points[0].rank;
    const last = points[points.length - 1].rank;
    const span = this.yMax() - this.yMin();
    const data: Data[] = [
      {
        type: 'scatter',
        mode: 'markers',
        x: points.map((p) => p.rank),
        y: points.map((p) => p.mean),
        marker: {
          size: 8,
          color: points.map((p) => palette.group[p.group]),
          line: { color: palette.markerOutline, width: 0.75 },
        },
        customdata: points.map((p) => [p.variant.variant, p.variant.domain ?? '–', p.rank]),
        hovertemplate:
          '<b>%{customdata[0]}</b> · %{customdata[1]}<br>rank %{customdata[2]} · %{y:.2f}<extra></extra>',
      },
    ];
    const labels: AnnotationSpec[] = points.map((p) => ({
      x: p.rank,
      y: p.mean,
      text: p.variant.variant,
      textangle: -45,
      xanchor: 'left',
      yanchor: 'bottom',
      xshift: 2,
      yshift: 4,
      showarrow: false,
      font: { size: 10, color: palette.ink },
    }));
    const lines: ShapeSpec[] = this.lines().map((line) => ({
      type: 'line',
      xref: 'paper',
      x0: 0,
      x1: 1,
      y0: line.y,
      y1: line.y,
      line: { color: line.color, width: 1, dash: 'dot' },
      layer: 'below',
    }));
    const layout: Partial<Layout> = {
      height: 240,
      margin: { l: 44, r: 12, t: 28, b: 16 },
      ...baseLayout(palette),
      showlegend: false,
      hovermode: 'closest',
      title: {
        text: this.title(),
        x: 0.02,
        xanchor: 'left',
        y: 0.97,
        font: { size: 11, color: palette.muted },
      },
      xaxis: { range: [first - 1, last + 2.5], visible: false },
      yaxis: {
        range: [this.yMin() - span * 0.1, this.yMax() + span * 0.45],
        tickfont: { color: palette.muted, size: 10 },
        showgrid: false,
        zeroline: false,
        showline: true,
        linecolor: palette.axis,
        ticks: 'outside',
      },
      annotations: labels,
      shapes: lines,
    };
    return { data, layout };
  }
}
