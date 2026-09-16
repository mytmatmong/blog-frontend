import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DonutChartComponent } from '../../../../shared/components/donut-chart/donut-chart';
import { LineChartComponent, LineChartDataset, ChartPeriod } from '../../../../shared/components/line-chart/line-chart';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card';
import { ModeratorApiService } from '../../../../core/services/moderator-api.service';
import {
  ModeratorDashboardOverview,
  ModeratorDashboardReportStats,
  ModeratorDashboardReportTrend,
} from '../../../../core/models/moderator-api.model';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslationService } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-moderator-dashboard',
  imports: [RouterLink, TranslatePipe, DonutChartComponent, LineChartComponent, StatCardComponent],
  templateUrl: './moderator-dashboard.html',
  styleUrl: './moderator-dashboard.css',
})
export class ModeratorDashboard implements OnInit {
  private readonly moderatorApiService = inject(ModeratorApiService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ts = inject(TranslationService);

  readonly isForbidden = signal<boolean>(false);

  readonly overviewLoading = signal<boolean>(true);
  readonly overviewError = signal<string | null>(null);
  readonly overviewData = signal<ModeratorDashboardOverview | null>(null);

  readonly reportStatsLoading = signal<boolean>(true);
  readonly reportStatsError = signal<string | null>(null);
  readonly reportStatsData = signal<ModeratorDashboardReportStats | null>(null);

  readonly reportTrendLoading = signal<boolean>(true);
  readonly reportTrendError = signal<string | null>(null);
  readonly reportTrendData = signal<ModeratorDashboardReportTrend | null>(null);
  readonly selectedTrendPeriod = signal<ChartPeriod>('7d');

  readonly reasonChartLabels = computed(() => {
    this.ts.currentLang();
    return [
      this.ts.translate('report.reason.SPAM'),
      this.ts.translate('report.reason.HARASSMENT'),
      this.ts.translate('report.reason.INAPPROPRIATE'),
      this.ts.translate('report.reason.COPYRIGHT'),
      this.ts.translate('report.reason.MISINFORMATION'),
      this.ts.translate('report.reason.OTHER'),
    ];
  });

  readonly reasonChartData = computed(() => {
    const reasons = this.reportStatsData()?.reportReasonCounts;
    if (!reasons) return [];
    return [
      reasons.spam || 0,
      reasons.harassment || 0,
      reasons.inappropriate || 0,
      reasons.copyright || 0,
      reasons.misinformation || 0,
      reasons.other || 0,
    ];
  });

  readonly statusChartLabels = computed(() => {
    this.ts.currentLang();
    return [
      this.ts.translate('moderator.status_pending_label'),
      this.ts.translate('moderator.status_resolved_label'),
      this.ts.translate('moderator.status_rejected_label'),
    ];
  });

  readonly statusChartData = computed(() => {
    const statuses = this.reportStatsData()?.reportStatusCounts;
    if (!statuses) return [];
    return [
      statuses.pending || 0,
      statuses.resolved || 0,
      statuses.rejected || 0,
    ];
  });

  readonly reportTrendLabels = computed(() => {
    const trend = this.reportTrendData()?.last7Days;
    if (!trend) return [];
    return trend.map((item) => {
      if (!item.date) return '';
      const parts = item.date.split('-');
      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;
    });
  });

  readonly reportTrendDatasets = computed<LineChartDataset[]>(() => {
    this.ts.currentLang();
    const trend = this.reportTrendData()?.last7Days;
    if (!trend) return [];
    return [
      {
        label: this.ts.translate('moderator.post_reports_label'),
        data: trend.map((item) => item.postReports),
      },
      {
        label: this.ts.translate('moderator.comment_reports_label'),
        data: trend.map((item) => item.commentReports),
      },
    ];
  });

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isForbidden.set(false);

  this.loadOverview();
  this.loadReportStats();
  this.loadReportTrend();
}

loadOverview() {
  this.overviewLoading.set(true);
  this.overviewError.set(null);

  this.moderatorApiService.getModeratorDashboardOverview().subscribe({
    next: (response) => {
      this.overviewLoading.set(false);

      if (response.success && response.data) {
        this.overviewData.set(response.data);
      } else {
        this.overviewError.set(
          this.ts.translate('moderator.load_dashboard_error'),
        );
      }
    },
    error: (err) => {
      this.overviewLoading.set(false);
      this.handleDashboardError(err, this.overviewError);
    },
  });
}

loadReportStats() {
  this.reportStatsLoading.set(true);
  this.reportStatsError.set(null);

  this.moderatorApiService.getModeratorDashboardReportStats().subscribe({
    next: (response) => {
      this.reportStatsLoading.set(false);

      if (response.success && response.data) {
        this.reportStatsData.set(response.data);
      } else {
        this.reportStatsError.set(
          this.ts.translate('moderator.load_dashboard_error'),
        );
      }
    },
    error: (err) => {
      this.reportStatsLoading.set(false);
      this.handleDashboardError(err, this.reportStatsError);
    },
  });
}

loadReportTrend() {
  this.reportTrendLoading.set(true);
  this.reportTrendError.set(null);

  this.moderatorApiService.getModeratorDashboardReportTrend().subscribe({
    next: (response) => {
      this.reportTrendLoading.set(false);

      if (response.success && response.data) {
        this.reportTrendData.set(response.data);
      } else {
        this.reportTrendError.set(
          this.ts.translate('moderator.load_dashboard_error'),
        );
      }
    },
    error: (err) => {
      this.reportTrendLoading.set(false);
      this.handleDashboardError(err, this.reportTrendError);
    },
  });
}
private handleDashboardError(
  err: any,
  errorSignal: {
    set: (value: string | null) => void;
  },
) {
  if (err?.status === 403) {
    this.isForbidden.set(true);

    errorSignal.set(
      this.ts.translate('moderator.forbidden_dashboard_desc'),
    );

    return;
  }

  const errMsg =
    err?.error?.message ||
    this.ts.translate('common.backend_unreachable');

  errorSignal.set(
    typeof errMsg === 'string'
      ? errMsg
      : Array.isArray(errMsg)
        ? errMsg.join(', ')
        : this.ts.translate('common.connection_error'),
  );
}

  logoutAndSwitchAccount() {
    this.auth.logout();
    this.router.navigate(['/auth']);
  }
}
