import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';

import { SupabaseService } from './supabase.service';
import { Subject } from '../models/subject.model';

/** Catálogo de ramos leído desde Supabase (lectura pública). */
@Injectable({ providedIn: 'root' })
export class SubjectService {
  private readonly supabase = inject(SupabaseService).client;

  getSubjects(): Observable<Subject[]> {
    return from(this.fetchSubjects());
  }

  private async fetchSubjects(): Promise<Subject[]> {
    const { data, error } = await this.supabase
      .from('subjects')
      .select('id, name')
      .order('name');

    if (error) {
      throw error;
    }
    return (data ?? []) as Subject[];
  }
}
