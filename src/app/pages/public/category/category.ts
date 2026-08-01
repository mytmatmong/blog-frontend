import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
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

  private viewInitialized = false;

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

  /**
   * Backend chưa có query sort cho GET /posts.
   *
   * Vì vậy mostViewed và mostLiked chỉ sắp xếp
   * các bài đang có trong trang hiện tại.
   */
  readonly visiblePosts = computed(() => {
    const posts = [...this.posts()];

    switch (this.activeFilter()) {
      case 'mostViewed':
        return posts.sort(
          (first, second) =>
            second.views - first.views,
        );

      case 'mostLiked':
        return posts.sort(
          (first, second) =>
            second.likes - first.likes,
        );

      case 'mostCommented':
        /**
         * PublicPost không có commentCount.
         * Không thể sắp xếp chính xác theo comment.
         */
        return posts;

      case 'latest':
      default:
        /**
         * Giữ nguyên thứ tự backend trả về.
         */
        return posts;
    }
  });

  constructor() {
    /**
     * Đọc categoryId từ URL:
     * /category?categoryId=5
     */
    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const rawCategoryId =
          params.get('categoryId');

        const parsedCategoryId =
          rawCategoryId
            ? Number(rawCategoryId)
            : null;

        const nextCategoryId =
          parsedCategoryId !== null &&
            Number.isInteger(parsedCategoryId) &&
            parsedCategoryId > 0
            ? parsedCategoryId
            : null;

        const categoryChanged =
          nextCategoryId !==
          this.selectedCategoryId();

        this.selectedCategoryId.set(
          nextCategoryId,
        );

        if (
          categoryChanged &&
          this.viewInitialized
        ) {
          this.currentPage.set(1);
          this.loadPosts();
        }
      });

    /**
     * Search bên sidebar phát liên tục theo từng ký tự.
     * Chờ 350ms rồi mới gọi API.
     */
    this.searchChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((value) => {
        this.searchTerm.set(value);
        this.currentPage.set(1);
        this.loadPosts();
      });

    /**
     * Theo dõi thay đổi VI <-> EN.
     *
     * skip(1) để bỏ lần phát ban đầu,
     * vì ngOnInit đã gọi API lần đầu.
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
        this.currentPage.set(1);

        /**
         * Category ID của tiếng Việt và tiếng Anh
         * có thể khác nhau, nên khi đổi ngôn ngữ
         * phải bỏ category đang chọn.
         */
        if (
          this.selectedCategoryId() !== null
        ) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
              categoryId: null,
            },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        } else {
          this.loadPosts();
        }

        /**
         * Gọi lại GET /categories?lang=...
         */
        this.loadCategories();
      });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadPosts();

    this.viewInitialized = true;
  }

  loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.categoriesErrorMessage.set(null);

    this.publicApiService
      .getCategories({
        lang: this.currentLanguageCode(),
        page: 1,
        limit: 50,
      })
      .subscribe({
        next: (response) => {
          this.categories.set(
            response.data.items,
          );

          this.isLoadingCategories.set(false);
        },

        error: (error: unknown) => {
          this.categories.set([]);
          this.isLoadingCategories.set(false);

          this.categoriesErrorMessage.set(
            this.getErrorMessage(
              error,
              'Không thể tải danh mục.',
            ),
          );
        },
      });
  }

  loadPosts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const search =
      this.searchTerm().trim();

    this.publicApiService
      .getPosts({
        search:
          search || undefined,

        categoryId:
          this.selectedCategoryId() ??
          undefined,

        lang:
          this.currentLanguageCode(),

        page:
          this.currentPage(),

        limit:
          this.itemsPerPage,
      })
      .subscribe({
        next: (response) => {
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
            data.meta.totalPages,
          );

          this.currentPage.set(
            data.meta.currentPage,
          );

          this.isLoading.set(false);
        },

        error: (error: unknown) => {
          this.posts.set([]);
          this.totalItems.set(0);
          this.totalPages.set(1);
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

  selectCategory(
    categoryId: number | null,
  ): void {
    if (
      categoryId ===
      this.selectedCategoryId()
    ) {
      return;
    }

    /**
     * Đưa categoryId lên URL.
     * Subscription queryParamMap phía trên
     * sẽ gọi lại loadPosts().
     */
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        categoryId,
      },
      queryParamsHandling: 'merge',
    });
  }

  onFilterChange(
    filter: FilterSortOption,
  ): void {
    this.activeFilter.set(filter);

    /**
     * Không gọi API vì backend chưa có query sort.
     * visiblePosts computed sẽ tự sắp xếp lại.
     */
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

    this.currentPage.set(page);
    this.loadPosts();

    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  private mapToPostItem(
    post: PublicPost,
  ): PostItem {
    const plainContent =
      this.stripHtml(post.content);

    return {
      id: post.id,
      authorId: post.authorId,
      title: post.title,

      excerpt:
        plainContent.length > 150
          ? `${plainContent.slice(0, 150)}...`
          : plainContent,

      authorName:
        post.author.username,

      authorAvatar:
        post.author.username
          .charAt(0)
          .toUpperCase(),

      timeAgo:
        this.formatDate(
          post.publishedAt ??
          post.createdAt,
        ),

      readTime:
        this.calculateReadTime(
          plainContent,
        ),

      categories:
        post.categories.map(
          (category) => category.name,
        ),

      tags:
        post.tags.map((tag) =>
          tag.name.startsWith('#')
            ? tag.name
            : `#${tag.name}`,
        ),

      likes:
        post.likeCount,

      views:
        post.viewCount,

      /**
       * Public API không trả commentCount.
       */
      comments: 0,
      showCommentCount: false,

      thumbnailUrl:
        post.thumbnailUrl,
    };
  }

  private currentLanguageCode(): string {
    return this.translationService
      .currentLang()
      .toLowerCase();
  }

  private stripHtml(
    content: string,
  ): string {
    return content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateReadTime(
    content: string,
  ): string {
    const wordCount = content
      .split(/\s+/)
      .filter(Boolean)
      .length;

    const minutes = Math.max(
      1,
      Math.ceil(wordCount / 200),
    );

    return `${minutes} phút đọc`;
  }

  private formatDate(
    value: string,
  ): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Gần đây';
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

  private getErrorMessage(
    error: unknown,
    fallback: string,
  ): string {
    if (
      error instanceof HttpErrorResponse
    ) {
      const backendMessage: unknown =
        error.error?.message;

      if (Array.isArray(backendMessage)) {
        return backendMessage.join(', ');
      }

      if (
        typeof backendMessage === 'string'
      ) {
        return backendMessage;
      }

      if (error.status === 0) {
        return 'Không kết nối được tới backend.';
      }

      return `${fallback} HTTP ${error.status}.`;
    }

    return fallback;
  }
}