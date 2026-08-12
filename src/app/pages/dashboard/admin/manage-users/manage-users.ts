import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AdminUserDetail,
  AdminUserItem,
  CreateModeratorRequest,
  UserRole,
  UserStatus,
} from '../../../../core/models/admin-api.model';
import { AdminApiService } from '../../../../core/services/admin-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-manage-users',
  imports: [FormsModule, TranslatePipe, ConfirmDialog],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css',
})
export class ManageUsers {
  protected readonly ts = inject(TranslationService);
  private readonly adminApi = inject(AdminApiService);
  private readonly toast = inject(ToastService);

  // Users Data & Pagination Signals
  readonly users = signal<AdminUserItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly currentPage = signal<number>(1);
  readonly totalItems = signal<number>(0);
  readonly totalPages = signal<number>(1);
  readonly itemsPerPage = 8;

  // Search & Filter Signals
  readonly searchQuery = signal<string>('');
  readonly roleFilter = signal<string>('ALL');
  readonly statusFilter = signal<string>('ALL');

  // Modals & Active State Signals
  readonly isCreateModModalOpen = signal<boolean>(false);
  readonly isSubmittingMod = signal<boolean>(false);
  readonly activePreviewUser = signal<AdminUserItem | null>(null);
  readonly activeUserDetail = signal<AdminUserDetail | null>(null);
  readonly isLoadingDetail = signal<boolean>(false);

  readonly isEditUserModalOpen = signal<boolean>(false);
  readonly activeEditUser = signal<AdminUserItem | null>(null);
  readonly isSubmittingEdit = signal<boolean>(false);

  readonly isLockModalOpen = signal<boolean>(false);
  readonly activeLockUser = signal<AdminUserItem | null>(null);
  readonly lockReason = signal<string>('');
  readonly isSubmittingLock = signal<boolean>(false);

  readonly isRoleModalOpen = signal<boolean>(false);
  readonly activeRoleUser = signal<AdminUserItem | null>(null);
  readonly selectedNewRole = signal<UserRole>('NORMAL');
  readonly isSubmittingRole = signal<boolean>(false);

  readonly confirmationUser = signal<AdminUserItem | null>(null);
  readonly confirmationAction = signal<'UNLOCK' | 'DELETE' | null>(null);
  readonly isSubmittingConfirmation = signal<boolean>(false);

  // New Mod form fields
  modUsername = '';
  modEmail = '';
  modPassword = '';
  modBio = '';

  // Edit User form fields
  editBio = '';
  editAvatarUrl = '';
  editPassword = '';

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);

    const query: {
      search?: string;
      role?: UserRole;
      status?: UserStatus;
      page: number;
      limit: number;
    } = {
      page: this.currentPage(),
      limit: this.itemsPerPage,
    };

    const searchStr = this.searchQuery().trim();
    if (searchStr) {
      query.search = searchStr;
    }

    const roleStr = this.roleFilter();
    if (roleStr !== 'ALL') {
      query.role = roleStr as UserRole;
    }

    const statusStr = this.statusFilter();
    if (statusStr !== 'ALL') {
      query.status = statusStr as UserStatus;
    }

    this.adminApi.getAdminUsers(query).subscribe({
      next: ({ data }) => {
        this.users.set(data.items);
        this.totalItems.set(data.meta.totalItems);
        this.totalPages.set(Math.max(1, data.meta.totalPages));
        this.currentPage.set(data.meta.currentPage);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.users.set([]);
        this.isLoading.set(false);
        this.toast.error(getApiErrorMessage(error), 'Tải danh sách người dùng thất bại');
      },
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onRoleFilterChange(role: string): void {
    this.roleFilter.set(role);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.loadUsers();
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('ALL');
    this.statusFilter.set('ALL');
    this.currentPage.set(1);
    this.loadUsers();
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadUsers();
    }
  }

  get pageNumbers(): Array<number | 'ellipsis'> {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const visiblePages = new Set<number>([
      1,
      total,
      current - 1,
      current,
      current + 1,
    ]);
    const sortedPages = [...visiblePages]
      .filter((page) => page >= 1 && page <= total)
      .sort((left, right) => left - right);
    const result: Array<number | 'ellipsis'> = [];

    sortedPages.forEach((page, index) => {
      const previousPage = sortedPages[index - 1];
      if (previousPage && page - previousPage > 1) {
        result.push('ellipsis');
      }
      result.push(page);
    });

    return result;
  }

  // --- Preview Detail Modal (A11) ---
  setPreviewUser(user: AdminUserItem): void {
    this.activePreviewUser.set(user);
    this.activeUserDetail.set(null);
    this.isLoadingDetail.set(true);

    this.adminApi.getAdminUserById(user.id).subscribe({
      next: ({ data }) => {
        this.activeUserDetail.set(data);
        this.isLoadingDetail.set(false);
      },
      error: (error: unknown) => {
        this.isLoadingDetail.set(false);
        this.toast.error(getApiErrorMessage(error), 'Không thể tải chi tiết người dùng');
      },
    });
  }

  closePreviewUserModal(): void {
    this.activePreviewUser.set(null);
    this.activeUserDetail.set(null);
  }

  // --- Create Moderator Modal (A10) ---
  openCreateModModal(): void {
    this.modUsername = '';
    this.modEmail = '';
    this.modPassword = '';
    this.modBio = '';
    this.isCreateModModalOpen.set(true);
  }

  closeCreateModModal(): void {
    this.isCreateModModalOpen.set(false);
  }

  submitCreateMod(): void {
    if (!this.modUsername.trim() || !this.modEmail.trim() || !this.modPassword.trim()) {
      this.toast.warning('Vui lòng điền đầy đủ thông tin bắt buộc (Username, Email, Mật khẩu).');
      return;
    }

    if (this.modPassword.trim().length < 6) {
      this.toast.warning('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    this.isSubmittingMod.set(true);

    const payload: CreateModeratorRequest = {
      username: this.modUsername.trim(),
      email: this.modEmail.trim(),
      password: this.modPassword.trim(),
      ...(this.modBio.trim() ? { bio: this.modBio.trim() } : {}),
    };

    this.adminApi.createModerator(payload).subscribe({
      next: () => {
        this.isSubmittingMod.set(false);
        this.toast.success('Tạo tài khoản Content Moderator thành công!');
        this.closeCreateModModal();
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.isSubmittingMod.set(false);
        this.toast.error(getApiErrorMessage(error), 'Tạo Moderator thất bại');
      },
    });
  }

  // --- Edit User Modal (A12) ---
  openEditUserModal(user: AdminUserItem): void {
    this.activeEditUser.set(user);
    this.editBio = user.bio || '';
    this.editAvatarUrl = user.avatarUrl || '';
    this.editPassword = '';
    this.isEditUserModalOpen.set(true);
  }

  closeEditUserModal(): void {
    this.isEditUserModalOpen.set(false);
    this.activeEditUser.set(null);
  }

  submitEditUser(): void {
    const user = this.activeEditUser();
    if (!user) return;

    if (this.editPassword.trim() && this.editPassword.trim().length < 6) {
      this.toast.warning('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    this.isSubmittingEdit.set(true);

    const body: { password?: string; bio?: string; avatarUrl?: string } = {};
    if (this.editBio.trim() !== (user.bio || '')) {
      body.bio = this.editBio.trim();
    }
    if (this.editAvatarUrl.trim() !== (user.avatarUrl || '')) {
      body.avatarUrl = this.editAvatarUrl.trim();
    }
    if (this.editPassword.trim()) {
      body.password = this.editPassword.trim();
    }

    this.adminApi.updateAdminUser(user.id, body).subscribe({
      next: () => {
        this.isSubmittingEdit.set(false);
        this.toast.success('Cập nhật thông tin người dùng thành công!');
        this.closeEditUserModal();
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.isSubmittingEdit.set(false);
        this.toast.error(getApiErrorMessage(error), 'Cập nhật người dùng thất bại');
      },
    });
  }

  // --- Lock User Modal (A13) ---
  openLockModal(user: AdminUserItem): void {
    this.activeLockUser.set(user);
    this.lockReason.set('');
    this.isLockModalOpen.set(true);
  }

  closeLockModal(): void {
    this.isLockModalOpen.set(false);
    this.activeLockUser.set(null);
  }

  submitLockUser(): void {
    const user = this.activeLockUser();
    const reason = this.lockReason().trim();

    if (!user || !reason) {
      this.toast.warning('Vui lòng nhập lý do khóa tài khoản.');
      return;
    }

    this.isSubmittingLock.set(true);

    this.adminApi.lockUser(user.id, { reason }).subscribe({
      next: () => {
        this.isSubmittingLock.set(false);
        this.toast.success(`Đã khóa tài khoản ${user.username || user.email}`);
        this.closeLockModal();
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.isSubmittingLock.set(false);
        this.toast.error(getApiErrorMessage(error), 'Khóa tài khoản thất bại');
      },
    });
  }

  // --- Unlock User (A14) ---
  unlockUser(user: AdminUserItem): void {
    this.confirmationUser.set(user);
    this.confirmationAction.set('UNLOCK');
  }

  closeUserConfirmation(): void {
    if (this.isSubmittingConfirmation()) return;
    this.confirmationUser.set(null);
    this.confirmationAction.set(null);
  }

  submitUserConfirmation(): void {
    const user = this.confirmationUser();
    const action = this.confirmationAction();
    if (!user || !action) return;

    this.isSubmittingConfirmation.set(true);

    if (action === 'DELETE') {
      this.executeSoftDelete(user);
      return;
    }

    this.adminApi.unlockUser(user.id).subscribe({
      next: () => {
        this.isSubmittingConfirmation.set(false);
        this.toast.success(`Đã mở khóa tài khoản ${user.username || user.email}`);
        this.closeUserConfirmation();
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.isSubmittingConfirmation.set(false);
        this.toast.error(getApiErrorMessage(error), 'Mở khóa thất bại');
      },
    });
  }

  // --- Change User Role Modal (A15) ---
  openRoleModal(user: AdminUserItem): void {
    this.activeRoleUser.set(user);
    this.selectedNewRole.set(user.role);
    this.isRoleModalOpen.set(true);
  }

  closeRoleModal(): void {
    this.isRoleModalOpen.set(false);
    this.activeRoleUser.set(null);
  }

  submitChangeRole(): void {
    const user = this.activeRoleUser();
    const newRole = this.selectedNewRole();

    if (!user || !newRole) return;

    if (newRole === user.role) {
      this.closeRoleModal();
      return;
    }

    this.isSubmittingRole.set(true);

    this.adminApi.changeUserRole(user.id, { role: newRole }).subscribe({
      next: () => {
        this.isSubmittingRole.set(false);
        this.toast.success(`Đã đổi vai trò của ${user.username || user.email} thành ${newRole}`);
        this.closeRoleModal();
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.isSubmittingRole.set(false);
        this.toast.error(getApiErrorMessage(error), 'Đổi vai trò thất bại');
      },
    });
  }

  // --- Soft Delete User (A16) ---
  softDeleteUser(user: AdminUserItem): void {
    this.confirmationUser.set(user);
    this.confirmationAction.set('DELETE');
  }

  private executeSoftDelete(user: AdminUserItem): void {
    this.adminApi.deleteAdminUser(user.id).subscribe({
      next: () => {
        this.isSubmittingConfirmation.set(false);
        this.toast.success(`Đã xóa mềm người dùng ${user.username || user.email}`);
        this.closeUserConfirmation();
        this.loadUsers();
      },
      error: (error: unknown) => {
        this.isSubmittingConfirmation.set(false);
        this.toast.error(getApiErrorMessage(error), 'Xóa mềm thất bại');
      },
    });
  }

  get userConfirmationTitle(): string {
    const key =
      this.confirmationAction() === 'DELETE'
        ? 'users.delete_confirm_title'
        : 'users.unlock_confirm_title';
    return this.ts.translate(key);
  }

  get userConfirmationMessage(): string {
    const user = this.confirmationUser();
    const key =
      this.confirmationAction() === 'DELETE' ? 'users.confirm_delete' : 'users.confirm_unlock';
    return `${this.ts.translate(key)} ${user?.username || user?.email || ''}?`;
  }

  get userConfirmationLabel(): string {
    const key = this.confirmationAction() === 'DELETE' ? 'users.soft_delete' : 'users.unlock_user';
    return this.ts.translate(key);
  }

  // Helper formatting methods
  getRoleClass(role: UserRole): string {
    switch (role) {
      case 'BLOG_OWNER':
        return 'text-aquamarine-600 dark:text-aquamarine-400';
      case 'CONTENT_MODERATOR':
        return 'text-amber-600 dark:text-amber-400';
      case 'SUPER_ADMIN':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
  }
}
