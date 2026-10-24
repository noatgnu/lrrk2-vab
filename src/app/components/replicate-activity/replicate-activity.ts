import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Router } from '@angular/router';
import { PlotlyComponent } from 'angular-plotly.js';
import type { Data, Layout, Shape } from 'plotly.js-dist-min';
import { baseLayout, ChartPalette, Figure } from '../../models/chart-theme';
import { ChartExport } from '../../services/chart-export';
import { ReplicateControl, ReplicateData, ReplicateVariant } from '../../models/lrrk2';
import { Lrrk2Data } from '../../services/lrrk2-data';
import { Theme } from '../../services/theme';

type SortMode = 'sequence' | 'activity';

type AnnotationSpec = NonNullable<Layout['annotations']>[number];

/**
 * A single column of the replicate plot: a control or a variant, with the group it is coloured by.
 */
interface Column {
  label: string;
  group: string;
  record: ReplicateControl | ReplicateVariant;
}

const CONTROLS_GROUP = 'Controls';
const DOUBLES_GROUP = 'Double mutants';
const JITTER = [-0.18, 0, 0.18];

/**
 * pT73-RAB10/total RAB10 for each activating variant, with mean ± SD bars and individual replicates.
 */
@Component({
  imports: [PlotlyComponent, MatButtonToggleModule],
  selector: 'app-replicate-activity',
  styleUrl: './replicate-activity.scss',
  templateUrl: './replicate-activity.html',
})
export class ReplicateActivity {
  private readonly data = inject(Lrrk2Data);
  private readonly router = inject(Router);
  private readonly theme = inject(Theme);
  private readonly chartExport = inject(ChartExport);

  readonly domain = input<string | undefined>();

  protected readonly sortMode = signal<SortMode>('sequence');
  protected readonly loading = this.data.replicates.isLoading;
  protected readonly failed = this.data.replicates.error;

  protected readonly domains = computed(() => {
    if (!this.data.replicates.hasValue()) {
      return [];
    }
    const names = this.data.replicates
      .value()
      .variants.map((v) => v.domain)
      .filter((d): d is string => d !== null);
    return [...new Set(names)];
  });

  protected readonly config = this.chartExport.config('lrrk2-replicate-activity', (palette) =>
    this.buildFigure(palette),
  );

  protected readonly figure = computed(() => this.buildFigure(this.theme.palette()));

  /**
   * Updates the domain filter through the URL so the focused view can be linked to.
   */
  protected setDomain(domain: string | undefined): void {
    this.router.navigate([], {
      queryParams: { domain: domain ?? null },
      queryParamsHandling: 'merge',
    });
  }

  private columns(value: ReplicateData, mode: SortMode): Column[] {
    const controls = value.controls.map((record) => ({
      label: record.variant,
      group: CONTROLS_GROUP,
      record,
    }));
    const variants = value.variants.map((record) => ({
      label: record.variant,
      group: record.domain ?? DOUBLES_GROUP,
      record,
    }));
    if (mode === 'activity') {
      variants.sort((a, b) => (b.record.mean ?? 0) - (a.record.mean ?? 0));
    }
    return [...controls, ...variants];
  }

  private colorFor(group: string, palette: ChartPalette): string {
    return palette.domain[group] ?? palette.control;
  }

  private dimmed(group: string, focus: string | undefined): boolean {
    return focus !== undefined && group !== focus;
  }

  private barTrace(columns: Column[], focus: string | undefined, palette: ChartPalette): Data {
    const shown = columns.filter((c) => c.record.mean !== null);
    return {
      type: 'bar',
      name: 'Mean ± SD',
      x: shown.map((c) => columns.indexOf(c)),
      y: shown.map((c) => c.record.mean),
      error_y: {
        type: 'data',
        array: shown.map((c) => c.record.sd ?? 0),
        color: palette.ink,
        thickness: 1,
        width: 3,
      },
      marker: {
        color: palette.barFill,
        opacity: shown.map((c) => (this.dimmed(c.group, focus) ? 0.35 : 1)),
        line: { color: palette.barOutline, width: 0.75 },
      },
      customdata: shown.map((c) => [
        c.label,
        c.group,
        c.record.mean?.toFixed(2),
        c.record.sd?.toFixed(2) ?? '–',
        c.record.replicates.length,
      ]),
      hovertemplate:
        '<b>%{customdata[0]}</b> · %{customdata[1]}<br>' +
        'mean %{customdata[2]} ± %{customdata[3]} (n=%{customdata[4]})<extra></extra>',
    } as Data;
  }

  private replicateTrace(
    columns: Column[],
    group: string,
    focus: string | undefined,
    palette: ChartPalette,
  ): Data {
    const x: number[] = [];
    const y: number[] = [];
    const customdata: (string | number)[][] = [];
    columns.forEach((column, index) => {
      if (column.group !== group) {
        return;
      }
      column.record.replicates.forEach((value, r) => {
        x.push(index + JITTER[r % JITTER.length]);
        y.push(value);
        customdata.push([column.label, r + 1, value.toFixed(2)]);
      });
    });
    return {
      type: 'scatter',
      mode: 'markers',
      name: group,
      x,
      y,
      customdata,
      opacity: this.dimmed(group, focus) ? 0.2 : 1,
      marker: {
        color: this.colorFor(group, palette),
        symbol: group === DOUBLES_GROUP ? 'diamond' : 'circle',
        size: 7,
        line: { color: palette.markerOutline, width: 0.75 },
      },
      hovertemplate:
        '<b>%{customdata[0]}</b><br>replicate %{customdata[1]}: %{customdata[2]}<extra></extra>',
    };
  }

  private wtReference(palette: ChartPalette): Partial<Shape> {
    return {
      type: 'line',
      xref: 'paper',
      x0: 0,
      x1: 1,
      y0: 1,
      y1: 1,
      line: { color: palette.muted, width: 1, dash: 'dot' },
      layer: 'below',
    };
  }

  private domainBands(
    columns: Column[],
    palette: ChartPalette,
  ): { shapes: Partial<Shape>[]; annotations: AnnotationSpec[] } {
    const runs: { group: string; start: number; end: number }[] = [];
    columns.forEach((column, index) => {
      if (!palette.domain[column.group]) {
        return;
      }
      const last = runs[runs.length - 1];
      if (last && last.group === column.group && last.end === index - 1) {
        last.end = index;
      } else {
        runs.push({ group: column.group, start: index, end: index });
      }
    });
    const banded = runs.filter((run) => this.sortMode() === 'sequence' || run.end > run.start);
    return {
      shapes: banded.map((run) => ({
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: run.start - 0.4,
        x1: run.end + 0.4,
        y0: 1.03,
        y1: 1.03,
        line: { color: palette.domain[run.group], width: 3 },
      })),
      annotations: banded.map((run) => ({
        xref: 'x',
        yref: 'paper',
        x: (run.start + run.end) / 2,
        y: 1.05,
        yanchor: 'bottom',
        text: `<b>${run.group}</b>`,
        showarrow: false,
        font: { size: 11, color: palette.domainInk[run.group] },
      })),
    };
  }

  private buildFigure(palette: ChartPalette): Figure | null {
    if (!this.data.replicates.hasValue()) {
      return null;
    }
    const value = this.data.replicates.value();
    const columns = this.columns(value, this.sortMode());
    const focus = this.domain();
    const groups = [...new Set(columns.map((c) => c.group))];
    const bands = this.domainBands(columns, palette);
    const data: Data[] = [
      this.barTrace(columns, focus, palette),
      ...groups.map((group) => this.replicateTrace(columns, group, focus, palette)),
    ];
    const layout: Partial<Layout> = {
      height: 520,
      margin: { l: 64, r: 16, t: 80, b: 96 },
      ...baseLayout(palette),
      bargap: 0.35,
      hovermode: 'closest',
      showlegend: true,
      legend: { orientation: 'h', x: 0, y: -0.28, font: { size: 11 } },
      xaxis: {
        tickmode: 'array',
        tickvals: columns.map((_, i) => i),
        ticktext: columns.map((c) => c.label),
        tickangle: -90,
        tickfont: { size: 10 },
        range: [-0.7, columns.length - 0.3],
        showgrid: false,
        zeroline: false,
        linecolor: palette.axis,
      },
      yaxis: {
        title: { text: value.measure, font: { size: 11 } },
        rangemode: 'tozero',
        gridcolor: palette.grid,
        zeroline: false,
        linecolor: palette.axis,
        tickfont: { color: palette.muted },
      },
      shapes: [this.wtReference(palette), ...bands.shapes],
      annotations: bands.annotations,
    };
    return { data, layout };
  }
}
