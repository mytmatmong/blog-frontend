import {
  Component,
  Input,
} from '@angular/core';

import { PublicComment } from '../../../core/models/post.model';

@Component({
  selector: 'app-comment-item',
  imports: [],
  templateUrl: './comment-item.html',
  styleUrl: './comment-item.css',
})
export class CommentItem {
  @Input({ required: true })
  comment!: PublicComment;

  getAvatarInitial(
    name?: string | null,
  ): string {
    return (
      name
        ?.charAt(0)
        .toUpperCase() || 'U'
    );
  }

  formatDate(
    dateString?: string | null,
  ): string {
    if (!dateString) {
      return '';
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString(
      'vi-VN',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  }
}