import { Component, input, output } from '@angular/core';
import { Domain } from '../models/lrrk2';
import { MarkedResidue } from '../models/structure';

/**
 * Test double for `<app-structure-viewer>` that records its inputs without loading Mol* or WebGL.
 */
@Component({
  selector: 'app-structure-viewer',
  template: '',
})
export class StructureViewerStub {
  readonly domains = input<Domain[]>([]);
  readonly marked = input<MarkedResidue[]>([]);
  readonly hiddenDomains = input<ReadonlySet<string>>(new Set());
  readonly opacity = input(0.45);
  readonly focusResidues = input<number[]>([]);
  readonly focusDomain = input<Domain | undefined>();
  readonly residueClicked = output<number>();
}
