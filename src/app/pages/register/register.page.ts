import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonSelect,
  IonSelectOption,
  ToastController,
} from '@ionic/angular/standalone';

import { AuthService } from '../../services/auth.service';
import { AcademicCatalogApiService } from '../../api/academic-catalog-api.service';
import { CampusDto, CareerDto, FacultyDto } from '../../api/dtos/academic-catalog.dto';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    IonButton,
    IonCheckbox,
    IonContent,
    IonInput,
    IonItem,
    IonNote,
    IonSelect,
    IonSelectOption,
  ],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly academicCatalog = inject(AcademicCatalogApiService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  form = this.createEmptyForm();
  formSubmitted = false;
  isRegistering = false;

  campuses: CampusDto[] = [];
  faculties: FacultyDto[] = [];
  careers: CareerDto[] = [];

  ngOnInit(): void {
    this.academicCatalog.getCampuses().subscribe((campuses) => {
      this.campuses = campuses;
    });
  }

  onCampusChange(): void {
    const campusId = this.form.campusId;
    this.form.facultyId = '';
    this.form.careerId = '';
    this.faculties = [];
    this.careers = [];

    if (!campusId) {
      return;
    }

    this.academicCatalog.getFaculties(campusId).subscribe((faculties) => {
      this.faculties = faculties;
    });
  }

  onFacultyChange(): void {
    const campusId = this.form.campusId;
    const facultyId = this.form.facultyId;
    this.form.careerId = '';
    this.careers = [];

    if (!campusId || !facultyId) {
      return;
    }

    this.academicCatalog.getCareers({ campusId, facultyId }).subscribe((careers) => {
      this.careers = careers;
    });
  }

  async submit(): Promise<void> {
    if (this.isRegistering) {
      return;
    }

    this.formSubmitted = true;

    if (!this.isFormValid()) {
      await this.presentToast(
        'Completa los campos requeridos, selecciona tu carrera y verifica tu correo UDD.',
        'danger'
      );
      return;
    }

    if (this.form.password !== this.form.confirmPassword) {
      await this.presentToast('Las contraseñas no coinciden.', 'danger');
      return;
    }

    this.isRegistering = true;

    this.authService
      .register({
        first_name: this.form.firstName.trim(),
        last_name: this.form.lastName.trim(),
        email: this.form.email.trim().toLowerCase(),
        password: this.form.password,
        campus_id: this.form.campusId,
        faculty_id: this.form.facultyId,
        career_id: this.form.careerId,
        admission_year: this.form.admissionYear.trim(),
        wants_to_teach: this.form.wantsToTeach,
      })
      .subscribe({
        next: async () => {
          await this.presentToast('Cuenta creada. Bienvenido a Mentorly UDD.', 'primary');
          await this.router.navigate(['/home']);
        },
        error: async () => {
          await this.presentToast(
            'No se pudo crear la cuenta. Revisa tus datos o intenta con otro correo.',
            'danger'
          );
          this.isRegistering = false;
        },
      });
  }

  isFieldInvalid(field: keyof RegisterForm): boolean {
    if (!this.formSubmitted) {
      return false;
    }

    const value = this.form[field];

    if (field === 'email') {
      return !this.isUddEmail(String(value).trim());
    }

    if (field === 'password') {
      return String(value).length < 8;
    }

    if (field === 'confirmPassword') {
      return value !== this.form.password;
    }

    if (field === 'wantsToTeach') {
      return false;
    }

    return !value;
  }

  get hasFormErrors(): boolean {
    return (
      this.isFieldInvalid('firstName') ||
      this.isFieldInvalid('lastName') ||
      this.isFieldInvalid('email') ||
      this.isFieldInvalid('password') ||
      this.isFieldInvalid('confirmPassword') ||
      this.isFieldInvalid('campusId') ||
      this.isFieldInvalid('facultyId') ||
      this.isFieldInvalid('careerId') ||
      this.isFieldInvalid('admissionYear')
    );
  }

  private isFormValid(): boolean {
    return (
      !!this.form.firstName.trim() &&
      !!this.form.lastName.trim() &&
      this.isUddEmail(this.form.email.trim()) &&
      this.form.password.length >= 8 &&
      this.form.password === this.form.confirmPassword &&
      !!this.form.campusId &&
      !!this.form.facultyId &&
      !!this.form.careerId &&
      !!this.form.admissionYear.trim()
    );
  }

  private isUddEmail(email: string): boolean {
    return /^[^\s@]+@udd\.cl$/i.test(email);
  }

  private createEmptyForm(): RegisterForm {
    return {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      campusId: '',
      facultyId: '',
      careerId: '',
      admissionYear: '',
      wantsToTeach: false,
    };
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

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  campusId: string;
  facultyId: string;
  careerId: string;
  admissionYear: string;
  wantsToTeach: boolean;
}
