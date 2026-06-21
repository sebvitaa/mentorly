import { RateLimitError, RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  let clock: number;
  const now = () => clock;

  beforeEach(() => {
    clock = 1_000_000; // valor base arbitrario
  });

  it('permite el primer intento de una clave', () => {
    const limiter = new RateLimiter(10_000, now);

    expect(limiter.isAllowed('login')).toBe(true);
    expect(limiter.retryAfter('login')).toBe(0);
    expect(limiter.tryAcquire('login')).toBe(true);
  });

  it('bloquea un segundo intento dentro del intervalo', () => {
    const limiter = new RateLimiter(10_000, now);

    expect(limiter.tryAcquire('login')).toBe(true);

    clock += 3_000; // solo pasaron 3 s
    expect(limiter.isAllowed('login')).toBe(false);
    expect(limiter.retryAfter('login')).toBe(7_000);
    expect(limiter.tryAcquire('login')).toBe(false);
  });

  it('vuelve a permitir cuando pasa exactamente el intervalo', () => {
    const limiter = new RateLimiter(10_000, now);
    limiter.tryAcquire('login');

    clock += 10_000;
    expect(limiter.isAllowed('login')).toBe(true);
    expect(limiter.tryAcquire('login')).toBe(true);
  });

  it('lleva un conteo independiente por clave', () => {
    const limiter = new RateLimiter(10_000, now);

    expect(limiter.tryAcquire('login')).toBe(true);
    // 'signup' no se ve afectado por el intento de 'login'.
    expect(limiter.tryAcquire('signup')).toBe(true);
    expect(limiter.isAllowed('login')).toBe(false);
  });

  it('no avanza el tiempo de espera con intentos bloqueados', () => {
    const limiter = new RateLimiter(10_000, now);
    limiter.tryAcquire('login');

    clock += 5_000;
    limiter.tryAcquire('login'); // bloqueado, no debe re-registrar
    clock += 5_000; // total 10 s desde el primer intento permitido

    expect(limiter.isAllowed('login')).toBe(true);
  });

  it('reset() limpia una clave concreta', () => {
    const limiter = new RateLimiter(10_000, now);
    limiter.tryAcquire('login');

    limiter.reset('login');
    expect(limiter.isAllowed('login')).toBe(true);
  });
});

describe('RateLimitError', () => {
  it('expone retryAfterMs y un mensaje en segundos', () => {
    const error = new RateLimitError(7_000);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.retryAfterMs).toBe(7_000);
    expect(error.message).toContain('7 segundos');
  });

  it('usa singular para 1 segundo y redondea hacia arriba', () => {
    expect(new RateLimitError(1_000).message).toContain('1 segundo e');
    expect(new RateLimitError(6_001).message).toContain('7 segundos');
  });
});
