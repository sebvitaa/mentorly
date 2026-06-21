import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { CampusDto, CareerDto, FacultyDto } from './dtos/academic-catalog.dto';

@Injectable({ providedIn: 'root' })
export class AcademicCatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getCampuses(): Observable<CampusDto[]> {
    return this.http.get<CampusDto[]>(`${this.baseUrl}/campuses`);
  }

  getFaculties(campusId?: string): Observable<FacultyDto[]> {
    let params = new HttpParams();
    if (campusId) {
      params = params.set('campus_id', campusId);
    }
    return this.http.get<FacultyDto[]>(`${this.baseUrl}/faculties`, { params });
  }

  getCareers(filters: { campusId?: string; facultyId?: string } = {}): Observable<CareerDto[]> {
    let params = new HttpParams();
    if (filters.campusId) {
      params = params.set('campus_id', filters.campusId);
    }
    if (filters.facultyId) {
      params = params.set('faculty_id', filters.facultyId);
    }
    return this.http.get<CareerDto[]>(`${this.baseUrl}/careers`, { params });
  }
}
