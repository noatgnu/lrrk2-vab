import { Component, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ScreenFilter } from '../../services/screen-filter';

/**
 * Multi-select toggle for the screens whose variants are shown.
 */
@Component({
  imports: [MatButtonToggleModule],
  selector: 'app-screen-filter',
  styleUrl: './screen-filter.scss',
  templateUrl: './screen-filter.html',
})
export class ScreenFilterToggle {
  protected readonly filter = inject(ScreenFilter);
}
