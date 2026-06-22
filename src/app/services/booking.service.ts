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
  teacherId: string;
  teacherName: string;
  date: string;
  hour: string;
  status: BookingStatus;
  message: string | null;
  createdAt: string;
}

/** Vista de una solicitud recibida por el tutor ("Solicitudes para ti"). */
export interface IncomingRequestView {
  id: string;
  studentName: string;
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

  /** Reservas que el estudiante autenticado envió ("Mis solicitudes"). */
  getMyRequests(): Observable<BookingRequestView[]> {
    return from(this.fetchMyRequests());
  }

  /** Solicitudes dirigidas al tutor autenticado ("Solicitudes para ti"). */
  getIncomingRequests(): Observable<IncomingRequestView[]> {
    return from(this.fetchIncomingRequests());
  }

  /** El tutor acepta una solicitud → `confirmed`. */
  acceptBooking(id: string): Observable<void> {
    return from(this.updateStatus(id, 'confirmed'));
  }

  /** El tutor rechaza una solicitud → `rejected`. */
  rejectBooking(id: string): Observable<void> {
    return from(this.updateStatus(id, 'rejected'));
  }

  /** Cancela una reserva (estudiante o tutor) → `cancelled`. */
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
    // Filtramos explícitamente por `student_id`: el tutor que además es
    // estudiante tiene RLS que también le deja ver las reservas recibidas
    // (fase-7), y esas no deben aparecer en "Mis solicitudes".
    const uid = await this.requireUid();
    const { data, error } = await this.supabase
      .from('bookings')
      .select(
        'id, teacher_id, date, hour, status, message, created_at, teacher:teachers ( profile:profiles ( full_name ) )'
      )
      .eq('student_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      teacherId: row.teacher_id,
      teacherName: row.teacher?.profile?.full_name ?? 'Tutor',
      date: row.date,
      hour: row.hour,
      status: row.status as BookingStatus,
      message: row.message ?? null,
      createdAt: row.created_at,
    }));
  }

  private async fetchIncomingRequests(): Promise<IncomingRequestView[]> {
    const uid = await this.requireUid();
    // `!inner` + filtro sobre la ficha del tutor: solo las reservas cuyo
    // `teacher_id` pertenece a la ficha del usuario autenticado.
    const { data, error } = await this.supabase
      .from('bookings')
      .select(
        'id, date, hour, status, message, created_at, student:profiles ( full_name ), teacher:teachers!inner ( profile_id )'
      )
      .eq('teacher.profile_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: any) => ({
      id: row.id,
      studentName: row.student?.full_name ?? 'Estudiante',
      date: row.date,
      hour: row.hour,
      status: row.status as BookingStatus,
      message: row.message ?? null,
      createdAt: row.created_at,
    }));
  }

  private async requireUid(): Promise<string> {
    const { data } = await this.supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid) {
      throw new Error('No autenticado');
    }
    return uid;
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
