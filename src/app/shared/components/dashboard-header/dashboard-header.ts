import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService, SupportedLang } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-dashboard-header',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './dashboard-header.html',
  styleUrl: './dashboard-header.css',
})
export class DashboardHeader {
  auth = inject(AuthService);
  translationService = inject(TranslationService);
  isLangDropdownOpen = signal<boolean>(false);

  toggleLangDropdown() {
    this.isLangDropdownOpen.update(v => !v);
  }

  selectLang(lang: SupportedLang) {
    this.translationService.setLanguage(lang);
    this.isLangDropdownOpen.set(false);
  }
}
