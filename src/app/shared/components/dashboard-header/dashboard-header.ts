import { Component, computed, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService, SupportedLang } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageSelectorComponent } from '../language-selector/language-selector';

@Component({
  selector: 'app-dashboard-header',
  imports: [TranslatePipe, LanguageSelectorComponent],
  templateUrl: './dashboard-header.html',
  styleUrl: './dashboard-header.css',
})
export class DashboardHeader implements OnInit {
  auth = inject(AuthService);
  translationService = inject(TranslationService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  isLangDropdownOpen = signal<boolean>(false);

  readonly userInitial = computed(() => {
    const user = this.auth.currentUser();
    const label =
      user?.username?.trim() ||
      user?.email?.trim() ||
      '';

    return Array.from(label)[0]?.toLocaleUpperCase() ?? '?';
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isLangDropdownOpen.set(false);
    }
  }

  ngOnInit(): void {
    this.translationService.loadLanguages();
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
