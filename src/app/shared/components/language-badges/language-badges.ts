import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface PostLanguageItem {
  id?: number;
  code: string;
  name: string;
  flag?: string | null;
  isOriginal?: boolean;
  status?: string;
}

@Component({
  selector: 'app-language-badges',
  imports: [TranslatePipe],
  templateUrl: './language-badges.html',
  styleUrl: './language-badges.css',
})
export class LanguageBadgesComponent {
  private readonly elementRef = inject(ElementRef);

  readonly languages = input.required<PostLanguageItem[]>();
  readonly maxVisible = input<number>(2);

  readonly isOpen = signal<boolean>(false);

  readonly visibleLanguages = computed(() => {
    const list = this.languages() || [];
    const max = this.maxVisible();
    return list.slice(0, max);
  });

  readonly hiddenCount = computed(() => {
    const list = this.languages() || [];
    const max = this.maxVisible();
    return Math.max(0, list.length - max);
  });

  togglePopover(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.isOpen.update((v) => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
