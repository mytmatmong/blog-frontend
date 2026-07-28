import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentRole = signal<string>('guest');
  isDarkMode = signal<boolean>(false);

  constructor() {
    // Only access localStorage on browser side (SSR safety)
    if (typeof window !== 'undefined') {
      const savedRole = localStorage.getItem('demoRole');
      if (savedRole) this.currentRole.set(savedRole);

      const savedTheme = localStorage.getItem('demoTheme');
      if (savedTheme === 'dark') {
        this.isDarkMode.set(true);
        document.body.classList.add('dark-mode');
      }

      effect(() => {
        localStorage.setItem('demoRole', this.currentRole());
      });

      effect(() => {
        const dark = this.isDarkMode();
        localStorage.setItem('demoTheme', dark ? 'dark' : 'light');
        if (dark) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
      });
    }
  }

  setRole(role: string) {
    this.currentRole.set(role);
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
  }
}
