import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { AuthApiService } from '../api/auth-api.service';
import { StorageService } from './storage.service';
import {
  AuthResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  UserDto,
} from '../api/dtos/auth.dto';

export interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApiService);
  private readonly storage = inject(StorageService);

  private readonly authKey = 'mentorly:auth';

  private readonly state$ = new BehaviorSubject<AuthState>(this.loadInitialState());

  readonly user$ = this.state$.asObservable().pipe(map((state) => state.user));

  get currentUser(): UserDto | null {
    return this.state$.value.user;
  }

  get isAuthenticated(): boolean {
    return !!this.state$.value.accessToken && !!this.state$.value.user;
  }

  get accessToken(): string | null {
    return this.state$.value.accessToken;
  }

  register(payload: RegisterRequestDto): Observable<AuthResponseDto> {
    return this.authApi.register(payload).pipe(
      tap((response) => this.setSession(response)),
      catchError((error) => {
        this.clearSession();
        throw error;
      })
    );
  }

  login(payload: LoginRequestDto): Observable<AuthResponseDto> {
    return this.authApi.login(payload).pipe(
      tap((response) => this.setSession(response)),
      catchError((error) => {
        this.clearSession();
        throw error;
      })
    );
  }

  logout(): Observable<void> {
    return this.authApi.logout().pipe(
      catchError(() => of(undefined)),
      tap(() => this.clearSession())
    );
  }

  restoreSession(): Observable<UserDto | null> {
    if (!this.isAuthenticated) {
      return of(null);
    }

    return this.authApi.me().pipe(
      tap((user) => this.patchUser(user)),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  private setSession(response: AuthResponseDto): void {
    const state: AuthState = {
      user: response.user,
      accessToken: response.access_token,
    };
    this.state$.next(state);
    this.storage.set(this.authKey, state);
  }

  private patchUser(user: UserDto): void {
    const state: AuthState = {
      ...this.state$.value,
      user,
    };
    this.state$.next(state);
    this.storage.set(this.authKey, state);
  }

  private clearSession(): void {
    this.state$.next({ user: null, accessToken: null });
    this.storage.remove(this.authKey);
  }

  private loadInitialState(): AuthState {
    return this.storage.get<AuthState>(this.authKey, {
      user: null,
      accessToken: null,
    });
  }
}
