import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeAboutModal } from './employee-about-modal';

describe('EmployeeAboutModal', () => {
  let component: EmployeeAboutModal;
  let fixture: ComponentFixture<EmployeeAboutModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeAboutModal],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeAboutModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
