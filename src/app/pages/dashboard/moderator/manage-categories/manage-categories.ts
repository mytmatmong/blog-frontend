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
import { TranslationService } from '../../../../core/services/translation.service';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button';
import { TextButtonComponent } from '../../../../shared/components/text-button/text-button';
import { TextSearchComponent } from '../../../../shared/components/text-search/text-search';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

import { LanguageOption } from '../../../../core/services/translation.service';

import { ModeratorApiService } from '../../../../core/services/moderator-api.service';
import { ToastService } from '../../../../core/services/toast.service';

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
    signal<ModeratorPaginationMeta | null>(null);

  readonly currentPage = signal(1);

  readonly limit = 8;

  searchQuery = '';

  readonly pageItems = computed(() => {
    const total = this.meta()?.totalPages ?? 1;
    const current = this.currentPage();

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => ({ type: 'page' as const, value: i + 1 }));
    }

    let start = Math.max(1, current - 2);
    let end = start + 4;
    if (end > total) {
      end = total;
      start = Math.max(1, end - 4);
    }

    const items: Array<{ type: 'page' | 'ellipsis'; value: number | null }> = [];
    if (start > 1) {
      items.push({ type: 'ellipsis', value: null });
    }
    for (let p = start; p <= end; p++) {
      items.push({ type: 'page', value: p });
    }
    if (end < total) {
      items.push({ type: 'ellipsis', value: null });
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
    CategoryTranslationForm[] = [
      {
        languageId: null,
        name: '',
      },
    ];

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

  // =========================
  // INIT
  // =========================

  ngOnInit(): void {
  this.ts.loadLanguages();

  /**
   * Đọc trạng thái phân trang từ URL.
   *
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
    this.currentPage.set(pageParam);
  }

  /**
   * Nếu URL có search thì khôi phục luôn.
   *
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

  // =========================
  // LIST
  // =========================

  loadCategories(): void {
    this.loading.set(true);
    this.error.set(null);

    this.moderatorApiService
      .getModeratorCategoryGroups({
        search: this.searchQuery,
        page: this.currentPage(),
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);

          if (res.success && res.data) {
            this.categories.set(
              res.data.items,
            );

            this.meta.set(
              res.data.meta,
            );

            return;
          }

          this.error.set(
            'Không thể tải danh sách nhóm danh mục.',
          );
        },

        error: (err) => {
          this.loading.set(false);

          const message =
            this.getErrorMessage(
              err,
              'Không thể tải danh sách nhóm danh mục.',
            );

          this.error.set(message);

          this.toast.show(
            'error',
            'Lỗi',
            message,
          );
        },
      });
  }

  onSearch(): void {
  this.currentPage.set(1);

  this.router.navigate([], {
    relativeTo: this.route,

    queryParams: {
      page: 1,

      search:
        this.searchQuery.trim() || null,
    },

    queryParamsHandling: 'merge',
  });

  this.loadCategories();
}

  clearSearch(): void {
  this.searchQuery = '';

  this.currentPage.set(1);

  this.router.navigate([], {
    relativeTo: this.route,

    queryParams: {
      page: 1,
      search: null,
    },

    queryParamsHandling: 'merge',
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

  this.currentPage.set(page);

  /**
   * Lưu page hiện tại vào URL.
   *
   * Trang 2:
   * /manage-categories?page=2
   */
  this.router.navigate([], {
    relativeTo: this.route,

    queryParams: {
      page,
    },

    queryParamsHandling: 'merge',
  });

  this.loadCategories();
}

  // =========================
  // CREATE
  // =========================

  openAddCategoryModal(): void {
    this.newCode = '';

    this.newTranslations = [
      {
        languageId:
          this.languages[0]?.id ?? null,
        name: '',
      },
    ];

    this.isAddModalOpen.set(true);
  }

  closeAddCategoryModal(): void {
    if (this.actionLoading()) {
      return;
    }

    this.isAddModalOpen.set(false);
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
    if (
      this.newTranslations.length <= 1
    ) {
      return;
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
        'Thiếu thông tin',
        'Vui lòng nhập mã nhóm danh mục.',
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
        'Mã không hợp lệ',
        'Code chỉ được chứa chữ thường không dấu, số, dấu - hoặc _.',
      );

      return;
    }

    if (!translations.length) {
      this.toast.show(
        'warning',
        'Thiếu bản dịch',
        'Phải có ít nhất một bản dịch.',
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
        'Ngôn ngữ bị trùng',
        'Mỗi ngôn ngữ chỉ được chọn một lần.',
      );

      return;
    }

    this.actionLoading.set(true);

    this.moderatorApiService
      .createModeratorCategoryGroup({
        code,
        translations,
      })
      .subscribe({
        next: (res) => {
          this.actionLoading.set(false);

          if (!res.success) {
            return;
          }

          this.toast.show(
            'success',
            'Thành công',
            `Đã tạo nhóm danh mục "${code}".`,
          );

          this.isAddModalOpen.set(false);

          this.currentPage.set(1);

          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
              page: 1,
            },

            queryParamsHandling: 'merge',
          });

            this.loadCategories();
                    },

        error: (err) => {
          this.actionLoading.set(false);

          this.toast.show(
            'error',
            'Không thể tạo danh mục',
            this.getErrorMessage(
              err,
              'Không thể tạo nhóm danh mục.',
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
    /**
     * Gọi detail để lấy dữ liệu mới nhất,
     * thay vì phụ thuộc hoàn toàn vào row list.
     */
    this.actionLoading.set(true);

    this.moderatorApiService
      .getModeratorCategoryGroupDetail(
        category.id,
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

          const detail = res.data;

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
        },

        error: (err) => {
          this.actionLoading.set(false);

          this.toast.show(
            'error',
            'Lỗi',
            this.getErrorMessage(
              err,
              'Không thể lấy chi tiết nhóm danh mục.',
            ),
          );
        },
      });
  }

  closeEditCategoryModal(): void {
    if (this.actionLoading()) {
      return;
    }

    this.activeEditCategory.set(null);

    this.editCode = '';

    this.editTranslations = [];
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
   * Không nên cho xóa translation cũ ở FE
   * vì backend PATCH hiện tại là UPSERT:
   *
   * translation không xuất hiện trong request
   * vẫn được giữ nguyên.
   *
   * Nút remove ở đây chỉ nên dùng cho row
   * mới chưa lưu.
   */
  removeEditTranslationRow(
    index: number,
  ): void {
    const originalLanguages =
      new Set(
        this.activeEditCategory()
          ?.translations.map(
            (item) =>
              item.languageId,
          ) ?? [],
      );

    const current =
      this.editTranslations[index];

    if (
      current.languageId != null &&
      originalLanguages.has(
        current.languageId,
      )
    ) {
      this.toast.show(
        'warning',
        'Không thể xóa bản dịch',
        'Backend hiện chỉ hỗ trợ cập nhật/thêm bản dịch, chưa hỗ trợ xóa riêng một bản dịch.',
      );

      return;
    }

    this.editTranslations.splice(
      index,
      1,
    );
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
        'Thiếu thông tin',
        'Vui lòng nhập mã nhóm danh mục.',
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
        'Mã không hợp lệ',
        'Code chỉ được chứa chữ thường không dấu, số, dấu - hoặc _.',
      );

      return;
    }

    if (
      !translations.length
    ) {
      this.toast.show(
        'warning',
        'Thiếu bản dịch',
        'Phải có ít nhất một bản dịch.',
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
        'Ngôn ngữ bị trùng',
        'Mỗi ngôn ngữ chỉ được chọn một lần.',
      );

      return;
    }

    this.actionLoading.set(true);

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
          this.actionLoading.set(false);

          if (!res.success) {
            return;
          }

          this.toast.show(
            'success',
            'Thành công',
            'Đã cập nhật nhóm danh mục.',
          );

          this.activeEditCategory.set(
            null,
          );

          this.loadCategories();
        },

        error: (err) => {
          this.actionLoading.set(false);

          this.toast.show(
            'error',
            'Không thể cập nhật',
            this.getErrorMessage(
              err,
              'Không thể cập nhật nhóm danh mục.',
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
    const confirmed = confirm(
      `Bạn có chắc muốn xóa nhóm danh mục "${category.code}" và tất cả bản dịch?`,
    );

    if (!confirmed) {
      return;
    }

    this.actionLoading.set(true);

    this.moderatorApiService
      .deleteModeratorCategoryGroup(
        category.id,
      )
      .subscribe({
        next: (res) => {
          this.actionLoading.set(false);

          if (!res.success) {
            return;
          }

          this.toast.show(
            'success',
            'Đã xóa',
            `Đã xóa nhóm "${category.code}".`,
          );

          /**
           * Nếu vừa xóa item cuối trang,
           * lùi về trang trước.
           */
          if (
            this.categories().length === 1 &&
            this.currentPage() > 1
          ) {
            this.currentPage.update(
              (page) => page - 1,
            );
          }

          this.loadCategories();
        },

        error: (err) => {
          this.actionLoading.set(false);

          this.toast.show(
            'error',
            'Không thể xóa',
            this.getErrorMessage(
              err,
              'Không thể xóa nhóm danh mục.',
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

  private getFirstUnusedLanguageId(
    rows: CategoryTranslationForm[],
  ): number | null {
    const used = new Set(
      rows
        .map((row) => row.languageId)
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
          !used.has(language.id),
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
      .map((row) => ({
        languageId:
          row.languageId,
        name:
          row.name.trim(),
      }));
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
      typeof message === 'string'
    ) {
      return message;
    }

    return fallback;
  }
}