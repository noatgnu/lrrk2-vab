import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Breadcrumbs } from './breadcrumbs';

@Component({ template: '' })
class EmptyPage {}

describe('Breadcrumbs', () => {
  let component: Breadcrumbs;
  let fixture: ComponentFixture<Breadcrumbs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Breadcrumbs],
      providers: [
        provideRouter([
          { path: 'domain-map', component: EmptyPage, data: { breadcrumb: 'Domain map' } },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Breadcrumbs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the root link followed by the active route label', async () => {
    await TestBed.inject(Router).navigateByUrl('/domain-map');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('a')?.textContent).toBe('LRRK2 VAB');
    expect(element.querySelector('[aria-current="page"]')?.textContent).toBe('Domain map');
  });
});
