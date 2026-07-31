import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Router } from '@angular/router';
import { InputComponent } from '../input/input';

export type FilterSortOption = 'latest' | 'mostViewed' | 'mostLiked' | 'mostCommented';

@Component({
  selector: 'app-public-sidebar-left',
  imports: [InputComponent],
  templateUrl: './public-sidebar-left.html',
  styleUrl: './public-sidebar-left.css',
})
export class PublicSidebarLeft {
  private router = inject(Router);

  @Input() activeFilter: FilterSortOption = 'latest';
  @Output() filterChange = new EventEmitter<FilterSortOption>();

  @Input() searchTerm: string = '';
  @Output() searchChange = new EventEmitter<string>();

  @Input() searchPlaceholder?: string;

  filterOptions: { key: FilterSortOption; label: string; icon: string }[] = [
    { key: 'latest', label: 'Mới nhất', icon: 'bi bi-clock-history' },
    { key: 'mostViewed', label: 'Nhiều lượt xem nhất', icon: 'bi bi-eye' },
    { key: 'mostLiked', label: 'Nhiều lượt thích nhất', icon: 'bi bi-heart' },
    { key: 'mostCommented', label: 'Nhiều bình luận nhất', icon: 'bi bi-chat-dots' }
  ];

  selectFilter(key: FilterSortOption) {
    this.activeFilter = key;
    this.filterChange.emit(key);
  }

  onSearch(val: string) {
    this.searchTerm = val;
    this.searchChange.emit(val);
  }

  get computedPlaceholder(): string {
    if (this.searchPlaceholder) return this.searchPlaceholder;
    const url = this.router.url;
    if (url.includes('/category')) return 'Tìm danh mục...';
    if (url.includes('/hashtag')) return 'Tìm hashtag...';
    return 'Tìm bài viết...';
  }
}
