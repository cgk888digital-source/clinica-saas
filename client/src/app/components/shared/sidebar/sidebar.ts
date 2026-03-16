import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../../services/language.service';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { APP_VERSION } from '../../../api-config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  version = APP_VERSION;
  constructor(
    public langService: LanguageService,
    public authService: AuthService
  ) {}
}
