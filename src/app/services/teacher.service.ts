import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import {
  DayAvailability,
  Review,
  Teacher,
  TimeSlot,
} from '../models/teacher.model';
import { MOCK_TEACHERS } from '../data/mock-teachers';
import { formatPriceRange } from '../utils/format.util';
import { SupabaseService } from './supabase.service';

export interface TeacherFilters {
  query?: string;
  subject?: string | null;
}

/**
 * Consulta anidada: tutor + perfil + ramos + disponibilidad + reseñas.
 * El contacto (contact_type/contact_value) NO se incluye: el catálogo público
 * no debe exponerlo (se oculta hasta que el tutor confirme una reserva).
 */
const TEACHER_SELECT = `
  id, about, price_min, price_max, rating, review_count,
  profile:profiles ( full_name, career, year, avatar_url ),
  teacher_subjects ( subjects ( name ) ),
  availability_slots ( date, hour, available ),
  reviews ( rating, comment, date, author:profiles ( full_name ) )
`;

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly supabase = inject(SupabaseService).client;

  /**
   * Fuente de verdad. Consulta Supabase una vez y cachea el resultado.
   * Si la consulta falla, se sirven los datos mock para que la app siga
   * funcionando.
   */
  private readonly teachers$ = from(this.fetchTeachers()).pipe(
    catchError(() => {
      console.warn('[TeacherService] Supabase no disponible — usando mocks.');
      return of(MOCK_TEACHERS);
    }),
    shareReplay({ bufferSize: 1, refCount: false })
  );

  private async fetchTeachers(): Promise<Teacher[]> {
    const { data, error } = await this.supabase
      .from('teachers')
      .select(TEACHER_SELECT);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('[TeacherService] Sin tutores en Supabase — usando mocks.');
      return MOCK_TEACHERS;
    }

    return data.map((row) => this.mapTeacher(row));
  }

  /** Todos los tutores. */
  getTeachers(): Observable<Teacher[]> {
    return this.teachers$;
  }

  /** Tutores filtrados por texto libre y/o un ramo activo. */
  searchTeachers({ query, subject }: TeacherFilters): Observable<Teacher[]> {
    return this.teachers$.pipe(
      map((teachers) => this.applyFilters(teachers, query, subject))
    );
  }

  // --- Mapeo de filas de Supabase al modelo del frontend ---------------------

  private mapTeacher(row: any): Teacher {
    const profile = row.profile ?? {};

    return {
      id: String(row.id),
      name: profile.full_name ?? '',
      career: profile.career ?? '',
      year: profile.year ?? '',
      rating: Number(row.rating) || 0,
      reviewCount: row.review_count ?? 0,
      priceRange: formatPriceRange(row.price_min ?? 0, row.price_max ?? 0),
      subjects: (row.teacher_subjects ?? [])
        .map((ts: any) => ts.subjects?.name)
        .filter((name: string | undefined): name is string => !!name),
      avatar: profile.avatar_url ?? undefined,
      about: row.about ?? '',
      // contact se omite a propósito (oculto hasta confirmar reserva).
      availability: this.mapAvailability(row.availability_slots ?? []),
      reviews: this.mapReviews(row.reviews ?? []),
    };
  }

  /** Agrupa los bloques horarios por fecha y los ordena. */
  private mapAvailability(slots: any[]): DayAvailability[] {
    const byDate = new Map<string, TimeSlot[]>();

    for (const slot of slots) {
      const list = byDate.get(slot.date) ?? [];
      list.push({ hour: slot.hour, available: slot.available });
      byDate.set(slot.date, list);
    }

    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, timeSlots]) => ({
        date,
        timeSlots: timeSlots.sort((x, y) => x.hour.localeCompare(y.hour)),
      }));
  }

  private mapReviews(reviews: any[]): Review[] {
    return reviews.map((r) => ({
      studentName: r.author?.full_name ?? 'Anónimo',
      rating: r.rating,
      date: r.date,
      comment: r.comment ?? '',
    }));
  }

  private applyFilters(
    teachers: Teacher[],
    query?: string,
    subject?: string | null
  ): Teacher[] {
    let results = teachers;

    if (subject) {
      const needle = subject.toLowerCase();
      results = results.filter((teacher) =>
        teacher.subjects.some((s) => s.toLowerCase().includes(needle))
      );
    }

    const trimmed = query?.trim().toLowerCase();
    if (trimmed) {
      results = results.filter(
        (teacher) =>
          teacher.name.toLowerCase().includes(trimmed) ||
          teacher.career.toLowerCase().includes(trimmed) ||
          teacher.subjects.some((s) => s.toLowerCase().includes(trimmed))
      );
    }

    return results;
  }
}
