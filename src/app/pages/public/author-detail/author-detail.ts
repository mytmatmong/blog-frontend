import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PublicSidebarRight } from '../../../shared/components/public-sidebar-right/public-sidebar-right';
import { PostCard, PostItem } from '../../../shared/components/post-card/post-card';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { PublicApiService } from '../../../core/services/public-api.service';
import { AuthorDetail as AuthorDetailModel, PublicPost } from '../../../core/models/post.model';

@Component({
  selector: 'app-author-detail',
  imports: [RouterLink, DatePipe, PublicSidebarRight, PostCard, Pagination],
  templateUrl: './author-detail.html',
  styleUrl: './author-detail.css',
})
export class AuthorDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicApiService = inject(PublicApiService);

  author = signal<AuthorDetailModel | null>(null);
  posts = signal<PostItem[]>([]);
  totalItems = signal<number>(0);
  currentPage = signal<number>(1);
  itemsPerPage = 10;
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const idStr = params['id'];
      const id = parseInt(idStr, 10);
      if (id) {
        this.loadAuthorInfo(id);
      }
    });
  }

  loadAuthorInfo(id: number) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.publicApiService.getAuthorById(id, {
      page: this.currentPage(),
      limit: this.itemsPerPage
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.author.set(res.data.author);
          const mapped = (res.data.posts?.items || []).map((p) => this.mapToPostItem(p));
          this.posts.set(mapped);
          this.totalItems.set(res.data.posts?.meta?.totalItems || 0);
        } else {
          this.errorMessage.set('Không tìm thấy thông tin tác giả.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Không thể tải thông tin tác giả.');
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    if (this.author()) {
      this.loadAuthorInfo(this.author()!.id);
    }
  }

  getAvatarInitial(name?: string): string {
    return name
      ? name.charAt(0).toUpperCase()
      : 'A';
  }

  private mapToPostItem(post: PublicPost): PostItem {
    const plainContent = this.stripHtml(post.content);

    return {
      id: post.id,
      authorId: post.authorId,
      title: post.title,

      excerpt:
        plainContent.length > 150
          ? `${plainContent.slice(0, 150)}...`
          : plainContent,

      authorName:
        post.author?.username ??
        this.author()?.username ??
        'Tác giả',

      authorAvatar:
        (
          post.author?.username ??
          this.author()?.username ??
          'A'
        )
          .charAt(0)
          .toUpperCase(),

      timeAgo: this.formatDate(
        post.publishedAt ?? post.createdAt,
      ),

      readTime: this.calculateReadTime(
        plainContent,
      ),

      categories: post.categories.map(
        (category) => category.name,
      ),

      tags: post.tags.map((tag) =>
        tag.name.startsWith('#')
          ? tag.name
          : `#${tag.name}`,
      ),

      likes: post.likeCount,
      views: post.viewCount,
      comments: 0,
      showCommentCount: false,
      thumbnailUrl: post.thumbnailUrl,
    };
  }

  private stripHtml(content: string): string {
    return content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateReadTime(content: string): string {
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

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
