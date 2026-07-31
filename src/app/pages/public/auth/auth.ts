import { Component, signal } from '@angular/core';
import { InputComponent } from '../../../shared/components/input/input';

@Component({
  selector: 'app-auth',
  imports: [InputComponent],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  protected activeTab = signal<'login' | 'register' | 'forgot'>('login');

  setTab(tab: 'login' | 'register' | 'forgot') {
    this.activeTab.set(tab);
  }
}
