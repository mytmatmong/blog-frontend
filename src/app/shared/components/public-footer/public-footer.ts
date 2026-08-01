import { Component } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-public-footer',
  imports: [TranslatePipe],
  templateUrl: './public-footer.html',
  styleUrl: './public-footer.css',
})
export class PublicFooter {}
