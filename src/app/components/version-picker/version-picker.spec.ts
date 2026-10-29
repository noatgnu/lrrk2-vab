import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Lrrk2Data } from '../../services/lrrk2-data';
import { flushIndex, INDEX_FIXTURE, INDEX_URL } from '../../testing/data-requests';
import { VersionPicker } from './version-picker';

describe('VersionPicker', () => {
  let component: VersionPicker;
  let fixture: ComponentFixture<VersionPicker>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VersionPicker],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(VersionPicker);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  function options(): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('option') as NodeListOf<HTMLOptionElement>,
    ).map((o) => o.textContent?.trim() ?? '');
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists latest followed by every dated package', () => {
    flushIndex(http);
    fixture.detectChanges();

    expect(options()).toEqual(['Latest (Initial release)', 'Initial release', '2025-01-01']);
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll('option') as NodeListOf<HTMLOptionElement>,
      ).map((o) => o.value),
    ).toEqual(['latest', '2026-10-23', '2025-01-01']);
  });

  it('selects the option for the requested package', () => {
    TestBed.inject(Lrrk2Data).select('2025-01-01');
    flushIndex(http);
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');

    expect(select.value).toBe('2025-01-01');
  });

  it('swaps the version segment and keeps the view and query', () => {
    flushIndex(http);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/latest/replicates?domain=ROC');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');

    select.value = '2025-01-01';
    select.dispatchEvent(new Event('change'));

    expect(navigate).toHaveBeenCalledWith(['/', '2025-01-01', 'replicates'], {
      queryParams: { domain: 'ROC' },
    });
  });

  it('reports a missing index', () => {
    http.expectOne(INDEX_URL).flush('missing', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Data index unavailable');
  });

  it('leaves hidden packages out of the menu unless one is being viewed', () => {
    const data = TestBed.inject(Lrrk2Data);
    const index = {
      ...INDEX_FIXTURE,
      versions: [
        ...INDEX_FIXTURE.versions,
        { ...INDEX_FIXTURE.versions[1], id: '2000-01-01', label: 'Test', hidden: true },
      ],
    };
    http.expectOne(INDEX_URL).flush(index);
    TestBed.tick();
    fixture.detectChanges();

    expect(options()).not.toContain('Test');

    data.select('2000-01-01');
    fixture.detectChanges();

    expect(options()).toContain('Test');
    expect(fixture.nativeElement.querySelector('select').value).toBe('2000-01-01');
  });

  it('tags the published package in the menu', () => {
    http.expectOne(INDEX_URL).flush({
      ...INDEX_FIXTURE,
      versions: [{ ...INDEX_FIXTURE.versions[0], published: true }, INDEX_FIXTURE.versions[1]],
    });
    TestBed.tick();
    fixture.detectChanges();

    expect(options()).toContain('Initial release · published');
  });
});
