import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, Observable, of, shareReplay } from 'rxjs';
import { DataIndex, ReplicateData, ScreenData } from '../models/lrrk2';

/**
 * URL alias that always resolves to the newest data package in the index.
 */
export const LATEST = 'latest';

/**
 * Loads the dated data packages produced by `scripts/convert_xlsx.py` from `public/data`.
 *
 * `data/index.json` lists the available packages; the package in use is chosen with `select()`,
 * which the `:version` route guard calls with the date from the URL.
 */
@Service()
export class Lrrk2Data {
  private readonly http = inject(HttpClient);

  private readonly indexRequest: Observable<DataIndex | null> = this.http
    .get<DataIndex>('data/index.json')
    .pipe(
      catchError(() => of(null)),
      shareReplay(1),
    );

  readonly index = toSignal(this.indexRequest);
  readonly indexFailed = computed(() => this.index() === null);
  readonly requested = signal<string>(LATEST);

  readonly version = computed(() => {
    const index = this.index();
    if (!index) {
      return undefined;
    }
    const requested = this.requested();
    return requested === LATEST ? index.latest : index.versions.find((v) => v.id === requested)?.id;
  });

  readonly current = computed(() => this.index()?.versions.find((v) => v.id === this.version()));

  readonly screen = httpResource<ScreenData>(() => this.packageUrl('variants.json'));
  readonly replicates = httpResource<ReplicateData>(() => this.packageUrl('replicates.json'));

  /**
   * Emits the data index once loaded, or null when it cannot be fetched.
   */
  loadIndex(): Observable<DataIndex | null> {
    return this.indexRequest;
  }

  /**
   * Switches to the data package with the given date, or to the newest one for `latest`.
   */
  select(version: string): void {
    this.requested.set(version);
  }

  private packageUrl(file: string): string | undefined {
    const version = this.version();
    return version ? `data/${version}/${file}` : undefined;
  }
}
