import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonCheckbox,
  IonItem,
  IonNote,
  IonTextarea,
  ToastController,
} from '@ionic/angular/standalone';

import { DayAvailability } from '../../models/teacher.model';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import {
  formatFullDate,
  getDayName,
  getDayNumber,
} from '../../utils/format.util';

@Component({
  selector: 'app-schedule-calendar',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    IonButton,
    IonCheckbox,
    IonItem,
    IonNote,
    IonTextarea,
  ],
  templateUrl: './schedule-calendar.component.html',
  styleUrl: './schedule-calendar.component.scss',
})
export class ScheduleCalendarComponent implements OnInit {
  @Input({ required: true }) teacherId = '';
  @Input({ required: true }) teacherName = '';
  @Input() availability: DayAvailability[] = [];

  private readonly toastController = inject(ToastController);
  private readonly bookingService = inject(BookingService);
  private readonly authService = inject(AuthService);

  /** ¿Hay sesión iniciada? Controla si se muestra el formulario o el aviso. */
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  readonly getDayName = getDayName;
  readonly getDayNumber = getDayNumber;
  readonly formatFullDate = formatFullDate;

  isOpen = false;
  selectedDay: DayAvailability | null = null;
  selectedTime: string | null = null;
  isBooking = false;
  formSubmitted = false;
  message = '';
  integrityAccepted = false;

  /** Calendar window: every date from today through two weeks out. */
  allDates: string[] = [];

  ngOnInit(): void {
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);

    for (
      const d = new Date(today);
      d <= twoWeeksLater;
      d.setDate(d.getDate() + 1)
    ) {
      this.allDates.push(new Date(d).toISOString().split('T')[0]);
    }
  }

  /** Days that have at least one open time slot. */
  get availableDates(): DayAvailability[] {
    return this.availability.filter((day) =>
      day.timeSlots.some((slot) => slot.available)
    );
  }

  dayFor(dateString: string): DayAvailability | undefined {
    return this.availableDates.find((d) => d.date === dateString);
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.resetSelection();
    }
  }

  selectDay(day: DayAvailability | undefined): void {
    if (!day) {
      return;
    }
    this.selectedDay = day;
    this.selectedTime = null;
  }

  selectTime(hour: string): void {
    this.selectedTime = hour;
    this.formSubmitted = false;
  }

  async confirm(): Promise<void> {
    if (
      !this.teacherId ||
      !this.selectedDay ||
      !this.selectedTime ||
      this.isBooking
    ) {
      return;
    }

    this.formSubmitted = true;
    if (!this.integrityAccepted) {
      await this.presentToast(
        'Debes aceptar la regla de uso responsable para enviar la solicitud.',
        'danger'
      );
      return;
    }

    const date = this.selectedDay.date;
    const hour = this.selectedTime;

    this.isBooking = true;
    this.bookingService
      .createBooking({
        teacherId: this.teacherId,
        date,
        hour,
        message: this.message.trim() || null,
      })
      .subscribe({
        next: async () => {
          this.markSlotAsUnavailable(date, hour);
          await this.presentToast(
            `Solicitud enviada: ${formatFullDate(date)} a las ${hour}. Queda pendiente de confirmación del tutor.`,
            'primary'
          );
          this.isOpen = false;
          this.resetSelection();
          this.isBooking = false;
        },
        error: async () => {
          await this.presentToast(
            'No se pudo enviar la solicitud. Intenta nuevamente.',
            'danger'
          );
          this.isBooking = false;
        },
      });
  }

  get isIntegrityInvalid(): boolean {
    return this.formSubmitted && !this.integrityAccepted;
  }

  private markSlotAsUnavailable(date: string, hour: string): void {
    const slot = this.availability
      .find((day) => day.date === date)
      ?.timeSlots.find((timeSlot) => timeSlot.hour === hour);
    if (slot) {
      slot.available = false;
    }
  }

  private resetSelection(): void {
    this.selectedDay = null;
    this.selectedTime = null;
    this.formSubmitted = false;
    this.message = '';
    this.integrityAccepted = false;
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
