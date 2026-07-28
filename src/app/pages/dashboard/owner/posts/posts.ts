import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PostItem {
  id: number;
  title: string;
  category: string;
  lang: string;
  status: string;
  statusClass: string;
  modalId: string;
  content: string;
}

@Component({
  selector: 'app-posts',
  imports: [RouterLink],
  templateUrl: './posts.html',
  styleUrl: './posts.css',
})
export class Posts {
  postsMockData: PostItem[] = [];
  currentPage = signal<number>(1);
  itemsPerPage = 8;
  activePreviewPost = signal<PostItem | null>(null);

  constructor() {
    const basePosts = [
      {
        id: 1, 
        title: 'Thiết kế Blog đa ngôn ngữ', 
        category: 'Backend',
        lang: 'VI', 
        status: 'PUBLISHED', 
        statusClass: 'bg-success',
        modalId: 'previewModal1',
        content: `
          <div class="mb-3">
            <span class="badge bg-secondary-subtle text-secondary-emphasis me-2">Backend</span>
            <span class="text-muted small">Ngôn ngữ gốc: VI | Đã xuất bản</span>
          </div>
          <h2 class="mb-4 fw-bold">Cách xây dựng hệ thống đa ngôn ngữ hiệu quả cho Blog cá nhân</h2>
          <div class="blog-content text-dark" style="line-height: 1.8;">
            <p>Xin chào mọi người! Hôm nay mình sẽ chia sẻ cách thiết kế kiến trúc đa ngôn ngữ cho hệ thống CMS. Điều quan trọng nhất khi làm đa ngôn ngữ là cấu trúc Database.</p>
            <p><strong>1. Cấu trúc Database:</strong></p>
            <p>Thay vì tạo thêm các cột như <code>title_en</code>, <code>content_en</code> trực tiếp vào bảng <code>posts</code> (cách này rất khó mở rộng sau này), chúng ta nên tách ra một bảng riêng gọi là <code>post_translations</code>.</p>
            <pre class="bg-light p-3 rounded my-3 border text-dark"><code>
CREATE TABLE post_translations (
    id INT PRIMARY KEY,
    post_id INT,
    language_code VARCHAR(10),
    title VARCHAR(255),
    content TEXT
);
            </code></pre>
            <p>Với cấu trúc này, khi cần thêm tiếng Nhật (JA) hay tiếng Pháp (FR), chúng ta không cần đụng chạm gì đến cấu trúc bảng cũ, chỉ việc thêm dữ liệu mới vào bảng dịch. Thật tuyệt phải không?</p>
            <p><strong>2. Xử lý trên Backend (NodeJS):</strong></p>
            <p>Backend cần trả về đúng bản dịch dựa trên biến <code>?lang=vi</code> hoặc Accept-Language trên header của Request. Nhờ đó Frontend có thể render dữ liệu một cách mượt mà.</p>
          </div>
        `
      },
      {
        id: 2, 
        title: 'Angular Interceptor', 
        category: 'Frontend',
        lang: 'EN', 
        status: 'DRAFT', 
        statusClass: 'bg-secondary',
        modalId: 'previewModal2',
        content: `
          <div class="mb-3">
            <span class="badge bg-secondary-subtle text-secondary-emphasis me-2">Frontend</span>
            <span class="text-muted small">Ngôn ngữ gốc: EN | Bản nháp</span>
          </div>
          <h2 class="mb-4 fw-bold">Mastering Angular HttpInterceptor for Authentication</h2>
          <div class="blog-content text-dark" style="line-height: 1.8;">
            <p>An <strong>HttpInterceptor</strong> is a fantastic tool in Angular for transforming HTTP requests and responses globally. We often use it for attaching JWT tokens to API calls.</p>
            <p>Here is a simple implementation of an Auth Interceptor:</p>
            <pre class="bg-light p-3 rounded my-3 border text-dark"><code>
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('access_token');
    if (token) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + token)
      });
      return next.handle(cloned);
    }
    return next.handle(req);
  }
}
            </code></pre>
            <p>Don't forget to provide it in your <code>app.module.ts</code>! This helps keep your API services clean and DRY.</p>
          </div>
        `
      }
    ];

    const categoriesList = ['Backend', 'Frontend', 'Database', 'DevOps', 'AI', 'NodeJS', 'Angular'];
    const langList = ['VI', 'EN'];
    const statusList = [{ label: 'PUBLISHED', class: 'bg-success' }, { label: 'DRAFT', class: 'bg-secondary' }];

    for (let i = 0; i < 25; i++) {
      const post = { ...basePosts[i % 2] };
      post.id = i + 1;
      post.title = `${post.title} (Phần ${i + 1})`;
      post.category = categoriesList[i % categoriesList.length];
      post.lang = langList[i % langList.length];
      post.status = statusList[i % statusList.length].label;
      post.statusClass = statusList[i % statusList.length].class;
      this.postsMockData.push(post);
    }
  }

  // Reactive computed total pages
  totalPages = computed(() => Math.ceil(this.postsMockData.length / this.itemsPerPage));

  // Reactive page array
  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  }

  // Paginated posts
  get paginatedPosts(): PostItem[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.postsMockData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  setPreviewPost(post: PostItem) {
    this.activePreviewPost.set(post);
  }

  deletePost(post: PostItem) {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      this.postsMockData = this.postsMockData.filter(p => p.id !== post.id);
      const maxPages = Math.ceil(this.postsMockData.length / this.itemsPerPage);
      if (this.currentPage() > maxPages && maxPages >= 1) {
        this.currentPage.set(maxPages);
      }
    }
  }
}
