import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

/**
 * A breadcrumb entry built from a route's `data.breadcrumb` label and its absolute path.
 */
export interface Crumb {
  label: string;
  url: string;
}

/**
 * Route `data.breadcrumb` value: a fixed label or a function deriving it from the route, e.g. from its params.
 */
export type BreadcrumbLabel = string | ((route: ActivatedRouteSnapshot) => string);

/**
 * Renders a breadcrumb trail from the `breadcrumb` data of each activated route.
 */
@Component({
  imports: [RouterLink],
  selector: 'app-breadcrumbs',
  styleUrl: './breadcrumbs.scss',
  templateUrl: './breadcrumbs.html',
})
export class Breadcrumbs {
  private readonly router = inject(Router);

  protected readonly crumbs = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.build(this.router.routerState.snapshot.root)),
    ),
    { initialValue: [] as Crumb[] },
  );

  private build(root: ActivatedRouteSnapshot): Crumb[] {
    const crumbs: Crumb[] = [{ label: 'LRRK2 VAB', url: '/' }];
    const segments: string[] = [];
    let route: ActivatedRouteSnapshot | null = root;
    while (route) {
      segments.push(...route.url.map((s) => s.path));
      const label: BreadcrumbLabel | undefined = route.data['breadcrumb'];
      if (label && route.routeConfig?.path) {
        crumbs.push({
          label: typeof label === 'function' ? label(route) : label,
          url: '/' + segments.join('/'),
        });
      }
      route = route.firstChild;
    }
    return crumbs;
  }
}
