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

import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button';
import { TextButtonComponent } from '../../../../shared/components/text-button/text-button';
import { SingleDropdownComponent, DropdownOption } from '../../../../shared/components/single-dropdown/single-dropdown';

@Component({
  selector: 'app-manage-comments',
  imports: [
    FormsModule,
    DatePipe,
    TranslatePipe,
    IconButtonComponent,
    TextButtonComponent,
    SingleDropdownComponent,
  ],
  templateUrl: './manage-comments.html',
  styleUrl: './manage-comments.css',
})
export class ManageComments implements OnInit {
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

  readonly targetTypeOptions = computed<DropdownOption[]>(() => {
    this.ts.currentLang();
    return [
      { label: this.ts.translate('moderator.target_all'), value: '' },
      { label: this.ts.translate('moderator.target_post'), value: 'POST', icon: 'bi bi-file-post' },
      { label: this.ts.translate('moderator.target_comment'), value: 'COMMENT', icon: 'bi bi-chat-left-text' },
    ];
  });

  readonly reasonOptions = computed<DropdownOption[]>(() => {
    this.ts.currentLang();
    return [
      { label: this.ts.translate('moderator.reason_all'), value: '' },
      { label: this.ts.translate('report.reason.SPAM'), value: 'SPAM' },
      { label: this.ts.translate('report.reason.HARASSMENT'), value: 'HARASSMENT' },
      { label: this.ts.translate('report.reason.INAPPROPRIATE'), value: 'INAPPROPRIATE' },
      { label: this.ts.translate('report.reason.COPYRIGHT'), value: 'COPYRIGHT' },
      { label: this.ts.translate('report.reason.MISINFORMATION'), value: 'MISINFORMATION' },
      { label: this.ts.translate('report.reason.OTHER'), value: 'OTHER' },
    ];
  });

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
          this.error.set(this.ts.translate('moderator.load_reports_error'));
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 403) {
          this.isForbidden.set(true);
          this.error.set(this.ts.translate('moderator.forbidden_reports_desc'));
          this.toast.show('error', this.ts.translate('moderator.forbidden_toast_title'), this.ts.translate('moderator.forbidden_toast_desc'));
        } else {
          const errMsg = err?.error?.message || this.ts.translate('moderator.load_reports_api_error');
          this.error.set(
            typeof errMsg === 'string'
              ? errMsg
              : Array.isArray(errMsg)
              ? errMsg.join(', ')
              : this.ts.translate('common.connection_error'),
          );
          this.toast.show('error', this.ts.translate('common.error'), this.ts.translate('moderator.cannot_load_reports'));
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

  readonly pageItems = computed(() => {
    const totalPages = this.meta()?.totalPages || 1;
    const current = this.currentPage();

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => ({ type: 'page' as const, value: i + 1 }));
    }

    let start = Math.max(1, current - 2);
    let end = start + 4;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - 4);
    }

    const items: Array<{ type: 'page' | 'ellipsis'; value: number | null }> = [];
    if (start > 1) {
      items.push({ type: 'ellipsis', value: null });
    }
    for (let p = start; p <= end; p++) {
      items.push({ type: 'page', value: p });
    }
    if (end < totalPages) {
      items.push({ type: 'ellipsis', value: null });
    }
    return items;
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
        const errMsg = err?.error?.message || this.ts.translate('moderator.load_report_detail_error');
        this.toast.show(
          'error',
          this.ts.translate('common.error'),
          typeof errMsg === 'string'
            ? errMsg
            : Array.isArray(errMsg)
            ? errMsg.join(', ')
            : this.ts.translate('common.connection_error'),
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
    this.resolutionNote = this.ts.translate('moderator.default_resolution_note');
  }

  closeResolveModal() {
    this.activeResolveReport.set(null);
    this.resolutionNote = '';
  }

  submitResolve() {
    const note = this.resolutionNote.trim();
    if (!note) {
      this.toast.show('warning', this.ts.translate('common.warning'), this.ts.translate('moderator.resolution_note_required'));
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
              this.ts.translate('common.success'),
              this.ts.translate('moderator.resolve_success'),
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
          const errMsg = err?.error?.message || this.ts.translate('moderator.resolve_error');
          const messageStr =
            typeof errMsg === 'string'
              ? errMsg
              : Array.isArray(errMsg)
              ? errMsg.join(', ')
              : this.ts.translate('common.processing_error');
          this.toast.show('error', this.ts.translate('moderator.resolve_error_title'), messageStr);
        },
      });
    }
  }

  setRejectReport(report: ModeratorReportItem) {
    this.activeRejectReportItem.set(report);
    this.rejectReportNote = this.ts.translate('moderator.default_reject_note');
  }

  closeRejectReportModal() {
    this.activeRejectReportItem.set(null);
    this.rejectReportNote = '';
  }

  submitRejectReport() {
    const note = this.rejectReportNote.trim();
    if (!note) {
      this.toast.show('warning', this.ts.translate('common.warning'), this.ts.translate('moderator.reject_report_reason_required'));
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
              this.ts.translate('common.success'),
              `${this.ts.translate('moderator.reject_report_success_prefix')}${report.id}.`,
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
          const errMsg = err?.error?.message || this.ts.translate('moderator.reject_report_error');
          const messageStr =
            typeof errMsg === 'string'
              ? errMsg
              : Array.isArray(errMsg)
              ? errMsg.join(', ')
              : this.ts.translate('common.processing_error');
          this.toast.show('error', this.ts.translate('moderator.reject_report_error_title'), messageStr);
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
