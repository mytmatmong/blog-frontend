import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-public-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './public-header.html',
  styleUrl: './public-header.css',
})
export class PublicHeader {
  protected readonly auth = inject(AuthService);
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
}
