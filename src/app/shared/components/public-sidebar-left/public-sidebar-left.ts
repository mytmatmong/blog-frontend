import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';

import { InputComponent } from '../input/input';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type FilterSortOption =
  | 'latest'
  | 'mostViewed'
  | 'mostLiked'
  | 'mostCommented';

@Component({
  selector: 'app-public-sidebar-left',
  imports: [
    InputComponent,
    TranslatePipe,
  ],
  templateUrl:
    './public-sidebar-left.html',
  styleUrl:
    './public-sidebar-left.css',
})
export class PublicSidebarLeft {
  private readonly router =
    inject(Router);

  protected readonly ts =
    inject(TranslationService);

  @Input()
  activeFilter: FilterSortOption =
    'latest';

  @Output()
  readonly filterChange =
    new EventEmitter<FilterSortOption>();

  @Input()
  searchTerm = '';

  @Output()
  readonly searchChange =
    new EventEmitter<string>();

  @Input()
  searchPlaceholder?: string;

  readonly filterOptions: {
    key: FilterSortOption;
    translationKey: string;
    icon: string;
  }[] = [
      {
        key: 'latest',
        translationKey: 'filter.latest',
        icon: 'bi bi-clock-history',
      },
      {
        key: 'mostViewed',
        translationKey: 'filter.most_viewed',
        icon: 'bi bi-eye',
      },
      {
        key: 'mostLiked',
        translationKey: 'filter.most_liked',
        icon: 'bi bi-heart',
      },
    ];

  selectFilter(
    key: FilterSortOption,
  ): void {
    this.filterChange.emit(key);
  }

  onSearch(value: string): void {
    this.searchChange.emit(value);
  }

  get computedPlaceholder(): string {
    if (this.searchPlaceholder) {
      return this.searchPlaceholder;
    }

    const url = this.router.url;

    if (url.includes('/category')) {
      return this.ts.translate(
        'search.placeholder_categories',
      );
    }

    if (url.includes('/hashtag')) {
      return this.ts.translate(
        'search.placeholder_hashtags',
      );
    }

    return this.ts.translate(
      'search.placeholder_posts',
    );
  }
}