import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarLayout } from './navbar-layout';

describe('MainLayout', () => {
  let component: NavbarLayout;
  let fixture: ComponentFixture<NavbarLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
