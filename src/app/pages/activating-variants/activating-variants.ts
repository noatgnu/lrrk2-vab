import { Component, computed, ElementRef, inject, input, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DomainFocusChip } from '../../components/domain-focus-chip/domain-focus-chip';
import { Introduction } from '../../components/introduction/introduction';
import { DomainMap } from '../../components/domain-map/domain-map';
import { ReplicateActivity } from '../../components/replicate-activity/replicate-activity';
import { StructureExplorer } from '../../components/structure-explorer/structure-explorer';
import { Lrrk2Data } from '../../services/lrrk2-data';

/**
 * Activating variants view: the domain map, the 3D structure explorer and the replicate activity plot.
 * The focused domain, variant set and selected variant are kept in the URL query and shared by all three;
 * a floating chip shows the focused domain and clears it.
 */
@Component({
  imports: [Introduction, DomainMap, StructureExplorer, ReplicateActivity, DomainFocusChip],
  selector: 'app-activating-variants',
  styleUrl: './activating-variants.scss',
  templateUrl: './activating-variants.html',
})
export class ActivatingVariants {
  private readonly router = inject(Router);
  private readonly data = inject(Lrrk2Data);
  private readonly structure = viewChild('structure', { read: ElementRef });

  readonly domain = input<string | undefined>();
  readonly set = input<string | undefined>();
  readonly variant = input<string | undefined>();

  protected readonly focused = computed(() =>
    this.data.screen.hasValue()
      ? this.data.screen.value().domains.find((d) => d.name === this.domain())
      : undefined,
  );

  protected readonly focusedCount = computed(() => {
    const name = this.focused()?.name;
    return this.data.replicates.hasValue() && name
      ? this.data.replicates.value().variants.filter((v) => v.domain === name).length
      : 0;
  });

  /**
   * Focuses the clicked domain in the structure and replicate plot, and scrolls the structure into view.
   */
  protected selectDomain(domain: string): void {
    this.router.navigate([], {
      queryParams: { domain, variant: null },
      queryParamsHandling: 'merge',
    });
    this.structure()?.nativeElement.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Clears the domain focus in every section of the page.
   */
  protected clearDomain(): void {
    this.router.navigate([], { queryParams: { domain: null }, queryParamsHandling: 'merge' });
  }
}
