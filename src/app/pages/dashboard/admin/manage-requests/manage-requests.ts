import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AdminBlogOwnerRequestItem,
  BlogOwnerRequestStatus,
} from '../../../../core/models/admin-api.model';
import { AdminApiService } from '../../../../core/services/admin-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-manage-requests',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './manage-requests.html',
})
export class ManageRequests {
  protected readonly ts = inject(TranslationService);
  private readonly adminApi = inject(AdminApiService);
  private readonly toast = inject(ToastService);

  readonly requests = signal<AdminBlogOwnerRequestItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly currentPage = signal<number>(1);
  readonly totalItems = signal<number>(0);
  readonly totalPages = signal<number>(1);
  readonly itemsPerPage = 10;

  readonly statusFilter = signal<string>('PENDING');

  // Modals & Submitting signals
  readonly selectedRequest = signal<AdminBlogOwnerRequestItem | null>(null);
  readonly isRejectModalOpen = signal<boolean>(false);
  readonly rejectionReason = signal<string>('');
  readonly isSubmitting = signal<boolean>(false);

  constructor() {
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);

    const query: { status?: BlogOwnerRequestStatus; page: number; limit: number } = {
      page: this.currentPage(),
      limit: this.itemsPerPage,
    };

    const statusVal = this.statusFilter();
    if (statusVal !== 'ALL') {
      query.status = statusVal as BlogOwnerRequestStatus;
    }

    this.adminApi.getBlogOwnerRequests(query).subscribe({
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
        this.toast.error(getApiErrorMessage(error), 'Tải danh sách yêu cầu thất bại');
      },
    });
  }

  onStatusChange(status: string): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.loadRequests();
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadRequests();
    }
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  }

  // --- Duyệt Yêu Cầu (A08 - APPROVED) ---
  approveRequest(item: AdminBlogOwnerRequestItem): void {
    if (typeof window !== 'undefined' && !window.confirm(`Duyệt quyền Blog Owner cho yêu cầu #${item.id}?`)) {
      return;
    }

    this.isSubmitting.set(true);

    this.adminApi.reviewBlogOwnerRequest(item.id, { status: 'APPROVED' }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success(`Đã duyệt yêu cầu #${item.id} thành công!`);
        this.loadRequests();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.toast.error(getApiErrorMessage(error), 'Duyệt yêu cầu thất bại');
      },
    });
  }

  // --- Từ Chối Yêu Cầu (A08 - REJECTED) ---
  openRejectModal(item: AdminBlogOwnerRequestItem): void {
    this.selectedRequest.set(item);
    this.rejectionReason.set('');
    this.isRejectModalOpen.set(true);
  }

  closeRejectModal(): void {
    this.isRejectModalOpen.set(false);
    this.selectedRequest.set(null);
  }

  submitReject(): void {
    const item = this.selectedRequest();
    if (!item) return;

    this.isSubmitting.set(true);
    const reasonStr = this.rejectionReason().trim();

    this.adminApi.reviewBlogOwnerRequest(item.id, {
      status: 'REJECTED',
      ...(reasonStr ? { rejectionReason: reasonStr } : {}),
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success(`Đã từ chối yêu cầu #${item.id}`);
        this.closeRejectModal();
        this.loadRequests();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.toast.error(getApiErrorMessage(error), 'Từ chối yêu cầu thất bại');
      },
    });
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
  }

  getStatusClass(status: BlogOwnerRequestStatus): string {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
    }
  }
}
