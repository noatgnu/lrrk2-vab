import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Lrrk2Data } from '../services/lrrk2-data';
import { INDEX_FIXTURE, INDEX_URL } from '../testing/data-requests';
import { dataVersionGuard } from './data-version-guard';

@Component({ template: '' })
class EmptyPage {}

describe('dataVersionGuard', () => {
  let router: Router;
  let http: HttpTestingController;
  let data: Lrrk2Data;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          {
            path: ':version',
            canActivate: [dataVersionGuard],
            children: [{ path: 'domain-map', component: EmptyPage }],
          },
        ]),
      ],
    });
    router = TestBed.inject(Router);
    http = TestBed.inject(HttpTestingController);
    data = TestBed.inject(Lrrk2Data);
  });

  async function navigate(url: string): Promise<void> {
    const navigation = router.navigateByUrl(url);
    http.expectOne(INDEX_URL).flush(INDEX_FIXTURE);
    await navigation;
  }

  it('selects a listed data package', async () => {
    await navigate('/2025-01-01/domain-map');

    expect(router.url).toBe('/2025-01-01/domain-map');
    expect(data.requested()).toBe('2025-01-01');
  });

  it('accepts the latest alias', async () => {
    await navigate('/latest/domain-map');

    expect(router.url).toBe('/latest/domain-map');
    expect(data.version()).toBe('2026-10-23');
  });

  it('redirects unknown dates to the same view under latest, keeping the query', async () => {
    await navigate('/1999-01-01/domain-map?domain=ROC');

    expect(router.url).toBe('/latest/domain-map?domain=ROC');
  });
});
