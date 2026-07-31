import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { PublicSidebarLeft, FilterSortOption } from '../../../shared/components/public-sidebar-left/public-sidebar-left';
import { PublicSidebarRight } from '../../../shared/components/public-sidebar-right/public-sidebar-right';
import { PostCard, PostItem } from '../../../shared/components/post-card/post-card';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PublicApiService } from '../../../core/services/public-api.service';
import { CategoryItem, PublicPost } from '../../../core/models/post.model';

@Component({
  selector: 'app-category',
  imports: [PublicSidebarLeft, PublicSidebarRight, PostCard, Pagination, TranslatePipe],
  templateUrl: './category.html',
  styleUrl: './category.css',
})
export class Category implements OnInit {
  private readonly publicApiService = inject(PublicApiService);

  categories = signal<CategoryItem[]>([]);
  selectedCategoryId = signal<number | null>(null);
  posts = signal<PostItem[]>([]);
  totalItems = signal<number>(0);
  currentPage = signal<number>(1);
  itemsPerPage = 10;
  searchTerm = signal<string>('');
  activeFilter = signal<FilterSortOption>('latest');
  isLoading = signal<boolean>(false);
  isLoadingCategories = signal<boolean>(false);

  visiblePosts = computed(() => this.posts());
  filteredPosts = computed(() => this.posts());

  ngOnInit() {
    this.loadCategories();
    this.loadPosts();
  }

  loadCategories() {
    this.isLoadingCategories.set(true);
    this.publicApiService.getCategories({ limit: 20 }).subscribe({
      next: (res) => {
        this.isLoadingCategories.set(false);
        if (res.success && res.data) {
          this.categories.set(res.data.items);
        }
      },
      error: () => {
        this.isLoadingCategories.set(false);
      }
    });
  }

  selectCategory(id: number | null) {
    this.selectedCategoryId.set(id);
    this.currentPage.set(1);
    this.loadPosts();
  }

  loadPosts() {
    this.isLoading.set(true);
    const search = this.searchTerm().trim();
    const catId = this.selectedCategoryId() || undefined;

    this.publicApiService.getPosts({
      search: search || undefined,
      categoryId: catId,
      page: this.currentPage(),
      limit: this.itemsPerPage
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          const mapped = res.data.items.map((p) => this.mapToPostItem(p));
          this.posts.set(mapped);
          this.totalItems.set(res.data.meta.totalItems);
        }
      },
      error: () => {
        this.isLoading.set(false);
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
}
