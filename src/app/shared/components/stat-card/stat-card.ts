import {
  booleanAttribute,
  Component,
  computed,
  input,
  numberAttribute,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';

export type StatCardColor =
  | 'indigo'
  | 'cyan'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'purple'
  | 'blue';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css',
})
export class StatCardComponent {
  /** Class icon Bootstrap Icon (ví dụ: 'bi bi-people', 'bi bi-eye') */
  readonly icon = input<string>('');

  /** Tiêu đề/chữ ở bên phải trên */
  readonly label = input<string>('');

  /** Số liệu hiển thị ở bên phải dưới */
  readonly value = input<string | number>(0);

  /** Màu được chọn sẵn: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose' */
  readonly color = input<StatCardColor | undefined>(undefined);

  /**
   * Chỉ số thứ tự từ 0..3 để tự động chọn màu khác nhau cho 4 ô
   * 0: indigo, 1: cyan, 2: emerald, 3: amber
   */
  readonly colorIndex = input<number | undefined, number | string>(undefined, {
    transform: (v: number | string | undefined) =>
      v === undefined || v === null ? undefined : Number(v),
  });

  /** Trạng thái đang tải dữ liệu */
  readonly loading = input<boolean, boolean | string>(false, {
    transform: booleanAttribute,
  });

  private readonly presetOrder: StatCardColor[] = [
    'indigo',
    'cyan',
    'emerald',
    'amber',
    'rose',
    'purple',
    'blue',
  ];

  /** Màu kích hoạt thực tế */
  readonly activeColor = computed<StatCardColor>(() => {
    const explicitColor = this.color();
    if (explicitColor) {
      return explicitColor;
    }
    const idx = this.colorIndex();
    if (idx !== undefined && !Number.isNaN(idx)) {
      return this.presetOrder[idx % this.presetOrder.length];
    }
    return 'indigo';
  });

  /** Hiển thị số liệu đã format nếu là số */
  readonly isNumericValue = computed(() => {
    const v = this.value();
    return typeof v === 'number' || (typeof v === 'string' && !Number.isNaN(Number(v)) && v.trim() !== '');
  });
}
