import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonLabel,
  IonNote,
  ToastController,
} from '@ionic/angular/standalone';

import { AuthService } from '../../services/auth.service';
import { RateLimitError } from '../../utils/rate-limiter';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonInput,
    IonNote,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  form = {
    email: '',
    password: '',
  };
  formSubmitted = false;
  isLoggingIn = false;

  async submit(): Promise<void> {
    if (this.isLoggingIn) {
      return;
    }

    this.formSubmitted = true;

    if (!this.isFormValid()) {
      await this.presentToast('Ingresa tu correo UDD y contraseña.', 'danger');
      return;
    }

    this.isLoggingIn = true;

    try {
      const { error } = await this.authService.signIn(
        this.form.email.trim().toLowerCase(),
        this.form.password
      );

      if (error) {
        await this.presentToast('Correo o contraseña incorrectos.', 'danger');
        this.isLoggingIn = false;
        return;
      }

      await this.presentToast('Sesión iniciada.', 'primary');
      await this.router.navigate(['/home']);
    } catch (err) {
      const message =
        err instanceof RateLimitError
          ? err.message
          : 'No se pudo iniciar sesión. Intenta más tarde.';
      await this.presentToast(message, 'danger');
      this.isLoggingIn = false;
    }
  }

  isFieldInvalid(field: 'email' | 'password'): boolean {
    if (!this.formSubmitted) {
      return false;
    }

    if (field === 'email') {
      return !this.isUddEmail(this.form.email.trim());
    }

    return !this.form.password;
  }

  get hasFormErrors(): boolean {
    return this.isFieldInvalid('email') || this.isFieldInvalid('password');
  }

  private isFormValid(): boolean {
    return (
      this.isUddEmail(this.form.email.trim()) &&
      !!this.form.password
    );
  }

  private isUddEmail(email: string): boolean {
    return /^[^\s@]+@udd\.cl$/i.test(email);
  }

  private async presentToast(
    message: string,
    color: 'primary' | 'danger'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
