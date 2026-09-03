import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  BlogOwnerRequestStatus,
  UserBlogOwnerRequest,
} from '../../../core/models/user-api.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
import { UserApiService } from '../../../core/services/user-api.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-request-blog-owner',
  imports: [FormsModule, Pagination, TranslatePipe],
  templateUrl: './request-blog-owner.html',
  styleUrl: './request-blog-owner.css',
})
export class RequestBlogOwner {
  protected readonly ts = inject(TranslationService);
  protected readonly auth = inject(AuthService);
  private readonly userApi = inject(UserApiService);
  private readonly toast = inject(ToastService);

  readonly requests = signal<UserBlogOwnerRequest[]>([]);
  readonly selectedRequest = signal<UserBlogOwnerRequest | null>(null);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly currentPage = signal(1);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly itemsPerPage = 10;

  reason = '';
  topics = '';
  statusFilter: BlogOwnerRequestStatus | '' = '';

  constructor() {
    this.loadRequests();
  }

  submit(event: Event): void {
    event.preventDefault();

    const reason = this.reason.trim();
    const topics = this.topics.trim();

    if (!reason) {
      this.toast.warning(this.ts.translate('request_owner.enter_reason_warning'));
      return;
    }

    if (reason.length > 1000 || topics.length > 500) {
      this.toast.warning(this.ts.translate('request_owner.length_limit_warning'));
      return;
    }

    this.isSubmitting.set(true);

    this.userApi.createBlogOwnerRequest({
      reason,
      ...(topics ? { topics } : {}),
    }).subscribe({
      next: ({ data }) => {
        this.reason = '';
        this.topics = '';
        this.isSubmitting.set(false);
        this.selectedRequest.set(data);
        this.currentPage.set(1);
        this.toast.success(this.ts.translate('request_owner.submit_success'));
        this.loadRequests();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.toast.error(getApiErrorMessage(error), this.ts.translate('request_owner.submit_error'));
      },
    });
  }

  loadRequests(): void {
    this.isLoading.set(true);

    this.userApi.getBlogOwnerRequests({
      page: this.currentPage(),
      limit: this.itemsPerPage,
      ...(this.statusFilter ? { status: this.statusFilter } : {}),
    }).subscribe({
      next: ({ data }) => {
        this.requests.set(data.items);
        this.totalItems.set(data.meta.totalItems);
        this.totalPages.set(Math.max(1, data.meta.totalPages));
        this.currentPage.set(data.meta.currentPage);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.requests.set([]);
        this.isLoading.set(false);
        this.toast.error(getApiErrorMessage(error), this.ts.translate('request_owner.load_list_error'));
      },
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadRequests();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadRequests();
  }

  viewDetail(id: number): void {
    this.userApi.getBlogOwnerRequestById(id).subscribe({
      next: ({ data }) => this.selectedRequest.set(data),
      error: (error: unknown) => this.toast.error(getApiErrorMessage(error), this.ts.translate('request_owner.load_detail_error')),
    });
  }

  cancelRequest(request: UserBlogOwnerRequest): void {
    if (request.status !== 'PENDING') return;

    if (typeof window !== 'undefined' && !window.confirm(this.ts.translate('request_owner.cancel_confirm'))) return;

    this.userApi.cancelBlogOwnerRequest(request.id).subscribe({
      next: () => {
        if (this.selectedRequest()?.id === request.id) this.selectedRequest.set(null);
        this.toast.success(this.ts.translate('request_owner.cancel_success'));
        this.loadRequests();
      },
      error: (error: unknown) => this.toast.error(getApiErrorMessage(error), this.ts.translate('request_owner.cancel_error')),
    });
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(this.ts.localeTag());
  }

  statusClass(status: BlogOwnerRequestStatus): string {
    if (status === 'APPROVED') return 'bg-green-100 text-green-700';
    if (status === 'REJECTED') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  }
}
