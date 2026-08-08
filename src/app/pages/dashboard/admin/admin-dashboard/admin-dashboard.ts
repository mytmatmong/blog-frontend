import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AdminDashboardData } from '../../../../core/models/admin-api.model';
import { AdminApiService } from '../../../../core/services/admin-api.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

declare var Chart: any;

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private readonly adminApiService = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dashboardData = signal<AdminDashboardData | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  private userGrowthChartInstance: any = null;
  private langPieChartInstance: any = null;

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminApiService
      .getAdminDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res?.success && res.data) {
            this.dashboardData.set(res.data);
            setTimeout(() => {
              this.initCharts(res.data);
            }, 50);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            typeof err?.error?.message === 'string'
              ? err.error.message
              : 'Không thể tải dữ liệu dashboard admin.',
          );
        },
      });
  }

  initCharts(data: AdminDashboardData) {
    if (typeof Chart === 'undefined') {
      return;
    }

    // 1. Line Chart - User Growth
    const canvasLine = document.getElementById(
      'userGrowthChart',
    ) as HTMLCanvasElement;
    if (canvasLine) {
      if (this.userGrowthChartInstance) {
        this.userGrowthChartInstance.destroy();
      }

      this.userGrowthChartInstance = new Chart(canvasLine, {
        type: 'line',
        data: {
          labels: data.userGrowth.labels,
          datasets: [
            {
              label: 'Người dùng mới',
              data: data.userGrowth.data,
              borderColor: '#0d6efd',
              backgroundColor: 'rgba(13, 110, 253, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
          },
        },
      });
    }

    // 2. Doughnut Chart - Language Allocation
    const canvasPie = document.getElementById(
      'langPieChart',
    ) as HTMLCanvasElement;
    if (canvasPie) {
      if (this.langPieChartInstance) {
        this.langPieChartInstance.destroy();
      }

      const colors = [
        '#0d6efd',
        '#10b981',
        '#f59e0b',
        '#6366f1',
        '#ec4899',
        '#14b8a6',
        '#8b5cf6',
      ];
      const bgColors = data.postsByLanguage.labels.map(
        (_, i) => colors[i % colors.length],
      );

      this.langPieChartInstance = new Chart(canvasPie, {
        type: 'doughnut',
        data: {
          labels: data.postsByLanguage.labels,
          datasets: [
            {
              data: data.postsByLanguage.data,
              backgroundColor: bgColors,
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          cutout: '70%',
          plugins: {
            legend: { position: 'bottom' },
          },
        },
      });
    }
  }
}
