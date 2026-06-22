import { Injector } from '@angular/core';

import { TutorProfileService } from './tutor-profile.service';
import {
  createIntegrationInjector,
  ensureSignedOut,
  toPromise,
} from '../testing/integration-support';

/**
 * Integración REAL: RPCs del perfil tutor.
 *
 * Sin sesión, los RPCs (`grant execute ... to authenticated`) no deben permitir
 * guardar. Verificar esa barrera es el objetivo; no se crea ningún tutor real.
 */
describe('TutorProfileService (integración Supabase real)', () => {
  let injector: Injector;
  let tutorProfile: TutorProfileService;

  beforeAll(async () => {
    injector = createIntegrationInjector(TutorProfileService);
    tutorProfile = injector.get(TutorProfileService);
    await ensureSignedOut(injector);
  });

  it('saveTutorProfile() sin sesión es rechazado', async () => {
    await expect(
      toPromise(
        tutorProfile.saveTutorProfile({
          about: 'no debería guardarse',
          priceMin: 8000,
          priceMax: 12000,
          contactType: 'email',
          contactValue: 'x@udd.cl',
          subjectIds: [],
          slots: [{ weekday: 1, hour: '09:00' }],
          status: 'incomplete',
        })
      )
    ).rejects.toBeDefined();
  });

  it('getMyTutorProfile() sin sesión no expone ningún perfil', async () => {
    // Sin usuario: o bien lo rechaza (sin grant a anon) o devuelve null.
    let result: unknown = 'unset';
    try {
      result = await toPromise(tutorProfile.getMyTutorProfile());
    } catch {
      return; // rechazo aceptable
    }
    expect(result).toBeNull();
  });
});
