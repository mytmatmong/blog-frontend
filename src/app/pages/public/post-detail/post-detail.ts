import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicSidebarRight } from '../../../shared/components/public-sidebar-right/public-sidebar-right';
import { CommentItem } from '../../../shared/components/comment-item/comment-item';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-post-detail',
  imports: [RouterLink, PublicSidebarRight, CommentItem, TranslatePipe],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.css',
})
export class PostDetail {}
