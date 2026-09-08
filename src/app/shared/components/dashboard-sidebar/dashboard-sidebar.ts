import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-dashboard-sidebar',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './dashboard-sidebar.html',
  styleUrl: './dashboard-sidebar.css',
})
export class DashboardSidebar {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  get activeSection(): 'owner' | 'moderator' | 'admin' | null {
    const url = this.router.url;
    if (url.includes('/dashboard/owner')) return 'owner';
    if (url.includes('/dashboard/moderator')) return 'moderator';
    if (url.includes('/dashboard/admin')) return 'admin';
    return null;
  }

  get canAccessOwner(): boolean {
    const role = this.auth.currentRole();
    return role === 'owner' || role === 'moderator' || role === 'admin';
  }

  get canAccessModerator(): boolean {
    const role = this.auth.currentRole();
    return role === 'moderator' || role === 'admin';
  }

  get canAccessAdmin(): boolean {
    const role = this.auth.currentRole();
    return role === 'admin';
  }

  onLogout(): void {
    this.auth.logoutApi().subscribe({
      next: () => this.router.navigate(['/auth']),
      error: () => this.router.navigate(['/auth']),
    });
  }
}
