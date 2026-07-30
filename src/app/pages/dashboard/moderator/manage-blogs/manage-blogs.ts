import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface BlogItem {
  id: number;
  title: string;
  author: string;
  category: string;
  lang: string;
  status: string;
}

@Component({
  selector: 'app-manage-blogs',
  imports: [FormsModule],
  templateUrl: './manage-blogs.html',
  styleUrl: './manage-blogs.css',
})
export class ManageBlogs {
  blogsMockData: BlogItem[] = [];
  currentPage = signal<number>(1);
  itemsPerPage = 8;

  activePreviewBlog = signal<BlogItem | null>(null);
  activeRejectBlog = signal<BlogItem | null>(null);
  rejectReason = '';

  constructor() {
    const baseBlogs: Omit<BlogItem, 'id'>[] = [
      { title: 'Hướng dẫn học ReactJS cơ bản cho người mới', author: 'User A', category: 'Frontend', lang: 'VI', status: 'Chờ duyệt' },
      { title: '10 mẹo tối ưu hiệu suất với CSS', author: 'DevMaster', category: 'Frontend', lang: 'EN', status: 'Chờ duyệt' },
      { title: 'Tìm hiểu về Web Components', author: 'CodeLover', category: 'Web Design', lang: 'VI', status: 'Chờ duyệt' }
    ];

    for (let i = 0; i < 25; i++) {
      const blog = { ...baseBlogs[i % baseBlogs.length] } as BlogItem;
      blog.id = i + 1;
      blog.title = `${blog.title} (Phần ${i + 1})`;
      this.blogsMockData.push(blog);
    }
  }

  totalPages = computed(() => Math.ceil(this.blogsMockData.length / this.itemsPerPage));

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  }

  get paginatedBlogs(): BlogItem[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.blogsMockData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  setPreviewBlog(blog: BlogItem) {
    this.activePreviewBlog.set(blog);
  }

  closePreviewBlog() {
    this.activePreviewBlog.set(null);
  }

  setRejectBlog(blog: BlogItem) {
    this.activeRejectBlog.set(blog);
    this.rejectReason = '';
  }

  closeRejectModal() {
    this.activeRejectBlog.set(null);
  }

  approveBlog(blog: BlogItem) {
    if (confirm('Xác nhận duyệt bài viết này?')) {
      alert('Đã duyệt bài viết thành công!');
      this.blogsMockData = this.blogsMockData.filter(b => b.id !== blog.id);
      this.adjustCurrentPage();
    }
  }

  submitReject() {
    if (!this.rejectReason.trim()) return;
    const blog = this.activeRejectBlog();
    if (blog) {
      alert('Mock: Đã từ chối bài viết với lý do:\n' + this.rejectReason);
      this.blogsMockData = this.blogsMockData.filter(b => b.id !== blog.id);
      this.adjustCurrentPage();
      this.activeRejectBlog.set(null);
    }
  }

  private adjustCurrentPage() {
    const maxPages = Math.ceil(this.blogsMockData.length / this.itemsPerPage);
    if (this.currentPage() > maxPages && maxPages >= 1) {
      this.currentPage.set(maxPages);
    }
  }
}
