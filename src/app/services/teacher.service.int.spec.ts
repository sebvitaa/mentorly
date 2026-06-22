import { Injector } from '@angular/core';

import { TeacherService } from './teacher.service';
import { SupabaseService } from './supabase.service';
import {
  createIntegrationInjector,
  toPromise,
} from '../testing/integration-support';

/**
 * Integración REAL: catálogo de tutores.
 *
 * El catálogo público solo muestra tutores `active` (RLS). Hoy puede no haber
 * ninguno: en ese caso el servicio cae a mocks a propósito. Por eso aquí se
 * validan dos cosas independientes:
 *   1) la consulta anidada real (teacher → profile/subjects/availability/reviews)
 *      resuelve SIN error contra el esquema real;
 *   2) `getTeachers()` siempre entrega un arreglo usable por la UI.
 */
describe('TeacherService (integración Supabase real)', () => {
  let injector: Injector;
  let teacherService: TeacherService;
  let supabase: SupabaseService;

  beforeAll(() => {
    injector = createIntegrationInjector(TeacherService, SupabaseService);
    teacherService = injector.get(TeacherService);
    supabase = injector.get(SupabaseService);
  });

  it('la consulta anidada de tutores activos resuelve sin error de esquema', async () => {
    // Réplica de las relaciones que usa TeacherService: si alguna FK/relación
    // estuviera mal nombrada, PostgREST devolvería error aquí.
    const { error } = await supabase.client
      .from('teachers')
      .select(
        `
        id, about, price_min, price_max, rating, review_count, status,
        profile:profiles ( full_name, career, admission_year, avatar_url ),
        teacher_subjects ( subjects ( name ) ),
        availability_slots ( date, hour, available ),
        reviews ( rating, comment, date, author:profiles ( full_name ) )
      `
      )
      .eq('status', 'active');

    expect(error).toBeNull();
  });

  it('getTeachers() entrega un arreglo (tutores reales o fallback a mocks)', async () => {
    const teachers = await toPromise(teacherService.getTeachers());

    expect(Array.isArray(teachers)).toBe(true);
    // Sea cual sea la fuente, cada tutor debe tener la forma del modelo.
    for (const teacher of teachers) {
      expect(typeof teacher.id).toBe('string');
      expect(typeof teacher.name).toBe('string');
      expect(Array.isArray(teacher.subjects)).toBe(true);
    }
  });
});