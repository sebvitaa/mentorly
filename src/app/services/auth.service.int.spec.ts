import { Injector } from '@angular/core';

import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { createIntegrationInjector } from '../testing/integration-support';

/**
 * Integración REAL: Supabase Auth.
 *
 * El test por defecto es no destructivo: comprueba que el endpoint de login real
 * responde y rechaza credenciales inválidas (sin crear cuentas).
 *
 * El test de registro SÍ crea un usuario real (y dispara el trigger
 * `handle_new_user`), por eso está detrás del flag de entorno
 * `MENTORLY_E2E_SIGNUP=1`. Úsalo puntualmente para verificar el pipeline
 * completo Auth → trigger → fila en `profiles` con las FKs del catálogo.
 *   MENTORLY_E2E_SIGNUP=1 npm run test:int
 */
describe('AuthService (integración Supabase real)', () => {
  let injector: Injector;
  let auth: AuthService;
  let supabase: SupabaseService;

  beforeAll(() => {
    injector = createIntegrationInjector(AuthService, SupabaseService);
    auth = injector.get(AuthService);
    supabase = injector.get(SupabaseService);
  });

  it('signIn() con credenciales inválidas responde con error (sin throw)', async () => {
    const { data, error } = await auth.signIn(
      `no-existe-${Date.now()}@udd.cl`,
      'contraseña-incorrecta'
    );

    expect(error).toBeTruthy();
    expect(data.session).toBeNull();
  });

  // Crea un usuario real: solo bajo demanda.
  const describeSignup = process.env['MENTORLY_E2E_SIGNUP']
    ? describe
    : describe.skip;

  describeSignup('registro real (pipeline Auth → trigger → profiles)', () => {
    it('signUp() crea la cuenta y el trigger puebla profiles con las FKs', async () => {
      const email = `claude-it-${Date.now()}@udd.cl`;
      const { data, error } = await auth.signUp({
        email,
        password: 'Test-1234',
        fullName: 'Claude Integración',
        career: 'Ingeniería Comercial',
        admissionYear: '2023',
        campusId: 'campus-stgo',
        facultyId: 'fac-economia-negocios-stgo',
        careerId: 'career-stgo-economia-negocios-ing-comercial',
        wantsToTeach: false,
      });

      // Hallazgo real frecuente: el proyecto puede tener el registro por correo
      // apagado en el Dashboard (Authentication → Providers → Email →
      // "Allow new users to sign up"). Si es así, lo decimos sin rodeos.
      if (error?.message?.toLowerCase().includes('signups are disabled')) {
        throw new Error(
          'El registro por correo está DESACTIVADO en Supabase. ' +
            'Actívalo en Authentication → Providers → Email para que /register funcione.'
        );
      }

      expect(error).toBeNull();
      const userId = data.user?.id;
      expect(userId).toBeTruthy();

      // El trigger corre en el servidor; damos un margen y leemos profiles.
      await new Promise((r) => setTimeout(r, 1500));

      const { data: profileRow, error: profileError } = await supabase.client
        .from('profiles')
        .select('id, email, campus_id, faculty_id, career_id')
        .eq('id', userId!)
        .single();

      expect(profileError).toBeNull();
      expect(profileRow).toMatchObject({
        email,
        campus_id: 'campus-stgo',
        faculty_id: 'fac-economia-negocios-stgo',
        career_id: 'career-stgo-economia-negocios-ing-comercial',
      });
    });
  });
});