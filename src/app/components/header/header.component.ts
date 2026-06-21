import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  imports: [IonButton, IonButtons, IonHeader, IonTitle, IonToolbar, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /** Usuario actual (signal) y su nombre para mostrar. */
  readonly user = this.authService.user;
  readonly displayName = computed(() => {
    const metadata = this.user()?.user_metadata ?? {};
    return (metadata['full_name'] as string | undefined)?.trim() || 'Mi cuenta';
  });

  async logout(): Promise<void> {
    await this.authService.signOut();
    await this.router.navigate(['/home']);
  }
}
