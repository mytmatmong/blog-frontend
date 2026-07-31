import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-public-sidebar-right',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './public-sidebar-right.html',
  styleUrl: './public-sidebar-right.css',
})
export class PublicSidebarRight {}
