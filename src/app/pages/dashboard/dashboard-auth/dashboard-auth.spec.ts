import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAuth } from './dashboard-auth';

describe('DashboardAuth', () => {
  let component: DashboardAuth;
  let fixture: ComponentFixture<DashboardAuth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAuth],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAuth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
