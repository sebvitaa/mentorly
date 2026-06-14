import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';

import { Teacher } from '../../models/teacher.model';
import { ScheduleCalendarComponent } from '../schedule-calendar/schedule-calendar.component';
import { getInitials, formatLongDate } from '../../utils/format.util';

@Component({
  selector: 'app-teacher-modal',
  standalone: true,
  imports: [IonModal, ScheduleCalendarComponent],
  templateUrl: './teacher-modal.component.html',
  styleUrl: './teacher-modal.component.scss',
})
export class TeacherModalComponent {
  @Input() teacher: Teacher | null = null;
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

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

  contact(): void {
    if (!this.teacher) {
      return;
    }
    const { type, value } = this.teacher.contact;
    const href =
      type === 'email' ? `mailto:${value}` : `tel:${value.replace(/\s+/g, '')}`;
    window.open(href, '_self');
  }
}
