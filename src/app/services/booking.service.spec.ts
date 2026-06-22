import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { BookingService } from './booking.service';
import { SupabaseService } from './supabase.service';

/**
 * Query builder de Supabase falso: encadenable, "thenable" para `.order()`/`.eq()`
 * y con `.single()` que resuelve a `result`. Registra las llamadas para verificar.
 */
function createQuery(result: { data: unknown; error: unknown }) {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const builder: any = {
    calls,
    insert: jest.fn((...a: unknown[]) => (calls.push({ method: 'insert', args: a }), builder)),
    select: jest.fn((...a: unknown[]) => (calls.push({ method: 'select', args: a }), builder)),
    update: jest.fn((...a: unknown[]) => (calls.push({ method: 'update', args: a }), builder)),
    eq: jest.fn((...a: unknown[]) => (calls.push({ method: 'eq', args: a }), builder)),
    order: jest.fn((...a: unknown[]) => (calls.push({ method: 'order', args: a }), builder)),
    single: jest.fn(() => Promise.resolve(result)),
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  return builder;
}

describe('BookingService', () => {
  let service: BookingService;
  let from: jest.Mock;
  let result: { data: unknown; error: unknown };
  let lastQuery: ReturnType<typeof createQuery>;

  beforeEach(() => {
    result = { data: null, error: null };
    from = jest.fn(() => {
      lastQuery = createQuery(result);
      return lastQuery;
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { client: { from } } },
      ],
    });

    service = TestBed.inject(BookingService);
  });

  it('createBooking inserta en bookings y devuelve id/status', async () => {
    result = { data: { id: 'b1', status: 'pending' }, error: null };

    const created = await firstValueFrom(
      service.createBooking({
        teacherId: 't1',
        date: '2026-06-22',
        hour: '09:00',
        message: 'Hola',
      })
    );

    expect(from).toHaveBeenCalledWith('bookings');
    const insertCall = lastQuery.calls.find(
      (c: { method: string }) => c.method === 'insert'
    );
    expect(insertCall?.args[0]).toEqual({
      teacher_id: 't1',
      date: '2026-06-22',
      hour: '09:00',
      message: 'Hola',
    });
    expect(created).toEqual({ id: 'b1', status: 'pending' });
  });

  it('createBooking propaga el error de Supabase', async () => {
    result = { data: null, error: { message: 'boom' } };

    await expect(
      firstValueFrom(
        service.createBooking({ teacherId: 't1', date: '2026-06-22', hour: '09:00' })
      )
    ).rejects.toBeDefined();
  });

  it('getMyRequests mapea las filas a la vista (incluye nombre del tutor)', async () => {
    result = {
      data: [
        {
          id: 'b1',
          date: '2026-06-22',
          hour: '09:00',
          status: 'pending',
          message: null,
          created_at: '2026-06-21T00:00:00.000Z',
          teacher: { profile: { full_name: 'Sofía Contreras' } },
        },
      ],
      error: null,
    };

    const requests = await firstValueFrom(service.getMyRequests());

    expect(from).toHaveBeenCalledWith('bookings');
    expect(requests).toEqual([
      {
        id: 'b1',
        teacherName: 'Sofía Contreras',
        date: '2026-06-22',
        hour: '09:00',
        status: 'pending',
        message: null,
        createdAt: '2026-06-21T00:00:00.000Z',
      },
    ]);
  });

  it('cancelBooking actualiza el estado a cancelled por id', async () => {
    result = { data: null, error: null };

    await firstValueFrom(service.cancelBooking('b1'));

    const updateCall = lastQuery.calls.find(
      (c: { method: string }) => c.method === 'update'
    );
    const eqCall = lastQuery.calls.find(
      (c: { method: string }) => c.method === 'eq'
    );
    expect(updateCall?.args[0]).toEqual({ status: 'cancelled' });
    expect(eqCall?.args).toEqual(['id', 'b1']);
  });
});
