import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestBlogOwner } from './request-blog-owner';

describe('RequestBlogOwner', () => {
  let component: RequestBlogOwner;
  let fixture: ComponentFixture<RequestBlogOwner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestBlogOwner],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestBlogOwner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
