import { Component, computed, input, booleanAttribute } from '@angular/core';

export type BadgeColor =
  | 'green'
  | 'yellow'
  | 'red'
  | 'blue'
  | 'purple'
  | 'gray';

export type BadgeShape = 'pill' | 'rounded';
export type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-badge',
  standalone: true,
  templateUrl: './badge.html',
})
export class BadgeComponent {
  /** Màu sắc nhãn trạng thái: green (lục), yellow (vàng), red (đỏ), blue (lam), purple (tím), gray (xám) */
  readonly color = input<BadgeColor>('green');

  /** Kiểu bo góc: pill (bo tròn hoàn toàn), rounded (bo nhẹ) */
  readonly shape = input<BadgeShape>('pill');

  /** Kích thước: sm (nhỏ), md (vừa), lg (lớn) */
  readonly size = input<BadgeSize>('sm');

  /** Tên class Bootstrap Icon đi kèm (Ví dụ: 'bi bi-check-circle', 'bi bi-lock-fill') */
  readonly icon = input<string>('');

  /** Hiển thị chấm tròn nhỏ màu ở đầu nhãn */
  readonly dot = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  /** Computed class áp dụng Tailwind dựa trên color, shape, size */
  readonly badgeClasses = computed(() => {
    const base =
      'inline-flex items-center justify-center font-bold tracking-wide select-none pointer-events-none whitespace-nowrap leading-none';

    // Shapes
    const shapeClass = this.shape() === 'pill' ? 'rounded-full' : 'rounded-lg';

    // Sizes
    const sizeMap: Record<BadgeSize, string> = {
      sm: 'px-2.5 py-1 text-[11px] gap-1.5',
      md: 'px-3 py-1.5 text-xs gap-2',
      lg: 'px-4 py-2 text-sm gap-2',
    };
    const sizeClass = sizeMap[this.size()] || sizeMap.sm;

    // Color Palettes
    const colorMap: Record<BadgeColor, string> = {
      // Xanh lục: ACTIVE, PUBLISHED, SUCCESS
      green:
        'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
      // Vàng/Cam: LOCKED, PENDING, PENDING_REVIEW
      yellow:
        'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
      // Đỏ: REJECTED, BANNED, ERROR
      red: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60',
      // Xanh lam: NORMAL, BLOG_OWNER, INFO
      blue: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60',
      // Tím: SUPER_ADMIN, CONTENT_MODERATOR
      purple:
        'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60',
      // Xám: DRAFT, INACTIVE, UNKNOWN
      gray: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
    };
    const colorClass = colorMap[this.color()] || colorMap.green;

    return `${base} ${shapeClass} ${sizeClass} ${colorClass}`;
  });

  /** Computed class cho chấm tròn (dot) */
  readonly dotClasses = computed(() => {
    const dotColorMap: Record<BadgeColor, string> = {
      green: 'bg-emerald-500',
      yellow: 'bg-amber-500',
      red: 'bg-rose-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      gray: 'bg-gray-400',
    };
    return `w-1.5 h-1.5 rounded-full shrink-0 ${dotColorMap[this.color()] || 'bg-emerald-500'}`;
  });
}
