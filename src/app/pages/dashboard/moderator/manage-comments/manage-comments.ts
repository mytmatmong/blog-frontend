import { Component, signal, computed, inject } from '@angular/core';
import { TranslationService } from '../../../../core/services/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

interface CommentItem {
  id: number;
  text: string;
  user: string;
  postTitle: string;
}

@Component({
  selector: 'app-manage-comments',
  imports: [TranslatePipe],
  templateUrl: './manage-comments.html',
  styleUrl: './manage-comments.css',
})
export class ManageComments {
  protected readonly ts = inject(TranslationService);
  commentsMockData: CommentItem[] = [];
  currentPage = signal<number>(1);
  itemsPerPage = 8;

  activePreviewComment = signal<CommentItem | null>(null);

  constructor() {
    const baseComments: Omit<CommentItem, 'id'>[] = [
      { text: 'Bình luận không phù hợp', user: 'User C', postTitle: 'Angular Guard' },
      { text: 'Spam hashtag', user: 'User D', postTitle: 'NodeJS API' },
      { text: 'Hay quá, bài viết rất chi tiết', user: 'DevMaster', postTitle: 'Thiết kế Blog đa ngôn ngữ' }
    ];

    for (let i = 0; i < 25; i++) {
      const comment = { ...baseComments[i % baseComments.length] } as CommentItem;
      comment.id = i + 1;
      comment.text = `${comment.text} (số ${i + 1})`;
      this.commentsMockData.push(comment);
    }
  }

  totalPages = computed(() => Math.ceil(this.commentsMockData.length / this.itemsPerPage));

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  }

  get paginatedComments(): CommentItem[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.commentsMockData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  setPreviewComment(comment: CommentItem) {
    this.activePreviewComment.set(comment);
  }

  closePreviewComment() {
    this.activePreviewComment.set(null);
  }

  deleteComment(comment: CommentItem) {
    if (confirm(this.ts.translate('comments.delete_confirm'))) {
      this.commentsMockData = this.commentsMockData.filter(c => c.id !== comment.id);
      const maxPages = Math.ceil(this.commentsMockData.length / this.itemsPerPage);
      if (this.currentPage() > maxPages && maxPages >= 1) {
        this.currentPage.set(maxPages);
      }
    }
  }
}
