import { Component, computed, inject } from '@angular/core';
import { versionName } from '../../models/lrrk2';
import { LATEST, Lrrk2Data } from '../../services/lrrk2-data';
import { VersionNavigator } from '../../services/version-navigator';

/**
 * Data package selector that swaps the `:version` segment of the current URL, keeping the view and query.
 * Packages are listed by label; the date stays the option value and URL segment. Hidden packages are
 * left out unless one is being viewed, so the menu always shows the package on screen.
 */
@Component({
  selector: 'app-version-picker',
  styleUrl: './version-picker.scss',
  templateUrl: './version-picker.html',
})
export class VersionPicker {
  private readonly navigator = inject(VersionNavigator);
  protected readonly data = inject(Lrrk2Data);
  protected readonly latest = LATEST;

  protected readonly latestVersion = computed(() => {
    const index = this.data.index();
    return index?.versions.find((v) => v.id === index.latest);
  });

  protected readonly name = versionName;

  protected readonly listed = computed(() => {
    const requested = this.data.requested();
    return (this.data.index()?.versions ?? []).filter((v) => !v.hidden || v.id === requested);
  });

  /**
   * Navigates to the same view under the chosen data package.
   */
  protected choose(version: string): void {
    void this.navigator.goTo(version);
  }
}
