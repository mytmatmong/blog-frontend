import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicSidebarRight } from './public-sidebar-right';

describe('PublicSidebarRight', () => {
  let component: PublicSidebarRight;
  let fixture: ComponentFixture<PublicSidebarRight>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicSidebarRight],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicSidebarRight);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
