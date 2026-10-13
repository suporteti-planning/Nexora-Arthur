import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotebookAboutModal } from './notebook-about-modal';

describe('NotebookAboutModal', () => {
  let component: NotebookAboutModal;
  let fixture: ComponentFixture<NotebookAboutModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotebookAboutModal],
    }).compileComponents();

    fixture = TestBed.createComponent(NotebookAboutModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
