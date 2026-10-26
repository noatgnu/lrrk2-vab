import { Component, input, model } from '@angular/core';

/**
 * Search box for highlighting variants by name or residue position, with the number of matches.
 */
@Component({
  selector: 'app-variant-search',
  styleUrl: './variant-search.scss',
  templateUrl: './variant-search.html',
})
export class VariantSearch {
  readonly query = model('');
  readonly matches = input(0);
}
