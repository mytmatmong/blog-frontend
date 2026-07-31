import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  private idCounter = 0;

  show(type: Toast['type'], message: string, title?: string, duration = 3000) {
    const id = ++this.idCounter;
    const toast: Toast = { id, type, message, title, duration };
    this.toasts.update(current => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  success(message: string, title?: string, duration = 3000) {
    this.show('success', message, title, duration);
  }

  error(message: string, title?: string, duration = 4000) {
    this.show('error', message, title, duration);
  }

  info(message: string, title?: string, duration = 3000) {
    this.show('info', message, title, duration);
  }

  warning(message: string, title?: string, duration = 3500) {
    this.show('warning', message, title, duration);
  }

  remove(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
