import { NgClass } from '@angular/common';
import { Component, computed, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService, SupportedLang } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-public-header',
  imports: [RouterLink, RouterLinkActive, TranslatePipe, NgClass],
  templateUrl: './public-header.html',
  styleUrl: './public-header.css',
})
export class PublicHeader implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly ts = inject(TranslationService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  protected isMobileMenuOpen = signal(false);
  protected isUserDropdownOpen = signal(false);
  protected isLangDropdownOpen = signal(false);
  protected searchValue = signal('');

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects || event.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly isAuthPage = computed(() => {
    const url = this.currentUrl() || '';
    return url.startsWith('/auth') || url.includes('/auth');
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isLangDropdownOpen.set(false);
      this.isUserDropdownOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.ts.loadLanguages();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((value) => !value);
  }

  toggleUserDropdown(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isLangDropdownOpen.set(false);
    this.isUserDropdownOpen.update((value) => !value);
  }

  toggleLangDropdown(event?: MouseEvent): void {
    event?.stopPropagation();
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
