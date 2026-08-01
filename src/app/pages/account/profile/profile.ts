import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { User } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserApiService } from '../../../core/services/user-api.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly userApi = inject(UserApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly user = signal<User | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isUploadingAvatar = signal(false);
  readonly isDeleting = signal(false);
  readonly avatarPreview = signal<string | null>(null);

  bio = '';
  newPassword = '';
  selectedAvatar: File | null = null;

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);

    this.userApi.getProfile().subscribe({
      next: ({ data }) => {
        this.applyUser(data);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        const cached = this.auth.currentUser();
        if (cached) this.applyUser(cached);
        this.toast.error(getApiErrorMessage(error), 'Không tải được hồ sơ');
      },
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.warning('Chỉ được chọn tệp ảnh.');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toast.warning('Ảnh đại diện không được vượt quá 5MB.');
      input.value = '';
      return;
    }

    this.selectedAvatar = file;

    const reader = new FileReader();
    reader.onload = () => this.avatarPreview.set(String(reader.result));
    reader.readAsDataURL(file);
  }

  saveProfile(event: Event): void {
    event.preventDefault();

    if (this.newPassword && this.newPassword.length < 6) {
      this.toast.warning('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    this.isSaving.set(true);

    const body = this.selectedAvatar ? new FormData() : {
      bio: this.bio,
      ...(this.newPassword ? { password: this.newPassword } : {}),
    };

    if (body instanceof FormData) {
      body.append('bio', this.bio);
      if (this.newPassword) body.append('password', this.newPassword);
      body.append('file', this.selectedAvatar!);
    }

    this.userApi.updateProfile(body).subscribe({
      next: ({ data }) => {
        this.applyUser(data);
        this.newPassword = '';
        this.clearSelectedAvatar();
        this.isSaving.set(false);
        this.toast.success('Cập nhật hồ sơ thành công.');
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.toast.error(getApiErrorMessage(error), 'Cập nhật thất bại');
      },
    });
  }

  uploadAvatarOnly(): void {
    if (!this.selectedAvatar) {
      this.toast.warning('Hãy chọn ảnh trước.');
      return;
    }

    this.isUploadingAvatar.set(true);

    this.userApi.uploadAvatar(this.selectedAvatar).subscribe({
      next: ({ data }) => {
        this.applyUser(data);
        this.clearSelectedAvatar();
        this.isUploadingAvatar.set(false);
        this.toast.success('Đổi ảnh đại diện thành công.');
      },
      error: (error: unknown) => {
        this.isUploadingAvatar.set(false);
        this.toast.error(getApiErrorMessage(error), 'Upload avatar thất bại');
      },
    });
  }

  logoutAll(): void {
    this.auth.logoutAllApi().subscribe({
      next: () => {
        this.toast.success('Đã đăng xuất khỏi tất cả thiết bị.');
        this.router.navigate(['/auth']);
      },
      error: (error: unknown) => {
        this.toast.error(getApiErrorMessage(error), 'Đăng xuất thất bại');
        this.router.navigate(['/auth']);
      },
    });
  }

  deleteAccount(): void {
    if (typeof window !== 'undefined' && !window.confirm('Xóa tài khoản sẽ khóa tài khoản và đăng xuất ngay. Tiếp tục?')) {
      return;
    }

    this.isDeleting.set(true);

    this.userApi.deleteProfile().subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.auth.logout();
        this.toast.success('Tài khoản đã được xóa.');
        this.router.navigate(['/']);
      },
      error: (error: unknown) => {
        this.isDeleting.set(false);
        this.toast.error(getApiErrorMessage(error), 'Xóa tài khoản thất bại');
      },
    });
  }

  getAvatarInitial(name?: string | null): string {
    return name?.trim().charAt(0).toUpperCase() || 'U';
  }

  formatDate(value?: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('vi-VN');
  }

  private applyUser(user: User): void {
    this.user.set(user);
    this.bio = user.bio ?? '';
    this.auth.syncUser(user);
  }

  private clearSelectedAvatar(): void {
    this.selectedAvatar = null;
    this.avatarPreview.set(null);
  }
}
