import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
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
import { TextSearchComponent } from '../../../../shared/components/text-search/text-search';
import { DropdownOption } from '../../../../shared/components/single-dropdown/single-dropdown';
import {
  LanguageBadgesComponent,
  PostLanguageItem,
} from '../../../../shared/components/language-badges/language-badges';

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
    TextSearchComponent,
    LanguageBadgesComponent,
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
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal<boolean>(true);
  readonly loadingPreviewPostId =signal<number | null>(null);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly isForbidden = signal<boolean>(false);
  readonly posts = signal<ModeratorPostItem[]>([]);
  readonly meta = signal<ModeratorPaginationMeta | null>(null);

  readonly statusFilter = signal<ModeratorPostStatus>('PENDING_REVIEW');
  readonly searchQuery = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly limit = 10;

  readonly statusOptions = computed<DropdownOption[]>(() => {
    this.ts.currentLang();
    return [
      { label: this.ts.translate('filter.status.pending_review'), value: 'PENDING_REVIEW', icon: 'bi bi-clock-history' },
      { label: this.ts.translate('filter.status.published'), value: 'PUBLISH', icon: 'bi bi-check2-circle' },
      { label: this.ts.translate('filter.status.rejected'), value: 'REJECT', icon: 'bi bi-x-circle' },
    ];
  });

  readonly activePreviewBlog = signal<ModeratorPostItem | null>(null);
  readonly activePreviewPost = computed<BlogOwnerPost | null>(() => {
    const blog = this.activePreviewBlog();
    return blog ? this.toPreviewPost(blog) : null;
  });
  readonly activeRejectBlog = signal<ModeratorPostItem | null>(null);
  rejectReason = '';

  ngOnInit(): void {
  this.route.queryParamMap.subscribe(
    (params) => {
      // =====================
      // PAGE
      // =====================

      const rawPage =
        Number(params.get('page'));

      this.currentPage.set(
        Number.isInteger(rawPage) &&
        rawPage > 0
          ? rawPage
          : 1,
      );

      // =====================
      // SEARCH
      // =====================

      this.searchQuery.set(
        params.get('search') ?? '',
      );

      // =====================
      // STATUS
      // =====================

      const rawStatus =
        params.get('status');

      const validStatuses:
        ModeratorPostStatus[] = [
          'PENDING_REVIEW',
          'PUBLISH',
          'REJECT',
        ];

      const status =
        rawStatus &&
        validStatuses.includes(
          rawStatus as
            ModeratorPostStatus,
        )
          ? (rawStatus as
              ModeratorPostStatus)
          : 'PENDING_REVIEW';

      this.statusFilter.set(status);

      this.loadPosts();
    },
  );
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
            this.error.set(this.ts.translate('moderator.load_blogs_error'));
          }
        },
        error: (err) => {
          this.loading.set(false);
          if (err?.status === 403) {
            this.isForbidden.set(true);
            this.error.set(this.ts.translate('moderator.forbidden_error_desc'));
            this.toast.show('error', this.ts.translate('moderator.forbidden_toast_title'), this.ts.translate('moderator.forbidden_toast_desc'));
          } else {
            const errMsg = err?.error?.message || this.ts.translate('moderator.load_blogs_api_error');
            this.error.set(
              typeof errMsg === 'string'
                ? errMsg
                : Array.isArray(errMsg)
                ? errMsg.join(', ')
                : this.ts.translate('common.connection_error'),
            );
            this.toast.show('error', this.ts.translate('common.error'), this.ts.translate('moderator.cannot_load_blogs'));
          }
        },
      });
  }

  onStatusChange(status: ModeratorPostStatus): void {
  if (
    this.statusFilter() === status
  ) {
    return;
  }

  this.router.navigate([], {
    relativeTo: this.route,

    queryParams: {
      page: 1,
      status,
    },

    queryParamsHandling: 'merge',
  });
}

  onSearch(): void {
  const search =
    this.searchQuery().trim();

  this.router.navigate([], {
    relativeTo: this.route,

    queryParams: {
      page: 1,
      search: search || null,
    },

    queryParamsHandling: 'merge',
  });
}

  clearSearch(): void {
  if (!this.searchQuery()) {
    return;
  }

  this.router.navigate([], {
    relativeTo: this.route,

    queryParams: {
      page: 1,
      search: null,
    },

    queryParamsHandling: 'merge',
  });
}

  setPage(page: number): void {
  const total =
    this.meta()?.totalPages ?? 1;

  if (
    page < 1 ||
    page > total ||
    page === this.currentPage() ||
    this.loading()
  ) {
    return;
  }

  this.router.navigate([], {
    relativeTo: this.route,

    queryParams: {
      page,
    },

    queryParamsHandling: 'merge',
  });
}

  readonly pageItems = computed(() => {
    const totalPages = this.meta()?.totalPages || 1;
    const current = this.currentPage();

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => ({ type: 'page' as const, value: i + 1 }));
    }

    let start = Math.max(1, current - 2);
    let end = start + 4;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - 4);
    }

    const items: Array<{ type: 'page' | 'ellipsis'; value: number | null }> = [];
    if (start > 1) {
      items.push({ type: 'ellipsis', value: null });
    }
    for (let p = start; p <= end; p++) {
      items.push({ type: 'page', value: p });
    }
    if (end < totalPages) {
      items.push({ type: 'ellipsis', value: null });
    }
    return items;
  });

  setPreviewBlog(blog: ModeratorPostItem) {
  /**
   * Hiện dữ liệu list trước để modal mở ngay.
   */
  this.activePreviewBlog.set(blog);

  /**
   * Sau đó lấy detail ROOT.
   */
  this.loadPreviewVersion(blog.id);
}

loadPreviewVersion(postId: number) {
  /**
   * Không gọi lại version đang active.
   */
  if (
    this.activePreviewBlog()?.id === postId &&
    this.activePreviewBlog()?.translations?.length
  ) {
    return;
  }

  this.loadingPreviewPostId.set(postId);

  this.moderatorApiService
    .getModeratorPostDetail(postId)
    .subscribe({
      next: (res) => {
        this.loadingPreviewPostId.set(null);

        if (res.success && res.data) {
          /**
           * res.data có thể là:
           * - ROOT
           * - EN
           * - JA
           * - KO...
           *
           * Và luôn có translations summary của cả group.
           */
          this.activePreviewBlog.set(res.data);
        }
      },

      error: (err) => {
        this.loadingPreviewPostId.set(null);

        const errMsg =
          err?.error?.message ||
          this.ts.translate('moderator.load_version_detail_error');

        this.toast.show(
          'error',
          this.ts.translate('common.error'),
          typeof errMsg === 'string'
            ? errMsg
            : Array.isArray(errMsg)
              ? errMsg.join(', ')
              : this.ts.translate('common.connection_error'),
        );
      },
    });
}

  closePreviewBlog() {
  this.activePreviewBlog.set(null);
  this.loadingPreviewPostId.set(null);
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
      translations: (blog.translations ?? []).map(
  (version) => ({
    id: version.id,
    title: version.title,
    thumbnailUrl:
      version.thumbnailUrl ?? null,
    status: version.status,
    parentPostId:
      version.parentPostId ?? null,
    languageId: version.languageId,

    language: {
      id: version.language.id,
      code: version.language.code,
      name: version.language.name,
      flag:
        version.language.flag ?? null,
    },
  }),
),
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
  const rootPostId =
    blog.parentPostId ?? blog.id;

  if (
    confirm(
      `${this.ts.translate('moderator.approve_confirm_prefix')} "${blog.title}" ${this.ts.translate('moderator.approve_confirm_suffix')}`,
    )
  ) {
    this.actionLoading.set(true);

    this.moderatorApiService
      .approvePost(rootPostId)
      .subscribe({
        next: (res) => {
          this.actionLoading.set(false);
          if (res.success) {
            this.toast.show('success', this.ts.translate('common.success'), `${this.ts.translate('moderator.approve_success_prefix')} "${blog.title}" ${this.ts.translate('moderator.approve_success_suffix')}`);
            this.closePreviewBlog();
            if (this.activePreviewBlog()?.id === blog.id) {
              this.activePreviewBlog.set(res.data);
            }
            this.loadPosts();
          }
        },
        error: (err) => {
          this.actionLoading.set(false);
          const errMsg = err?.error?.message || this.ts.translate('moderator.approve_error');
          const messageStr = typeof errMsg === 'string' ? errMsg : Array.isArray(errMsg) ? errMsg.join(', ') : this.ts.translate('common.processing_error');
          this.toast.show('error', this.ts.translate('moderator.approve_error_title'), messageStr);
        },
      });
    }
  }

  submitReject() {
    const reason = this.rejectReason.trim();
    if (!reason) {
      this.toast.show('warning', this.ts.translate('common.warning'), this.ts.translate('moderator.reject_reason_required'));
      return;
    }

    const blog = this.activeRejectBlog();
    if (blog) {
      this.actionLoading.set(true);
      const rootPostId =
  blog.parentPostId ?? blog.id;

this.moderatorApiService.rejectPost(
  rootPostId,
  {
    rejectionReason: reason,
  },
).subscribe({
        next: (res) => {
          this.actionLoading.set(false);
          if (res.success) {
            this.toast.show('success', this.ts.translate('common.success'), `${this.ts.translate('moderator.reject_success_prefix')} "${blog.title}".`);
            if (this.activePreviewBlog()?.id === blog.id) {
              this.activePreviewBlog.set(res.data);
            }
            this.closeRejectModal();
            this.loadPosts();
          }
        },
        error: (err) => {
          this.actionLoading.set(false);
          const errMsg = err?.error?.message || this.ts.translate('moderator.reject_error');
          const messageStr = typeof errMsg === 'string' ? errMsg : Array.isArray(errMsg) ? errMsg.join(', ') : this.ts.translate('common.processing_error');
          this.toast.show('error', this.ts.translate('moderator.reject_error_title'), messageStr);
        },
      });
    }
  }

  getPostLanguages(blog: ModeratorPostItem): PostLanguageItem[] {
    const list: PostLanguageItem[] = [];

    if (blog.language) {
      list.push({
        id: blog.language.id,
        code: blog.language.code,
        name: blog.language.name,
        flag: blog.language.flag,
        isOriginal: !blog.parentPostId,
        status: blog.status,
      });
    }

    if (blog.translations && blog.translations.length > 0) {
      for (const t of blog.translations) {
        if (
          t.language &&
          !list.some(
            (item) => item.code.toLowerCase() === t.language.code.toLowerCase(),
          )
        ) {
          list.push({
            id: t.language.id,
            code: t.language.code,
            name: t.language.name,
            flag: t.language.flag,
            isOriginal: false,
            status: t.status,
          });
        }
      }
    }

    return list;
  }

  logoutAndSwitchAccount() {
    this.auth.logout();
    this.router.navigate(['/auth']);
  }
}
