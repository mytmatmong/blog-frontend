import {
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  HttpErrorResponse,
} from '@angular/common/http';

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

import {
  PostCard,
  PostItem,
} from '../../../shared/components/post-card/post-card';

import { Pagination } from '../../../shared/components/pagination/pagination';

import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

import {
  FilterSortOption,
  getPostSortQuery,
} from '../../../shared/components/public-sidebar-left/public-sidebar-left';

import { PublicApiService } from '../../../core/services/public-api.service';

import { TranslationService } from '../../../core/services/translation.service';

import {
  AuthorDetail as AuthorDetailModel,
  PublicPost,
} from '../../../core/models/post.model';

@Component({
  selector: 'app-author-detail',

  imports: [
    RouterLink,
    PublicSidebarRight,
    PostCard,
    Pagination,
    TranslatePipe,
  ],

  templateUrl: './author-detail.html',
  styleUrl: './author-detail.css',
})
export class AuthorDetailComponent {
  private readonly route =
    inject(ActivatedRoute);

  private readonly publicApiService =
    inject(PublicApiService);

  private readonly translationService =
    inject(TranslationService);

  private authorId: number | null =
    null;

  private requestVersion = 0;

  readonly author =
    signal<AuthorDetailModel | null>(
      null,
    );

  readonly posts =
    signal<PostItem[]>([]);

  readonly totalItems =
    signal(0);

  readonly totalPages =
    signal(1);

  readonly currentPage =
    signal(1);

  readonly activeFilter =
    signal<FilterSortOption>('latest');

  readonly isLoading =
    signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  readonly itemsPerPage = 10;

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
          this.authorId = null;
          this.author.set(null);
          this.posts.set([]);

          this.errorMessage.set(
            this.translationService
              .translate(
                'author.not_found',
              ),
          );

          return;
        }

        this.authorId = id;
        this.currentPage.set(1);

        this.loadAuthorInfo();
      });

    toObservable(
      this.translationService.currentLang,
    )
      .pipe(
        skip(1),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (this.authorId === null) {
          return;
        }

        this.currentPage.set(1);
        this.loadAuthorInfo();
      });
  }

  loadAuthorInfo(): void {
    const authorId = this.authorId;

    if (authorId === null) {
      return;
    }

    const requestVersion =
      ++this.requestVersion;

    const sort =
      getPostSortQuery(
        this.activeFilter(),
      );

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.publicApiService
      .getAuthorById(authorId, {
        page:
          this.currentPage(),

        limit:
          this.itemsPerPage,

        sortBy:
          sort.sortBy,

        sortOrder:
          sort.sortOrder,
      })
      .subscribe({
        next: (response) => {
          if (
            requestVersion !==
            this.requestVersion
          ) {
            return;
          }

          const data = response.data;

          this.author.set(
            data.author,
          );

          this.posts.set(
            data.posts.items.map(
              (post) =>
                this.mapToPostItem(
                  post,
                ),
            ),
          );

          this.totalItems.set(
            data.posts.meta.totalItems,
          );

          this.totalPages.set(
            Math.max(
              1,
              data.posts.meta.totalPages,
            ),
          );

          this.currentPage.set(
            data.posts.meta.currentPage,
          );

          this.isLoading.set(false);
        },

        error: (error: unknown) => {
          if (
            requestVersion !==
            this.requestVersion
          ) {
            return;
          }

          this.author.set(null);
          this.posts.set([]);
          this.totalItems.set(0);
          this.totalPages.set(1);
          this.isLoading.set(false);

          this.errorMessage.set(
            this.getErrorMessage(error),
          );
        },
      });
  }

  onFilterChange(
    filter: FilterSortOption,
  ): void {
    if (
      filter === this.activeFilter()
    ) {
      return;
    }

    this.activeFilter.set(filter);
    this.currentPage.set(1);

    this.loadAuthorInfo();
  }

  onPageChange(page: number): void {
    if (
      page < 1 ||
      page > this.totalPages() ||
      page === this.currentPage()
    ) {
      return;
    }

    this.currentPage.set(page);
    this.loadAuthorInfo();

    if (
      typeof window !== 'undefined'
    ) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
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

  formatMonthYear(
    value?: string | null,
  ): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return '';
    }

    return date.toLocaleDateString(
      this.currentLanguageCode() ===
        'en'
        ? 'en-US'
        : 'vi-VN',
      {
        month: '2-digit',
        year: 'numeric',
      },
    );
  }

  private mapToPostItem(
    post: PublicPost,
  ): PostItem {
    return {
      id: post.id,
      authorId: post.authorId,
      title: post.title,

      excerpt:
        this.buildExcerpt(post),

      authorName:
        post.author?.username ??
        this.author()?.username ??
        '',

      authorAvatar:
        this.getAvatarInitial(
          post.author?.username ??
          this.author()?.username,
        ),

      authorAvatarUrl:
        post.author?.avatarUrl ??
        this.author()?.avatarUrl ??
        null,

      timeAgo:
        this.formatDate(
          post.publishedAt ??
          post.createdAt,
        ),

      readTime:
        this.calculateReadTime(
          post.content,
        ),

      categories:
        post.categories.map(
          (category) => ({
            id: category.id,
            name: category.name,
          }),
        ),

      tags:
        post.tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
        })),

      likes: post.likeCount,
      views: post.viewCount,

      comments: 0,
      showCommentCount: false,

      thumbnailUrl:
        post.thumbnailUrl,
    };
  }

  private buildExcerpt(
    post: PublicPost,
    maxLength = 150,
  ): string {
    const title =
      post.title
        .replace(/\s+/g, ' ')
        .trim();

    let content =
      this.extractPlainText(
        post.content,
      );

    if (
      content
        .toLocaleLowerCase()
        .startsWith(
          title.toLocaleLowerCase(),
        )
    ) {
      content = content
        .slice(title.length)
        .replace(
          /^[\s:;,.|–—-]+/,
          '',
        )
        .trim();
    }

    if (
      content.length <= maxLength
    ) {
      return content;
    }

    return `${content
      .slice(0, maxLength)
      .trimEnd()}…`;
  }

  private calculateReadTime(
    htmlContent: string,
  ): string {
    const plainText =
      this.extractPlainText(
        htmlContent,
      );

    const wordCount =
      plainText
        .split(/\s+/)
        .filter(Boolean)
        .length;

    const wordsPerMinute =
      this.currentLanguageCode() ===
        'en'
        ? 200
        : 180;

    const minutes = Math.max(
      1,
      Math.ceil(
        wordCount /
        wordsPerMinute,
      ),
    );

    const label =
      this.translationService
        .translate(
          'post.read_time',
        )
        .trim();

    if (
      label.includes('{count}')
    ) {
      return label.replace(
        '{count}',
        String(minutes),
      );
    }

    return `${minutes} ${label}`;
  }

  private extractPlainText(
    htmlContent: string,
  ): string {
    if (!htmlContent) {
      return '';
    }

    if (
      typeof DOMParser !==
      'undefined'
    ) {
      const document =
        new DOMParser()
          .parseFromString(
            htmlContent,
            'text/html',
          );

      document
        .querySelectorAll(
          'script, style, noscript',
        )
        .forEach((element) =>
          element.remove(),
        );

      return (
        document.body.textContent ??
        ''
      )
        .replace(/\s+/g, ' ')
        .trim();
    }

    return htmlContent
      .replace(
        /<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi,
        ' ',
      )
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private formatDate(
    value: string,
  ): string {
    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
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

  private currentLanguageCode(): string {
    return this.translationService
      .currentLang()
      .toLowerCase();
  }

  private getErrorMessage(
    error: unknown,
  ): string {
    if (
      error instanceof
      HttpErrorResponse
    ) {
      const message: unknown =
        error.error?.message;

      if (Array.isArray(message)) {
        return message.join(', ');
      }

      if (
        typeof message ===
        'string'
      ) {
        return message;
      }

      if (error.status === 0) {
        return this.translationService
          .translate(
            'common.backend_unreachable',
          );
      }

      if (error.status === 404) {
        return this.translationService
          .translate(
            'author.not_found',
          );
      }
    }

    return this.translationService
      .translate(
        'author.load_error',
      );
  }
}