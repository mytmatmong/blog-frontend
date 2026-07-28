import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface LanguageItem {
  id: number;
  code: string;
  name: string;
  flag: string;
  isDefault: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

@Component({
  selector: 'app-manage-languages',
  imports: [FormsModule],
  templateUrl: './manage-languages.html',
  styleUrl: './manage-languages.css',
})
export class ManageLanguages {
  languagesMockData: LanguageItem[] = [];
  currentPage = signal<number>(1);
  itemsPerPage = 6;

  // Add Language Form Fields
  selectedAddFlag = 'vn';
  selectedAddFlagName = 'Vietnam (VN)';
  addCode = '';
  addName = '';
  addIsDefault = false;
  addIsActive = true;

  // Edit Language Form Fields
  activeEditLanguage = signal<LanguageItem | null>(null);
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
    { code: 'de', name: 'Germany (DE)' }
  ];

  constructor() {
    const baseLanguages: Omit<LanguageItem, 'id'>[] = [
      { code: 'vi', name: 'Tiếng Việt', flag: 'vn', isDefault: true, status: 'ACTIVE' as const },
      { code: 'en', name: 'English', flag: 'gb', isDefault: false, status: 'ACTIVE' as const },
      { code: 'ja', name: 'Japanese', flag: 'jp', isDefault: false, status: 'INACTIVE' as const },
      { code: 'kr', name: 'Korean', flag: 'kr', isDefault: false, status: 'INACTIVE' as const },
      { code: 'fr', name: 'French', flag: 'fr', isDefault: false, status: 'ACTIVE' as const }
    ];

    for (let i = 0; i < 20; i++) {
      const lang = { ...baseLanguages[i % baseLanguages.length] } as LanguageItem;
      lang.id = i + 1;
      if (i >= 5) {
        lang.code = `${lang.code}${i}`;
        lang.name = `${lang.name} ${i}`;
        lang.isDefault = false;
      }
      this.languagesMockData.push(lang);
    }
  }

  totalPages = computed(() => Math.ceil(this.languagesMockData.length / this.itemsPerPage));

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  }

  get paginatedLanguages(): LanguageItem[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.languagesMockData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  selectAddFlag(flagCode: string, flagName: string) {
    this.selectedAddFlag = flagCode;
    this.selectedAddFlagName = flagName;
  }

  selectEditFlag(flagCode: string, flagName: string) {
    this.selectedEditFlag = flagCode;
    this.selectedEditFlagName = flagName;
  }

  setEditLanguage(lang: LanguageItem) {
    this.activeEditLanguage.set(lang);
    this.selectedEditFlag = lang.flag;
    const flagObj = this.flagOptions.find(f => f.code === lang.flag);
    this.selectedEditFlagName = flagObj ? flagObj.name : lang.flag.toUpperCase();
    this.editCode = lang.code;
    this.editName = lang.name;
    this.editIsDefault = lang.isDefault;
    this.editIsActive = lang.status === 'ACTIVE';
  }

  submitAddLanguage() {
    if (!this.addCode.trim() || !this.addName.trim()) return;
    alert('Mock: Đã thêm Ngôn ngữ thành công!');

    if (this.addIsDefault) {
      this.clearDefaults();
    }

    const newLang: LanguageItem = {
      id: this.languagesMockData.length + 1,
      code: this.addCode,
      name: this.addName,
      flag: this.selectedAddFlag,
      isDefault: this.addIsDefault,
      status: this.addIsActive ? 'ACTIVE' : 'INACTIVE'
    };

    this.languagesMockData.unshift(newLang);
    this.resetAddForm();
  }

  submitEditLanguage() {
    if (!this.editCode.trim() || !this.editName.trim()) return;
    const lang = this.activeEditLanguage();
    if (lang) {
      alert('Mock: Cập nhật Ngôn ngữ thành công!');
      
      if (this.editIsDefault) {
        this.clearDefaults();
      }

      const idx = this.languagesMockData.findIndex(l => l.id === lang.id);
      if (idx !== -1) {
        this.languagesMockData[idx].code = this.editCode;
        this.languagesMockData[idx].name = this.editName;
        this.languagesMockData[idx].flag = this.selectedEditFlag;
        this.languagesMockData[idx].isDefault = this.editIsDefault;
        this.languagesMockData[idx].status = this.editIsActive ? 'ACTIVE' : 'INACTIVE';
      }
      this.activeEditLanguage.set(null);
    }
  }

  deleteLanguage(lang: LanguageItem) {
    if (confirm('Xóa ngôn ngữ này?')) {
      alert('Đã xóa');
      this.languagesMockData = this.languagesMockData.filter(l => l.id !== lang.id);
      const maxPages = Math.ceil(this.languagesMockData.length / this.itemsPerPage);
      if (this.currentPage() > maxPages && maxPages >= 1) {
        this.currentPage.set(maxPages);
      }
    }
  }

  private clearDefaults() {
    this.languagesMockData.forEach(l => l.isDefault = false);
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
