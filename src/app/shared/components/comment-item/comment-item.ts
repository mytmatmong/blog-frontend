import { Component } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-comment-item',
  imports: [TranslatePipe],
  templateUrl: './comment-item.html',
  styleUrl: './comment-item.css',
})
export class CommentItem {}
