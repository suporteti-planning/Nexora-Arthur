import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinksUteis } from './links-uteis';

describe('LinksUteis', () => {
  let component: LinksUteis;
  let fixture: ComponentFixture<LinksUteis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinksUteis],
    }).compileComponents();

    fixture = TestBed.createComponent(LinksUteis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
