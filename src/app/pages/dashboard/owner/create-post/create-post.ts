import {
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import {
  BlogOwnerCategory,
  BlogOwnerLanguage,
  BlogOwnerOptions,
  BlogOwnerPost,
  CreateBlogOwnerPostRequest,
} from '../../../../core/models/blog-owner.model';
import { BlogOwnerApiService } from '../../../../core/services/blog-owner-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';

interface QuillConstructor {
  new(
    container: HTMLElement,
    options: Record<string, unknown>,
  ): QuillEditor;
}

interface QuillEditor {
  root: HTMLElement;

  enable(enabled?: boolean): void;

  getText(): string;
}

export interface TranslationCreationResult {
  languageId: number;
  postId?: number;
  success: boolean;
  message: string;
}

@Component({
  selector: 'app-create-post',
  imports: [
    FormsModule,
    TranslatePipe,
    ConfirmDialog,
  ],
  templateUrl: './create-post.html',
  styleUrl: './create-post.css',
})
export class CreatePost implements OnInit {
  protected readonly api =
    inject(BlogOwnerApiService);

  protected readonly toast =
    inject(ToastService);

  protected readonly translation =
    inject(TranslationService);

  protected readonly router =
    inject(Router);

  readonly options =
    signal<BlogOwnerOptions | null>(null);

  readonly isLoadingOptions =
    signal(true);

  readonly isSubmitting =
    signal(false);

  readonly originalLanguageId =
    signal<number | null>(null);

  readonly selectedTranslationLanguageIds =
    signal<number[]>([]);

  readonly selectedCategoryIds =
    signal<number[]>([]);

  readonly thumbnailFile =
    signal<File | null>(null);

  readonly thumbnailPreviewUrl =
    signal<string | null>(null);

  /**
   * Create: null.
   * Edit: URL ảnh bìa hiện tại.
   */
  readonly existingThumbnailUrl =
    signal<string | null>(null);

  readonly languageDropdownOpen =
    signal(false);

  readonly categoryDropdownOpen =
    signal(false);

  readonly hashtagPickerOpen =
    signal(false);

  readonly createdPost =
    signal<BlogOwnerPost | null>(null);

  readonly cancelConfirmationOpen =
    signal(false);

  readonly translationResults =
    signal<TranslationCreationResult[]>([]);

  titleModel = '';

  /**
   * Ví dụ:
   * #Angular #NestJS #TypeScript
   */
  hashtagsModel = '';

  /**
   * Giá trị đang nhập trong ô thêm hashtag.
   */
  hashtagInputModel = '';

  protected editor:
    QuillEditor | null = null;

  private pendingEditorContent = '';

  constructor() {
    effect(() => {
      this.translation.currentLang();

      const placeholder = this.tr(
        'post_form.editor_placeholder',
      );

      if (this.editor) {
        this.editor.root.setAttribute(
          'data-placeholder',
          placeholder,
        );
      }
    });
  }

  ngOnInit(): void {
    void this.loadOptions();
  }

  @ViewChild('editorContainer')
  set editorContainer(
    element:
      | ElementRef<HTMLElement>
      | undefined,
  ) {
    if (!element || this.editor) {
      return;
    }

    const QuillClass = (
      globalThis as typeof globalThis & {
        Quill?: QuillConstructor;
      }
    ).Quill;

    if (!QuillClass) {
      console.error(
        'Không tìm thấy Quill. Kiểm tra cấu hình Quill trong angular.json hoặc index.html.',
      );

      return;
    }

    this.editor = new QuillClass(
      element.nativeElement,
      {
        theme: 'snow',

        placeholder: this.tr(
          'post_form.editor_placeholder',
        ),

        modules: {
          toolbar: [
            [
              {
                header: [
                  1,
                  2,
                  3,
                  false,
                ],
              },
            ],

            [
              'bold',
              'italic',
              'underline',
              'strike',
            ],

            [
              'blockquote',
              'code-block',
            ],

            [
              {
                list: 'ordered',
              },
              {
                list: 'bullet',
              },
            ],

            [
              {
                color: [],
              },
              {
                background: [],
              },
            ],

            [
              'link',
              'image',
              'video',
            ],

            [
              'clean',
            ],
          ],
        },
      },
    );

    if (this.pendingEditorContent) {
      this.editor.root.innerHTML =
        this.pendingEditorContent;
    }
  }

  /* =======================================================
     CREATE / EDIT SHARED CONFIGURATION
     ======================================================= */

  isEditMode(): boolean {
    return false;
  }

  pageTitleKey(): string {
    return 'post_form.create_title';
  }

  pageSubtitleKey(): string {
    return 'post_form.create_subtitle';
  }

  primaryActionLabelKey(): string {
    return 'post_form.save_draft_btn';
  }

  secondaryActionLabelKey(): string {
    return 'post_form.submit_review_btn';
  }

  resultHeadingKey(): string {
    return 'post_form.created_original';
  }

  /**
   * Lỗi cũ:
   *
   * this.formLocked() !== null
   *
   * làm hàm tự gọi chính nó vô hạn.
   */
  formLocked(): boolean {
    return (
      this.createdPost() !== null ||
      this.isSubmitting()
    );
  }

  sourceLanguageLocked(): boolean {
    return false;
  }

  showSubmitForReviewAction(): boolean {
    return true;
  }

  headerStatusPost():
    BlogOwnerPost | null {
    return this.createdPost();
  }

  cancelChanges(): void {
    /**
     * CreatePost không cần hủy thay đổi.
     * EditPost sẽ override hàm này.
     */
  }

  closeCancelConfirmation(): void {
    if (!this.isSubmitting()) {
      this.cancelConfirmationOpen.set(false);
    }
  }

  confirmCancelChanges(): void {
    this.cancelConfirmationOpen.set(false);
  }

  protected setEditorContent(
    content: string,
  ): void {
    this.pendingEditorContent =
      content ?? '';

    if (this.editor) {
      this.editor.root.innerHTML =
        this.pendingEditorContent;
    }
  }

  /* =======================================================
     DROPDOWN
     ======================================================= */

  @HostListener('document:click')
  closeDropdowns(): void {
    this.languageDropdownOpen.set(false);
    this.categoryDropdownOpen.set(false);
    this.hashtagPickerOpen.set(false);
  }

  keepDropdownOpen(event: Event): void {
    event.stopPropagation();
  }

  toggleLanguageDropdown(
    event: Event,
  ): void {
    event.stopPropagation();

    if (this.formLocked()) {
      return;
    }

    this.languageDropdownOpen.update(
      (open) => !open,
    );

    this.categoryDropdownOpen.set(false);
    this.hashtagPickerOpen.set(false);
  }

  toggleCategoryDropdown(
    event: Event,
  ): void {
    event.stopPropagation();

    if (this.formLocked()) {
      return;
    }

    this.categoryDropdownOpen.update(
      (open) => !open,
    );

    this.languageDropdownOpen.set(false);
    this.hashtagPickerOpen.set(false);
  }

  toggleHashtagPicker(
    event: Event,
  ): void {
    event.stopPropagation();

    if (this.formLocked()) {
      return;
    }

    this.hashtagPickerOpen.update(
      (open) => !open,
    );

    this.languageDropdownOpen.set(false);
    this.categoryDropdownOpen.set(false);
  }

  /* =======================================================
     LANGUAGE
     ======================================================= */

  languages(): BlogOwnerLanguage[] {
    return (
      this.options()?.languages ?? []
    );
  }

  languageDisplayName(
    language:
      | BlogOwnerLanguage
      | null,
  ): string {
    if (!language) {
      return this.tr(
        'post_form.not_selected',
      );
    }

    const code = language.code
      .trim()
      .toLowerCase();

    if (code === 'vi') {
      return this.tr(
        'lang.vietnamese',
      );
    }

    if (code === 'en') {
      return this.tr(
        'lang.english',
      );
    }

    return language.name;
  }

  sourceLanguage():
    BlogOwnerLanguage | null {
    return (
      this.languages().find(
        (language) =>
          language.id ===
          this.originalLanguageId(),
      ) ?? null
    );
  }

  availableTranslationLanguages():
    BlogOwnerLanguage[] {
    const sourceLanguageId =
      this.originalLanguageId();

    return this.languages().filter(
      (language) =>
        language.id !==
        sourceLanguageId,
    );
  }

  selectedTranslationLanguages():
    BlogOwnerLanguage[] {
    const selectedIds =
      new Set(
        this.selectedTranslationLanguageIds(),
      );

    return this
      .availableTranslationLanguages()
      .filter(
        (language) =>
          selectedIds.has(
            language.id,
          ),
      );
  }

  translationLanguage(
    languageId: number,
  ): BlogOwnerLanguage | null {
    return (
      this.languages().find(
        (language) =>
          language.id === languageId,
      ) ?? null
    );
  }

  changeOriginalLanguage(
    languageId: number | null,
  ): void {
    if (
      this.formLocked() ||
      this.sourceLanguageLocked()
    ) {
      return;
    }

    this.originalLanguageId.set(
      languageId,
    );

    /**
     * Danh mục phụ thuộc ngôn ngữ nên
     * phải bỏ lựa chọn cũ.
     */
    this.selectedCategoryIds.set([]);

    /**
     * Không cho ngôn ngữ gốc nằm trong
     * danh sách ngôn ngữ dịch.
     */
    this.selectedTranslationLanguageIds.update(
      (ids) =>
        ids.filter(
          (id) =>
            id !== languageId,
        ),
    );
  }

  isTranslationLanguageSelected(
    languageId: number,
  ): boolean {
    return this
      .selectedTranslationLanguageIds()
      .includes(languageId);
  }

  toggleTranslationLanguage(
    languageId: number,
    checked: boolean,
  ): void {
    if (this.formLocked()) {
      return;
    }

    if (
      languageId ===
      this.originalLanguageId()
    ) {
      this.toast.warning(
        this.tr(
          'post_form.source_cannot_be_target',
        ),
        this.tr(
          'common.invalid',
        ),
      );

      return;
    }

    this.selectedTranslationLanguageIds.update(
      (current) => {
        if (checked) {
          return Array.from(
            new Set([
              ...current,
              languageId,
            ]),
          );
        }

        return current.filter(
          (id) =>
            id !== languageId,
        );
      },
    );
  }

  removeTranslationLanguage(
    languageId: number,
    event: Event,
  ): void {
    event.stopPropagation();

    this.toggleTranslationLanguage(
      languageId,
      false,
    );
  }

  /* =======================================================
     CATEGORY
     ======================================================= */

  categoriesForSourceLanguage():
    BlogOwnerCategory[] {
    const sourceLanguageId =
      this.originalLanguageId();

    return (
      this.options()?.categories ?? []
    ).filter(
      (category) =>
        Number(category.languageId) ===
        Number(sourceLanguageId),
    );
  }

  selectedCategories():
    BlogOwnerCategory[] {
    const selectedIds =
      new Set(
        this.selectedCategoryIds(),
      );

    return this
      .categoriesForSourceLanguage()
      .filter(
        (category) =>
          selectedIds.has(
            category.id,
          ),
      );
  }

  isCategorySelected(
    categoryId: number,
  ): boolean {
    return this
      .selectedCategoryIds()
      .includes(categoryId);
  }

  toggleCategory(
    categoryId: number,
    checked: boolean,
  ): void {
    if (this.formLocked()) {
      return;
    }

    this.selectedCategoryIds.update(
      (current) => {
        if (checked) {
          return Array.from(
            new Set([
              ...current,
              categoryId,
            ]),
          );
        }

        return current.filter(
          (id) =>
            id !== categoryId,
        );
      },
    );
  }

  /* =======================================================
     HASHTAG
     ======================================================= */

  selectedHashtagNames():
    string[] {
    const uniqueHashtags =
      new Map<string, string>();

    const values = String(
      this.hashtagsModel ?? '',
    ).split(/[\s,]+/);

    for (const value of values) {
      const normalized =
        this.normalizeHashtagName(
          value,
        );

      if (!normalized) {
        continue;
      }

      const key =
        normalized.toLocaleLowerCase();

      if (!uniqueHashtags.has(key)) {
        uniqueHashtags.set(
          key,
          normalized,
        );
      }
    }

    return Array.from(
      uniqueHashtags.values(),
    );
  }

  isHashtagSelected(
    value: string,
  ): boolean {
    const hashtag =
      this.normalizeHashtagName(
        value,
      );

    if (!hashtag) {
      return false;
    }

    return this
      .selectedHashtagNames()
      .some(
        (item) =>
          item.toLocaleLowerCase() ===
          hashtag.toLocaleLowerCase(),
      );
  }

  toggleHashtag(
    value: string,
  ): void {
    if (this.formLocked()) {
      return;
    }

    const hashtag =
      this.normalizeHashtagName(
        value,
      );

    if (!hashtag) {
      return;
    }

    const hashtags =
      this.selectedHashtagNames();

    const selectedIndex =
      hashtags.findIndex(
        (item) =>
          item.toLocaleLowerCase() ===
          hashtag.toLocaleLowerCase(),
      );

    if (selectedIndex >= 0) {
      hashtags.splice(
        selectedIndex,
        1,
      );

      this.updateHashtagsModel(
        hashtags,
      );

      return;
    }

    if (hashtags.length >= 5) {
      this.toast.warning(
        this.tr(
          'post_form.max_five_hashtags',
        ),
        this.tr(
          'post_form.too_many_items',
        ),
      );

      return;
    }

    hashtags.push(hashtag);

    this.updateHashtagsModel(
      hashtags,
    );
  }

  removeHashtag(
    value: string,
  ): void {
    if (this.formLocked()) {
      return;
    }

    const hashtag =
      this.normalizeHashtagName(
        value,
      );

    const hashtags =
      this.selectedHashtagNames()
        .filter(
          (item) =>
            item.toLocaleLowerCase() !==
            hashtag.toLocaleLowerCase(),
        );

    this.updateHashtagsModel(
      hashtags,
    );
  }

  normalizeHashtagModel(): void {
    if (this.formLocked()) {
      return;
    }

    const hashtags =
      this.selectedHashtagNames();

    if (hashtags.length > 5) {
      this.toast.warning(
        this.tr(
          'post_form.max_five_hashtags',
        ),
        this.tr(
          'post_form.too_many_items',
        ),
      );
    }

    this.updateHashtagsModel(
      hashtags.slice(0, 5),
    );
  }

  normalizeHashtagName(
    value: string,
  ): string {
    return String(value ?? '')
      .trim()
      .replace(/^#+/, '')
      .replace(
        /[^\p{L}\p{N}_-]/gu,
        '',
      )
      .slice(0, 50);
  }

  tagCount(): number {
    return this
      .selectedHashtagNames()
      .length;
  }

  onHashtagInputKeydown(
    event: KeyboardEvent,
  ): void {
    if (
      event.key !== 'Enter' &&
      event.key !== ','
    ) {
      return;
    }

    event.preventDefault();

    this.addManualHashtags();
  }

  addManualHashtags(): void {
    if (this.formLocked()) {
      return;
    }

    const rawValues =
      this.hashtagInputModel
        .split(/[\s,]+/)
        .map(
          (value) =>
            this.normalizeHashtagName(
              value,
            ),
        )
        .filter(Boolean);

    if (rawValues.length === 0) {
      this.hashtagInputModel = '';
      return;
    }

    const hashtags = [
      ...this.selectedHashtagNames(),
    ];

    let reachedLimit = false;

    for (const value of rawValues) {
      const duplicated =
        hashtags.some(
          (item) =>
            item.toLocaleLowerCase() ===
            value.toLocaleLowerCase(),
        );

      if (duplicated) {
        continue;
      }

      if (hashtags.length >= 5) {
        reachedLimit = true;
        break;
      }

      hashtags.push(value);
    }

    this.updateHashtagsModel(
      hashtags,
    );

    this.hashtagInputModel = '';

    if (reachedLimit) {
      this.toast.warning(
        this.tr(
          'post_form.max_five_hashtags',
        ),
        this.tr(
          'post_form.too_many_items',
        ),
      );
    }
  }

  private updateHashtagsModel(
    hashtags: string[],
  ): void {
    this.hashtagsModel = hashtags
      .slice(0, 5)
      .map(
        (item) =>
          `#${item}`,
      )
      .join(' ');
  }

  /* =======================================================
     FILE
     ======================================================= */

  onThumbnailSelected(
    event: Event,
  ): void {
    if (this.formLocked()) {
      return;
    }

    const input =
      event.target as
      HTMLInputElement;

    const file =
      input.files?.[0] ?? null;

    if (!file) {
      this.thumbnailFile.set(null);
      this.thumbnailPreviewUrl.set(null);
      return;
    }

    if (
      !file.type.startsWith(
        'image/',
      )
    ) {
      this.toast.error(
        this.tr(
          'post_form.thumbnail_must_image',
        ),
        this.tr(
          'post_form.invalid_file',
        ),
      );

      input.value = '';
      return;
    }

    if (
      !this.validateFileSize(file)
    ) {
      input.value = '';
      return;
    }

    this.thumbnailFile.set(file);

    const reader = new FileReader();

    reader.onload = () => {
      if (
        this.thumbnailFile() === file &&
        typeof reader.result === 'string'
      ) {
        this.thumbnailPreviewUrl.set(
          reader.result,
        );
      }
    };

    reader.onerror = () => {
      if (this.thumbnailFile() === file) {
        this.thumbnailPreviewUrl.set(null);
      }
    };

    reader.readAsDataURL(file);
  }

  /* =======================================================
     CREATE POST
     ======================================================= */

  async savePost(
    submitForReview: boolean,
  ): Promise<void> {
    if (this.formLocked()) {
      return;
    }

     this.addManualHashtags();

    const request =
      this.buildCreateRequest(
        submitForReview,
      );

    if (!request) {
      return;
    }

    this.isSubmitting.set(true);
    this.translationResults.set([]);

    try {
      /**
       * Flow mới: FE chỉ gọi MỘT request.
       * Backend tự tạo root + tự dịch + tạo translations
       * rồi đồng bộ cùng trạng thái.
       */
      const createResponse =
        await firstValueFrom(
          this.api.createPost(
            request,
          ),
        );

      const post =
        createResponse.data;

      this.createdPost.set(post);
      this.editor?.enable(false);

      /**
       * Chỉ dùng kết quả backend để hiển thị trạng thái
       * các ngôn ngữ; KHÔNG gọi translate-preview /
       * createTranslation ở frontend nữa.
       */
      const targetLanguageIds =
        Array.from(
          new Set(
            this
              .selectedTranslationLanguageIds()
              .map(Number)
              .filter(
                (languageId) =>
                  Number.isInteger(languageId) &&
                  languageId > 0 &&
                  languageId !==
                    post.languageId,
              ),
          ),
        );

      const translationPostIdByLanguageId =
        new Map<number, number>(
          (post.translations ?? []).map(
            (translation): [number, number] => [
              translation.languageId,
              translation.id,
            ],
          ),
        );

      this.translationResults.set(
        targetLanguageIds.map(
          (languageId) => ({
            languageId,
            postId:
              translationPostIdByLanguageId.get(
                languageId,
              ),
            success: true,
            message: submitForReview
              ? this.tr(
                'post_form.translation_submitted',
              )
              : this.tr(
                'post_form.translation_draft_created',
              ),
          }),
        ),
      );

      this.toast.success(
        submitForReview
          ? this.tr(
            'post_form.group_submitted',
          )
          : this.tr(
            'post_form.group_saved',
          ),
        this.tr(
          'post_form.create_success',
        ),
        5000,
      );
      await this.router.navigate(['/dashboard/owner/posts']);
    } catch (error: unknown) {
      this.toast.error(
        getApiErrorMessage(error),
        this.tr(
          'post_form.create_failed',
        ),
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  statusLabel(
    status:
      BlogOwnerPost['status'],
  ): string {
    const labels: Record<
      BlogOwnerPost['status'],
      string
    > = {
      DRAFT: 'DRAFT',
      PENDING_REVIEW:
        'PENDING_REVIEW',
      PUBLISH: 'PUBLISH',
      REJECT: 'REJECT',
    };

    return labels[status];
  }

  /* =======================================================
     API / REQUEST
     ======================================================= */

  protected async loadOptions():
    Promise<void> {
    this.isLoadingOptions.set(true);

    try {
      const response =
        await firstValueFrom(
          this.api.getOptions(),
        );

      this.options.set(
        response.data,
      );

      const defaultLanguage =
        response.data.languages.find(
          (language) =>
            language.isDefault,
        ) ??
        response.data.languages[0] ??
        null;

      this.originalLanguageId.set(
        defaultLanguage?.id ?? null,
      );
    } catch (error: unknown) {
      this.toast.error(
        getApiErrorMessage(error),
        this.tr(
          'post_form.load_options_failed',
        ),
      );
    } finally {
      this.isLoadingOptions.set(false);
    }
  }

  protected buildCreateRequest(
    submitForReview: boolean,
  ):
    | CreateBlogOwnerPostRequest
    | FormData
    | null {
    const languageId =
      this.originalLanguageId();

    const title =
      this.titleModel.trim();

    const content =
      this.editor?.root
        .innerHTML
        .trim() ?? '';

    const categoryIds =
      this.selectedCategoryIds();

    const tagNames =
      this.parseTagNames();

    const translationLanguageIds =
      Array.from(
        new Set<number>(
          this
            .selectedTranslationLanguageIds()
            .map(Number)
            .filter(
              (targetLanguageId) =>
                Number.isInteger(
                  targetLanguageId,
                ) &&
                targetLanguageId > 0 &&
                targetLanguageId !==
                  languageId,
            ),
        ),
      );

    if (!languageId) {
      this.toast.error(
        this.tr(
          'post_form.select_source_language',
        ),
        this.tr(
          'post_form.missing_data',
        ),
      );

      return null;
    }

    if (
      !title ||
      title.length > 255
    ) {
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
      this.editor
        .getText()
        .trim()
        .length === 0 ||
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

    if (
      categoryIds.length === 0
    ) {
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

    if (tagNames.length > 5) {
      this.toast.error(
        this.tr(
          'post_form.max_five_hashtags',
        ),
        this.tr(
          'post_form.too_many_items',
        ),
      );

      return null;
    }

    if (
      this
        .selectedTranslationLanguageIds()
        .includes(languageId)
    ) {
      this.selectedTranslationLanguageIds.update(
        (ids) =>
          ids.filter(
            (id) =>
              id !== languageId,
          ),
      );

      this.toast.warning(
        this.tr(
          'post_form.source_removed_from_targets',
        ),
        this.tr(
          'post_form.selection_adjusted',
        ),
      );
    }

    const thumbnail =
      this.thumbnailFile();

    if (!thumbnail) {
      return {
        title,
        content,
        languageId,
        categoryIds,

        ...(tagNames.length > 0
          ? {
            tagNames,
          }
          : {}),

        translationLanguageIds,
        submitForReview,
      };
    }

    const formData =
      new FormData();

    formData.append(
      'title',
      title,
    );

    formData.append(
      'content',
      content,
    );

    formData.append(
      'languageId',
      String(languageId),
    );

    for (const categoryId of categoryIds) {
      formData.append(
        'categoryIds',
        String(categoryId),
      );
    }

    for (
      const targetLanguageId of
      translationLanguageIds
    ) {
      formData.append(
        'translationLanguageIds',
        String(targetLanguageId),
      );
    }

    formData.append(
      'submitForReview',
      String(
        submitForReview,
      ),
    );

    if (tagNames.length > 0) {
      for (const tagName of tagNames) {
        formData.append(
          'tagNames',
          tagName,
        );
      }
    }

    formData.append(
      'thumbnail',
      thumbnail,
    );

    return formData;
  }


  protected parseTagNames():
    string[] {
    return this
      .selectedHashtagNames()
      .slice(0, 5);
  }

  protected tr(
    key: string,
  ): string {
    return this.translation.translate(
      key,
    );
  }

  protected validateFileSize(
    file: File,
  ): boolean {
    if (
      file.size <=
      10 * 1024 * 1024
    ) {
      return true;
    }

    this.toast.error(
      `${this.tr(
        'post_form.file_prefix',
      )} “${file.name}” ${this.tr(
        'post_form.exceeds_10mb',
      )}`,
      this.tr(
        'post_form.file_too_large',
      ),
    );

    return false;
  }
}