/** Shared, pure formatting helpers reused across teacher components. */

const ES_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Two-letter uppercase initials from a full name ("Sofía Contreras" → "SC"). */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Long localized date, e.g. "15 de mayo de 2026". */
export function formatLongDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Long localized date including weekday, e.g. "jueves, 15 de mayo de 2026". */
export function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Short weekday label ("Lun", "Mar", …). */
export function getDayName(dateString: string): string {
  return ES_DAYS[new Date(dateString).getDay()];
}

/** Day-of-month number. */
export function getDayNumber(dateString: string): number {
  return new Date(dateString).getDate();
}
