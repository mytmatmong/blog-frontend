import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService, SupportedLang } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-dashboard-header',
  imports: [TranslatePipe],
  templateUrl: './dashboard-header.html',
  styleUrl: './dashboard-header.css',
})
export class DashboardHeader implements OnInit {
  auth = inject(AuthService);
  translationService = inject(TranslationService);
  private router = inject(Router);

  isLangDropdownOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.translationService.loadLanguages();
  }

  toggleLangDropdown() {
    this.isLangDropdownOpen.update(v => !v);
  }

  selectLang(lang: SupportedLang) {
    this.translationService.setLanguage(lang);
    this.isLangDropdownOpen.set(false);
  }

  onLogout() {
    this.auth.logoutApi().subscribe({
      next: () => this.router.navigate(['/auth']),
      error: () => this.router.navigate(['/auth'])
    });
  }
}
