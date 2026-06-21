import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  AuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  UserDto,
} from './dtos/auth.dto';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  register(payload: RegisterRequestDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.baseUrl}/auth/register`, payload);
  }

  login(payload: LoginRequestDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.baseUrl}/auth/login`, payload);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/auth/logout`, {});
  }

  me(): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.baseUrl}/auth/me`);
  }
}
