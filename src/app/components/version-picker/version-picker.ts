import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LATEST, Lrrk2Data } from '../../services/lrrk2-data';

/**
 * Data package selector that swaps the `:version` segment of the current URL, keeping the view and query.
 */
@Component({
  selector: 'app-version-picker',
  styleUrl: './version-picker.scss',
  templateUrl: './version-picker.html',
})
export class VersionPicker {
  private readonly router = inject(Router);
  protected readonly data = inject(Lrrk2Data);
  protected readonly latest = LATEST;

  /**
   * Navigates to the same view under the chosen data package.
   */
  protected choose(version: string): void {
    const tree = this.router.parseUrl(this.router.url);
    const segments = tree.root.children['primary']?.segments.map((s) => s.path) ?? [];
    this.router.navigate(['/', version, ...segments.slice(1)], { queryParams: tree.queryParams });
  }
}
