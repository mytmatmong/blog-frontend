import {
  booleanAttribute,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  signal,
} from '@angular/core';

import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

/**
 * Không dùng Math.random() vì dự án có SSR/hydration.
 */
let nextInputId = 0;

@Component({
  selector: 'app-input',
  imports: [FormsModule],
  templateUrl: './input.html',
  styleUrl: './input.css',
  host: {
    class: 'block w-full',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(
        () => InputComponent,
      ),
      multi: true,
    },
  ],
})
export class InputComponent
  implements ControlValueAccessor {
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() label = '';
  @Input() icon = '';
  @Input() hint = '';
  @Input() errorMessage = '';

  @Input({
    transform: booleanAttribute,
  })
  disabled = false;

  @Input({
    transform: booleanAttribute,
  })
  required = false;

  @Input()
  id = `input-${nextInputId++}`;

  @Input()
  value = '';

  @Output()
  valueChange =
    new EventEmitter<string>();

  @Output()
  inputFocus =
    new EventEmitter<FocusEvent>();

  @Output()
  inputBlur =
    new EventEmitter<FocusEvent>();

  readonly showPassword =
    signal(false);

  private onChange:
    (value: string) => void =
    () => { };

  private onTouched:
    () => void =
    () => { };

  writeValue(
    value: string | null,
  ): void {
    this.value = value ?? '';
  }

  registerOnChange(
    callback: (value: string) => void,
  ): void {
    this.onChange = callback;
  }

  registerOnTouched(
    callback: () => void,
  ): void {
    this.onTouched = callback;
  }

  setDisabledState(
    isDisabled: boolean,
  ): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    this.value = input.value;

    this.onChange(this.value);
    this.valueChange.emit(this.value);
  }

  onBlur(event: FocusEvent): void {
    this.onTouched();
    this.inputBlur.emit(event);
  }

  onFocus(event: FocusEvent): void {
    this.inputFocus.emit(event);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(
      (current) => !current,
    );
  }

  get inputType(): string {
    if (this.type !== 'password') {
      return this.type;
    }

    return this.showPassword()
      ? 'text'
      : 'password';
  }
}