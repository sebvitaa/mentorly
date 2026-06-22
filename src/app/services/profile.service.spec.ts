import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ProfileService } from './profile.service';
import { SupabaseService } from './supabase.service';

/**
 * Query builder falso encadenable para Supabase. `.single()` resuelve a
 * `result`; `.eq()` registra y devuelve el builder.
 */
function createQuery(result: { data: unknown; error: unknown }) {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const builder: any = {
    calls,
    select: jest.fn((...a: unknown[]) => (calls.push({ method: 'select', args: a }), builder)),
    eq: jest.fn((...a: unknown[]) => (calls.push({ method: 'eq', args: a }), builder)),
    single: jest.fn(() => Promise.resolve(result)),
  };
  return builder;
}

describe('ProfileService', () => {
  let service: ProfileService;
  let from: jest.Mock;
  let getUser: jest.Mock;
  let result: { data: unknown; error: unknown };
  let lastQuery: ReturnType<typeof createQuery>;

  beforeEach(() => {
    result = { data: null, error: null };
    from = jest.fn(() => {
      lastQuery = createQuery(result);
      return lastQuery;
    });
    getUser = jest.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
    });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: SupabaseService,
          useValue: { client: { from, auth: { getUser } } },
        },
      ],
    });

    service = TestBed.inject(ProfileService);
  });

  it('devuelve null si no hay usuario autenticado', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const profile = await firstValueFrom(service.getMyProfile());

    expect(profile).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it('mapea profiles + catálogo + teacher status correctamente', async () => {
    result = {
      data: {
        id: 'user-1',
        full_name: 'Josefa Pérez',
        email: 'josefa.perez@udd.cl',
        admission_year: '2023',
        campus_id: 'campus-stgo',
        faculty_id: 'fac-economia-negocios-stgo',
        career_id: 'career-stgo-economia-negocios-ing-comercial',
        campus: { name: 'Santiago' },
        faculty: { name: 'Economía y Negocios' },
        career: { name: 'Ingeniería Comercial' },
        teacher: [{ status: 'incomplete' }],
      },
      error: null,
    };

    const profile = await firstValueFrom(service.getMyProfile());

    expect(from).toHaveBeenCalledWith('profiles');
    const eqCall = lastQuery.calls.find((c: { method: string }) => c.method === 'eq');
    expect(eqCall?.args).toEqual(['id', 'user-1']);

    expect(profile).toEqual({
      id: 'user-1',
      fullName: 'Josefa Pérez',
      email: 'josefa.perez@udd.cl',
      campusId: 'campus-stgo',
      campusName: 'Santiago',
      facultyId: 'fac-economia-negocios-stgo',
      facultyName: 'Economía y Negocios',
      careerId: 'career-stgo-economia-negocios-ing-comercial',
      careerName: 'Ingeniería Comercial',
      admissionYear: '2023',
      teacherStatus: 'incomplete',
    });
  });

  it('reporta teacherStatus "none" cuando no hay fila en teachers', async () => {
    result = {
      data: {
        id: 'user-1',
        full_name: 'Ada Lovelace',
        email: 'ada@udd.cl',
        admission_year: '2022',
        campus_id: 'campus-stgo',
        faculty_id: 'fac-ingenieria-stgo',
        career_id: 'career-stgo-ingenieria-ing-civil-industrial',
        campus: { name: 'Santiago' },
        faculty: { name: 'Ingeniería' },
        career: { name: 'Ingeniería Civil Industrial' },
        teacher: [],
      },
      error: null,
    };

    const profile = await firstValueFrom(service.getMyProfile());

    expect(profile?.teacherStatus).toBe('none');
  });

  it('propaga el error de Supabase', async () => {
    result = { data: null, error: { message: 'boom' } };

    await expect(firstValueFrom(service.getMyProfile())).rejects.toBeDefined();
  });
});
