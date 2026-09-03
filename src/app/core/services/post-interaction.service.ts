import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
    catchError,
    EMPTY,
    finalize,
    forkJoin,
    map,
    Observable,
    of,
    switchMap,
    tap,
} from 'rxjs';

import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { TranslationService } from './translation.service';
import { UserApiService } from './user-api.service';
import { getApiErrorMessage } from '../utils/api-error.util';

export type PostInteractionKind =
    | 'like'
    | 'bookmark';

export interface PostInteractionChange {
    postId: number;
    kind: PostInteractionKind;
    active: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class PostInteractionService {
    private readonly auth =
        inject(AuthService);

    private readonly userApi =
        inject(UserApiService);

    private readonly toast =
        inject(ToastService);

    private readonly ts =
        inject(TranslationService);

    private readonly router =
        inject(Router);

    private activeUserId:
        number | null = null;

    private stateLoaded = false;
    private stateLoading = false;

    private readonly likeOverrides =
        new Map<number, boolean>();

    private readonly bookmarkOverrides =
        new Map<number, boolean>();

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

    readonly isLoadingState =
        signal(false);

    ensureLoaded(force = false): void {
        const userId =
            this.auth.currentUser()?.id
            ?? null;

        if (userId === null) {
            this.resetForUser(null);
            return;
        }

        if (this.activeUserId !== userId) {
            this.resetForUser(userId);
        }

        if (
            !force
            && (
                this.stateLoaded
                || this.stateLoading
            )
        ) {
            return;
        }

        this.stateLoading = true;
        this.isLoadingState.set(true);

        forkJoin({
            likedIds:
                this.collectAllPostIds(
                    'like',
                ).pipe(
                    catchError(() =>
                        of(new Set<number>()),
                    ),
                ),

            bookmarkedIds:
                this.collectAllPostIds(
                    'bookmark',
                ).pipe(
                    catchError(() =>
                        of(new Set<number>()),
                    ),
                ),
        }).subscribe({
            next: ({
                likedIds,
                bookmarkedIds,
            }) => {
                /*
                 * Người dùng có thể đã đăng xuất hoặc đổi tài khoản
                 * trong khi request đang chạy.
                 */
                if (
                    this.auth.currentUser()?.id
                    !== userId
                    || this.activeUserId
                    !== userId
                ) {
                    return;
                }

                this.applyOverrides(
                    likedIds,
                    this.likeOverrides,
                );

                this.applyOverrides(
                    bookmarkedIds,
                    this.bookmarkOverrides,
                );

                this.likedPostIds.set(
                    likedIds,
                );

                this.bookmarkedPostIds.set(
                    bookmarkedIds,
                );

                this.stateLoaded = true;
                this.stateLoading = false;
                this.isLoadingState.set(false);
            },

            error: () => {
                if (
                    this.activeUserId
                    !== userId
                ) {
                    return;
                }

                this.stateLoading = false;
                this.isLoadingState.set(false);
            },
        });
    }

    isLiked(postId: number): boolean {
        if (
            this.auth.currentRole()
            === 'guest'
        ) {
            return false;
        }

        return this.likedPostIds()
            .has(postId);
    }

    isBookmarked(
        postId: number,
    ): boolean {
        if (
            this.auth.currentRole()
            === 'guest'
        ) {
            return false;
        }

        return this.bookmarkedPostIds()
            .has(postId);
    }

    isBusy(
        postId: number,
        kind: PostInteractionKind,
    ): boolean {
        return this.busyActions().has(
            this.getBusyKey(
                postId,
                kind,
            ),
        );
    }

    toggleLike(
        postId: number,
    ): Observable<PostInteractionChange> {
        if (!this.requireAuthentication()) {
            return EMPTY;
        }

        this.ensureLoaded();

        if (
            this.isLoadingState()
            || this.isBusy(postId, 'like')
        ) {
            return EMPTY;
        }

        const wasLiked =
            this.isLiked(postId);

        this.setBusy(
            postId,
            'like',
            true,
        );

        const request: Observable<unknown> =
            wasLiked
                ? this.userApi
                    .unlikePost(postId)
                : this.userApi
                    .likePost(postId);

        return request.pipe(
            tap(() => {
                this.applyExternalState(
                    'like',
                    postId,
                    !wasLiked,
                );

                this.toast.success(
                    wasLiked
                        ? this.ts.translate('post.unliked_success')
                        : this.ts.translate('post.liked_success'),
                );
            }),

            map(() => ({
                postId,
                kind: 'like' as const,
                active: !wasLiked,
            })),

            catchError(
                (error: unknown) => {
                    this.toast.error(
                        getApiErrorMessage(error),
                        this.ts.translate('post.like_error'),
                    );

                    return EMPTY;
                },
            ),

            finalize(() => {
                this.setBusy(
                    postId,
                    'like',
                    false,
                );
            }),
        );
    }

    toggleBookmark(
        postId: number,
    ): Observable<PostInteractionChange> {
        if (!this.requireAuthentication()) {
            return EMPTY;
        }

        this.ensureLoaded();

        if (
            this.isLoadingState()
            || this.isBusy(
                postId,
                'bookmark',
            )
        ) {
            return EMPTY;
        }

        const wasBookmarked =
            this.isBookmarked(postId);

        this.setBusy(
            postId,
            'bookmark',
            true,
        );

        const request: Observable<unknown> =
            wasBookmarked
                ? this.userApi
                    .removeBookmark(postId)
                : this.userApi
                    .bookmarkPost(postId);

        return request.pipe(
            tap(() => {
                this.applyExternalState(
                    'bookmark',
                    postId,
                    !wasBookmarked,
                );

                this.toast.success(
                    wasBookmarked
                        ? this.ts.translate('post.unbookmarked_success')
                        : this.ts.translate('post.bookmarked_success'),
                );
            }),

            map(() => ({
                postId,
                kind: 'bookmark' as const,
                active: !wasBookmarked,
            })),

            catchError(
                (error: unknown) => {
                    this.toast.error(
                        getApiErrorMessage(error),
                        this.ts.translate('post.bookmark_error'),
                    );

                    return EMPTY;
                },
            ),

            finalize(() => {
                this.setBusy(
                    postId,
                    'bookmark',
                    false,
                );
            }),
        );
    }

    /**
     * Library đang tự gọi API nên sau khi API thành công
     * phải đồng bộ lại store dùng chung tại đây.
     */
    applyExternalState(
        kind: PostInteractionKind,
        postId: number,
        active: boolean,
    ): void {
        if (kind === 'like') {
            this.likeOverrides.set(
                postId,
                active,
            );

            this.updateMembership(
                this.likedPostIds,
                postId,
                active,
            );

            return;
        }

        this.bookmarkOverrides.set(
            postId,
            active,
        );

        this.updateMembership(
            this.bookmarkedPostIds,
            postId,
            active,
        );
    }

    private collectAllPostIds(
        kind: PostInteractionKind,
        page = 1,
        accumulated =
            new Set<number>(),
    ): Observable<Set<number>> {
        const request =
            kind === 'like'
                ? this.userApi.getLikedPosts({
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
                for (const post of data.items) {
                    accumulated.add(post.id);
                }

                const totalPages =
                    Math.max(
                        1,
                        data.meta.totalPages,
                    );

                if (page >= totalPages) {
                    return of(
                        new Set(accumulated),
                    );
                }

                return this.collectAllPostIds(
                    kind,
                    page + 1,
                    accumulated,
                );
            }),
        );
    }

    private updateMembership(
        target:
            typeof this.likedPostIds,
        postId: number,
        active: boolean,
    ): void {
        target.update(
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

    private applyOverrides(
        target: Set<number>,
        overrides:
            ReadonlyMap<number, boolean>,
    ): void {
        for (
            const [
                postId,
                active,
            ] of overrides
        ) {
            if (active) {
                target.add(postId);
            } else {
                target.delete(postId);
            }
        }
    }

    private setBusy(
        postId: number,
        kind: PostInteractionKind,
        busy: boolean,
    ): void {
        const key =
            this.getBusyKey(
                postId,
                kind,
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
        kind: PostInteractionKind,
    ): string {
        return `${kind}:${postId}`;
    }

    private requireAuthentication():
        boolean {
        if (
            this.auth.currentRole()
            !== 'guest'
        ) {
            return true;
        }

        this.toast.warning(
            this.ts.translate('auth.login_required_toast'),
        );

        this.router.navigate(
            ['/auth'],
            {
                queryParams: {
                    redirect:
                        this.router.url,
                },
            },
        );

        return false;
    }

    private resetForUser(
        userId: number | null,
    ): void {
        this.activeUserId = userId;
        this.stateLoaded = false;
        this.stateLoading = false;

        this.likeOverrides.clear();
        this.bookmarkOverrides.clear();

        this.likedPostIds.set(
            new Set<number>(),
        );

        this.bookmarkedPostIds.set(
            new Set<number>(),
        );

        this.busyActions.set(
            new Set<string>(),
        );

        this.isLoadingState.set(false);
    }
}