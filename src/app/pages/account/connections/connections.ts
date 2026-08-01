import {
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  forkJoin,
  Observable,
  of,
  switchMap,
} from 'rxjs';

import {
  UserSummary,
} from '../../../core/models/auth.model';
import {
  UserApiService,
} from '../../../core/services/user-api.service';
import {
  ToastService,
} from '../../../core/services/toast.service';
import {
  TranslationService,
} from '../../../core/services/translation.service';
import {
  getApiErrorMessage,
} from '../../../core/utils/api-error.util';

import {
  Pagination,
} from '../../../shared/components/pagination/pagination';
import {
  TranslatePipe,
} from '../../../shared/pipes/translate.pipe';

type ConnectionsTab =
  | 'followers'
  | 'following';

interface SelectedUserStats {
  followers: number;
  following: number;
}

@Component({
  selector: 'app-account-connections',
  imports: [
    Pagination,
    TranslatePipe,
  ],
  templateUrl: './connections.html',
  styleUrl: './connections.css',
})
export class AccountConnections {
  private readonly userApi =
    inject(UserApiService);

  private readonly toast =
    inject(ToastService);

  private readonly ts =
    inject(TranslationService);

  private loadVersion = 0;

  readonly activeTab =
    signal<ConnectionsTab>(
      'followers',
    );

  readonly users =
    signal<UserSummary[]>([]);

  readonly followerIds =
    signal<ReadonlySet<number>>(
      new Set<number>(),
    );

  readonly followingIds =
    signal<ReadonlySet<number>>(
      new Set<number>(),
    );

  readonly busyUserIds =
    signal<ReadonlySet<number>>(
      new Set<number>(),
    );

  readonly selectedUser =
    signal<UserSummary | null>(
      null,
    );

  readonly selectedUserStats =
    signal<SelectedUserStats | null>(
      null,
    );

  readonly isLoadingSelectedUser =
    signal(false);

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
    this.loadRelationships();
    this.load();
  }

  selectTab(
    tab: ConnectionsTab,
  ): void {
    if (
      tab === this.activeTab()
    ) {
      return;
    }

    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.errorMessage.set(null);

    this.load();
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
  }

  load(
    silent = false,
  ): void {
    const version =
      ++this.loadVersion;

    const tab =
      this.activeTab();

    if (!silent) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
    }

    const request =
      tab === 'followers'
        ? this.userApi
          .getMyFollowers({
            page:
              this.currentPage(),
            limit:
              this.itemsPerPage,
          })
        : this.userApi
          .getMyFollowing({
            page:
              this.currentPage(),
            limit:
              this.itemsPerPage,
          });

    request.subscribe({
      next: ({ data }) => {
        if (
          version !== this.loadVersion
          || tab !== this.activeTab()
        ) {
          return;
        }

        this.users.set(
          data.items,
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

        /*
         * Đồng bộ ngay các ID đang hiển thị.
         * Không cần chờ request tải toàn bộ quan hệ.
         */
        if (tab === 'followers') {
          this.addVisibleIds(
            this.followerIds,
            data.items,
          );
        } else {
          this.addVisibleIds(
            this.followingIds,
            data.items,
          );
        }

        this.isLoading.set(false);
      },

      error: (error: unknown) => {
        if (
          version !== this.loadVersion
        ) {
          return;
        }

        this.isLoading.set(false);

        if (silent) {
          return;
        }

        this.users.set([]);
        this.totalItems.set(0);
        this.totalPages.set(1);

        this.errorMessage.set(
          getApiErrorMessage(error),
        );
      },
    });
  }

  openUser(
    user: UserSummary,
  ): void {
    this.selectedUser.set(user);
    this.selectedUserStats.set(null);
    this.isLoadingSelectedUser.set(true);

    /*
     * U13 và U14:
     * lấy meta.totalItems để biết số follower/following.
     */
    forkJoin({
      followers:
        this.userApi
          .getUserFollowers(
            user.id,
            {
              page: 1,
              limit: 1,
            },
          ),

      following:
        this.userApi
          .getUserFollowing(
            user.id,
            {
              page: 1,
              limit: 1,
            },
          ),
    }).subscribe({
      next: ({
        followers,
        following,
      }) => {
        /*
         * Người dùng có thể đã đóng modal
         * hoặc mở người khác trước khi API trả về.
         */
        if (
          this.selectedUser()?.id
          !== user.id
        ) {
          return;
        }

        this.selectedUserStats.set({
          followers:
            followers.data.meta
              .totalItems,

          following:
            following.data.meta
              .totalItems,
        });

        this.isLoadingSelectedUser
          .set(false);
      },

      error: () => {
        if (
          this.selectedUser()?.id
          !== user.id
        ) {
          return;
        }

        /*
         * Vẫn hiển thị thông tin cơ bản nếu
         * không lấy được số follower/following.
         */
        this.isLoadingSelectedUser
          .set(false);
      },
    });
  }

  closeUser(): void {
    this.selectedUser.set(null);
    this.selectedUserStats.set(null);
    this.isLoadingSelectedUser.set(false);
  }

  isFollower(
    userId: number,
  ): boolean {
    return this.followerIds()
      .has(userId);
  }

  isFollowing(
    userId: number,
  ): boolean {
    return this.followingIds()
      .has(userId);
  }

  isUserBusy(
    userId: number,
  ): boolean {
    return this.busyUserIds()
      .has(userId);
  }

  toggleFollow(
    user: UserSummary,
    event?: Event,
  ): void {
    /*
     * Khi bấm nút trên card thì không mở modal.
     */
    event?.stopPropagation();

    if (
      this.isUserBusy(user.id)
    ) {
      return;
    }

    const wasFollowing =
      this.isFollowing(user.id);

    this.setUserBusy(
      user.id,
      true,
    );

    const request: Observable<unknown> =
      wasFollowing
        ? this.userApi
          .unfollowUser(user.id)
        : this.userApi
          .followUser(user.id);

    request.subscribe({
      next: () => {
        this.setUserBusy(
          user.id,
          false,
        );

        this.setFollowingState(
          user.id,
          !wasFollowing,
        );

        if (wasFollowing) {
          this.toast.success(
            this.ts.translate('author.unfollowed_success'),
          );
        } else {
          this.toast.success(
            this.ts.translate('author.followed_success'),
          );
        }

        /*
         * Đang ở tab Following và vừa unfollow:
         * người đó phải biến mất khỏi danh sách.
         */
        if (
          wasFollowing
          && this.activeTab()
          === 'following'
        ) {
          this.removeFromFollowingTab(
            user.id,
          );
        }
      },

      error: (error: unknown) => {
        this.setUserBusy(
          user.id,
          false,
        );

        this.toast.error(
          getApiErrorMessage(error),
          this.ts.translate('author.follow_error'),
        );
      },
    });
  }

  avatarInitial(
    name: string,
  ): string {
    return (
      name
        .trim()
        .charAt(0)
        .toUpperCase()
      || 'U'
    );
  }

  private loadRelationships(): void {
    forkJoin({
      followers:
        this.collectAllUserIds(
          'followers',
        ),

      following:
        this.collectAllUserIds(
          'following',
        ),
    }).subscribe({
      next: ({
        followers,
        following,
      }) => {
        this.followerIds.set(
          followers,
        );

        this.followingIds.set(
          following,
        );
      },

      error: () => {
        /*
         * Danh sách trang hiện tại vẫn hoạt động.
         * Không cần hiện lỗi riêng.
         */
      },
    });
  }

  private collectAllUserIds(
    type: ConnectionsTab,
    page = 1,
    accumulated =
      new Set<number>(),
  ): Observable<Set<number>> {
    const request =
      type === 'followers'
        ? this.userApi
          .getMyFollowers({
            page,
            limit: 50,
          })
        : this.userApi
          .getMyFollowing({
            page,
            limit: 50,
          });

    return request.pipe(
      switchMap(({ data }) => {
        for (
          const user of data.items
        ) {
          accumulated.add(
            user.id,
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
          return of(accumulated);
        }

        return this.collectAllUserIds(
          type,
          page + 1,
          accumulated,
        );
      }),
    );
  }

  private addVisibleIds(
    target:
      typeof this.followerIds,
    users: UserSummary[],
  ): void {
    target.update(
      (currentIds) => {
        const nextIds =
          new Set(currentIds);

        for (
          const user of users
        ) {
          nextIds.add(user.id);
        }

        return nextIds;
      },
    );
  }

  private setFollowingState(
    userId: number,
    following: boolean,
  ): void {
    this.followingIds.update(
      (currentIds) => {
        const nextIds =
          new Set(currentIds);

        if (following) {
          nextIds.add(userId);
        } else {
          nextIds.delete(userId);
        }

        return nextIds;
      },
    );
  }

  private setUserBusy(
    userId: number,
    busy: boolean,
  ): void {
    this.busyUserIds.update(
      (currentIds) => {
        const nextIds =
          new Set(currentIds);

        if (busy) {
          nextIds.add(userId);
        } else {
          nextIds.delete(userId);
        }

        return nextIds;
      },
    );
  }

  private removeFromFollowingTab(
    userId: number,
  ): void {
    this.users.update(
      (users) =>
        users.filter(
          (user) =>
            user.id !== userId,
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

    if (
      this.currentPage()
      > newTotalPages
    ) {
      this.currentPage.set(
        newTotalPages,
      );
    }

    /*
     * Lấy item từ trang sau lên lấp vị trí vừa xóa.
     */
    this.load(true);
  }
}