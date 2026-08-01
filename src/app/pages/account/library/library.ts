import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { Pagination } from '../../../shared/components/pagination/pagination';
import { PostCard, PostItem } from '../../../shared/components/post-card/post-card';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PublicPost } from '../../../core/models/post.model';
import { UserApiService } from '../../../core/services/user-api.service';
import { TranslationService } from '../../../core/services/translation.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-account-library',
  imports: [PostCard, Pagination, TranslatePipe],
  templateUrl: './library.html',
  styleUrl: './library.css',
})
export class AccountLibrary {
  private readonly userApi = inject(UserApiService);
  private readonly ts = inject(TranslationService);

  readonly activeTab = signal<'bookmarks' | 'likes'>('bookmarks');
  readonly posts = signal<PostItem[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly currentPage = signal(1);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly itemsPerPage = 10;

  constructor() {
    this.load();
  }

  selectTab(tab: 'bookmarks' | 'likes'): void {
    if (tab === this.activeTab()) return;
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.load();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const request = this.activeTab() === 'bookmarks'
      ? this.userApi.getBookmarkedPosts({ page: this.currentPage(), limit: this.itemsPerPage })
      : this.userApi.getLikedPosts({ page: this.currentPage(), limit: this.itemsPerPage });

    request.subscribe({
      next: ({ data }) => {
        this.posts.set(data.items.map((post) => this.mapPost(post)));
        this.totalItems.set(data.meta.totalItems);
        this.totalPages.set(Math.max(1, data.meta.totalPages));
        this.currentPage.set(data.meta.currentPage);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.posts.set([]);
        this.totalItems.set(0);
        this.totalPages.set(1);
        this.isLoading.set(false);
        this.errorMessage.set(getApiErrorMessage(error));
      },
    });
  }

  private mapPost(post: PublicPost): PostItem {
    const plainText = this.extractText(post.content);
    const words = plainText.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / (this.langCode() === 'en' ? 200 : 180)));

    return {
      id: post.id,
      authorId: post.authorId,
      title: post.title,
      excerpt: plainText.length > 150 ? `${plainText.slice(0, 150).trimEnd()}…` : plainText,
      authorName: post.author.username,
      authorAvatar: post.author.username.charAt(0).toUpperCase() || 'A',
      authorAvatarUrl: post.author.avatarUrl,
      timeAgo: this.formatDate(post.publishedAt ?? post.createdAt),
      readTime: `${minutes} ${this.ts.translate('post.read_time')}`,
      categories: post.categories.map(({ id, name }) => ({ id, name })),
      tags: post.tags.map(({ id, name }) => ({ id, name })),
      likes: post.likeCount,
      views: post.viewCount,
      comments: 0,
      showCommentCount: false,
      thumbnailUrl: post.thumbnailUrl,
    };
  }

  private extractText(html: string): string {
    if (typeof DOMParser !== 'undefined') {
      return new DOMParser().parseFromString(html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    }
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleDateString(this.langCode() === 'en' ? 'en-US' : 'vi-VN');
  }

  private langCode(): string {
    return this.ts.currentLang().toLowerCase();
  }
}
