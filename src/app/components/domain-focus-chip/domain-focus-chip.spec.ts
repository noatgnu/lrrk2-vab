import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LIGHT_PALETTE } from '../../models/chart-theme';
import { Theme } from '../../services/theme';
import { DomainFocusChip } from './domain-focus-chip';

describe('DomainFocusChip', () => {
  let component: DomainFocusChip;
  let fixture: ComponentFixture<DomainFocusChip>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DomainFocusChip],
    }).compileComponents();

    TestBed.inject(Theme).mode.set('light');
    fixture = TestBed.createComponent(DomainFocusChip);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('domain', { name: 'ROC', start: 1335, end: 1511 });
    fixture.componentRef.setInput('variantCount', 19);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the domain name, colour, residue range and variant count', () => {
    const element: HTMLElement = fixture.nativeElement;
    const swatch: HTMLElement = element.querySelector('.swatch')!;

    expect(element.querySelector('.name')?.textContent).toBe('ROC');
    expect(element.querySelector('.detail')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '1335–1511 · 19 variants',
    );
    expect(swatch.style.background).toBe(hexToRgb(LIGHT_PALETTE.domain['ROC']));
  });

  it('uses the singular for a single variant', () => {
    fixture.componentRef.setInput('variantCount', 1);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.detail').textContent).toContain('1 variant');
    expect(fixture.nativeElement.querySelector('.detail').textContent).not.toContain('variants');
  });

  it('emits when the clear button is clicked', () => {
    const cleared = vi.fn();
    component.cleared.subscribe(cleared);

    fixture.nativeElement.querySelector('.clear').click();

    expect(cleared).toHaveBeenCalledTimes(1);
  });
});

function hexToRgb(hex: string): string {
  const value = parseInt(hex.slice(1), 16);
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
}
