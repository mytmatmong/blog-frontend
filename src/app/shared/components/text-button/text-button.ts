import { Component, computed, input, output, booleanAttribute } from '@angular/core';

export type TextButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type TextButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-text-button',
  standalone: true,
  templateUrl: './text-button.html',
  host: {
    class: 'inline-flex shrink-0 whitespace-nowrap',
  },
})
export class TextButtonComponent {
  /** Loại nút: primary (chính), secondary (phụ), tertiary (nhẹ/link) */
  readonly variant = input<TextButtonVariant>('primary');

  /** Kích cỡ: sm (nhỏ), md (vừa), lg (lớn) */
  readonly size = input<TextButtonSize>('md');

  /** Loại thẻ HTML button: button, submit, reset */
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  /** Trạng thái disabled */
  readonly disabled = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  /** Trạng thái đang tải (hiện icon xoay) */
  readonly loading = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  /** Nút chiếm 100% chiều ngang */
  readonly fullWidth = input<boolean, boolean | string>(false, { transform: booleanAttribute });

  /** Sự kiện khi click vào nút */
  readonly btnClick = output<MouseEvent>();

  /** Computed class áp dụng Tailwind dựa trên variant và size */
  readonly buttonClasses = computed(() => {
    const base = 'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap shrink-0';
    
    // Width
    const widthClass = this.fullWidth() ? 'w-full' : '';

    // Sizes
    const sizeMap: Record<TextButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
      md: 'px-4 py-2 text-sm rounded-xl gap-2',
      lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
    };
    const sizeClass = sizeMap[this.size()] || sizeMap.md;

    // Variants
    const variantMap: Record<TextButtonVariant, string> = {
      primary:
        'bg-aquamarine-600 text-white hover:bg-aquamarine-700 active:bg-aquamarine-800 shadow-sm focus:ring-aquamarine-500 disabled:bg-aquamarine-300 dark:disabled:bg-aquamarine-800 disabled:text-aquamarine-100 disabled:cursor-not-allowed disabled:shadow-none',
      secondary:
        'bg-white dark:bg-aquamarine-900 border border-aquamarine-300 dark:border-aquamarine-700 text-aquamarine-800 dark:text-aquamarine-200 hover:bg-aquamarine-50 dark:hover:bg-aquamarine-800 active:bg-aquamarine-100 dark:active:bg-aquamarine-700 shadow-xs focus:ring-aquamarine-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800',
      tertiary:
        'bg-transparent text-aquamarine-600 dark:text-aquamarine-400 hover:bg-aquamarine-50 dark:hover:bg-aquamarine-900/50 active:bg-aquamarine-100 dark:active:bg-aquamarine-900 focus:ring-aquamarine-400 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent',
    };
    const variantClass = variantMap[this.variant()] || variantMap.primary;

    return `${base} ${widthClass} ${sizeClass} ${variantClass}`;
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
