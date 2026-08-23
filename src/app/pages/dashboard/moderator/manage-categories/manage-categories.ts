import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../../../core/services/translation.service';
import { BadgeComponent } from '../../../../shared/components/badge/badge';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button';
import { TextButtonComponent } from '../../../../shared/components/text-button/text-button';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

interface CategoryItem {
  id: number;
  name: string;
  lang: string;
  langFlag: string;
  postCount: number;
}

@Component({
  selector: 'app-manage-categories',
  imports: [
    FormsModule,
    TranslatePipe,
    BadgeComponent,
    IconButtonComponent,
    TextButtonComponent,
  ],
  templateUrl: './manage-categories.html',
  styleUrl: './manage-categories.css',
})
export class ManageCategories {
  protected readonly ts = inject(TranslationService);
  categoriesMockData: CategoryItem[] = [];
  currentPage = signal<number>(1);
  itemsPerPage = 8;

  activeCategoryPosts = signal<string | null>(null);
  isAddModalOpen = signal<boolean>(false);
  
  // Add Category fields
  newCatName = '';
  newCatLang = 'VI';

  // Edit Category fields
  activeEditCategory = signal<CategoryItem | null>(null);
  editCatName = '';
  editCatLang = 'VI';

  constructor() {
    const baseCategories: Omit<CategoryItem, 'id'>[] = [
      { name: 'Backend', lang: 'VI', langFlag: 'vn', postCount: 24 },
      { name: 'Frontend', lang: 'EN', langFlag: 'gb', postCount: 18 },
      { name: 'Database', lang: 'VI', langFlag: 'vn', postCount: 9 },
      { name: 'DevOps', lang: 'EN', langFlag: 'gb', postCount: 15 }
    ];

    for (let i = 0; i < 25; i++) {
      const cat = { ...baseCategories[i % baseCategories.length] } as CategoryItem;
      cat.id = i + 1;
      cat.name = `${cat.name} ${i + 1}`;
      this.categoriesMockData.push(cat);
    }
  }

  totalPages = computed(() => Math.ceil(this.categoriesMockData.length / this.itemsPerPage));

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  }

  get paginatedCategories(): CategoryItem[] {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    return this.categoriesMockData.slice(startIndex, startIndex + this.itemsPerPage);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  showCategoryPosts(catName: string) {
    this.activeCategoryPosts.set(catName);
  }

  closeCategoryPostsModal() {
    this.activeCategoryPosts.set(null);
  }

  setEditCategory(cat: CategoryItem) {
    this.activeEditCategory.set(cat);
    this.editCatName = cat.name;
    this.editCatLang = cat.lang;
  }

  closeEditCategoryModal() {
    this.activeEditCategory.set(null);
  }

  openAddCategoryModal() {
    this.isAddModalOpen.set(true);
  }

  closeAddCategoryModal() {
    this.isAddModalOpen.set(false);
  }

  submitAddCategory() {
    if (!this.newCatName.trim()) return;
    alert(`Mock: Đã thêm Category "${this.newCatName}" thành công!`);
    const newCat: CategoryItem = {
      id: this.categoriesMockData.length + 1,
      name: this.newCatName,
      lang: this.newCatLang,
      langFlag: this.newCatLang === 'VI' ? 'vn' : 'gb',
      postCount: 0
    };
    this.categoriesMockData.unshift(newCat);
    this.newCatName = '';
    this.newCatLang = 'VI';
    this.closeAddCategoryModal();
  }

  submitEditCategory() {
    if (!this.editCatName.trim()) return;
    const cat = this.activeEditCategory();
    if (cat) {
      alert('Mock: Cập nhật Category thành công!');
      const index = this.categoriesMockData.findIndex(c => c.id === cat.id);
      if (index !== -1) {
        this.categoriesMockData[index].name = this.editCatName;
        this.categoriesMockData[index].lang = this.editCatLang;
        this.categoriesMockData[index].langFlag = this.editCatLang === 'VI' ? 'vn' : 'gb';
      }
      this.closeEditCategoryModal();
    }
  }

  deleteCategory(cat: CategoryItem) {
    if (confirm(this.ts.translate('modal.delete_confirm'))) {
      this.categoriesMockData = this.categoriesMockData.filter(c => c.id !== cat.id);
      const maxPages = Math.ceil(this.categoriesMockData.length / this.itemsPerPage);
      if (this.currentPage() > maxPages && maxPages >= 1) {
        this.currentPage.set(maxPages);
      }
    }
  }
}
