import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface UserItem {
  id: number;
  email: string;
  role: 'NORMAL_USER' | 'BLOG_OWNER' | 'CONTENT_MODERATOR' | 'SUPER_ADMIN';
  roleClass: string;
  status: 'ACTIVE' | 'LOCKED';
}

@Component({
  selector: 'app-manage-users',
  imports: [FormsModule],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css',
})
export class ManageUsers {
  usersMockData: UserItem[] = [];
  currentPage = signal<number>(1);
  itemsPerPage = 8;

  // New Mod form fields
  modEmail = '';
  modPassword = '';
  modNote = '';

  activePreviewUser = signal<UserItem | null>(null);

  constructor() {
    const baseUsers: Omit<UserItem, 'id'>[] = [
      { email: 'son@example.com', role: 'NORMAL_USER', roleClass: 'text-secondary', status: 'ACTIVE' },
      { email: 'owner@example.com', role: 'BLOG_OWNER', roleClass: 'text-primary', status: 'ACTIVE' },
      { email: 'mod@example.com', role: 'CONTENT_MODERATOR', roleClass: 'text-danger', status: 'ACTIVE' },
      { email: 'spam@example.com', role: 'NORMAL_USER', roleClass: 'text-secondary', status: 'LOCKED' }
    ];

    for (let i = 0; i < 30; i++) {
      const user = { ...baseUsers[i % baseUsers.length] } as UserItem;
      user.id = i + 1;
      user.email = `user${i + 1}_${user.email}`;
      this.usersMockData.push(user);
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

  submitCreateMod() {
    if (!this.modEmail.trim() || !this.modPassword.trim()) return;
    alert('Mock: Đã tạo tài khoản Moderator thành công!');
    const newMod: UserItem = {
      id: this.usersMockData.length + 1,
      email: this.modEmail,
      role: 'CONTENT_MODERATOR',
      roleClass: 'text-danger',
      status: 'ACTIVE'
    };
    this.usersMockData.unshift(newMod);
    this.modEmail = '';
    this.modPassword = '';
    this.modNote = '';
  }

  grantBlogOwner(user: UserItem) {
    if (confirm('Cấp quyền Blog Owner cho user này?')) {
      alert('Đã cấp quyền');
      const idx = this.usersMockData.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        this.usersMockData[idx].role = 'BLOG_OWNER';
        this.usersMockData[idx].roleClass = 'text-primary';
      }
    }
  }

  revokeBlogOwner(user: UserItem) {
    if (confirm('Giáng cấp user này?')) {
      alert('Đã giáng cấp');
      const idx = this.usersMockData.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        this.usersMockData[idx].role = 'NORMAL_USER';
        this.usersMockData[idx].roleClass = 'text-secondary';
      }
    }
  }

  lockUser(user: UserItem) {
    if (confirm('Khóa user này?')) {
      alert('Đã khóa');
      const idx = this.usersMockData.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        this.usersMockData[idx].status = 'LOCKED';
      }
    }
  }

  unlockUser(user: UserItem) {
    if (confirm('Mở khóa user này?')) {
      alert('Đã mở khóa');
      const idx = this.usersMockData.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        this.usersMockData[idx].status = 'ACTIVE';
      }
    }
  }
}
