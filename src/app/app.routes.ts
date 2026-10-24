import { ActivatedRouteSnapshot, Routes } from '@angular/router';
import { dataVersionGuard } from './guards/data-version-guard';
import { ActivatingVariants } from './pages/activating-variants/activating-variants';
import { ActivityRanking } from './pages/activity-ranking/activity-ranking';
import { DomainDistribution } from './pages/domain-distribution/domain-distribution';
import { LATEST } from './services/lrrk2-data';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: `${LATEST}/activating-variants` },
  {
    path: ':version',
    canActivate: [dataVersionGuard],
    data: {
      breadcrumb: (route: ActivatedRouteSnapshot) =>
        route.paramMap.get('version') === LATEST
          ? 'Latest data'
          : `Data ${route.paramMap.get('version')}`,
    },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'activating-variants' },
      {
        path: 'activating-variants',
        component: ActivatingVariants,
        title: 'Activating variants · LRRK2 VAB',
        data: { breadcrumb: 'Activating variants' },
      },
      { path: 'domain-map', redirectTo: 'activating-variants' },
      { path: 'replicates', redirectTo: 'activating-variants' },
      {
        path: 'activity-ranking',
        component: ActivityRanking,
        title: 'Activity ranking · LRRK2 VAB',
        data: { breadcrumb: 'Activity ranking' },
      },
      {
        path: 'domain-distribution',
        component: DomainDistribution,
        title: 'Domain distribution · LRRK2 VAB',
        data: { breadcrumb: 'Domain distribution' },
      },
      { path: 'structure', redirectTo: 'activating-variants' },
      { path: '**', redirectTo: 'activating-variants' },
    ],
  },
];
