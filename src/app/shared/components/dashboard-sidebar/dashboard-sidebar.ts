import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './dashboard-sidebar.html',
  styleUrl: './dashboard-sidebar.css',
})
export class DashboardSidebar {
  private readonly router = inject(Router);
  auth = inject(AuthService);

  get activeSection(): 'owner' | 'moderator' | 'admin' | null {
    const url = this.router.url;
    if (url.includes('/dashboard/owner')) return 'owner';
    if (url.includes('/dashboard/moderator')) return 'moderator';
    if (url.includes('/dashboard/admin')) return 'admin';
    return null;
  }
}
