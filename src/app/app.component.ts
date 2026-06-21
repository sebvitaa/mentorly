import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class AppComponent {
  // Se inyecta para instanciar AuthService al arrancar: su constructor hidrata
  // la sesión guardada (Supabase `getSession`) y se suscribe a los cambios de
  // estado de autenticación. No hace falta un restoreSession() manual.
  private readonly authService = inject(AuthService);
}
