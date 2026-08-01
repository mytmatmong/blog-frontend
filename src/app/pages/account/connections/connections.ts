import { Component, inject, signal } from '@angular/core';

import { UserSummary } from '../../../core/models/auth.model';
import { UserApiService } from '../../../core/services/user-api.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-account-connections',
  imports: [Pagination, TranslatePipe],
  templateUrl: './connections.html',
  styleUrl: './connections.css',
})
export class AccountConnections {
  private readonly userApi = inject(UserApiService);

  readonly activeTab = signal<'followers' | 'following'>('followers');
  readonly users = signal<UserSummary[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly currentPage = signal(1);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly itemsPerPage = 10;

  constructor() {
    this.load();
  }

  selectTab(tab: 'followers' | 'following'): void {
    if (tab === this.activeTab()) return;
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.load();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const request = this.activeTab() === 'followers'
      ? this.userApi.getMyFollowers({ page: this.currentPage(), limit: this.itemsPerPage })
      : this.userApi.getMyFollowing({ page: this.currentPage(), limit: this.itemsPerPage });

    request.subscribe({
      next: ({ data }) => {
        this.users.set(data.items);
        this.totalItems.set(data.meta.totalItems);
        this.totalPages.set(Math.max(1, data.meta.totalPages));
        this.currentPage.set(data.meta.currentPage);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.users.set([]);
        this.totalItems.set(0);
        this.totalPages.set(1);
        this.isLoading.set(false);
        this.errorMessage.set(getApiErrorMessage(error));
      },
    });
  }

  avatarInitial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || 'U';
  }
}
