import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';

import { SupabaseService } from './supabase.service';
import { TeacherStatus } from '../models/profile.model';
import { TutorProfileEdit } from '../models/tutor-profile.model';

/**
 * Perfil tutor editable del usuario autenticado.
 *
 * Lee y guarda vía RPCs `SECURITY DEFINER` (`get_my_tutor_profile` /
 * `save_tutor_profile`): así se accede al contacto (oculto por grant) y la
 * lógica de publicación/disponibilidad vive validada en la base de datos.
 */
@Injectable({ providedIn: 'root' })
export class TutorProfileService {
  private readonly supabase = inject(SupabaseService).client;

  /** Perfil tutor del usuario, o `null` si aún no tiene ficha. */
  getMyTutorProfile(): Observable<TutorProfileEdit | null> {
    return from(this.fetch());
  }

  /** Guarda los datos y devuelve el `status` resultante (active/incomplete). */
  saveTutorProfile(edit: TutorProfileEdit): Observable<TeacherStatus> {
    return from(this.save(edit));
  }

  private async fetch(): Promise<TutorProfileEdit | null> {
    const { data, error } = await this.supabase.rpc('get_my_tutor_profile');

    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }

    const row = data as Record<string, any>;
    return {
      about: row['about'] ?? '',
      priceMin: row['price_min'] ?? null,
      priceMax: row['price_max'] ?? null,
      contactType: row['contact_type'] ?? null,
      contactValue: row['contact_value'] ?? '',
      subjectIds: row['subject_ids'] ?? [],
      slots: (row['weekly_availability'] ?? []).map((slot: any) => ({
        weekday: slot.weekday,
        hour: slot.hour,
      })),
      status: (row['status'] ?? 'incomplete') as TeacherStatus,
    };
  }

  private async save(edit: TutorProfileEdit): Promise<TeacherStatus> {
    const { data, error } = await this.supabase.rpc('save_tutor_profile', {
      p_about: edit.about,
      p_price_min: edit.priceMin,
      p_price_max: edit.priceMax,
      p_contact_type: edit.contactType,
      p_contact_value: edit.contactValue,
      p_subject_ids: edit.subjectIds,
      p_weekly: edit.slots,
    });

    if (error) {
      throw error;
    }
    return data as TeacherStatus;
  }
}
