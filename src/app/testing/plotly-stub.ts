import { Component, input, output } from '@angular/core';

/**
 * Test double for `<plotly-plot>` that records its inputs without rendering Plotly in jsdom.
 */
@Component({
  selector: 'plotly-plot',
  template: '',
})
export class PlotlyStub {
  readonly data = input<unknown[]>([]);
  readonly layout = input<unknown>();
  readonly config = input<unknown>();
  readonly useResizeHandler = input<boolean>();
  readonly innerStyle = input<unknown>();
  readonly clickAnnotation = output<unknown>();
}
