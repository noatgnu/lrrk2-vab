import { DOCUMENT } from '@angular/common';
import { effect, inject, Service, signal } from '@angular/core';
import { Theme } from './theme';

export const MOLSTAR_SCRIPT = 'pdbe-molstar.js';
export const MOLSTAR_STYLES = {
  light: 'pdbe-molstar-light.css',
  dark: 'pdbe-molstar-dark.css',
} as const;

/**
 * Loads the PDBe Mol* web component on demand. The script and its stylesheet are emitted as separate,
 * non-injected bundles (see `angular.json`) so they are only downloaded when a structure view opens.
 * The stylesheet follows the light/dark theme.
 */
@Service()
export class MolstarLoader {
  private readonly document = inject(DOCUMENT);
  private readonly theme = inject(Theme);
  private readonly requested = signal(false);
  private script?: Promise<void>;

  constructor() {
    effect(() => {
      if (!this.requested()) {
        return;
      }
      this.stylesheet().href = MOLSTAR_STYLES[this.theme.scheme()];
    });
  }

  /**
   * Resolves once `<pdbe-molstar>` is defined, adding the script and stylesheet on first call.
   */
  load(): Promise<void> {
    this.requested.set(true);
    this.script ??= new Promise<void>((resolve, reject) => {
      if (this.document.defaultView?.customElements.get('pdbe-molstar')) {
        resolve();
        return;
      }
      const script = this.document.createElement('script');
      script.src = MOLSTAR_SCRIPT;
      script.onload = () => resolve();
      script.onerror = () => {
        this.script = undefined;
        reject(new Error(`Failed to load ${MOLSTAR_SCRIPT}`));
      };
      this.document.body.appendChild(script);
    });
    return this.script;
  }

  private stylesheet(): HTMLLinkElement {
    const existing = this.document.getElementById('pdbe-molstar-style');
    if (existing) {
      return existing as HTMLLinkElement;
    }
    const link = this.document.createElement('link');
    link.id = 'pdbe-molstar-style';
    link.rel = 'stylesheet';
    this.document.head.appendChild(link);
    return link;
  }
}
