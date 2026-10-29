import { describeNotice } from './dataset-notice';
import { DataIndex, DataVersion } from './lrrk2';

function version(id: string, extra: Partial<DataVersion> = {}): DataVersion {
  return { id, label: `Label ${id}`, source: 'x.xlsx', variants: 1, replicateSets: 1, ...extra };
}

function index(latest: string, versions: DataVersion[]): DataIndex {
  return { latest, versions };
}

describe('describeNotice', () => {
  const published = version('2026-10-23', { published: true });
  const newer = version('2027-03-01');
  const older = version('2025-01-01');

  it('shows nothing on the latest package when it is also the published one', () => {
    expect(describeNotice(index(published.id, [published, older]), published)).toBeNull();
  });

  it('offers the latest package on an older one', () => {
    const notice = describeNotice(index(published.id, [published, older]), older);

    expect(notice?.headline).toBe('Viewing data from Label 2025-01-01');
    expect(notice?.action?.label).toBe('View latest (Label 2026-10-23)');
    expect(notice?.action?.target.id).toBe('2026-10-23');
  });

  it('says when the older package on screen is the published one', () => {
    const notice = describeNotice(index(newer.id, [newer, published]), published);

    expect(notice?.headline).toBe('Viewing the published dataset: Label 2026-10-23');
    expect(notice?.action?.target.id).toBe('2027-03-01');
  });

  it('shows nothing on a latest package that is not the published one', () => {
    expect(describeNotice(index(newer.id, [newer, published]), newer)).toBeNull();
  });

  it('shows a package’s own message, alone when no button is needed', () => {
    const noted = version('2026-10-23', { published: true, notice: 'Corrected R1441H.' });
    const notice = describeNotice(index(noted.id, [noted]), noted);

    expect(notice).toEqual({
      current: noted,
      headline: 'Viewing Label 2026-10-23',
      message: 'Corrected R1441H.',
      action: null,
    });
  });
});
