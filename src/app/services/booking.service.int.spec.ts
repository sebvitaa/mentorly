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
 * Sin sesión (anónimo):
 *   - `getMyRequests` / `getIncomingRequests` necesitan `auth.uid()`, así que
 *     fallan limpiamente ("No autenticado") sin pegarle a la red.
 *   - el INSERT es bloqueado por RLS (no se puede crear reserva sin login).
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

  it('getMyRequests() sin sesión es rechazado (requiere auth.uid())', async () => {
    await expect(toPromise(bookings.getMyRequests())).rejects.toBeDefined();
  });

  it('getIncomingRequests() sin sesión es rechazado (requiere auth.uid())', async () => {
    await expect(toPromise(bookings.getIncomingRequests())).rejects.toBeDefined();
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
