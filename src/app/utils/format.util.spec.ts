import {
  formatDateTime,
  formatPrice,
  formatPriceRange,
  formatShortDate,
  getInitials,
} from './format.util';

describe('getInitials', () => {
  it('toma las dos primeras iniciales en mayúscula', () => {
    expect(getInitials('Sofía Contreras')).toBe('SC');
  });

  it('funciona con un solo nombre', () => {
    expect(getInitials('ada')).toBe('A');
  });

  it('se queda con dos iniciales aunque haya más palabras', () => {
    expect(getInitials('Juan Pablo Pérez González')).toBe('JP');
  });
});

describe('formatPrice / formatPriceRange', () => {
  it('formatea pesos chilenos con separador de miles', () => {
    expect(formatPrice(8000)).toBe('$8.000');
  });

  it('arma el rango min-max', () => {
    expect(formatPriceRange(8000, 12000)).toBe('$8.000-$12.000');
  });
});

describe('formatShortDate / formatDateTime', () => {
  it('formatea una fecha como dd/mm/yy', () => {
    expect(formatShortDate('2026-06-24')).toBe('24/06/26');
  });

  it('formatea fecha + hora a partir de un timestamp', () => {
    // Hora local: construimos una fecha sin zona para que sea estable.
    const result = formatDateTime('2026-06-24T15:30:00');
    expect(result).toMatch(/^24\/06\/26 \d{2}:\d{2}$/);
  });
});
