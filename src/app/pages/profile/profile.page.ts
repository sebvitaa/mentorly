import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonText,
  ToastController,
} from '@ionic/angular/standalone';

import { HeaderComponent } from '../../components/header/header.component';
import { TutorEditorComponent } from '../../components/tutor-editor/tutor-editor.component';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { AcademicCatalogApiService } from '../../api/academic-catalog-api.service';
import {
  CampusDto,
  CareerDto,
  FacultyDto,
} from '../../api/dtos/academic-catalog.dto';
import { ProfileView, TeacherStatus } from '../../models/profile.model';

interface EditForm {
  fullName: string;
  admissionYear: string;
  campusId: string;
  facultyId: string;
  careerId: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    FormsModule,
    HeaderComponent,
    TutorEditorComponent,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonText,
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly academicCatalog = inject(AcademicCatalogApiService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  profile: ProfileView | null = null;
  isLoading = true;

  // --- Edición de datos personales/académicos ---
  isEditing = false;
  isSaving = false;
  readonly currentYear = new Date().getFullYear();
  editForm: EditForm = this.emptyEditForm();
  campuses: CampusDto[] = [];
  faculties: FacultyDto[] = [];
  careers: CareerDto[] = [];

  ngOnInit(): void {
    this.loadProfile();
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    await this.router.navigate(['/home']);
  }

  onTutorSaved(status: TeacherStatus): void {
    if (this.profile) {
      this.profile = { ...this.profile, teacherStatus: status };
    }
  }

  // --- Edición ---------------------------------------------------------------

  startEdit(): void {
    if (!this.profile) {
      return;
    }
    this.editForm = {
      fullName: this.profile.fullName,
      admissionYear: this.profile.admissionYear,
      campusId: this.profile.campusId,
      facultyId: this.profile.facultyId,
      careerId: this.profile.careerId,
    };
    this.isEditing = true;

    this.academicCatalog.getCampuses().subscribe((campuses) => {
      this.campuses = campuses;
    });
    if (this.editForm.campusId) {
      this.academicCatalog
        .getFaculties(this.editForm.campusId)
        .subscribe((faculties) => (this.faculties = faculties));
    }
    if (this.editForm.campusId && this.editForm.facultyId) {
      this.academicCatalog
        .getCareers({
          campusId: this.editForm.campusId,
          facultyId: this.editForm.facultyId,
        })
        .subscribe((careers) => (this.careers = careers));
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
  }

  onCampusChange(): void {
    this.editForm.facultyId = '';
    this.editForm.careerId = '';
    this.faculties = [];
    this.careers = [];
    if (this.editForm.campusId) {
      this.academicCatalog
        .getFaculties(this.editForm.campusId)
        .subscribe((faculties) => (this.faculties = faculties));
    }
  }

  onFacultyChange(): void {
    this.editForm.careerId = '';
    this.careers = [];
    if (this.editForm.campusId && this.editForm.facultyId) {
      this.academicCatalog
        .getCareers({
          campusId: this.editForm.campusId,
          facultyId: this.editForm.facultyId,
        })
        .subscribe((careers) => (this.careers = careers));
    }
  }

  async saveEdit(): Promise<void> {
    if (this.isSaving) {
      return;
    }

    if (!this.editForm.fullName.trim()) {
      await this.presentToast('El nombre no puede estar vacío.', 'danger');
      return;
    }
    if (!this.isAdmissionYearValid()) {
      await this.presentToast(
        `El año de ingreso debe estar entre 1920 y ${this.currentYear}.`,
        'danger'
      );
      return;
    }
    if (
      !this.editForm.campusId ||
      !this.editForm.facultyId ||
      !this.editForm.careerId
    ) {
      await this.presentToast('Selecciona campus, facultad y carrera.', 'danger');
      return;
    }

    const careerName =
      this.careers.find((c) => c.id === this.editForm.careerId)?.name ?? '';

    this.isSaving = true;
    this.profileService
      .updateMyProfile({
        fullName: this.editForm.fullName.trim(),
        admissionYear: String(this.editForm.admissionYear ?? '').trim(),
        campusId: this.editForm.campusId,
        facultyId: this.editForm.facultyId,
        careerId: this.editForm.careerId,
        careerName,
      })
      .subscribe({
        next: async () => {
          this.isSaving = false;
          this.isEditing = false;
          this.applyEditToProfile(careerName);
          await this.presentToast('Perfil actualizado.', 'primary');
        },
        error: async (err) => {
          this.isSaving = false;
          console.error('[profile] updateMyProfile falló', err);
          await this.presentToast(
            'No se pudo actualizar el perfil. Intenta nuevamente.',
            'danger'
          );
        },
      });
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

  private applyEditToProfile(careerName: string): void {
    if (!this.profile) {
      return;
    }
    this.profile = {
      ...this.profile,
      fullName: this.editForm.fullName.trim(),
      admissionYear: String(this.editForm.admissionYear ?? '').trim(),
      campusId: this.editForm.campusId,
      campusName:
        this.campuses.find((c) => c.id === this.editForm.campusId)?.name ??
        this.profile.campusName,
      facultyId: this.editForm.facultyId,
      facultyName:
        this.faculties.find((f) => f.id === this.editForm.facultyId)?.name ??
        this.profile.facultyName,
      careerId: this.editForm.careerId,
      careerName,
    };
  }

  private isAdmissionYearValid(): boolean {
    const year = Number(String(this.editForm.admissionYear ?? '').trim());
    return Number.isInteger(year) && year >= 1920 && year <= this.currentYear;
  }

  private emptyEditForm(): EditForm {
    return {
      fullName: '',
      admissionYear: '',
      campusId: '',
      facultyId: '',
      careerId: '',
    };
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
