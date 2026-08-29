import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';

export interface DropdownOption {
  label: string;
  value: any;
  icon?: string;
}

@Component({
  selector: 'app-single-dropdown',
  standalone: true,
  templateUrl: './single-dropdown.html',
})
export class SingleDropdownComponent {
  constructor(private elementRef: ElementRef) {}

  private readonly ts = inject(TranslationService);

  /** Danh sách lựa chọn */
  readonly options = input<DropdownOption[]>([]);

  /** Giá trị đang chọn (Two-way binding signal) */
  readonly value = model<any>(null);

  /** Nhãn tiêu đề (Ví dụ: "Vai trò:", "Trạng thái:") */
  readonly label = input<string>('');

  /** Gợi ý khi chưa chọn */
  readonly placeholder = input<string>('');

  /** Tùy chỉnh độ rộng (Mặc định min-w-[220px] để hiển thị trọn vẹn chữ) */
  readonly minWidth = input<string>('min-w-[220px]');

  readonly displayPlaceholder = computed(() => {
    this.ts.currentLang();
    return this.placeholder() || this.ts.translate('dropdown.select_single');
  });

  /** Trạng thái disabled */
  readonly disabled = input<boolean>(false);

  /** Trạng thái mở/đóng menu dropdown */
  readonly isOpen = signal<boolean>(false);

  /** Sự kiện khi thay đổi lựa chọn */
  readonly selectionChange = output<any>();

  /** Lựa chọn hiện tại dựa trên value */
  readonly selectedOption = computed(() => {
    const currentVal = this.value();
    return this.options().find((opt) => opt.value === currentVal) || null;
  });

  toggleOpen(): void {
    if (this.disabled()) return;
    this.isOpen.update((v) => !v);
  }

  selectOption(option: DropdownOption): void {
    this.value.set(option.value);
    this.selectionChange.emit(option.value);
    this.isOpen.set(false);
  }

  /** Đóng menu khi click ra ngoài component */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
