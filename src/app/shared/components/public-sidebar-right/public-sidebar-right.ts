import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { PublicApiService } from '../../../core/services/public-api.service';
import { TranslationService } from '../../../core/services/translation.service';
import {
  takeUntilDestroyed,
  toObservable,
} from '@angular/core/rxjs-interop';

import {
  distinctUntilChanged,
  skip,
} from 'rxjs';

import {
  PublicPost,
  TopAuthor,
  TopTagItem,
} from '../../../core/models/post.model';

import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-public-sidebar-right',
  imports: [
    RouterLink,
    TranslatePipe,
  ],
  templateUrl:
    './public-sidebar-right.html',
  styleUrl:
    './public-sidebar-right.css',
})
export class PublicSidebarRight
  implements OnInit {
  private readonly publicApiService =
    inject(PublicApiService);

  private readonly translationService =
    inject(TranslationService);

  readonly topAuthors =
    signal<TopAuthor[]>([]);

  readonly topPosts =
    signal<PublicPost[]>([]);

  readonly topTags =
    signal<TopTagItem[]>([]);

  readonly isLoadingAuthors =
    signal(false);

  readonly isLoadingPosts =
    signal(false);

  readonly isLoadingTags =
    signal(false);

  ngOnInit(): void {
    this.loadTopAuthors();
    this.loadTopPosts();
    this.loadTopTags();
  }

  constructor() {
    toObservable(
      this.translationService.currentLang,
    )
      .pipe(
        skip(1),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.loadTopPosts();
        this.loadTopTags();
      });
  }

  loadTopAuthors(): void {
    this.isLoadingAuthors.set(true);

    this.publicApiService
      .getTopAuthors(5)
      .subscribe({
        next: (response) => {
          this.topAuthors.set(
            response.data,
          );

          this.isLoadingAuthors.set(false);
        },

        error: () => {
          /**
           * Không dùng fallback giả.
           */
          this.topAuthors.set([]);
          this.isLoadingAuthors.set(false);
        },
      });
  }

  loadTopPosts(): void {
    this.isLoadingPosts.set(true);

    this.publicApiService
      .getTopPosts(
        5,
        this.currentLanguageCode(),
      )
      .subscribe({
        next: (response) => {
          this.topPosts.set(
            response.data,
          );

          this.isLoadingPosts.set(false);
        },

        error: () => {
          this.topPosts.set([]);
          this.isLoadingPosts.set(false);
        },
      });
  }

  loadTopTags(): void {
    this.isLoadingTags.set(true);

    this.publicApiService
      .getTopTags(
        6,
        this.currentLanguageCode(),
      )
      .subscribe({
        next: (response) => {
          this.topTags.set(
            response.data,
          );

          this.isLoadingTags.set(false);
        },

        error: () => {
          this.topTags.set([]);
          this.isLoadingTags.set(false);
        },
      });
  }

  getAvatarInitial(
    name?: string | null,
  ): string {
    return (
      name
        ?.charAt(0)
        .toUpperCase() || 'U'
    );
  }

  private currentLanguageCode(): string {
    return this.translationService
      .currentLang()
      .toLowerCase();
  }
}