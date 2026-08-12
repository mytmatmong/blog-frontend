import {
  afterNextRender,
  Component,
  inject,
  signal,
} from '@angular/core';
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
  imports: [
    FormsModule,
    TranslatePipe,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  protected readonly auth = inject(AuthService);

  private readonly ts = inject(TranslationService);
  private readonly userApi = inject(UserApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly showPasswordForm = signal(false);
  readonly showPassword = signal(false);
  readonly isChangingPassword = signal(false);

  readonly user = signal<User | null>(null);

  /*
   * Bật loading ngay từ đầu để giao diện không nháy
   * trước khi browser bắt đầu tải profile.
   */
  readonly isLoading = signal(true);

  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly avatarPreview = signal<string | null>(null);

  confirmNewPassword = '';
  bio = '';
  newPassword = '';
  selectedAvatar: File | null = null;

  constructor() {
    /*
     * afterNextRender chỉ chạy trên browser.
     *
     * Khi F5:
     * - SSR không gọi API protected.
     * - Browser hydrate xong mới kiểm tra token.
     * - Không còn request GET profile thiếu Authorization.
     */
    afterNextRender(() => {
      this.initializeProfile();
    });
  }

  /**
   * Khởi tạo trang profile sau khi ứng dụng đã chạy trên browser.
   *
   * Trường hợp 1: Có access token -> gọi profile.
   * Trường hợp 2: Chỉ có refresh token -> refresh trước.
   * Trường hợp 3: Không có token -> quay về đăng nhập.
   */
  private initializeProfile(): void {
    const accessToken = this.auth.accessToken();

    if (accessToken) {
      this.loadProfile();
      return;
    }

    const refreshToken = this.auth.refreshToken();

    if (!refreshToken) {
      this.auth.logout();
      this.redirectToLogin();
      return;
    }

    this.isLoading.set(true);

    this.auth.refreshAccessToken().subscribe({
      next: (newAccessToken) => {
        /*
         * Đề phòng API refresh trả response rỗng.
         */
        if (!newAccessToken) {
          this.auth.logout();
          this.redirectToLogin();
          return;
        }

        this.loadProfile();
      },

      error: () => {
        this.auth.logout();
        this.redirectToLogin();
      },
    });
  }

  /**
   * Điều hướng về đăng nhập và lưu lại URL hiện tại
   * để có thể quay lại profile sau khi đăng nhập.
   */
  private redirectToLogin(): void {
    this.isLoading.set(false);

    void this.router.navigate(
      ['/auth'],
      {
        queryParams: {
          redirect: this.router.url,
        },
      },
    );
  }

  /**
   * Tải đầy đủ thông tin người dùng.
   *
   * Hàm này chỉ gửi request khi access token đã tồn tại.
   */
  loadProfile(): void {
    if (!this.auth.accessToken()) {
      this.initializeProfile();
      return;
    }

    this.isLoading.set(true);

    this.userApi.getProfile().subscribe({
      next: ({ data }) => {
        this.applyUser(data);
        this.isLoading.set(false);
      },

      error: (error: unknown) => {
        this.isLoading.set(false);

        const cachedUser = this.auth.currentUser();

        /*
         * Nếu request lỗi nhưng localStorage còn user,
         * vẫn giữ giao diện thay vì làm trống toàn bộ trang.
         */
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
      this.toast.warning(
        this.ts.translate(
          'profile.only_image_allowed',
        ),
      );

      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toast.warning(
        this.ts.translate(
          'profile.image_size_limit',
        ),
      );

      input.value = '';
      return;
    }

    this.selectedAvatar = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.avatarPreview.set(
        String(reader.result),
      );
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
         * PATCH profile có thể không trả followers.
         * Ghép response mới với user hiện tại để tránh
         * mất danh sách follower trên giao diện.
         */
        this.applyUser(
          this.mergeUserData(data),
        );

        this.clearSelectedAvatar();
        this.isSaving.set(false);

        this.toast.success(
          this.ts.translate(
            'profile.update_success',
          ),
        );

        /*
         * Đồng bộ lại profile đầy đủ sau khi cập nhật.
         */
        this.refreshProfileSilently();
      },

      error: (error: unknown) => {
        this.isSaving.set(false);

        this.toast.error(
          getApiErrorMessage(error),
          this.ts.translate(
            'profile.update_failed',
          ),
        );
      },
    });
  }

  logoutAll(): void {
    this.auth.logoutAllApi().subscribe({
      next: () => {
        this.toast.success(
          this.ts.translate(
            'profile.logout_all_success',
          ),
        );

        void this.router.navigate(['/auth']);
      },

      error: (error: unknown) => {
        this.toast.error(
          getApiErrorMessage(error),
          this.ts.translate(
            'profile.logout_failed',
          ),
        );

        void this.router.navigate(['/auth']);
      },
    });
  }

  deleteAccount(): void {
    if (
      typeof window !== 'undefined'
      && !window.confirm(
        this.ts.translate(
          'profile.delete_confirm',
        ),
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
          this.ts.translate(
            'profile.delete_success',
          ),
        );

        void this.router.navigate(['/']);
      },

      error: (error: unknown) => {
        this.isDeleting.set(false);

        this.toast.error(
          getApiErrorMessage(error),
          this.ts.translate(
            'profile.delete_failed',
          ),
        );
      },
    });
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
        this.ts.translate(
          'profile.password_min_length',
        ),
      );

      return;
    }

    if (
      this.newPassword
      !== this.confirmNewPassword
    ) {
      this.toast.warning(
        this.ts.translate(
          'profile.passwords_not_match',
        ),
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
            this.ts.translate(
              'profile.change_password_success',
            ),
          );
        },

        error: (error: unknown) => {
          this.isChangingPassword.set(false);

          this.toast.error(
            getApiErrorMessage(error),
            this.ts.translate(
              'profile.change_password_failed',
            ),
          );
        },
      });
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
   * Ghép response PATCH hoặc upload avatar
   * với dữ liệu profile hiện tại.
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
   * Đồng bộ lại profile đầy đủ nhưng không bật
   * loading để giao diện không bị nháy.
   */
  private refreshProfileSilently(): void {
    if (!this.auth.accessToken()) {
      return;
    }

    this.userApi.getProfile().subscribe({
      next: ({ data }) => {
        this.applyUser(
          this.mergeUserData(data),
        );
      },

      error: () => {
        /*
         * Lệnh cập nhật trước đó đã thành công.
         * Không hiện thêm lỗi đồng bộ phụ.
         */
      },
    });
  }

  private applyUser(user: User): void {
    this.user.set(user);
    this.bio = user.bio ?? '';

    /*
     * Đồng bộ user cho header, localStorage
     * và các component khác trong ứng dụng.
     */
    this.auth.syncUser(user);
  }

  private clearSelectedAvatar(): void {
    this.selectedAvatar = null;
    this.avatarPreview.set(null);
  }

  private resetPasswordForm(): void {
    this.newPassword = '';
    this.confirmNewPassword = '';

    this.showPassword.set(false);
    this.showPasswordForm.set(false);
  }
}
