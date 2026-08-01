import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface PostItemCategory {
  id: number;
  name: string;
}

export interface PostItemTag {
  id: number;
  name: string;
}

export interface PostItem {
  id: number;
  authorId: number;

  title: string;
  excerpt: string;

  authorName: string;
  authorAvatar: string;
  authorAvatarUrl?: string | null;

  timeAgo: string;
  readTime: string;

  categories: PostItemCategory[];
  tags: PostItemTag[];

  likes: number;
  views: number;
  comments: number;

  thumbnailUrl?: string | null;

  /**
   * PublicPost không trả commentCount.
   */
  showCommentCount?: boolean;
}

@Component({
  selector: 'app-post-card',
  imports: [RouterLink],
  templateUrl: './post-card.html',
  styleUrl: './post-card.css',
})
export class PostCard {
  @Input({ required: true })
  post!: PostItem;
}