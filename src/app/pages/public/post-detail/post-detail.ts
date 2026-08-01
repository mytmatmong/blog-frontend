import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';

import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';

import {
  takeUntilDestroyed,
  toObservable,
} from '@angular/core/rxjs-interop';

import {
  distinctUntilChanged,
  skip,
} from 'rxjs';

import { PublicSidebarRight } from '../../../shared/components/public-sidebar-right/public-sidebar-right';

import { CommentItem } from '../../../shared/components/comment-item/comment-item';

import { Pagination } from '../../../shared/components/pagination/pagination';

import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

import { PublicApiService } from '../../../core/services/public-api.service';

import { TranslationService } from '../../../core/services/translation.service';

import {
  PublicComment,
  PublicPost,
  SortOrder,
} from '../../../core/models/post.model';

type PostErrorKey =
  | 'post.invalid_id'
  | 'post.not_found'
  | 'post.load_error'
  | 'common.backend_unreachable';

type CommentsErrorKey =
  | 'comments.load_error'
  | 'common.backend_unreachable';

interface LoadPostOptions {
  /**
   * Khi đổi ngôn ngữ, giữ bài cũ trên màn hình
   * cho đến khi bản dịch mới tải xong.
   */
  preserveContent?: boolean;
}

@Component({
  selector: 'app-post-detail',

  imports: [
    RouterLink,
    PublicSidebarRight,
    CommentItem,
    Pagination,
    TranslatePipe,
  ],

  templateUrl: './post-detail.html',
  styleUrl: './post-detail.css',
})
export class PostDetail {
  private readonly route =
    inject(ActivatedRoute);

  private readonly publicApiService =
    inject(PublicApiService);

  private readonly translationService =
    inject(TranslationService);

  /**
   * ID bài viết đang có trên URL.
   */
  private routePostId: number | null = null;

  /**
   * ID bài thực tế backend trả về.
   *
   * Ví dụ:
   * URL đang là /post/10
   * nhưng lang=en có thể trả bản dịch ID 20.
   * Khi đó comment phải gọi theo ID 20.
   */
  private commentsPostId: number | null = null;

  /**
   * Dùng để vô hiệu hóa response cũ nếu người dùng
   * đổi bài hoặc đổi ngôn ngữ quá nhanh.
   */
  private postRequestVersion = 0;

  private commentsRequestVersion = 0;

  readonly post =
    signal<PublicPost | null>(null);

  readonly comments =
    signal<PublicComment[]>([]);

  readonly isLoading =
    signal(false);

  readonly commentsSortOrder =
    signal<SortOrder>('desc');
  readonly isRefreshingLanguage =
    signal(false);

  readonly isLoadingComments =
    signal(false);

  readonly commentsTotalItems =
    signal(0);

  readonly commentsTotalPages =
    signal(1);

  readonly commentsCurrentPage =
    signal(1);

  readonly commentsPerPage = 10;

  /**
   * Lưu translation key thay vì lưu trực tiếp
   * chuỗi tiếng Việt hoặc tiếng Anh.
   */
  private readonly postErrorKey =
    signal<PostErrorKey | null>(null);

  private readonly commentsErrorKey =
    signal<CommentsErrorKey | null>(null);

  /**
   * Khi currentLang thay đổi, nội dung lỗi cũng
   * tự đổi ngôn ngữ ngay.
   */
  readonly errorMessage = computed(() => {
    const key = this.postErrorKey();

    return key
      ? this.translationService.translate(key)
      : null;
  });

  readonly commentsErrorMessage =
    computed(() => {
      const key =
        this.commentsErrorKey();

      return key
        ? this.translationService.translate(key)
        : null;
    });

  constructor() {
    /**
     * Theo dõi ID bài viết trên URL.
     */
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const id = Number(
          params.get('id'),
        );

        if (
          !Number.isInteger(id) ||
          id <= 0
        ) {
          this.postRequestVersion++;
          this.commentsRequestVersion++;

          this.routePostId = null;
          this.commentsPostId = null;

          this.post.set(null);
          this.clearComments();

          this.isLoading.set(false);
          this.isRefreshingLanguage.set(
            false,
          );

          this.postErrorKey.set(
            'post.invalid_id',
          );

          return;
        }

        this.routePostId = id;

        this.commentsCurrentPage.set(1);

        this.loadPost();
      });

    /**
     * Khi đổi VI/EN:
     *
     * - Gọi lại GET /posts/:id?lang=...
     * - Giữ bài hiện tại để giao diện không nháy.
     * - Sau khi nhận bài mới, tải comment theo ID
     *   thực tế backend trả về.
     */
    toObservable(
      this.translationService.currentLang,
    )
      .pipe(
        skip(1),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (this.routePostId === null) {
          return;
        }

        this.commentsCurrentPage.set(1);

        this.loadPost({
          preserveContent: true,
        });
      });
  }

  loadPost(
    options: LoadPostOptions = {},
  ): void {
    const routePostId =
      this.routePostId;

    if (routePostId === null) {
      return;
    }

    const preserveContent =
      options.preserveContent === true &&
      this.post() !== null;

    const requestVersion =
      ++this.postRequestVersion;

    /**
     * Vô hiệu hóa request comment đang chạy
     * của bài hoặc ngôn ngữ trước đó.
     */
    this.commentsRequestVersion++;

    const previousCommentsPostId =
      this.commentsPostId;

    this.postErrorKey.set(null);
    this.commentsErrorKey.set(null);

    if (preserveContent) {
      this.isRefreshingLanguage.set(
        true,
      );
    } else {
      this.isLoading.set(true);

      this.isRefreshingLanguage.set(
        false,
      );

      this.post.set(null);
      this.commentsPostId = null;

      this.clearComments();
    }

    this.publicApiService
      .getPostById(
        routePostId,
        this.currentLanguageCode(),
      )
      .subscribe({
        next: (response) => {
          if (
            requestVersion !==
            this.postRequestVersion
          ) {
            return;
          }

          const actualPost =
            response.data;

          this.post.set(actualPost);

          /**
           * Bản dịch có thể có ID khác bài trên URL.
           */
          this.commentsPostId =
            actualPost.id;

          this.isLoading.set(false);

          this.isRefreshingLanguage.set(
            false,
          );

          /**
           * Nếu ID bài bản dịch khác bài cũ,
           * không được giữ comment của bài cũ.
           */
          if (
            previousCommentsPostId !==
            actualPost.id
          ) {
            this.clearComments();
          }

          this.loadComments();
        },

        error: (error: unknown) => {
          if (
            requestVersion !==
            this.postRequestVersion
          ) {
            return;
          }

          this.isLoading.set(false);

          this.isRefreshingLanguage.set(
            false,
          );

          /**
           * Nếu đổi ngôn ngữ thất bại thì giữ bài cũ.
           * Nếu tải bài lần đầu thất bại thì xóa bài.
           */
          if (!preserveContent) {
            this.post.set(null);
            this.commentsPostId = null;

            this.clearComments();
          }

          this.postErrorKey.set(
            this.resolvePostErrorKey(
              error,
            ),
          );
        },
      });
  }

  loadComments(): void {
    const postId =
      this.commentsPostId;

    if (postId === null) {
      return;
    }

    const requestVersion =
      ++this.commentsRequestVersion;

    this.isLoadingComments.set(true);

    this.commentsErrorKey.set(null);

    this.publicApiService
      .getPostComments(postId, {
        page:
          this.commentsCurrentPage(),

        limit:
          this.commentsPerPage,

        sortBy:
          'createdAt',

        sortOrder:
          this.commentsSortOrder(),
      })
      .subscribe({
        next: (response) => {
          if (
            requestVersion !==
            this.commentsRequestVersion
          ) {
            return;
          }

          const data = response.data;

          this.comments.set(
            data.items,
          );

          this.commentsTotalItems.set(
            data.meta.totalItems,
          );

          this.commentsTotalPages.set(
            Math.max(
              1,
              data.meta.totalPages,
            ),
          );

          this.commentsCurrentPage.set(
            data.meta.currentPage,
          );

          this.isLoadingComments.set(
            false,
          );
        },

        error: (error: unknown) => {
          if (
            requestVersion !==
            this.commentsRequestVersion
          ) {
            return;
          }

          this.clearComments();

          this.isLoadingComments.set(
            false,
          );

          this.commentsErrorKey.set(
            this.resolveCommentsErrorKey(
              error,
            ),
          );
        },
      });
  }

  retryPost(): void {
    this.loadPost({
      /**
       * Nếu vẫn còn bài cũ thì giữ lại trong lúc retry.
       */
      preserveContent:
        this.post() !== null,
    });
  }

  onCommentsPageChange(
    page: number,
  ): void {
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page >
      this.commentsTotalPages() ||
      page ===
      this.commentsCurrentPage()
    ) {
      return;
    }

    this.commentsCurrentPage.set(page);

    this.loadComments();

    if (
      typeof window !== 'undefined'
    ) {
      const commentsSection =
        document.getElementById(
          'post-comments',
        );

      commentsSection?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  getAvatarInitial(
    name?: string | null,
  ): string {
    return (
      name
        ?.trim()
        .charAt(0)
        .toUpperCase() || 'A'
    );
  }
  onCommentsSortChange(
    value: string,
  ): void {
    if (
      value !== 'asc' &&
      value !== 'desc'
    ) {
      return;
    }

    if (
      value ===
      this.commentsSortOrder()
    ) {
      return;
    }

    this.commentsSortOrder.set(value);
    this.commentsCurrentPage.set(1);

    this.loadComments();
  }

  formatDate(
    value?: string | null,
  ): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString(
      this.currentLanguageCode() ===
        'en'
        ? 'en-US'
        : 'vi-VN',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    );
  }

  private clearComments(): void {
    this.comments.set([]);

    this.commentsTotalItems.set(0);

    this.commentsTotalPages.set(1);
  }

  private currentLanguageCode(): string {
    return this.translationService
      .currentLang()
      .toLowerCase();
  }

  private resolvePostErrorKey(
    error: unknown,
  ): PostErrorKey {
    if (
      error instanceof HttpErrorResponse
    ) {
      if (error.status === 0) {
        return 'common.backend_unreachable';
      }

      if (error.status === 404) {
        return 'post.not_found';
      }
    }

    return 'post.load_error';
  }

  private resolveCommentsErrorKey(
    error: unknown,
  ): CommentsErrorKey {
    if (
      error instanceof
      HttpErrorResponse &&
      error.status === 0
    ) {
      return 'common.backend_unreachable';
    }

    return 'comments.load_error';
  }
}