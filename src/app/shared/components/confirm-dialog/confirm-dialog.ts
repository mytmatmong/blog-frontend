import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input.required<string>();
  readonly cancelLabel = input.required<string>();
  readonly busy = input(false);
  readonly tone = input<'primary' | 'warning' | 'danger'>('primary');

  readonly cancelled = output<void>();
  readonly confirmed = output<void>();

  protected readonly icon = computed(() => {
    switch (this.tone()) {
      case 'danger':
        return 'bi-trash3';
      case 'warning':
        return 'bi-exclamation-triangle';
      default:
        return 'bi-question-circle';
    }
  });

  protected readonly accentClass = computed(() => {
    switch (this.tone()) {
      case 'danger':
        return 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300';
      case 'warning':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300';
      default:
        return 'bg-aquamarine-100 text-aquamarine-700 dark:bg-aquamarine-950 dark:text-aquamarine-300';
    }
  });

  protected readonly buttonClass = computed(() => {
    switch (this.tone()) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700';
      default:
        return 'bg-aquamarine-600 hover:bg-aquamarine-700';
    }
  });
}
