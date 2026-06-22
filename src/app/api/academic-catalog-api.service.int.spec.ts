import { Injector } from '@angular/core';

import { AcademicCatalogApiService } from './academic-catalog-api.service';
import {
  createIntegrationInjector,
  toPromise,
} from '../testing/integration-support';

/**
 * Integración REAL: catálogo académico (campuses / faculties / careers).
 *
 * Lectura pública (RLS `using (true)`), así que no necesita sesión. Verifica que
 * las tablas existen, están sembradas y que las firmas del servicio devuelven lo
 * que `register.page` espera.
 */
describe('AcademicCatalogApiService (integración Supabase real)', () => {
  let injector: Injector;
  let catalog: AcademicCatalogApiService;

  beforeAll(() => {
    injector = createIntegrationInjector(AcademicCatalogApiService);
    catalog = injector.get(AcademicCatalogApiService);
  });

  it('getCampuses() trae los campus sembrados (Santiago y Concepción)', async () => {
    const campuses = await toPromise(catalog.getCampuses());

    const ids = campuses.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(['campus-stgo', 'campus-ccpc']));
    expect(campuses.every((c) => c.active)).toBe(true);
    // Vienen ordenados por nombre: Concepción antes que Santiago.
    expect(campuses.map((c) => c.name)).toEqual(['Concepción', 'Santiago']);
  });

  it('getFaculties() sin campus trae todas las facultades activas', async () => {
    const faculties = await toPromise(catalog.getFaculties());

    expect(faculties.length).toBeGreaterThanOrEqual(10);
    expect(faculties.every((f) => f.active)).toBe(true);
    expect(faculties.map((f) => f.name)).toContain('Ingeniería');
  });

  it('getFaculties(campusId) deriva las facultades de las carreras del campus', async () => {
    const faculties = await toPromise(catalog.getFaculties('campus-stgo'));

    expect(faculties.length).toBeGreaterThan(0);
    expect(faculties.map((f) => f.id)).toContain('fac-ingenieria-stgo');
  });

  it('getCareers({campusId}) filtra solo carreras de ese campus', async () => {
    const careers = await toPromise(
      catalog.getCareers({ campusId: 'campus-stgo' })
    );

    expect(careers.length).toBeGreaterThan(0);
    expect(careers.every((c) => c.campus_id === 'campus-stgo')).toBe(true);
  });

  it('getCareers({campusId, facultyId}) filtra por campus y facultad', async () => {
    const careers = await toPromise(
      catalog.getCareers({
        campusId: 'campus-stgo',
        facultyId: 'fac-ingenieria-stgo',
      })
    );

    expect(careers.length).toBeGreaterThan(0);
    expect(
      careers.every(
        (c) =>
          c.campus_id === 'campus-stgo' && c.faculty_id === 'fac-ingenieria-stgo'
      )
    ).toBe(true);
  });
});