import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';

import { SupabaseService } from './supabase.service';
import { ProfileView, TeacherStatus } from '../models/profile.model';

/** Datos editables del perfil de la persona. */
export interface ProfileUpdate {
  fullName: string;
  admissionYear: string;
  campusId: string;
  facultyId: string;
  careerId: string;
  /** Nombre legible de la carrera (se guarda junto al ID de referencia). */
  careerName: string;
}

/**
 * Perfil de la persona autenticada.
 *
 * Lee `profiles` (con join al catálogo académico) y `teachers` para saber si
 * la persona tiene faceta tutor y en qué estado. RLS garantiza que solo se
 * pueda leer la propia fila.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly supabase = inject(SupabaseService).client;

  getMyProfile(): Observable<ProfileView | null> {
    return from(this.fetchMyProfile());
  }

  /** Actualiza los datos personales/académicos del perfil propio. */
  updateMyProfile(update: ProfileUpdate): Observable<void> {
    return from(this.persistMyProfile(update));
  }

  private async persistMyProfile(update: ProfileUpdate): Promise<void> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    if (!user) {
      throw new Error('No autenticado');
    }

    const { error } = await this.supabase
      .from('profiles')
      .update({
        full_name: update.fullName,
        admission_year: update.admissionYear,
        campus_id: update.campusId,
        faculty_id: update.facultyId,
        career_id: update.careerId,
        career: update.careerName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }
  }

  private async fetchMyProfile(): Promise<ProfileView | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select(
        `
        id, full_name, email, admission_year,
        campus_id, faculty_id, career_id,
        campus:campuses ( name ),
        faculty:faculties ( name ),
        career:careers ( name ),
        teacher:teachers ( status )
      `
      )
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return this.mapProfile(data);
  }

  private mapProfile(row: any): ProfileView {
    const teacherRows = row.teacher ?? [];
    const teacherStatus: TeacherStatus =
      teacherRows.length > 0
        ? (teacherRows[0].status as TeacherStatus)
        : 'none';

    return {
      id: row.id,
      fullName: row.full_name ?? '',
      email: row.email ?? '',
      campusId: row.campus_id ?? '',
      campusName: row.campus?.name ?? '',
      facultyId: row.faculty_id ?? '',
      facultyName: row.faculty?.name ?? '',
      careerId: row.career_id ?? '',
      careerName: row.career?.name ?? '',
      admissionYear: row.admission_year ?? '',
      teacherStatus,
    };
  }
}
