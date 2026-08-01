import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { User } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { TranslationService } from '../../../core/services/translation.service';
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

  private readonly ts = inject(TranslationService);
  private readonly userApi = inject(UserApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly showPasswordForm = signal(false);
  readonly showPassword = signal(false);
  readonly isChangingPassword = signal(false);

  confirmNewPassword = '';
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

        const cachedUser = this.auth.currentUser();

        if (cachedUser) {
          this.applyUser(cachedUser);
        }

        this.toast.error(
          getApiErrorMessage(error),
          this.ts.translate('profile.load_error'),
        );
      },
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.toast.warning(this.ts.translate('profile.only_image_allowed'));
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toast.warning(
        this.ts.translate('profile.image_size_limit'),
      );

      input.value = '';
      return;
    }

    this.selectedAvatar = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.avatarPreview.set(String(reader.result));
    };

    reader.readAsDataURL(file);
  }

  saveProfile(event: Event): void {
    event.preventDefault();

    this.isSaving.set(true);

    const body = this.selectedAvatar
      ? this.createProfileFormData()
      : {
        bio: this.bio.trim(),
      };

    this.userApi.updateProfile(body).subscribe({
      next: ({ data }) => {
        /*
         * PATCH profile không trả followers.
         * Phải merge với user cũ thay vì ghi đè toàn bộ.
         */
        this.applyUser(
          this.mergeUserData(data),
        );

        this.clearSelectedAvatar();
        this.isSaving.set(false);

        this.toast.success(
          this.ts.translate('profile.update_success'),
        );

        /*
         * Gọi lại GET profile để đồng bộ đầy đủ dữ liệu
         * mà không cần người dùng F5.
         */
        this.refreshProfileSilently();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);

        this.toast.error(
          getApiErrorMessage(error),
          this.ts.translate('profile.update_failed'),
        );
      },
    });
  }

  uploadAvatarOnly(): void {
    if (!this.selectedAvatar) {
      this.toast.warning(this.ts.translate('profile.select_image_first'));
      return;
    }

    this.isUploadingAvatar.set(true);

    this.userApi
      .uploadAvatar(this.selectedAvatar)
      .subscribe({
        next: ({ data }) => {
          /*
           * Upload avatar cũng không trả followers,
           * nên không được ghi đè trực tiếp.
           */
          this.applyUser(
            this.mergeUserData(data),
          );

          this.clearSelectedAvatar();
          this.isUploadingAvatar.set(false);

          this.toast.success(
            this.ts.translate('profile.avatar_update_success'),
          );

          this.refreshProfileSilently();
        },
        error: (error: unknown) => {
          this.isUploadingAvatar.set(false);

          this.toast.error(
            getApiErrorMessage(error),
            this.ts.translate('profile.avatar_upload_failed'),
          );
        },
      });
  }

  logoutAll(): void {
    this.auth.logoutAllApi().subscribe({
      next: () => {
        this.toast.success(
          this.ts.translate('profile.logout_all_success'),
        );

        this.router.navigate(['/auth']);
      },
      error: (error: unknown) => {
        this.toast.error(
          getApiErrorMessage(error),
          this.ts.translate('profile.logout_failed'),
        );

        this.router.navigate(['/auth']);
      },
    });
  }

  deleteAccount(): void {
    if (
      typeof window !== 'undefined'
      && !window.confirm(
        this.ts.translate('profile.delete_confirm'),
      )
    ) {
      return;
    }

    this.isDeleting.set(true);

    this.userApi.deleteProfile().subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.auth.logout();

        this.toast.success(
          this.ts.translate('profile.delete_success'),
        );

        this.router.navigate(['/']);
      },
      error: (error: unknown) => {
        this.isDeleting.set(false);

        this.toast.error(
          getApiErrorMessage(error),
          this.ts.translate('profile.delete_failed'),
        );
      },
    });
  }
  clearAvatarSelection(
    input: HTMLInputElement,
  ): void {
    this.selectedAvatar = null;
    this.avatarPreview.set(null);
    input.value = '';
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(
      size
      / (1024 * 1024)
    ).toFixed(1)} MB`;
  }
  getAvatarInitial(
    name?: string | null,
  ): string {
    return (
      name
        ?.trim()
        .charAt(0)
        .toUpperCase()
      || 'U'
    );
  }

  formatDate(
    value?: string | null,
  ): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleDateString('vi-VN');
  }

  private createProfileFormData(): FormData {
    const formData = new FormData();

    formData.append(
      'bio',
      this.bio.trim(),
    );

    if (this.selectedAvatar) {
      formData.append(
        'file',
        this.selectedAvatar,
      );
    }

    return formData;
  }

  /**
   * Ghép response PATCH/POST với dữ liệu profile hiện tại.
   *
   * Response cập nhật profile không chứa followers,
   * nên phải giữ followers cũ.
   */
  private mergeUserData(
    updatedUser: User,
  ): User {
    const currentUser =
      this.user()
      ?? this.auth.currentUser();

    if (!currentUser) {
      return updatedUser;
    }

    return {
      ...currentUser,
      ...updatedUser,

      followers:
        updatedUser.followers
        ?? currentUser.followers
        ?? [],
    };
  }

  /**
   * Đồng bộ lại response đầy đủ từ GET /user/profile,
   * nhưng không bật màn hình loading để tránh giao diện nháy/mất dữ liệu.
   */
  private refreshProfileSilently(): void {
    this.userApi.getProfile().subscribe({
      next: ({ data }) => {
        this.applyUser(
          this.mergeUserData(data),
        );
      },
      error: () => {
        /*
         * PATCH đã thành công nên không hiện lỗi tại đây.
         * Giao diện vẫn giữ dữ liệu vừa merge.
         */
      },
    });
  }

  private applyUser(user: User): void {
    this.user.set(user);
    this.bio = user.bio ?? '';

    /*
     * Cập nhật signal toàn ứng dụng và localStorage.
     */
    this.auth.syncUser(user);
  }

  private clearSelectedAvatar(): void {
    this.selectedAvatar = null;
    this.avatarPreview.set(null);
  }
  togglePasswordForm(): void {
    if (this.showPasswordForm()) {
      this.resetPasswordForm();
      return;
    }

    this.showPasswordForm.set(true);
  }

  cancelPasswordChange(): void {
    this.resetPasswordForm();
  }

  changePassword(event: Event): void {
    event.preventDefault();

    if (this.newPassword.length < 6) {
      this.toast.warning(
        this.ts.translate('profile.password_min_length'),
      );

      return;
    }

    if (
      this.newPassword
      !== this.confirmNewPassword
    ) {
      this.toast.warning(
        this.ts.translate('profile.passwords_not_match'),
      );

      return;
    }

    this.isChangingPassword.set(true);

    this.userApi
      .updateProfile({
        password: this.newPassword,
      })
      .subscribe({
        next: ({ data }) => {
          this.applyUser(
            this.mergeUserData(data),
          );

          this.isChangingPassword.set(false);
          this.resetPasswordForm();

          this.toast.success(
            this.ts.translate('profile.change_password_success'),
          );
        },
        error: (error: unknown) => {
          this.isChangingPassword.set(false);

          this.toast.error(
            getApiErrorMessage(error),
            this.ts.translate('profile.change_password_failed'),
          );
        },
      });
  }

  private resetPasswordForm(): void {
    this.newPassword = '';
    this.confirmNewPassword = '';
    this.showPassword.set(false);
    this.showPasswordForm.set(false);
  }
}