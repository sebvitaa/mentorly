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

/** Contacto del tutor expuesto cuando está permitido (público o reserva confirmada). */
export interface TeacherContact {
  email: string | null;
  phone: string | null;
}

/** Normaliza para comparar ignorando tildes/mayúsculas ("Cálculo" ≈ "calculo"). */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Consulta anidada: tutor + perfil + ramos + disponibilidad + reseñas.
 * El contacto (contact_email/contact_phone) NO se incluye: se obtiene aparte
 * vía `getTeacherContact` (RPC), que respeta show_contact / reserva confirmada.
 * Solo se listan tutores `active`; los `incomplete`/`pending` no son visibles.
 */
const TEACHER_SELECT = `
  id, about, price_min, price_max, rating, review_count, status,
  profile:profiles ( full_name, career, admission_year, avatar_url ),
  teacher_subjects ( subjects ( name ) ),
  availability_slots ( date, hour, available ),
  reviews ( rating, comment, date, author:profiles ( full_name ) )
`;

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly supabase = inject(SupabaseService).client;

  /**
   * Fuente de verdad cacheada. Se recrea con `reload()` para reflejar tutores
   * recién publicados al volver a Home.
   */
  private teachers$ = this.createStream();

  private createStream(): Observable<Teacher[]> {
    return from(this.fetchTeachers()).pipe(
      catchError(() => {
        console.warn('[TeacherService] Supabase no disponible — usando mocks.');
        return of(MOCK_TEACHERS);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }

  /** Vuelve a consultar Supabase la próxima vez que alguien se suscriba. */
  reload(): void {
    this.teachers$ = this.createStream();
  }

  private async fetchTeachers(): Promise<Teacher[]> {
    const { data, error } = await this.supabase
      .from('teachers')
      .select(TEACHER_SELECT)
      .eq('status', 'active');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('[TeacherService] Sin tutores activos en Supabase — usando mocks.');
      return MOCK_TEACHERS;
    }

    // Un tutor sin ramos no se muestra en el catálogo.
    return data
      .map((row) => this.mapTeacher(row))
      .filter((teacher) => teacher.subjects.length > 0);
  }

  /** Todos los tutores. */
  getTeachers(): Observable<Teacher[]> {
    return this.teachers$;
  }

  /** Tutores filtrados por texto libre y/o un ramo activo (ignora tildes). */
  searchTeachers({ query, subject }: TeacherFilters): Observable<Teacher[]> {
    return this.teachers$.pipe(
      map((teachers) => this.applyFilters(teachers, query, subject))
    );
  }

  /**
   * Contacto del tutor, si está permitido verlo (tutor público o reserva
   * confirmada). Devuelve `null` cuando no corresponde mostrarlo.
   */
  getTeacherContact(teacherId: string): Observable<TeacherContact | null> {
    if (!UUID_RE.test(teacherId)) {
      // IDs mock (no-UUID) no tienen contacto real en la BD.
      return of(null);
    }
    return from(this.fetchTeacherContact(teacherId));
  }

  private async fetchTeacherContact(
    teacherId: string
  ): Promise<TeacherContact | null> {
    const { data, error } = await this.supabase.rpc('get_teacher_contact', {
      p_teacher: teacherId,
    });
    if (error || !data) {
      return null;
    }
    const row = data as { email: string | null; phone: string | null };
    if (!row.email && !row.phone) {
      return null;
    }
    return { email: row.email ?? null, phone: row.phone ?? null };
  }

  // --- Mapeo de filas de Supabase al modelo del frontend ---------------------

  private mapTeacher(row: any): Teacher {
    const profile = row.profile ?? {};

    return {
      id: String(row.id),
      name: profile.full_name ?? '',
      career: profile.career ?? '',
      year: profile.admission_year ?? '',
      rating: Number(row.rating) || 0,
      reviewCount: row.review_count ?? 0,
      priceRange: formatPriceRange(row.price_min ?? 0, row.price_max ?? 0),
      subjects: (row.teacher_subjects ?? [])
        .map((ts: any) => ts.subjects?.name)
        .filter((name: string | undefined): name is string => !!name),
      avatar: profile.avatar_url ?? undefined,
      about: row.about ?? '',
      // contact se obtiene aparte vía getTeacherContact.
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
      const needle = normalize(subject);
      results = results.filter((teacher) =>
        teacher.subjects.some((s) => normalize(s).includes(needle))
      );
    }

    const trimmed = query ? normalize(query) : '';
    if (trimmed) {
      results = results.filter(
        (teacher) =>
          normalize(teacher.name).includes(trimmed) ||
          normalize(teacher.career).includes(trimmed) ||
          teacher.subjects.some((s) => normalize(s).includes(trimmed))
      );
    }

    return results;
  }
}
