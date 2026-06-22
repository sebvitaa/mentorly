import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AcademicCatalogApiService } from './academic-catalog-api.service';
import { SupabaseService } from '../services/supabase.service';

/**
 * Constructor de un query builder de Supabase falso, encadenable y "thenable",
 * que resuelve a `{ data, error: null }`. Cada método encadenable registra su
 * llamada para poder verificar los filtros aplicados.
 */
function createQuery(data: unknown) {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const builder: any = {
    calls,
    select: jest.fn((...args: unknown[]) => (calls.push({ method: 'select', args }), builder)),
    eq: jest.fn((...args: unknown[]) => (calls.push({ method: 'eq', args }), builder)),
    in: jest.fn((...args: unknown[]) => (calls.push({ method: 'in', args }), builder)),
    order: jest.fn((...args: unknown[]) => (calls.push({ method: 'order', args }), builder)),
    then: (resolve: (value: { data: unknown; error: null }) => void) =>
      resolve({ data, error: null }),
  };
  return builder;
}

describe('AcademicCatalogApiService', () => {
  let service: AcademicCatalogApiService;
  let from: jest.Mock;
  let tableData: Record<string, unknown>;

  beforeEach(() => {
    tableData = {};
    const queries: Record<string, ReturnType<typeof createQuery>> = {};
    from = jest.fn((table: string) => {
      queries[table] = createQuery(tableData[table] ?? []);
      return queries[table];
    });
    (from as any).queries = queries;

    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { client: { from } } },
      ],
    });

    service = TestBed.inject(AcademicCatalogApiService);
  });

  it('getCampuses devuelve los campus activos', async () => {
    tableData['campuses'] = [
      { id: 'campus-stgo', name: 'Santiago', slug: 'santiago', active: true },
    ];

    const campuses = await firstValueFrom(service.getCampuses());

    expect(from).toHaveBeenCalledWith('campuses');
    expect(campuses).toEqual([
      { id: 'campus-stgo', name: 'Santiago', slug: 'santiago', active: true },
    ]);
  });

  it('getCareers aplica los filtros de campus y facultad', async () => {
    tableData['careers'] = [
      {
        id: 'career-stgo-ingenieria-ing-civil-industrial',
        faculty_id: 'fac-ingenieria-stgo',
        campus_id: 'campus-stgo',
        name: 'Ingeniería Civil Industrial',
        slug: 'ingenieria-civil-industrial',
        active: true,
      },
    ];

    const careers = await firstValueFrom(
      service.getCareers({ campusId: 'campus-stgo', facultyId: 'fac-ingenieria-stgo' })
    );

    const eqCalls = (from as any).queries['careers'].calls.filter(
      (c: { method: string }) => c.method === 'eq'
    );
    expect(eqCalls).toEqual(
      expect.arrayContaining([
        { method: 'eq', args: ['campus_id', 'campus-stgo'] },
        { method: 'eq', args: ['faculty_id', 'fac-ingenieria-stgo'] },
      ])
    );
    expect(careers).toHaveLength(1);
  });

  it('getFaculties(campusId) deriva las facultades desde las carreras del campus', async () => {
    // Primer from('careers') → faculty_ids; segundo from('faculties') → facultades.
    tableData['careers'] = [
      { faculty_id: 'fac-ingenieria-stgo' },
      { faculty_id: 'fac-ingenieria-stgo' },
      { faculty_id: 'fac-medicina-stgo' },
    ];
    tableData['faculties'] = [
      { id: 'fac-ingenieria-stgo', name: 'Ingeniería', slug: 'ingenieria', active: true },
      { id: 'fac-medicina-stgo', name: 'Medicina', slug: 'medicina', active: true },
    ];

    const faculties = await firstValueFrom(service.getFaculties('campus-stgo'));

    // Se consultó careers filtrando por campus y luego faculties con .in(ids únicos).
    expect(from).toHaveBeenCalledWith('careers');
    expect(from).toHaveBeenCalledWith('faculties');
    const inCall = (from as any).queries['faculties'].calls.find(
      (c: { method: string }) => c.method === 'in'
    );
    expect(inCall.args).toEqual(['id', ['fac-ingenieria-stgo', 'fac-medicina-stgo']]);
    expect(faculties).toHaveLength(2);
  });

  it('getFaculties() sin campus devuelve todas las facultades activas', async () => {
    tableData['faculties'] = [
      { id: 'fac-ingenieria-stgo', name: 'Ingeniería', slug: 'ingenieria', active: true },
    ];

    const faculties = await firstValueFrom(service.getFaculties());

    expect(from).toHaveBeenCalledWith('faculties');
    expect(from).not.toHaveBeenCalledWith('careers');
    expect(faculties).toHaveLength(1);
  });
});
