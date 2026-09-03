import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    HostListener,
    inject,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    signal,
    SimpleChanges,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
    BlogOwnerLanguage,
    BlogOwnerPost,
} from '../../../core/models/blog-owner.model';
import { BlogOwnerApiService } from '../../../core/services/blog-owner-api.service';
import { TranslationService } from '../../../core/services/translation.service';
import { getApiErrorMessage } from '../../../core/utils/api-error.util';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface OwnerPostPreviewVersion {
    id: number;
    title: string;
    status: BlogOwnerPost['status'];
    languageId: number;

    language?: Pick<
        BlogOwnerLanguage,
        'id' | 'code' | 'name' | 'flag'
    >;
}

import { Router } from '@angular/router';
import { BadgeComponent, BadgeColor } from '../badge/badge';
import { IconButtonComponent } from '../icon-button/icon-button';

@Component({
    selector: 'app-owner-post-preview',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        TranslatePipe,
        BadgeComponent,
        IconButtonComponent,
    ],
    templateUrl: './owner-post-preview.html',
    styleUrl: './owner-post-preview.css',
})
export class OwnerPostPreviewComponent
    implements OnChanges, OnDestroy {
    private readonly api = inject(BlogOwnerApiService);
    private readonly ts = inject(TranslationService);
    private readonly router = inject(Router);

    /**
     * Có thể truyền dữ liệu tóm tắt lấy từ danh sách.
     * Component sẽ tự gọi API chi tiết.
     */
    @Input() post: BlogOwnerPost | null = null;

    @Input() postId: number | null = null;

    @Input() showEdit = true;

    /** Disable the owner-only detail request when another role supplies it. */
    @Input() loadDetails = true;
    /**
     * Khi component được dùng bởi Moderator,
     * parent sẽ tự gọi Moderator API.
     *
     * Giá trị này dùng để disable tab + hiện spinner.
     */
    @Input() externalLoadingPostId: number | null = null;
    @Input() showModerationActions = false;

    @Input() moderationBusy = false;

    @Input() editRoute:
        | string
        | readonly unknown[] =
        '/dashboard/owner/edit-post';

    @Output() closed = new EventEmitter<void>();

    @Output() approveRequested = new EventEmitter<BlogOwnerPost>();

    @Output() rejectRequested = new EventEmitter<BlogOwnerPost>();
    /**
     * Dùng cho role khác Blog Owner.
     *
     * Ví dụ Moderator:
     * click EN
     * → emit EN postId
     * → ManageBlogs gọi Moderator API.
     */
    @Output() languageRequested = new EventEmitter<number>();

    readonly activePost =
        signal<BlogOwnerPost | null>(null);

    readonly rootPostId =
        signal<number | null>(null);

    readonly languageVersions =
        signal<OwnerPostPreviewVersion[]>([]);

    readonly loadingPostId =
        signal<number | null>(null);

    readonly loadError =
        signal<string | null>(null);

    private requestId = 0;

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['post'] && !changes['postId']) {
            return;
        }

        if (this.post) {
            /*
             * Hiện ngay dữ liệu tóm tắt để modal không bị trễ,
             * sau đó gọi API lấy dữ liệu chi tiết.
             */
            this.activePost.set(this.post);
            this.rootPostId.set(
                this.post.parentPostId ??
                this.post.id,
            );

            this.languageVersions.set(
                this.mergeLanguageVersions([], this.post),
            );

            if (this.loadDetails) {
                this.loadPost(this.post.id);
            } else {
                this.loadingPostId.set(null);
                this.loadError.set(null);
            }
            return;
        }

        if (this.postId) {
            this.loadPost(this.postId);
            return;
        }

        this.resetPreview();
    }

    ngOnDestroy(): void {
        this.requestId += 1;
    }

    @HostListener('document:keydown.escape')
    closeOnEscape(): void {
        if (this.activePost()) {
            this.close();
        }
    }

    close(): void {
        this.requestId += 1;
        this.resetPreview();
        this.closed.emit();
    }

    switchLanguage(postId: number): void {
    const activePostId =
        this.activePost()?.id;

    if (
        postId === activePostId ||
        this.loadingPostId() !== null ||
        this.externalLoadingPostId !== null
    ) {
        return;
    }

    /**
     * Blog Owner:
     * component tự gọi BlogOwner API như trước.
     */
    if (this.loadDetails) {
        this.loadPost(postId);
        return;
    }

    /**
     * Moderator:
     * không được gọi BlogOwner API.
     *
     * Chỉ emit ID ra parent.
     */
    this.languageRequested.emit(postId);
    }

    isLanguageLoading(postId: number): boolean {
  return (
    this.loadingPostId() === postId ||
    this.externalLoadingPostId === postId
  );
}

    isLanguageSwitchBusy(): boolean {
    return (
        this.loadingPostId() !== null ||
        this.externalLoadingPostId !== null
    );
    }
    badgeColor(
        status: BlogOwnerPost['status'],
    ): BadgeColor {
        const normalized = String(status).toUpperCase();

        if (
            normalized === 'PUBLISHED' ||
            normalized === 'APPROVED' ||
            normalized === 'PUBLISH'
        ) {
            return 'green';
        }

        if (
            normalized === 'PENDING' ||
            normalized === 'PENDING_REVIEW' ||
            normalized === 'WAITING_APPROVAL'
        ) {
            return 'yellow';
        }

        if (
            normalized === 'REJECTED' ||
            normalized === 'REJECT'
        ) {
            return 'red';
        }

        return 'gray';
    }

    statusClass(
        status: BlogOwnerPost['status'],
    ): string {
        const normalized = String(status).toUpperCase();

        if (
            normalized === 'PUBLISHED' ||
            normalized === 'APPROVED' ||
            normalized === 'PUBLISH'
        ) {
            return 'post-preview-status--published';
        }

        if (
            normalized === 'PENDING' ||
            normalized === 'PENDING_REVIEW' ||
            normalized === 'WAITING_APPROVAL'
        ) {
            return 'post-preview-status--pending';
        }

        if (
            normalized === 'REJECTED' ||
            normalized === 'REJECT'
        ) {
            return 'post-preview-status--rejected';
        }

        if (normalized === 'ARCHIVED') {
            return 'post-preview-status--archived';
        }

        return 'post-preview-status--draft';
    }

    statusLabel(
        status: BlogOwnerPost['status'],
    ): string {
        const normalized = String(status).toUpperCase();

        const statusMap: Record<
            string,
            {
                key: string;
                fallbackKey?: string;
                fallbackVi: string;
                fallbackEn: string;
            }
        > = {
            DRAFT: {
                key: 'posts.status.draft',
                fallbackKey: 'post_status.draft',
                fallbackVi: 'Bản nháp',
                fallbackEn: 'Draft',
            },
            PENDING: {
                key: 'posts.status.pending',
                fallbackKey: 'post_status.pending_review',
                fallbackVi: 'Chờ duyệt',
                fallbackEn: 'Pending review',
            },
            PENDING_REVIEW: {
                key: 'posts.status.pending',
                fallbackKey: 'post_status.pending_review',
                fallbackVi: 'Chờ duyệt',
                fallbackEn: 'Pending review',
            },
            WAITING_APPROVAL: {
                key: 'posts.status.pending',
                fallbackKey: 'post_status.pending_review',
                fallbackVi: 'Chờ duyệt',
                fallbackEn: 'Pending review',
            },
            PUBLISHED: {
                key: 'posts.status.published',
                fallbackKey: 'post_status.publish',
                fallbackVi: 'Đã xuất bản',
                fallbackEn: 'Published',
            },
            PUBLISH: {
                key: 'posts.status.published',
                fallbackKey: 'post_status.publish',
                fallbackVi: 'Đã xuất bản',
                fallbackEn: 'Published',
            },
            APPROVED: {
                key: 'posts.status.published',
                fallbackKey: 'post_status.publish',
                fallbackVi: 'Đã xuất bản',
                fallbackEn: 'Published',
            },
            REJECTED: {
                key: 'posts.status.rejected',
                fallbackKey: 'post_status.reject',
                fallbackVi: 'Bị từ chối',
                fallbackEn: 'Rejected',
            },
            REJECT: {
                key: 'posts.status.rejected',
                fallbackKey: 'post_status.reject',
                fallbackVi: 'Bị từ chối',
                fallbackEn: 'Rejected',
            },
            ARCHIVED: {
                key: 'posts.status.archived',
                fallbackVi: 'Đã lưu trữ',
                fallbackEn: 'Archived',
            },
        };

        const config = statusMap[normalized];

        if (!config) {
            return String(status);
        }

        const translated = this.ts.translate(config.key);

        if (translated !== config.key) {
            return translated;
        }

        if (config.fallbackKey) {
            const fallbackTranslated = this.ts.translate(config.fallbackKey);
            if (fallbackTranslated !== config.fallbackKey) {
                return fallbackTranslated;
            }
        }

        return this.ts.currentLang() === 'EN' ? config.fallbackEn : config.fallbackVi;
    }

    categoryNames(post: BlogOwnerPost): string {
        const payload = post as unknown as {
            categories?: Array<{
                name?: string | null;

                category?: {
                    name?: string | null;
                } | null;
            }>;

            postCategories?: Array<{
                name?: string | null;

                category?: {
                    name?: string | null;
                } | null;
            }>;

            category?: {
                name?: string | null;
            } | null;
        };

        let categoryItems =
            payload.categories ?? [];

        if (
            categoryItems.length === 0 &&
            payload.postCategories
        ) {
            categoryItems = payload.postCategories;
        }

        if (
            categoryItems.length === 0 &&
            payload.category
        ) {
            categoryItems = [payload.category];
        }

        const names = categoryItems
            .map((item) => {
                return (
                    item.name ??
                    item.category?.name ??
                    ''
                ).trim();
            })
            .filter(
                (name): name is string =>
                    name.length > 0,
            );

        return [...new Set(names)].join(', ') || '—';
    }

    canEdit(post: BlogOwnerPost): boolean {
        if (!this.showEdit) {
            return false;
        }

        const normalized =
            String(post.status).toUpperCase();

        /*
         * Không sửa trong lúc bài đang chờ duyệt.
         */
        return ![
            'PENDING',
            'PENDING_REVIEW',
            'WAITING_APPROVAL',
        ].includes(normalized);
    }

    isPendingModeration(post: BlogOwnerPost | null): boolean {
        if (!post) return false;
        const normalized = String(post.status).toUpperCase();
        return (
            normalized === 'PENDING_REVIEW' ||
            normalized === 'PENDING' ||
            normalized === 'WAITING_APPROVAL'
        );
    }

    onEditPost(post: BlogOwnerPost): void {
        const targetId = this.rootPostId() ?? post.id;
        this.close();
        if (Array.isArray(this.editRoute)) {
            this.router.navigate([...this.editRoute, targetId]);
        } else {
            this.router.navigate([this.editRoute, targetId]);
        }
    }

    editQueryParams(postId: number): {
        id: number;
    } {
        return { id: postId };
    }

    languageCode(
        version: OwnerPostPreviewVersion,
    ): string {
        return (
            version.language?.code ||
            String(version.languageId)
        ).toUpperCase();
    }

    private loadPost(postId: number): void {
        const currentRequestId =
            ++this.requestId;

        this.loadingPostId.set(postId);
        this.loadError.set(null);

        this.api.getPost(postId).subscribe({
            next: (response) => {
                if (
                    currentRequestId !== this.requestId
                ) {
                    return;
                }

                const detailedPost = response.data;

                this.rootPostId.set(
                    detailedPost.parentPostId ??
                    this.rootPostId() ??
                    detailedPost.id,
                );

                this.activePost.set(detailedPost);

                this.languageVersions.update(
                    (currentVersions) =>
                        this.mergeLanguageVersions(
                            currentVersions,
                            detailedPost,
                        ),
                );

                this.loadingPostId.set(null);
            },

            error: (error: unknown) => {
                if (
                    currentRequestId !== this.requestId
                ) {
                    return;
                }

                this.loadingPostId.set(null);

                this.loadError.set(
                    getApiErrorMessage(
                        error,
                        this.translateWithFallback(
                            'posts.translation_load_error',
                            'Không tải được phiên bản bài viết đã chọn.',
                        ),
                    ),
                );
            },
        });
    }

    private mergeLanguageVersions(
        currentVersions: OwnerPostPreviewVersion[],
        post: BlogOwnerPost,
    ): OwnerPostPreviewVersion[] {
        const versionMap =
            new Map<number, OwnerPostPreviewVersion>();

        for (const version of currentVersions) {
            versionMap.set(version.id, version);
        }

        versionMap.set(post.id, {
            id: post.id,
            title: post.title,
            status: post.status,
            languageId: post.languageId,
            language: post.language,
        });

        for (
            const translation of post.translations ?? []
        ) {
            versionMap.set(translation.id, {
                id: translation.id,
                title: translation.title,
                status: translation.status,
                languageId: translation.languageId,
                language: translation.language,
            });
        }

        return Array.from(versionMap.values()).sort(
            (first, second) => {
                if (first.id === post.id) {
                    return -1;
                }

                if (second.id === post.id) {
                    return 1;
                }

                return this.languageCode(first).localeCompare(
                    this.languageCode(second),
                );
            },
        );
    }

    private resetPreview(): void {
        this.activePost.set(null);
        this.rootPostId.set(null);
        this.languageVersions.set([]);
        this.loadingPostId.set(null);
        this.loadError.set(null);
    }

    private translateWithFallback(
        key: string,
        fallback: string,
    ): string {
        const translated = this.ts.translate(key);

        return translated === key
            ? fallback
            : translated;
    }
}