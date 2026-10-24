import { Component, computed, inject } from '@angular/core';
import { PlotlyComponent } from 'angular-plotly.js';
import type { Data, Layout } from 'plotly.js-dist-min';
import { ACTIVATING_THRESHOLD, REDUCED_THRESHOLD, WT_LEVEL } from '../../models/activity';
import { baseLayout, ChartPalette, Figure } from '../../models/chart-theme';
import { ChartExport } from '../../services/chart-export';
import { tint } from '../../models/domain-style';
import { Domain, ScreenVariant } from '../../models/lrrk2';
import { Lrrk2Data } from '../../services/lrrk2-data';
import { ScreenFilter } from '../../services/screen-filter';
import { ScreenFilterToggle } from '../../components/screen-filter/screen-filter';
import { Theme } from '../../services/theme';

type ShapeSpec = NonNullable<Layout['shapes']>[number];

/**
 * Distribution of variant activity per LRRK2 domain as violins with every variant overlaid.
 */
@Component({
  imports: [PlotlyComponent, ScreenFilterToggle],
  selector: 'app-domain-distribution',
  styleUrl: './domain-distribution.scss',
  templateUrl: './domain-distribution.html',
})
export class DomainDistribution {
  private readonly data = inject(Lrrk2Data);
  private readonly theme = inject(Theme);
  private readonly chartExport = inject(ChartExport);
  private readonly screens = inject(ScreenFilter);

  protected readonly loading = this.data.screen.isLoading;
  protected readonly failed = this.data.screen.error;

  protected readonly config = this.chartExport.config('lrrk2-domain-distribution', (palette) =>
    this.buildFigure(palette),
  );

  protected readonly figure = computed(() => this.buildFigure(this.theme.palette()));

  private violin(domain: Domain, variants: ScreenVariant[], palette: ChartPalette): Data {
    const members = variants.filter((v) => v.domain === domain.name && v.mean !== null);
    const color = palette.domain[domain.name];
    return {
      type: 'violin',
      name: domain.name,
      x: members.map(() => domain.name),
      y: members.map((v) => v.mean as number),
      text: members.map((v) => v.variant),
      spanmode: 'hard',
      points: 'all',
      pointpos: 0,
      jitter: 0.6,
      scalemode: 'width',
      width: 0.8,
      fillcolor: tint(color, 0.35),
      line: { color, width: 1 },
      marker: { color, size: 6, line: { color: palette.markerOutline, width: 0.75 } },
      box: {
        visible: true,
        width: 0.12,
        fillcolor: palette.boxFill,
        line: { color: palette.ink, width: 1 },
      },
      hoveron: 'points',
      hovertemplate: `<b>%{text}</b> · ${domain.name}<br>%{y:.2f}-fold × WT<extra></extra>`,
    } as Data;
  }

  private referenceLines(palette: ChartPalette): ShapeSpec[] {
    const lines = [
      { y: ACTIVATING_THRESHOLD, color: palette.group.above_reference },
      { y: WT_LEVEL, color: palette.muted },
      { y: REDUCED_THRESHOLD, color: palette.muted },
      { y: 0, color: palette.axis },
    ];
    return lines.map((line) => ({
      type: 'line',
      xref: 'paper',
      x0: 0,
      x1: 1,
      y0: line.y,
      y1: line.y,
      line: { color: line.color, width: 1, dash: line.y === 0 ? 'solid' : 'dot' },
      layer: 'below',
    }));
  }

  private buildFigure(palette: ChartPalette): Figure | null {
    if (!this.data.screen.hasValue()) {
      return null;
    }
    const screen = this.data.screen.value();
    const variants = this.screens.apply(screen.variants);
    const data: Data[] = screen.domains.map((domain) => this.violin(domain, variants, palette));
    const maxMean = Math.max(...variants.map((v) => v.mean ?? 0));
    const layout: Partial<Layout> = {
      height: 520,
      margin: { l: 56, r: 16, t: 16, b: 40 },
      ...baseLayout(palette),
      showlegend: false,
      hovermode: 'closest',
      violingap: 0.25,
      xaxis: { showgrid: false, zeroline: false, showline: true, linecolor: palette.axis },
      yaxis: {
        title: { text: 'pThr73-Rab10 (fold-change vs WT)' },
        range: [-0.3, Math.ceil(maxMean + 1)],
        tickvals: [0, 1, 2, 4, 6, 8],
        tickfont: { color: palette.muted },
        showgrid: false,
        zeroline: false,
        showline: true,
        linecolor: palette.axis,
      },
      shapes: this.referenceLines(palette),
    };
    return { data, layout };
  }
}
