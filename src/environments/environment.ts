export const environment = {
  production: false,

  /**
   * (Legacy) Base URL of a REST backend. Ya no se usa: los datos vienen de Supabase.
   * Se deja por compatibilidad; puede eliminarse más adelante.
   */
  apiUrl: '',

  /**
   * Si no hay `apiUrl`, los servicios REST (reservas, catálogo académico) caen
   * a datos mock en TypeScript en lugar de fallar.
   */
  useMocks: true,

  /** Conexión a Supabase (proyecto Mentorly UDD). */
  supabase: {
    url: 'https://jrhzzawcjvsxxfnikkkv.supabase.co',
    /** Clave pública (publishable). NUNCA poner aquí la service_role key. */
    publishableKey: 'sb_publishable_W_MjmjbcNSDpsQqV3HILPQ_D3GlSMYC',
  },

  /** Flags de métodos de autenticación. */
  auth: {
    /** Login con correo y contraseña. */
    emailPassword: true,
    /** Acceso institucional UDD (OAuth). Desactivado por ahora. */
    uddSso: false,
  },
};
