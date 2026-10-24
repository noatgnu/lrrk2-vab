import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScreenFilter } from '../../services/screen-filter';
import { ScreenFilterToggle } from './screen-filter';

describe('ScreenFilterToggle', () => {
  let fixture: ComponentFixture<ScreenFilterToggle>;
  const selected = signal([1, 2]);
  const select = vi.fn();

  beforeEach(async () => {
    selected.set([1, 2]);
    select.mockReset();
    await TestBed.configureTestingModule({
      imports: [ScreenFilterToggle],
      providers: [
        {
          provide: ScreenFilter,
          useValue: { selected, available: signal([1, 2, 3]), select },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScreenFilterToggle);
    fixture.detectChanges();
  });

  function buttons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('button'));
  }

  it('shows one toggle per screen with the selected screens pressed', () => {
    expect(buttons().map((b) => b.textContent?.trim())).toEqual(['1', '2', '3']);
    expect(buttons().map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'true', 'false']);
  });

  it('adds a screen to the selection when clicked', () => {
    buttons()[2].click();

    expect(select).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('disables the last selected screen so the selection never empties', () => {
    selected.set([3]);
    fixture.detectChanges();

    expect(buttons().map((b) => b.disabled)).toEqual([false, false, true]);
  });
});
