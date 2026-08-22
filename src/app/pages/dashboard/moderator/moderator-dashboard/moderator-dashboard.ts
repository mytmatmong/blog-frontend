import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ModeratorApiService } from '../../../../core/services/moderator-api.service';
import { ModeratorDashboardData } from '../../../../core/models/moderator-api.model';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';

declare var Chart: any;

@Component({
  selector: 'app-moderator-dashboard',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './moderator-dashboard.html',
  styleUrl: './moderator-dashboard.css',
})
export class ModeratorDashboard implements OnInit, OnDestroy {
  private readonly moderatorApiService = inject(ModeratorApiService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly isForbidden = signal<boolean>(false);
  readonly dashboardData = signal<ModeratorDashboardData | null>(null);

  private reportsChartInstance: any = null;
  private reasonChartInstance: any = null;
  private statusChartInstance: any = null;

  private readonly chartThemeEffect = effect(() => {
    // Theo dõi cả dữ liệu lẫn theme để Chart.js đổi màu ngay lập tức.
    this.auth.isDarkMode();
    const data = this.dashboardData();

    if (data) {
      setTimeout(() => this.initCharts(data));
    }
  });

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  loadDashboardData() {
    this.loading.set(true);
    this.error.set(null);
    this.isForbidden.set(false);

    this.moderatorApiService.getModeratorDashboard().subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success && response.data) {
          this.dashboardData.set(response.data);
        } else {
          this.error.set('Không thể lấy dữ liệu Moderator Dashboard.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 403) {
          this.isForbidden.set(true);
          this.error.set('Tài khoản hiện tại không có quyền CONTENT_MODERATOR. Backend yêu cầu tài khoản phải có vai trò Moderator để truy cập API này (tài khoản SUPER_ADMIN không tự động có quyền Moderator).');
          this.toast.show('error', '403 Forbidden', 'Yêu cầu tài khoản Content Moderator');
        } else {
          const errMsg = err?.error?.message || 'Lỗi khi kết nối đến máy chủ.';
          this.error.set(typeof errMsg === 'string' ? errMsg : Array.isArray(errMsg) ? errMsg.join(', ') : 'Lỗi kết nối.');
          this.toast.show('error', 'Lỗi', 'Không thể tải dữ liệu Moderator Dashboard');
        }
      },
    });
  }

  logoutAndSwitchAccount() {
    this.auth.logout();
    this.router.navigate(['/auth']);
  }

  initCharts(data: ModeratorDashboardData) {
    if (typeof Chart === 'undefined') return;

    this.destroyCharts();

    const isDark = this.auth.isDarkMode();
    const chartText = isDark ? '#cbd5e1' : '#64748b';
    const chartGrid = isDark
      ? 'rgba(148, 163, 184, 0.16)'
      : 'rgba(100, 116, 139, 0.18)';
    const chartBorder = isDark ? '#171a28' : '#ffffff';
    const tooltipBackground = isDark ? '#0f172a' : '#111827';
    const legendOptions = {
      labels: {
        color: chartText,
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 8,
        padding: 16,
      },
    };

    // 1. Stacked Bar Chart - Report 7 ngày qua
    const canvasBar = document.getElementById('reportsChart') as HTMLCanvasElement;
    if (canvasBar && data.last7Days && data.last7Days.length > 0) {
      const labels = data.last7Days.map((item) => {
        if (!item.date) return '';
        const parts = item.date.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;
      });
      const postReportsData = data.last7Days.map((item) => item.postReports);
      const commentReportsData = data.last7Days.map((item) => item.commentReports);

      this.reportsChartInstance = new Chart(canvasBar, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Report bài viết',
              data: postReportsData,
              backgroundColor: '#0ea5e9',
              borderRadius: 6,
            },
            {
              label: 'Report bình luận',
              data: commentReportsData,
              backgroundColor: '#f59e0b',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              stacked: true,
              ticks: { color: chartText, stepSize: 1 },
              grid: { color: chartGrid },
              border: { color: chartGrid },
            },
            x: {
              stacked: true,
              ticks: { color: chartText },
              grid: { color: chartGrid },
              border: { color: chartGrid },
            },
          },
          plugins: {
            legend: { position: 'bottom', ...legendOptions },
            tooltip: {
              backgroundColor: tooltipBackground,
              titleColor: '#f8fafc',
              bodyColor: '#e2e8f0',
            },
          },
        },
      });
    }

    // 2. Doughnut Chart - Lý do báo cáo
    const canvasReasonPie = document.getElementById('moderationPieChart') as HTMLCanvasElement;
    if (canvasReasonPie && data.reportReasonCounts) {
      const reasons = data.reportReasonCounts;
      const reasonLabels = [
        'Spam',
        'Quấy rối',
        'Không phù hợp',
        'Bản quyền',
        'Thông tin sai lệch',
        'Khác',
      ];
      const reasonData = [
        reasons.spam || 0,
        reasons.harassment || 0,
        reasons.inappropriate || 0,
        reasons.copyright || 0,
        reasons.misinformation || 0,
        reasons.other || 0,
      ];

      this.reasonChartInstance = new Chart(canvasReasonPie, {
        type: 'doughnut',
        data: {
          labels: reasonLabels,
          datasets: [
            {
              data: reasonData,
              backgroundColor: [
                '#ef4444',
                '#f59e0b',
                '#8b5cf6',
                '#3b82f6',
                '#ec4899',
                '#6b7280',
              ],
              borderColor: chartBorder,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', ...legendOptions },
            tooltip: {
              backgroundColor: tooltipBackground,
              titleColor: '#f8fafc',
              bodyColor: '#e2e8f0',
            },
          },
        },
      });
    }

    // 3. Status Pie Chart - Trạng thái báo cáo
    const canvasStatusPie = document.getElementById('statusPieChart') as HTMLCanvasElement;
    if (canvasStatusPie && data.reportStatusCounts) {
      const statuses = data.reportStatusCounts;
      this.statusChartInstance = new Chart(canvasStatusPie, {
        type: 'pie',
        data: {
          labels: ['Đang chờ (Pending)', 'Đã chấp nhận (Resolved)', 'Đã bác bỏ (Rejected)'],
          datasets: [
            {
              data: [statuses.pending || 0, statuses.resolved || 0, statuses.rejected || 0],
              backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
              borderColor: chartBorder,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', ...legendOptions },
            tooltip: {
              backgroundColor: tooltipBackground,
              titleColor: '#f8fafc',
              bodyColor: '#e2e8f0',
            },
          },
        },
      });
    }
  }

  private destroyCharts(): void {
    for (const chart of [
      this.reportsChartInstance,
      this.reasonChartInstance,
      this.statusChartInstance,
    ]) {
      chart?.destroy();
    }

    this.reportsChartInstance = null;
    this.reasonChartInstance = null;
    this.statusChartInstance = null;
  }
}
