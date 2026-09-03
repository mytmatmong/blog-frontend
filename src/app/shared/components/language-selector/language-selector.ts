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
import { TranslationService, LanguageOption } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { getFlagUrl } from '../../../core/utils/flag.util';

export type LanguageSelectorMode = 'system' | 'select' | 'display';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './language-selector.html',
})
export class LanguageSelectorComponent {
  private readonly elementRef = inject(ElementRef);
  private readonly ts = inject(TranslationService);
  protected readonly getFlagUrl = getFlagUrl;

  readonly mode = input<LanguageSelectorMode>('display');
  
  // Custom language list. If empty, fallback to TranslationService.languages()
  readonly languages = input<LanguageOption[]>([]);
  
  // Custom value for 'select' and 'display' mode. 'system' mode uses TranslationService.currentLang()
  readonly value = model<string | number | null>(null);

  readonly disabled = input<boolean>(false);
  readonly size = input<'sm' | 'md'>('md');
  readonly hideCode = input<boolean>(false);

  readonly isOpen = signal<boolean>(false);
  readonly selectionChange = output<any>();

  readonly availableOptions = computed(() => {
    const custom = this.languages();
    if (custom && custom.length > 0) {
      return custom;
    }
    return this.ts.languages();
  });

  readonly activeOption = computed(() => {
    const currentMode = this.mode();
    let val: string | number | null = null;

    if (currentMode === 'system') {
      val = this.ts.currentLang();
    } else {
      val = this.value();
    }

    if (val === null || val === undefined) return null;

    return this.availableOptions().find((opt) => {
      if (typeof val === 'number') return opt.id === val;
      return opt.code.toLowerCase() === (val as string).toLowerCase();
    }) || null;
  });

  toggleOpen(): void {
    if (this.disabled() || this.mode() === 'display') return;
    this.isOpen.update((v) => !v);
  }

  selectOption(option: LanguageOption): void {
    const currentMode = this.mode();
    
    if (currentMode === 'system') {
      this.ts.setLanguage(option.code);
    } else if (currentMode === 'select') {
      // If the original value was a number, emit number. Otherwise emit code.
      const valToSet = typeof this.value() === 'number' ? option.id : option.code;
      this.value.set(valToSet);
      this.selectionChange.emit(valToSet);
    }
    
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
