import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicSidebarRight } from '../../../shared/components/public-sidebar-right/public-sidebar-right';
import { CommentItem } from '../../../shared/components/comment-item/comment-item';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PublicApiService } from '../../../core/services/public-api.service';
import { PublicPost, PublicComment } from '../../../core/models/post.model';

@Component({
  selector: 'app-post-detail',
  imports: [RouterLink, PublicSidebarRight, CommentItem, TranslatePipe],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.css',
})
export class PostDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicApiService = inject(PublicApiService);

  post = signal<PublicPost | null>(null);
  comments = signal<PublicComment[]>([]);
  isLoading = signal<boolean>(false);
  isLoadingComments = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const idStr = params['id'];
      const id = parseInt(idStr, 10);
      if (id) {
        this.loadPost(id);
        this.loadComments(id);
      }
    });
  }

  loadPost(id: number) {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.publicApiService.getPostById(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.post.set(res.data);
        } else {
          this.errorMessage.set('Không tìm thấy bài viết.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Không thể tải bài viết.');
      }
    });
  }

  loadComments(postId: number) {
    this.isLoadingComments.set(true);
    this.publicApiService.getPostComments(postId).subscribe({
      next: (res) => {
        this.isLoadingComments.set(false);
        if (res.success && res.data) {
          this.comments.set(res.data.items);
        }
      },
      error: () => {
        this.isLoadingComments.set(false);
      }
    });
  }

  getAvatarInitial(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : 'A';
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  }
}
