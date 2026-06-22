import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';

import { SupabaseService } from './supabase.service';

/** Estados de una reserva (alineados con el check de la tabla `bookings`). */
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';

/** Datos para crear una reserva. El estudiante sale de la sesión (auth.uid()). */
export interface CreateBookingInput {
  teacherId: string;
  date: string;
  hour: string;
  message?: string | null;
}

export interface CreatedBooking {
  id: string;
  status: BookingStatus;
}

/** Vista de una reserva del estudiante para "Mis solicitudes". */
export interface BookingRequestView {
  id: string;
  teacherName: string;
  date: string;
  hour: string;
  status: BookingStatus;
  message: string | null;
  createdAt: string;
}

/**
 * Reservas sobre Supabase. Los datos del estudiante viven en `profiles`, por lo
 * que la tabla `bookings` solo referencia al alumno (`student_id`, por defecto
 * `auth.uid()`) y al tutor; aquí no se duplican.
 */
@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly supabase = inject(SupabaseService).client;

  /** Crea una solicitud `pending`. `student_id` lo pone la BD (default auth.uid()). */
  createBooking(input: CreateBookingInput): Observable<CreatedBooking> {
    return from(this.insertBooking(input));
  }

  /** Reservas del estudiante autenticado (RLS limita a las propias). */
  getMyRequests(): Observable<BookingRequestView[]> {
    return from(this.fetchMyRequests());
  }

  /** Cancela una reserva propia. */
  cancelBooking(id: string): Observable<void> {
    return from(this.updateStatus(id, 'cancelled'));
  }

  private async insertBooking(
    input: CreateBookingInput
  ): Promise<CreatedBooking> {
    const { data, error } = await this.supabase
      .from('bookings')
      .insert({
        teacher_id: input.teacherId,
        date: input.date,
        hour: input.hour,
        message: input.message ?? null,
      })
      .select('id, status')
      .single();

    if (error) {
      throw error;
    }
    return data as CreatedBooking;
  }

  private async fetchMyRequests(): Promise<BookingRequestView[]> {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(
        'id, date, hour, status, message, created_at, teacher:teachers ( profile:profiles ( full_name ) )'
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      teacherName: row.teacher?.profile?.full_name ?? 'Tutor',
      date: row.date,
      hour: row.hour,
      status: row.status as BookingStatus,
      message: row.message ?? null,
      createdAt: row.created_at,
    }));
  }

  private async updateStatus(id: string, status: BookingStatus): Promise<void> {
    const { error } = await this.supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
}
