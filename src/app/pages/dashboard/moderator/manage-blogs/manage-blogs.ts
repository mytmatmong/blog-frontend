import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../../../core/services/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ModeratorApiService } from '../../../../core/services/moderator-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  ModeratorPaginationMeta,
  ModeratorPostItem,
  ModeratorPostStatus,
} from '../../../../core/models/moderator-api.model';
import { BlogOwnerPost } from '../../../../core/models/blog-owner.model';
import { OwnerPostPreviewComponent } from '../../../../shared/components/owner-post-preview/owner-post-preview';
import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button';
import { TextButtonComponent } from '../../../../shared/components/text-button/text-button';

@Component({
  selector: 'app-manage-blogs',
  imports: [
    FormsModule,
    DatePipe,
    TranslatePipe,
    OwnerPostPreviewComponent,
    BadgeComponent,
    IconButtonComponent,
    TextButtonComponent,
  ],
  templateUrl: './manage-blogs.html',
  styleUrl: './manage-blogs.css',
})
export class ManageBlogs implements OnInit {
  protected readonly ts = inject(TranslationService);
  private readonly moderatorApiService = inject(ModeratorApiService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal<boolean>(true);
  readonly loadingDetail = signal<boolean>(false);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly isForbidden = signal<boolean>(false);
  readonly posts = signal<ModeratorPostItem[]>([]);
  readonly meta = signal<ModeratorPaginationMeta | null>(null);

  readonly statusFilter = signal<ModeratorPostStatus>('PENDING_REVIEW');
  readonly searchQuery = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly limit = 10;

  readonly activePreviewBlog = signal<ModeratorPostItem | null>(null);
  readonly activePreviewPost = computed<BlogOwnerPost | null>(() => {
    const blog = this.activePreviewBlog();
    return blog ? this.toPreviewPost(blog) : null;
  });
  readonly activeRejectBlog = signal<ModeratorPostItem | null>(null);
  rejectReason = '';

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.loading.set(true);
    this.error.set(null);
    this.isForbidden.set(false);

    this.moderatorApiService
      .getModeratorPosts({
        status: this.statusFilter(),
        search: this.searchQuery(),
        page: this.currentPage(),
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.data) {
            this.posts.set(res.data.items);
            this.meta.set(res.data.meta);
          } else {
            this.error.set('Không thể tải danh sách bài viết.');
          }
        },
        error: (err) => {
          this.loading.set(false);
          if (err?.status === 403) {
            this.isForbidden.set(true);
            this.error.set(
              'Tài khoản hiện tại không có quyền CONTENT_MODERATOR. Backend yêu cầu tài khoản phải có vai trò Moderator để truy cập danh sách kiểm duyệt.',
            );
            this.toast.show('error', '403 Forbidden', 'Yêu cầu tài khoản Content Moderator');
          } else {
            const errMsg = err?.error?.message || 'Lỗi khi lấy danh sách bài viết kiểm duyệt.';
            this.error.set(
              typeof errMsg === 'string'
                ? errMsg
                : Array.isArray(errMsg)
                ? errMsg.join(', ')
                : 'Lỗi kết nối.',
            );
            this.toast.show('error', 'Lỗi', 'Không thể tải danh sách bài viết');
          }
        },
      });
  }

  onStatusChange(status: ModeratorPostStatus) {
    if (this.statusFilter() !== status) {
      this.statusFilter.set(status);
      this.currentPage.set(1);
      this.loadPosts();
    }
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadPosts();
  }

  clearSearch() {
    if (this.searchQuery()) {
      this.searchQuery.set('');
      this.currentPage.set(1);
      this.loadPosts();
    }
  }

  setPage(page: number) {
    const total = this.meta()?.totalPages || 1;
    if (page >= 1 && page <= total && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadPosts();
    }
  }

  readonly pageNumbers = computed(() => {
    const totalPages = this.meta()?.totalPages || 1;
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  });

  setPreviewBlog(blog: ModeratorPostItem) {
    this.activePreviewBlog.set(blog);
    this.loadingDetail.set(true);

    this.moderatorApiService.getModeratorPostDetail(blog.id).subscribe({
      next: (res) => {
        this.loadingDetail.set(false);
        if (res.success && res.data) {
          this.activePreviewBlog.set(res.data);
        }
      },
      error: (err) => {
        this.loadingDetail.set(false);
        const errMsg = err?.error?.message || 'Không thể lấy chi tiết bài viết.';
        this.toast.show(
          'error',
          'Lỗi',
          typeof errMsg === 'string'
            ? errMsg
            : Array.isArray(errMsg)
            ? errMsg.join(', ')
            : 'Lỗi kết nối.',
        );
      },
    });
  }

  closePreviewBlog() {
    this.activePreviewBlog.set(null);
    this.loadingDetail.set(false);
  }

  private toPreviewPost(blog: ModeratorPostItem): BlogOwnerPost {
    return {
      id: blog.id,
      title: blog.title,
      thumbnailUrl: blog.thumbnailUrl ?? null,
      content: blog.content,
      status: blog.status,
      viewCount: blog.viewCount ?? 0,
      likeCount: 0,
      publishedAt: blog.publishedAt ?? null,
      parentPostId: blog.parentPostId ?? null,
      authorId: blog.authorId,
      languageId: blog.languageId,
      reviewedAt: blog.reviewedAt ?? null,
      rejectionReason: blog.rejectionReason ?? null,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
      author: {
        id: blog.author.id,
        username: blog.author.username,
        bio: blog.author.bio ?? null,
        avatarUrl: blog.author.avatarUrl ?? null,
      },
      language: {
        id: blog.language.id,
        code: blog.language.code,
        name: blog.language.name,
        flag: blog.language.flag ?? null,
        isDefault: blog.language.isDefault ?? false,
        isActive: blog.language.isActive ?? true,
      },
      categories: blog.categories.map((category) => ({
        id: category.id,
        name: category.name,
        languageId: category.languageId ?? blog.languageId,
        categoryGroupId: category.categoryGroupId ?? 0,
      })),
      tags: blog.tags.map((tag) => ({ ...tag })),
      media: blog.media.map((item) => ({
        id: item.id,
        postId: item.postId,
        mediaType: item.mediaType as 'IMAGE' | 'VIDEO',
        mediaUrl: item.mediaUrl,
        publicId: item.publicId,
        createdAt: item.createdAt,
      })),
    };
  }

  setRejectBlog(blog: ModeratorPostItem) {
    this.activeRejectBlog.set(blog);
    this.rejectReason = '';
  }

  closeRejectModal() {
    this.activeRejectBlog.set(null);
    this.rejectReason = '';
  }

  approveBlog(blog: ModeratorPostItem) {
    if (confirm(`Bạn có chắc chắn muốn duyệt bài viết "${blog.title}"?`)) {
      this.actionLoading.set(true);
      this.moderatorApiService.approvePost(blog.id).subscribe({
        next: (res) => {
          this.actionLoading.set(false);
          if (res.success) {
            this.toast.show('success', 'Thành công', `Đã duyệt bài viết "${blog.title}" thành công.`);
            if (this.activePreviewBlog()?.id === blog.id) {
              this.activePreviewBlog.set(res.data);
            }
            this.loadPosts();
          }
        },
        error: (err) => {
          this.actionLoading.set(false);
          const errMsg = err?.error?.message || 'Không thể duyệt bài viết.';
          const messageStr = typeof errMsg === 'string' ? errMsg : Array.isArray(errMsg) ? errMsg.join(', ') : 'Lỗi xử lý.';
          this.toast.show('error', 'Lỗi duyệt bài viết', messageStr);
        },
      });
    }
  }

  submitReject() {
    const reason = this.rejectReason.trim();
    if (!reason) {
      this.toast.show('warning', 'Cảnh báo', 'Vui lòng nhập lý do từ chối bài viết');
      return;
    }

    const blog = this.activeRejectBlog();
    if (blog) {
      this.actionLoading.set(true);
      this.moderatorApiService.rejectPost(blog.id, { rejectionReason: reason }).subscribe({
        next: (res) => {
          this.actionLoading.set(false);
          if (res.success) {
            this.toast.show('success', 'Thành công', `Đã từ chối bài viết "${blog.title}".`);
            if (this.activePreviewBlog()?.id === blog.id) {
              this.activePreviewBlog.set(res.data);
            }
            this.closeRejectModal();
            this.loadPosts();
          }
        },
        error: (err) => {
          this.actionLoading.set(false);
          const errMsg = err?.error?.message || 'Không thể từ chối bài viết.';
          const messageStr = typeof errMsg === 'string' ? errMsg : Array.isArray(errMsg) ? errMsg.join(', ') : 'Lỗi xử lý.';
          this.toast.show('error', 'Lỗi từ chối bài viết', messageStr);
        },
      });
    }
  }

  logoutAndSwitchAccount() {
    this.auth.logout();
    this.router.navigate(['/auth']);
  }
}
