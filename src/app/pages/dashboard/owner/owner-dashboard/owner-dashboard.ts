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
import { Router, RouterLink } from '@angular/router';
import {
  BlogOwnerDashboardActivity,
  BlogOwnerDashboardFeatured,
  BlogOwnerDashboardFeaturedSort,
  BlogOwnerDashboardPost,
  BlogOwnerDashboardSummary,
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
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { BadgeComponent, BadgeColor } from '../../../../shared/components/badge/badge';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button';

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
    ConfirmDialog,
    BadgeComponent,
    IconButtonComponent,
  ],

  templateUrl: './owner-dashboard.html',
  styleUrl: './owner-dashboard.css',
})

export class OwnerDashboard implements OnInit, AfterViewInit, OnDestroy {
  private readonly api = inject(BlogOwnerApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly ts = inject(TranslationService);

  @ViewChild('interactionChart')
  private chartCanvas?: ElementRef<HTMLCanvasElement>;

  readonly summary = signal<BlogOwnerDashboardSummary | null>(null);
  readonly activity = signal<BlogOwnerDashboardActivity | null>(null);
  readonly featured = signal<BlogOwnerDashboardFeatured | null>(null);

  readonly summaryLoading = signal(true);
  readonly activityLoading = signal(true);
  readonly featuredLoading = signal(true);

  readonly summaryError = signal<string | null>(null);
  readonly activityError = signal<string | null>(null);
  readonly featuredError = signal<string | null>(null);

  readonly sortCriteria =
    signal<BlogOwnerDashboardFeaturedSort>('views');
  readonly copySuccess = signal(false);
  readonly activePreviewPostId =
    signal<number | null>(null);
  readonly isShareModalOpen = signal(false);
  readonly deletingPostId = signal<number | null>(null);
  readonly pendingDeletePost = signal<BlogOwnerDashboardPost | null>(null);
  readonly publicBlogUrl =
    typeof window !== 'undefined' ? window.location.origin : '';

readonly featuredPosts = computed<BlogOwnerDashboardPost[]>(
  () => this.featured()?.posts ?? [],
);
  private featuredRequestVersion = 0;
  private chartInstance: ChartInstance | null = null;
  private viewReady = false;

  constructor() {
    effect(() => {
      this.ts.currentLang();
      this.auth.isDarkMode();
      this.activity();

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
  this.loadSummary();
  this.loadActivity();
  this.loadFeatured(this.sortCriteria());
}

loadSummary(): void {
  this.summaryLoading.set(true);
  this.summaryError.set(null);

  this.api.getDashboardSummary().subscribe({
    next: ({ data }) => {
      this.summary.set(data);
      this.summaryLoading.set(false);
    },
    error: (error: unknown) => {
      this.summaryError.set(
        getApiErrorMessage(
          error,
          this.ts.translate('owner_dashboard.load_error'),
        ),
      );
      this.summaryLoading.set(false);
    },
  });
}

loadActivity(days = 7): void {
  this.activityLoading.set(true);
  this.activityError.set(null);

  this.api.getDashboardActivity(days).subscribe({
    next: ({ data }) => {
      this.activity.set(data);
      this.activityLoading.set(false);

      queueMicrotask(() => this.renderChart());
    },
    error: (error: unknown) => {
      this.activityError.set(
        getApiErrorMessage(
          error,
          this.ts.translate('owner_dashboard.load_error'),
        ),
      );
      this.activityLoading.set(false);
    },
  });
}

loadFeatured(
  sort: BlogOwnerDashboardFeaturedSort = this.sortCriteria(),
): void {
  const requestVersion = ++this.featuredRequestVersion;

  this.featuredLoading.set(true);
  this.featuredError.set(null);

  this.api.getDashboardFeatured(sort, 5).subscribe({
    next: ({ data }) => {
      /**
       * Nếu user đổi views -> likes quá nhanh,
       * response request cũ không được ghi đè request mới.
       */
      if (requestVersion !== this.featuredRequestVersion) {
        return;
      }

      this.featured.set(data);
      this.featuredLoading.set(false);
    },
    error: (error: unknown) => {
      if (requestVersion !== this.featuredRequestVersion) {
        return;
      }

      this.featuredError.set(
        getApiErrorMessage(
          error,
          this.ts.translate('owner_dashboard.load_error'),
        ),
      );
      this.featuredLoading.set(false);
    },
  });
}

  onSortChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (value !== 'views' && value !== 'likes') {
      return;
    }

    if (value === this.sortCriteria()) {
      return;
    }

    this.sortCriteria.set(value);
    this.loadFeatured(value);
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
    if (this.deletingPostId() !== null) {
      return;
    }

    this.pendingDeletePost.set(post);
  }

  closeDeleteConfirmation(): void {
    if (this.deletingPostId() === null) {
      this.pendingDeletePost.set(null);
    }
  }

  confirmDeletePost(): void {
    const post = this.pendingDeletePost();

    if (!post || this.deletingPostId() !== null) {
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
        this.pendingDeletePost.set(null);
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

  statusBadgeColor(status: PostStatus): BadgeColor {
    switch (status) {
      case 'PUBLISH':
        return 'green';
      case 'PENDING_REVIEW':
        return 'yellow';
      case 'REJECT':
        return 'red';
      default:
        return 'gray';
    }
  }

  navigateToEdit(postId: number): void {
    this.router.navigate(['/dashboard/owner/edit-post', postId]);
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
    const data = this.activity();
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
      const chartValues = data.last7Days.flatMap((item) => [
        item.views,
        item.likes,
    ]);

  const minChartValue = Math.min(0, ...chartValues);
  const maxChartValue = Math.max(0, ...chartValues);
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
            beginAtZero: false,
            suggestedMin: minChartValue,
            suggestedMax:
              minChartValue === maxChartValue
                ? maxChartValue + 1
                : maxChartValue,
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
