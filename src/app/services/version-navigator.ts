import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Switches the data package shown by replacing the `:version` segment of the current URL,
 * keeping the rest of the path and the query.
 */
@Service()
export class VersionNavigator {
  private readonly router = inject(Router);

  /**
   * Navigates to the same view under the given data package date or `latest`.
   */
  goTo(version: string): Promise<boolean> {
    const tree = this.router.parseUrl(this.router.url);
    const segments = tree.root.children['primary']?.segments.map((s) => s.path) ?? [];
    return this.router.navigate(['/', version, ...segments.slice(1)], {
      queryParams: tree.queryParams,
    });
  }
}
