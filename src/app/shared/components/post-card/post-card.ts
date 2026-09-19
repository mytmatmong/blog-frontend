import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  PostInteractionService,
} from '../../../core/services/post-interaction.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

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
  /**
   * null nếu đây là bài gốc, khác null nếu là bản dịch.
   * Like/bookmark luôn lưu vào bài gốc (backend), nên PostCard
   * phải dùng parentPostId ?? id khi check/gọi tương tác — nếu
   * dùng thẳng id của bản dịch, trạng thái "đã thích" sẽ luôn sai.
   */
  parentPostId: number | null;
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
  showCommentCount?: boolean;
}

export type PostCardInteractionAction =
  | 'like'
  | 'unlike'
  | 'bookmark'
  | 'unbookmark';

export interface PostCardInteractionEvent {
  postId: number;
  action: PostCardInteractionAction;
}

export type PostCardVariant =
  | 'grid'
  | 'list';

@Component({
  selector: 'app-post-card',
  imports: [
    RouterLink,
    TranslatePipe,
    NgClass,
  ],
  templateUrl: './post-card.html',
  styleUrl: './post-card.css',
})
export class PostCard
  implements OnInit, OnChanges {
  private readonly interactions =
    inject(PostInteractionService);

  @Input({ required: true })
  post!: PostItem;
  @Input()
  variant: PostCardVariant = 'grid';

  /**
   * Mặc định bật cho mọi PostCard:
   * Home, Category, Hashtag, Author và Library.
   */
  @Input()
  showUserActions = true;

  /**
   * Library truyền các giá trị này để tự quản lý.
   * Các trang public không truyền thì PostCard dùng service chung.
   */
  @Input()
  liked: boolean | null = null;

  @Input()
  bookmarked: boolean | null = null;

  @Input()
  likeBusy: boolean | null = null;

  @Input()
  bookmarkBusy: boolean | null = null;

  @Output()
  readonly interactionRequested =
    new EventEmitter<PostCardInteractionEvent>();

  readonly displayedLikes =
    signal(0);

  /**
   * Like/bookmark luôn được backend lưu vào bài GỐC của nhóm ngôn
   * ngữ, nên mọi thao tác đọc/ghi trạng thái "đã thích/đã lưu" phải
   * dùng đúng id này, không phải id của bản dịch đang hiển thị.
   */
  private get rootId(): number {
    return this.post.parentPostId ?? this.post.id;
  }

  ngOnInit(): void {
    this.interactions.ensureLoaded();

    this.displayedLikes.set(
      this.post.likes,
    );
  }

  ngOnChanges(
    changes: SimpleChanges,
  ): void {
    if (
      changes['post']
      && this.post
    ) {
      this.displayedLikes.set(
        this.post.likes,
      );
    }
  }

  isLiked(): boolean {
    return this.liked
      ?? this.interactions
        .isLiked(this.rootId);
  }

  isBookmarked(): boolean {
    return this.bookmarked
      ?? this.interactions
        .isBookmarked(this.rootId);
  }

  isLikeBusy(): boolean {
    if (this.likeBusy !== null) {
      return this.likeBusy;
    }

    return (
      this.interactions
        .isLoadingState()
      || this.interactions
        .isBusy(
          this.rootId,
          'like',
        )
    );
  }

  isBookmarkBusy(): boolean {
    if (
      this.bookmarkBusy !== null
    ) {
      return this.bookmarkBusy;
    }

    return (
      this.interactions
        .isLoadingState()
      || this.interactions
        .isBusy(
          this.rootId,
          'bookmark',
        )
    );
  }

  requestLikeAction(): void {
    if (
      !this.showUserActions
      || this.isLikeBusy()
    ) {
      return;
    }

    /*
     * Library đang tự quản lý API.
     */
    if (this.liked !== null) {
      this.interactionRequested.emit({
        postId: this.post.id,
        action:
          this.isLiked()
            ? 'unlike'
            : 'like',
      });

      return;
    }

    /*
     * Home, Category, Hashtag, Author:
     * PostCard tự gọi API thông qua service dùng chung.
     *
     * Dùng rootId chứ không phải post.id: like luôn được backend
     * lưu vào bài gốc, service dùng chung cũng theo dõi trạng thái
     * theo rootId (xem PostInteractionService.collectAllPostIds –
     * chỉ nhận id bài gốc từ GET /user/posts/likes).
     */
    this.interactions
      .toggleLike(this.rootId)
      .subscribe((change) => {
        this.displayedLikes.update(
          (current) =>
            Math.max(
              0,
              current
              + (
                change.active
                  ? 1
                  : -1
              ),
            ),
        );
      });
  }

  requestBookmarkAction(): void {
    if (
      !this.showUserActions
      || this.isBookmarkBusy()
    ) {
      return;
    }

    if (
      this.bookmarked !== null
    ) {
      this.interactionRequested.emit({
        postId: this.post.id,
        action:
          this.isBookmarked()
            ? 'unbookmark'
            : 'bookmark',
      });

      return;
    }

    this.interactions
      .toggleBookmark(this.rootId)
      .subscribe();
  }
}