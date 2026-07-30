import { Component, AfterViewInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';

declare var Chart: any;

interface Post {
  id: number;
  title: string;
  status: string;
  statusClass: string;
  views: number;
  likes: number;
  content: string;
}

@Component({
  selector: 'app-owner-dashboard',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './owner-dashboard.html',
  styleUrl: './owner-dashboard.css',
})
export class OwnerDashboard implements AfterViewInit {
  postsData: Post[] = [
    { id: 1, title: "Angular Guard theo role", status: "PUBLISHED", statusClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300", views: 1200, likes: 345, 
      content: "<p>Trong bài viết này, chúng ta sẽ tìm hiểu cách sử dụng <strong>CanActivate</strong> để bảo vệ các routes trong Angular. Điều này rất quan trọng để đảm bảo rằng chỉ những người dùng có vai trò (role) thích hợp mới có thể truy cập vào các trang như Admin Dashboard hay Moderator Panel.</p><p>Hãy tạo một guard đơn giản:</p><pre class='bg-gray-100 dark:bg-gray-800 p-3 rounded-lg my-3 border dark:border-gray-700 text-gray-900 dark:text-gray-100'><code>ng generate guard auth</code></pre>" },
    { id: 2, title: "Tối ưu hóa Query trong MySQL", status: "PUBLISHED", statusClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300", views: 3422, likes: 980,
      content: "<p>Tối ưu hóa truy vấn Database là kỹ năng bài bản của Backend Developer.</p><p><strong>1. Sử dụng Index:</strong> Hãy đánh index cho các cột thường xuyên được tìm kiếm bằng <code>WHERE</code> hoặc dùng để <code>JOIN</code>.</p><p><strong>2. Tránh SELECT *:</strong> Chỉ lấy những cột bạn thực sự cần để giảm thiểu băng thông và RAM.</p>" },
    { id: 3, title: "Express Validator cơ bản", status: "DRAFT", statusClass: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", views: 0, likes: 0,
      content: "<p>Validation là lớp khiên đầu tiên bảo vệ API của bạn khỏi các dữ liệu rác hoặc mã độc.</p><p>Với Express Validator, bạn có thể dễ dàng kiểm tra các trường như email, password ngay tại middleware.</p><pre class='bg-gray-100 dark:bg-gray-800 p-3 rounded-lg my-3 border dark:border-gray-700 text-gray-900 dark:text-gray-100'><code>body('email').isEmail().withMessage('Email không hợp lệ')</code></pre>" },
    { id: 4, title: "CSS Variables và Dark Mode", status: "PUBLISHED", statusClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300", views: 850, likes: 412,
      content: "<p>Làm Dark Mode chưa bao giờ dễ dàng đến thế nhờ CSS Variables (Custom Properties).</p><p>Bạn chỉ cần định nghĩa các biến màu ở <code>:root</code> và thay đổi chúng khi body có class <code>.dark-mode</code>.</p>" }
  ];

  sortCriteria = signal<'views' | 'likes'>('views');
  copySuccess = signal<boolean>(false);
  activePreviewPost = signal<Post | null>(null);
  isShareModalOpen = signal<boolean>(false);

  get sortedPosts(): Post[] {
    const crit = this.sortCriteria();
    return [...this.postsData]
      .sort((a, b) => b[crit] - a[crit])
      .slice(0, 3);
  }

  ngAfterViewInit() {
    this.initChart();
  }

  initChart() {
    if (typeof Chart !== 'undefined') {
      const canvas = document.getElementById('interactionChart') as HTMLCanvasElement;
      if (canvas) {
        new Chart(canvas, {
          type: 'line',
          data: {
            labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
            datasets: [
              {
                label: 'Lượt Xem (Views)',
                data: [150, 230, 180, 320, 290, 450, 500],
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              },
              {
                label: 'Lượt Thích (Likes)',
                data: [45, 80, 50, 110, 95, 180, 210],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true } }
          }
        });
      }
    }
  }

  onSortChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'views' || value === 'likes') {
      this.sortCriteria.set(value);
    }
  }

  copyBlogLink() {
    const blogLinkInput = document.getElementById('blogLinkInput') as HTMLInputElement;
    if (blogLinkInput) {
      blogLinkInput.select();
      blogLinkInput.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(blogLinkInput.value).then(() => {
        this.copySuccess.set(true);
        setTimeout(() => this.copySuccess.set(false), 2000);
      });
    }
  }

  setPreviewPost(post: Post) {
    this.activePreviewPost.set(post);
  }

  closePreviewModal() {
    this.activePreviewPost.set(null);
  }

  openShareModal() {
    this.isShareModalOpen.set(true);
  }

  closeShareModal() {
    this.isShareModalOpen.set(false);
  }

  deletePost(post: Post) {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi này không?')) {
      this.postsData = this.postsData.filter(p => p.id !== post.id);
    }
  }
}
