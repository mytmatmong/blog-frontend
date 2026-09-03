import { Component,OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import {
  AdminBlogOwnerRequestItem,
  BlogOwnerRequestStatus,
} from '../../../../core/models/admin-api.model';
import { AdminApiService } from '../../../../core/services/admin-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button';
import { TextButtonComponent } from '../../../../shared/components/text-button/text-button';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-manage-requests',
  imports: [
    FormsModule,
    TranslatePipe,
    ConfirmDialog,
    BadgeComponent,
    IconButtonComponent,
    TextButtonComponent,
  ],
  templateUrl: './manage-requests.html',
})
export class ManageRequests implements OnInit {
  protected readonly ts = inject(TranslationService);
  private readonly adminApi = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  private readonly route =inject(ActivatedRoute);
private readonly router =inject(Router);
  readonly requests = signal<AdminBlogOwnerRequestItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly currentPage = signal<number>(1);
  readonly totalItems = signal<number>(0);
  readonly totalPages = signal<number>(1);
  readonly itemsPerPage = 10;

  readonly statusFilter = signal<string>('PENDING');

  // Modals & Submitting signals
  readonly selectedRequest = signal<AdminBlogOwnerRequestItem | null>(null);
  readonly isApproveModalOpen = signal<boolean>(false);
  readonly isRejectModalOpen = signal<boolean>(false);
  readonly rejectionReason = signal<string>('');
  readonly isSubmitting = signal<boolean>(false);

  ngOnInit(): void {
  this.route.queryParamMap.subscribe(
    (params) => {
      // =====================
      // PAGE
      // =====================

      const rawPage =
        Number(params.get('page'));

      this.currentPage.set(
        Number.isInteger(rawPage) &&
        rawPage > 0
          ? rawPage
          : 1,
      );

      // =====================
      // STATUS
      // =====================

      const rawStatus =
        params.get('status');

      const validStatuses = [
        'PENDING',
        'APPROVED',
        'REJECTED',
        'ALL',
      ];

      this.statusFilter.set(
        rawStatus &&
        validStatuses.includes(
          rawStatus,
        )
          ? rawStatus
          : 'PENDING',
      );

      this.loadRequests();
    },
  );
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
        this.toast.error(getApiErrorMessage(error), this.ts.translate('requests.load_error'));
      },
    });
  }

  onStatusChange(
  status: string,
): void {
  if (
    status === this.statusFilter()
  ) {
    return;
  }

  this.router.navigate([], {
    relativeTo: this.route,

    queryParams: {
      page: 1,
      status,
    },

    queryParamsHandling: 'merge',
  });
}

  setPage(page: number): void {
  if (
    page < 1 ||
    page > this.totalPages() ||
    page === this.currentPage() ||
    this.isLoading()
  ) {
    return;
  }

  this.router.navigate([], {
    relativeTo: this.route,

    queryParams: {
      page,
    },

    queryParamsHandling: 'merge',
  });
}

  get pageItems(): Array<{ type: 'page' | 'ellipsis'; value: number | null }> {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => ({ type: 'page', value: i + 1 }));
    }

    let start = Math.max(1, current - 2);
    let end = start + 4;
    if (end > total) {
      end = total;
      start = Math.max(1, end - 4);
    }

    const items: Array<{ type: 'page' | 'ellipsis'; value: number | null }> = [];
    if (start > 1) {
      items.push({ type: 'ellipsis', value: null });
    }
    for (let p = start; p <= end; p++) {
      items.push({ type: 'page', value: p });
    }
    if (end < total) {
      items.push({ type: 'ellipsis', value: null });
    }
    return items;
  }

  // --- Duyệt Yêu Cầu (A08 - APPROVED) ---
  approveRequest(item: AdminBlogOwnerRequestItem): void {
    this.selectedRequest.set(item);
    this.isApproveModalOpen.set(true);
  }

  closeApproveModal(): void {
    if (this.isSubmitting()) return;
    this.isApproveModalOpen.set(false);
    this.selectedRequest.set(null);
  }

  submitApprove(): void {
    const item = this.selectedRequest();
    if (!item) return;

    this.isSubmitting.set(true);

    this.adminApi.reviewBlogOwnerRequest(item.id, { status: 'APPROVED' }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success(this.ts.translate('requests.approve_success'));
        this.isApproveModalOpen.set(false);
        this.selectedRequest.set(null);
        this.loadRequests();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.toast.error(getApiErrorMessage(error), this.ts.translate('requests.approve_error'));
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
        this.toast.success(this.ts.translate('requests.reject_success'));
        this.closeRejectModal();
        this.loadRequests();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.toast.error(getApiErrorMessage(error), this.ts.translate('requests.reject_error'));
      },
    });
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    const locale = this.ts.localeTag();
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(locale);
  }

  getStatusClass(status: BlogOwnerRequestStatus): string {
    switch (status) {
      case 'APPROVED':
        return 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
      case 'REJECTED':
        return 'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
      default:
        return 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
    }
  }

  getStatusLabel(status: BlogOwnerRequestStatus): string {
    switch (status) {
      case 'APPROVED':
        return this.ts.translate('requests.approved');
      case 'REJECTED':
        return this.ts.translate('requests.rejected');
      default:
        return this.ts.translate('requests.pending');
    }
  }
}
