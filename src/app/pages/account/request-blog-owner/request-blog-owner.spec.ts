import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RequestBlogOwner } from './request-blog-owner';

@Component({ template: '' })
class TestAuthPage {}

describe('RequestBlogOwner', () => {
  let component: RequestBlogOwner;
  let fixture: ComponentFixture<RequestBlogOwner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestBlogOwner],
      providers: [provideRouter([{ path: 'auth', component: TestAuthPage }])],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestBlogOwner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
