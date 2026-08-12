import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AdminDashboardData } from '../../../../core/models/admin-api.model';
import { AdminApiService } from '../../../../core/services/admin-api.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

declare var Chart: any;

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit, OnDestroy {
  private readonly adminApiService = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translationService = inject(TranslationService);

  readonly dashboardData = signal<AdminDashboardData | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly totalNewUsers = computed(() =>
    (this.dashboardData()?.userGrowth?.data ?? []).reduce((total, value) => total + value, 0),
  );
  readonly totalPosts = computed(() =>
    (this.dashboardData()?.postsByLanguage?.details ?? []).reduce(
      (total, language) => total + language.postCount,
      0,
    ),
  );

  private userGrowthChartInstance: any = null;
  private langPieChartInstance: any = null;

  constructor() {
    effect((onCleanup) => {
      this.translationService.currentLang();
      const data = this.dashboardData();
      if (!data) return;

      const timerId = setTimeout(() => this.initCharts(data));
      onCleanup(() => clearTimeout(timerId));
    });
  }

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroyCharts();
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
          } else {
            this.errorMessage.set(
              this.translationService.translate('admin_dashboard.invalid_data'),
            );
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            typeof err?.error?.message === 'string'
              ? err.error.message
              : this.translationService.translate('admin_dashboard.load_error'),
          );
        },
      });
  }

  initCharts(data: AdminDashboardData) {
    if (typeof Chart === 'undefined') {
      return;
    }

    const styles = getComputedStyle(document.documentElement);
    const textColor = styles.getPropertyValue('--text-muted').trim() || '#677085';
    const borderColor = styles.getPropertyValue('--border-color').trim() || '#e9edf4';
    const brandColor = '#0d9488';
    const locale = this.translationService.currentLang() === 'EN' ? 'en-US' : 'vi-VN';
    const growthLabels =
      data.userGrowth.details.length === data.userGrowth.data.length
        ? data.userGrowth.details.map((detail) => {
            const date = new Date(detail.date);
            return Number.isNaN(date.getTime())
              ? detail.label
              : new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
          })
        : data.userGrowth.labels;

    // 1. Line Chart - User Growth
    const canvasLine = document.getElementById('userGrowthChart') as HTMLCanvasElement;
    if (canvasLine) {
      if (this.userGrowthChartInstance) {
        this.userGrowthChartInstance.destroy();
      }

      this.userGrowthChartInstance = new Chart(canvasLine, {
        type: 'line',
        data: {
          labels: growthLabels,
          datasets: [
            {
              label: this.translationService.translate('admin_dashboard.new_users'),
              data: data.userGrowth.data,
              borderColor: brandColor,
              backgroundColor: 'rgba(13, 148, 136, 0.1)',
              borderWidth: 2.5,
              fill: true,
              tension: 0.38,
              pointRadius: 3,
              pointHoverRadius: 5,
              pointBackgroundColor: brandColor,
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: { display: false },
            tooltip: {
              displayColors: false,
              padding: 10,
              callbacks: {
                label: (context: any) =>
                  `${context.parsed.y} ${this.translationService.translate('admin_dashboard.new_users')}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: { color: textColor, font: { size: 10 } },
            },
            y: {
              beginAtZero: true,
              border: { display: false },
              grid: { color: borderColor, drawTicks: false },
              ticks: { precision: 0, color: textColor, padding: 10, font: { size: 10 } },
            },
          },
        },
      });
    }

    // 2. Doughnut Chart - Language Allocation
    const canvasPie = document.getElementById('langPieChart') as HTMLCanvasElement;
    if (canvasPie) {
      if (this.langPieChartInstance) {
        this.langPieChartInstance.destroy();
      }

      const colors = [brandColor, '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6'];
      const bgColors = data.postsByLanguage.labels.map((_, i) => colors[i % colors.length]);
      const languageLabels = data.postsByLanguage.details.map((language) =>
        this.getLanguageDisplayName(language.code, language.name),
      );

      this.langPieChartInstance = new Chart(canvasPie, {
        type: 'doughnut',
        data: {
          labels:
            languageLabels.length === data.postsByLanguage.data.length
              ? languageLabels
              : data.postsByLanguage.labels,
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
          maintainAspectRatio: false,
          cutout: '76%',
          plugins: {
            legend: { display: false },
            tooltip: {
              padding: 10,
              callbacks: {
                label: (context: any) =>
                  ` ${context.label}: ${context.parsed} ${this.translationService.translate('admin_dashboard.posts')}`,
              },
            },
          },
        },
      });
    }
  }

  getLanguageDisplayName(code: string, fallback: string): string {
    try {
      const locale = this.translationService.currentLang() === 'EN' ? 'en-US' : 'vi-VN';
      return new Intl.DisplayNames([locale], { type: 'language' }).of(code) || fallback;
    } catch {
      return fallback;
    }
  }

  private destroyCharts() {
    this.userGrowthChartInstance?.destroy();
    this.langPieChartInstance?.destroy();
    this.userGrowthChartInstance = null;
    this.langPieChartInstance = null;
  }
}
