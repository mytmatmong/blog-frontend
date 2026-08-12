import {
  Component,
  inject,
  OnInit,
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
  sortPublicPosts,
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
  CategoryItem,
  PublicPost,
} from '../../../core/models/post.model';

@Component({
  selector: 'app-category',

  imports: [
    PublicSidebarLeft,
    PublicSidebarRight,
    PostCard,
    Pagination,
    TranslatePipe,
  ],

  templateUrl: './category.html',
  styleUrl: './category.css',
})
export class Category implements OnInit {
  private readonly publicApiService =
    inject(PublicApiService);

  private readonly translationService =
    inject(TranslationService);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly searchChanges =
    new Subject<string>();

  private initialized = false;

  private postsRequestVersion = 0;
  private categoriesRequestVersion = 0;

  readonly categories =
    signal<CategoryItem[]>([]);

  readonly selectedCategoryId =
    signal<number | null>(null);

  readonly posts =
    signal<PostItem[]>([]);

  readonly totalItems =
    signal(0);

  readonly totalPages =
    signal(1);

  readonly currentPage =
    signal(1);

  readonly searchTerm =
    signal('');

  readonly activeFilter =
    signal<FilterSortOption>('latest');

  readonly isLoading =
    signal(false);

  readonly isLoadingCategories =
    signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  readonly categoriesErrorMessage =
    signal<string | null>(null);

  readonly itemsPerPage = 10;

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const categoryId =
          this.parsePositiveInteger(
            params.get('categoryId'),
          );

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
          categoryId !==
          this.selectedCategoryId() ||
          page !== this.currentPage() ||
          search !== this.searchTerm() ||
          sort !== this.activeFilter();

        this.selectedCategoryId.set(
          categoryId,
        );

        this.currentPage.set(page);
        this.searchTerm.set(search);
        this.activeFilter.set(sort);

        if (
          this.initialized &&
          stateChanged
        ) {
          this.loadPosts();
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
        const selectedCategory =
          this.categories().find(
            (category) =>
              category.id ===
              this.selectedCategoryId(),
          );

        const categoryGroupId =
          selectedCategory
            ?.categoryGroupId ??
          null;

        this.loadCategories(
          categoryGroupId,
          true,
        );
      });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadPosts();

    this.initialized = true;
  }

  loadCategories(
    categoryGroupIdToPreserve:
      number | null = null,
    reloadPostsAfter = false,
  ): void {
    const requestVersion =
      ++this.categoriesRequestVersion;

    this.isLoadingCategories.set(true);
    this.categoriesErrorMessage.set(null);

    this.publicApiService
      .getCategories({
        page: 1,
        limit: 50,
        sortBy: 'name',
        sortOrder: 'asc',
      })
      .subscribe({
        next: (response) => {
          if (
            requestVersion !==
            this.categoriesRequestVersion
          ) {
            return;
          }

          const categories =
            response.data.items;

          this.categories.set(categories);

          this.isLoadingCategories.set(
            false,
          );

          if (!reloadPostsAfter) {
            return;
          }

          const mappedCategoryId =
            categoryGroupIdToPreserve
              ? categories.find(
                (category) =>
                  category
                    .categoryGroupId ===
                  categoryGroupIdToPreserve,
              )?.id ?? null
              : null;

          const stateChanged =
            mappedCategoryId !==
            this.selectedCategoryId() ||
            this.currentPage() !== 1;

          if (stateChanged) {
            void this.router.navigate(
              [],
              {
                relativeTo: this.route,

                queryParams: {
                  categoryId:
                    mappedCategoryId,
                  page: 1,
                },

                queryParamsHandling:
                  'merge',

                replaceUrl: true,
              },
            );
          } else {
            this.loadPosts();
          }
        },

        error: (error: unknown) => {
          if (
            requestVersion !==
            this.categoriesRequestVersion
          ) {
            return;
          }

          this.categories.set([]);

          this.isLoadingCategories.set(
            false,
          );

          this.categoriesErrorMessage.set(
            this.getErrorMessage(
              error,
              this.translationService
                .translate(
                  'categories.load_error',
                ),
            ),
          );

          if (reloadPostsAfter) {
            this.loadPosts();
          }
        },
      });
  }

  loadPosts(): void {
    const requestVersion =
      ++this.postsRequestVersion;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const search =
      this.searchTerm().trim();

    const sort =
      getPostSortQuery(
        this.activeFilter(),
      );

    this.publicApiService
      .getPosts({
        search:
          search || undefined,

        categoryId:
          this.selectedCategoryId() ??
          undefined,

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
            this.postsRequestVersion
          ) {
            return;
          }

          const data = response.data;

          this.posts.set(
            sortPublicPosts(
              data.items,
              this.activeFilter(),
            ).map((post) =>
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
            this.postsRequestVersion
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

  selectCategory(
    categoryId: number | null,
  ): void {
    this.updateQueryParams({
      categoryId,
      page: 1,
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

    this.updateQueryParams({
      sort: filter,
      page: 1,
    });
  }

  onSidebarSearchChange(
    value: string,
  ): void {
    this.searchChanges.next(value);
  }

  clearSearch(): void {
    this.searchChanges.next('');
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
      categoryId?:
      number | null;

      page?: number;

      search?: string | null;

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
