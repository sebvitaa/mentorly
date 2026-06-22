import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  ToastController,
} from '@ionic/angular/standalone';

import { HeaderComponent } from '../../components/header/header.component';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { ProfileView, TeacherStatus } from '../../models/profile.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    HeaderComponent,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonText,
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  profile: ProfileView | null = null;
  isLoading = true;

  ngOnInit(): void {
    this.loadProfile();
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    await this.router.navigate(['/home']);
  }

  teacherStatusLabel(status: TeacherStatus): string {
    const labels: Record<TeacherStatus, string> = {
      none: 'No ofreces tutorías',
      incomplete: 'Perfil tutor incompleto',
      pending: 'Perfil tutor en revisión',
      active: 'Tutor activo',
      inactive: 'Tutor pausado',
      rejected: 'Perfil tutor rechazado',
    };
    return labels[status];
  }

  teacherStatusColor(status: TeacherStatus): string {
    const colors: Record<TeacherStatus, string> = {
      none: 'medium',
      incomplete: 'warning',
      pending: 'primary',
      active: 'success',
      inactive: 'medium',
      rejected: 'danger',
    };
    return colors[status];
  }

  private loadProfile(): void {
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.isLoading = false;
      },
      error: async () => {
        this.isLoading = false;
        await this.presentToast(
          'No se pudo cargar tu perfil. Intenta nuevamente.',
          'danger'
        );
      },
    });
  }

  private async presentToast(
    message: string,
    color: 'primary' | 'danger'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
