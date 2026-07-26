import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicSidebarLeft } from './public-sidebar-left';

describe('PublicSidebarLeft', () => {
  let component: PublicSidebarLeft;
  let fixture: ComponentFixture<PublicSidebarLeft>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicSidebarLeft],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicSidebarLeft);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
