import { ContactType } from './teacher.model';
import { TeacherStatus } from './profile.model';

/** Un bloque de disponibilidad semanal: día (1=Lun..7=Dom, ISO) + hora. */
export interface WeeklySlot {
  weekday: number;
  hour: string;
}

/**
 * Datos editables del perfil tutor (lo que el dueño ve y guarda desde su
 * perfil). El contacto viaja completo porque se lee vía RPC SECURITY DEFINER.
 */
export interface TutorProfileEdit {
  about: string;
  priceMin: number | null;
  priceMax: number | null;
  contactType: ContactType | null;
  contactValue: string;
  subjectIds: string[];
  slots: WeeklySlot[];
  status: TeacherStatus;
}
