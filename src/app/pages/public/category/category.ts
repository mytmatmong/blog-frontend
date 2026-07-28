import { Component } from '@angular/core';
import { PublicSidebarLeft } from '../../../shared/components/public-sidebar-left/public-sidebar-left';
import { PublicSidebarRight } from '../../../shared/components/public-sidebar-right/public-sidebar-right';
import { PostCard, PostItem } from '../../../shared/components/post-card/post-card';
import { Pagination } from '../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-category',
  imports: [PublicSidebarLeft, PublicSidebarRight, PostCard, Pagination],
  templateUrl: './category.html',
  styleUrl: './category.css',
})
export class Category {
  mockPosts: PostItem[] = [];

  constructor() {
    const basePosts: Omit<PostItem, 'id'>[] = [
      {
        title: 'Hướng dẫn xây dựng RESTful API với NestJS',
        excerpt: 'NestJS mang lại cấu trúc của Angular cho backend NodeJS, giúp quản lý dependency dễ dàng.',
        authorName: 'Hoàng Backend',
        authorAvatar: 'HB',
        timeAgo: '4 giờ trước',
        readTime: '12 phút đọc',
        categories: ['Backend', 'NestJS'],
        tags: ['#nestjs', '#nodejs', '#backend'],
        likes: 215,
        views: 3100,
        comments: 20
      },
      {
        title: 'GraphQL vs REST: Nên chọn gì cho dự án mới?',
        excerpt: 'So sánh ưu nhược điểm của GraphQL và REST, khi nào nên dùng công nghệ nào để tối ưu cho Frontend.',
        authorName: 'Sơn Dev',
        authorAvatar: 'S',
        timeAgo: '2 ngày trước',
        readTime: '7 phút đọc',
        categories: ['Backend', 'Architecture'],
        tags: ['#graphql', '#rest', '#api'],
        likes: 180,
        views: 2900,
        comments: 34
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
