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
  return toLocalDate(dateString).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Long localized date including weekday, e.g. "jueves, 15 de mayo de 2026". */
export function formatFullDate(dateString: string): string {
  return toLocalDate(dateString).toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const pad2 = (value: number): string => String(value).padStart(2, '0');

/**
 * Convierte un string a `Date` en hora local. Para fechas "solo día"
 * (`YYYY-MM-DD`) evita el desfase de un día que produce `new Date()` al
 * interpretarlas como UTC (relevante en husos negativos como Chile).
 */
function toLocalDate(dateString: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3])
    );
  }
  return new Date(dateString);
}

/** Fecha corta numérica, ej. "2026-06-24" → "24/06/26". */
export function formatShortDate(dateString: string): string {
  const date = toLocalDate(dateString);
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${pad2(
    date.getFullYear() % 100
  )}`;
}

/** Fecha + hora de un timestamp, ej. "24/06/26 15:30" (para "enviada el"). */
export function formatDateTime(dateString: string): string {
  const date = toLocalDate(dateString);
  return `${formatShortDate(dateString)} ${pad2(date.getHours())}:${pad2(
    date.getMinutes()
  )}`;
}

/** Short weekday label ("Lun", "Mar", …). */
export function getDayName(dateString: string): string {
  return ES_DAYS[toLocalDate(dateString).getDay()];
}

/** Day-of-month number. */
export function getDayNumber(dateString: string): number {
  return toLocalDate(dateString).getDate();
}

/** Pesos chilenos con separador de miles, ej. 8000 → "$8.000". */
export function formatPrice(value: number): string {
  return '$' + value.toLocaleString('es-CL');
}

/** Rango de precio a partir de min/max, ej. "$8.000-$12.000". */
export function formatPriceRange(min: number, max: number): string {
  return `${formatPrice(min)}-${formatPrice(max)}`;
}
