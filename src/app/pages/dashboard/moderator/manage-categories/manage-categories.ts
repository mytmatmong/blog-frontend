import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  LanguageOption,
  TranslationService,
} from '../../../../core/services/translation.service';

import { ModeratorApiService } from '../../../../core/services/moderator-api.service';
import { ToastService } from '../../../../core/services/toast.service';

import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button';
import { TextButtonComponent } from '../../../../shared/components/text-button/text-button';
import { TextSearchComponent } from '../../../../shared/components/text-search/text-search';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

import {
  ModeratorCategoryGroup,
  ModeratorCategoryTranslationRequest,
  ModeratorPaginationMeta,
} from '../../../../core/models/moderator-api.model';

interface CategoryTranslationForm {
  languageId: number | null;
  name: string;
}

@Component({
  selector: 'app-manage-categories',
  imports: [
    FormsModule,
    TranslatePipe,
    IconButtonComponent,
    TextButtonComponent,
    TextSearchComponent,
  ],
  templateUrl: './manage-categories.html',
  styleUrl: './manage-categories.css',
})
export class ManageCategories implements OnInit {
  protected readonly ts =
    inject(TranslationService);

  private readonly moderatorApiService =
    inject(ModeratorApiService);

  private readonly toast =
    inject(ToastService);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  // =========================
  // LIST
  // =========================

  readonly loading = signal(true);

  readonly error =
    signal<string | null>(null);

  readonly categories =
    signal<ModeratorCategoryGroup[]>([]);

  readonly meta =
    signal<ModeratorPaginationMeta | null>(
      null,
    );

  readonly currentPage = signal(1);

  readonly limit = 8;

  searchQuery = '';

  readonly pageItems = computed(() => {
    const total =
      this.meta()?.totalPages ?? 1;

    const current =
      this.currentPage();

    if (total <= 5) {
      return Array.from(
        { length: total },
        (_, i) => ({
          type: 'page' as const,
          value: i + 1,
        }),
      );
    }

    let start =
      Math.max(1, current - 2);

    let end = start + 4;

    if (end > total) {
      end = total;

      start =
        Math.max(1, end - 4);
    }

    const items: Array<{
      type: 'page' | 'ellipsis';
      value: number | null;
    }> = [];

    if (start > 1) {
      items.push({
        type: 'ellipsis',
        value: null,
      });
    }

    for (
      let page = start;
      page <= end;
      page++
    ) {
      items.push({
        type: 'page',
        value: page,
      });
    }

    if (end < total) {
      items.push({
        type: 'ellipsis',
        value: null,
      });
    }

    return items;
  });

  // =========================
  // CREATE
  // =========================

  readonly isAddModalOpen =
    signal(false);

  readonly actionLoading =
    signal(false);

  newCode = '';

  newTranslations:
    CategoryTranslationForm[] = [];

  // Auto translation - CREATE
  newSourceLanguageId:
    number | null = null;

  newTargetLanguageIds:
    number[] = [];

  readonly newTranslationLoading =
    signal(false);

  readonly newTranslationError =
    signal<string | null>(null);

  // =========================
  // EDIT
  // =========================

  readonly activeEditCategory =
    signal<ModeratorCategoryGroup | null>(
      null,
    );

  editCode = '';

  editTranslations:
    CategoryTranslationForm[] = [];

  // Auto translation - EDIT
  editSourceLanguageId:
    number | null = null;

  editTargetLanguageIds:
    number[] = [];

  readonly editTranslationLoading =
    signal(false);

  readonly editTranslationError =
    signal<string | null>(null);

  // =========================
  // INIT
  // =========================

  ngOnInit(): void {
    this.ts.loadLanguages();

    /**
     * Ví dụ:
     * /manage-categories?page=2
     */
    const pageParam =
      Number(
        this.route.snapshot.queryParamMap.get(
          'page',
        ),
      );

    if (
      Number.isInteger(pageParam) &&
      pageParam > 0
    ) {
      this.currentPage.set(
        pageParam,
      );
    }

    /**
     * Ví dụ:
     * ?page=2&search=node
     */
    this.searchQuery =
      this.route.snapshot.queryParamMap.get(
        'search',
      ) ?? '';

    this.loadCategories();
  }

  // =========================
  // LANGUAGES
  // =========================

  get languages(): LanguageOption[] {
    return this.ts.languages();
  }

  get newTargetLanguages():
    LanguageOption[] {
    return this.languages.filter(
      (language) =>
        language.id !==
        this.newSourceLanguageId,
    );
  }

  get editTargetLanguages():
    LanguageOption[] {
    return this.languages.filter(
      (language) =>
        language.id !==
        this.editSourceLanguageId,
    );
  }

  /**
   * Tên nguồn ở CREATE được liên kết
   * trực tiếp với row source trong
   * newTranslations.
   */
  get newSourceName(): string {
    if (
      this.newSourceLanguageId == null
    ) {
      return '';
    }

    return (
      this.newTranslations.find(
        (row) =>
          row.languageId ===
          this.newSourceLanguageId,
      )?.name ?? ''
    );
  }

  set newSourceName(
    value: string,
  ) {
    this.setTranslationName(
      this.newTranslations,
      this.newSourceLanguageId,
      value,
    );
  }

  /**
   * Tên nguồn ở EDIT cũng dùng chính
   * editTranslations làm nguồn dữ liệu.
   */
  get editSourceName(): string {
    if (
      this.editSourceLanguageId == null
    ) {
      return '';
    }

    return (
      this.editTranslations.find(
        (row) =>
          row.languageId ===
          this.editSourceLanguageId,
      )?.name ?? ''
    );
  }

  set editSourceName(
    value: string,
  ) {
    this.setTranslationName(
      this.editTranslations,
      this.editSourceLanguageId,
      value,
    );
  }

  // =========================
  // LIST
  // =========================

  loadCategories(): void {
    this.loading.set(true);

    this.error.set(null);

    this.moderatorApiService
      .getModeratorCategoryGroups({
        search:
          this.searchQuery,
        page:
          this.currentPage(),
        limit:
          this.limit,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);

          if (
            res.success &&
            res.data
          ) {
            this.categories.set(
              res.data.items,
            );

            this.meta.set(
              res.data.meta,
            );

            return;
          }

          this.error.set(
            this.ts.translate(
              'manage_categories.load_list_error',
            ),
          );
        },

        error: (err) => {
          this.loading.set(false);

          const message =
            this.getErrorMessage(
              err,
              this.ts.translate(
                'manage_categories.load_list_error',
              ),
            );

          this.error.set(
            message,
          );

          this.toast.show(
            'error',
            this.ts.translate(
              'common.error',
            ),
            message,
          );
        },
      });
  }

  onSearch(): void {
    this.currentPage.set(1);

    this.router.navigate([], {
      relativeTo:
        this.route,

      queryParams: {
        page: 1,
        search:
          this.searchQuery.trim() ||
          null,
      },

      queryParamsHandling:
        'merge',
    });

    this.loadCategories();
  }

  clearSearch(): void {
    this.searchQuery = '';

    this.currentPage.set(1);

    this.router.navigate([], {
      relativeTo:
        this.route,

      queryParams: {
        page: 1,
        search: null,
      },

      queryParamsHandling:
        'merge',
    });

    this.loadCategories();
  }

  setPage(page: number): void {
    const totalPages =
      this.meta()?.totalPages ?? 1;

    if (
      page < 1 ||
      page > totalPages ||
      page === this.currentPage()
    ) {
      return;
    }

    this.currentPage.set(
      page,
    );

    this.router.navigate([], {
      relativeTo:
        this.route,

      queryParams: {
        page,
      },

      queryParamsHandling:
        'merge',
    });

    this.loadCategories();
  }

  // =========================
  // CREATE
  // =========================

  openAddCategoryModal(): void {
    this.newCode = '';

    const defaultLanguage =
      this.languages.find(
        (language) =>
          language.isDefault,
      ) ??
      this.languages[0];

    this.newSourceLanguageId =
      defaultLanguage?.id ?? null;

    this.newTargetLanguageIds = [];

    this.newTranslationError.set(
      null,
    );

    this.newTranslations =
      this.newSourceLanguageId != null
        ? [
            {
              languageId:
                this.newSourceLanguageId,
              name: '',
            },
          ]
        : [];

    this.isAddModalOpen.set(
      true,
    );
  }

  closeAddCategoryModal(): void {
    if (
      this.actionLoading() ||
      this.newTranslationLoading()
    ) {
      return;
    }

    this.isAddModalOpen.set(
      false,
    );

    this.resetNewTranslationState();
  }

  onNewSourceLanguageChange(): void {
    this.newTargetLanguageIds =
      this.newTargetLanguageIds.filter(
        (id) =>
          id !==
          this.newSourceLanguageId,
      );

    /**
     * Create là category mới nên khi
     * đổi ngôn ngữ nguồn sẽ reset
     * preview cũ để tránh lưu nhầm.
     */
    this.newTranslations =
      this.newSourceLanguageId != null
        ? [
            {
              languageId:
                this.newSourceLanguageId,
              name: '',
            },
          ]
        : [];

    this.newTranslationError.set(
      null,
    );
  }

  isNewTargetSelected(
    languageId: number,
  ): boolean {
    return (
      this.newTargetLanguageIds.includes(
        languageId,
      )
    );
  }

  toggleNewTargetLanguage(
    languageId: number,
    checked: boolean,
  ): void {
    if (
      languageId ===
      this.newSourceLanguageId
    ) {
      return;
    }

    if (checked) {
      if (
        !this.newTargetLanguageIds.includes(
          languageId,
        )
      ) {
        this.newTargetLanguageIds = [
          ...this.newTargetLanguageIds,
          languageId,
        ];
      }

      return;
    }

    this.newTargetLanguageIds =
      this.newTargetLanguageIds.filter(
        (id) =>
          id !== languageId,
      );
  }

  translateNewCategoryPreview(): void {
    this.newTranslationError.set(
      null,
    );

    const sourceLanguageId =
      this.newSourceLanguageId;

    const sourceName =
      this.newSourceName.trim();

    if (
      sourceLanguageId == null
    ) {
      this.showTranslationWarning(
        'Vui lòng chọn ngôn ngữ nguồn.',
      );

      return;
    }

    if (!sourceName) {
      this.showTranslationWarning(
        'Vui lòng nhập tên danh mục nguồn.',
      );

      return;
    }

    if (
      this.newTargetLanguageIds.length ===
      0
    ) {
      this.showTranslationWarning(
        'Vui lòng chọn ít nhất một ngôn ngữ đích.',
      );

      return;
    }

    this.newTranslationLoading.set(
      true,
    );

    this.moderatorApiService
      .translateModeratorCategoryPreview(
        {
          sourceLanguageId,
          sourceName,
          targetLanguageIds:
            this.newTargetLanguageIds,
        },
      )
      .subscribe({
        next: (res) => {
          this.newTranslationLoading.set(
            false,
          );

          if (
            !res.success ||
            !res.data
          ) {
            const message =
              'Không thể dịch tên danh mục.';

            this.newTranslationError.set(
              message,
            );

            return;
          }

          /**
           * Preview create thay thế kết quả cũ
           * bằng đúng source + các target
           * vừa được chọn.
           */
          this.newTranslations = [
            {
              languageId:
                res.data.source
                  .languageId,
              name:
                res.data.source.name,
            },

            ...res.data.translations.map(
              (translation) => ({
                languageId:
                  translation.languageId,
                name:
                  translation.name,
              }),
            ),
          ];

          this.toast.show(
            'success',
            this.ts.translate(
              'common.success',
            ),
            'Đã dịch tự động tên danh mục. Bạn có thể chỉnh sửa trước khi lưu.',
          );
        },

        error: (err) => {
          this.newTranslationLoading.set(
            false,
          );

          const message =
            this.getErrorMessage(
              err,
              'Không thể dịch tên danh mục.',
            );

          this.newTranslationError.set(
            message,
          );

          this.toast.show(
            'error',
            this.ts.translate(
              'common.error',
            ),
            message,
          );
        },
      });
  }

  addNewTranslationRow(): void {
    this.newTranslations.push({
      languageId:
        this.getFirstUnusedLanguageId(
          this.newTranslations,
        ),
      name: '',
    });
  }

  removeNewTranslationRow(
    index: number,
  ): void {
    const row =
      this.newTranslations[index];

    /**
     * Không cho xóa ngôn ngữ nguồn.
     */
    if (
      row?.languageId ===
      this.newSourceLanguageId
    ) {
      this.toast.show(
        'warning',
        this.ts.translate(
          'common.warning',
        ),
        'Không thể xóa ngôn ngữ nguồn.',
      );

      return;
    }

    if (
      this.newTranslations.length <= 1
    ) {
      return;
    }

    if (
      row?.languageId != null
    ) {
      this.newTargetLanguageIds =
        this.newTargetLanguageIds.filter(
          (id) =>
            id !== row.languageId,
        );
    }

    this.newTranslations.splice(
      index,
      1,
    );
  }

  submitAddCategory(): void {
    const code =
      this.newCode
        .trim()
        .toLowerCase();

    const translations =
      this.normalizeTranslations(
        this.newTranslations,
      );

    if (!code) {
      this.toast.show(
        'warning',
        this.ts.translate(
          'manage_categories.missing_code_title',
        ),
        this.ts.translate(
          'manage_categories.missing_code_desc',
        ),
      );

      return;
    }

    if (
      !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(
        code,
      )
    ) {
      this.toast.show(
        'warning',
        this.ts.translate(
          'manage_categories.invalid_code_title',
        ),
        this.ts.translate(
          'manage_categories.invalid_code_desc',
        ),
      );

      return;
    }

    if (
      !translations.length
    ) {
      this.toast.show(
        'warning',
        this.ts.translate(
          'manage_categories.missing_translation_title',
        ),
        this.ts.translate(
          'manage_categories.missing_translation_desc',
        ),
      );

      return;
    }

    if (
      this.hasDuplicateLanguages(
        translations,
      )
    ) {
      this.toast.show(
        'warning',
        this.ts.translate(
          'manage_categories.duplicate_lang_title',
        ),
        this.ts.translate(
          'manage_categories.duplicate_lang_desc',
        ),
      );

      return;
    }

    this.actionLoading.set(
      true,
    );

    this.moderatorApiService
      .createModeratorCategoryGroup({
        code,
        translations,
      })
      .subscribe({
        next: (res) => {
          this.actionLoading.set(
            false,
          );

          if (!res.success) {
            return;
          }

          this.toast.show(
            'success',
            this.ts.translate(
              'common.success',
            ),
            `${this.ts.translate(
              'manage_categories.create_success_prefix',
            )} "${code}".`,
          );

          this.isAddModalOpen.set(
            false,
          );

          this.resetNewTranslationState();

          this.currentPage.set(1);

          this.router.navigate([], {
            relativeTo:
              this.route,

            queryParams: {
              page: 1,
            },

            queryParamsHandling:
              'merge',
          });

          this.loadCategories();
        },

        error: (err) => {
          this.actionLoading.set(
            false,
          );

          this.toast.show(
            'error',
            this.ts.translate(
              'manage_categories.create_error_title',
            ),
            this.getErrorMessage(
              err,
              this.ts.translate(
                'manage_categories.create_error',
              ),
            ),
          );
        },
      });
  }

  // =========================
  // EDIT
  // =========================

  setEditCategory(
    category: ModeratorCategoryGroup,
  ): void {
    this.actionLoading.set(
      true,
    );

    this.moderatorApiService
      .getModeratorCategoryGroupDetail(
        category.id,
      )
      .subscribe({
        next: (res) => {
          this.actionLoading.set(
            false,
          );

          if (
            !res.success ||
            !res.data
          ) {
            return;
          }

          const detail =
            res.data;

          this.activeEditCategory.set(
            detail,
          );

          this.editCode =
            detail.code;

          this.editTranslations =
            detail.translations.map(
              (translation) => ({
                languageId:
                  translation.languageId,
                name:
                  translation.name,
              }),
            );

          /**
           * Ưu tiên translation của
           * ngôn ngữ mặc định làm nguồn.
           */
          const defaultLanguageId =
            this.languages.find(
              (language) =>
                language.isDefault,
            )?.id;

          const sourceTranslation =
            detail.translations.find(
              (translation) =>
                translation.languageId ===
                defaultLanguageId,
            ) ??
            detail.translations[0];

          this.editSourceLanguageId =
            sourceTranslation
              ?.languageId ?? null;

          this.editTargetLanguageIds =
            [];

          this.editTranslationError.set(
            null,
          );
        },

        error: (err) => {
          this.actionLoading.set(
            false,
          );

          this.toast.show(
            'error',
            this.ts.translate(
              'common.error',
            ),
            this.getErrorMessage(
              err,
              this.ts.translate(
                'manage_categories.load_detail_error',
              ),
            ),
          );
        },
      });
  }

  closeEditCategoryModal(): void {
    if (
      this.actionLoading() ||
      this.editTranslationLoading()
    ) {
      return;
    }

    this.activeEditCategory.set(
      null,
    );

    this.editCode = '';

    this.editTranslations = [];

    this.editSourceLanguageId =
      null;

    this.editTargetLanguageIds =
      [];

    this.editTranslationError.set(
      null,
    );
  }

  onEditSourceLanguageChange(): void {
    this.editTargetLanguageIds =
      this.editTargetLanguageIds.filter(
        (id) =>
          id !==
          this.editSourceLanguageId,
      );

    this.editTranslationError.set(
      null,
    );
  }

  isEditTargetSelected(
    languageId: number,
  ): boolean {
    return (
      this.editTargetLanguageIds.includes(
        languageId,
      )
    );
  }

  toggleEditTargetLanguage(
    languageId: number,
    checked: boolean,
  ): void {
    if (
      languageId ===
      this.editSourceLanguageId
    ) {
      return;
    }

    if (checked) {
      if (
        !this.editTargetLanguageIds.includes(
          languageId,
        )
      ) {
        this.editTargetLanguageIds = [
          ...this.editTargetLanguageIds,
          languageId,
        ];
      }

      return;
    }

    this.editTargetLanguageIds =
      this.editTargetLanguageIds.filter(
        (id) =>
          id !== languageId,
      );
  }

  translateEditCategoryPreview(): void {
    this.editTranslationError.set(
      null,
    );

    const sourceLanguageId =
      this.editSourceLanguageId;

    const sourceName =
      this.editSourceName.trim();

    if (
      sourceLanguageId == null
    ) {
      this.showTranslationWarning(
        'Vui lòng chọn ngôn ngữ nguồn.',
      );

      return;
    }

    if (!sourceName) {
      this.showTranslationWarning(
        'Vui lòng nhập tên danh mục nguồn.',
      );

      return;
    }

    if (
      this.editTargetLanguageIds.length ===
      0
    ) {
      this.showTranslationWarning(
        'Vui lòng chọn ít nhất một ngôn ngữ đích.',
      );

      return;
    }

    this.editTranslationLoading.set(
      true,
    );

    this.moderatorApiService
      .translateModeratorCategoryPreview(
        {
          sourceLanguageId,
          sourceName,
          targetLanguageIds:
            this.editTargetLanguageIds,
        },
      )
      .subscribe({
        next: (res) => {
          this.editTranslationLoading.set(
            false,
          );

          if (
            !res.success ||
            !res.data
          ) {
            this.editTranslationError.set(
              'Không thể dịch tên danh mục.',
            );

            return;
          }

          /**
           * EDIT dùng merge.
           *
           * Các bản dịch cũ không được chọn
           * làm target vẫn được giữ nguyên.
           */
          this.mergeTranslationRow(
            this.editTranslations,
            res.data.source
              .languageId,
            res.data.source.name,
          );

          for (
            const translation of
              res.data.translations
          ) {
            this.mergeTranslationRow(
              this.editTranslations,
              translation.languageId,
              translation.name,
            );
          }

          this.toast.show(
            'success',
            this.ts.translate(
              'common.success',
            ),
            'Đã tạo bản dịch xem trước. Bạn có thể chỉnh sửa trước khi lưu.',
          );
        },

        error: (err) => {
          this.editTranslationLoading.set(
            false,
          );

          const message =
            this.getErrorMessage(
              err,
              'Không thể dịch tên danh mục.',
            );

          this.editTranslationError.set(
            message,
          );

          this.toast.show(
            'error',
            this.ts.translate(
              'common.error',
            ),
            message,
          );
        },
      });
  }

  addEditTranslationRow(): void {
    this.editTranslations.push({
      languageId:
        this.getFirstUnusedLanguageId(
          this.editTranslations,
        ),
      name: '',
    });
  }

  /**
   * Backend PATCH hiện tại là UPSERT.
   *
   * Translation cũ không xuất hiện
   * trong request vẫn được giữ.
   */
removeEditTranslationRow(index: number): void {
  const category =
    this.activeEditCategory();

  const current =
    this.editTranslations[index];

  if (
    !category ||
    !current
  ) {
    return;
  }

  /**
   * Không cho xóa ngôn ngữ đang được chọn làm nguồn.
   */
  if (
    current.languageId ===
    this.editSourceLanguageId
  ) {
    this.toast.show(
      'warning',
      this.ts.translate(
        'common.warning',
      ),
      'Không thể xóa ngôn ngữ đang được chọn làm nguồn.',
    );

    return;
  }

  /**
   * Kiểm tra đây là translation đã tồn tại trong DB
   * hay chỉ là row mới chưa lưu.
   */
  const existedInDatabase =
    current.languageId != null &&
    category.translations.some(
      (translation) =>
        translation.languageId ===
        current.languageId,
    );

  /**
   * Row mới chưa từng lưu:
   * chỉ cần xóa khỏi form.
   */
  if (!existedInDatabase) {
    if (
      current.languageId != null
    ) {
      this.editTargetLanguageIds =
        this.editTargetLanguageIds.filter(
          (id) =>
            id !==
            current.languageId,
        );
    }

    this.editTranslations.splice(
      index,
      1,
    );

    return;
  }

  const languageId =
    current.languageId;

  if (languageId == null) {
    return;
  }

  const language =
    this.languageById(languageId);

  const confirmed =
    confirm(
      `Bạn có chắc muốn xóa bản dịch ${
        language?.name ?? `ID ${languageId}`
      } "${current.name}" không?`,
    );

  if (!confirmed) {
    return;
  }

  this.actionLoading.set(true);

  this.moderatorApiService
    .deleteModeratorCategoryTranslation(
      category.id,
      languageId,
    )
    .subscribe({
      next: (res) => {
        this.actionLoading.set(false);

        if (
          !res.success ||
          !res.data
        ) {
          return;
        }

        /**
         * Backend đã xóa thành công.
         * Đồng bộ lại form Edit từ response mới.
         */
        this.activeEditCategory.set(
          res.data,
        );

        this.editTranslations =
          res.data.translations.map(
            (translation) => ({
              languageId:
                translation.languageId,
              name:
                translation.name,
            }),
          );

        this.editTargetLanguageIds =
          this.editTargetLanguageIds.filter(
            (id) =>
              id !== languageId,
          );

        /**
         * Refresh danh sách phía sau modal
         * để số lượng translation cập nhật ngay.
         */
        this.loadCategories();

        this.toast.show(
          'success',
          this.ts.translate(
            'common.success',
          ),
          'Đã xóa bản dịch khỏi danh mục.',
        );
      },

      error: (err) => {
        this.actionLoading.set(false);

        const message =
          this.getErrorMessage(
            err,
            'Không thể xóa bản dịch.',
          );

        this.toast.show(
          'error',
          this.ts.translate(
            'common.error',
          ),
          message,
        );
      },
    });
}

  submitEditCategory(): void {
    const category =
      this.activeEditCategory();

    if (!category) {
      return;
    }

    const code =
      this.editCode
        .trim()
        .toLowerCase();

    const translations =
      this.normalizeTranslations(
        this.editTranslations,
      );

    if (!code) {
      this.toast.show(
        'warning',
        this.ts.translate(
          'manage_categories.missing_code_title',
        ),
        this.ts.translate(
          'manage_categories.missing_code_desc',
        ),
      );

      return;
    }

    if (
      !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(
        code,
      )
    ) {
      this.toast.show(
        'warning',
        this.ts.translate(
          'manage_categories.invalid_code_title',
        ),
        this.ts.translate(
          'manage_categories.invalid_code_desc',
        ),
      );

      return;
    }

    if (
      !translations.length
    ) {
      this.toast.show(
        'warning',
        this.ts.translate(
          'manage_categories.missing_translation_title',
        ),
        this.ts.translate(
          'manage_categories.missing_translation_desc',
        ),
      );

      return;
    }

    if (
      this.hasDuplicateLanguages(
        translations,
      )
    ) {
      this.toast.show(
        'warning',
        this.ts.translate(
          'manage_categories.duplicate_lang_title',
        ),
        this.ts.translate(
          'manage_categories.duplicate_lang_desc',
        ),
      );

      return;
    }

    this.actionLoading.set(
      true,
    );

    this.moderatorApiService
      .updateModeratorCategoryGroup(
        category.id,
        {
          code,
          translations,
        },
      )
      .subscribe({
        next: (res) => {
          this.actionLoading.set(
            false,
          );

          if (!res.success) {
            return;
          }

          this.toast.show(
            'success',
            this.ts.translate(
              'common.success',
            ),
            this.ts.translate(
              'manage_categories.update_success',
            ),
          );

          this.activeEditCategory.set(
            null,
          );

          this.editTranslationError.set(
            null,
          );

          this.loadCategories();
        },

        error: (err) => {
          this.actionLoading.set(
            false,
          );

          this.toast.show(
            'error',
            this.ts.translate(
              'manage_categories.update_error_title',
            ),
            this.getErrorMessage(
              err,
              this.ts.translate(
                'manage_categories.update_error',
              ),
            ),
          );
        },
      });
  }

  // =========================
  // DELETE
  // =========================

  deleteCategory(
    category: ModeratorCategoryGroup,
  ): void {
    const confirmed =
      confirm(
        `${this.ts.translate(
          'manage_categories.delete_confirm_prefix',
        )} "${category.code}" ${this.ts.translate(
          'manage_categories.delete_confirm_suffix',
        )}`,
      );

    if (!confirmed) {
      return;
    }

    this.actionLoading.set(
      true,
    );

    this.moderatorApiService
      .deleteModeratorCategoryGroup(
        category.id,
      )
      .subscribe({
        next: (res) => {
          this.actionLoading.set(
            false,
          );

          if (!res.success) {
            return;
          }

          this.toast.show(
            'success',
            this.ts.translate(
              'manage_categories.delete_success_title',
            ),
            `${this.ts.translate(
              'manage_categories.delete_success_prefix',
            )} "${category.code}".`,
          );

          /**
           * Nếu xóa item cuối của page,
           * lùi lại một trang.
           */
          if (
            this.categories().length ===
              1 &&
            this.currentPage() > 1
          ) {
            this.currentPage.update(
              (page) =>
                page - 1,
            );
          }

          this.loadCategories();
        },

        error: (err) => {
          this.actionLoading.set(
            false,
          );

          this.toast.show(
            'error',
            this.ts.translate(
              'manage_categories.delete_error_title',
            ),
            this.getErrorMessage(
              err,
              this.ts.translate(
                'manage_categories.delete_error',
              ),
            ),
          );
        },
      });
  }

  // =========================
  // HELPERS
  // =========================

  languageById(
    id: number | null,
  ): LanguageOption | undefined {
    if (id == null) {
      return undefined;
    }

    return this.languages.find(
      (language) =>
        language.id === id,
    );
  }

  isLanguageUsed(
    languageId: number,
    rows: CategoryTranslationForm[],
    currentIndex: number,
  ): boolean {
    return rows.some(
      (row, index) =>
        index !== currentIndex &&
        row.languageId === languageId,
    );
  }

  private setTranslationName(
    rows: CategoryTranslationForm[],
    languageId: number | null,
    value: string,
  ): void {
    if (languageId == null) {
      return;
    }

    const existing =
      rows.find(
        (row) =>
          row.languageId ===
          languageId,
      );

    if (existing) {
      existing.name = value;

      return;
    }

    rows.push({
      languageId,
      name: value,
    });
  }

  private mergeTranslationRow(
    rows: CategoryTranslationForm[],
    languageId: number,
    name: string,
  ): void {
    const existing =
      rows.find(
        (row) =>
          row.languageId ===
          languageId,
      );

    if (existing) {
      existing.name =
        name;

      return;
    }

    rows.push({
      languageId,
      name,
    });
  }

  private getFirstUnusedLanguageId(
    rows: CategoryTranslationForm[],
  ): number | null {
    const used =
      new Set(
        rows
          .map(
            (row) =>
              row.languageId,
          )
          .filter(
            (
              id,
            ): id is number =>
              id != null,
          ),
      );

    return (
      this.languages.find(
        (language) =>
          !used.has(
            language.id,
          ),
      )?.id ?? null
    );
  }

  private normalizeTranslations(
    rows: CategoryTranslationForm[],
  ): ModeratorCategoryTranslationRequest[] {
    return rows
      .filter(
        (
          row,
        ): row is {
          languageId: number;
          name: string;
        } =>
          row.languageId != null &&
          !!row.name.trim(),
      )
      .map(
        (row) => ({
          languageId:
            row.languageId,
          name:
            row.name.trim(),
        }),
      );
  }

  private hasDuplicateLanguages(
    translations:
      ModeratorCategoryTranslationRequest[],
  ): boolean {
    const ids =
      translations.map(
        (item) =>
          item.languageId,
      );

    return (
      new Set(ids).size !==
      ids.length
    );
  }

  private showTranslationWarning(
    message: string,
  ): void {
    this.toast.show(
      'warning',
      this.ts.translate(
        'common.warning',
      ),
      message,
    );
  }

  private resetNewTranslationState(): void {
    this.newCode = '';

    this.newTranslations = [];

    this.newSourceLanguageId =
      null;

    this.newTargetLanguageIds =
      [];

    this.newTranslationError.set(
      null,
    );
  }

  private getErrorMessage(
    err: any,
    fallback: string,
  ): string {
    const message =
      err?.error?.message;

    if (
      Array.isArray(message)
    ) {
      return message.join(', ');
    }

    if (
      typeof message ===
      'string'
    ) {
      return message;
    }

    return fallback;
  }
}