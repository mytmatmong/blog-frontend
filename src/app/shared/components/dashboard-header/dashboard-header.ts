import { Component, computed, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
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
  private elementRef = inject(ElementRef);

  isLangDropdownOpen = signal<boolean>(false);
  readonly currentUrl = signal<string>(this.router.url);

  readonly userInitial = computed(() => {
    const user = this.auth.currentUser();
    const label =
      user?.username?.trim() ||
      user?.email?.trim() ||
      '';

    return Array.from(label)[0]?.toLocaleUpperCase() ?? '?';
  });

  readonly dashboardTitleKey = computed(() => {
    const url = this.currentUrl();
    if (url.includes('/dashboard/admin')) {
      return 'dashboard.admin_title';
    }
    if (url.includes('/dashboard/moderator')) {
      return 'dashboard.mod_title';
    }
    if (url.includes('/dashboard/owner')) {
      return 'dashboard.owner_title';
    }

    const role = this.auth.currentRole();
    switch (role) {
      case 'admin':
        return 'dashboard.admin_title';
      case 'moderator':
        return 'dashboard.mod_title';
      case 'owner':
        return 'dashboard.owner_title';
      default:
        return 'dashboard.title';
    }
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isLangDropdownOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.translationService.loadLanguages();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      });
  }

  toggleLangDropdown(event?: MouseEvent) {
    event?.stopPropagation();
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
