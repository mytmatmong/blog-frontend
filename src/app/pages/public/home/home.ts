import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
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
  selector: 'app-home',
  imports: [
    RouterLink,
    PublicSidebarLeft,
    PublicSidebarRight,
    PostCard,
    Pagination,
    TranslatePipe,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly publicApiService =
    inject(PublicApiService);

  private readonly translationService =
    inject(TranslationService);

  private readonly searchChanges =
    new Subject<string>();

  readonly posts = signal<PostItem[]>([]);
  readonly categories = signal<CategoryItem[]>([]);

  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);

  readonly searchTerm = signal('');
  readonly activeFilter =
    signal<FilterSortOption>('latest');

  readonly isLoading = signal(false);
  readonly isLoadingCategories = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly itemsPerPage = 10;

  /**
   * Backend không có query sort.
   * mostViewed và mostLiked chỉ sắp xếp các item
   * của trang hiện tại.
   */
  readonly visiblePosts = computed(() => {
    const result = [...this.posts()];

    switch (this.activeFilter()) {
      case 'mostViewed':
        return result.sort(
          (first, second) =>
            second.views - first.views,
        );

      case 'mostLiked':
        return result.sort(
          (first, second) =>
            second.likes - first.likes,
        );

      case 'mostCommented':
        /**
         * PublicPost không trả commentCount.
         * Giữ nguyên thứ tự backend.
         */
        return result;

      case 'latest':
      default:
        return result;
    }
  });

  constructor() {
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
         * Gọi lại:
         * GET /categories?lang=vi|en
         * GET /posts?lang=vi|en
         */
        this.loadCategories();
        this.loadPosts();
      });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadPosts();
  }

  loadPosts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const search =
      this.searchTerm().trim();

    this.publicApiService
      .getPosts({
        search: search || undefined,
        lang: this.currentLanguageCode(),
        page: this.currentPage(),
        limit: this.itemsPerPage,
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
            this.getErrorMessage(error),
          );
        },
      });
  }

  loadCategories(): void {
    this.isLoadingCategories.set(true);

    this.publicApiService
      .getCategories({
        lang: this.currentLanguageCode(),
        page: 1,
        limit: 20,
      })
      .subscribe({
        next: (response) => {
          this.categories.set(
            response.data.items,
          );

          this.isLoadingCategories.set(false);
        },

        error: () => {
          /**
           * Không hiển thị category giả.
           */
          this.categories.set([]);
          this.isLoadingCategories.set(false);
        },
      });
  }

  onSearchChange(value: string): void {
    this.searchChanges.next(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.searchChanges.next('');
  }

  onFilterChange(
    filter: FilterSortOption,
  ): void {
    this.activeFilter.set(filter);
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
        plainContent.length > 160
          ? `${plainContent.slice(0, 160)}...`
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

      likes: post.likeCount,
      views: post.viewCount,

      /**
       * Public Post response không trả commentCount.
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

  private stripHtml(content: string): string {
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
  ): string {
    if (
      error instanceof HttpErrorResponse
    ) {
      const backendMessage: unknown =
        error.error?.message;

      if (
        Array.isArray(backendMessage)
      ) {
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

      return `Không tải được bài viết. HTTP ${error.status}.`;
    }

    return 'Có lỗi xảy ra khi tải bài viết.';
  }
}