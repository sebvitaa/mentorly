import { Injector } from '@angular/core';

import { SubjectService } from './subject.service';
import {
  createIntegrationInjector,
  toPromise,
} from '../testing/integration-support';

/**
 * Integración REAL: catálogo de ramos (lectura pública).
 */
describe('SubjectService (integración Supabase real)', () => {
  let injector: Injector;
  let subjects: SubjectService;

  beforeAll(() => {
    injector = createIntegrationInjector(SubjectService);
    subjects = injector.get(SubjectService);
  });

  it('getSubjects() trae los ramos sembrados ordenados', async () => {
    const list = await toPromise(subjects.getSubjects());

    expect(list.length).toBeGreaterThan(0);
    expect(list.every((s) => typeof s.id === 'string' && !!s.name)).toBe(true);
  });
});
