import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicSidebarLeft, FilterSortOption } from '../../../shared/components/public-sidebar-left/public-sidebar-left';
import { PublicSidebarRight } from '../../../shared/components/public-sidebar-right/public-sidebar-right';
import { PostCard, PostItem } from '../../../shared/components/post-card/post-card';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PublicApiService } from '../../../core/services/public-api.service';
import { PublicPost } from '../../../core/models/post.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PublicSidebarLeft, PublicSidebarRight, PostCard, Pagination, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly publicApiService = inject(PublicApiService);

  posts = signal<PostItem[]>([]);
  totalItems = signal<number>(0);
  totalPages = signal<number>(1);
  currentPage = signal<number>(1);
  itemsPerPage = 10;
  searchTerm = signal<string>('');
  activeFilter = signal<FilterSortOption>('latest');
  isLoading = signal<boolean>(false);

  visiblePosts = computed(() => this.posts());
  filteredPosts = computed(() => this.posts());

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.isLoading.set(true);
    const search = this.searchTerm().trim();
    
    this.publicApiService.getPosts({
      search: search || undefined,
      page: this.currentPage(),
      limit: this.itemsPerPage
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          const mapped = res.data.items.map((p) => this.mapToPostItem(p));
          this.posts.set(mapped);
          this.totalItems.set(res.data.meta.totalItems);
          this.totalPages.set(res.data.meta.totalPages);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.loadMockPosts();
      }
    });
  }

  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.currentPage.set(1);
    this.loadPosts();
  }

  clearSearch() {
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.loadPosts();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadPosts();
  }

  private mapToPostItem(p: PublicPost): PostItem {
    return {
      id: p.id,
      authorId: p.author?.id || 1,
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

  private loadMockPosts() {
    const basePosts: Omit<PostItem, 'id'>[] = [
      {
        title: 'Thiết kế Blog đa ngôn ngữ với ExpressJS và Sequelize',
        excerpt: 'Hướng dẫn cách xây dựng blog từ database, backend ExpressJS đến frontend Angular theo hướng module.',
        authorId: 1,
        authorName: 'Sơn Dev',
        authorAvatar: 'S',
        timeAgo: '1 giờ trước',
        readTime: '5 phút đọc',
        categories: ['Backend', 'ExpressJS'],
        tags: ['#expressjs', '#angular', '#sequelize'],
        likes: 43,
        views: 1311,
        comments: 4
      },
      {
        title: 'Tối ưu hiệu suất cho ứng dụng Angular lớn',
        excerpt: 'Các mẹo tối ưu OnPush, Signals và lazy loading route trong Angular 19.',
        authorId: 2,
        authorName: 'Hải Frontend',
        authorAvatar: 'H',
        timeAgo: '3 giờ trước',
        readTime: '8 phút đọc',
        categories: ['Frontend', 'Angular'],
        tags: ['#angular19', '#signals', '#performance'],
        likes: 128,
        views: 4050,
        comments: 12
      }
    ];

    const mocks: PostItem[] = [];
    for (let i = 0; i < 10; i++) {
      const post = { ...basePosts[i % basePosts.length] } as PostItem;
      post.id = i + 1;
      post.title = `${post.title} (Phần ${i + 1})`;
      mocks.push(post);
    }
    this.posts.set(mocks);
    this.totalItems.set(mocks.length);
    this.totalPages.set(1);
  }
}
