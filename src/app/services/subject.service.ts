import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';

import { SupabaseService } from './supabase.service';
import { Subject } from '../models/subject.model';

/** Catálogo de ramos en Supabase (lectura pública; alta vía RPC). */
@Injectable({ providedIn: 'root' })
export class SubjectService {
  private readonly supabase = inject(SupabaseService).client;

  getSubjects(): Observable<Subject[]> {
    return from(this.fetchSubjects());
  }

  /** Crea un ramo nuevo (o reutiliza uno existente con el mismo nombre). */
  addSubject(name: string, detail?: string): Observable<Subject> {
    return from(this.createSubject(name, detail));
  }

  private async fetchSubjects(): Promise<Subject[]> {
    const { data, error } = await this.supabase
      .from('subjects')
      .select('id, name, detail')
      .order('name');

    if (error) {
      throw error;
    }
    return (data ?? []) as Subject[];
  }

  private async createSubject(name: string, detail?: string): Promise<Subject> {
    const { data, error } = await this.supabase.rpc('add_subject', {
      p_name: name,
      p_detail: detail ?? null,
    });

    if (error) {
      throw error;
    }
    return data as Subject;
  }
}
