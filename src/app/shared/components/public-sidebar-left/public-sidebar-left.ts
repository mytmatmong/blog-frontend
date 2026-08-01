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

import {
  PostSortBy,
  SortOrder,
} from '../../../core/models/post.model';

export type FilterSortOption =
  | 'latest'
  | 'oldest'
  | 'mostViewed'
  | 'mostLiked'
  | 'titleAsc';

export interface PostSortQuery {
  sortBy: PostSortBy;
  sortOrder: SortOrder;
}

export const POST_SORT_QUERY_MAP: Record<
  FilterSortOption,
  PostSortQuery
> = {
  latest: {
    sortBy: 'publishedAt',
    sortOrder: 'desc',
  },

  oldest: {
    sortBy: 'publishedAt',
    sortOrder: 'asc',
  },

  mostViewed: {
    sortBy: 'viewCount',
    sortOrder: 'desc',
  },

  mostLiked: {
    sortBy: 'likesCount',
    sortOrder: 'desc',
  },

  titleAsc: {
    sortBy: 'title',
    sortOrder: 'asc',
  },
};

export function getPostSortQuery(
  filter: FilterSortOption,
): PostSortQuery {
  return POST_SORT_QUERY_MAP[filter];
}

export function isFilterSortOption(
  value: string | null,
): value is FilterSortOption {
  return (
    value === 'latest' ||
    value === 'oldest' ||
    value === 'mostViewed' ||
    value === 'mostLiked' ||
    value === 'titleAsc'
  );
}

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
  showFilters = true;

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

  readonly filterOptions: Array<{
    key: FilterSortOption;
    translationKey: string;
    icon: string;
  }> = [
      {
        key: 'latest',
        translationKey:
          'filter.latest',
        icon:
          'bi bi-clock-history',
      },
      {
        key: 'oldest',
        translationKey:
          'filter.oldest',
        icon:
          'bi bi-sort-down-alt',
      },
      {
        key: 'mostViewed',
        translationKey:
          'filter.most_viewed',
        icon:
          'bi bi-eye',
      },
      {
        key: 'mostLiked',
        translationKey:
          'filter.most_liked',
        icon:
          'bi bi-heart',
      },
      {
        key: 'titleAsc',
        translationKey:
          'filter.title_asc',
        icon:
          'bi bi-sort-alpha-down',
      },
    ];

  selectFilter(
    key: FilterSortOption,
  ): void {
    if (
      key === this.activeFilter
    ) {
      return;
    }

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