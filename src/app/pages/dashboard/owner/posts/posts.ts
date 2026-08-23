import { DecimalPipe } from '@angular/common';
import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

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

@Component({
  selector: 'app-posts',
  imports: [
    RouterLink,
    DecimalPipe,
    TranslatePipe,
    OwnerPostPreviewComponent,
    ConfirmDialog,
    BadgeComponent,
    IconButtonComponent,
    TextButtonComponent,
  ],
  templateUrl: './posts.html',
  styleUrl: './posts.css',
})
export class Posts implements OnInit {
  private readonly api = inject(BlogOwnerApiService);
  private readonly toast = inject(ToastService);
  protected readonly ts = inject(TranslationService);
  private readonly router = inject(Router);

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

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();

    if (total <= 7) {
      return Array.from(
        { length: total },
        (_, index) => index + 1,
      );
    }

    const start = Math.max(
      1,
      Math.min(
        current - 2,
        total - 4,
      ),
    );

    return Array.from(
      { length: 5 },
      (_, index) => start + index,
    );
  });

  ngOnInit(): void {
    this.loadPosts();
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
    this.currentPage.set(1);
    this.loadPosts();
  }

  onSearchKeydown(
    event: KeyboardEvent,
  ): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.applySearch();
    }
  }

  onStatusChange(event: Event): void {
    const value = (
      event.target as
      HTMLSelectElement
    ).value;

    this.statusFilter.set(
      value as PostStatus | '',
    );

    this.currentPage.set(1);
    this.loadPosts();
  }

  clearFilters(): void {
    this.search.set('');
    this.statusFilter.set('');
    this.currentPage.set(1);
    this.loadPosts();
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

    this.currentPage.set(page);
    this.loadPosts();
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
