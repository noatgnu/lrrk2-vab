import { TestBed } from '@angular/core/testing';
import { DARK_PALETTE, LIGHT_PALETTE } from '../models/chart-theme';
import { Theme, THEME_STORAGE_KEY } from './theme';

describe('Theme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
  });

  it('follows the system setting by default', () => {
    const theme = TestBed.inject(Theme);
    TestBed.tick();

    expect(theme.mode()).toBe('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('cycles system → light → dark → system', () => {
    const theme = TestBed.inject(Theme);
    const seen = [1, 2, 3].map(() => {
      theme.cycle();
      return theme.mode();
    });

    expect(seen).toEqual(['light', 'dark', 'system']);
  });

  it('applies and remembers an explicit choice', () => {
    const theme = TestBed.inject(Theme);
    theme.mode.set('dark');
    TestBed.tick();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(theme.scheme()).toBe('dark');
    expect(theme.palette()).toBe(DARK_PALETTE);
  });

  it('restores the stored choice', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');

    const theme = TestBed.inject(Theme);

    expect(theme.mode()).toBe('light');
    expect(theme.palette()).toBe(LIGHT_PALETTE);
  });

  it('ignores an invalid stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');

    expect(TestBed.inject(Theme).mode()).toBe('system');
  });
});
