import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageLanguages } from './manage-languages';

describe('ManageLanguages', () => {
  let component: ManageLanguages;
  let fixture: ComponentFixture<ManageLanguages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageLanguages],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageLanguages);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
