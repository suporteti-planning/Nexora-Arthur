import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentInventory } from './equipment-inventory';

describe('EquipmentInventory', () => {
  let component: EquipmentInventory;
  let fixture: ComponentFixture<EquipmentInventory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentInventory],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentInventory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
