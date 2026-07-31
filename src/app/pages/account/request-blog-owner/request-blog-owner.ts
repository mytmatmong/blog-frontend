import { Component, inject } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-request-blog-owner',
  imports: [TranslatePipe],
  templateUrl: './request-blog-owner.html',
  styleUrl: './request-blog-owner.css',
})
export class RequestBlogOwner {
  protected readonly ts = inject(TranslationService);
}
