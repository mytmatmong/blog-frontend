import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  BlogOwnerOptions,
  BlogOwnerPost,
  UpdateBlogOwnerPostRequest,
} from '../../../../core/models/blog-owner.model';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { CreatePost } from '../create-post/create-post';

@Component({
  selector: 'app-edit-post',
  imports: [
    FormsModule,
    TranslatePipe,
    ConfirmDialog,
  ],

  /*
   * Dùng trực tiếp giao diện và CSS của CreatePost.
   * Không còn hai màn hình khác nhau.
   */
  templateUrl: '../create-post/create-post.html',
  styleUrl: '../create-post/create-post.css',
})
export class EditPost
  extends CreatePost
  implements OnInit {
  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  readonly editingPost =
    signal<BlogOwnerPost | null>(null);

  private readonly existingTranslationLanguageIds =
    signal<number[]>([]);

  private editingPostId: number | null = null;

  override ngOnInit(): void {
    void this.initializeEditPost();
  }

  override isEditMode(): boolean {
    return true;
  }

  override pageTitleKey(): string {
    return 'post_form.edit_title';
  }

  override pageSubtitleKey(): string {
    return 'post_form.edit_subtitle';
  }

  override primaryActionLabelKey(): string {
    return 'post_form.update_btn';
  }

  override secondaryActionLabelKey(): string {
    return 'post_form.update_submit_btn';
  }

  override resultHeadingKey(): string {
    return 'post_form.updated_post';
  }

  /*
   * Sau khi cập nhật vẫn cho phép người dùng
   * tiếp tục chỉnh sửa bài.
   */
  override formLocked(): boolean {
    return this.isSubmitting();
  }

  /*
   * Không cho đổi ngôn ngữ của một Post đã tồn tại.
   * Đổi languageId có thể làm sai quan hệ bản dịch.
   */
  override sourceLanguageLocked(): boolean {
    return true;
  }

  override headerStatusPost(): BlogOwnerPost | null {
    return (
      this.createdPost() ??
      this.editingPost()
    );
  }

  /*
   * Backend chỉ cho bài DRAFT nộp duyệt.
   */
  override showSubmitForReviewAction(): boolean {
    return (
      this.editingPost()?.status === 'DRAFT'
    );
  }

  /*
   * Bản dịch đã tồn tại không thể bị xóa
   * chỉ bằng cách bỏ checkbox.
   */
  override toggleTranslationLanguage(
    languageId: number,
    checked: boolean,
  ): void {
    if (
      !checked &&
      this.existingTranslationLanguageIds()
        .includes(languageId)
    ) {
      this.toast.warning(
        this.tr(
          'post_form.existing_translation_cannot_remove',
        ),
        this.tr('common.invalid'),
      );

      return;
    }

    super.toggleTranslationLanguage(
      languageId,
      checked,
    );
  }

  override async savePost(
    submitForReview: boolean,
  ): Promise<void> {
    if (
      this.isSubmitting() ||
      this.editingPostId === null
    ) {
      return;
    }

    const updateRequest =
      this.buildUpdateRequest();

    if (!updateRequest) {
      return;
    }

    this.isSubmitting.set(true);
    this.translationResults.set([]);

    try {
      /* Không có ảnh mới thì gửi JSON, có ảnh mới thì gửi multipart. */
      const updateResponse =
        await firstValueFrom(
          this.api.updatePost(
            this.editingPostId,
            updateRequest,
          ),
        );

      let updatedPost =
        updateResponse.data;

      /*
       * Chỉ tạo thêm những bản dịch chưa tồn tại.
       */
      const existingLanguageIds =
        new Set(
          this.existingTranslationLanguageIds(),
        );

      const newTargetLanguageIds =
        this
          .selectedTranslationLanguageIds()
          .map(Number)
          .filter(
            (languageId) =>
              Number.isInteger(languageId) &&
              languageId > 0 &&
              languageId !==
              updatedPost.languageId &&
              !existingLanguageIds.has(
                languageId,
              ),
          );

      const translationResults =
        await this.createTranslationDrafts(
          updatedPost.id,
          Array.from(
            new Set(newTargetLanguageIds),
          ),
        );

      this.translationResults.set(
        translationResults,
      );

      const successfulLanguageIds =
        translationResults
          .filter(
            (result) => result.success,
          )
          .map(
            (result) =>
              result.languageId,
          );

      if (
        successfulLanguageIds.length > 0
      ) {
        this.existingTranslationLanguageIds.update(
          (current) =>
            Array.from(
              new Set([
                ...current,
                ...successfulLanguageIds,
              ]),
            ),
        );
      }

      /*
       * Cập nhật xong mới nộp duyệt.
       */
      if (
        submitForReview &&
        updatedPost.status === 'DRAFT'
      ) {
        const submitResponse =
          await firstValueFrom(
            this.api.submitPost(
              updatedPost.id,
            ),
          );

        updatedPost =
          submitResponse.data;
      }

      this.editingPost.set(updatedPost);
      this.createdPost.set(updatedPost);

      this.existingThumbnailUrl.set(
        updatedPost.thumbnailUrl,
      );
      this.thumbnailFile.set(null);
      this.thumbnailPreviewUrl.set(null);

      const failedTranslations =
        translationResults.filter(
          (result) =>
            !result.success,
        ).length;

      if (failedTranslations > 0) {
        this.toast.warning(
          this.tr(
            'post_form.update_partial_success',
          ),
          this.tr(
            'post_form.partial_complete',
          ),
          6000,
        );

        return;
      }

      this.toast.success(
        submitForReview
          ? this.tr(
            'post_form.update_submit_success',
          )
          : this.tr(
            'post_form.update_success',
          ),
        this.tr('common.success'),
        5000,
      );
    } catch (error: unknown) {
      this.toast.error(
        getApiErrorMessage(
          error,
          this.tr(
            'post_form.update_failed',
          ),
        ),
        this.tr('common.error'),
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private buildUpdateRequest():
    | UpdateBlogOwnerPostRequest
    | FormData
    | null {
    const title =
      this.titleModel.trim();

    const content =
      this.editor?.root
        .innerHTML
        .trim() ?? '';

    const plainText =
      this.editor?.getText()
        .trim() ?? '';

    /*
     * Chuyển toàn bộ categoryIds thành number,
     * bỏ ID sai và loại bỏ ID trùng.
     */
    const categoryIds =
      Array.from(
        new Set(
          this
            .selectedCategoryIds()
            .map(
              (categoryId) =>
                Number(categoryId),
            )
            .filter(
              (categoryId) =>
                Number.isInteger(
                  categoryId,
                ) &&
                categoryId > 0,
            ),
        ),
      );

    /*
     * Loại bỏ hashtag trùng, kể cả khác hoa thường.
     */
    const tagMap =
      new Map<string, string>();

    for (
      const rawTag of
      this.parseTagNames()
    ) {
      const tag = String(rawTag)
        .trim()
        .replace(/^#+/, '');

      if (!tag) {
        continue;
      }

      const key =
        tag.toLocaleLowerCase();

      if (!tagMap.has(key)) {
        tagMap.set(key, tag);
      }
    }

    const tagNames =
      Array.from(
        tagMap.values(),
      ).slice(0, 5);

    if (!title) {
      this.toast.error(
        this.tr(
          'post_form.title_required_max',
        ),
        this.tr(
          'post_form.invalid_title',
        ),
      );

      return null;
    }

    if (title.length > 255) {
      this.toast.error(
        this.tr(
          'post_form.title_required_max',
        ),
        this.tr(
          'post_form.invalid_title',
        ),
      );

      return null;
    }

    if (
      !this.editor ||
      !plainText ||
      !content
    ) {
      this.toast.error(
        this.tr(
          'post_form.enter_content',
        ),
        this.tr(
          'post_form.missing_content',
        ),
      );

      return null;
    }

    if (categoryIds.length === 0) {
      this.toast.error(
        this.tr(
          'post_form.require_category',
        ),
        this.tr(
          'post_form.missing_category',
        ),
      );

      return null;
    }

    const request: UpdateBlogOwnerPostRequest = {
      title,
      content,

      /*
       * Đây là number[] thật:
       * [1, 2], không phải ["1", "2"]
       * và không phải chuỗi "[1,2]".
       */
      categoryIds,

      ...(tagNames.length > 0
        ? {
          tagNames,
        }
        : {}),
    };

    const thumbnail =
      this.thumbnailFile();

    if (!thumbnail) {
      return request;
    }

    const formData = new FormData();

    formData.append('title', title);
    formData.append('content', content);
    for (const categoryId of categoryIds) {
      formData.append(
        'categoryIds',
        String(categoryId),
      );
    }

    if (tagNames.length) {
      for (const tagName of tagNames) {
        formData.append(
          'tagNames',
          tagName,
        );
      }
    }

    formData.append('thumbnail', thumbnail);

    return formData;
  }



  override cancelChanges(): void {
    this.cancelConfirmationOpen.set(true);
  }

  override confirmCancelChanges(): void {
    this.cancelConfirmationOpen.set(false);

    void this.router.navigate([
      '/dashboard/owner/posts',
    ]);
  }

  private async initializeEditPost(): Promise<void> {
    /*
     * Hỗ trợ cả:
     *
     * /edit-post?id=12
     * /edit-post/12
     */
    const rawPostId =
      this.route.snapshot.queryParamMap.get(
        'id',
      ) ??
      this.route.snapshot.paramMap.get(
        'id',
      );

    const postId =
      Number(rawPostId);

    if (
      !Number.isInteger(postId) ||
      postId <= 0
    ) {
      this.toast.error(
        this.tr(
          'post_form.invalid_post_id',
        ),
        this.tr('common.error'),
      );

      await this.router.navigate([
        '/dashboard/owner/posts',
      ]);

      return;
    }

    this.editingPostId = postId;
    this.isLoadingOptions.set(true);

    try {
      /*
       * Tải đồng thời options và bài viết.
       */
      const [
        optionsResponse,
        postResponse,
      ] = await Promise.all([
        firstValueFrom(
          this.api.getOptions(),
        ),

        firstValueFrom(
          this.api.getPost(postId),
        ),
      ]);

      const options: BlogOwnerOptions =
        optionsResponse.data;

      const post =
        postResponse.data;

      this.options.set(options);
      this.editingPost.set(post);

      /*
       * Điền sẵn ngôn ngữ.
       */
      this.originalLanguageId.set(
        post.languageId,
      );

      /*
       * Điền sẵn danh mục.
       */
      this.selectedCategoryIds.set(
        this.normalizeCategoryIds(
          this.extractSelectedCategoryIds(
            post,
            options,
          ),
        ),
      );

      /*
       * Điền sẵn các bản dịch đã tồn tại.
       */
      const translationLanguageIds =
        (post.translations ?? [])
          .map(
            (translation) =>
              translation.languageId,
          )
          .filter(
            (languageId) =>
              languageId !==
              post.languageId,
          );

      this.existingTranslationLanguageIds.set(
        Array.from(
          new Set(
            translationLanguageIds,
          ),
        ),
      );

      this.selectedTranslationLanguageIds.set(
        this.existingTranslationLanguageIds(),
      );

      /*
       * Điền tiêu đề.
       */
      this.titleModel =
        post.title;

      /*
       * Điền hashtag.
       */
      this.hashtagsModel =
        (post.tags ?? [])
          .slice(0, 5)
          .map(
            (tag) =>
              `#${tag.name}`,
          )
          .join(' ');

      /*
       * Hiện ảnh bìa hiện tại.
       */
      this.existingThumbnailUrl.set(
        post.thumbnailUrl,
      );

      /*
       * Điền nội dung vào Quill.
       * Nếu Quill chưa render thì CreatePost
       * sẽ giữ nội dung chờ và điền sau.
       */
      this.setEditorContent(
        post.content ?? '',
      );
    } catch (error: unknown) {
      this.toast.error(
        getApiErrorMessage(
          error,
          this.tr(
            'posts.detail_error',
          ),
        ),
        this.tr('common.error'),
      );

      await this.router.navigate([
        '/dashboard/owner/posts',
      ]);
    } finally {
      this.isLoadingOptions.set(false);
    }
  }

  private normalizeCategoryIds(
    value: unknown,
  ): number[] {
    let values: unknown[] = [];

    /*
     * Trường hợp FormData lưu dưới dạng JSON:
     * "[1,2,3]"
     */
    if (typeof value === 'string') {
      try {
        const parsed: unknown =
          JSON.parse(value);

        values = Array.isArray(parsed)
          ? parsed
          : [parsed];
      } catch {
        /*
         * Hỗ trợ dạng "1,2,3".
         */
        values = value
          .split(',')
          .map((item) => item.trim());
      }
    } else if (Array.isArray(value)) {
      values = value;
    } else if (value !== null && value !== undefined) {
      values = [value];
    }

    return Array.from(
      new Set(
        values
          .map((item) => Number(item))
          .filter(
            (id) =>
              Number.isInteger(id) &&
              id > 0,
          ),
      ),
    );
  }
  private extractSelectedCategoryIds(
    post: BlogOwnerPost,
    options: BlogOwnerOptions,
  ): number[] {
    /*
     * API có thể trả danh mục theo nhiều cấu trúc:
     *
     * categories: [{ id, name }]
     *
     * categories: [{
     *   categoryId,
     *   category: { id, name }
     * }]
     *
     * postCategories: [{
     *   categoryId,
     *   category: { id, name }
     * }]
     *
     * categoryIds: [1, 2]
     */
    const payload = post as unknown as {
      categoryIds?: Array<number | string>;

      categories?: Array<{
        id?: number | string;
        categoryId?: number | string;

        name?: string | null;

        category?: {
          id?: number | string;
          name?: string | null;
        } | null;
      }>;

      postCategories?: Array<{
        id?: number | string;
        categoryId?: number | string;

        name?: string | null;

        category?: {
          id?: number | string;
          name?: string | null;
        } | null;
      }>;
    };

    /*
     * Chỉ lấy những danh mục thuộc ngôn ngữ
     * của bài viết đang sửa.
     */
    const availableCategories =
      (options.categories ?? []).filter(
        (category) =>
          Number(category.languageId) ===
          Number(post.languageId),
      );

    const validCategoryIds = new Set(
      availableCategories.map(
        (category) => Number(category.id),
      ),
    );

    const selectedIds = new Set<number>();

    /*
     * Trường hợp backend trả categoryIds trực tiếp.
     */
    for (
      const categoryId of
      payload.categoryIds ?? []
    ) {
      const normalizedId =
        Number(categoryId);

      if (
        Number.isInteger(normalizedId) &&
        validCategoryIds.has(normalizedId)
      ) {
        selectedIds.add(normalizedId);
      }
    }

    const relationItems = [
      ...(payload.categories ?? []),
      ...(payload.postCategories ?? []),
    ];

    /*
     * Ưu tiên:
     *
     * category.id
     * categoryId
     * id
     *
     * Không ưu tiên item.id vì trong nhiều API,
     * đây là ID của bảng liên kết PostCategory.
     */
    for (const item of relationItems) {
      const possibleIds = [
        item.category?.id,
        item.categoryId,
        item.id,
      ];

      for (const possibleId of possibleIds) {
        const normalizedId =
          Number(possibleId);

        if (
          Number.isInteger(normalizedId) &&
          validCategoryIds.has(normalizedId)
        ) {
          selectedIds.add(normalizedId);
          break;
        }
      }
    }

    /*
     * Nếu ID không khớp, thử đối chiếu theo tên.
     * Cách này xử lý được trường hợp backend chỉ
     * trả tên danh mục hoặc trả ID của bảng liên kết.
     */
    if (selectedIds.size === 0) {
      const normalizedPostCategoryNames =
        relationItems
          .map((item) =>
            (
              item.category?.name ??
              item.name ??
              ''
            )
              .trim()
              .toLocaleLowerCase(),
          )
          .filter(
            (name) => name.length > 0,
          );

      const nameSet = new Set(
        normalizedPostCategoryNames,
      );

      for (
        const category of
        availableCategories
      ) {
        const normalizedName =
          category.name
            .trim()
            .toLocaleLowerCase();

        if (nameSet.has(normalizedName)) {
          selectedIds.add(
            Number(category.id),
          );
        }
      }
    }

    return Array.from(selectedIds);
  }
}
