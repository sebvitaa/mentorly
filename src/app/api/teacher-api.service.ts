import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { DayAvailabilityDto, TeacherDto } from './dtos/teacher.dto';

export interface TeacherApiFilters {
  query?: string;
  subject?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TeacherApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getTeachers(filters: TeacherApiFilters = {}): Observable<TeacherDto[]> {
    let params = new HttpParams();

    if (filters.query?.trim()) {
      params = params.set('q', filters.query.trim());
    }

    if (filters.subject) {
      params = params.set('subject', filters.subject);
    }

    return this.http.get<TeacherDto[]>(`${this.baseUrl}/teachers`, { params });
  }

  getTeacher(id: string): Observable<TeacherDto> {
    return this.http.get<TeacherDto>(`${this.baseUrl}/teachers/${id}`);
  }

  getAvailability(teacherId: string): Observable<DayAvailabilityDto[]> {
    return this.http.get<DayAvailabilityDto[]>(
      `${this.baseUrl}/teachers/${teacherId}/availability`
    );
  }
}
