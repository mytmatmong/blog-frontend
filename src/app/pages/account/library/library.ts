import {
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  takeUntilDestroyed,
  toObservable,
} from '@angular/core/rxjs-interop';

import {
  catchError,
  distinctUntilChanged,
  forkJoin,
  Observable,
  of,
  skip,
  switchMap,
} from 'rxjs';

import {
  Pagination,
} from '../../../shared/components/pagination/pagination';

import {
  PostCard,
  PostCardInteractionEvent,
  PostItem,
} from '../../../shared/components/post-card/post-card';

import {
  TranslatePipe,
} from '../../../shared/pipes/translate.pipe';

import {
  PublicPost,
} from '../../../core/models/post.model';

import {
  UserApiService,
} from '../../../core/services/user-api.service';

import {
  TranslationService,
} from '../../../core/services/translation.service';

import {
  ToastService,
} from '../../../core/services/toast.service';

import {
  PostInteractionService,
} from '../../../core/services/post-interaction.service';

import {
  getApiErrorMessage,
} from '../../../core/utils/api-error.util';

type LibraryTab =
  | 'bookmarks'
  | 'likes';

type CollectionType =
  | 'bookmarks'
  | 'likes';

type BusyActionType =
  | 'like'
  | 'bookmark';

@Component({
  selector: 'app-account-library',

  imports: [
    PostCard,
    Pagination,
    TranslatePipe,
  ],

  templateUrl: './library.html',
  styleUrl: './library.css',
})
export class AccountLibrary {
  private readonly userApi =
    inject(UserApiService);

  private readonly ts =
    inject(TranslationService);

  private readonly toast =
    inject(ToastService);

  private readonly postInteractionState =
    inject(PostInteractionService);

  /**
   * Dùng để bỏ qua response cũ khi:
   * - đổi tab quá nhanh
   * - đổi trang quá nhanh
   */
  private loadVersion = 0;

  readonly activeTab =
    signal<LibraryTab>(
      'bookmarks',
    );

  /**
   * Dữ liệu PublicPost gốc từ API.
   *
   * Giữ lại để map lại các trường phụ thuộc ngôn ngữ
   * khi người dùng đổi VI/EN.
   */
  private readonly sourcePosts =
    signal<PublicPost[]>([]);

  readonly posts =
    signal<PostItem[]>([]);

  readonly likedPostIds =
    signal<ReadonlySet<number>>(
      new Set<number>(),
    );

  readonly bookmarkedPostIds =
    signal<ReadonlySet<number>>(
      new Set<number>(),
    );

  readonly busyActions =
    signal<ReadonlySet<string>>(
      new Set<string>(),
    );

  readonly isLoading =
    signal(false);

  readonly errorMessage =
    signal<string | null>(
      null,
    );

  readonly currentPage =
    signal(1);

  readonly totalItems =
    signal(0);

  readonly totalPages =
    signal(1);

  readonly itemsPerPage = 10;

  constructor() {
    this.load();

    /**
     * Khi đổi ngôn ngữ:
     * - đổi định dạng ngày
     * - đổi "phút đọc" / "min read"
     *
     * Không cần gọi lại API.
     */
    toObservable(
      this.ts.currentLang,
    )
      .pipe(
        skip(1),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.remapVisiblePosts();
      });
  }

  selectTab(
    tab: LibraryTab,
  ): void {
    if (
      tab === this.activeTab()
    ) {
      return;
    }

    this.activeTab.set(tab);
    this.currentPage.set(1);

    this.posts.set([]);
    this.sourcePosts.set([]);

    this.errorMessage.set(null);

    this.busyActions.set(
      new Set<string>(),
    );

    this.load();
  }

  isLiked(
    postId: number,
  ): boolean {
    return this.likedPostIds()
      .has(postId);
  }

  isBookmarked(
    postId: number,
  ): boolean {
    return this.bookmarkedPostIds()
      .has(postId);
  }

  isInteractionBusy(
    postId: number,
    type: BusyActionType,
  ): boolean {
    return this.busyActions()
      .has(
        this.getBusyKey(
          postId,
          type,
        ),
      );
  }

  onPageChange(
    page: number,
  ): void {
    if (
      page < 1
      || page > this.totalPages()
      || page === this.currentPage()
    ) {
      return;
    }

    this.currentPage.set(page);
    this.load();

    if (
      typeof window !== 'undefined'
    ) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }

  handleInteraction(
    event: PostCardInteractionEvent,
  ): void {
    const {
      postId,
      action,
    } = event;

    const busyType:
      BusyActionType =
      action === 'like'
        || action === 'unlike'
        ? 'like'
        : 'bookmark';

    if (
      this.isInteractionBusy(
        postId,
        busyType,
      )
    ) {
      return;
    }

    this.setInteractionBusy(
      postId,
      busyType,
      true,
    );

    let request:
      Observable<unknown>;

    switch (action) {
      case 'like':
        request =
          this.userApi.likePost(
            postId,
          );
        break;

      case 'unlike':
        request =
          this.userApi.unlikePost(
            postId,
          );
        break;

      case 'bookmark':
        request =
          this.userApi.bookmarkPost(
            postId,
          );
        break;

      case 'unbookmark':
        request =
          this.userApi.removeBookmark(
            postId,
          );
        break;
    }

    request.subscribe({
      next: () => {
        this.setInteractionBusy(
          postId,
          busyType,
          false,
        );

        this.applyInteractionSuccess(
          postId,
          action,
        );
      },

      error: (
        error: unknown,
      ) => {
        this.setInteractionBusy(
          postId,
          busyType,
          false,
        );

        this.toast.error(
          getApiErrorMessage(error),
          this.getActionErrorTitle(
            action,
          ),
        );
      },
    });
  }

  /**
   * silent = true:
   * Không hiện skeleton khi chỉ đồng bộ danh sách sau thao tác.
   *
   * refreshCrossState = false:
   * Không tải lại toàn bộ danh sách chéo like/bookmark.
   */
  load(
    silent = false,
    refreshCrossState = true,
  ): void {
    const version =
      ++this.loadVersion;

    const tab =
      this.activeTab();

    if (!silent) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
    }

    const listRequest =
      tab === 'bookmarks'
        ? this.userApi
          .getBookmarkedPosts({
            page:
              this.currentPage(),

            limit:
              this.itemsPerPage,
          })
        : this.userApi
          .getLikedPosts({
            page:
              this.currentPage(),

            limit:
              this.itemsPerPage,
          });

    const currentCrossIds =
      tab === 'bookmarks'
        ? new Set(
          this.likedPostIds(),
        )
        : new Set(
          this.bookmarkedPostIds(),
        );

    const crossStateRequest:
      Observable<Set<number>> =
      refreshCrossState
        ? (
          tab === 'bookmarks'
            ? this.collectAllPostIds(
              'likes',
            )
            : this.collectAllPostIds(
              'bookmarks',
            )
        ).pipe(
          /**
           * Danh sách chính vẫn hiển thị được
           * kể cả khi request trạng thái chéo lỗi.
           */
          catchError(() =>
            of(currentCrossIds),
          ),
        )
        : of(currentCrossIds);

    forkJoin({
      pageResponse:
        listRequest,

      crossIds:
        crossStateRequest,
    }).subscribe({
      next: ({
        pageResponse,
        crossIds,
      }) => {
        if (
          version !== this.loadVersion
          || tab !== this.activeTab()
        ) {
          return;
        }

        const data =
          pageResponse.data;

        const visibleIds =
          new Set<number>(
            data.items.map(
              (post) => post.id,
            ),
          );

        /**
         * Lưu dữ liệu gốc để map lại
         * khi thay đổi ngôn ngữ.
         */
        this.sourcePosts.set(
          data.items,
        );

        if (
          tab === 'bookmarks'
        ) {
          /**
           * Mọi bài trong tab bookmark
           * chắc chắn đang được bookmark.
           */
          this.bookmarkedPostIds.set(
            visibleIds,
          );

          /**
           * Trạng thái like lấy từ U18.
           */
          this.likedPostIds.set(
            crossIds,
          );
        } else {
          /**
           * Mọi bài trong tab like
           * chắc chắn đang được like.
           */
          this.likedPostIds.set(
            visibleIds,
          );

          /**
           * Trạng thái bookmark lấy từ U17.
           */
          this.bookmarkedPostIds.set(
            crossIds,
          );
        }

        this.posts.set(
          data.items.map(
            (post) =>
              this.mapPost(post),
          ),
        );

        this.totalItems.set(
          data.meta.totalItems,
        );

        this.totalPages.set(
          Math.max(
            1,
            data.meta.totalPages,
          ),
        );

        this.currentPage.set(
          data.meta.currentPage,
        );

        this.isLoading.set(false);
      },

      error: (
        error: unknown,
      ) => {
        if (
          version !== this.loadVersion
        ) {
          return;
        }

        this.isLoading.set(false);

        if (silent) {
          return;
        }

        this.sourcePosts.set([]);
        this.posts.set([]);

        this.totalItems.set(0);
        this.totalPages.set(1);

        this.errorMessage.set(
          getApiErrorMessage(error),
        );
      },
    });
  }

  private applyInteractionSuccess(
    postId: number,
    action:
      PostCardInteractionEvent['action'],
  ): void {
    switch (action) {
      case 'like':
        /**
         * Đồng bộ với PostCard ở:
         * - Home
         * - Category
         * - Hashtag
         * - Author
         */
        this.postInteractionState
          .applyExternalState(
            'like',
            postId,
            true,
          );

        this.setMembership(
          'likes',
          postId,
          true,
        );

        this.updateLikeCount(
          postId,
          1,
        );

        this.toast.success(
          this.ts.translate('post.liked_success'),
        );
        break;

      case 'unlike':
        this.postInteractionState
          .applyExternalState(
            'like',
            postId,
            false,
          );

        this.setMembership(
          'likes',
          postId,
          false,
        );

        this.updateLikeCount(
          postId,
          -1,
        );

        this.toast.success(
          this.ts.translate('post.unliked_success'),
        );
        break;

      case 'bookmark':
        this.postInteractionState
          .applyExternalState(
            'bookmark',
            postId,
            true,
          );

        this.setMembership(
          'bookmarks',
          postId,
          true,
        );

        this.toast.success(
          this.ts.translate('post.bookmarked_success'),
        );
        break;

      case 'unbookmark':
        this.postInteractionState
          .applyExternalState(
            'bookmark',
            postId,
            false,
          );

        this.setMembership(
          'bookmarks',
          postId,
          false,
        );

        this.toast.success(
          this.ts.translate('post.unbookmarked_success'),
        );
        break;
    }

    /**
     * Chỉ xóa card nếu người dùng bỏ thao tác
     * thuộc chính tab đang xem.
     */
    const shouldRemoveFromCurrentTab =
      (
        this.activeTab() === 'likes'
        && action === 'unlike'
      )
      || (
        this.activeTab() === 'bookmarks'
        && action === 'unbookmark'
      );

    if (
      shouldRemoveFromCurrentTab
    ) {
      this.removePostFromCurrentTab(
        postId,
      );
    }
  }

  private removePostFromCurrentTab(
    postId: number,
  ): void {
    this.posts.update(
      (items) =>
        items.filter(
          (post) =>
            post.id !== postId,
        ),
    );

    this.sourcePosts.update(
      (items) =>
        items.filter(
          (post) =>
            post.id !== postId,
        ),
    );

    const newTotalItems =
      Math.max(
        0,
        this.totalItems() - 1,
      );

    const newTotalPages =
      Math.max(
        1,
        Math.ceil(
          newTotalItems
          / this.itemsPerPage,
        ),
      );

    this.totalItems.set(
      newTotalItems,
    );

    this.totalPages.set(
      newTotalPages,
    );

    /**
     * Nếu vừa xóa item cuối cùng của trang,
     * quay lại trang trước.
     */
    if (
      this.posts().length === 0
      && this.currentPage() > 1
    ) {
      this.currentPage.update(
        (page) => page - 1,
      );
    }

    /**
     * Đồng bộ lại trang hiện tại để kéo item
     * từ trang sau lên lấp vị trí vừa bị xóa.
     */
    this.load(
      true,
      false,
    );
  }

  private updateLikeCount(
    postId: number,
    difference: number,
  ): void {
    this.posts.update(
      (items) =>
        items.map(
          (post) =>
            post.id === postId
              ? {
                ...post,

                likes:
                  Math.max(
                    0,
                    post.likes
                    + difference,
                  ),
              }
              : post,
        ),
    );

    /**
     * Cập nhật luôn dữ liệu gốc,
     * tránh đổi ngôn ngữ xong số like bị trả về giá trị cũ.
     */
    this.sourcePosts.update(
      (items) =>
        items.map(
          (post) =>
            post.id === postId
              ? {
                ...post,

                likeCount:
                  Math.max(
                    0,
                    post.likeCount
                    + difference,
                  ),
              }
              : post,
        ),
    );
  }

  private setMembership(
    collection:
      CollectionType,

    postId: number,

    active: boolean,
  ): void {
    const targetSignal =
      collection === 'likes'
        ? this.likedPostIds
        : this.bookmarkedPostIds;

    targetSignal.update(
      (currentIds) => {
        const nextIds =
          new Set(currentIds);

        if (active) {
          nextIds.add(postId);
        } else {
          nextIds.delete(postId);
        }

        return nextIds;
      },
    );
  }

  private collectAllPostIds(
    collection:
      CollectionType,

    page = 1,

    accumulated =
      new Set<number>(),
  ): Observable<Set<number>> {
    const request =
      collection === 'likes'
        ? this.userApi
          .getLikedPosts({
            page,
            limit: 50,
          })
        : this.userApi
          .getBookmarkedPosts({
            page,
            limit: 50,
          });

    return request.pipe(
      switchMap(({ data }) => {
        for (
          const post of data.items
        ) {
          accumulated.add(
            post.id,
          );
        }

        const totalPages =
          Math.max(
            1,
            data.meta.totalPages,
          );

        if (
          page >= totalPages
        ) {
          return of(
            new Set(accumulated),
          );
        }

        return this.collectAllPostIds(
          collection,
          page + 1,
          accumulated,
        );
      }),
    );
  }

  private setInteractionBusy(
    postId: number,
    type: BusyActionType,
    busy: boolean,
  ): void {
    const key =
      this.getBusyKey(
        postId,
        type,
      );

    this.busyActions.update(
      (currentKeys) => {
        const nextKeys =
          new Set(currentKeys);

        if (busy) {
          nextKeys.add(key);
        } else {
          nextKeys.delete(key);
        }

        return nextKeys;
      },
    );
  }

  private getBusyKey(
    postId: number,
    type: BusyActionType,
  ): string {
    return `${type}:${postId}`;
  }

  private getActionErrorTitle(
    action:
      PostCardInteractionEvent['action'],
  ): string {
    switch (action) {
      case 'like':
        return this.ts.translate('library.like_error_title');

      case 'unlike':
        return this.ts.translate('library.unlike_error_title');

      case 'bookmark':
        return this.ts.translate('library.bookmark_error_title');

      case 'unbookmark':
        return this.ts.translate('library.unbookmark_error_title');
    }
  }

  /**
   * Chạy lại các trường PostCard phụ thuộc ngôn ngữ.
   *
   * Không map lại likes để tránh mất số like
   * vừa thay đổi trên giao diện.
   */
  private remapVisiblePosts(): void {
    const sourcePostMap =
      new Map<number, PublicPost>(
        this.sourcePosts().map(
          (post) => [
            post.id,
            post,
          ],
        ),
      );

    this.posts.update(
      (currentPosts) =>
        currentPosts.map(
          (currentPost) => {
            const sourcePost =
              sourcePostMap.get(
                currentPost.id,
              );

            if (!sourcePost) {
              return currentPost;
            }

            return {
              ...currentPost,

              timeAgo:
                this.formatDate(
                  sourcePost.publishedAt
                  ?? sourcePost.createdAt,
                ),

              readTime:
                this.calculateReadTime(
                  sourcePost.content,
                ),
            };
          },
        ),
    );
  }

  private mapPost(
    post: PublicPost,
  ): PostItem {
    const plainText =
      this.extractText(
        post.content,
      );

    return {
      id:
        post.id,

      authorId:
        post.authorId,

      title:
        post.title,

      excerpt:
        plainText.length > 150
          ? `${plainText
            .slice(0, 150)
            .trimEnd()}…`
          : plainText,

      authorName:
        post.author.username,

      authorAvatar:
        post.author.username
          .charAt(0)
          .toUpperCase()
        || 'A',

      authorAvatarUrl:
        post.author.avatarUrl,

      timeAgo:
        this.formatDate(
          post.publishedAt
          ?? post.createdAt,
        ),

      readTime:
        this.calculateReadTime(
          post.content,
        ),

      categories:
        post.categories.map(
          ({
            id,
            name,
          }) => ({
            id,
            name,
          }),
        ),

      tags:
        post.tags.map(
          ({
            id,
            name,
          }) => ({
            id,
            name,
          }),
        ),

      likes:
        post.likeCount,

      views:
        post.viewCount,

      comments:
        0,

      showCommentCount:
        false,

      thumbnailUrl:
        post.thumbnailUrl,
    };
  }

  private calculateReadTime(
    content: string,
  ): string {
    const plainText =
      this.extractText(content);

    const wordCount =
      plainText
        .split(/\s+/)
        .filter(Boolean)
        .length;

    const wordsPerMinute =
      this.langCode() === 'en'
        ? 200
        : 180;

    const minutes =
      Math.max(
        1,
        Math.ceil(
          wordCount
          / wordsPerMinute,
        ),
      );

    const label =
      this.ts
        .translate(
          'post.read_time',
        )
        .trim();

    /**
     * Hỗ trợ key dạng:
     * "{count} min read"
     */
    if (
      label.includes('{count}')
    ) {
      return label.replace(
        '{count}',
        String(minutes),
      );
    }

    /**
     * Hỗ trợ key hiện tại:
     * VI: "phút đọc"
     * EN: "min read"
     */
    return `${minutes} ${label}`;
  }

  private extractText(
    html: string,
  ): string {
    if (!html) {
      return '';
    }

    if (
      typeof DOMParser
      !== 'undefined'
    ) {
      const document =
        new DOMParser()
          .parseFromString(
            html,
            'text/html',
          );

      document
        .querySelectorAll(
          'script, style, noscript',
        )
        .forEach(
          (element) =>
            element.remove(),
        );

      return (
        document.body.textContent
        ?? ''
      )
        .replace(/\s+/g, ' ')
        .trim();
    }

    return html
      .replace(
        /<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi,
        ' ',
      )
      .replace(
        /<[^>]+>/g,
        ' ',
      )
      .replace(
        /&nbsp;/gi,
        ' ',
      )
      .replace(
        /&amp;/gi,
        '&',
      )
      .replace(
        /\s+/g,
        ' ',
      )
      .trim();
  }

  private formatDate(
    value: string,
  ): string {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return '';
    }

    return date.toLocaleDateString(
      this.ts.localeTag(),
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    );
  }

  private langCode(): string {
    return this.ts
      .currentLang()
      .toLowerCase();
  }
}