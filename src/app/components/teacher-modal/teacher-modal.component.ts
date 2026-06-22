import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import {
  IonButton,
  IonModal,
  ToastController,
} from '@ionic/angular/standalone';

import { Teacher } from '../../models/teacher.model';
import { ScheduleCalendarComponent } from '../schedule-calendar/schedule-calendar.component';
import { getInitials, formatLongDate } from '../../utils/format.util';
import { FavoritesService } from '../../services/favorites.service';
import { TeacherContact, TeacherService } from '../../services/teacher.service';

@Component({
  selector: 'app-teacher-modal',
  standalone: true,
  imports: [IonButton, IonModal, ScheduleCalendarComponent],
  templateUrl: './teacher-modal.component.html',
  styleUrl: './teacher-modal.component.scss',
})
export class TeacherModalComponent {
  private readonly favoritesService = inject(FavoritesService);
  private readonly toastController = inject(ToastController);
  private readonly teacherService = inject(TeacherService);

  private _teacher: Teacher | null = null;

  @Input()
  set teacher(value: Teacher | null) {
    this._teacher = value;
    this.loadContact(value);
  }
  get teacher(): Teacher | null {
    return this._teacher;
  }

  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  /** Contacto del tutor, si está permitido verlo (público o reserva confirmada). */
  contact: TeacherContact | null = null;

  readonly getInitials = getInitials;
  readonly formatLongDate = formatLongDate;

  close(): void {
    this.closed.emit();
  }

  /** Filled/empty star counts for a 0–5 rating. */
  starsFor(rating: number, total = 5): { full: number[]; empty: number[] } {
    const full = Math.floor(rating);
    return {
      full: Array.from({ length: full }),
      empty: Array.from({ length: total - full }),
    };
  }

  isFavorite(): boolean {
    return this.teacher ? this.favoritesService.isFavorite(this.teacher.id) : false;
  }

  async toggleFavorite(): Promise<void> {
    if (!this.teacher) {
      return;
    }

    const isFavorite = this.favoritesService.toggleFavorite(this.teacher);
    const toast = await this.toastController.create({
      message: isFavorite
        ? `${this.teacher.name} guardado en favoritos.`
        : `${this.teacher.name} eliminado de favoritos.`,
      duration: 1800,
      color: 'primary',
      position: 'bottom',
    });
    await toast.present();
  }

  private loadContact(teacher: Teacher | null): void {
    this.contact = null;
    if (!teacher) {
      return;
    }
    this.teacherService.getTeacherContact(teacher.id).subscribe({
      next: (contact) => (this.contact = contact),
      error: () => (this.contact = null),
    });
  }
}
