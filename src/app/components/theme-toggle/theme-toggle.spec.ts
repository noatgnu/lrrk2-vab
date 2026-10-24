import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Theme } from '../../services/theme';
import { ThemeToggle } from './theme-toggle';

describe('ThemeToggle', () => {
  let component: ThemeToggle;
  let fixture: ComponentFixture<ThemeToggle>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ThemeToggle],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('advances the theme and updates its icon and label on click', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    button.click();
    fixture.detectChanges();

    expect(TestBed.inject(Theme).mode()).toBe('light');
    expect(button.textContent?.trim()).toBe('light_mode');
    expect(button.getAttribute('aria-label')).toBe('Light theme');
  });
});
