import { computed, inject, Service } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { FunctionalOutcome } from '../models/lrrk2';
import { formatScreens, inScreens, parseScreens } from '../models/screens';
import { Lrrk2Data } from './lrrk2-data';

/**
 * The screen selection shared by every view built from the screen data, kept in the `screens` URL query.
 */
@Service()
export class ScreenFilter {
  private readonly router = inject(Router);
  private readonly data = inject(Lrrk2Data);

  private readonly param = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.parseUrl(this.router.url).queryParamMap.get('screens')),
    ),
    { initialValue: null },
  );

  readonly selected = computed(() => parseScreens(this.param()));

  readonly available = computed(() => {
    if (!this.data.screen.hasValue()) {
      return [];
    }
    const screens = this.data.screen.value().variants.flatMap((v) => v.outcome.screens);
    return [...new Set(screens)].sort((a, b) => a - b);
  });

  /**
   * Selects the given screens; an empty selection is ignored so at least one screen stays shown.
   */
  select(screens: number[]): void {
    if (!screens.length) {
      return;
    }
    this.router.navigate([], {
      queryParams: { screens: formatScreens(screens) },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Keeps the items whose outcome was assessed in a selected screen.
   */
  apply<T extends { outcome: FunctionalOutcome | null }>(items: T[]): T[] {
    const screens = this.selected();
    return items.filter((item) => inScreens(item.outcome, screens));
  }
}
