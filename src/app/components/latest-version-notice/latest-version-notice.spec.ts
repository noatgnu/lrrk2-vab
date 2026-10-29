import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Lrrk2Data } from '../../services/lrrk2-data';
import { VersionNavigator } from '../../services/version-navigator';
import { flushIndex, INDEX_FIXTURE, INDEX_URL } from '../../testing/data-requests';
import { LatestVersionNotice } from './latest-version-notice';

describe('LatestVersionNotice', () => {
  let fixture: ComponentFixture<LatestVersionNotice>;
  let data: Lrrk2Data;
  const goTo = vi.fn().mockResolvedValue(true);

  beforeEach(async () => {
    goTo.mockClear();
    await TestBed.configureTestingModule({
      imports: [LatestVersionNotice],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: VersionNavigator, useValue: { goTo } },
      ],
    }).compileComponents();

    data = TestBed.inject(Lrrk2Data);
    fixture = TestBed.createComponent(LatestVersionNotice);
  });

  function show(version: string): HTMLElement {
    data.select(version);
    flushIndex(TestBed.inject(HttpTestingController));
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('stays hidden while the latest data is shown, by alias or by date', () => {
    expect(show('latest').querySelector('.notice')).toBeNull();

    data.select('2026-10-23');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.notice')).toBeNull();
  });

  it('names versions by label and links to the newest version by its date', () => {
    const element = show('2025-01-01');

    expect(element.querySelector('.headline')?.textContent?.trim()).toBe(
      'Viewing data from 2025-01-01',
    );
    expect(element.querySelector('.action')?.textContent?.trim()).toBe(
      'View latest (Initial release)',
    );
    expect(element.querySelector('.action')?.getAttribute('title')).toBe('2026-10-23');

    (element.querySelector('.action') as HTMLButtonElement).click();

    expect(goTo).toHaveBeenCalledWith('2026-10-23');
  });

  it('can be dismissed for the version shown', () => {
    const element = show('2025-01-01');

    (element.querySelector('.dismiss') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element.querySelector('.notice')).toBeNull();
  });

  it('shows the package’s own message under the headline', () => {
    data.select('2025-01-01');
    TestBed.inject(HttpTestingController)
      .expectOne(INDEX_URL)
      .flush({
        ...INDEX_FIXTURE,
        versions: [
          INDEX_FIXTURE.versions[0],
          { ...INDEX_FIXTURE.versions[1], notice: 'Superseded by the published dataset.' },
        ],
      });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.message').textContent.trim()).toBe(
      'Superseded by the published dataset.',
    );
  });
});
