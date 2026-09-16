import {
  booleanAttribute,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  model,
  NgZone,
  output,
  viewChild,
} from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';

declare var Chart: any;

export interface LineChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
}

export type ChartPeriod = '7d' | '30d' | '1y';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  templateUrl: './line-chart.html',
  styleUrl: './line-chart.css',
})
export class LineChartComponent {
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService, { optional: true });
  private readonly ts = inject(TranslationService, { optional: true });

  readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  /** Nhãn trục hoành X */
  readonly labels = input<string[]>([]);

  /** Dữ liệu số cho biểu đồ 1 đường đơn */
  readonly data = input<number[] | undefined>(undefined);

  /** Nhãn cho biểu đồ 1 đường đơn */
  readonly label = input<string>('');

  /** Danh sách nhiều đường dữ liệu (dành cho biểu đồ nhiều đường) */
  readonly datasets = input<LineChartDataset[] | undefined>(undefined);

  /** Bộ màu sắc tích hợp: 'growth' | 'interaction' | 'reports' | 'default' */
  readonly colorScheme = input<'growth' | 'interaction' | 'reports' | 'default' | string>('default');

  /** Hiển thị bộ nút chọn thời gian (1 tuần, 1 tháng, 1 năm) */
  readonly showPeriodSelector = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  /** Chu kỳ thời gian được chọn: '7d' | '30d' | '1y' */
  readonly selectedPeriod = model<ChartPeriod>('7d');

  /** Event phát ra khi người dùng đổi chu kỳ thời gian */
  readonly periodChange = output<ChartPeriod>();

  /** Hiển thị chú giải (legend) */
  readonly showLegend = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  /** Vị trí chú giải: 'top' | 'bottom' */
  readonly legendPosition = input<'top' | 'bottom'>('top');

  /** Làm mềm đường cong (mặc định true) */
  readonly curved = input<boolean, boolean | string>(true, { transform: booleanAttribute });

  /** Đổ màu mờ bên dưới đường kẻ (fill area) */
  readonly fill = input<boolean, boolean | string>(true, { transform: booleanAttribute });

  /** Đơn vị hiển thị trong tooltip */
  readonly unit = input<string>('');

  /** Chiều cao khung biểu đồ (px hoặc CSS string) */
  readonly height = input<number | string>(260);

  /** Thông điệp hiển thị khi không có dữ liệu */
  readonly emptyMessage = input<string>('Chưa có dữ liệu');

  /** Nhãn trợ năng cho canvas */
  readonly ariaLabel = input<string>('Biểu đồ đường');

  /** Bộ màu tích hợp sẵn */
  readonly builtInPalettes: Record<string, { border: string; bg: string }[]> = {
    // Tăng trưởng người dùng (Admin)
    growth: [
      { border: '#0d9488', bg: 'rgba(13, 148, 136, 0.12)' },
    ],
    // Tương tác bài viết: Views & Likes (Blog Owner)
    interaction: [
      { border: '#5b5bd6', bg: 'rgba(91, 91, 214, 0.12)' },
      { border: '#f43f5e', bg: 'rgba(244, 63, 94, 0.10)' },
    ],
    // Báo cáo vi phạm: Bài viết & Bình luận (Moderator)
    reports: [
      { border: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)' },
      { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.10)' },
    ],
    // Mặc định
    default: [
      { border: '#5b5bd6', bg: 'rgba(91, 91, 214, 0.12)' },
      { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.10)' },
      { border: '#10b981', bg: 'rgba(16, 185, 129, 0.10)' },
      { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.10)' },
      { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.10)' },
    ],
  };

  private chartInstance: any = null;

  /** Chiều cao dạng CSS */
  readonly containerHeight = computed(() => {
    const h = this.height();
    return typeof h === 'number' ? `${h}px` : h;
  });

  /** Kiểm tra có dữ liệu hay không */
  readonly hasData = computed(() => {
    const sets = this.datasets();
    if (sets && sets.length > 0) {
      return sets.some((s) => s.data && s.data.length > 0);
    }
    const single = this.data();
    return !!(single && single.length > 0);
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyChart();
    });

    effect(() => {
      const isDarkSignal = this.auth?.isDarkMode ? this.auth.isDarkMode() : false;
      this.labels();
      this.data();
      this.label();
      this.datasets();
      this.colorScheme();
      this.showLegend();
      this.legendPosition();
      this.curved();
      this.fill();
      this.unit();
      const canvas = this.canvasRef();

      if (!canvas) return;

      this.ngZone.runOutsideAngular(() => {
        queueMicrotask(() => this.renderChart(isDarkSignal));
      });
    });
  }

  selectPeriod(period: ChartPeriod): void {
    if (this.selectedPeriod() === period) return;
    this.selectedPeriod.set(period);
    this.periodChange.emit(period);
  }

  getPeriodLabel(period: ChartPeriod): string {
    const lang = this.ts?.currentLang?.() || 'vi';
    const labelsMap: Record<string, Record<ChartPeriod, string>> = {
      vi: { '7d': '1 tuần', '30d': '1 tháng', '1y': '1 năm' },
      en: { '7d': '1 week', '30d': '1 month', '1y': '1 year' },
      zh: { '7d': '1周', '30d': '1月', '1y': '1年' },
      ja: { '7d': '1週間', '30d': '1ヶ月', '1y': '1年' },
    };
    return labelsMap[lang]?.[period] || labelsMap['vi'][period];
  }

  private renderChart(isDark: boolean): void {
    if (typeof window === 'undefined' || typeof Chart === 'undefined') {
      return;
    }

    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    this.destroyChart();

    const rootStyles = typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null;
    const textColor = isDark
      ? '#cbd5e1'
      : rootStyles?.getPropertyValue('--text-muted').trim() || '#64748b';
    const gridColor = isDark
      ? 'rgba(148, 163, 184, 0.14)'
      : rootStyles?.getPropertyValue('--border-color').trim() || 'rgba(226, 232, 240, 0.8)';
    const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(17, 24, 39, 0.95)';
    const pointBg = isDark ? '#0f172a' : '#ffffff';

    const activePalette =
      this.builtInPalettes[this.colorScheme()] || this.builtInPalettes['default'];

    let finalDatasets: any[] = [];
    const multiDatasets = this.datasets();
    const singleData = this.data();
    const isCurved = this.curved();
    const isFill = this.fill();

    if (multiDatasets && multiDatasets.length > 0) {
      finalDatasets = multiDatasets.map((ds, i) => {
        const palette = activePalette[i % activePalette.length];
        const borderColor = ds.borderColor || palette.border;
        const backgroundColor = ds.backgroundColor || palette.bg;
        return {
          label: ds.label,
          data: ds.data,
          borderColor,
          backgroundColor,
          pointBackgroundColor: borderColor,
          pointBorderColor: pointBg,
          pointBorderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderWidth: 2.5,
          fill: ds.fill !== undefined ? ds.fill : isFill,
          tension: isCurved ? 0.38 : 0,
        };
      });
    } else if (singleData) {
      const palette = activePalette[0];
      finalDatasets = [
        {
          label: this.label(),
          data: singleData,
          borderColor: palette.border,
          backgroundColor: palette.bg,
          pointBackgroundColor: palette.border,
          pointBorderColor: pointBg,
          pointBorderWidth: 2,
          pointRadius: 3.5,
          pointHoverRadius: 6,
          borderWidth: 2.5,
          fill: isFill,
          tension: isCurved ? 0.38 : 0,
        },
      ];
    }

    const unitText = this.unit();

    this.chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.labels(),
        datasets: finalDatasets,
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
            display: this.showLegend() || (multiDatasets && multiDatasets.length > 1),
            position: this.legendPosition(),
            labels: {
              color: textColor,
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              boxHeight: 8,
              padding: 16,
              font: {
                family: 'Inter, system-ui, -apple-system, sans-serif',
                size: 12,
                weight: '500',
              },
            },
          },
          tooltip: {
            backgroundColor: tooltipBg,
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: (context: any) => {
                const itemLabel = context.dataset?.label || '';
                const val = context.parsed?.y ?? 0;
                const unitSuffix = unitText ? ` ${unitText}` : '';
                return ` ${itemLabel}: ${val}${unitSuffix}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            border: { display: false },
            ticks: {
              color: textColor,
              font: { size: 11, family: 'Inter, system-ui, sans-serif' },
              padding: 6,
            },
          },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: {
              color: gridColor,
              drawTicks: false,
            },
            ticks: {
              precision: 0,
              color: textColor,
              font: { size: 11, family: 'Inter, system-ui, sans-serif' },
              padding: 10,
            },
          },
        },
      },
    });
  }

  private destroyChart(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
