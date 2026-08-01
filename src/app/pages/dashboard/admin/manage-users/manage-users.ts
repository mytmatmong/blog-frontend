import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../../core/services/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

interface UserItem {
  id: number;
  email: string;
  role: 'NORMAL_USER' | 'BLOG_OWNER' | 'CONTENT_MODERATOR' | 'SUPER_ADMIN';
  roleClass: string;
  status: 'ACTIVE' | 'LOCKED';
}

@Component({
  selector: 'app-manage-users',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css',
})
export class ManageUsers {
  protected readonly ts = inject(TranslationService);
  usersMockData: UserItem[] = [];
  currentPage = signal<number>(1);
  itemsPerPage = 8;

  // New Mod form fields
  modEmail = '';
  modPassword = '';
  modNote = '';

  isCreateModModalOpen = signal<boolean>(false);
  activePreviewUser = signal<UserItem | null>(null);

  constructor() {
    const roles: ('NORMAL_USER' | 'BLOG_OWNER' | 'CONTENT_MODERATOR' | 'SUPER_ADMIN')[] = [
      'NORMAL_USER', 'BLOG_OWNER', 'CONTENT_MODERATOR', 'SUPER_ADMIN'
    ];

    for (let i = 0; i < 25; i++) {
      const role = roles[i % roles.length];
      let roleClass = 'text-gray-600 dark:text-gray-400';
      if (role === 'BLOG_OWNER') roleClass = 'text-aquamarine-600 dark:text-aquamarine-400';
      if (role === 'CONTENT_MODERATOR') roleClass = 'text-amber-600 dark:text-amber-400';
      if (role === 'SUPER_ADMIN') roleClass = 'text-purple-600 dark:text-purple-400';

      this.usersMockData.push({
        id: i + 1,
        email: `user${i + 1}@example.com`,
        role: role,
        roleClass: roleClass,
        status: i % 5 === 0 ? 'LOCKED' : 'ACTIVE'
      });
    }
  }

  totalPages = computed(() => Math.ceil(this.usersMockData.length / this.itemsPerPage));

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  }

  get paginatedUsers(): UserItem[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.usersMockData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  setPreviewUser(user: UserItem) {
    this.activePreviewUser.set(user);
  }

  closePreviewUserModal() {
    this.activePreviewUser.set(null);
  }

  openCreateModModal() {
    this.isCreateModModalOpen.set(true);
  }

  closeCreateModModal() {
    this.isCreateModModalOpen.set(false);
  }

  submitCreateMod() {
    if (!this.modEmail.trim() || !this.modPassword.trim()) return;
    const newMod: UserItem = {
      id: this.usersMockData.length + 1,
      email: this.modEmail,
      role: 'CONTENT_MODERATOR',
      roleClass: 'text-amber-600 dark:text-amber-400',
      status: 'ACTIVE'
    };
    this.usersMockData.unshift(newMod);
    this.modEmail = '';
    this.modPassword = '';
    this.modNote = '';
    this.closeCreateModModal();
  }

  grantBlogOwner(user: UserItem) {
    if (confirm(this.ts.translate('modal.confirm'))) {
      const idx = this.usersMockData.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        this.usersMockData[idx].role = 'BLOG_OWNER';
        this.usersMockData[idx].roleClass = 'text-aquamarine-600 dark:text-aquamarine-400';
      }
    }
  }

  revokeBlogOwner(user: UserItem) {
    if (confirm(this.ts.translate('modal.confirm'))) {
      const idx = this.usersMockData.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        this.usersMockData[idx].role = 'NORMAL_USER';
        this.usersMockData[idx].roleClass = 'text-gray-600 dark:text-gray-400';
      }
    }
  }

  lockUser(user: UserItem) {
    if (confirm(this.ts.translate('modal.confirm'))) {
      const idx = this.usersMockData.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        this.usersMockData[idx].status = 'LOCKED';
      }
    }
  }

  unlockUser(user: UserItem) {
    if (confirm(this.ts.translate('modal.confirm'))) {
      const idx = this.usersMockData.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        this.usersMockData[idx].status = 'ACTIVE';
      }
    }
  }
}
