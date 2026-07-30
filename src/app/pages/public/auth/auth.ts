import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-auth',
  imports: [],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  protected activeTab = signal<'login' | 'register' | 'forgot'>('login');

  setTab(tab: 'login' | 'register' | 'forgot') {
    this.activeTab.set(tab);
  }
}
