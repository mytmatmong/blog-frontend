import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageCategories } from './manage-categories';

describe('ManageCategories', () => {
  let component: ManageCategories;
  let fixture: ComponentFixture<ManageCategories>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageCategories],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageCategories);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
