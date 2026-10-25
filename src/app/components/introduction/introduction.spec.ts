import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Introduction } from './introduction';

describe('Introduction', () => {
  let component: Introduction;
  let fixture: ComponentFixture<Introduction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Introduction],
    }).compileComponents();

    fixture = TestBed.createComponent(Introduction);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the introduction heading and cites the original publication', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('h2')?.textContent).toBe('Introduction');
    expect(element.textContent).toContain('Rab10 Thr73 phosphorylation');
    expect(element.textContent).toContain(
      'Large-scale functional annotation establishes a reference framework for human LRRK2 variants',
    );
    expect(element.querySelector('a')?.getAttribute('href')).toBe(
      'https://www.medrxiv.org/content/10.64898/2026.06.17.26355034v1',
    );
  });
});
