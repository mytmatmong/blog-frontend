import { DecimalPipe } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  BlogOwnerPost,
  BlogOwnerPostGroup,
} from '../../../../core/models/blog-owner.model';
import {
  PostStatus,
} from '../../../../core/models/post.model';
import {
  BlogOwnerApiService,
} from '../../../../core/services/blog-owner-api.service';
import {
  ToastService,
} from '../../../../core/services/toast.service';
import {
  TranslationService,
} from '../../../../core/services/translation.service';
import {
  getApiErrorMessage,
} from '../../../../core/utils/api-error.util';
import {
  OwnerPostPreviewComponent,
} from '../../../../shared/components/owner-post-preview/owner-post-preview';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import {
  TranslatePipe,
} from '../../../../shared/pipes/translate.pipe';
import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button';
import { TextButtonComponent } from '../../../../shared/components/text-button/text-button';
import { TextSearchComponent } from '../../../../shared/components/text-search/text-search';
import { SingleDropdownComponent, DropdownOption } from '../../../../shared/components/single-dropdown/single-dropdown';
import {
  LanguageBadgesComponent,
  PostLanguageItem,
} from '../../../../shared/components/language-badges/language-badges';

@Component({
  selector: 'app-posts',
  imports: [
    DecimalPipe,
    TranslatePipe,
    OwnerPostPreviewComponent,
    ConfirmDialog,
    BadgeComponent,
    IconButtonComponent,
    TextButtonComponent,
    TextSearchComponent,
    SingleDropdownComponent,
    LanguageBadgesComponent,
  ],
  templateUrl: './posts.html',
  styleUrl: './posts.css',
})
export class Posts implements OnInit {
  private readonly api = inject(BlogOwnerApiService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly ts = inject(TranslationService);

  readonly statusOptions = computed<DropdownOption[]>(() => {
    this.ts.currentLang();
    return [
      { label: this.ts.translate('filter.status.all'), value: '' },
      { label: this.ts.translate('filter.status.draft'), value: 'DRAFT' },
      { label: this.ts.translate('filter.status.pending_review'), value: 'PENDING_REVIEW' },
      { label: this.ts.translate('filter.status.published'), value: 'PUBLISH' },
      { label: this.ts.translate('filter.status.rejected'), value: 'REJECT' },
    ];
  });

  readonly posts =
    signal<BlogOwnerPost[]>([]);

  readonly isLoading =
    signal(true);

  readonly loadError =
    signal<string | null>(null);

  readonly currentPage =
    signal(1);

  readonly itemsPerPage = 8;

  readonly totalItems =
    signal(0);

  readonly totalPages =
    signal(0);

  readonly search =
    signal('');

  readonly statusFilter =
    signal<PostStatus | ''>('');

  readonly activePreviewPost =
    signal<BlogOwnerPost | null>(null);

  readonly submittingPostId =
    signal<number | null>(null);

  readonly deletingPostId =
    signal<number | null>(null);

  readonly pendingSubmitPost =
    signal<BlogOwnerPost | null>(null);

  readonly pendingDeletePost =
    signal<BlogOwnerPost | null>(null);

  private postsRequestId = 0;

  readonly pageItems = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => ({ type: 'page' as const, value: i + 1 }));
    }

    let start = Math.max(1, current - 2);
    let end = start + 4;
    if (end > total) {
      end = total;
      start = Math.max(1, end - 4);
    }

    const items: Array<{ type: 'page' | 'ellipsis'; value: number | null }> = [];
    if (start > 1) {
      items.push({ type: 'ellipsis', value: null });
    }
    for (let p = start; p <= end; p++) {
      items.push({ type: 'page', value: p });
    }
    if (end < total) {
      items.push({ type: 'ellipsis', value: null });
    }
    return items;
  });

  ngOnInit(): void {
  /**
   * URL là nguồn state cho:
   * - page
   * - search
   * - status
   *
   * Nhờ vậy:
   * F5 / Back / Forward vẫn giữ đúng trạng thái.
   */
  this.route.queryParamMap.subscribe(
    (params) => {
      // =====================
      // PAGE
      // =====================

      const rawPage =
        Number(params.get('page'));

      const page =
        Number.isInteger(rawPage) &&
        rawPage > 0
          ? rawPage
          : 1;

      this.currentPage.set(page);

      // =====================
      // SEARCH
      // =====================

      this.search.set(
        params.get('search') ?? '',
      );

      // =====================
      // STATUS
      // =====================

      const rawStatus =
        params.get('status');

      const validStatuses:
        PostStatus[] = [
          'DRAFT',
          'PENDING_REVIEW',
          'PUBLISH',
          'REJECT',
        ];

      const status =
        rawStatus &&
        validStatuses.includes(
          rawStatus as PostStatus,
        )
          ? (rawStatus as PostStatus)
          : '';

      this.statusFilter.set(status);

      // =====================
      // LOAD
      // =====================

      this.loadPosts();
    },
  );
}

  loadPosts(): void {
    const requestId =
      ++this.postsRequestId;

    this.isLoading.set(true);
    this.loadError.set(null);

    const search =
      this.search().trim();

    const status =
      this.statusFilter();

    /**
     * Backend Step 7 đã paginate theo ROOT, nên frontend
     * không fetch toàn bộ pages rồi tự phân trang nữa.
     */
    this.api
      .getPosts({
        search:
          search || undefined,
        status:
          status || undefined,
        page: this.currentPage(),
        limit: this.itemsPerPage,
      })
      .subscribe({
        next: (response) => {
          if (
            requestId !==
            this.postsRequestId
          ) {
            return;
          }

          const page =
            response.data;

          this.posts.set(
            page.items.map(
              (group) =>
                this.toListPost(
                  group,
                ),
            ),
          );

          this.totalItems.set(
            page.meta.totalItems,
          );
          this.totalPages.set(
            page.meta.totalPages,
          );
          this.currentPage.set(
            page.meta.currentPage,
          );

          this.isLoading.set(false);
        },

        error: (error: unknown) => {
          if (
            requestId !==
            this.postsRequestId
          ) {
            return;
          }

          this.posts.set([]);
          this.totalItems.set(0);
          this.totalPages.set(0);

          this.loadError.set(
            getApiErrorMessage(
              error,
              this.ts.translate(
                'posts.load_error',
              ),
            ),
          );

          this.isLoading.set(false);
        },
      });
  }

  onSearchInput(event: Event): void {
    this.search.set(
      (
        event.target as
        HTMLInputElement
      ).value,
    );
  }

  applySearch(): void {
  const search =this.search().trim();

  this.router.navigate([], {
    relativeTo: this.route,

    queryParams: {
      page: 1,
      search: search || null,
    },

    queryParamsHandling: 'merge',
  });
}

  onSearchKeydown(
    event: KeyboardEvent,
  ): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.applySearch();
    }
  }

  onStatusChange(valueOrEvent: string | Event): void {
    const value = typeof valueOrEvent === 'string'
      ? valueOrEvent as PostStatus | ''
      : (valueOrEvent.target as HTMLSelectElement).value as PostStatus | '';

    this.router.navigate([], {
      relativeTo: this.route,

      queryParams: {
        page: 1,

        status:
          value || null,
      },

      queryParamsHandling: 'merge',
    });
  }

  clearFilters(): void {
  this.router.navigate([], {
    relativeTo: this.route,

    queryParams: {
      page: 1,
      search: null,
      status: null,
    },

    queryParamsHandling: 'merge',
  });
}

  setPage(page: number): void {
  if (
    page < 1 ||
    page > this.totalPages() ||
    page === this.currentPage() ||
    this.isLoading()
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

  setPreviewPost(
    post: BlogOwnerPost,
  ): void {
    this.activePreviewPost.set(
      post,
    );
  }

  closePreviewModal(): void {
    this.activePreviewPost.set(
      null,
    );
  }

  submitPost(
    post: BlogOwnerPost,
  ): void {
    if (
      post.status !== 'DRAFT' ||
      this.submittingPostId() !== null
    ) {
      return;
    }

    this.pendingSubmitPost.set(post);
  }

  closeSubmitConfirmation(): void {
    if (this.submittingPostId() === null) {
      this.pendingSubmitPost.set(null);
    }
  }

  confirmSubmitPost(): void {
    const post = this.pendingSubmitPost();

    if (!post || this.submittingPostId() !== null) {
      return;
    }

    this.submittingPostId.set(
      post.id,
    );

    this.api
      .submitPost(post.id)
      .subscribe({
        next: () => {
          this.submittingPostId.set(
            null,
          );
          this.pendingSubmitPost.set(null);

          /**
           * Reload để giữ đúng totals của group và status filter.
           */
          this.loadPosts();

          this.toast.success(
            this.ts.translate(
              'posts.submit_success',
            ),
            this.ts.translate(
              'common.success',
            ),
          );
        },

        error: (error: unknown) => {
          this.submittingPostId.set(
            null,
          );

          this.toast.error(
            getApiErrorMessage(
              error,
              this.ts.translate(
                'posts.submit_error',
              ),
            ),
            this.ts.translate(
              'common.error',
            ),
          );
        },
      });
  }

  deletePost(
    post: BlogOwnerPost,
  ): void {
    if (
      this.deletingPostId() !== null
    ) {
      return;
    }

    this.pendingDeletePost.set(post);
  }

  closeDeleteConfirmation(): void {
    if (this.deletingPostId() === null) {
      this.pendingDeletePost.set(null);
    }
  }

  confirmDeletePost(): void {
    const post = this.pendingDeletePost();

    if (!post || this.deletingPostId() !== null) {
      return;
    }

    this.deletingPostId.set(
      post.id,
    );

    this.api
      .deletePost(post.id)
      .subscribe({
        next: (response) => {
          this.toast.success(
            response.data.message,
            this.ts.translate(
              'common.success',
            ),
          );

          this.deletingPostId.set(
            null,
          );
          this.pendingDeletePost.set(null);

          this.loadPosts();
        },

        error: (error: unknown) => {
          this.deletingPostId.set(
            null,
          );

          this.toast.error(
            getApiErrorMessage(
              error,
              this.ts.translate(
                'posts.delete_error',
              ),
            ),
            this.ts.translate(
              'common.error',
            ),
          );
        },
      });
  }

  canEdit(
    post: BlogOwnerPost,
  ): boolean {
    return (
      post.status !==
      'PENDING_REVIEW'
    );
  }

  canSubmit(
    post: BlogOwnerPost,
  ): boolean {
    return post.status === 'DRAFT';
  }

  categoryNames(
    post: BlogOwnerPost,
  ): string {
    const payload =
      post as unknown as {
        categories?: Array<{
          name?: string | null;

          category?: {
            name?: string | null;
          } | null;
        }>;

        postCategories?: Array<{
          name?: string | null;

          category?: {
            name?: string | null;
          } | null;
        }>;

        category?: {
          name?: string | null;
        } | null;
      };

    let categoryItems =
      payload.categories ?? [];

    if (
      categoryItems.length === 0 &&
      payload.postCategories
    ) {
      categoryItems = payload.postCategories;
    }

    if (
      categoryItems.length === 0 &&
      payload.category
    ) {
      categoryItems = [payload.category];
    }

    const names =
      categoryItems
        .map((item) => {
          return (
            item.name ??
            item.category?.name ??
            ''
          ).trim();
        })
        .filter(
          (
            name,
          ): name is string =>
            name.length > 0,
        );

    return (
      [...new Set(names)].join(', ') ||
      '—'
    );
  }

  getPostLanguages(post: BlogOwnerPost): PostLanguageItem[] {
    const list: PostLanguageItem[] = [];

    if (post.language) {
      list.push({
        id: post.language.id,
        code: post.language.code,
        name: post.language.name,
        flag: post.language.flag,
        isOriginal: post.parentPostId === null,
        status: post.status,
      });
    }

    if (post.translations && post.translations.length > 0) {
      for (const t of post.translations) {
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

  languageLabel(
    post: BlogOwnerPost,
  ): string {
    const language =
      post.language;

    if (!language) {
      return String(
        post.languageId,
      );
    }

    return `
      ${language.flag ?? ''}
      ${language.code.toUpperCase()}
    `.trim();
  }

  statusLabel(
    status: PostStatus,
  ): string {
    return this.ts.translate(
      `post_status.${status.toLowerCase()}`,
    );
  }

  statusClass(
    status: PostStatus,
  ): string {
    switch (status) {
      case 'PUBLISH':
        return (
          'bg-emerald-100 ' +
          'text-emerald-800 ' +
          'dark:bg-emerald-950 ' +
          'dark:text-emerald-300'
        );

      case 'PENDING_REVIEW':
        return (
          'bg-amber-100 ' +
          'text-amber-800 ' +
          'dark:bg-amber-950 ' +
          'dark:text-amber-300'
        );

      case 'REJECT':
        return (
          'bg-red-100 ' +
          'text-red-800 ' +
          'dark:bg-red-950 ' +
          'dark:text-red-300'
        );

      default:
        return (
          'bg-gray-100 ' +
          'text-gray-800 ' +
          'dark:bg-gray-800 ' +
          'dark:text-gray-300'
        );
    }
  }


  statusBadgeColor(status: PostStatus): 'green' | 'yellow' | 'red' | 'blue' {
    switch (status) {
      case 'PUBLISH':
        return 'green';
      case 'PENDING_REVIEW':
        return 'yellow';
      case 'REJECT':
        return 'red';
      default:
        return 'blue';
    }
  }

  navigateToCreatePost(): void {
    this.router.navigate(['/dashboard/owner/create-post']);
  }

  navigateToEdit(postId: number): void {
    this.router.navigate(['/dashboard/owner/edit-post', postId]);
  }

  private toListPost(
    group: BlogOwnerPostGroup,
  ): BlogOwnerPost {
    return {
      ...group.root,
      viewCount: group.totals.views,
      likeCount: group.totals.likes,
      updatedAt: group.latestUpdatedAt,
    };
  }
}
