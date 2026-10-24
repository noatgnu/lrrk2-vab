import { Component, inject, input, output } from '@angular/core';
import { Domain } from '../../models/lrrk2';
import { Theme } from '../../services/theme';

/**
 * Floating indicator of the focused domain, with its colour, residue range and variant count,
 * and a button to clear the focus.
 */
@Component({
  selector: 'app-domain-focus-chip',
  styleUrl: './domain-focus-chip.scss',
  templateUrl: './domain-focus-chip.html',
})
export class DomainFocusChip {
  protected readonly palette = inject(Theme).palette;

  readonly domain = input.required<Domain>();
  readonly variantCount = input(0);
  readonly cleared = output<void>();
}
