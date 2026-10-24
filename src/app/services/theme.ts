import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, effect, inject, Service, signal } from '@angular/core';
import { ColorScheme, DARK_PALETTE, LIGHT_PALETTE } from '../models/chart-theme';

export type ThemeMode = 'system' | ColorScheme;

export const THEME_STORAGE_KEY = 'lrrk2-vab-theme';
const MODES: ThemeMode[] = ['system', 'light', 'dark'];

/**
 * Tracks the light/dark preference, applies it to the document as `data-theme`, and exposes the
 * matching chart palette. `system` follows the operating system setting; the choice is remembered per browser.
 */
@Service()
export class Theme {
  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');

  readonly mode = signal<ThemeMode>(this.restore());
  private readonly systemDark = signal(this.media?.matches ?? false);

  readonly scheme = computed<ColorScheme>(() => {
    const mode = this.mode();
    return mode === 'system' ? (this.systemDark() ? 'dark' : 'light') : mode;
  });

  readonly palette = computed(() => (this.scheme() === 'dark' ? DARK_PALETTE : LIGHT_PALETTE));

  constructor() {
    const listener = (event: MediaQueryListEvent) => this.systemDark.set(event.matches);
    this.media?.addEventListener('change', listener);
    inject(DestroyRef).onDestroy(() => this.media?.removeEventListener('change', listener));

    effect(() => {
      const mode = this.mode();
      const root = this.document.documentElement;
      if (mode === 'system') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', mode);
      }
      this.persist(mode);
    });
  }

  /**
   * Advances to the next mode in the order system → light → dark.
   */
  cycle(): void {
    this.mode.set(MODES[(MODES.indexOf(this.mode()) + 1) % MODES.length]);
  }

  private restore(): ThemeMode {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY);
      return MODES.includes(stored as ThemeMode) ? (stored as ThemeMode) : 'system';
    } catch {
      return 'system';
    }
  }

  private persist(mode: ThemeMode): void {
    try {
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      return;
    }
  }
}
