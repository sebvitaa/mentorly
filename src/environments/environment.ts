export const environment = {
  production: false,

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
