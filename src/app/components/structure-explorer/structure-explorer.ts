import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChildren,
} from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Router } from '@angular/router';
import { ScreenFilterToggle } from '../screen-filter/screen-filter';
import { StructureViewer } from '../../components/structure-viewer/structure-viewer';
import { ActivityGroup, rankVariants } from '../../models/activity';
import { MarkedResidue, STRUCTURE_MODEL } from '../../models/structure';
import { Lrrk2Data } from '../../services/lrrk2-data';
import { ScreenFilter } from '../../services/screen-filter';
import { Theme } from '../../services/theme';

export type VariantSet = 'activating' | 'all';
export type SortKey = 'name' | 'domain' | 'screen' | 'replicates';

/**
 * Mean, standard deviation and number of values of one activity measurement.
 */
export interface Measurement {
  mean: number;
  sd: number | null;
  n: number;
}

/**
 * A variant listed in the explorer, with the residues it marks on the structure and its activity
 * in the screen and in the replicates, where measured.
 */
export interface StructureVariant {
  name: string;
  residues: number[];
  domain: string | null;
  classification: string | null;
  group: ActivityGroup | null;
  screen: Measurement | null;
  replicates: Measurement | null;
}

/**
 * Active column sort of the variant table; `null` keeps the set's natural order.
 */
export interface TableSort {
  key: SortKey;
  descending: boolean;
}

const GROUP_LABELS: Record<ActivityGroup, string> = {
  above_reference: '≥ G2019S',
  wt_range: 'WT range',
  reduced: '< 0.5 × WT',
};

/**
 * Interactive 3D exploration of variants on the LRRK2 AlphaFold model, coloured by domain.
 * The variant set, selected variant and focused domain come from the page's URL query and
 * changes are written back to it.
 */
@Component({
  imports: [StructureViewer, MatButtonToggleModule, ScreenFilterToggle],
  selector: 'app-structure-explorer',
  styleUrl: './structure-explorer.scss',
  templateUrl: './structure-explorer.html',
})
export class StructureExplorer {
  private readonly data = inject(Lrrk2Data);
  private readonly router = inject(Router);
  private readonly theme = inject(Theme);
  private readonly screens = inject(ScreenFilter);
  private readonly rows = viewChildren<ElementRef<HTMLElement>>('row');

  readonly set = input<string | undefined>();
  readonly variant = input<string | undefined>();
  readonly domain = input<string | undefined>();

  protected readonly model = STRUCTURE_MODEL;
  protected readonly groupLabels = GROUP_LABELS;
  protected readonly groups: ActivityGroup[] = ['above_reference', 'wt_range', 'reduced'];
  protected readonly filter = signal('');
  protected readonly opacity = signal(0.45);
  protected readonly hidden = signal<ReadonlySet<string>>(new Set());
  protected readonly clickedResidue = signal<number | undefined>(undefined);
  protected readonly sort = signal<TableSort | null>(null);
  protected readonly columns: { key: SortKey; label: string; title: string }[] = [
    { key: 'name', label: 'Variant', title: 'Sort by variant' },
    { key: 'domain', label: 'Domain', title: 'Sort by domain' },
    { key: 'screen', label: 'Screen', title: 'Screen mean (n)' },
    { key: 'replicates', label: 'Replicates', title: 'Replicate mean (n)' },
  ];
  protected readonly palette = this.theme.palette;

  protected readonly loading = computed(
    () => this.data.screen.isLoading() || this.data.replicates.isLoading(),
  );
  protected readonly failed = computed(
    () => this.data.screen.error() ?? this.data.replicates.error(),
  );

  protected readonly variantSet = computed<VariantSet>(() =>
    this.set() === 'all' ? 'all' : 'activating',
  );

  protected readonly domains = computed(() =>
    this.data.screen.hasValue() ? this.data.screen.value().domains : [],
  );

  protected readonly variants = computed<StructureVariant[]>(() => {
    if (!this.data.screen.hasValue() || !this.data.replicates.hasValue()) {
      return [];
    }
    const screenVariants = this.data.screen.value().variants;
    const replicateVariants = this.data.replicates.value().variants;
    const screenByName = new Map(screenVariants.map((v) => [v.variant, v]));
    const replicatesByName = new Map(replicateVariants.map((v) => [v.variant, v]));
    const screenOf = (name: string): Measurement | null => {
      const v = screenByName.get(name);
      return v && v.mean !== null ? { mean: v.mean, sd: v.sd, n: v.n ?? 0 } : null;
    };
    const replicatesOf = (name: string): Measurement | null => {
      const v = replicatesByName.get(name);
      return v && v.mean !== null ? { mean: v.mean, sd: v.sd, n: v.replicates.length } : null;
    };
    if (this.variantSet() === 'all') {
      return rankVariants(this.screens.apply(screenVariants)).map((r) => ({
        name: r.variant.variant,
        residues: r.variant.residues,
        domain: r.variant.domain,
        classification: r.variant.classification,
        group: r.group,
        screen: screenOf(r.variant.variant),
        replicates: replicatesOf(r.variant.variant),
      }));
    }
    return replicateVariants.map((v) => ({
      name: v.variant,
      residues: v.residues,
      domain: v.domain,
      classification: v.classification,
      group: null,
      screen: screenOf(v.variant),
      replicates: replicatesOf(v.variant),
    }));
  });

  protected readonly visibleVariants = computed(() => {
    const query = this.filter().trim().toLowerCase();
    const hidden = this.hidden();
    const rows = this.variants().filter(
      (v) =>
        (!v.domain || !hidden.has(v.domain)) &&
        (!query ||
          v.name.toLowerCase().includes(query) ||
          (v.domain ?? '').toLowerCase().includes(query)),
    );
    const sort = this.sort();
    return sort ? sortVariants(rows, sort) : rows;
  });

  protected readonly counts = computed(() => {
    const counts = new Map<string, number>();
    for (const v of this.variants()) {
      if (v.domain) {
        counts.set(v.domain, (counts.get(v.domain) ?? 0) + 1);
      }
    }
    return counts;
  });

  protected readonly marked = computed<MarkedResidue[]>(() => {
    const palette = this.palette();
    const hidden = this.hidden();
    const focused = this.focusDomain()?.name;
    return this.variants()
      .filter((v) => (focused ? v.domain === focused : !v.domain || !hidden.has(v.domain)))
      .flatMap((v) =>
        v.residues.map((residue) => ({
          residue,
          color: v.group ? palette.group[v.group] : palette.ink,
        })),
      );
  });

  protected readonly selected = computed(() =>
    this.variants().find((v) => v.name === this.variant()),
  );
  protected readonly focusResidues = computed(() => this.selected()?.residues ?? []);
  protected readonly focusDomain = computed(() =>
    this.domains().find((d) => d.name === this.domain()),
  );

  constructor() {
    effect(() => {
      const name = this.selected()?.name;
      const row = this.rows().find((r) => r.nativeElement.dataset['variant'] === name);
      row?.nativeElement.scrollIntoView?.({ block: 'nearest' });
    });
  }

  /**
   * Sorts the table by a column: first click sorts (numbers high to low, text A to Z), second click
   * reverses, third click restores the set's natural order.
   */
  protected sortBy(key: SortKey): void {
    const current = this.sort();
    const numeric = key === 'screen' || key === 'replicates';
    if (current?.key !== key) {
      this.sort.set({ key, descending: numeric });
    } else if (current.descending === numeric) {
      this.sort.set({ key, descending: !numeric });
    } else {
      this.sort.set(null);
    }
  }

  protected ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    const sort = this.sort();
    return sort?.key === key ? (sort.descending ? 'descending' : 'ascending') : 'none';
  }

  /**
   * Switches between the replicate-validated activating variants and all screened variants.
   */
  protected chooseSet(set: VariantSet): void {
    this.updateQuery({ set: set === 'all' ? 'all' : null, variant: null });
  }

  /**
   * Selects a variant and focuses the camera on its residues, or clears the selection if it is already selected.
   */
  protected selectVariant(name: string): void {
    this.clickedResidue.set(undefined);
    this.updateQuery({ variant: this.variant() === name ? null : name, domain: null });
  }

  /**
   * Focuses the camera on a domain, or resets the view if it is already focused.
   */
  protected focusOn(domain: string): void {
    this.updateQuery({ domain: this.domain() === domain ? null : domain, variant: null });
  }

  /**
   * Shows or hides a domain's surface and its variants.
   */
  protected toggleDomain(domain: string): void {
    const next = new Set(this.hidden());
    if (!next.delete(domain)) {
      next.add(domain);
    }
    this.hidden.set(next);
  }

  /**
   * Clears the selection and focus and shows every domain again.
   */
  protected resetView(): void {
    this.hidden.set(new Set());
    this.clickedResidue.set(undefined);
    this.updateQuery({ variant: null, domain: null });
  }

  /**
   * Selects the first listed variant at a residue clicked in the 3D view.
   */
  protected onResidueClicked(residue: number): void {
    this.clickedResidue.set(residue);
    const match = this.variants().find((v) => v.residues.includes(residue));
    if (match && match.name !== this.variant()) {
      this.updateQuery({ variant: match.name, domain: null });
    }
  }

  protected domainOf(residue: number): string | undefined {
    return this.domains().find((d) => residue >= d.start && residue <= d.end)?.name;
  }

  private updateQuery(queryParams: Record<string, string | null>): void {
    this.router.navigate([], { queryParams, queryParamsHandling: 'merge' });
  }
}

/**
 * Returns the variants ordered by a table column; variants missing the sorted value go last.
 */
export function sortVariants(rows: StructureVariant[], sort: TableSort): StructureVariant[] {
  const value = (v: StructureVariant): string | number | null => {
    switch (sort.key) {
      case 'name':
        return v.name;
      case 'domain':
        return v.domain;
      case 'screen':
        return v.screen?.mean ?? null;
      case 'replicates':
        return v.replicates?.mean ?? null;
    }
  };
  const direction = sort.descending ? -1 : 1;
  return [...rows].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    if (x === null || y === null) {
      return x === y ? 0 : x === null ? 1 : -1;
    }
    const order =
      typeof x === 'number' && typeof y === 'number'
        ? x - y
        : String(x).localeCompare(String(y), undefined, { numeric: true });
    return order * direction;
  });
}
