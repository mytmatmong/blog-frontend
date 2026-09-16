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
import { DonutChartComponent } from '../../../../shared/components/donut-chart/donut-chart';
import { LineChartComponent, ChartPeriod } from '../../../../shared/components/line-chart/line-chart';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, TranslatePipe, DonutChartComponent, LineChartComponent, StatCardComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private readonly adminApiService = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translationService = inject(TranslationService);

  readonly dashboardData = signal<AdminDashboardData | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly selectedGrowthPeriod = signal<ChartPeriod>('7d');

  readonly totalNewUsers = computed(() =>
    (this.dashboardData()?.userGrowth?.data ?? []).reduce((total, value) => total + value, 0),
  );
  readonly totalPosts = computed(() =>
    (this.dashboardData()?.postsByLanguage?.details ?? []).reduce(
      (total, language) => total + language.postCount,
      0,
    ),
  );

  readonly langChartData = computed(() => this.dashboardData()?.postsByLanguage?.data ?? []);
  readonly langChartLabels = computed(() => {
    const data = this.dashboardData()?.postsByLanguage;
    if (!data) return [];
    const languageLabels = data.details.map((language) =>
      this.getLanguageDisplayName(language.code, language.name),
    );
    return languageLabels.length === data.data.length ? languageLabels : data.labels;
  });

  readonly userGrowthData = computed(() => this.dashboardData()?.userGrowth?.data ?? []);
  readonly userGrowthLabels = computed(() => {
    const data = this.dashboardData();
    if (!data) return [];
    const locale = this.translationService.localeTag();
    return data.userGrowth.details.length === data.userGrowth.data.length
      ? data.userGrowth.details.map((detail) => {
          const date = new Date(detail.date);
          return Number.isNaN(date.getTime())
            ? detail.label
            : new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
        })
      : data.userGrowth.labels;
  });

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

  ngOnInit() {
    this.loadDashboardData();
  }

  getLanguageDisplayName(code: string, fallback: string): string {
    try {
      const locale = this.translationService.localeTag();
      return new Intl.DisplayNames([locale], { type: 'language' }).of(code) || fallback;
    } catch {
      return fallback;
    }
  }
}
