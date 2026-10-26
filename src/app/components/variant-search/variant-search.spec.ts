import { ComponentFixture, TestBed } from '@angular/core/testing';
import { matchesQuery } from '../../models/variant-search';
import { VariantSearch } from './variant-search';

describe('VariantSearch', () => {
  let component: VariantSearch;
  let fixture: ComponentFixture<VariantSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariantSearch],
    }).compileComponents();

    fixture = TestBed.createComponent(VariantSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('updates the query as the user types and shows the match count', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    fixture.componentRef.setInput('matches', 4);

    input.value = 'R1441';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(component.query()).toBe('R1441');
    expect(fixture.nativeElement.querySelector('.matches').textContent.trim()).toBe('4 matches');
  });

  it('hides the match count while the box is empty', () => {
    expect(fixture.nativeElement.querySelector('.matches')).toBeNull();
  });
});

describe('matchesQuery', () => {
  const g2019s = { variant: 'G2019S', residues: [2019] };
  const double = { variant: 'S455P-R1441H', residues: [455, 1441] };

  it('matches a residue number exactly, including either residue of a double mutant', () => {
    expect(matchesQuery(g2019s, '2019')).toBe(true);
    expect(matchesQuery(g2019s, '201')).toBe(false);
    expect(matchesQuery(double, '1441')).toBe(true);
  });

  it('matches variant names case-insensitively and ignores an empty query', () => {
    expect(matchesQuery(g2019s, ' g2019 ')).toBe(true);
    expect(matchesQuery(double, 'r1441')).toBe(true);
    expect(matchesQuery(g2019s, '')).toBe(false);
  });
});
