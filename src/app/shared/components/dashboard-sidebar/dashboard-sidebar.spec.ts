import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DashboardSidebar } from './dashboard-sidebar';

describe('DashboardSidebar', () => {
  let component: DashboardSidebar;
  let fixture: ComponentFixture<DashboardSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardSidebar],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardSidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
