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

    const auth = {
      getUser: jest.fn(() =>
        Promise.resolve({ data: { user: { id: 'me' } }, error: null })
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { client: { from, auth } } },
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

  it('getMyRequests filtra por student_id y mapea las filas a la vista', async () => {
    result = {
      data: [
        {
          id: 'b1',
          teacher_id: 't1',
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
    const eqCall = lastQuery.calls.find(
      (c: { method: string }) => c.method === 'eq'
    );
    expect(eqCall?.args).toEqual(['student_id', 'me']);
    expect(requests).toEqual([
      {
        id: 'b1',
        teacherId: 't1',
        teacherName: 'Sofía Contreras',
        date: '2026-06-22',
        hour: '09:00',
        status: 'pending',
        message: null,
        createdAt: '2026-06-21T00:00:00.000Z',
      },
    ]);
  });

  it('getIncomingRequests filtra por la ficha del tutor y mapea el nombre del estudiante', async () => {
    result = {
      data: [
        {
          id: 'b9',
          date: '2026-06-24',
          hour: '15:00',
          status: 'pending',
          message: 'Necesito ayuda',
          created_at: '2026-06-22T10:00:00.000Z',
          student: { full_name: 'Ana Pérez' },
        },
      ],
      error: null,
    };

    const incoming = await firstValueFrom(service.getIncomingRequests());

    expect(from).toHaveBeenCalledWith('bookings');
    const eqCall = lastQuery.calls.find(
      (c: { method: string }) => c.method === 'eq'
    );
    expect(eqCall?.args).toEqual(['teacher.profile_id', 'me']);
    expect(incoming).toEqual([
      {
        id: 'b9',
        studentName: 'Ana Pérez',
        date: '2026-06-24',
        hour: '15:00',
        status: 'pending',
        message: 'Necesito ayuda',
        createdAt: '2026-06-22T10:00:00.000Z',
      },
    ]);
  });

  it('acceptBooking actualiza el estado a confirmed por id', async () => {
    result = { data: null, error: null };

    await firstValueFrom(service.acceptBooking('b1'));

    const updateCall = lastQuery.calls.find(
      (c: { method: string }) => c.method === 'update'
    );
    const eqCall = lastQuery.calls.find(
      (c: { method: string }) => c.method === 'eq'
    );
    expect(updateCall?.args[0]).toEqual({ status: 'confirmed' });
    expect(eqCall?.args).toEqual(['id', 'b1']);
  });

  it('rejectBooking actualiza el estado a rejected por id', async () => {
    result = { data: null, error: null };

    await firstValueFrom(service.rejectBooking('b1'));

    const updateCall = lastQuery.calls.find(
      (c: { method: string }) => c.method === 'update'
    );
    expect(updateCall?.args[0]).toEqual({ status: 'rejected' });
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
