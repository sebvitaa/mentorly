import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

import { Teacher } from '../models/teacher.model';
import { MOCK_TEACHERS } from '../data/mock-teachers';
import { environment } from '../../environments/environment';
import { TeacherApiService } from '../api/teacher-api.service';
import { mapTeacherDtoToTeacher } from '../api/mappers/teacher.mapper';

export interface TeacherFilters {
  query?: string;
  subject?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly teacherApi = inject(TeacherApiService);

  /**
   * Source of truth. Tries the backend once and caches the result.
   * If there is no configured API or the request fails, mock data is served
   * so the app keeps working offline.
   */
  private readonly teachers$ = this.loadTeachers().pipe(
    shareReplay({ bufferSize: 1, refCount: false })
  );

  private loadTeachers(): Observable<Teacher[]> {
    if (!environment.apiUrl) {
      return of(environment.useMocks ? MOCK_TEACHERS : []);
    }

    return this.teacherApi.getTeachers().pipe(
      map((teachers) =>
        Array.isArray(teachers) && teachers.length
          ? teachers.map(mapTeacherDtoToTeacher)
          : this.mockFallback()
      ),
      catchError(() => {
        if (environment.useMocks) {
          console.warn(
            '[TeacherService] API unavailable — using local TypeScript mocks.'
          );
        }
        return of(this.mockFallback());
      })
    );
  }

  /** All teachers (from backend or mocks). */
  getTeachers(): Observable<Teacher[]> {
    return this.teachers$;
  }

  /** Teachers filtered by free-text query and/or an active subject filter. */
  searchTeachers({ query, subject }: TeacherFilters): Observable<Teacher[]> {
    return this.teachers$.pipe(
      map((teachers) => this.applyFilters(teachers, query, subject))
    );
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

  private mockFallback(): Teacher[] {
    return environment.useMocks ? MOCK_TEACHERS : [];
  }
}
