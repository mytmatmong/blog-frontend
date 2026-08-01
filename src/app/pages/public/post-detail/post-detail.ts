import {
  Component,
  inject,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PublicSidebarRight } from '../../../shared/components/public-sidebar-right/public-sidebar-right';
import { CommentItem } from '../../../shared/components/comment-item/comment-item';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

import { PublicApiService } from '../../../core/services/public-api.service';
import { TranslationService } from '../../../core/services/translation.service';

import {
  PublicComment,
  PublicPost,
} from '../../../core/models/post.model';

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

  readonly post =
    signal<PublicPost | null>(null);

  readonly comments =
    signal<PublicComment[]>([]);

  readonly isLoading =
    signal(false);

  readonly isLoadingComments =
    signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  readonly commentsErrorMessage =
    signal<string | null>(null);

  readonly commentsTotalItems =
    signal(0);

  readonly commentsTotalPages =
    signal(1);

  readonly commentsCurrentPage =
    signal(1);

  readonly commentsPerPage = 10;

  private postId: number | null = null;

  constructor() {
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
          this.postId = null;
          this.post.set(null);

          this.errorMessage.set(
            'ID bài viết không hợp lệ.',
          );

          return;
        }

        this.postId = id;

        this.commentsCurrentPage.set(1);

        this.loadPost();
        this.loadComments();
      });
  }

  loadPost(): void {
    if (this.postId === null) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.publicApiService
      .getPostById(
        this.postId,
        this.currentLanguageCode(),
      )
      .subscribe({
        next: (response) => {
          this.post.set(response.data);
          this.isLoading.set(false);
        },

        error: (error: unknown) => {
          this.post.set(null);
          this.isLoading.set(false);

          this.errorMessage.set(
            this.getErrorMessage(
              error,
              'Không thể tải bài viết.',
            ),
          );
        },
      });
  }

  loadComments(): void {
    if (this.postId === null) {
      return;
    }

    this.isLoadingComments.set(true);
    this.commentsErrorMessage.set(null);

    this.publicApiService
      .getPostComments(
        this.postId,
        this.commentsCurrentPage(),
        this.commentsPerPage,
      )
      .subscribe({
        next: (response) => {
          const data = response.data;

          this.comments.set(data.items);

          this.commentsTotalItems.set(
            data.meta.totalItems,
          );

          this.commentsTotalPages.set(
            data.meta.totalPages,
          );

          this.commentsCurrentPage.set(
            data.meta.currentPage,
          );

          this.isLoadingComments.set(false);
        },

        error: (error: unknown) => {
          this.comments.set([]);
          this.commentsTotalItems.set(0);
          this.commentsTotalPages.set(1);
          this.isLoadingComments.set(false);

          this.commentsErrorMessage.set(
            this.getErrorMessage(
              error,
              'Không thể tải bình luận.',
            ),
          );
        },
      });
  }

  onCommentsPageChange(page: number): void {
    if (
      page < 1 ||
      page > this.commentsTotalPages() ||
      page === this.commentsCurrentPage()
    ) {
      return;
    }

    this.commentsCurrentPage.set(page);
    this.loadComments();
  }

  getAvatarInitial(
    name?: string | null,
  ): string {
    return (
      name
        ?.charAt(0)
        .toUpperCase() || 'A'
    );
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
      this.currentLanguageCode() === 'en'
        ? 'en-US'
        : 'vi-VN',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    );
  }

  private currentLanguageCode(): string {
    return this.translationService
      .currentLang()
      .toLowerCase();
  }

  private getErrorMessage(
    error: unknown,
    fallback: string,
  ): string {
    if (
      error instanceof HttpErrorResponse
    ) {
      const message: unknown =
        error.error?.message;

      if (Array.isArray(message)) {
        return message.join(', ');
      }

      if (typeof message === 'string') {
        return message;
      }

      if (error.status === 0) {
        return 'Không kết nối được tới backend.';
      }

      if (error.status === 404) {
        return 'Không tìm thấy dữ liệu yêu cầu.';
      }

      return `${fallback} HTTP ${error.status}.`;
    }

    return fallback;
  }
}