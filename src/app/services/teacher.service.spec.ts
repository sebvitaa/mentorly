import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { TeacherService } from './teacher.service';
import { SupabaseService } from './supabase.service';

/** Query builder de Supabase falso (select → eq → thenable). */
function createQuery(data: unknown) {
  const builder: any = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    then: (resolve: (value: { data: unknown; error: null }) => void) =>
      resolve({ data, error: null }),
  };
  return builder;
}

function teacherRow(id: string, subjectNames: string[]) {
  return {
    id,
    about: '',
    price_min: 8000,
    price_max: 12000,
    rating: 4.5,
    review_count: 2,
    status: 'active',
    profile: { full_name: `Tutor ${id}`, career: 'Ing', admission_year: '2023' },
    teacher_subjects: subjectNames.map((name) => ({ subjects: { name } })),
    availability_slots: [],
    reviews: [],
  };
}

describe('TeacherService', () => {
  function setup(rows: unknown[]) {
    const from = jest.fn(() => createQuery(rows));
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { client: { from } } }],
    });
    return TestBed.inject(TeacherService);
  }

  it('oculta del catálogo a los tutores sin ramos', async () => {
    const service = setup([
      teacherRow('con-ramos', ['Cálculo I']),
      teacherRow('sin-ramos', []),
    ]);

    const teachers = await firstValueFrom(service.getTeachers());

    expect(teachers).toHaveLength(1);
    expect(teachers[0].id).toBe('con-ramos');
  });
});
