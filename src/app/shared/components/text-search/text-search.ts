import { Component, computed, inject, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-text-search',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './text-search.html',
})
export class TextSearchComponent {
  private readonly ts = inject(TranslationService);

  /** Giá trị từ khóa (Two-way binding signal) */
  readonly value = model<string>('');

  /** Gợi ý nhập liệu (Placeholder) */
  readonly placeholder = input<string>('');

  readonly displayPlaceholder = computed(() => {
    this.ts.currentLang();
    return this.placeholder() || this.ts.translate('search.placeholder');
  });

  /** Trạng thái disabled */
  readonly disabled = input<boolean>(false);

  /** Kích thước: sm (nhỏ), md (vừa) */
  readonly size = input<'sm' | 'md'>('md');

  /** Sự kiện khi giá trị tìm kiếm thay đổi */
  readonly searchChange = output<string>();

  /** Sự kiện khi nhấn phím Enter */
  readonly searchEnter = output<string>();

  onInput(newValue: string): void {
    this.value.set(newValue);
    this.searchChange.emit(newValue);
  }

  clearSearch(): void {
    if (this.disabled()) return;
    this.value.set('');
    this.searchChange.emit('');
  }

  onKeyDownEnter(): void {
    this.searchEnter.emit(this.value());
  }
}
