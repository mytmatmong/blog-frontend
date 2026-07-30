import { Component, signal, computed } from '@angular/core';
import { PublicSidebarLeft } from '../../../shared/components/public-sidebar-left/public-sidebar-left';
import { PublicSidebarRight } from '../../../shared/components/public-sidebar-right/public-sidebar-right';
import { PostCard, PostItem } from '../../../shared/components/post-card/post-card';
import { Pagination } from '../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-hashtag',
  imports: [PublicSidebarLeft, PublicSidebarRight, PostCard, Pagination],
  templateUrl: './hashtag.html',
  styleUrl: './hashtag.css',
})
export class Hashtag {
  mockPosts: PostItem[] = [];
  currentPage = signal(1);
  itemsPerPage = 10;
  searchTerm = signal('');

  filteredPosts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.mockPosts;
    return this.mockPosts.filter(post => 
      post.tags.some(tag => tag.toLowerCase().includes(term))
    );
  });

  visiblePosts = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.filteredPosts().slice(startIndex, startIndex + this.itemsPerPage);
  });

  onSearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.currentPage.set(1);
  }

  clearSearch() {
    this.searchTerm.set('');
    this.currentPage.set(1);
  }

  constructor() {
    const basePosts: Omit<PostItem, 'id'>[] = [
      {
        title: 'Microservices vs Monolithic: Cuộc chiến kiến trúc',
        excerpt: 'Phân tích điểm mạnh, điểm yếu và khi nào nên chuyển đổi hệ thống sang Microservices.',
        authorName: 'Kiên Architect',
        authorAvatar: 'K',
        timeAgo: '5 giờ trước',
        readTime: '15 phút đọc',
        categories: ['Architecture', 'System Design'],
        tags: ['#microservices', '#monolithic', '#backend'],
        likes: 540,
        views: 12500,
        comments: 67
      },
      {
        title: 'Bảo mật dữ liệu nhạy cảm trong hệ thống phân tán',
        excerpt: 'Cách sử dụng Vault, mã hóa dữ liệu tại chỗ (at-rest) và trên đường truyền (in-transit).',
        authorName: 'Nam Security',
        authorAvatar: 'N',
        timeAgo: '1 ngày trước',
        readTime: '10 phút đọc',
        categories: ['Security', 'DevOps'],
        tags: ['#security', '#devops', '#vault'],
        likes: 380,
        views: 4500,
        comments: 18
      }
    ];

    for (let i = 0; i < 20; i++) {
      const post = { ...basePosts[i % basePosts.length] } as PostItem;
      post.id = i + 1;
      post.title = `${post.title} (Phần ${i + 1})`;
      post.likes = Math.floor(Math.random() * 500) + 10;
      post.views = post.likes * 15;
      post.comments = Math.floor(post.likes / 8);
      this.mockPosts.push(post);
    }
  }
}
