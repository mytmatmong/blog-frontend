import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService, SupportedLang } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-public-header',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './public-header.html',
  styleUrl: './public-header.css',
})
export class PublicHeader {
  protected readonly auth = inject(AuthService);
  protected readonly ts = inject(TranslationService);
  protected isMobileMenuOpen = signal(false);
  protected isUserDropdownOpen = signal(false);
  protected isLangDropdownOpen = signal(false);

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  toggleUserDropdown() {
    this.isUserDropdownOpen.update(v => !v);
  }

  toggleLangDropdown() {
    this.isLangDropdownOpen.update(v => !v);
  }

  selectLang(lang: SupportedLang) {
    this.ts.setLanguage(lang);
    this.isLangDropdownOpen.set(false);
  }

  onLogout() {
    this.auth.logoutApi().subscribe();
    this.isUserDropdownOpen.set(false);
  }
}
