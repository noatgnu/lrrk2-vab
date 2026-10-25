import { Component, computed, inject, signal } from '@angular/core';
import { versionName } from '../../models/lrrk2';
import { Lrrk2Data } from '../../services/lrrk2-data';
import { VersionNavigator } from '../../services/version-navigator';

/**
 * Floating notice shown while an older data package is displayed, with a button that opens the
 * newest package under its own dated URL. Dismissing it hides it until a different older package is opened.
 */
@Component({
  selector: 'app-latest-version-notice',
  styleUrl: './latest-version-notice.scss',
  templateUrl: './latest-version-notice.html',
})
export class LatestVersionNotice {
  private readonly data = inject(Lrrk2Data);
  private readonly navigator = inject(VersionNavigator);
  private readonly dismissedFor = signal<string | undefined>(undefined);
  protected readonly name = versionName;

  protected readonly latest = computed(() => {
    const index = this.data.index();
    return index?.versions.find((v) => v.id === index.latest);
  });

  protected readonly outdated = computed(() => {
    const current = this.data.current();
    const latest = this.latest();
    return current && latest && current.id !== latest.id && this.dismissedFor() !== current.id
      ? current
      : undefined;
  });

  /**
   * Opens the current view under the newest data package's dated URL.
   */
  protected viewLatest(): void {
    const latest = this.latest();
    if (latest) {
      void this.navigator.goTo(latest.id);
    }
  }

  /**
   * Hides the notice for the data package currently shown.
   */
  protected dismiss(): void {
    this.dismissedFor.set(this.data.current()?.id);
  }
}
