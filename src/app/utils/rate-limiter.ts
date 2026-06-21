/**
 * Limitador de frecuencia simple del lado del cliente.
 *
 * Permite, como máximo, **un intento por clave cada `intervalMs`**. Cada intento
 * (exitoso o fallido) cuenta: así se desincentiva el envío repetido de
 * formularios y los ataques de fuerza bruta básicos.
 *
 * IMPORTANTE: esto vive en el navegador y es solo una primera barrera de UX.
 * No reemplaza el rate limiting del backend (Supabase Auth ya aplica el suyo).
 * Un atacante puede saltarse esta capa; el control real debe estar en el server.
 */
export class RateLimiter {
  private readonly lastAttempt = new Map<string, number>();

  /**
   * @param intervalMs Tiempo mínimo que debe pasar entre intentos (en ms).
   * @param now Fuente de tiempo, inyectable para tests. Por defecto `Date.now`.
   */
  constructor(
    private readonly intervalMs: number,
    private readonly now: () => number = () => Date.now()
  ) {}

  /**
   * Milisegundos que faltan para poder reintentar con esa clave.
   * Devuelve `0` si ya se permite un nuevo intento.
   */
  retryAfter(key = 'default'): number {
    const last = this.lastAttempt.get(key);
    if (last === undefined) {
      return 0;
    }

    const elapsed = this.now() - last;
    return elapsed >= this.intervalMs ? 0 : this.intervalMs - elapsed;
  }

  /** ¿Se permite un intento con esta clave ahora mismo? */
  isAllowed(key = 'default'): boolean {
    return this.retryAfter(key) === 0;
  }

  /**
   * Registra un intento ahora. Devuelve `true` si se permitió (y quedó
   * registrado) o `false` si todavía está bloqueado (no se registra nada nuevo).
   */
  tryAcquire(key = 'default'): boolean {
    if (!this.isAllowed(key)) {
      return false;
    }

    this.lastAttempt.set(key, this.now());
    return true;
  }

  /** Olvida el último intento de una clave (o de todas si no se pasa clave). */
  reset(key?: string): void {
    if (key === undefined) {
      this.lastAttempt.clear();
    } else {
      this.lastAttempt.delete(key);
    }
  }
}

/** Error lanzado cuando se supera el límite de intentos. */
export class RateLimitError extends Error {
  /** Milisegundos que faltan para poder reintentar. */
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    const seconds = Math.ceil(retryAfterMs / 1000);
    super(`Demasiados intentos. Espera ${seconds} segundo${seconds === 1 ? '' : 's'} e intenta de nuevo.`);
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
    // Mantiene la cadena de prototipos al transpilar a ES5/ES2015.
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}