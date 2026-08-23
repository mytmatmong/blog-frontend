import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ModeratorApiService } from '../../../../core/services/moderator-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  GetModeratorReportsQuery,
  ModeratorPaginationMeta,
  ModeratorReportItem,
  ModeratorReportReason,
  ModeratorReportStatus,
  ModeratorReportTargetType,
} from '../../../../core/models/moderator-api.model';

import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button';
import { TextButtonComponent } from '../../../../shared/components/text-button/text-button';

@Component({
  selector: 'app-manage-reports',
  imports: [
    FormsModule,
    DatePipe,
    TranslatePipe,
    BadgeComponent,
    IconButtonComponent,
    TextButtonComponent,
  ],
  templateUrl: './manage-reports.html',
  styleUrl: './manage-reports.css',
})
export class ManageReports implements OnInit {
  protected readonly ts = inject(TranslationService);
  private readonly moderatorApiService = inject(ModeratorApiService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal<boolean>(true);
  readonly loadingDetail = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly isForbidden = signal<boolean>(false);
  readonly reports = signal<ModeratorReportItem[]>([]);
  readonly meta = signal<ModeratorPaginationMeta | null>(null);

  readonly statusFilter = signal<ModeratorReportStatus>('PENDING');
  readonly targetTypeFilter = signal<ModeratorReportTargetType | ''>('');
  readonly reasonFilter = signal<ModeratorReportReason | ''>('');
  readonly currentPage = signal<number>(1);
  readonly limit = 10;

  readonly activePreviewReport = signal<ModeratorReportItem | null>(null);
  readonly activeResolveReport = signal<ModeratorReportItem | null>(null);
  readonly activeRejectReportItem = signal<ModeratorReportItem | null>(null);

  resolutionNote = '';
  rejectReportNote = '';

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.loading.set(true);
    this.error.set(null);
    this.isForbidden.set(false);

    const query: GetModeratorReportsQuery = {
      status: this.statusFilter(),
      targetType: this.targetTypeFilter() || undefined,
      reason: this.reasonFilter() || undefined,
      page: this.currentPage(),
      limit: this.limit,
    };

    this.moderatorApiService.getModeratorReports(query).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.reports.set(res.data.items);
          this.meta.set(res.data.meta);
        } else {
          this.error.set('Không thể tải danh sách báo cáo vi phạm.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 403) {
          this.isForbidden.set(true);
          this.error.set(
            'Tài khoản hiện tại không có quyền CONTENT_MODERATOR. Backend yêu cầu tài khoản phải có vai trò Moderator để xem danh sách báo cáo.',
          );
          this.toast.show('error', '403 Forbidden', 'Yêu cầu tài khoản Content Moderator');
        } else {
          const errMsg = err?.error?.message || 'Lỗi khi lấy danh sách báo cáo vi phạm.';
          this.error.set(
            typeof errMsg === 'string'
              ? errMsg
              : Array.isArray(errMsg)
              ? errMsg.join(', ')
              : 'Lỗi kết nối.',
          );
          this.toast.show('error', 'Lỗi', 'Không thể tải danh sách báo cáo');
        }
      },
    });
  }

  onStatusChange(status: ModeratorReportStatus) {
    if (this.statusFilter() !== status) {
      this.statusFilter.set(status);
      this.currentPage.set(1);
      this.loadReports();
    }
  }

  onTargetTypeChange() {
    this.currentPage.set(1);
    this.loadReports();
  }

  onReasonChange() {
    this.currentPage.set(1);
    this.loadReports();
  }

  setPage(page: number) {
    const total = this.meta()?.totalPages || 1;
    if (page >= 1 && page <= total && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadReports();
    }
  }

  readonly pageNumbers = computed(() => {
    const totalPages = this.meta()?.totalPages || 1;
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  });

  setPreviewReport(report: ModeratorReportItem) {
    this.activePreviewReport.set(report);
    this.loadingDetail.set(true);

    this.moderatorApiService.getModeratorReportDetail(report.id).subscribe({
      next: (res) => {
        this.loadingDetail.set(false);
        if (res.success && res.data) {
          this.activePreviewReport.set(res.data);
        }
      },
      error: (err) => {
        this.loadingDetail.set(false);
        const errMsg = err?.error?.message || 'Không thể lấy chi tiết báo cáo.';
        this.toast.show(
          'error',
          'Lỗi',
          typeof errMsg === 'string'
            ? errMsg
            : Array.isArray(errMsg)
            ? errMsg.join(', ')
            : 'Lỗi kết nối.',
        );
      },
    });
  }

  closePreviewReport() {
    this.activePreviewReport.set(null);
    this.loadingDetail.set(false);
  }

  setResolveReport(report: ModeratorReportItem) {
    this.activeResolveReport.set(report);
    this.resolutionNote = 'Nội dung vi phạm tiêu chuẩn cộng đồng và đã được ẩn.';
    if (this.activePreviewReport()?.id === report.id) {
      this.closePreviewReport();
    }
  }

  closeResolveModal() {
    this.activeResolveReport.set(null);
    this.resolutionNote = '';
  }

  submitResolve() {
    const note = this.resolutionNote.trim();
    if (!note) {
      this.toast.show('warning', 'Cảnh báo', 'Vui lòng nhập ghi chú xử lý (lý do ẩn nội dung).');
      return;
    }

    const report = this.activeResolveReport();
    if (report) {
      this.actionLoading.set(true);
      this.moderatorApiService.resolveReport(report.id, { resolutionNote: note }).subscribe({
        next: (res) => {
          this.actionLoading.set(false);
          if (res.success) {
            this.toast.show(
              'success',
              'Thành công',
              `Đã xác nhận vi phạm và ẩn nội dung thành công.`,
            );
            if (this.activePreviewReport()?.id === report.id) {
              this.activePreviewReport.set(res.data);
            }
            this.closeResolveModal();
            this.loadReports();
          }
        },
        error: (err) => {
          this.actionLoading.set(false);
          const errMsg = err?.error?.message || 'Không thể xử lý báo cáo vi phạm.';
          const messageStr =
            typeof errMsg === 'string'
              ? errMsg
              : Array.isArray(errMsg)
              ? errMsg.join(', ')
              : 'Lỗi xử lý.';
          this.toast.show('error', 'Lỗi xử lý báo cáo', messageStr);
        },
      });
    }
  }

  setRejectReport(report: ModeratorReportItem) {
    this.activeRejectReportItem.set(report);
    this.rejectReportNote = 'Không tìm thấy nội dung vi phạm trong ngữ cảnh hiện tại.';
    if (this.activePreviewReport()?.id === report.id) {
      this.closePreviewReport();
    }
  }

  closeRejectReportModal() {
    this.activeRejectReportItem.set(null);
    this.rejectReportNote = '';
  }

  submitRejectReport() {
    const note = this.rejectReportNote.trim();
    if (!note) {
      this.toast.show('warning', 'Cảnh báo', 'Vui lòng nhập lý do bác bỏ báo cáo.');
      return;
    }

    const report = this.activeRejectReportItem();
    if (report) {
      this.actionLoading.set(true);
      this.moderatorApiService.rejectReport(report.id, { resolutionNote: note }).subscribe({
        next: (res) => {
          this.actionLoading.set(false);
          if (res.success) {
            this.toast.show(
              'success',
              'Thành công',
              `Đã bác bỏ báo cáo vi phạm #${report.id}.`,
            );
            if (this.activePreviewReport()?.id === report.id) {
              this.activePreviewReport.set(res.data);
            }
            this.closeRejectReportModal();
            this.loadReports();
          }
        },
        error: (err) => {
          this.actionLoading.set(false);
          const errMsg = err?.error?.message || 'Không thể bác bỏ báo cáo.';
          const messageStr =
            typeof errMsg === 'string'
              ? errMsg
              : Array.isArray(errMsg)
              ? errMsg.join(', ')
              : 'Lỗi xử lý.';
          this.toast.show('error', 'Lỗi bác bỏ báo cáo', messageStr);
        },
      });
    }
  }

  getReasonLabel(reason: ModeratorReportReason): string {
    return this.ts.translate('report.reason.' + reason);
  }

  logoutAndSwitchAccount() {
    this.auth.logout();
    this.router.navigate(['/auth']);
  }
}
