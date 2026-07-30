import { Component, input, model, computed } from '@angular/core';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  totalItems = input.required<number>();
  itemsPerPage = input<number>(10);
  currentPage = model<number>(1);

  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.totalItems() / this.itemsPerPage()));
  });

  pages = computed(() => {
    const list: number[] = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      list.push(i);
    }
    return list;
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
}

