import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  AdminLanguage,
  CreateAdminLanguageRequest,
  UpdateAdminLanguageRequest,
} from '../../../../core/models/admin-api.model';
import { AdminApiService } from '../../../../core/services/admin-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button';
import { TextButtonComponent } from '../../../../shared/components/text-button/text-button';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-manage-languages',
  imports: [
    FormsModule,
    TranslatePipe,
    ConfirmDialog,
    BadgeComponent,
    IconButtonComponent,
    TextButtonComponent,
  ],
  templateUrl: './manage-languages.html',
  styleUrl: './manage-languages.css',
})
export class ManageLanguages implements OnInit {
  protected readonly ts = inject(TranslationService);
  private readonly adminApiService = inject(AdminApiService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly languagesList = signal<AdminLanguage[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isEditingLoading = signal<boolean>(false);
  readonly isSubmittingAdd = signal<boolean>(false);
  readonly isSubmittingEdit = signal<boolean>(false);
  readonly deletingId = signal<number | null>(null);
  readonly pendingDeleteLanguage = signal<AdminLanguage | null>(null);

  currentPage = signal<number>(1);
  itemsPerPage = 10;

  isAddModalOpen = signal<boolean>(false);
  isAddFlagDropdownOpen = signal<boolean>(false);
  isEditFlagDropdownOpen = signal<boolean>(false);

  // Add Language Form Fields
  selectedAddFlag = 'vn';
  selectedAddFlagName = 'Vietnam (VN)';
  addCode = '';
  addName = '';
  addIsDefault = false;
  addIsActive = true;

  // Edit Language Form Fields
  activeEditLanguage = signal<AdminLanguage | null>(null);
  selectedEditFlag = 'vn';
  selectedEditFlagName = 'Vietnam (VN)';
  editCode = '';
  editName = '';
  editIsDefault = false;
  editIsActive = true;

  flagOptions = [
    { code: 'vn', name: 'Vietnam (VN)' },
    { code: 'us', name: 'English (US)' },
    { code: 'gb', name: 'English (UK)' },
    { code: 'jp', name: 'Japan (JP)' },
    { code: 'kr', name: 'South Korea (KR)' },
    { code: 'cn', name: 'China (CN)' },
    { code: 'fr', name: 'France (FR)' },
    { code: 'de', name: 'Germany (DE)' },
  ];

  ngOnInit() {
    this.loadLanguages();
  }

  loadLanguages() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminApiService
      .getAdminLanguages()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res?.success && Array.isArray(res.data)) {
            this.languagesList.set(res.data);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            typeof err?.error?.message === 'string'
              ? err.error.message
              : 'Không thể tải danh sách ngôn ngữ.',
          );
        },
      });
  }

  totalPages = computed(() => {
    const total = Math.ceil(this.languagesList().length / this.itemsPerPage);
    return total > 0 ? total : 1;
  });

  pageItems = computed(() => {
    const total = this.totalPages();
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

  paginatedLanguages = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.languagesList().slice(startIndex, startIndex + this.itemsPerPage);
  });

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  is2LetterFlag(flag: string | null): boolean {
    return !!flag && /^[a-zA-Z]{2}$/.test(flag.trim());
  }

  openAddModal() {
    this.isAddModalOpen.set(true);
  }

  closeAddModal() {
    this.isAddModalOpen.set(false);
    this.isAddFlagDropdownOpen.set(false);
  }

  closeEditModal() {
    this.activeEditLanguage.set(null);
    this.isEditFlagDropdownOpen.set(false);
  }

  selectAddFlag(flagCode: string, flagName: string) {
    this.selectedAddFlag = flagCode;
    this.selectedAddFlagName = flagName;
    this.isAddFlagDropdownOpen.set(false);
  }

  selectEditFlag(flagCode: string, flagName: string) {
    this.selectedEditFlag = flagCode;
    this.selectedEditFlagName = flagName;
    this.isEditFlagDropdownOpen.set(false);
  }

  /**
   * Fetch language detail via GET /api/v1/admin/languages/:id (A03)
   */
  setEditLanguage(lang: AdminLanguage) {
    this.activeEditLanguage.set(lang);
    this.populateEditForm(lang);
    this.isEditingLoading.set(true);

    this.adminApiService
      .getAdminLanguageById(lang.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isEditingLoading.set(false);
          if (res?.success && res.data) {
            this.activeEditLanguage.set(res.data);
            this.populateEditForm(res.data);
          }
        },
        error: () => {
          this.isEditingLoading.set(false);
        },
      });
  }

  private populateEditForm(lang: AdminLanguage) {
    this.selectedEditFlag = lang.flag || 'vn';
    const flagObj = this.flagOptions.find((f) => f.code === lang.flag);
    this.selectedEditFlagName = flagObj ? flagObj.name : (lang.flag || 'VN').toUpperCase();
    this.editCode = lang.code;
    this.editName = lang.name;
    this.editIsDefault = lang.isDefault;
    this.editIsActive = lang.isActive;
  }

  /**
   * Submit A04 — POST /api/v1/admin/languages
   */
  submitAddLanguage() {
    const code = this.addCode.trim();
    const name = this.addName.trim();

    if (!code || !name) return;

    if (code.length > 10) {
      this.toastService.error('Mã ngôn ngữ tối đa 10 ký tự.');
      return;
    }

    if (name.length > 100) {
      this.toastService.error('Tên ngôn ngữ tối đa 100 ký tự.');
      return;
    }

    this.isSubmittingAdd.set(true);

    const body: CreateAdminLanguageRequest = {
      code,
      name,
      flag: this.selectedAddFlag,
      isDefault: this.addIsDefault,
      isActive: this.addIsActive,
    };

    this.adminApiService
      .createAdminLanguage(body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isSubmittingAdd.set(false);
          if (res?.success && res.data) {
            this.toastService.success('Tạo ngôn ngữ mới thành công!');
            this.loadLanguages();
            this.ts.loadLanguages(true);
            this.resetAddForm();
            this.closeAddModal();
          }
        },
        error: (err) => {
          this.isSubmittingAdd.set(false);
          const errorMsg =
            typeof err?.error?.message === 'string'
              ? err.error.message
              : Array.isArray(err?.error?.message)
                ? err.error.message.join(', ')
                : 'Tạo ngôn ngữ thất bại.';
          this.toastService.error(errorMsg);
        },
      });
  }

  /**
   * Submit A05 — PATCH /api/v1/admin/languages/:id
   */
  submitEditLanguage() {
    const lang = this.activeEditLanguage();
    if (!lang) return;

    const code = this.editCode.trim();
    const name = this.editName.trim();

    if (!code || !name) return;

    if (code.length > 10) {
      this.toastService.error('Mã ngôn ngữ tối đa 10 ký tự.');
      return;
    }

    if (name.length > 100) {
      this.toastService.error('Tên ngôn ngữ tối đa 100 ký tự.');
      return;
    }

    this.isSubmittingEdit.set(true);

    const body: UpdateAdminLanguageRequest = {
      code,
      name,
      flag: this.selectedEditFlag,
      isDefault: this.editIsDefault,
      isActive: this.editIsActive,
    };

    this.adminApiService
      .updateAdminLanguage(lang.id, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isSubmittingEdit.set(false);
          if (res?.success && res.data) {
            this.toastService.success('Cập nhật ngôn ngữ thành công!');
            this.loadLanguages();
            this.ts.loadLanguages(true);
            this.closeEditModal();
          }
        },
        error: (err) => {
          this.isSubmittingEdit.set(false);
          const errorMsg =
            typeof err?.error?.message === 'string'
              ? err.error.message
              : Array.isArray(err?.error?.message)
                ? err.error.message.join(', ')
                : 'Cập nhật ngôn ngữ thất bại.';
          this.toastService.error(errorMsg);
        },
      });
  }

  /**
   * Submit A06 — DELETE /api/v1/admin/languages/:id
   */
  deleteLanguage(lang: AdminLanguage) {
    this.pendingDeleteLanguage.set(lang);
  }

  closeDeleteConfirmation(): void {
    if (this.deletingId() !== null) return;
    this.pendingDeleteLanguage.set(null);
  }

  confirmDeleteLanguage(): void {
    const lang = this.pendingDeleteLanguage();
    if (!lang) return;

    this.deletingId.set(lang.id);

    this.adminApiService
      .deleteAdminLanguage(lang.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.deletingId.set(null);
          if (res?.success) {
            this.toastService.success('Xóa ngôn ngữ thành công!');
            this.pendingDeleteLanguage.set(null);
            this.loadLanguages();
            this.ts.loadLanguages(true);
          }
        },
        error: (err) => {
          this.deletingId.set(null);
          const errorMsg =
            typeof err?.error?.message === 'string'
              ? err.error.message
              : Array.isArray(err?.error?.message)
                ? err.error.message.join(', ')
                : 'Xóa ngôn ngữ thất bại.';
          this.toastService.error(errorMsg);
        },
      });
  }

  get deleteConfirmationMessage(): string {
    const lang = this.pendingDeleteLanguage();
    return `${this.ts.translate('languages.delete_confirm')} ${lang?.name || lang?.code || ''}?`;
  }

  private resetAddForm() {
    this.selectedAddFlag = 'vn';
    this.selectedAddFlagName = 'Vietnam (VN)';
    this.addCode = '';
    this.addName = '';
    this.addIsDefault = false;
    this.addIsActive = true;
  }
}
