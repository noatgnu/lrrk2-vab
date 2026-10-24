import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { LATEST, Lrrk2Data } from '../services/lrrk2-data';

/**
 * Activates the data package named by the `:version` route parameter.
 *
 * Unknown versions are redirected to the same view under `latest`. When the index cannot be loaded
 * the route still activates so the views can report the failure.
 */
export const dataVersionGuard: CanActivateFn = (route, state) => {
  const data = inject(Lrrk2Data);
  const router = inject(Router);
  const requested = route.paramMap.get('version') ?? LATEST;

  return data.loadIndex().pipe(
    map((index) => {
      if (!index || requested === LATEST || index.versions.some((v) => v.id === requested)) {
        data.select(requested);
        return true;
      }
      const tree = router.parseUrl(state.url);
      const segments = tree.root.children['primary']?.segments.map((s) => s.path) ?? [];
      return router.createUrlTree(['/', LATEST, ...segments.slice(1)], {
        queryParams: tree.queryParams,
      });
    }),
  );
};
