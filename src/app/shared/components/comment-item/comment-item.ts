import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { PublicComment } from '../../../core/models/post.model';

@Component({
  selector: 'app-comment-item',
  imports: [TranslatePipe],
  templateUrl: './comment-item.html',
  styleUrl: './comment-item.css',
})
export class CommentItem {
  @Input() comment?: PublicComment;

  getAvatarInitial(name?: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  }
}
