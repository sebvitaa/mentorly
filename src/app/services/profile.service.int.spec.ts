import { Injector } from '@angular/core';

import { ProfileService } from './profile.service';
import {
  createIntegrationInjector,
  ensureSignedOut,
  toPromise,
} from '../testing/integration-support';

/**
 * Integración REAL: perfil propio.
 *
 * Sin sesión `getUser()` no devuelve usuario, así que el servicio corta antes de
 * consultar y entrega `null`. Esto comprueba que el camino real (auth + RLS)
 * no explota para un anónimo. El caso autenticado se cubre en el flujo de auth.
 */
describe('ProfileService (integración Supabase real)', () => {
  let injector: Injector;
  let profile: ProfileService;

  beforeAll(async () => {
    injector = createIntegrationInjector(ProfileService);
    profile = injector.get(ProfileService);
    await ensureSignedOut(injector);
  });

  it('getMyProfile() sin sesión devuelve null', async () => {
    const result = await toPromise(profile.getMyProfile());
    expect(result).toBeNull();
  });
});