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
    return name ? name.charAt(0).toUpperCase() : 'A';
  }

  private mapToPostItem(p: PublicPost): PostItem {
    return {
      id: p.id,
      authorId: p.author?.id || this.author()?.id || 1,
      title: p.title,
      excerpt: p.summary || (p.content ? (p.content.length > 150 ? p.content.substring(0, 150) + '...' : p.content) : ''),
      authorName: p.author?.username || 'Tác giả',
      authorAvatar: p.author?.username ? p.author.username.charAt(0).toUpperCase() : 'A',
      timeAgo: p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
      readTime: '5 phút đọc',
      categories: p.categories?.map(c => c.name) || [],
      tags: p.tags?.map(t => t.name.startsWith('#') ? t.name : '#' + t.name) || [],
      likes: p.likeCount || 0,
      views: p.viewCount || 0,
      comments: 0
    };
  }
}
