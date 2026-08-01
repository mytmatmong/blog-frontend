import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
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
  private readonly router = inject(Router);

  protected isMobileMenuOpen = signal(false);
  protected isUserDropdownOpen = signal(false);
  protected isLangDropdownOpen = signal(false);
  protected searchValue = signal('');

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((value) => !value);
  }

  toggleUserDropdown(): void {
    this.isLangDropdownOpen.set(false);
    this.isUserDropdownOpen.update((value) => !value);
  }

  toggleLangDropdown(): void {
    this.isUserDropdownOpen.set(false);
    this.isLangDropdownOpen.update((value) => !value);
  }

  selectLang(lang: SupportedLang): void {
    this.ts.setLanguage(lang);
    this.isLangDropdownOpen.set(false);
  }

  updateSearch(value: string): void {
    this.searchValue.set(value);
  }

  submitSearch(event: Event): void {
    event.preventDefault();
    const search = this.searchValue().trim();

    void this.router.navigate(['/'], {
      queryParams: { search: search || null },
    });

    this.closeMobileMenu();
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  closeAllMenus(): void {
    this.isMobileMenuOpen.set(false);
    this.isUserDropdownOpen.set(false);
    this.isLangDropdownOpen.set(false);
  }

  onLogout(): void {
    this.auth.logoutApi().subscribe();
    this.closeAllMenus();
  }
}
