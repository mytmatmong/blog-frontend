import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicApiService } from '../../../core/services/public-api.service';
import { PublicPost, TopAuthor, TopTagItem } from '../../../core/models/post.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-public-sidebar-right',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './public-sidebar-right.html',
  styleUrl: './public-sidebar-right.css',
})
export class PublicSidebarRight implements OnInit {
  private readonly publicApiService = inject(PublicApiService);

  topAuthors = signal<TopAuthor[]>([]);
  topPosts = signal<PublicPost[]>([]);
  topTags = signal<TopTagItem[]>([]);
  isLoadingAuthors = signal<boolean>(false);
  isLoadingPosts = signal<boolean>(false);
  isLoadingTags = signal<boolean>(false);

  ngOnInit() {
    this.loadTopAuthors();
    this.loadTopPosts();
    this.loadTopTags();
  }

  loadTopAuthors() {
    this.isLoadingAuthors.set(true);
    this.publicApiService.getTopAuthors(5).subscribe({
      next: (res) => {
        this.isLoadingAuthors.set(false);
        if (res.success && res.data) {
          this.topAuthors.set(res.data);
        }
      },
      error: () => {
        this.isLoadingAuthors.set(false);
      }
    });
  }

  loadTopPosts() {
    this.isLoadingPosts.set(true);
    this.publicApiService.getTopPosts(5).subscribe({
      next: (res) => {
        this.isLoadingPosts.set(false);
        if (res.success && res.data) {
          this.topPosts.set(res.data);
        }
      },
      error: () => {
        this.isLoadingPosts.set(false);
      }
    });
  }

  loadTopTags() {
    this.isLoadingTags.set(true);
    this.publicApiService.getTopTags(6).subscribe({
      next: (res) => {
        this.isLoadingTags.set(false);
        if (res.success && res.data) {
          this.topTags.set(res.data);
        }
      },
      error: () => {
        this.isLoadingTags.set(false);
      }
    });
  }

  getAvatarInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : 'U';
  }
}
