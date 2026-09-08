import { Component, computed, input, output, booleanAttribute } from '@angular/core';

export type IconButtonColor = 'red' | 'yellow' | 'green' | 'blue' | 'primary';
export type IconButtonVariant = 'soft' | 'solid' | 'outline';
export type IconButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  templateUrl: './icon-button.html',
  host: {
    class: 'inline-flex shrink-0 whitespace-nowrap',
  },
})
export class IconButtonComponent {
  /** Tên class của Bootstrap Icon (Ví dụ: 'bi bi-trash3-fill', 'bi bi-pencil-square') */
  readonly icon = input<string>('');

  /** Vị trí icon so với chữ: left (bên trái), right (bên phải) */
  readonly iconPosition = input<'left' | 'right'>('left');

  /** Tông màu sẵn: red (đỏ), yellow (vàng), green (lục), blue (lam), primary (thương hiệu) */
  readonly color = input<IconButtonColor>('blue');

  /** Kiểu dáng: soft (nền nhạt - mặc định), solid (nền đậm), outline (viền) */
  readonly variant = input<IconButtonVariant>('soft');

  /** Kích cỡ: sm (nhỏ - mặc định ở Dashboard), md (vừa), lg (lớp) */
  readonly size = input<IconButtonSize>('sm');

  /** Loại thẻ HTML button */
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  /** Trạng thái disabled */
  readonly disabled = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  /** Trạng thái đang tải (hiện spinner xoay) */
  readonly loading = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  /** Sự kiện click nút */
  readonly btnClick = output<MouseEvent>();

  /** Computed class áp dụng Tailwind dựa trên color, variant, size */
  readonly buttonClasses = computed(() => {
    const base =
      'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none whitespace-nowrap shrink-0';

    // Sizes
    const sizeMap: Record<IconButtonSize, string> = {
      sm: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5',
      md: 'px-3.5 py-2 text-sm rounded-xl gap-2',
      lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5',
    };
    const sizeClass = sizeMap[this.size()] || sizeMap.sm;

    // Color & Variant Combination Matrix
    const colorVariantMap: Record<IconButtonColor, Record<IconButtonVariant, string>> = {
      // Đỏ (Xóa, Từ chối)
      red: {
        soft: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/70 focus:ring-rose-400',
        solid: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs focus:ring-rose-500',
        outline: 'border border-rose-600 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 focus:ring-rose-400',
      },
      // Vàng (Khóa, Cảnh báo)
      yellow: {
        soft: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/70 focus:ring-amber-400',
        solid: 'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 shadow-xs focus:ring-amber-500',
        outline: 'border border-amber-600 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 focus:ring-amber-400',
      },
      // Lục (Duyệt, Unlock, Thành công)
      green: {
        soft: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 focus:ring-emerald-400',
        solid: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-xs focus:ring-emerald-500',
        outline: 'border border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 focus:ring-emerald-400',
      },
      // Lam (Sửa, Xem chi tiết, Thông tin)
      blue: {
        soft: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 focus:ring-blue-400',
        solid: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-xs focus:ring-blue-500',
        outline: 'border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 focus:ring-blue-400',
      },
      // Primary (Màu thương hiệu mặc định)
      primary: {
        soft: 'bg-aquamarine-50 dark:bg-aquamarine-950/60 text-aquamarine-700 dark:text-aquamarine-300 border border-aquamarine-200 dark:border-aquamarine-800 hover:bg-aquamarine-100 dark:hover:bg-aquamarine-900 focus:ring-aquamarine-400',
        solid: 'bg-aquamarine-600 text-white hover:bg-aquamarine-700 active:bg-aquamarine-800 shadow-xs focus:ring-aquamarine-500',
        outline: 'border border-aquamarine-600 text-aquamarine-600 dark:text-aquamarine-400 hover:bg-aquamarine-50 dark:hover:bg-aquamarine-950/50 focus:ring-aquamarine-400',
      },
    };

    const styleClass =
      colorVariantMap[this.color()]?.[this.variant()] || colorVariantMap.blue.soft;

    return `${base} ${sizeClass} ${styleClass}`;
  });

  handleClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.btnClick.emit(event);
  }
}
