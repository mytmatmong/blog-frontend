import {
  Component,
  computed,
  input,
  model,
} from '@angular/core';

import { TranslatePipe } from '../../pipes/translate.pipe';

interface PaginationItem {
  type: 'page' | 'ellipsis';
  value: number | null;
  key: string;
}

@Component({
  selector: 'app-pagination',
  imports: [TranslatePipe],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  /**
   * Tổng số bản ghi.
   */
  readonly totalItems = input.required<number>();

  /**
   * Số bản ghi trên một trang.
   */
  readonly itemsPerPage = input<number>(10);

  /**
   * Trang hiện tại.
   *
   * model() tự tạo:
   * - input currentPage
   * - output currentPageChange
   */
  readonly currentPage = model<number>(1);

  /**
   * Tổng số trang.
   */
  readonly totalPages = computed(() => {
    const totalItems = Math.max(
      0,
      this.totalItems(),
    );

    const itemsPerPage = Math.max(
      1,
      this.itemsPerPage(),
    );

    return Math.max(
      1,
      Math.ceil(
        totalItems / itemsPerPage,
      ),
    );
  });

  /**
   * Đảm bảo trang hiện tại luôn nằm trong khoảng hợp lệ.
   */
  readonly normalizedCurrentPage = computed(() => {
    return Math.min(
      Math.max(1, this.currentPage()),
      this.totalPages(),
    );
  });

  /**
   * Danh sách nút cần hiển thị (Tối đa 5 trang số).
   */
  readonly pageItems = computed<PaginationItem[]>(() => {
    const totalPages = this.totalPages();
    const currentPage = this.normalizedCurrentPage();

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index): PaginationItem => {
        const page = index + 1;
        return {
          type: 'page',
          value: page,
          key: `page-${page}`,
        };
      });
    }

    let startPage = Math.max(1, currentPage - 2);
    let endPage = startPage + 4;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - 4);
    }

    const items: PaginationItem[] = [];

    if (startPage > 1) {
      items.push({
        type: 'ellipsis',
        value: null,
        key: 'ellipsis-left',
      });
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push({
        type: 'page',
        value: page,
        key: `page-${page}`,
      });
    }

    if (endPage < totalPages) {
      items.push({
        type: 'ellipsis',
        value: null,
        key: 'ellipsis-right',
      });
    }

    return items;
  });

  goToPage(page: number): void {
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > this.totalPages() ||
      page === this.normalizedCurrentPage()
    ) {
      return;
    }

    this.currentPage.set(page);
  }

  goToItem(item: PaginationItem): void {
    if (item.type !== 'page' || item.value === null) {
      return;
    }

    this.goToPage(item.value);
  }
}