import { TeacherStatus } from './profile.model';

/** Un bloque de disponibilidad semanal: día (1=Lun..7=Dom, ISO) + hora. */
export interface WeeklySlot {
  weekday: number;
  hour: string;
}

/**
 * Datos editables del perfil tutor (lo que el dueño ve y guarda desde su
 * perfil). El contacto es dual (correo y/o teléfono, no excluyente) y viaja
 * completo porque se lee vía RPC SECURITY DEFINER.
 */
export interface TutorProfileEdit {
  about: string;
  priceMin: number | null;
  priceMax: number | null;
  contactEmail: string;
  contactPhone: string;
  /** Si el contacto se muestra siempre (sin esperar a confirmar una reserva). */
  showContact: boolean;
  subjectIds: string[];
  slots: WeeklySlot[];
  status: TeacherStatus;
}
