import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { SubjectService } from './subject.service';
import { SupabaseService } from './supabase.service';

/** Query builder de Supabase falso, encadenable y thenable. */
function createQuery(data: unknown) {
  const builder: any = {
    select: jest.fn(() => builder),
    order: jest.fn(() => builder),
    then: (resolve: (value: { data: unknown; error: null }) => void) =>
      resolve({ data, error: null }),
  };
  return builder;
}

describe('SubjectService', () => {
  let service: SubjectService;
  let from: jest.Mock;
  let data: unknown;

  beforeEach(() => {
    data = [];
    from = jest.fn(() => createQuery(data));

    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { client: { from } } }],
    });

    service = TestBed.inject(SubjectService);
  });

  it('getSubjects() consulta la tabla subjects ordenada por nombre', async () => {
    data = [
      { id: 's1', name: 'Cálculo I' },
      { id: 's2', name: 'Programación' },
    ];

    const subjects = await firstValueFrom(service.getSubjects());

    expect(from).toHaveBeenCalledWith('subjects');
    expect(subjects).toEqual(data);
  });

  it('getSubjects() devuelve [] cuando no hay datos', async () => {
    data = null;
    const subjects = await firstValueFrom(service.getSubjects());
    expect(subjects).toEqual([]);
  });
});
