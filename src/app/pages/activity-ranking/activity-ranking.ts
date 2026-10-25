import { Component, computed, inject } from '@angular/core';
import { PlotlyComponent } from 'angular-plotly.js';
import type { Data, Layout } from 'plotly.js-dist-min';
import { InsetLine, RankInset } from '../../components/rank-inset/rank-inset';
import { ScreenFilterToggle } from '../../components/screen-filter/screen-filter';
import {
  ACTIVATING_THRESHOLD,
  ActivityGroup,
  rankVariants,
  RankedVariant,
  REDUCED_THRESHOLD,
  REFERENCE_VARIANT,
  WT_LEVEL,
} from '../../models/activity';
import { baseLayout, ChartPalette, Figure } from '../../models/chart-theme';
import { ChartExport } from '../../services/chart-export';
import { Lrrk2Data } from '../../services/lrrk2-data';
import { ScreenFilter } from '../../services/screen-filter';
import { Theme } from '../../services/theme';

type AnnotationSpec = NonNullable<Layout['annotations']>[number];
type ShapeSpec = NonNullable<Layout['shapes']>[number];

/**
 * A zoom window of the ranked plot, shown as a dashed box on the main plot and as an inset panel.
 */
interface InsetWindow {
  title: string;
  yMin: number;
  yMax: number;
}

const INSET_1: InsetWindow = { title: 'Insert 1', yMin: 1.4, yMax: 1.56 };
const INSET_2: InsetWindow = { title: 'Insert 2', yMin: 0.42, yMax: 0.56 };
const LABELLED = 18;
const FIRST_COLUMN = 6;
const GROUP_NAMES: Record<ActivityGroup, string> = {
  above_reference: `≥ p.${REFERENCE_VARIANT}`,
  wt_range: 'Within / around WT range',
  reduced: `< ${REDUCED_THRESHOLD}-fold × WT`,
};

/**
 * Ranked activity of all screened variants with zoomed inserts around the 1.5-fold and
 * 0.5-fold thresholds.
 */
@Component({
  imports: [PlotlyComponent, RankInset, ScreenFilterToggle],
  selector: 'app-activity-ranking',
  styleUrl: './activity-ranking.scss',
  templateUrl: './activity-ranking.html',
})
export class ActivityRanking {
  private readonly data = inject(Lrrk2Data);
  private readonly theme = inject(Theme);
  private readonly chartExport = inject(ChartExport);
  private readonly screens = inject(ScreenFilter);

  protected readonly loading = this.data.screen.isLoading;
  protected readonly failed = this.data.screen.error;
  protected readonly inset1 = INSET_1;
  protected readonly inset2 = INSET_2;

  protected readonly ranked = computed(() =>
    this.data.screen.hasValue()
      ? rankVariants(this.screens.apply(this.data.screen.value().variants))
      : [],
  );

  protected readonly reference = computed(() =>
    this.ranked().find((r) => r.variant.variant === REFERENCE_VARIANT),
  );

  protected readonly inset1Lines = computed<InsetLine[]>(() => {
    const palette = this.theme.palette();
    const reference = this.reference();
    return [
      { y: ACTIVATING_THRESHOLD, color: palette.group.above_reference },
      ...(reference ? [{ y: reference.mean, color: palette.muted }] : []),
    ];
  });

  protected readonly inset2Lines = computed<InsetLine[]>(() => [
    { y: REDUCED_THRESHOLD, color: this.theme.palette().muted },
  ]);

  protected readonly config = this.chartExport.config('lrrk2-activity-ranking', (palette) =>
    this.buildFigure(palette),
  );

  protected readonly figure = computed(() => this.buildFigure(this.theme.palette()));

  private groupTrace(ranked: RankedVariant[], group: ActivityGroup, palette: ChartPalette): Data {
    const members = ranked.filter((r) => r.group === group);
    return {
      type: 'scatter',
      mode: 'markers',
      name: `${GROUP_NAMES[group]} (${members.length})`,
      x: members.map((r) => r.rank),
      y: members.map((r) => r.mean),
      marker: {
        size: 6,
        color: palette.group[group],
        line: { color: palette.markerOutline, width: 0.5 },
      },
      customdata: members.map((r) => [
        r.variant.variant,
        r.variant.domain ?? '–',
        r.variant.sd?.toFixed(2) ?? '–',
        r.variant.n ?? '–',
        r.variant.classification ?? 'not classified',
        r.rank,
      ]),
      hovertemplate:
        '<b>%{customdata[0]}</b> · %{customdata[1]}<br>' +
        'rank %{customdata[5]} · %{y:.2f} ± %{customdata[2]} (n=%{customdata[3]})<br>' +
        'MDSGene: %{customdata[4]}<extra></extra>',
    };
  }

  private thresholdLines(palette: ChartPalette): ShapeSpec[] {
    const lines = [
      { y: ACTIVATING_THRESHOLD, color: palette.group.above_reference },
      { y: WT_LEVEL, color: palette.ink },
      { y: REDUCED_THRESHOLD, color: palette.ink },
    ];
    return lines.map((line) => ({
      type: 'line',
      xref: 'paper',
      x0: 0,
      x1: 1,
      y0: line.y,
      y1: line.y,
      line: { color: line.color, width: 1, dash: 'dot' },
      layer: 'below',
    }));
  }

  private thresholdLabels(palette: ChartPalette): AnnotationSpec[] {
    return [ACTIVATING_THRESHOLD, WT_LEVEL, REDUCED_THRESHOLD].map((y) => ({
      xref: 'paper',
      x: 0.005,
      y,
      xanchor: 'left',
      yanchor: 'bottom',
      text: `${y}-fold × WT`,
      showarrow: false,
      font: { size: 10, color: palette.muted },
    }));
  }

  private variantLabels(ranked: RankedVariant[], palette: ChartPalette): AnnotationSpec[] {
    const top = ranked.slice(0, LABELLED);
    const firstStart = top[0]?.mean ?? 0;
    const secondStart = (top[FIRST_COLUMN]?.mean ?? 0) + 0.85;
    return top.map((r, i) => {
      const first = i < FIRST_COLUMN;
      return {
        x: r.rank,
        y: r.mean,
        axref: 'x',
        ayref: 'y',
        ax: first ? (i === 0 ? r.rank + 3 : 9) : 30,
        ay: first ? firstStart - i * 0.28 : secondStart - (i - FIRST_COLUMN) * 0.19,
        xanchor: 'left',
        text: r.variant.variant,
        showarrow: true,
        arrowhead: 0,
        arrowwidth: 0.75,
        arrowcolor: palette.muted,
        standoff: 3,
        font: { size: 10, color: palette.groupInk.above_reference },
      };
    });
  }

  private groupLabels(
    ranked: RankedVariant[],
    maxMean: number,
    palette: ChartPalette,
  ): AnnotationSpec[] {
    const count = (group: ActivityGroup) => ranked.filter((r) => r.group === group).length;
    const activating = ranked.filter((r) => r.mean >= ACTIVATING_THRESHOLD).length;
    return [
      {
        xref: 'paper',
        x: 0.18,
        y: maxMean,
        xanchor: 'left',
        yanchor: 'top',
        align: 'left',
        showarrow: false,
        text:
          `<b>${count('above_reference')} variants with activity ≥ p.${REFERENCE_VARIANT}</b><br>` +
          `<span style="color:${palette.ink}">(${activating} ≥ ${ACTIVATING_THRESHOLD}-fold × WT)</span>`,
        font: { size: 13, color: palette.groupInk.above_reference },
      },
      {
        xref: 'paper',
        x: 0.62,
        y: ACTIVATING_THRESHOLD + 0.9,
        xanchor: 'center',
        showarrow: false,
        text: `<b>${count('wt_range')} variants with activity within / around WT range</b>`,
        font: { size: 13, color: palette.groupInk.wt_range },
      },
      {
        xref: 'paper',
        x: 0.99,
        y: WT_LEVEL + 0.45,
        xanchor: 'right',
        align: 'right',
        showarrow: false,
        text: `<b>${count('reduced')} variants<br>with reduced activity</b>`,
        font: { size: 13, color: palette.groupInk.reduced },
      },
    ];
  }

  private insetRanks(ranked: RankedVariant[], window: InsetWindow): [number, number] | null {
    const inside = ranked.filter((r) => r.mean >= window.yMin && r.mean <= window.yMax);
    return inside.length ? [inside[0].rank, inside[inside.length - 1].rank] : null;
  }

  private insetBoxes(ranked: RankedVariant[], palette: ChartPalette): ShapeSpec[] {
    return [INSET_1, INSET_2].flatMap((window) => {
      const ranks = this.insetRanks(ranked, window);
      return ranks
        ? [
            {
              type: 'rect',
              x0: ranks[0] - 1,
              x1: ranks[1] + 1,
              y0: window.yMin,
              y1: window.yMax,
              line: { color: palette.secondary, width: 1 },
            } as ShapeSpec,
          ]
        : [];
    });
  }

  private insetLabels(ranked: RankedVariant[], palette: ChartPalette): AnnotationSpec[] {
    return [INSET_1, INSET_2].flatMap((window, i) => {
      const ranks = this.insetRanks(ranked, window);
      return ranks
        ? [
            {
              x: i === 0 ? ranks[1] + 2 : ranks[0] - 2,
              y: i === 0 ? window.yMax : window.yMin,
              xanchor: i === 0 ? 'left' : 'right',
              yanchor: i === 0 ? 'bottom' : 'top',
              text: window.title,
              showarrow: false,
              font: { size: 10, color: palette.secondary },
            } as AnnotationSpec,
          ]
        : [];
    });
  }

  private buildFigure(palette: ChartPalette): Figure | null {
    const ranked = this.ranked();
    if (ranked.length === 0) {
      return null;
    }
    const groups: ActivityGroup[] = ['above_reference', 'wt_range', 'reduced'];
    const data: Data[] = groups.map((group) => this.groupTrace(ranked, group, palette));
    const maxMean = Math.max(...ranked.map((r) => r.mean));
    const layout: Partial<Layout> = {
      height: 460,
      margin: { l: 56, r: 16, t: 16, b: 48 },
      ...baseLayout(palette),
      hovermode: 'closest',
      showlegend: true,
      legend: { x: 0.99, xanchor: 'right', y: 0.99, font: { size: 11 } },
      xaxis: {
        title: { text: 'LRRK2 variants (ranked by kinase activity)' },
        range: [-2, ranked.length + 4],
        tickvals: Array.from({ length: Math.ceil(ranked.length / 10) }, (_, i) => i * 10 + 1),
        tickfont: { size: 10, color: palette.muted },
        showgrid: false,
        zeroline: false,
        showline: true,
        linecolor: '#c3c2b7',
      },
      yaxis: {
        title: { text: 'pThr73-Rab10 (fold-change vs WT)' },
        range: [0, Math.ceil(maxMean + 0.5)],
        tickfont: { color: palette.muted },
        showgrid: false,
        zeroline: false,
        showline: true,
        linecolor: '#c3c2b7',
      },
      shapes: [...this.thresholdLines(palette), ...this.insetBoxes(ranked, palette)],
      annotations: [
        ...this.thresholdLabels(palette),
        ...this.variantLabels(ranked, palette),
        ...this.groupLabels(ranked, maxMean, palette),
        ...this.insetLabels(ranked, palette),
      ],
    };
    return { data, layout };
  }
}
