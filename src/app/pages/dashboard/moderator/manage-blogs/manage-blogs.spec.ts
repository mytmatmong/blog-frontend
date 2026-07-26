import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageBlogs } from './manage-blogs';

describe('ManageBlogs', () => {
  let component: ManageBlogs;
  let fixture: ComponentFixture<ManageBlogs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageBlogs],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageBlogs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
