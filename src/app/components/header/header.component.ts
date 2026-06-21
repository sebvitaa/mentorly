import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonButton, IonButtons, IonHeader, IonTitle, IonToolbar, RouterLink, AsyncPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user$ = this.authService.user$;

  async logout(): Promise<void> {
    this.authService.logout().subscribe(async () => {
      await this.router.navigate(['/home']);
    });
  }
}
