import { TestBed } from '@angular/core/testing';

import { AuthService, SignUpData } from './auth.service';
import { SupabaseService } from './supabase.service';
import { RateLimitError } from '../utils/rate-limiter';

/** Mock mínimo de `supabase.auth` con las funciones que usa AuthService. */
function createAuthMock() {
  return {
    getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
    signInWithPassword: jest
      .fn()
      .mockResolvedValue({ data: { user: {}, session: {} }, error: null }),
    signUp: jest
      .fn()
      .mockResolvedValue({ data: { user: {}, session: {} }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  };
}

const SIGNUP_DATA: SignUpData = {
  email: 'estudiante@udd.cl',
  password: 'secret-password',
  fullName: 'Ada Lovelace',
  career: 'Ingeniería Civil',
  admissionYear: '2023',
  campusId: 'campus-stgo',
  facultyId: 'fac-ingenieria-stgo',
  careerId: 'career-stgo-ingenieria-ing-civil-industrial',
  wantsToTeach: true,
};

describe('AuthService', () => {
  let service: AuthService;
  let authMock: ReturnType<typeof createAuthMock>;
  let now: number;

  beforeEach(() => {
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    authMock = createAuthMock();
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { client: { auth: authMock } } },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('delega el login en signInWithPassword', async () => {
    await service.signIn('estudiante@udd.cl', 'pw');

    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: 'estudiante@udd.cl',
      password: 'pw',
    });
  });

  it('delega el registro en signUp con los metadatos del perfil', async () => {
    await service.signUp(SIGNUP_DATA);

    expect(authMock.signUp).toHaveBeenCalledWith({
      email: SIGNUP_DATA.email,
      password: SIGNUP_DATA.password,
      options: {
        data: {
          full_name: 'Ada Lovelace',
          career: 'Ingeniería Civil',
          admission_year: '2023',
          campus_id: 'campus-stgo',
          faculty_id: 'fac-ingenieria-stgo',
          career_id: 'career-stgo-ingenieria-ing-civil-industrial',
          wants_to_teach: 'true',
        },
      },
    });
  });

  it('envía wants_to_teach=false cuando el usuario no quiere enseñar', async () => {
    await service.signUp({ ...SIGNUP_DATA, wantsToTeach: false });

    const call = authMock.signUp.mock.calls[0][0];
    expect(call.options.data.wants_to_teach).toBe('false');
  });

  describe('rate limiting (1 intento / 10 s)', () => {
    it('bloquea un segundo login inmediato con RateLimitError', async () => {
      await service.signIn('estudiante@udd.cl', 'pw');

      expect(() => service.signIn('estudiante@udd.cl', 'pw')).toThrow(
        RateLimitError
      );
      expect(authMock.signInWithPassword).toHaveBeenCalledTimes(1);
    });

    it('un login fallido también consume el límite', async () => {
      authMock.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      await service.signIn('estudiante@udd.cl', 'wrong');

      // Aunque las credenciales eran inválidas, no se puede reintentar al instante.
      expect(() => service.signIn('estudiante@udd.cl', 'wrong')).toThrow(
        RateLimitError
      );
    });

    it('permite reintentar cuando pasan 10 s', async () => {
      await service.signIn('estudiante@udd.cl', 'pw');

      now += 10_000;
      await service.signIn('estudiante@udd.cl', 'pw');

      expect(authMock.signInWithPassword).toHaveBeenCalledTimes(2);
    });

    it('expone los ms restantes en el error', async () => {
      await service.signIn('estudiante@udd.cl', 'pw');
      now += 4_000;

      try {
        service.signIn('estudiante@udd.cl', 'pw');
        fail('debió lanzar RateLimitError');
      } catch (err) {
        expect(err).toBeInstanceOf(RateLimitError);
        expect((err as RateLimitError).retryAfterMs).toBe(6_000);
      }
    });

    it('login y registro tienen límites independientes', async () => {
      await service.signIn('estudiante@udd.cl', 'pw');

      // signUp no debe estar bloqueado por el signIn previo.
      await expect(service.signUp(SIGNUP_DATA)).resolves.toBeDefined();
      expect(authMock.signUp).toHaveBeenCalledTimes(1);
    });

    it('bloquea un segundo registro inmediato', async () => {
      await service.signUp(SIGNUP_DATA);

      expect(() => service.signUp(SIGNUP_DATA)).toThrow(RateLimitError);
      expect(authMock.signUp).toHaveBeenCalledTimes(1);
    });
  });

  it('isAuthenticated refleja el signal de usuario', () => {
    expect(service.isAuthenticated()).toBe(false);

    service.user.set({ id: 'abc' } as never);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('signOut delega en supabase', async () => {
    await service.signOut();
    expect(authMock.signOut).toHaveBeenCalled();
  });
});
