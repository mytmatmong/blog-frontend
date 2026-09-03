import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { PublicHeader } from '../../shared/components/public-header/public-header';
import { PublicFooter } from '../../shared/components/public-footer/public-footer';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, PublicHeader, PublicFooter],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
})
export class PublicLayout {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects || event.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly isAuthPage = computed(() => {
    const url = this.currentUrl() || '';
    return url.startsWith('/auth') || url.includes('/auth');
  });
}
