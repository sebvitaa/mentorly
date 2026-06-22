import { Injector } from '@angular/core';

import { BookingService } from './booking.service';
import {
  createIntegrationInjector,
  ensureSignedOut,
  toPromise,
} from '../testing/integration-support';

/**
 * Integración REAL: reservas (bookings) y su RLS.
 *
 * Sin sesión (anónimo) las policies deben:
 *   - permitir SELECT pero sin filas (la policy es `to authenticated`),
 *   - bloquear el INSERT (no se puede crear reserva sin estar logueado).
 *
 * No se crean reservas reales: validar la barrera RLS es el objetivo.
 */
describe('BookingService (integración Supabase real)', () => {
  let injector: Injector;
  let bookings: BookingService;

  beforeAll(async () => {
    injector = createIntegrationInjector(BookingService);
    bookings = injector.get(BookingService);
    await ensureSignedOut(injector);
  });

  it('getMyRequests() sin sesión devuelve un arreglo vacío (RLS)', async () => {
    const requests = await toPromise(bookings.getMyRequests());

    expect(Array.isArray(requests)).toBe(true);
    expect(requests.length).toBe(0);
  });

  it('createBooking() sin sesión es rechazado por RLS', async () => {
    await expect(
      toPromise(
        bookings.createBooking({
          teacherId: '00000000-0000-0000-0000-000000000000',
          date: '2030-01-01',
          hour: '10:00',
          message: 'test de integración (no debería insertarse)',
        })
      )
    ).rejects.toBeDefined();
  });
});
