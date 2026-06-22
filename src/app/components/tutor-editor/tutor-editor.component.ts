import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCheckbox,
  IonInput,
  IonItem,
  IonModal,
  IonNote,
  IonSpinner,
  IonTextarea,
  ToastController,
} from '@ionic/angular/standalone';

import { Subject } from '../../models/subject.model';
import { TeacherStatus } from '../../models/profile.model';
import { WeeklySlot } from '../../models/tutor-profile.model';
import { SubjectService } from '../../services/subject.service';
import { TutorProfileService } from '../../services/tutor-profile.service';

interface Weekday {
  /** 1=Lun … 7=Dom (ISO). */
  value: number;
  label: string;
}

/**
 * Editor del perfil tutor: precio, ramos, contacto y disponibilidad semanal.
 * Al guardar, la base decide si queda publicado (`active`) o `incomplete`.
 */
@Component({
  selector: 'app-tutor-editor',
  standalone: true,
  imports: [
    FormsModule,
    IonButton,
    IonCheckbox,
    IonInput,
    IonItem,
    IonModal,
    IonNote,
    IonSpinner,
    IonTextarea,
  ],
  templateUrl: './tutor-editor.component.html',
  styleUrl: './tutor-editor.component.scss',
})
export class TutorEditorComponent implements OnInit {
  /** Correo de la cuenta, usado como valor de contacto por defecto. */
  @Input() accountEmail = '';
  /** Emite el nuevo estado tras publicar/guardar, para refrescar el perfil. */
  @Output() saved = new EventEmitter<TeacherStatus>();

  private readonly subjectService = inject(SubjectService);
  private readonly tutorProfile = inject(TutorProfileService);
  private readonly toastController = inject(ToastController);

  /** Días de la semana (lunes a domingo). */
  readonly weekdays: Weekday[] = [
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mié' },
    { value: 4, label: 'Jue' },
    { value: 5, label: 'Vie' },
    { value: 6, label: 'Sáb' },
    { value: 7, label: 'Dom' },
  ];

  /** Bloques horarios seleccionables: 09:00 … 20:00 (la jornada va de 9 a 21). */
  readonly hours: string[] = Array.from({ length: 12 }, (_, i) =>
    `${String(9 + i).padStart(2, '0')}:00`
  );

  subjects: Subject[] = [];
  selectedSubjectIds: string[] = [];

  // --- Selector de ramos (modal) ---
  subjectsModalOpen = false;
  subjectSearch = '';
  newSubjectName = '';
  newSubjectDetail = '';
  isAddingSubject = false;

  about = '';
  priceMin: number | null = null;
  priceMax: number | null = null;

  // Contacto dual (no excluyente) + visibilidad.
  contactEmail = '';
  contactPhone = '';
  showContact = false;

  /** Celdas marcadas, como claves "weekday|hour". */
  private readonly selectedCells = new Set<string>();

  isLoading = true;
  isSaving = false;

  ngOnInit(): void {
    this.subjectService.getSubjects().subscribe({
      next: (subjects) => (this.subjects = subjects),
    });

    this.tutorProfile.getMyTutorProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.about = profile.about;
          this.priceMin = profile.priceMin;
          this.priceMax = profile.priceMax;
          this.contactEmail = profile.contactEmail;
          this.contactPhone = profile.contactPhone;
          this.showContact = profile.showContact;
          this.selectedSubjectIds = profile.subjectIds;
          for (const slot of profile.slots) {
            this.selectedCells.add(this.cellKey(slot.weekday, slot.hour));
          }
        }
        // Sugerir el correo de la cuenta si no hay contacto por correo.
        if (!this.contactEmail) {
          this.contactEmail = this.accountEmail;
        }
        this.isLoading = false;
      },
      error: async (err) => {
        this.isLoading = false;
        console.error('[tutor-editor] get_my_tutor_profile falló', err);
        await this.presentToast(
          'No se pudo cargar tu perfil tutor. Intenta nuevamente.',
          'danger'
        );
      },
    });
  }

  // --- Selector de ramos ----------------------------------------------------

  openSubjects(): void {
    this.subjectsModalOpen = true;
  }

  closeSubjects(): void {
    this.subjectsModalOpen = false;
    this.subjectSearch = '';
  }

  isSubjectSelected(id: string): boolean {
    return this.selectedSubjectIds.includes(id);
  }

  toggleSubject(id: string): void {
    this.selectedSubjectIds = this.isSubjectSelected(id)
      ? this.selectedSubjectIds.filter((s) => s !== id)
      : [...this.selectedSubjectIds, id];
  }

  /** Ramos filtrados por el buscador (ignora mayúsculas/tildes). */
  get filteredSubjects(): Subject[] {
    const needle = this.norm(this.subjectSearch);
    if (!needle) {
      return this.subjects;
    }
    return this.subjects.filter((s) => this.norm(s.name).includes(needle));
  }

  /** Resumen de ramos elegidos, para el botón. */
  get selectedSummary(): string {
    if (this.selectedSubjectIds.length === 0) {
      return 'Ningún ramo seleccionado';
    }
    const names = this.subjects
      .filter((s) => this.selectedSubjectIds.includes(s.id))
      .map((s) => s.name);
    return names.length ? names.join(', ') : `${this.selectedSubjectIds.length} ramos`;
  }

  addNewSubject(): void {
    const name = this.newSubjectName.trim();
    if (!name || this.isAddingSubject) {
      return;
    }
    this.isAddingSubject = true;
    this.subjectService.addSubject(name, this.newSubjectDetail.trim()).subscribe({
      next: async (subject) => {
        this.isAddingSubject = false;
        if (!this.subjects.some((s) => s.id === subject.id)) {
          this.subjects = [...this.subjects, subject].sort((a, b) =>
            a.name.localeCompare(b.name)
          );
        }
        if (!this.isSubjectSelected(subject.id)) {
          this.selectedSubjectIds = [...this.selectedSubjectIds, subject.id];
        }
        this.newSubjectName = '';
        this.newSubjectDetail = '';
        await this.presentToast(`Ramo "${subject.name}" agregado.`, 'primary');
      },
      error: async (err) => {
        this.isAddingSubject = false;
        console.error('[tutor-editor] add_subject falló', err);
        await this.presentToast('No se pudo agregar el ramo.', 'danger');
      },
    });
  }

  // --- Disponibilidad -------------------------------------------------------

  cellKey(weekday: number, hour: string): string {
    return `${weekday}|${hour}`;
  }

  isCellOn(weekday: number, hour: string): boolean {
    return this.selectedCells.has(this.cellKey(weekday, hour));
  }

  toggleCell(weekday: number, hour: string): void {
    const key = this.cellKey(weekday, hour);
    if (this.selectedCells.has(key)) {
      this.selectedCells.delete(key);
    } else {
      this.selectedCells.add(key);
    }
  }

  // --- Guardar --------------------------------------------------------------

  async save(): Promise<void> {
    if (this.isSaving) {
      return;
    }
    this.isSaving = true;

    const slots: WeeklySlot[] = [...this.selectedCells].map((key) => {
      const [weekday, hour] = key.split('|');
      return { weekday: Number(weekday), hour };
    });

    this.tutorProfile
      .saveTutorProfile({
        about: this.about.trim(),
        priceMin: this.priceMin,
        priceMax: this.priceMax,
        contactEmail: this.contactEmail.trim(),
        contactPhone: this.contactPhone.trim(),
        showContact: this.showContact,
        subjectIds: this.selectedSubjectIds,
        slots,
        status: 'incomplete',
      })
      .subscribe({
        next: async (status) => {
          this.isSaving = false;
          this.saved.emit(status);
          if (status === 'active') {
            await this.presentToast(
              '¡Listo! Tu perfil tutor está publicado y visible en el catálogo.',
              'primary'
            );
          } else {
            await this.presentToast(
              `Guardado. Falta para publicar: ${this.missingRequirements(slots)}.`,
              'warning'
            );
          }
        },
        error: async (err) => {
          this.isSaving = false;
          console.error('[tutor-editor] save_tutor_profile falló', err);
          const detail = err?.message ? ` (${err.message})` : '';
          await this.presentToast(
            `No se pudo guardar tu perfil tutor. Intenta nuevamente.${detail}`,
            'danger'
          );
        },
      });
  }

  /** Lista legible de lo que falta para publicar. */
  private missingRequirements(slots: WeeklySlot[]): string {
    const missing: string[] = [];
    if (this.priceMin === null || this.priceMax === null) {
      missing.push('precio');
    }
    if (this.selectedSubjectIds.length === 0) {
      missing.push('al menos un ramo');
    }
    if (!this.contactEmail.trim() && !this.contactPhone.trim()) {
      missing.push('un contacto (correo o teléfono)');
    }
    if (slots.length === 0) {
      missing.push('disponibilidad');
    }
    return missing.join(', ');
  }

  private norm(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  }

  private async presentToast(
    message: string,
    color: 'primary' | 'danger' | 'warning'
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
