import { Injector, Type } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { SupabaseService } from '../services/supabase.service';

/**
 * Soporte para tests de integración contra el Supabase REAL.
 *
 * A diferencia de los `*.spec.ts` (unitarios, con Supabase mockeado), los
 * `*.int.spec.ts` instancian los servicios reales con el cliente real y pegan
 * a la base de datos del proyecto (clave publishable de `environment`).
 *
 * No usamos TestBed: un `Injector.create` basta para resolver el `inject()` de
 * cada servicio sin necesidad de DOM ni zone.js, así corren en el entorno
 * `node` de Jest (donde sí existe `fetch`).
 */

/** Crea un injector aislado con `SupabaseService` + los servicios pedidos. */
export function createIntegrationInjector(...services: Type<unknown>[]): Injector {
  return Injector.create({
    providers: [
      { provide: SupabaseService, useClass: SupabaseService },
      ...services.map((service) => ({ provide: service, useClass: service })),
    ],
  });
}

/** Resuelve un servicio real ya conectado a Supabase. */
export function getService<T>(injector: Injector, service: Type<T>): T {
  return injector.get(service);
}

/** Azúcar: convierte un Observable de una sola emisión en Promise para `await`. */
export const toPromise = firstValueFrom;

/** Garantiza una sesión anónima limpia (sin usuario logueado) antes de un test. */
export async function ensureSignedOut(injector: Injector): Promise<void> {
  const supabase = injector.get(SupabaseService).client;
  await supabase.auth.signOut();
}