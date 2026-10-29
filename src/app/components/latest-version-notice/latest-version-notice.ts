import { Component, computed, inject, signal } from '@angular/core';
import { describeNotice, NoticeAction } from '../../models/dataset-notice';
import { Lrrk2Data } from '../../services/lrrk2-data';
import { VersionNavigator } from '../../services/version-navigator';

/**
 * Floating notice about the data package on screen: points older packages to the latest one, the
 * latest package to the published one, and shows a package's own message. Buttons open packages
 * by their dated URL. Dismissing it hides it until a different package is opened.
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

  protected readonly notice = computed(() => {
    const notice = describeNotice(this.data.index(), this.data.current());
    return notice && notice.current.id !== this.dismissedFor() ? notice : null;
  });

  /**
   * Opens the current view under the action's data package.
   */
  protected open(action: NoticeAction): void {
    void this.navigator.goTo(action.target.id);
  }

  /**
   * Hides the notice for the data package currently shown.
   */
  protected dismiss(): void {
    this.dismissedFor.set(this.data.current()?.id);
  }
}
