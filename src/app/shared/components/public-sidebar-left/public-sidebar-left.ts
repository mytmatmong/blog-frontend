import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Router } from '@angular/router';
import { InputComponent } from '../input/input';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type FilterSortOption = 'latest' | 'mostViewed' | 'mostLiked' | 'mostCommented';

@Component({
  selector: 'app-public-sidebar-left',
  imports: [InputComponent, TranslatePipe],
  templateUrl: './public-sidebar-left.html',
  styleUrl: './public-sidebar-left.css',
})
export class PublicSidebarLeft {
  private router = inject(Router);
  protected readonly ts = inject(TranslationService);

  @Input() activeFilter: FilterSortOption = 'latest';
  @Output() filterChange = new EventEmitter<FilterSortOption>();

  @Input() searchTerm: string = '';
  @Output() searchChange = new EventEmitter<string>();

  @Input() searchPlaceholder?: string;

  filterOptions: { key: FilterSortOption; translationKey: string; icon: string }[] = [
    { key: 'latest', translationKey: 'filter.latest', icon: 'bi bi-clock-history' },
    { key: 'mostViewed', translationKey: 'filter.most_viewed', icon: 'bi bi-eye' },
    { key: 'mostLiked', translationKey: 'filter.most_liked', icon: 'bi bi-heart' },
    { key: 'mostCommented', translationKey: 'filter.most_commented', icon: 'bi bi-chat-dots' }
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
    if (url.includes('/category')) return this.ts.translate('search.placeholder_categories');
    if (url.includes('/hashtag')) return this.ts.translate('search.placeholder_hashtags');
    return this.ts.translate('search.placeholder_posts');
  }
}
