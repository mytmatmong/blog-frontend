import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface PostItem {
  id: number;
  title: string;
  excerpt: string;
  authorName: string;
  authorAvatar: string;
  timeAgo: string;
  readTime: string;
  categories: string[];
  tags: string[];
  likes: number;
  views: number;
  comments: number;
}

@Component({
  selector: 'app-post-card',
  imports: [RouterLink],
  templateUrl: './post-card.html',
  styleUrl: './post-card.css',
})
export class PostCard {
  @Input({ required: true }) post!: PostItem;
}
