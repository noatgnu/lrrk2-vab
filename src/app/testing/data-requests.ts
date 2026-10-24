import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DataIndex } from '../models/lrrk2';

export const INDEX_URL = 'data/index.json';
export const SCREEN_URL = 'data/2026-10-23/variants.json';
export const REPLICATES_URL = 'data/2026-10-23/replicates.json';

export const INDEX_FIXTURE: DataIndex = {
  latest: '2026-10-23',
  versions: [
    {
      id: '2026-10-23',
      label: 'Initial release',
      source: 'fixture.xlsx',
      variants: 7,
      replicateSets: 3,
    },
    { id: '2025-01-01', label: null, source: 'older.xlsx', variants: 5, replicateSets: 2 },
  ],
};

/**
 * Answers the data index request and runs change detection so the latest package's requests are issued.
 */
export function flushIndex(http: HttpTestingController): void {
  http.expectOne(INDEX_URL).flush(INDEX_FIXTURE);
  TestBed.tick();
}
