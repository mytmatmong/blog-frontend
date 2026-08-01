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
   * Danh sách nút cần hiển thị.
   *
   * Không render toàn bộ 45, 100 hay 1000 trang.
   */
  readonly pageItems = computed<PaginationItem[]>(() => {
    const totalPages = this.totalPages();
    const currentPage =
      this.normalizedCurrentPage();

    /**
     * Có tối đa 7 trang thì hiện toàn bộ.
     */
    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_, index): PaginationItem => {
          const page = index + 1;

          return {
            type: 'page',
            value: page,
            key: `page-${page}`,
          };
        },
      );
    }

    /**
     * Đang ở đầu danh sách:
     *
     * 1 2 3 4 5 ... 45
     */
    if (currentPage <= 4) {
      return [
        this.createPageItem(1),
        this.createPageItem(2),
        this.createPageItem(3),
        this.createPageItem(4),
        this.createPageItem(5),
        this.createEllipsisItem('right'),
        this.createPageItem(totalPages),
      ];
    }

    /**
     * Đang ở cuối danh sách:
     *
     * 1 ... 41 42 43 44 45
     */
    if (currentPage >= totalPages - 3) {
      return [
        this.createPageItem(1),
        this.createEllipsisItem('left'),
        this.createPageItem(totalPages - 4),
        this.createPageItem(totalPages - 3),
        this.createPageItem(totalPages - 2),
        this.createPageItem(totalPages - 1),
        this.createPageItem(totalPages),
      ];
    }

    /**
     * Đang ở giữa:
     *
     * 1 ... 22 23 24 ... 45
     */
    return [
      this.createPageItem(1),
      this.createEllipsisItem('left'),
      this.createPageItem(currentPage - 1),
      this.createPageItem(currentPage),
      this.createPageItem(currentPage + 1),
      this.createEllipsisItem('right'),
      this.createPageItem(totalPages),
    ];
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
    if (
      item.type !== 'page' ||
      item.value === null
    ) {
      return;
    }

    this.goToPage(item.value);
  }

  private createPageItem(
    page: number,
  ): PaginationItem {
    return {
      type: 'page',
      value: page,
      key: `page-${page}`,
    };
  }

  private createEllipsisItem(
    position: 'left' | 'right',
  ): PaginationItem {
    return {
      type: 'ellipsis',
      value: null,
      key: `ellipsis-${position}`,
    };
  }
}