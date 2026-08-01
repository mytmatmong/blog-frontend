import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import {
  CommentReply,
  PublicComment,
} from '../../../core/models/post.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface CommentActionTarget {
  id: number;
  userId: number;
  username: string;
  content: string;
  parentId: number | null;
}

@Component({
  selector: 'app-comment-item',
  imports: [TranslatePipe],
  templateUrl: './comment-item.html',
  styleUrl: './comment-item.css',
})
export class CommentItem {
  @Input({ required: true }) comment!: PublicComment;
  @Input() currentUserId: number | null = null;
  @Input() isAuthenticated = false;

  @Output() readonly replyRequested = new EventEmitter<CommentActionTarget>();
  @Output() readonly editRequested = new EventEmitter<CommentActionTarget>();
  @Output() readonly deleteRequested = new EventEmitter<CommentActionTarget>();
  @Output() readonly reportRequested = new EventEmitter<CommentActionTarget>();

  rootTarget(): CommentActionTarget {
    return {
      id: this.comment.id,
      userId: this.comment.userId,
      username: this.comment.user.username,
      content: this.comment.content,
      parentId: null,
    };
  }

  replyTarget(reply: CommentReply): CommentActionTarget {
    return {
      id: reply.id,
      userId: reply.userId,
      username: reply.user.username,
      content: reply.content,
      parentId: reply.parentId,
    };
  }

  isOwner(userId: number): boolean {
    return this.currentUserId !== null && this.currentUserId === userId;
  }

  getAvatarInitial(name?: string | null): string {
    return name?.charAt(0).toUpperCase() || 'U';
  }

  formatDate(dateString?: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  }
}
