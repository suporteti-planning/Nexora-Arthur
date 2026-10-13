import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotebookCreateModal } from './notebook-create-modal';

describe('NotebookCreateModal', () => {
  let component: NotebookCreateModal;
  let fixture: ComponentFixture<NotebookCreateModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotebookCreateModal],
    }).compileComponents();

    fixture = TestBed.createComponent(NotebookCreateModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
