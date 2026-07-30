import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicSidebarLeft } from '../../../shared/components/public-sidebar-left/public-sidebar-left';
import { PublicSidebarRight } from '../../../shared/components/public-sidebar-right/public-sidebar-right';
import { PostCard, PostItem } from '../../../shared/components/post-card/post-card';
import { Pagination } from '../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-home',
  imports: [RouterLink, PublicSidebarLeft, PublicSidebarRight, PostCard, Pagination],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  mockPosts: PostItem[] = [];
  currentPage = signal(1);
  itemsPerPage = 10;
  searchTerm = signal('');

  filteredPosts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.mockPosts;
    return this.mockPosts.filter(post => 
      post.title.toLowerCase().includes(term) || 
      post.excerpt.toLowerCase().includes(term)
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
        title: 'Thiết kế Blog đa ngôn ngữ với ExpressJS và Sequelize',
        excerpt: 'Hướng dẫn cách xây dựng blog từ database, backend ExpressJS đến frontend Angular theo hướng module.',
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
        authorName: 'Hải Frontend',
        authorAvatar: 'H',
        timeAgo: '3 giờ trước',
        readTime: '8 phút đọc',
        categories: ['Frontend', 'Angular'],
        tags: ['#angular19', '#signals', '#performance'],
        likes: 128,
        views: 4050,
        comments: 12
      },
      {
        title: 'Hiểu sâu về JWT Authentication trong NodeJS',
        excerpt: 'Cách triển khai xác thực an toàn, refresh token và chặn hacker đánh cắp phiên đăng nhập.',
        authorName: 'Nam Security',
        authorAvatar: 'N',
        timeAgo: '1 ngày trước',
        readTime: '10 phút đọc',
        categories: ['Backend', 'Security'],
        tags: ['#nodejs', '#jwt', '#auth'],
        likes: 310,
        views: 8900,
        comments: 45
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
