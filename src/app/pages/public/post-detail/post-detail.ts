import {
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
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

import { PublicSidebarRight } from '../../../shared/components/public-sidebar-right/public-sidebar-right';
import {
  CommentActionTarget,
  CommentItem,
} from '../../../shared/components/comment-item/comment-item';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PublicApiService } from '../../../core/services/public-api.service';
import { TranslationService } from '../../../core/services/translation.service';
import { UserApiService } from '../../../core/services/user-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import {
  PublicComment,
  PublicPost,
  SortOrder,
} from '../../../core/models/post.model';
import {
  PaginatedUserPosts,
  ReportReason,
} from '../../../core/models/user-api.model';
import { ApiResponse } from '../../../core/models/auth.model';

type PostErrorKey =
  | 'post.invalid_id'
  | 'post.not_found'
  | 'post.load_error'
  | 'common.backend_unreachable';

type CommentsErrorKey =
  | 'comments.load_error'
  | 'common.backend_unreachable';

interface LoadPostOptions {
  preserveContent?: boolean;
}

interface ReportTarget {
  type: 'POST' | 'COMMENT';
  id: number;
  label: string;
}

@Component({
  selector: 'app-post-detail',
  imports: [
    FormsModule,
    RouterLink,
    PublicSidebarRight,
    CommentItem,
    Pagination,
    TranslatePipe,
    NgClass,
  ],
  templateUrl: './post-detail.html',
  styleUrl: './post-detail.css',
})
export class PostDetail {
  @ViewChild('commentTextarea')
  private commentTextarea?: ElementRef<HTMLTextAreaElement>;

  private readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  private readonly publicApi = inject(PublicApiService);
  private readonly userApi = inject(UserApiService);
  private readonly translationService = inject(TranslationService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  private routePostId: number | null = null;
  private commentsPostId: number | null = null;
  private postRequestVersion = 0;
  private commentsRequestVersion = 0;

  readonly post = signal<PublicPost | null>(null);
  readonly comments = signal<PublicComment[]>([]);
  readonly isLoading = signal(false);
  readonly isRefreshingLanguage = signal(false);
  readonly isLoadingComments = signal(false);
  readonly commentsSortOrder = signal<SortOrder>('desc');
  readonly commentsTotalItems = signal(0);
  readonly commentsTotalPages = signal(1);
  readonly commentsCurrentPage = signal(1);
  readonly commentsPerPage = 10;

  readonly isAuthenticated = computed(() => this.auth.currentRole() !== 'guest');
  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? null);
  readonly isLiked = signal(false);
  readonly isBookmarked = signal(false);
  readonly isLoadingInteractions = signal(false);
  readonly isLikeBusy = signal(false);
  readonly isBookmarkBusy = signal(false);

  readonly replyTo = signal<CommentActionTarget | null>(null);
  readonly editingComment = signal<CommentActionTarget | null>(null);
  readonly isSavingComment = signal(false);
  commentDraft = '';

  readonly reportTarget = signal<ReportTarget | null>(null);
  readonly isSubmittingReport = signal(false);
  reportReason: ReportReason = 'SPAM';
  reportDescription = '';
  readonly reportReasons: ReportReason[] = [
    'SPAM',
    'HARASSMENT',
    'INAPPROPRIATE',
    'COPYRIGHT',
    'MISINFORMATION',
    'OTHER',
  ];

  private readonly postErrorKey = signal<PostErrorKey | null>(null);
  private readonly commentsErrorKey = signal<CommentsErrorKey | null>(null);

  readonly errorMessage = computed(() => {
    const key = this.postErrorKey();
    return key ? this.translationService.translate(key) : null;
  });

  readonly commentsErrorMessage = computed(() => {
    const key = this.commentsErrorKey();
    return key ? this.translationService.translate(key) : null;
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const id = Number(params.get('id'));

        if (!Number.isInteger(id) || id <= 0) {
          this.postRequestVersion++;
          this.commentsRequestVersion++;
          this.routePostId = null;
          this.commentsPostId = null;
          this.post.set(null);
          this.clearComments();
          this.isLoading.set(false);
          this.isRefreshingLanguage.set(false);
          this.postErrorKey.set('post.invalid_id');
          return;
        }

        this.routePostId = id;
        this.commentsCurrentPage.set(1);
        this.loadPost();
      });

    toObservable(this.translationService.currentLang)
      .pipe(skip(1), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        if (this.routePostId === null) return;
        this.commentsCurrentPage.set(1);
        this.loadPost({ preserveContent: true });
      });
  }

  loadPost(options: LoadPostOptions = {}): void {
    const routePostId = this.routePostId;
    if (routePostId === null) return;

    const preserveContent = options.preserveContent === true && this.post() !== null;
    const requestVersion = ++this.postRequestVersion;
    this.commentsRequestVersion++;
    const previousCommentsPostId = this.commentsPostId;

    this.postErrorKey.set(null);
    this.commentsErrorKey.set(null);

    if (preserveContent) {
      this.isRefreshingLanguage.set(true);
    } else {
      this.isLoading.set(true);
      this.isRefreshingLanguage.set(false);
      this.post.set(null);
      this.commentsPostId = null;
      this.clearComments();
    }

    this.publicApi
      .getPostById(routePostId, this.currentLanguageCode())
      .subscribe({
        next: ({ data }) => {
          if (requestVersion !== this.postRequestVersion) return;

          this.post.set(data);
          this.commentsPostId = data.id;
          this.isLoading.set(false);
          this.isRefreshingLanguage.set(false);

          if (previousCommentsPostId !== data.id) this.clearComments();

          this.loadComments();
          this.loadInteractionState(data.id);
        },
        error: (error: unknown) => {
          if (requestVersion !== this.postRequestVersion) return;
          this.isLoading.set(false);
          this.isRefreshingLanguage.set(false);

          if (!preserveContent) {
            this.post.set(null);
            this.commentsPostId = null;
            this.clearComments();
          }

          this.postErrorKey.set(this.resolvePostErrorKey(error));
        },
      });
  }

  loadComments(): void {
    const postId = this.commentsPostId;
    if (postId === null) return;

    const requestVersion = ++this.commentsRequestVersion;
    this.isLoadingComments.set(true);
    this.commentsErrorKey.set(null);

    this.publicApi.getPostComments(postId, {
      page: this.commentsCurrentPage(),
      limit: this.commentsPerPage,
      sortBy: 'createdAt',
      sortOrder: this.commentsSortOrder(),
    }).subscribe({
      next: ({ data }) => {
        if (requestVersion !== this.commentsRequestVersion) return;
        this.comments.set(data.items);
        this.commentsTotalItems.set(data.meta.totalItems);
        this.commentsTotalPages.set(Math.max(1, data.meta.totalPages));
        this.commentsCurrentPage.set(data.meta.currentPage);
        this.isLoadingComments.set(false);
      },
      error: (error: unknown) => {
        if (requestVersion !== this.commentsRequestVersion) return;
        this.clearComments();
        this.isLoadingComments.set(false);
        this.commentsErrorKey.set(this.resolveCommentsErrorKey(error));
      },
    });
  }

  retryPost(): void {
    this.loadPost({ preserveContent: this.post() !== null });
  }

  onCommentsPageChange(page: number): void {
    if (!Number.isInteger(page) || page < 1 || page > this.commentsTotalPages() || page === this.commentsCurrentPage()) return;
    this.commentsCurrentPage.set(page);
    this.loadComments();
    if (typeof window !== 'undefined') {
      document.getElementById('post-comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onCommentsSortChange(value: string): void {
    if ((value !== 'asc' && value !== 'desc') || value === this.commentsSortOrder()) return;
    this.commentsSortOrder.set(value);
    this.commentsCurrentPage.set(1);
    this.loadComments();
  }

  toggleLike(): void {
    const currentPost = this.post();
    if (!currentPost || !this.requireAuthentication() || this.isLikeBusy()) return;

    this.isLikeBusy.set(true);
    const wasLiked = this.isLiked();
    const request: Observable<unknown> = wasLiked
      ? this.userApi.unlikePost(currentPost.id)
      : this.userApi.likePost(currentPost.id);

    request.subscribe({
      next: () => {
        this.isLiked.set(!wasLiked);
        this.post.update((post) => post ? {
          ...post,
          likeCount: Math.max(0, post.likeCount + (wasLiked ? -1 : 1)),
        } : post);
        this.isLikeBusy.set(false);
        this.toast.success(this.translationService.translate(wasLiked ? 'post.unliked_success' : 'post.liked_success'));
      },
      error: (error: unknown) => {
        this.isLikeBusy.set(false);
        this.toast.error(getApiErrorMessage(error), this.translationService.translate('post.like_error'));
      },
    });
  }

  toggleBookmark(): void {
    const currentPost = this.post();
    if (!currentPost || !this.requireAuthentication() || this.isBookmarkBusy()) return;

    this.isBookmarkBusy.set(true);
    const wasBookmarked = this.isBookmarked();
    const request: Observable<unknown> = wasBookmarked
      ? this.userApi.removeBookmark(currentPost.id)
      : this.userApi.bookmarkPost(currentPost.id);

    request.subscribe({
      next: () => {
        this.isBookmarked.set(!wasBookmarked);
        this.isBookmarkBusy.set(false);
        this.toast.success(this.translationService.translate(wasBookmarked ? 'post.unbookmarked_success' : 'post.bookmarked_success'));
      },
      error: (error: unknown) => {
        this.isBookmarkBusy.set(false);
        this.toast.error(getApiErrorMessage(error), this.translationService.translate('post.bookmark_error'));
      },
    });
  }

  beginReply(target: CommentActionTarget): void {
    if (!this.requireAuthentication()) return;
    this.editingComment.set(null);
    this.replyTo.set(target);
    this.commentDraft = `@${target.username} `;
    this.scheduleCommentTextareaResize();
  }

  beginEdit(target: CommentActionTarget): void {
    this.replyTo.set(null);
    this.editingComment.set(target);
    this.commentDraft = target.content;
    this.scheduleCommentTextareaResize();
  }

  cancelCommentMode(): void {
    this.replyTo.set(null);
    this.editingComment.set(null);
    this.commentDraft = '';
    this.scheduleCommentTextareaResize();
  }

  autoGrowCommentTextarea(event?: Event): void {
    const eventTarget = event?.target;
    const textarea =
      eventTarget instanceof HTMLTextAreaElement
        ? eventTarget
        : this.commentTextarea?.nativeElement;

    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 112)}px`;
  }

  private scheduleCommentTextareaResize(): void {
    if (typeof requestAnimationFrame === 'undefined') return;

    requestAnimationFrame(() => {
      this.autoGrowCommentTextarea();
    });
  }

  submitComment(event: Event): void {
    event.preventDefault();
    const postId = this.commentsPostId;
    if (postId === null || !this.requireAuthentication() || this.isSavingComment()) return;

    const content = this.commentDraft.trim();
    if (!content) {
      this.toast.warning(this.translationService.translate('comments.empty_warning'));
      return;
    }

    if (content.length > 1000) {
      this.toast.warning(this.translationService.translate('comments.max_length_warning'));
      return;
    }

    this.isSavingComment.set(true);
    const editing = this.editingComment();
    const request = editing
      ? this.userApi.updateComment(editing.id, { content })
      : this.userApi.createComment(postId, {
          content,
          parentId: this.replyTo()?.id ?? null,
        });

    request.subscribe({
      next: () => {
        this.isSavingComment.set(false);
        this.cancelCommentMode();
        this.commentsCurrentPage.set(1);
        this.loadComments();
        this.toast.success(this.translationService.translate(editing ? 'comments.edit_success' : 'comments.submit_success'));
      },
      error: (error: unknown) => {
        this.isSavingComment.set(false);
        this.toast.error(getApiErrorMessage(error), this.translationService.translate(editing ? 'comments.edit_error' : 'comments.submit_error'));
      },
    });
  }

  deleteComment(target: CommentActionTarget): void {
    if (typeof window !== 'undefined' && !window.confirm(this.translationService.translate('comments.delete_confirm'))) return;

    this.userApi.deleteComment(target.id).subscribe({
      next: () => {
        this.loadComments();
        this.toast.success(this.translationService.translate('comments.delete_success'));
      },
      error: (error: unknown) => this.toast.error(getApiErrorMessage(error), this.translationService.translate('comments.delete_error')),
    });
  }

  openPostReport(): void {
    const currentPost = this.post();
    if (!currentPost || !this.requireAuthentication()) return;
    this.openReport({ type: 'POST', id: currentPost.id, label: currentPost.title });
  }

  openCommentReport(target: CommentActionTarget): void {
    if (!this.requireAuthentication()) return;
    this.openReport({ type: 'COMMENT', id: target.id, label: target.content });
  }

  closeReport(): void {
    this.reportTarget.set(null);
    this.reportReason = 'SPAM';
    this.reportDescription = '';
  }

  submitReport(event: Event): void {
    event.preventDefault();
    const target = this.reportTarget();
    if (!target || this.isSubmittingReport()) return;

    const description = this.reportDescription.trim();
    if (description.length > 1000) {
      this.toast.warning(this.translationService.translate('report.max_length_warning'));
      return;
    }

    this.isSubmittingReport.set(true);
    const body = {
      reason: this.reportReason,
      ...(description ? { description } : {}),
    };
    const request = target.type === 'POST'
      ? this.userApi.reportPost(target.id, body)
      : this.userApi.reportComment(target.id, body);

    request.subscribe({
      next: () => {
        this.isSubmittingReport.set(false);
        this.closeReport();
        this.toast.success(this.translationService.translate('report.submit_success'));
      },
      error: (error: unknown) => {
        this.isSubmittingReport.set(false);
        this.toast.error(getApiErrorMessage(error), this.translationService.translate('report.submit_error'));
      },
    });
  }

  getAvatarInitial(name?: string | null): string {
    return name?.trim().charAt(0).toUpperCase() || 'A';
  }

  formatDate(value?: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleDateString(this.translationService.localeTag(), {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
  }

  private loadInteractionState(postId: number): void {
    if (!this.isAuthenticated()) {
      this.isLiked.set(false);
      this.isBookmarked.set(false);
      return;
    }

    this.isLoadingInteractions.set(true);

    forkJoin({
      liked: this.collectionContainsPost(
        (page) => this.userApi.getLikedPosts({ page, limit: 50 }),
        postId,
      ).pipe(catchError(() => of(false))),
      bookmarked: this.collectionContainsPost(
        (page) => this.userApi.getBookmarkedPosts({ page, limit: 50 }),
        postId,
      ).pipe(catchError(() => of(false))),
    }).subscribe(({ liked, bookmarked }) => {
      this.isLiked.set(liked);
      this.isBookmarked.set(bookmarked);
      this.isLoadingInteractions.set(false);
    });
  }

  private collectionContainsPost(
    loader: (page: number) => Observable<ApiResponse<PaginatedUserPosts>>,
    postId: number,
    page = 1,
  ): Observable<boolean> {
    return loader(page).pipe(
      switchMap((response: ApiResponse<PaginatedUserPosts>) => {
        const data = response.data;
        if (data.items.some((item) => item.id === postId)) return of(true);
        if (page >= data.meta.totalPages) return of(false);
        return this.collectionContainsPost(loader, postId, page + 1);
      }),
    );
  }

  private openReport(target: ReportTarget): void {
    this.reportTarget.set(target);
    this.reportReason = 'SPAM';
    this.reportDescription = '';
  }

  private requireAuthentication(): boolean {
    if (this.isAuthenticated()) return true;

    this.toast.warning(this.translationService.translate('auth.login_required_toast'));
    this.router.navigate(['/auth'], {
      queryParams: { redirect: this.router.url },
    });
    return false;
  }

  private clearComments(): void {
    this.comments.set([]);
    this.commentsTotalItems.set(0);
    this.commentsTotalPages.set(1);
  }

  private currentLanguageCode(): string {
    return this.translationService.currentLang().toLowerCase();
  }

  private resolvePostErrorKey(error: unknown): PostErrorKey {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'common.backend_unreachable';
      if (error.status === 404) return 'post.not_found';
    }
    return 'post.load_error';
  }

  private resolveCommentsErrorKey(error: unknown): CommentsErrorKey {
    if (error instanceof HttpErrorResponse && error.status === 0) return 'common.backend_unreachable';
    return 'comments.load_error';
  }
}
