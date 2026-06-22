/** Ramo del catálogo (Cálculo I, Programación, …). */
export interface Subject {
  id: string;
  name: string;
  /** Detalle opcional (p. ej. carrera/contexto) ingresado al crear el ramo. */
  detail?: string | null;
}
