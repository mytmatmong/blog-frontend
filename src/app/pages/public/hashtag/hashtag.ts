import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  debounceTime,
  distinctUntilChanged,
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
import { PublicPost } from '../../../core/models/post.model';

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
  private readonly route = inject(ActivatedRoute);

  private readonly publicApiService =
    inject(PublicApiService);

  private readonly translationService =
    inject(TranslationService);

  private readonly searchChanges =
    new Subject<string>();

  readonly posts = signal<PostItem[]>([]);

  readonly selectedTagId =
    signal<number | null>(null);

  readonly selectedTagName =
    signal<string | null>(null);

  readonly currentPage = signal(1);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);

  readonly searchTerm = signal('');

  readonly activeFilter =
    signal<FilterSortOption>('latest');

  readonly isLoading = signal(false);

  readonly errorMessage =
    signal<string | null>(null);

  readonly itemsPerPage = 10;

  /**
   * Backend hiện chưa hỗ trợ query sort.
   * Hai bộ lọc này chỉ sắp xếp các bài trong trang hiện tại.
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

      case 'latest':
      default:
        return posts;
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

    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const rawTagId =
          params.get('tagId');

        const parsedTagId = rawTagId
          ? Number(rawTagId)
          : null;

        const tagName =
          params.get('tagName')?.trim() ||
          null;

        const validTagId =
          parsedTagId !== null &&
            Number.isInteger(parsedTagId) &&
            parsedTagId > 0
            ? parsedTagId
            : null;

        this.selectedTagId.set(validTagId);
        this.selectedTagName.set(tagName);

        this.currentPage.set(1);
        this.loadPosts();
      });
  }

  loadPosts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const tagId =
      this.selectedTagId();

    const tagName =
      this.selectedTagName();

    this.publicApiService
      .getPosts({
        search:
          this.searchTerm().trim() ||
          undefined,

        tagId:
          tagId ?? undefined,

        /**
         * Nếu có tagId thì ưu tiên tagId,
         * không gửi thêm tagName.
         */
        tagName:
          tagId === null
            ? tagName ?? undefined
            : undefined,

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

      likes: post.likeCount,
      views: post.viewCount,

      /**
       * PublicPost không trả commentCount.
       */
      comments: 0,
      showCommentCount: false,

      thumbnailUrl:
        post.thumbnailUrl,
    };
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

  private formatDate(value: string): string {
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

  private currentLanguageCode(): string {
    return this.translationService
      .currentLang()
      .toLowerCase();
  }

  private getErrorMessage(
    error: unknown,
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

      return `Không tải được bài viết. HTTP ${error.status}.`;
    }

    return 'Không thể tải bài viết theo hashtag.';
  }
}