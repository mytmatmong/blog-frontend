import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublicHeader } from '../../shared/components/public-header/public-header';
import { PublicFooter } from '../../shared/components/public-footer/public-footer';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, PublicHeader, PublicFooter],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css',
})
export class PublicLayout {}
