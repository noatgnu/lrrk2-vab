import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import { Domain } from '../../models/lrrk2';
import {
  buildStructureSelection,
  focusWindow,
  MarkedResidue,
  MolstarClickEvent,
  PdbeMolstarElement,
  PdbeMolstarViewer,
  STRUCTURE_MODEL,
} from '../../models/structure';
import { MolstarLoader } from '../../services/molstar-loader';
import { Theme } from '../../services/theme';

/**
 * PDBe Mol* view of the LRRK2 AlphaFold model with domains drawn as translucent surfaces in their
 * domain colours and marked residues as spacefill. Focus moves the camera to a residue or domain;
 * clicking a residue in 3D emits its number through `residueClicked`.
 */
@Component({
  selector: 'app-structure-viewer',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './structure-viewer.scss',
  templateUrl: './structure-viewer.html',
})
export class StructureViewer {
  private readonly loader = inject(MolstarLoader);
  private readonly theme = inject(Theme);
  private readonly renderer = inject(Renderer2);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly element = viewChild<ElementRef<PdbeMolstarElement>>('viewer');

  readonly domains = input<Domain[]>([]);
  readonly marked = input<MarkedResidue[]>([]);
  readonly hiddenDomains = input<ReadonlySet<string>>(new Set());
  readonly opacity = input(0.45);
  readonly focusResidues = input<number[]>([]);
  readonly focusDomain = input<Domain | undefined>();
  readonly residueClicked = output<number>();

  protected readonly model = STRUCTURE_MODEL;
  protected readonly scriptReady = signal(false);
  protected readonly failed = signal(false);
  private readonly viewer = signal<PdbeMolstarViewer | undefined>(undefined);

  constructor() {
    const destroyRef = inject(DestroyRef);
    const observer = this.whenVisible(() =>
      this.loader.load().then(
        () => this.scriptReady.set(true),
        () => this.failed.set(true),
      ),
    );
    destroyRef.onDestroy(() => observer?.disconnect());

    effect((onCleanup) => {
      const element = this.element()?.nativeElement;
      const instance = element?.viewerInstance;
      if (!element || !instance) {
        return;
      }
      const subscription = instance.events.loadComplete.subscribe((loaded) => {
        if (loaded) {
          this.viewer.set(instance);
        }
      });
      const unlisten = this.renderer.listen(
        element,
        'PDB.molstar.click',
        (event: MolstarClickEvent) => {
          const residue = event.eventData?.auth_seq_id ?? event.eventData?.residueNumber;
          if (residue !== undefined) {
            this.residueClicked.emit(residue);
          }
        },
      );
      onCleanup(() => {
        subscription.unsubscribe();
        unlisten();
      });
    });

    effect(() => {
      const viewer = this.viewer();
      if (!viewer) {
        return;
      }
      const selection = buildStructureSelection(
        this.domains(),
        this.hiddenDomains(),
        this.marked(),
        this.theme.palette(),
        this.opacity(),
        this.focusDomain()?.name,
      );
      void viewer.visual.select(selection);
    });

    effect(() => {
      const viewer = this.viewer();
      if (!viewer) {
        return;
      }
      this.theme.scheme();
      void viewer.canvas.setBgColor(this.surfaceColor());
    });

    effect(() => {
      const viewer = this.viewer();
      if (!viewer) {
        return;
      }
      const residues = this.focusResidues();
      const domain = this.focusDomain();
      if (residues.length) {
        void viewer.visual.focus(residues.map((residue) => focusWindow(residue)));
        void viewer.visual.highlight({
          data: residues.map((residue) => ({ auth_seq_id: residue })),
        });
      } else if (domain) {
        void viewer.visual.clearHighlight();
        void viewer.visual.focus([{ beg_auth_seq_id: domain.start, end_auth_seq_id: domain.end }]);
      } else {
        void viewer.visual.clearHighlight();
        void viewer.visual.reset({ camera: true });
      }
    });

    destroyRef.onDestroy(() => this.viewer.set(undefined));
  }

  /**
   * Runs `start` once the viewer scrolls near the viewport, or immediately where IntersectionObserver
   * is unavailable, so the Mol* bundle is only downloaded when the viewer is about to be seen.
   */
  private whenVisible(start: () => void): IntersectionObserver | undefined {
    const view = this.host.nativeElement.ownerDocument.defaultView;
    if (!view?.IntersectionObserver) {
      start();
      return undefined;
    }
    const observer = new view.IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          start();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(this.host.nativeElement);
    return observer;
  }

  /**
   * Returns the resolved background colour of the host element as a hex string for the Mol* canvas.
   */
  private surfaceColor(): string {
    const view = this.host.nativeElement.ownerDocument.defaultView;
    const rgb = view?.getComputedStyle(this.host.nativeElement).backgroundColor.match(/\d+/g) ?? [];
    const [r, g, b] = rgb.map(Number);
    return rgb.length >= 3
      ? '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
      : '#ffffff';
  }
}
