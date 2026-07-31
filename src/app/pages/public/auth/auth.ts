import { Component, signal, inject } from '@angular/core';
import { InputComponent } from '../../../shared/components/input/input';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-auth',
  imports: [InputComponent, TranslatePipe],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  protected readonly ts = inject(TranslationService);
  protected activeTab = signal<'login' | 'register' | 'forgot'>('login');

  setTab(tab: 'login' | 'register' | 'forgot') {
    this.activeTab.set(tab);
  }
}
