import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { flushIndex, REPLICATES_URL, SCREEN_URL } from '../testing/data-requests';
import { REPLICATE_FIXTURE, SCREEN_3_FIXTURE } from '../testing/fixtures';
import { ScreenFilter } from './screen-filter';

@Component({ template: '' })
class EmptyPage {}

describe('ScreenFilter', () => {
  let filter: ScreenFilter;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'view', component: EmptyPage }]),
      ],
    });
    filter = TestBed.inject(ScreenFilter);
    router = TestBed.inject(Router);
  });

  it('selects screens 1 and 2 by default and hides screen-3 variants', () => {
    const variants = SCREEN_3_FIXTURE.variants;

    expect(filter.selected()).toEqual([1, 2]);
    expect(filter.apply(variants).map((v) => v.variant)).not.toContain('R1514G');
    expect(filter.apply(variants).length).toBe(variants.length - 1);
  });

  it('follows the screens query in the URL', async () => {
    await router.navigateByUrl('/view?screens=1,2,3');

    expect(filter.selected()).toEqual([1, 2, 3]);
    expect(filter.apply(SCREEN_3_FIXTURE.variants).length).toBe(SCREEN_3_FIXTURE.variants.length);
  });

  it('writes non-default selections to the URL and drops the default', async () => {
    await router.navigateByUrl('/view?domain=ROC');

    filter.select([3, 1, 2]);
    await new Promise((resolve) => setTimeout(resolve));
    expect(router.url).toBe('/view?domain=ROC&screens=1,2,3');

    filter.select([1, 2]);
    await new Promise((resolve) => setTimeout(resolve));
    expect(router.url).toBe('/view?domain=ROC');
  });

  it('ignores an empty selection', async () => {
    await router.navigateByUrl('/view?screens=3');

    filter.select([]);
    await new Promise((resolve) => setTimeout(resolve));

    expect(filter.selected()).toEqual([3]);
  });

  it('lists the screens present in the data', async () => {
    const http = TestBed.inject(HttpTestingController);
    flushIndex(http);
    http.expectOne(SCREEN_URL).flush(SCREEN_3_FIXTURE);
    http.expectOne(REPLICATES_URL).flush(REPLICATE_FIXTURE);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(filter.available()).toEqual([2, 3]);
  });
});
