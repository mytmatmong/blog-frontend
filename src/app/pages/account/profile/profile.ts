import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models/auth.model';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  user = signal<User | null>(null);
  isLoading = signal<boolean>(false);

  username = signal<string>('');
  email = signal<string>('');
  bio = signal<string>('');
  role = signal<string>('');

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.authService.getUserProfile().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.user.set(res.data);
          this.username.set(res.data.username || '');
          this.email.set(res.data.email || '');
          this.bio.set(res.data.bio || '');
          this.role.set(res.data.role || 'USER');
        }
      },
      error: () => {
        this.isLoading.set(false);
        // Fallback to current user signal if offline/cache
        const current = this.authService.currentUser();
        if (current) {
          this.user.set(current);
          this.username.set(current.username || '');
          this.email.set(current.email || '');
          this.bio.set(current.bio || '');
          this.role.set(current.role || 'USER');
        }
      }
    });
  }

  getAvatarInitial(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }
}
