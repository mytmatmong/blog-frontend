import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

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
  imports: [RouterLink, TranslatePipe],
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
        statusClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        modalId: 'previewModal1',
        content: `
          <div class="mb-3">
            <span class="inline-block px-2.5 py-1 text-xs font-semibold rounded-md bg-aquamarine-100 text-aquamarine-800 dark:bg-aquamarine-800 dark:text-aquamarine-100 me-2">Backend</span>
            <span class="text-aquamarine-600 dark:text-aquamarine-400 text-xs">Ngôn ngữ gốc: VI | Đã xuất bản</span>
          </div>
          <h2 class="mb-4 font-bold text-xl text-aquamarine-950 dark:text-aquamarine-50">Cách xây dựng hệ thống đa ngôn ngữ hiệu quả cho Blog cá nhân</h2>
          <div class="space-y-3 text-aquamarine-800 dark:text-aquamarine-200 text-sm">
            <p>Xin chào mọi người! Hôm nay mình sẽ chia sẻ cách thiết kế kiến trúc đa ngôn ngữ cho hệ thống CMS. Điều quan trọng nhất khi làm đa ngôn ngữ là cấu trúc Database.</p>
            <p><strong>1. Cấu trúc Database:</strong></p>
            <p>Thay vì tạo thêm các cột như <code>title_en</code>, <code>content_en</code> trực tiếp vào bảng <code>posts</code> (cách này rất khó mở rộng sau này), chúng ta nên tách ra một bảng riêng gọi là <code>post_translations</code>.</p>
            <pre class="bg-aquamarine-950 text-aquamarine-100 p-4 rounded-xl my-3 text-xs overflow-x-auto"><code>
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
        statusClass: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        modalId: 'previewModal2',
        content: `
          <div class="mb-3">
            <span class="inline-block px-2.5 py-1 text-xs font-semibold rounded-md bg-aquamarine-100 text-aquamarine-800 dark:bg-aquamarine-800 dark:text-aquamarine-100 me-2">Frontend</span>
            <span class="text-aquamarine-600 dark:text-aquamarine-400 text-xs">Ngôn ngữ gốc: EN | Bản nháp</span>
          </div>
          <h2 class="mb-4 font-bold text-xl text-aquamarine-950 dark:text-aquamarine-50">Mastering Angular HttpInterceptor for Authentication</h2>
          <div class="space-y-3 text-aquamarine-800 dark:text-aquamarine-200 text-sm">
            <p>An <strong>HttpInterceptor</strong> is a fantastic tool in Angular for transforming HTTP requests and responses globally. We often use it for attaching JWT tokens to API calls.</p>
            <p>Here is a simple implementation of an Auth Interceptor:</p>
            <pre class="bg-aquamarine-950 text-aquamarine-100 p-4 rounded-xl my-3 text-xs overflow-x-auto"><code>
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
    const statusList = [
      { label: 'PUBLISHED', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' }, 
      { label: 'DRAFT', class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' }
    ];

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

  totalPages = computed(() => Math.ceil(this.postsMockData.length / this.itemsPerPage));

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  }

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

  closePreviewModal() {
    this.activePreviewPost.set(null);
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
