import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  BlogOwnerDashboardData,
  BlogOwnerDashboardPost,
} from '../../../../core/models/blog-owner.model';
import {
  OwnerPostPreviewComponent,
} from '../../../../shared/components/owner-post-preview/owner-post-preview';
import { PostStatus } from '../../../../core/models/post.model';
import { BlogOwnerApiService } from '../../../../core/services/blog-owner-api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

type ChartInstance = {
  destroy(): void;
};

type ChartConstructor = new (
  canvas: HTMLCanvasElement,
  config: Record<string, unknown>,
) => ChartInstance;

@Component({
  selector: 'app-owner-dashboard',

  imports: [
    RouterLink,
    DecimalPipe,
    TranslatePipe,
    OwnerPostPreviewComponent,
  ],

  templateUrl: './owner-dashboard.html',
  styleUrl: './owner-dashboard.css',
})

export class OwnerDashboard implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(BlogOwnerApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly ts = inject(TranslationService);

  @ViewChild('interactionChart')
  private chartCanvas?: ElementRef<HTMLCanvasElement>;

  readonly dashboard = signal<BlogOwnerDashboardData | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly sortCriteria = signal<'views' | 'likes'>('views');
  readonly copySuccess = signal(false);
  readonly activePreviewPostId =
    signal<number | null>(null);
  readonly isShareModalOpen = signal(false);
  readonly deletingPostId = signal<number | null>(null);
  readonly publicBlogUrl =
    typeof window !== 'undefined' ? window.location.origin : '';

  readonly featuredPosts = computed<BlogOwnerDashboardPost[]>(() => {
    const data = this.dashboard();
    if (!data) {
      return [];
    }

    return this.sortCriteria() === 'views'
      ? data.featuredPosts.byViews
      : data.featuredPosts.byLikes;
  });

  private chartInstance: ChartInstance | null = null;
  private viewReady = false;

  constructor() {
    effect(() => {
      this.ts.currentLang();
      this.auth.isDarkMode();
      this.dashboard();
      if (this.viewReady) {
        queueMicrotask(() => this.renderChart());
      }
    });
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderChart();
  }

  ngOnDestroy(): void {
    this.chartInstance?.destroy();
    this.chartInstance = null;
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.api.getDashboard().subscribe({
      next: (response) => {
        this.dashboard.set(response.data);
        this.isLoading.set(false);
        queueMicrotask(() => this.renderChart());
      },
      error: (error: unknown) => {
        const message = getApiErrorMessage(
          error,
          this.ts.translate('owner_dashboard.load_error'),
        );
        this.loadError.set(message);
        this.isLoading.set(false);
      },
    });
  }

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'views' || value === 'likes') {
      this.sortCriteria.set(value);
    }
  }

  openPreview(postId: number): void {
    this.activePreviewPostId.set(
      postId,
    );
  }

  closePreviewModal(): void {
    this.activePreviewPostId.set(
      null,
    );
  }

  deletePost(post: BlogOwnerDashboardPost): void {
    if (!confirm(this.ts.translate('post.delete_confirm'))) {
      return;
    }

    this.deletingPostId.set(post.id);

    this.api.deletePost(post.id).subscribe({
      next: (response) => {
        this.toast.success(
          response.data.message,
          this.ts.translate('common.success'),
        );
        this.deletingPostId.set(null);
        this.loadDashboard();
      },
      error: (error: unknown) => {
        this.deletingPostId.set(null);
        this.toast.error(
          getApiErrorMessage(error, this.ts.translate('posts.delete_error')),
          this.ts.translate('common.error'),
        );
      },
    });
  }

  openShareModal(): void {
    this.isShareModalOpen.set(true);
  }

  closeShareModal(): void {
    this.isShareModalOpen.set(false);
  }

  copyBlogLink(): void {
    const blogLinkInput = document.getElementById(
      'blogLinkInput',
    ) as HTMLInputElement | null;

    if (!blogLinkInput) {
      return;
    }

    navigator.clipboard.writeText(blogLinkInput.value).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    });
  }

  statusLabel(status: PostStatus): string {
    return this.ts.translate(`post_status.${status.toLowerCase()}`);
  }

  statusClass(status: PostStatus): string {
    switch (status) {
      case 'PUBLISH':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'PENDING_REVIEW':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      case 'REJECT':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  }

  private renderChart(): void {
    const data = this.dashboard();
    const canvas = this.chartCanvas?.nativeElement;
    const ChartClass = (
      globalThis as typeof globalThis & { Chart?: ChartConstructor }
    ).Chart;

    if (!this.viewReady || !data || !canvas || !ChartClass) {
      return;
    }

    const rootStyles =
      typeof document !== 'undefined'
        ? getComputedStyle(document.documentElement)
        : null;
    const textColor =
      rootStyles?.getPropertyValue('--text-muted').trim() || '#667085';
    const gridColor =
      rootStyles?.getPropertyValue('--border-color').trim() || '#e5e8ef';

    this.chartInstance?.destroy();

    this.chartInstance = new ChartClass(canvas, {
      type: 'line',
      data: {
        labels: data.last7Days.map((item) => this.formatChartDate(item.date)),
        datasets: [
          {
            label: this.ts.translate('table.views'),
            data: data.last7Days.map((item) => item.views),
            borderColor: '#5b5bd6',
            backgroundColor: 'rgba(91, 91, 214, 0.10)',
            pointBackgroundColor: '#5b5bd6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2.5,
            fill: true,
            tension: 0.42,
          },
          {
            label: this.ts.translate('table.likes'),
            data: data.last7Days.map((item) => item.likes),
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.06)',
            pointBackgroundColor: '#f43f5e',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2.5,
            fill: true,
            tension: 0.42,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: this.auth.isDarkMode() ? '#1b1f2c' : '#ffffff',
            titleColor: this.auth.isDarkMode() ? '#f3f4f7' : '#171923',
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            displayColors: true,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            border: {
              display: false,
            },
            ticks: {
              color: textColor,
              font: { size: 10 },
            },
          },
          y: {
            beginAtZero: true,
            border: {
              display: false,
            },
            grid: {
              color: gridColor,
              drawTicks: false,
            },
            ticks: {
              color: textColor,
              padding: 10,
              font: { size: 10 },
            },
          },
        },
      },
    });
  }

  private formatChartDate(date: string): string {
    const [year, month, day] = date.split('-');
    if (!year || !month || !day) {
      return date;
    }

    return this.ts.currentLang() === 'EN'
      ? `${month}/${day}`
      : `${day}/${month}`;
  }
}
