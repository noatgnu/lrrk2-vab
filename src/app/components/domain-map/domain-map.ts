import { Component, computed, inject, input, output } from '@angular/core';
import { PlotlyComponent } from 'angular-plotly.js';
import type { ClickAnnotationEvent, Data, Layout } from 'plotly.js-dist-min';
import { baseLayout, ChartPalette, Figure } from '../../models/chart-theme';
import { ChartExport } from '../../services/chart-export';
import { PATHOGENIC_CLASSES, tint } from '../../models/domain-style';
import { Domain, ReplicateVariant } from '../../models/lrrk2';
import { Lrrk2Data } from '../../services/lrrk2-data';
import { Theme } from '../../services/theme';

type AnnotationSpec = NonNullable<Layout['annotations']>[number];

/**
 * Callout placement for a domain: which side of the protein bar, the residue the box is centred on,
 * and the vertical pixel offset between the bar and the box.
 */
interface CalloutPlacement {
  side: 'above' | 'below';
  x: number;
  offset: number;
}

const CALLOUTS: Record<string, CalloutPlacement> = {
  ARM: { side: 'above', x: 350, offset: 50 },
  ANK: { side: 'above', x: 752, offset: 30 },
  LRR: { side: 'above', x: 1080, offset: 50 },
  ROC: { side: 'below', x: 1423, offset: 50 },
  'COR-A': { side: 'above', x: 1560, offset: 50 },
  'COR-B': { side: 'above', x: 1790, offset: 80 },
  KIN: { side: 'below', x: 2020, offset: 50 },
  WD40: { side: 'above', x: 2340, offset: 50 },
};

const BAR_HALF_HEIGHT = 0.05;
const LIGHT_DOMAINS = new Set(['LRR', 'COR-A', 'COR-B', 'KIN']);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const ON_LIGHT_FILL = '#0b0b0b';
const ON_DARK_FILL = '#ffffff';

/**
 * LRRK2 domain architecture with callouts listing the activating variants validated in each domain.
 * Clicking a callout emits its domain through `domainSelected`; the `selected` domain's callout is outlined.
 */
@Component({
  imports: [PlotlyComponent],
  selector: 'app-domain-map',
  styleUrl: './domain-map.scss',
  templateUrl: './domain-map.html',
})
export class DomainMap {
  private readonly data = inject(Lrrk2Data);
  private readonly theme = inject(Theme);
  private readonly chartExport = inject(ChartExport);

  readonly selected = input<string | undefined>();
  readonly domainSelected = output<string>();

  protected readonly loading = computed(
    () => this.data.screen.isLoading() || this.data.replicates.isLoading(),
  );
  protected readonly failed = computed(
    () => this.data.screen.error() ?? this.data.replicates.error(),
  );

  protected readonly config = this.chartExport.config(
    'lrrk2-domain-map',
    (palette) => this.buildFigure(palette),
    ['select2d', 'lasso2d', 'autoScale2d'],
  );

  protected readonly figure = computed(() => this.buildFigure(this.theme.palette()));

  /**
   * Emits the domain whose callout was clicked.
   */
  protected onAnnotationClick(event: unknown): void {
    const domain = (event as ClickAnnotationEvent).annotation?.name;
    if (domain) {
      this.domainSelected.emit(domain);
    }
  }

  private domainTrace(domains: Domain[], palette: ChartPalette): Data {
    return {
      type: 'bar',
      orientation: 'h',
      y: domains.map(() => 0),
      base: domains.map((d) => d.start),
      x: domains.map((d) => d.end - d.start),
      width: BAR_HALF_HEIGHT * 2,
      text: domains.map((d) => (d.end - d.start > 120 ? d.name : '')),
      textposition: 'inside',
      insidetextanchor: 'middle',
      textfont: {
        size: 11,
        color: domains.map((d) => (LIGHT_DOMAINS.has(d.name) ? ON_LIGHT_FILL : ON_DARK_FILL)),
      },
      marker: {
        color: domains.map((d) => palette.domain[d.name]),
        cornerradius: '50%',
      },
      customdata: domains.map((d) => [d.name, d.start, d.end]),
      hovertemplate:
        '<b>%{customdata[0]}</b><br>residues %{customdata[1]}–%{customdata[2]}<extra></extra>',
    } as Data;
  }

  private variantTrace(variants: ReplicateVariant[], palette: ChartPalette): Data {
    return {
      type: 'scatter',
      mode: 'markers',
      x: variants.map((v) => v.residue),
      y: variants.map(() => BAR_HALF_HEIGHT + 0.025),
      marker: { symbol: 'line-ns-open', size: 9, color: palette.ink, line: { width: 1.5 } },
      customdata: variants.map((v) => [
        v.variant,
        v.domain,
        v.mean?.toFixed(2) ?? '–',
        v.sd?.toFixed(2) ?? '–',
        v.classification ?? 'not classified',
        v.outcome?.label ?? '',
      ]),
      hovertemplate:
        '<b>%{customdata[0]}</b> · %{customdata[1]}<br>' +
        'pRAB10/RAB10 %{customdata[2]} ± %{customdata[3]}<br>' +
        'MDSG: %{customdata[4]}<br>%{customdata[5]}<extra></extra>',
    };
  }

  private boundaryLabels(
    domains: Domain[],
    length: number,
    palette: ChartPalette,
  ): AnnotationSpec[] {
    const positions = [1, ...domains.slice(1).map((d) => d.start), length];
    return positions.map((residue, i) => ({
      x: i === 0 ? residue - 20 : residue,
      y: -BAR_HALF_HEIGHT - 0.02,
      xanchor: i === 0 ? 'right' : i === positions.length - 1 ? 'left' : 'center',
      yanchor: 'top',
      text: String(residue),
      showarrow: false,
      font: { size: 10, color: palette.muted },
    }));
  }

  private callout(
    domain: Domain,
    variants: ReplicateVariant[],
    palette: ChartPalette,
  ): AnnotationSpec {
    const members = variants.filter((v) => v.domain === domain.name);
    const placement = CALLOUTS[domain.name];
    const above = placement.side === 'above';
    const color = palette.domain[domain.name];
    return {
      name: domain.name,
      x: (domain.start + domain.end) / 2,
      y: above ? BAR_HALF_HEIGHT : -BAR_HALF_HEIGHT,
      axref: 'x',
      ax: placement.x,
      ay: above ? -placement.offset : placement.offset,
      xanchor: 'center',
      yanchor: above ? 'bottom' : 'top',
      text: this.calloutText(domain.name, members, palette),
      align: 'left',
      font: { family: MONO, size: 11, color: palette.ink },
      showarrow: true,
      arrowhead: 0,
      arrowwidth: 1,
      arrowcolor: color,
      bordercolor: color,
      borderwidth: this.selected() === domain.name ? 3 : 1.5,
      borderpad: 4,
      bgcolor: tint(color, palette.scheme === 'dark' ? 0.22 : 0.14),
      captureevents: true,
      hovertext: `${domain.name}: ${members.length} variants · click to highlight replicates`,
    };
  }

  private calloutText(
    domainName: string,
    members: ReplicateVariant[],
    palette: ChartPalette,
  ): string {
    const header = `<b style="color:${palette.domainInk[domainName]}">${domainName}</b>`;
    const names = members.map((v) => this.variantLabel(v, palette));
    const columns = members.length > 8 ? 2 : 1;
    const rows = Math.ceil(names.length / columns);
    const width = Math.max(...members.map((v) => v.variant.length));
    const lines: string[] = [];
    for (let r = 0; r < rows; r++) {
      const left = members[r];
      const right = columns === 2 ? members[r + rows] : undefined;
      const padding = '&nbsp;'.repeat(width - left.variant.length + 1);
      lines.push(right ? `${names[r]}${padding}${names[r + rows]}` : names[r]);
    }
    return [header, ...lines].join('<br>');
  }

  /**
   * Formats a variant name for a callout. MDSG pathogenic or likely pathogenic variants are bold italic
   * in full-strength ink with a trailing asterisk; the others are in a subdued ink with a trailing space,
   * so both occupy the same monospace width.
   */
  private variantLabel(variant: ReplicateVariant, palette: ChartPalette): string {
    return isPathogenic(variant)
      ? `<b><i>${variant.variant}</i></b><b>*</b>`
      : `<span style="color:${palette.subdued}">${variant.variant}</span>&nbsp;`;
  }

  private doublesBox(doubles: ReplicateVariant[], palette: ChartPalette): AnnotationSpec {
    return {
      xref: 'paper',
      yref: 'paper',
      x: 0.02,
      y: 0.2,
      xanchor: 'left',
      yanchor: 'top',
      align: 'left',
      text: ['<b>Double mutants</b>', ...doubles.map((v) => v.variant)].join('<br>'),
      font: { family: MONO, size: 11, color: palette.ink },
      showarrow: false,
      bgcolor: palette.panel,
      bordercolor: palette.axis,
      borderwidth: 1,
      borderpad: 4,
    };
  }

  private buildFigure(palette: ChartPalette): Figure | null {
    if (!this.data.screen.hasValue() || !this.data.replicates.hasValue()) {
      return null;
    }
    const screen = this.data.screen.value();
    const replicates = this.data.replicates.value();
    const singles = replicates.variants.filter((v) => v.domain !== null);
    const doubles = replicates.variants.filter((v) => v.domain === null);
    const data: Data[] = [
      this.domainTrace(screen.domains, palette),
      this.variantTrace(singles, palette),
    ];
    const layout: Partial<Layout> = {
      height: 520,
      margin: { l: 20, r: 20, t: 10, b: 10 },
      ...baseLayout(palette),
      showlegend: false,
      barmode: 'overlay',
      hovermode: 'closest',
      dragmode: 'pan',
      xaxis: { range: [-80, screen.length + 80], visible: false, zeroline: false },
      yaxis: { range: [-1, 1], visible: false, fixedrange: true },
      annotations: [
        ...this.boundaryLabels(screen.domains, screen.length, palette),
        ...screen.domains.map((d) => this.callout(d, singles, palette)),
        this.doublesBox(doubles, palette),
      ],
    };
    return { data, layout };
  }
}

/**
 * True when the variant is classified MDSG pathogenic or likely pathogenic.
 */
export function isPathogenic(variant: ReplicateVariant): boolean {
  return !!variant.classification && PATHOGENIC_CLASSES.has(variant.classification);
}
