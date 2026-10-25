import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Breadcrumbs } from './components/breadcrumbs/breadcrumbs';
import { LatestVersionNotice } from './components/latest-version-notice/latest-version-notice';
import { ThemeToggle } from './components/theme-toggle/theme-toggle';
import { VersionPicker } from './components/version-picker/version-picker';
import { Lrrk2Data } from './services/lrrk2-data';

/**
 * Application shell: title bar, view navigation scoped to the selected data package, breadcrumbs and the routed view.
 */
@Component({
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Breadcrumbs,
    VersionPicker,
    ThemeToggle,
    LatestVersionNotice,
  ],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly data = inject(Lrrk2Data);

  protected readonly views = [
    { path: 'activating-variants', label: 'Activating variants' },
    { path: 'activity-ranking', label: 'Activity ranking' },
    { path: 'domain-distribution', label: 'Domain distribution' },
  ];
}
