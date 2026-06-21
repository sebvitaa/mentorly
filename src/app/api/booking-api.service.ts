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
        status: 'pending',
        student_id: 'mock-student',
        teacher_id: payload.teacher_id,
        teacher_name: 'Tutor mock',
        subject_id: payload.subject_id ?? null,
        date: payload.date,
        hour: payload.hour,
        student_first_name: payload.student_first_name,
        student_last_name: payload.student_last_name,
        student_campus_id: payload.student_campus_id,
        student_faculty_id: payload.student_faculty_id,
        student_career_id: payload.student_career_id,
        student_career: 'Carrera mock',
        student_admission_year: payload.student_admission_year,
        student_email: payload.student_email,
        message: payload.message ?? null,
        tutor_response_message: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        confirmed_at: null,
        cancelled_at: null,
      });
    }

    return this.http.post<BookingDto>(`${this.baseUrl}/bookings`, payload);
  }

  acceptBooking(id: string, message?: string): Observable<BookingDto> {
    return this.http.patch<BookingDto>(`${this.baseUrl}/bookings/${id}/accept`, {
      message,
    });
  }

  rejectBooking(id: string, message?: string): Observable<BookingDto> {
    return this.http.patch<BookingDto>(`${this.baseUrl}/bookings/${id}/reject`, {
      message,
    });
  }

  cancelBooking(id: string, reason?: string): Observable<BookingDto> {
    return this.http.patch<BookingDto>(`${this.baseUrl}/bookings/${id}/cancel`, {
      reason,
    });
  }
}
