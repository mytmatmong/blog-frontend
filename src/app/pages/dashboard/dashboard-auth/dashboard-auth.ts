import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-dashboard-auth',
  imports: [FormsModule],
  templateUrl: './dashboard-auth.html',
  styleUrl: './dashboard-auth.css',
})
export class DashboardAuth {
  protected readonly authService = inject(AuthService);
  protected readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  identifier = signal<string>('');
  password = signal<string>('');
  isLoading = signal<boolean>(false);

  onSubmit(event: Event) {
    event.preventDefault();
    const idVal = this.identifier().trim();
    const passVal = this.password();

    if (!idVal || !passVal) {
      this.toastService.warning('Vui lòng nhập đầy đủ tên đăng nhập/email và mật khẩu.');
      return;
    }

    this.isLoading.set(true);
    this.authService.login({ identifier: idVal, password: passVal }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.success('Đăng nhập Quản trị thành công!', 'Thành công');
        const role = this.authService.currentRole();
        if (role === 'admin') {
          this.router.navigate(['/dashboard/admin']);
        } else if (role === 'moderator') {
          this.router.navigate(['/dashboard/moderator']);
        } else if (role === 'owner') {
          this.router.navigate(['/dashboard/owner']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        let msg = 'Đăng nhập thất bại';
        if (err.error?.message) {
          msg = Array.isArray(err.error.message) ? err.error.message.join(', ') : err.error.message;
        }
        this.toastService.error(msg, 'Lỗi đăng nhập');
      }
    });
  }
}
