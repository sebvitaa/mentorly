import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { TutorProfileService } from './tutor-profile.service';
import { SupabaseService } from './supabase.service';

describe('TutorProfileService', () => {
  let service: TutorProfileService;
  let rpc: jest.Mock;

  beforeEach(() => {
    rpc = jest.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseService, useValue: { client: { rpc } } }],
    });
    service = TestBed.inject(TutorProfileService);
  });

  it('getMyTutorProfile() mapea la respuesta del RPC al modelo editable', async () => {
    rpc.mockResolvedValue({
      data: {
        teacher_id: 't1',
        about: 'Hola',
        price_min: 8000,
        price_max: 12000,
        contact_type: 'email',
        contact_value: 'tutor@udd.cl',
        status: 'active',
        subject_ids: ['s1', 's2'],
        weekly_availability: [{ weekday: 1, hour: '09:00' }],
      },
      error: null,
    });

    const profile = await firstValueFrom(service.getMyTutorProfile());

    expect(rpc).toHaveBeenCalledWith('get_my_tutor_profile');
    expect(profile).toEqual({
      about: 'Hola',
      priceMin: 8000,
      priceMax: 12000,
      contactType: 'email',
      contactValue: 'tutor@udd.cl',
      subjectIds: ['s1', 's2'],
      slots: [{ weekday: 1, hour: '09:00' }],
      status: 'active',
    });
  });

  it('getMyTutorProfile() devuelve null cuando el RPC no trae datos', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    const profile = await firstValueFrom(service.getMyTutorProfile());
    expect(profile).toBeNull();
  });

  it('saveTutorProfile() envía los parámetros con el prefijo p_ y devuelve el status', async () => {
    rpc.mockResolvedValue({ data: 'active', error: null });

    const status = await firstValueFrom(
      service.saveTutorProfile({
        about: 'Hola',
        priceMin: 8000,
        priceMax: 12000,
        contactType: 'email',
        contactValue: 'tutor@udd.cl',
        subjectIds: ['s1'],
        slots: [{ weekday: 1, hour: '09:00' }],
        status: 'incomplete',
      })
    );

    expect(rpc).toHaveBeenCalledWith('save_tutor_profile', {
      p_about: 'Hola',
      p_price_min: 8000,
      p_price_max: 12000,
      p_contact_type: 'email',
      p_contact_value: 'tutor@udd.cl',
      p_subject_ids: ['s1'],
      p_weekly: [{ weekday: 1, hour: '09:00' }],
    });
    expect(status).toBe('active');
  });

  it('propaga el error del RPC', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('boom') });
    await expect(firstValueFrom(service.getMyTutorProfile())).rejects.toThrow(
      'boom'
    );
  });
});
