import { Component, computed, inject } from '@angular/core';
import { Theme } from '../../services/theme';

const ICONS = { system: 'brightness_auto', light: 'light_mode', dark: 'dark_mode' } as const;
const LABELS = { system: 'System theme', light: 'Light theme', dark: 'Dark theme' } as const;

/**
 * Icon button cycling the colour theme between system, light and dark.
 */
@Component({
  selector: 'app-theme-toggle',
  styleUrl: './theme-toggle.scss',
  templateUrl: './theme-toggle.html',
})
export class ThemeToggle {
  protected readonly theme = inject(Theme);
  protected readonly icon = computed(() => ICONS[this.theme.mode()]);
  protected readonly label = computed(() => LABELS[this.theme.mode()]);
}
