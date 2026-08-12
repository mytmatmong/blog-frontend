import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslationService } from '../../../../core/services/translation.service';
import { AdminDashboard } from './admin-dashboard';

describe('AdminDashboard', () => {
  let component: AdminDashboard;
  let fixture: ComponentFixture<AdminDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the new dashboard copy in English when the language changes', () => {
    const translations = TestBed.inject(TranslationService);

    translations.setLanguage('EN');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Refresh');
    expect(translations.translate('admin_dashboard.language_details')).toBe('Language details');
    expect(translations.translate('admin_dashboard.review_requests')).toBe('Review requests');
  });
});
