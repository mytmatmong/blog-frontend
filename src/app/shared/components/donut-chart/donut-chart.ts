import {
  booleanAttribute,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  NgZone,
  signal,
  viewChild,
} from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

declare var Chart: any;

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  templateUrl: './donut-chart.html',
  styleUrl: './donut-chart.css',
})
export class DonutChartComponent {
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService, { optional: true });

  readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  /** Dữ liệu số lượng của từng phần tử */
  readonly data = input<number[]>([]);

  /** Nhãn của từng phần tử */
  readonly labels = input<string[]>([]);

  /** Bảng màu tùy chỉnh cho từng phần tử (nếu không truyền sẽ dùng bảng màu tích hợp) */
  readonly colors = input<string[] | undefined>(undefined);

  /** Tên bộ màu định sẵn: 'default' | 'status' | 'reasons' | 'languages' */
  readonly colorScheme = input<'default' | 'status' | 'reasons' | 'languages' | string>('default');

  /** Giá trị số hiển thị ở tâm (nếu không truyền sẽ tự tính tổng) */
  readonly centerValue = input<string | number | undefined>(undefined);

  /** Nhãn mô tả bên dưới giá trị ở tâm (ví dụ: 'báo cáo', 'bài viết') */
  readonly centerLabel = input<string>('');

  /** Hiển thị chỉ số ở tâm biểu đồ */
  readonly showCenter = input<boolean, boolean | string>(true, { transform: booleanAttribute });

  /** Hiển thị chú giải (legend) */
  readonly showLegend = input<boolean, boolean | string>(true, { transform: booleanAttribute });

  /** Vị trí chú giải: 'bottom' | 'top' | 'right' | 'left' */
  readonly legendPosition = input<'bottom' | 'top' | 'right' | 'left'>('bottom');

  /** Độ dày vành khuyên (mặc định '70%') */
  readonly cutout = input<string | number>('70%');

  /** Đơn vị hiển thị trong tooltip (ví dụ: 'bài viết', 'báo cáo') */
  readonly unit = input<string>('');

  /** Chiều cao khung biểu đồ (px hoặc CSS string) */
  readonly height = input<number | string>(260);

  /** Thông điệp hiển thị khi không có dữ liệu */
  readonly emptyMessage = input<string>('Chưa có dữ liệu');

  /** Nhãn trợ năng cho canvas */
  readonly ariaLabel = input<string>('Biểu đồ tròn');

  /** Tọa độ trung tâm vòng tròn tính từ chartArea */
  readonly centerPos = signal<{ top: number; left: number }>({ top: 120, left: 120 });

  /** Các bảng màu có sẵn được tích hợp trực tiếp trong component */
  readonly builtInPalettes: Record<string, string[]> = {
    // Bảng màu mặc định đa dạng, tươi sáng
    default: [
      '#0d9488',
      '#06b6d4',
      '#10b981',
      '#f59e0b',
      '#ec4899',
      '#8b5cf6',
      '#3b82f6',
      '#ef4444',
      '#14b8a6',
      '#64748b',
    ],
    // Dành cho trạng thái báo cáo (Chờ duyệt, Đã xử lý, Bác bỏ/Từ chối)
    status: [
      '#f59e0b', // Chờ duyệt (Amber)
      '#10b981', // Đã xử lý (Green)
      '#ef4444', // Từ chối (Red)
    ],
    // Dành cho các lý do báo cáo vi phạm
    reasons: [
      '#ef4444', // Spam / Quảng cáo (Red)
      '#f59e0b', // Xúc phạm / Bắt nạt (Orange)
      '#8b5cf6', // Nội dung không phù hợp (Purple)
      '#3b82f6', // Vi phạm bản quyền (Blue)
      '#ec4899', // Thông tin sai lệch (Pink)
      '#64748b', // Lý do khác (Slate)
    ],
    // Dành cho phân bổ ngôn ngữ
    languages: [
      '#0d9488',
      '#06b6d4',
      '#10b981',
      '#f59e0b',
      '#ec4899',
      '#14b8a6',
      '#8b5cf6',
      '#3b82f6',
      '#6366f1',
    ],
  };

  private chartInstance: any = null;

  /** Tổng số lượng tính từ mảng dữ liệu */
  readonly totalValue = computed(() => {
    const list = this.data();
    if (!list || list.length === 0) return 0;
    return list.reduce((acc, val) => acc + (Number(val) || 0), 0);
  });

  /** Kiểm tra xem có dữ liệu hợp lệ hay toàn bộ bằng 0 */
  readonly hasData = computed(() => {
    const list = this.data();
    return list && list.length > 0 && this.totalValue() > 0;
  });

  /** Giá trị số hiển thị ở giữa tâm */
  readonly displayCenterValue = computed(() => {
    const custom = this.centerValue();
    if (custom !== undefined && custom !== null && custom !== '') {
      return custom;
    }
    return this.totalValue();
  });

  /** Chiều cao dạng CSS */
  readonly containerHeight = computed(() => {
    const h = this.height();
    return typeof h === 'number' ? `${h}px` : h;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyChart();
    });

    // Tự động vẽ lại biểu đồ khi data, labels, colors, theme hoặc canvas thay đổi
    effect(() => {
      const isDarkSignal = this.auth?.isDarkMode ? this.auth.isDarkMode() : false;
      this.data();
      this.labels();
      this.colors();
      this.colorScheme();
      this.cutout();
      this.showLegend();
      this.legendPosition();
      this.unit();
      const canvas = this.canvasRef();

      if (!canvas) return;

      this.ngZone.runOutsideAngular(() => {
        queueMicrotask(() => this.renderChart(isDarkSignal));
      });
    });
  }

  private renderChart(isDark: boolean): void {
    if (typeof window === 'undefined' || typeof Chart === 'undefined') {
      return;
    }

    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return;

    this.destroyChart();

    const dataList = this.data();
    const labelList = this.labels();
    const hasValidData = this.hasData();

    const customColors = this.colors();
    const activePalette =
      this.builtInPalettes[this.colorScheme()] || this.builtInPalettes['default'];
    const bgColors = hasValidData
      ? dataList.map((_, i) => {
          if (customColors && customColors.length > 0) {
            return customColors[i % customColors.length];
          }
          return activePalette[i % activePalette.length];
        })
      : [isDark ? '#334155' : '#e2e8f0'];

    const chartBorder = isDark ? '#171a28' : '#ffffff';
    const textColor = isDark ? '#cbd5e1' : '#64748b';
    const tooltipBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(17, 24, 39, 0.95)';
    const unitText = this.unit();

    const chartData = hasValidData
      ? {
          labels: labelList,
          datasets: [
            {
              data: dataList,
              backgroundColor: bgColors,
              borderColor: chartBorder,
              borderWidth: 2,
              hoverBorderWidth: 2,
              hoverOffset: 4,
            },
          ],
        }
      : {
          labels: [this.emptyMessage()],
          datasets: [
            {
              data: [1],
              backgroundColor: [isDark ? '#334155' : '#e2e8f0'],
              borderColor: chartBorder,
              borderWidth: 2,
            },
          ],
        };

    const self = this;
    const centerPlugin = {
      id: 'centerPositionPlugin',
      afterLayout(chart: any) {
        const { chartArea } = chart;
        if (chartArea) {
          const top = (chartArea.top + chartArea.bottom) / 2;
          const left = (chartArea.left + chartArea.right) / 2;
          self.centerPos.set({ top, left });
        }
      },
    };

    this.chartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: chartData,
      plugins: [centerPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: this.cutout(),
        plugins: {
          legend: {
            display: this.showLegend() && hasValidData,
            position: this.legendPosition(),
            labels: {
              color: textColor,
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              boxHeight: 8,
              padding: 14,
              font: {
                family: 'Inter, system-ui, -apple-system, sans-serif',
                size: 12,
                weight: '500',
              },
            },
          },
          tooltip: {
            enabled: hasValidData,
            backgroundColor: tooltipBg,
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            padding: 10,
            cornerRadius: 8,
            boxPadding: 4,
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed ?? 0;
                const total = this.totalValue();
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                const unitSuffix = unitText ? ` ${unitText}` : '';
                return ` ${label}: ${value}${unitSuffix} (${pct}%)`;
              },
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
