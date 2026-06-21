import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCheckbox,
  IonInput,
  IonItem,
  IonNote,
  IonTextarea,
  ToastController,
} from '@ionic/angular/standalone';

import { DayAvailability } from '../../models/teacher.model';
import { BookingApiService } from '../../api/booking-api.service';
import { RequestHistoryService } from '../../services/request-history.service';
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
    IonButton,
    IonCheckbox,
    IonInput,
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
  private readonly bookingApi = inject(BookingApiService);
  private readonly requestHistory = inject(RequestHistoryService);

  readonly getDayName = getDayName;
  readonly getDayNumber = getDayNumber;
  readonly formatFullDate = formatFullDate;

  isOpen = false;
  selectedDay: DayAvailability | null = null;
  selectedTime: string | null = null;
  isBooking = false;
  formSubmitted = false;
  bookingForm = this.createEmptyBookingForm();
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
      this.selectedDay = null;
      this.selectedTime = null;
      this.formSubmitted = false;
      this.integrityAccepted = false;
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
    if (!this.teacherId || !this.selectedDay || !this.selectedTime || this.isBooking) {
      return;
    }

    this.formSubmitted = true;
    if (!this.isFormValid()) {
      await this.presentToast(
        'Completa los datos requeridos, usa correo @udd.cl y acepta la regla de uso.',
        'danger'
      );
      return;
    }

    const date = this.selectedDay.date;
    const hour = this.selectedTime;

    this.isBooking = true;
    this.bookingApi
      .createBooking({
        teacher_id: this.teacherId,
        date,
        hour,
        student_first_name: this.bookingForm.firstName.trim(),
        student_last_name: this.bookingForm.lastName.trim(),
        student_career: this.bookingForm.career.trim(),
        student_current_year: this.bookingForm.currentYear.trim(),
        student_email: this.bookingForm.email.trim(),
        message: this.bookingForm.message.trim() || null,
      })
      .subscribe({
        next: async (booking) => {
          this.requestHistory.saveRequest({
            id: booking.id,
            teacherId: booking.teacher_id,
            teacherName: this.teacherName,
            date: booking.date,
            hour: booking.hour,
            status: booking.status,
            studentFirstName: booking.student_first_name,
            studentLastName: booking.student_last_name,
            studentEmail: booking.student_email,
            career: booking.student_career,
            currentYear: booking.student_current_year,
            message: booking.message,
            createdAt: booking.created_at,
          });
          this.markSlotAsUnavailable(date, hour);
          await this.presentToast(
            `Solicitud enviada: ${formatFullDate(date)} a las ${hour}. Queda pendiente de confirmacion del tutor.`,
            'primary'
          );
          this.isOpen = false;
          this.selectedDay = null;
          this.selectedTime = null;
          this.formSubmitted = false;
          this.bookingForm = this.createEmptyBookingForm();
          this.integrityAccepted = false;
          this.isBooking = false;
        },
        error: async () => {
          await this.presentToast(
            'No se pudo confirmar la hora. Intenta con otro bloque.',
            'danger'
          );
          this.isBooking = false;
        },
      });
  }

  isFieldInvalid(field: keyof BookingRequestForm): boolean {
    if (!this.formSubmitted) {
      return false;
    }

    const value = this.bookingForm[field].trim();
    if (field === 'message') {
      return false;
    }

    if (field === 'email') {
      return !this.isUddEmail(value);
    }

    return !value;
  }

  get hasFormErrors(): boolean {
    return (
      this.isFieldInvalid('firstName') ||
      this.isFieldInvalid('lastName') ||
      this.isFieldInvalid('career') ||
      this.isFieldInvalid('currentYear') ||
      this.isFieldInvalid('email')
    );
  }

  get isIntegrityInvalid(): boolean {
    return this.formSubmitted && !this.integrityAccepted;
  }

  private isFormValid(): boolean {
    return (
      !!this.bookingForm.firstName.trim() &&
      !!this.bookingForm.lastName.trim() &&
      !!this.bookingForm.career.trim() &&
      !!this.bookingForm.currentYear.trim() &&
      this.isUddEmail(this.bookingForm.email.trim()) &&
      this.integrityAccepted
    );
  }

  private isUddEmail(email: string): boolean {
    return /^[^\s@]+@udd\.cl$/i.test(email);
  }

  private markSlotAsUnavailable(date: string, hour: string): void {
    const slot = this.availability
      .find((day) => day.date === date)
      ?.timeSlots.find((timeSlot) => timeSlot.hour === hour);
    if (slot) {
      slot.available = false;
    }
  }

  private createEmptyBookingForm(): BookingRequestForm {
    return {
      firstName: '',
      lastName: '',
      career: '',
      currentYear: '',
      email: '',
      message: '',
    };
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

interface BookingRequestForm {
  firstName: string;
  lastName: string;
  career: string;
  currentYear: string;
  email: string;
  message: string;
}
