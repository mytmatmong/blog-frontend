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

export interface MultiDropdownOption {
  label: string;
  value: any;
  icon?: string;
}

@Component({
  selector: 'app-multi-dropdown',
  standalone: true,
  templateUrl: './multi-dropdown.html',
})
export class MultiDropdownComponent {
  constructor(private elementRef: ElementRef) {}

  /** Danh sách lựa chọn */
  readonly options = input<MultiDropdownOption[]>([]);

  /** Mảng các giá trị được chọn (Two-way binding signal) */
  readonly values = model<any[]>([]);

  /** Nhãn tiêu đề */
  readonly label = input<string>('');

  /** Gợi ý khi chưa chọn */
  readonly placeholder = input<string>('Chọn nhiều mục...');

  /** Trạng thái disabled */
  readonly disabled = input<boolean>(false);

  /** Tùy chỉnh độ rộng (Mặc định min-w-[220px] để đồng bộ với single-dropdown) */
  readonly minWidth = input<string>('min-w-[220px]');

  private readonly ts = inject(TranslationService);

  /** Trạng thái mở/đóng menu */
  readonly isOpen = signal<boolean>(false);

  /** Sự kiện khi thay đổi danh sách được chọn */
  readonly selectionChange = output<any[]>();

  /** Văn bản hiển thị trên nút Trigger */
  readonly triggerText = computed(() => {
    this.ts.currentLang();
    const selectedVals = this.values();
    if (!selectedVals || selectedVals.length === 0) {
      return this.placeholder() || this.ts.translate('dropdown.select_multiple');
    }

    const selectedOptions = this.options().filter((opt) =>
      selectedVals.includes(opt.value)
    );

    if (selectedOptions.length <= 2) {
      return selectedOptions.map((opt) => opt.label).join(', ');
    }

    return this.ts
      .translate('dropdown.selected_count')
      .replace('{count}', selectedOptions.length.toString());
  });

  toggleOpen(): void {
    if (this.disabled()) return;
    this.isOpen.update((v) => !v);
  }

  isSelected(val: any): boolean {
    return this.values().includes(val);
  }

  toggleSelect(val: any): void {
    const current = [...this.values()];
    const index = current.indexOf(val);

    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(val);
    }

    this.values.set(current);
    this.selectionChange.emit(current);
  }

  selectAll(): void {
    const allVals = this.options().map((opt) => opt.value);
    this.values.set(allVals);
    this.selectionChange.emit(allVals);
  }

  clearAll(): void {
    this.values.set([]);
    this.selectionChange.emit([]);
  }

  /** Đóng menu khi click ra ngoài component */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
