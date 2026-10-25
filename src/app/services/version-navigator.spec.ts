import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { VersionNavigator } from './version-navigator';

@Component({ template: '' })
class EmptyPage {}

describe('VersionNavigator', () => {
  let navigator: VersionNavigator;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: ':version/:view', component: EmptyPage }])],
    });
    navigator = TestBed.inject(VersionNavigator);
    router = TestBed.inject(Router);
  });

  it('swaps the version segment and keeps the view and query', async () => {
    await router.navigateByUrl('/2025-01-01/replicates?domain=ROC');

    await navigator.goTo('2026-10-23');

    expect(router.url).toBe('/2026-10-23/replicates?domain=ROC');
  });
});
