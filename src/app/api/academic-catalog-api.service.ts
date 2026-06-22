import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';

import { SupabaseService } from '../services/supabase.service';
import { CampusDto, CareerDto, FacultyDto } from './dtos/academic-catalog.dto';

/**
 * Catálogo académico (campus / facultades / carreras) leído desde Supabase.
 *
 * Mantiene las firmas que ya consumen `register.page` y `schedule-calendar`
 * (`getCampuses` / `getFaculties(campusId)` / `getCareers(filters)`), por lo que
 * esos componentes no cambian.
 *
 * Nota de modelo: la tabla `faculties` no tiene `campus_id` (una facultad puede
 * existir en varios campus). Las facultades de un campus se derivan de las
 * carreras activas de ese campus.
 */
@Injectable({ providedIn: 'root' })
export class AcademicCatalogApiService {
  private readonly supabase = inject(SupabaseService).client;

  getCampuses(): Observable<CampusDto[]> {
    return from(this.fetchCampuses());
  }

  getFaculties(campusId?: string): Observable<FacultyDto[]> {
    return from(this.fetchFaculties(campusId));
  }

  getCareers(
    filters: { campusId?: string; facultyId?: string } = {}
  ): Observable<CareerDto[]> {
    return from(this.fetchCareers(filters));
  }

  private async fetchCampuses(): Promise<CampusDto[]> {
    const { data, error } = await this.supabase
      .from('campuses')
      .select('id, name, slug, active')
      .eq('active', true)
      .order('name');

    if (error) {
      throw error;
    }
    return (data ?? []) as CampusDto[];
  }

  private async fetchFaculties(campusId?: string): Promise<FacultyDto[]> {
    // Sin campus: todas las facultades activas.
    if (!campusId) {
      return this.queryFaculties();
    }

    // Con campus: solo las facultades que tienen carreras activas ahí.
    const { data: careerRows, error } = await this.supabase
      .from('careers')
      .select('faculty_id')
      .eq('campus_id', campusId)
      .eq('active', true);

    if (error) {
      throw error;
    }

    const facultyIds = [
      ...new Set((careerRows ?? []).map((row) => row.faculty_id as string)),
    ];
    if (facultyIds.length === 0) {
      return [];
    }

    return this.queryFaculties(facultyIds);
  }

  private async queryFaculties(ids?: string[]): Promise<FacultyDto[]> {
    let query = this.supabase
      .from('faculties')
      .select('id, name, slug, active')
      .eq('active', true);

    if (ids) {
      query = query.in('id', ids);
    }

    const { data, error } = await query.order('name');
    if (error) {
      throw error;
    }
    return (data ?? []) as FacultyDto[];
  }

  private async fetchCareers(filters: {
    campusId?: string;
    facultyId?: string;
  }): Promise<CareerDto[]> {
    let query = this.supabase
      .from('careers')
      .select('id, faculty_id, campus_id, name, slug, active')
      .eq('active', true);

    if (filters.campusId) {
      query = query.eq('campus_id', filters.campusId);
    }
    if (filters.facultyId) {
      query = query.eq('faculty_id', filters.facultyId);
    }

    const { data, error } = await query.order('name');
    if (error) {
      throw error;
    }
    return (data ?? []) as CareerDto[];
  }
}
