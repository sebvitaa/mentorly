import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { BookingDto, CreateBookingDto } from './dtos/booking.dto';

@Injectable({ providedIn: 'root' })
export class BookingApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  createBooking(payload: CreateBookingDto): Observable<BookingDto> {
    if (!this.baseUrl && environment.useMocks) {
      return of({
        id: crypto.randomUUID(),
        status: 'confirmed',
        teacher_id: payload.teacherId,
        teacher_name: 'Tutor mock',
        date: payload.date,
        hour: payload.hour,
        student_name: payload.studentName ?? 'Estudiante UDD',
        student_email: payload.studentEmail ?? null,
        created_at: new Date().toISOString(),
      });
    }

    return this.http.post<BookingDto>(`${this.baseUrl}/bookings`, payload);
  }
}
