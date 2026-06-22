import { Injectable, inject, signal } from '@angular/core';
import { AuthSession, User } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';
import { SupabaseService } from './supabase.service';
import { RateLimitError, RateLimiter } from '../utils/rate-limiter';

/** Datos que el usuario entrega al registrarse. */
export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  /** Nombre legible de la carrera (se guarda junto al IDs de referencia). */
  career: string;
  /** Año que cursa, ej. "3er año". */
  year: string;
  /** IDs del catálogo académico (referencias a campuses/faculties/careers). */
  campusId: string;
  facultyId: string;
  careerId: string;
}

/**
 * Maneja la sesión del usuario contra Supabase Auth.
 *
 * Por ahora solo email/contraseña (environment.auth.emailPassword). El acceso
 * institucional UDD está listo pero desactivado (environment.auth.uddSso).
 */
/** Un intento de login o registro cada 10 segundos. */
const AUTH_RATE_LIMIT_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;

  /**
   * Limitador del lado del cliente: 1 intento cada 10 s para login y para
   * registro (claves independientes). Es una barrera de UX/anti-spam; el
   * control de seguridad real lo aplica Supabase en el servidor.
   */
  private readonly rateLimiter = new RateLimiter(AUTH_RATE_LIMIT_MS);

  /** Sesión y usuario actuales, reactivos (signals). */
  readonly session = signal<AuthSession | null>(null);
  readonly user = signal<User | null>(null);

  constructor() {
    // Hidrata la sesión guardada (si existe) y escucha cambios.
    this.supabase.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
      this.user.set(data.session?.user ?? null);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      this.user.set(session?.user ?? null);
    });
  }

  /** ¿Hay alguien logueado? */
  isAuthenticated(): boolean {
    return this.user() !== null;
  }

  /**
   * Registro con correo y contraseña.
   * `fullName`, `career` y `year` viajan en los metadatos; el trigger
   * `handle_new_user` los usa para crear la fila en `profiles`.
   */
  signUp(data: SignUpData) {
    this.enforceRateLimit('signup');

    return this.supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          career: data.career,
          year: data.year,
          campus_id: data.campusId,
          faculty_id: data.facultyId,
          career_id: data.careerId,
        },
      },
    });
  }

  /** Inicio de sesión con correo y contraseña. */
  signIn(email: string, password: string) {
    this.enforceRateLimit('login');

    return this.supabase.auth.signInWithPassword({ email, password });
  }

  /**
   * Aplica el límite de frecuencia a una acción de autenticación.
   * Lanza {@link RateLimitError} si todavía no pasó el tiempo mínimo; en caso
   * contrario, registra el intento. Cuenta tanto intentos exitosos como
   * fallidos, de modo que un error de credenciales no permite reintentar al
   * instante.
   */
  private enforceRateLimit(action: 'login' | 'signup'): void {
    const retryAfter = this.rateLimiter.retryAfter(action);
    if (retryAfter > 0) {
      throw new RateLimitError(retryAfter);
    }

    this.rateLimiter.tryAcquire(action);
  }

  /** Cierra la sesión actual. */
  signOut() {
    return this.supabase.auth.signOut();
  }

  /** ¿Está habilitado el acceso institucional UDD? */
  get uddSsoEnabled(): boolean {
    return environment.auth.uddSso;
  }

  /**
   * Acceso institucional UDD (Google con dominio udd.cl).
   * Desactivado por ahora: lanza error salvo que se active el flag
   * `environment.auth.uddSso` y se configure el provider en Supabase.
   */
  signInWithUdd() {
    if (!environment.auth.uddSso) {
      return Promise.reject(
        new Error('El acceso UDD está desactivado por ahora.')
      );
    }

    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: { hd: 'udd.cl' },
        redirectTo: window.location.origin,
      },
    });
  }
}
