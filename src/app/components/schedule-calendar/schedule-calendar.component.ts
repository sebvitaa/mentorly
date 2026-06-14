import { Component, Input, OnInit, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

import { DayAvailability } from '../../models/teacher.model';
import {
  formatFullDate,
  getDayName,
  getDayNumber,
} from '../../utils/format.util';

@Component({
  selector: 'app-schedule-calendar',
  standalone: true,
  templateUrl: './schedule-calendar.component.html',
  styleUrl: './schedule-calendar.component.scss',
})
export class ScheduleCalendarComponent implements OnInit {
  @Input() availability: DayAvailability[] = [];

  private readonly toastController = inject(ToastController);

  readonly getDayName = getDayName;
  readonly getDayNumber = getDayNumber;
  readonly formatFullDate = formatFullDate;

  isOpen = false;
  selectedDay: DayAvailability | null = null;
  selectedTime: string | null = null;

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
  }

  async confirm(): Promise<void> {
    if (!this.selectedDay || !this.selectedTime) {
      return;
    }
    const toast = await this.toastController.create({
      message: `Hora confirmada: ${formatFullDate(this.selectedDay.date)} a las ${this.selectedTime}`,
      duration: 2500,
      color: 'primary',
      position: 'bottom',
    });
    await toast.present();
    this.isOpen = false;
  }
}
