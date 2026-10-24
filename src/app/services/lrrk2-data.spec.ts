import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { flushIndex, INDEX_URL, REPLICATES_URL, SCREEN_URL } from '../testing/data-requests';
import { REPLICATE_FIXTURE, SCREEN_FIXTURE } from '../testing/fixtures';
import { LATEST, Lrrk2Data } from './lrrk2-data';

describe('Lrrk2Data', () => {
  let service: Lrrk2Data;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Lrrk2Data);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the latest package listed in the index', async () => {
    flushIndex(http);
    http.expectOne(SCREEN_URL).flush(SCREEN_FIXTURE);
    http.expectOne(REPLICATES_URL).flush(REPLICATE_FIXTURE);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(service.requested()).toBe(LATEST);
    expect(service.version()).toBe('2026-10-23');
    expect(service.screen.value()?.variants[0].variant).toBe('H230R');
    expect(service.replicates.value()?.variants.length).toBe(3);
  });

  it('loads the package for a selected date', () => {
    service.select('2025-01-01');
    flushIndex(http);

    expect(service.current()?.source).toBe('older.xlsx');
    http.expectOne('data/2025-01-01/variants.json');
    http.expectOne('data/2025-01-01/replicates.json');
  });

  it('requests no package for an unknown date', () => {
    service.select('1999-01-01');
    flushIndex(http);

    expect(service.version()).toBeUndefined();
  });

  it('reports a missing index', () => {
    http.expectOne(INDEX_URL).flush('missing', { status: 404, statusText: 'Not Found' });

    expect(service.indexFailed()).toBe(true);
    expect(service.version()).toBeUndefined();
  });
});
