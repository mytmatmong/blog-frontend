import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  HttpErrorResponse,
} from '@angular/common/http';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  takeUntilDestroyed,
  toObservable,
} from '@angular/core/rxjs-interop';

import {
  debounceTime,
  distinctUntilChanged,
  skip,
  Subject,
} from 'rxjs';

import {
  FilterSortOption,
  getPostSortQuery,
  isFilterSortOption,
  PublicSidebarLeft,
} from '../../../shared/components/public-sidebar-left/public-sidebar-left';

import { PublicSidebarRight } from '../../../shared/components/public-sidebar-right/public-sidebar-right';

import {
  PostCard,
  PostItem,
} from '../../../shared/components/post-card/post-card';

import { Pagination } from '../../../shared/components/pagination/pagination';

import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

import { PublicApiService } from '../../../core/services/public-api.service';

import { TranslationService } from '../../../core/services/translation.service';

import {
  PublicPost,
  TagItem,
} from '../../../core/models/post.model';

@Component({
  selector: 'app-hashtag',

  imports: [
    PublicSidebarLeft,
    PublicSidebarRight,
    PostCard,
    Pagination,
    TranslatePipe,
  ],

  templateUrl: './hashtag.html',
  styleUrl: './hashtag.css',
})
export class Hashtag {
  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly publicApiService =
    inject(PublicApiService);

  private readonly translationService =
    inject(TranslationService);

  private readonly searchChanges =
    new Subject<string>();

  private initialized = false;
  private requestVersion = 0;

  readonly tags =
    signal<TagItem[]>([]);

  readonly posts =
    signal<PostItem[]>([]);

  readonly selectedTagId =
    signal<number | null>(null);

  readonly selectedTagName =
    signal<string | null>(null);

  readonly currentPage =
    signal(1);

  readonly totalItems =
    signal(0);

  readonly totalPages =
    signal(1);

  readonly searchTerm =
    signal('');

  readonly activeFilter =
    signal<FilterSortOption>('latest');

  readonly isLoading =
    signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  readonly itemsPerPage = 10;

  readonly isTagSelected =
    computed(
      () =>
        this.selectedTagId() !==
        null ||
        Boolean(
          this.selectedTagName(),
        ),
    );

  readonly searchPlaceholder =
    computed(() => {
      const key =
        this.isTagSelected()
          ? 'hashtag.search_posts_placeholder'
          : 'hashtag.search_tags_placeholder';

      return this.translationService
        .translate(key);
    });

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const tagId =
          this.parsePositiveInteger(
            params.get('tagId'),
          );

        const tagName =
          params
            .get('tagName')
            ?.trim() || null;

        const page =
          this.parsePositiveInteger(
            params.get('page'),
          ) ?? 1;

        const search =
          params.get('search')?.trim() ??
          '';

        const sortParam =
          params.get('sort');

        const sort =
          isFilterSortOption(sortParam)
            ? sortParam
            : 'latest';

        const stateChanged =
          tagId !==
          this.selectedTagId() ||
          tagName !==
          this.selectedTagName() ||
          page !==
          this.currentPage() ||
          search !==
          this.searchTerm() ||
          sort !==
          this.activeFilter();

        this.selectedTagId.set(tagId);
        this.selectedTagName.set(
          tagName,
        );

        this.currentPage.set(page);
        this.searchTerm.set(search);
        this.activeFilter.set(sort);

        if (
          this.initialized &&
          stateChanged
        ) {
          this.loadCurrentMode();
        }
      });

    this.searchChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((value) => {
        const normalized =
          value.trim();

        this.updateQueryParams({
          search:
            normalized || null,
          page: 1,
        });
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
        if (
          this.currentPage() !== 1
        ) {
          this.updateQueryParams({
            page: 1,
          });
        } else {
          this.loadCurrentMode();
        }
      });

    queueMicrotask(() => {
      this.initialized = true;
      this.loadCurrentMode();
    });
  }

  loadCurrentMode(): void {
    if (this.isTagSelected()) {
      this.loadPosts();
    } else {
      this.loadTags();
    }
  }

  loadTags(): void {
    const requestVersion =
      ++this.requestVersion;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.posts.set([]);

    this.publicApiService
      .getTags({
        search:
          this.searchTerm().trim() ||
          undefined,

        page:
          this.currentPage(),

        limit:
          this.itemsPerPage,

        sortBy: 'name',
        sortOrder: 'asc',
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

          this.tags.set(data.items);

          this.totalItems.set(
            data.meta.totalItems,
          );

          this.totalPages.set(
            Math.max(
              1,
              data.meta.totalPages,
            ),
          );

          this.currentPage.set(
            data.meta.currentPage,
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

          this.tags.set([]);
          this.totalItems.set(0);
          this.totalPages.set(1);
          this.isLoading.set(false);

          this.errorMessage.set(
            this.getErrorMessage(
              error,
              this.translationService
                .translate(
                  'hashtag.load_error',
                ),
            ),
          );
        },
      });
  }

  loadPosts(): void {
    const requestVersion =
      ++this.requestVersion;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.tags.set([]);

    const tagId =
      this.selectedTagId();

    const tagName =
      this.selectedTagName();

    const sort =
      getPostSortQuery(
        this.activeFilter(),
      );

    this.publicApiService
      .getPosts({
        search:
          this.searchTerm().trim() ||
          undefined,

        tagId:
          tagId ?? undefined,

        tagName:
          tagId === null
            ? tagName ?? undefined
            : undefined,

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

          this.posts.set(
            data.items.map((post) =>
              this.mapToPostItem(post),
            ),
          );

          this.totalItems.set(
            data.meta.totalItems,
          );

          this.totalPages.set(
            Math.max(
              1,
              data.meta.totalPages,
            ),
          );

          this.currentPage.set(
            data.meta.currentPage,
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

          this.posts.set([]);
          this.totalItems.set(0);
          this.totalPages.set(1);
          this.isLoading.set(false);

          this.errorMessage.set(
            this.getErrorMessage(
              error,
              this.translationService
                .translate(
                  'posts.load_error',
                ),
            ),
          );
        },
      });
  }

  selectTag(tag: TagItem): void {
    this.updateQueryParams({
      tagId: tag.id,
      tagName: tag.name,
      search: null,
      page: 1,
      sort: 'latest',
    });
  }

  showAllTags(): void {
    this.updateQueryParams({
      tagId: null,
      tagName: null,
      search: null,
      page: 1,
      sort: 'latest',
    });
  }

  onSearchChange(value: string): void {
    this.searchChanges.next(value);
  }

  clearSearch(): void {
    this.searchChanges.next('');
  }

  onFilterChange(
    filter: FilterSortOption,
  ): void {
    if (
      !this.isTagSelected() ||
      filter === this.activeFilter()
    ) {
      return;
    }

    this.updateQueryParams({
      sort: filter,
      page: 1,
    });
  }

  onPageChange(page: number): void {
    if (
      page < 1 ||
      page > this.totalPages() ||
      page === this.currentPage()
    ) {
      return;
    }

    this.updateQueryParams({
      page,
    });

    if (
      typeof window !== 'undefined'
    ) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  private updateQueryParams(
    queryParams: {
      tagId?: number | null;
      tagName?: string | null;
      search?: string | null;
      page?: number;
      sort?: FilterSortOption;
    },
  ): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
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
        post.author.username,

      authorAvatar:
        this.getAvatarInitial(
          post.author.username,
        ),

      authorAvatarUrl:
        post.author.avatarUrl,

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

  private getAvatarInitial(
    name?: string | null,
  ): string {
    return (
      name
        ?.trim()
        .charAt(0)
        .toUpperCase() || 'A'
    );
  }

  private currentLanguageCode(): string {
    return this.translationService
      .currentLang()
      .toLowerCase();
  }

  private parsePositiveInteger(
    value: string | null,
  ): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number(value);

    return (
      Number.isInteger(parsed) &&
      parsed > 0
    )
      ? parsed
      : null;
  }

  private getErrorMessage(
    error: unknown,
    fallback: string,
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

      return `${fallback} HTTP ${error.status}.`;
    }

    return fallback;
  }
}