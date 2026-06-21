import { formatPrice, formatPriceRange, getInitials } from './format.util';

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
