import { Component, computed, inject, input, output, signal } from '@angular/core';
import { PlotlyComponent } from 'angular-plotly.js';
import type { ClickAnnotationEvent, Data, Layout } from 'plotly.js-dist-min';
import { baseLayout, ChartPalette, Figure } from '../../models/chart-theme';
import { ChartExport } from '../../services/chart-export';
import { PATHOGENIC_CLASSES, tint } from '../../models/domain-style';
import { Domain, ReplicateVariant, ScreenVariant } from '../../models/lrrk2';
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
const DOT_BASE = BAR_HALF_HEIGHT + 0.035;
const DOT_STEP = 0.03;
const DOT_GAP_RESIDUES = 16;
const LIGHT_DOMAINS = new Set(['LRR', 'COR-A', 'COR-B', 'KIN']);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const LINE_PX = 14.4;
const BOX_PAD = 4;
const ASIDE_GAP = 4;
const NAMED_BAR_MIN = 120;

/**
 * Variants listed in grey parentheses above their domain's box instead of inside it, as in the
 * published domain figure.
 */
export const SET_ASIDE_VARIANTS: ReadonlySet<string> = new Set(['R506P', 'I610T', 'R981K']);
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
  protected readonly showDots = signal(false);
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
    const sorted = [...variants].sort((a, b) => (a.residue ?? 0) - (b.residue ?? 0));
    const levels = stackLevels(
      sorted.map((v) => v.residue ?? 0),
      DOT_GAP_RESIDUES,
    );
    return {
      type: 'scatter',
      mode: 'markers',
      x: sorted.map((v) => v.residue),
      y: levels.map((level) => DOT_BASE + level * DOT_STEP),
      marker: {
        size: 7,
        color: sorted.map((v) => (v.domain ? palette.domain[v.domain] : palette.control)),
        line: { color: palette.markerOutline, width: 0.75 },
      },
      customdata: sorted.map((v) => [
        v.variant,
        v.domain,
        v.mean?.toFixed(2) ?? '–',
        v.sd?.toFixed(2) ?? '–',
        v.replicates.length,
        v.classification ?? 'N/A',
        v.outcome?.label ?? '',
      ]),
      hovertemplate:
        '<b>%{customdata[0]}</b> · %{customdata[1]}<br>' +
        'replicate mean %{customdata[2]} ± %{customdata[3]} (n=%{customdata[4]})<br>' +
        'MDSGene: %{customdata[5]}<br>%{customdata[6]}<extra></extra>',
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
    const members = boxMembers(variants, domain.name);
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
      text: this.calloutText(members, palette),
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

  private calloutText(members: ReplicateVariant[], palette: ChartPalette): string {
    const names = members.map((v) => this.variantLabel(v, palette));
    const columns = members.length > 8 ? 2 : 1;
    const rows = calloutRows(members.length);
    const width = Math.max(...members.map((v) => v.variant.length));
    const lines: string[] = [];
    for (let r = 0; r < rows; r++) {
      const left = members[r];
      const right = columns === 2 ? members[r + rows] : undefined;
      const padding = '&nbsp;'.repeat(width - left.variant.length + 2);
      lines.push(right ? `${names[r]}${padding}${names[r + rows]}` : names[r]);
    }
    return lines.join('<br>');
  }

  /**
   * Text placed just beyond a domain's box: the domain name when the bar is too narrow to show it,
   * the set-aside variants in grey parentheses, and variants activating only in screen 3 marked `*`.
   * Returns null when there is nothing to show.
   */
  private aside(
    domain: Domain,
    replicateVariants: ReplicateVariant[],
    screenVariants: ScreenVariant[],
    palette: ChartPalette,
  ): AnnotationSpec | null {
    const lines: string[] = [];
    if (domain.end - domain.start <= NAMED_BAR_MIN) {
      lines.push(`<b style="color:${palette.domainInk[domain.name]}">${domain.name}</b>`);
    }
    const setAside = screenVariants
      .filter((v) => v.domain === domain.name && SET_ASIDE_VARIANTS.has(v.variant))
      .map((v) => v.variant);
    if (setAside.length) {
      lines.push(`<i style="color:${palette.muted}">(${setAside.join(', ')})</i>`);
    }
    const replicated = new Set(replicateVariants.map((v) => v.variant));
    lines.push(
      ...screen3Only(screenVariants, domain.name)
        .filter((v) => !replicated.has(v.variant))
        .map((v) => `${v.variant}*`),
    );
    if (!lines.length) {
      return null;
    }
    const placement = CALLOUTS[domain.name];
    const above = placement.side === 'above';
    const rows = calloutRows(boxMembers(replicateVariants, domain.name).length);
    const distance = placement.offset + rows * LINE_PX + 2 * BOX_PAD + 3 + ASIDE_GAP;
    return {
      x: (domain.start + domain.end) / 2,
      y: above ? BAR_HALF_HEIGHT : -BAR_HALF_HEIGHT,
      axref: 'x',
      ax: placement.x,
      ay: above ? -distance : distance,
      xanchor: 'center',
      yanchor: above ? 'bottom' : 'top',
      text: lines.join('<br>'),
      align: 'center',
      font: { family: MONO, size: 11, color: palette.ink },
      showarrow: true,
      arrowcolor: 'rgba(0,0,0,0)',
    };
  }

  /**
   * Formats a variant name for a callout: bold italic in full-strength ink for MDSGene pathogenic or likely
   * pathogenic variants, subdued ink for the others.
   */
  private variantLabel(variant: ReplicateVariant, palette: ChartPalette): string {
    return isPathogenic(variant)
      ? `<b><i>${variant.variant}</i></b>`
      : `<span style="color:${palette.subdued}">${variant.variant}</span>`;
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
      ...(this.showDots() ? [this.variantTrace(singles, palette)] : []),
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
        ...screen.domains
          .map((d) => this.aside(d, replicates.variants, screen.variants, palette))
          .filter((a): a is AnnotationSpec => a !== null),
        this.doublesBox(doubles, palette),
      ],
    };
    return { data, layout };
  }
}

/**
 * True when the variant is classified MDSGene pathogenic or likely pathogenic.
 */
export function isPathogenic(variant: ReplicateVariant): boolean {
  return !!variant.classification && PATHOGENIC_CLASSES.has(variant.classification);
}

/**
 * Assigns each position (in ascending order) the lowest stack level whose previous position is at
 * least `gap` away, so that marks closer than `gap` stack upward instead of overlapping.
 */
export function stackLevels(positions: number[], gap: number): number[] {
  const lastAtLevel: number[] = [];
  return positions.map((position) => {
    let level = lastAtLevel.findIndex((last) => position - last >= gap);
    if (level === -1) {
      level = lastAtLevel.length;
    }
    lastAtLevel[level] = position;
    return level;
  });
}

/**
 * The replicate variants listed inside a domain's box: those in the domain, minus the set-aside ones.
 */
export function boxMembers(variants: ReplicateVariant[], domain: string): ReplicateVariant[] {
  return variants.filter((v) => v.domain === domain && !SET_ASIDE_VARIANTS.has(v.variant));
}

/**
 * Screen variants in a domain whose only assessment was activating in screen 3.
 */
export function screen3Only(variants: ScreenVariant[], domain: string): ScreenVariant[] {
  return variants.filter(
    (v) =>
      v.domain === domain &&
      v.outcome.category === 'activating' &&
      v.outcome.screens.length === 1 &&
      v.outcome.screens[0] === 3,
  );
}

/**
 * Number of text rows in a callout box holding `count` variants (two columns above eight).
 */
export function calloutRows(count: number): number {
  return Math.ceil(count / (count > 8 ? 2 : 1));
}
